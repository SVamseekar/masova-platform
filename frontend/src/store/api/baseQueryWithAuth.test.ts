import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { server } from '../../test/mocks/server';
import baseQueryWithAuth from './baseQueryWithAuth';
import { redirectToSignIn } from '../../utils/security';

vi.mock('../../utils/security', async importOriginal => ({
  ...await importOriginal<typeof import('../../utils/security')>(), redirectToSignIn: vi.fn(),
}));
vi.mock('../../config/api.config', () => ({ default: { BASE_URL: 'http://localhost:8080/api' } }));

function requestApi(accessToken: string | null = null, refreshToken: string | null = null) {
  const state = { auth: { accessToken, refreshToken, user: null } };
  const dispatch = vi.fn(action => {
    if (action.type === 'auth/refreshTokenSuccess') state.auth.accessToken = action.payload;
    return action;
  });
  const controller = new AbortController();
  return { dispatch, getState: () => state, signal: controller.signal, abort: controller.abort,
    extra: undefined, endpoint: 'test', type: 'query' } as BaseQueryApi;
}

describe('Auth recovery boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps an invalid public login inline without refreshing or redirecting', async () => {
    let refreshes = 0;
    server.use(http.post('*/auth/login', () => HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })),
      http.post('*/auth/refresh', () => { refreshes++; return HttpResponse.json({}, { status: 401 }); }));
    const api = requestApi('old-account-token', 'old-account-refresh');
    const result = await baseQueryWithAuth({ url: '/auth/login', method: 'POST', body: {} }, api, {});
    expect(result.error?.status).toBe(401);
    expect(refreshes).toBe(0);
    expect(api.dispatch).not.toHaveBeenCalled();
    expect(redirectToSignIn).not.toHaveBeenCalled();
  });

  it('does not retry a wrong POS PIN or consume another attempt through auth recovery', async () => {
    let attempts = 0;
    server.use(http.post('*/auth/validate-pin', () => { attempts++; return HttpResponse.json({ error: 'Invalid PIN' }, { status: 401 }); }));
    const api = requestApi();
    const result = await baseQueryWithAuth({ url: '/auth/validate-pin', method: 'POST', body: { pin: '00000' } }, api, {});
    expect(result.error?.status).toBe(401);
    expect(attempts).toBe(1);
    expect(api.dispatch).not.toHaveBeenCalled();
    expect(redirectToSignIn).not.toHaveBeenCalled();
  });

  it.each([200, 401])('discards late refresh response %s after account switch', async status => {
    let finish!: () => void;
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    server.use(http.get('*/users/profile', () => HttpResponse.json({}, { status: 401 })),
      http.post('*/auth/refresh', async () => {
        started();
        await new Promise<void>(resolve => { finish = resolve; });
        return HttpResponse.json({ accessToken: 'account-A-refreshed' }, { status });
      }));
    const api = requestApi('account-A', 'refresh-A');
    const pending = baseQueryWithAuth('/users/profile', api, {});
    await ready;
    const state = api.getState() as { auth: { accessToken: string; refreshToken: string } };
    state.auth.accessToken = 'account-B';
    state.auth.refreshToken = 'refresh-B';
    finish();
    await pending;
    expect(state.auth.accessToken).toBe('account-B');
    expect(api.dispatch).not.toHaveBeenCalled();
    expect(redirectToSignIn).not.toHaveBeenCalled();
  });

  it('recovers an expired protected session without clearing unrelated preferences', async () => {
    server.use(http.get('*/users/profile', () => HttpResponse.json({}, { status: 401 })),
      http.post('*/auth/refresh', () => HttpResponse.json({}, { status: 401 })));
    const api = requestApi('expired-token', 'expired-refresh');
    await baseQueryWithAuth('/users/profile', api, {});
    expect(api.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/logout' }));
    expect(localStorage.clear).not.toHaveBeenCalled();
    expect(sessionStorage.clear).not.toHaveBeenCalled();
    expect(redirectToSignIn).toHaveBeenCalledTimes(1);
  });

  it('retries the protected query with the authoritative refreshed token', async () => {
    const headers: (string | null)[] = [];
    server.use(http.get('*/users/profile', ({ request }) => {
      headers.push(request.headers.get('Authorization'));
      return headers.length === 1 ? HttpResponse.json({}, { status: 401 }) : HttpResponse.json({ id: 'staff-test' });
    }), http.post('*/auth/refresh', () => HttpResponse.json({ accessToken: 'refreshed-test-token' })));
    const result = await baseQueryWithAuth('/users/profile', requestApi('expired-token', 'refresh-token'), {});
    expect(result.data).toEqual({ id: 'staff-test' });
    expect(headers).toEqual(['Bearer expired-token', 'Bearer refreshed-test-token']);
    expect(redirectToSignIn).not.toHaveBeenCalled();
  });
});
