import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { displayOrderNumber, useCustomerOrder } from './useCustomerOrder';

const mocks = vi.hoisted(() => ({ full: vi.fn(), tracked: vi.fn(), signedIn: true }));
vi.mock('../../store/api/orderApi', () => ({
  useGetOrderQuery: (...args: unknown[]) => mocks.full(...args),
  useTrackOrderQuery: (...args: unknown[]) => mocks.tracked(...args),
}));
vi.mock('../../store/hooks', () => ({ useAppSelector: () => mocks.signedIn }));

const idle = { data: undefined, isLoading: false, isError: false, refetch: vi.fn() };
const lastOptions = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls[mock.mock.calls.length - 1][1];

describe('useCustomerOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signedIn = true;
    mocks.full.mockReturnValue(idle);
    mocks.tracked.mockReturnValue(idle);
  });

  it('gives a signed-in customer the full order and polls it', () => {
    mocks.full.mockReturnValue({ ...idle, data: { status: 'PREPARING' } });
    const { result } = renderHook(() => useCustomerOrder('o1'));
    expect(result.current.limited).toBe(false);
    expect(result.current.order).toEqual({ status: 'PREPARING' });
    expect(lastOptions(mocks.full)).toEqual({ skip: false, pollingInterval: 10000 });
    expect(lastOptions(mocks.tracked).skip).toBe(true);
  });

  it('gives a guest the public view only', () => {
    mocks.signedIn = false;
    mocks.tracked.mockReturnValue({ ...idle, data: { status: 'READY' } });
    const { result } = renderHook(() => useCustomerOrder('o1'));
    expect(result.current.limited).toBe(true);
    expect(lastOptions(mocks.full).skip).toBe(true);
    expect(lastOptions(mocks.tracked)).toEqual({ skip: false, pollingInterval: 10000 });
  });

  it('falls back to the public view when the full order is denied and stops asking for it', () => {
    mocks.full.mockReturnValue({ ...idle, isError: true, error: { status: 403 } });
    mocks.tracked.mockReturnValue({ ...idle, data: { status: 'READY' } });
    const { result } = renderHook(() => useCustomerOrder('o1'));
    expect(result.current.limited).toBe(true);
    expect(result.current.order).toEqual({ status: 'READY' });
    expect(lastOptions(mocks.full).skip).toBe(true);
  });

  it('does not fall back on other failures, and marks a missing order', () => {
    mocks.full.mockReturnValue({ ...idle, isError: true, error: { status: 500 } });
    const failed = renderHook(() => useCustomerOrder('o1'));
    expect(failed.result.current).toMatchObject({ limited: false, isError: true, notFound: false });
    expect(lastOptions(mocks.tracked).skip).toBe(true);
    mocks.full.mockReturnValue({ ...idle, isError: true, error: { status: 404 } });
    expect(renderHook(() => useCustomerOrder('o2')).result.current.notFound).toBe(true);
  });

  it('stops polling when the order reaches a final state', () => {
    mocks.full.mockReturnValue({ ...idle, data: { status: 'DELIVERED' } });
    renderHook(() => useCustomerOrder('o1'));
    expect(lastOptions(mocks.full).pollingInterval).toBe(0);
  });

  it('drops the store prefix from the order number', () => {
    expect(displayOrderNumber('ORD-2041')).toBe('2041');
    expect(displayOrderNumber('2041')).toBe('2041');
  });
});
