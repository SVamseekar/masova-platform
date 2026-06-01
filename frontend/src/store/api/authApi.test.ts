import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetProfileQuery,
} from './authApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('authApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(authApi.reducerPath).toBe('authApi');
    });

    it('should define all expected endpoints', () => {
      const endpoints = authApi.endpoints;
      expect(endpoints.login).toBeDefined();
      expect(endpoints.register).toBeDefined();
      expect(endpoints.refreshToken).toBeDefined();
      expect(endpoints.logout).toBeDefined();
      expect(endpoints.getProfile).toBeDefined();
    });

    it('should have correct tag types', () => {
      expect(authApi.reducerPath).toBe('authApi');
    });
  });

  describe('login mutation', () => {
    it('should successfully login a user', async () => {
      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [login] = result.current;
      login({ email: 'test@example.com', password: 'password123' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      const data = result.current[1].data;
      expect(data).toBeDefined();
      expect(data?.accessToken).toBe('mock-access-token');
      expect(data?.user.email).toBe('test@example.com');
    });

    it('should include rememberMe in transformed response', async () => {
      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [login] = result.current;
      login({ email: 'test@example.com', password: 'password123', rememberMe: false });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data?.rememberMe).toBe(false);
    });

    it('should default rememberMe to true when not provided', async () => {
      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [login] = result.current;
      login({ email: 'test@example.com', password: 'password123' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data?.rememberMe).toBe(true);
    });

    it('should handle login failure', async () => {
      server.use(
        http.post(`${API}/users/login`, () =>
          HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
        ),
      );

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [login] = result.current;
      login({ email: 'wrong@example.com', password: 'wrong' });

      await waitFor(() => expect(result.current[1].isError).toBe(true));

      expect(result.current[1].error).toBeDefined();
    });
  });

  describe('register mutation', () => {
    it('should successfully register a user', async () => {
      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [register] = result.current;
      register({
        type: 'CUSTOMER',
        name: 'New User',
        email: 'newuser@example.com',
        phone: '555-0999',
        password: 'password123',
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      const data = result.current[1].data;
      expect(data).toBeDefined();
      expect(data?.accessToken).toBe('mock-access-token');
      expect(data?.user.name).toBe('New User');
    });

    it('should handle registration failure', async () => {
      server.use(
        http.post(`${API}/users/register`, () =>
          HttpResponse.json({ message: 'Email already exists' }, { status: 409 }),
        ),
      );

      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [register] = result.current;
      register({
        type: 'CUSTOMER',
        name: 'New User',
        email: 'existing@example.com',
        phone: '555-0999',
        password: 'password123',
      });

      await waitFor(() => expect(result.current[1].isError).toBe(true));
    });
  });

  describe('refreshToken mutation', () => {
    it('should successfully refresh token', async () => {
      const { result } = renderHook(() => useRefreshTokenMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [refreshToken] = result.current;
      refreshToken({ refreshToken: 'mock-refresh-token' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      const data = result.current[1].data;
      expect(data?.accessToken).toBe('mock-refreshed-access-token');
    });
  });

  describe('logout mutation', () => {
    it('should successfully logout', async () => {
      const { result } = renderHook(() => useLogoutMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [logout] = result.current;
      logout();

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('getProfile query', () => {
    it('should fetch user profile', async () => {
      const { result } = renderHook(() => useGetProfileQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.name).toBe('Test User');
      expect(result.current.data?.email).toBe('test@example.com');
    });

    it('should handle profile fetch error', async () => {
      server.use(
        http.get(`${API}/users/profile`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 403 }),
        ),
      );

      const { result } = renderHook(() => useGetProfileQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
