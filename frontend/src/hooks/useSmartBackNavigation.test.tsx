import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useSmartBackNavigation } from './useSmartBackNavigation';

function createWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    );
  };
}

describe('useSmartBackNavigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('does nothing when on /manager dashboard', () => {
    const { result } = renderHook(() => useSmartBackNavigation(), {
      wrapper: createWrapper(['/manager']),
    });

    act(() => {
      result.current.handleBack();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing when on /manager/ dashboard with trailing slash', () => {
    const { result } = renderHook(() => useSmartBackNavigation(), {
      wrapper: createWrapper(['/manager/']),
    });

    act(() => {
      result.current.handleBack();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /manager from a sub-page', () => {
    const { result } = renderHook(() => useSmartBackNavigation(), {
      wrapper: createWrapper(['/manager/orders']),
    });

    act(() => {
      result.current.handleBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/manager');
  });

  it('navigates to /manager from deeply nested sub-page', () => {
    const { result } = renderHook(() => useSmartBackNavigation(), {
      wrapper: createWrapper(['/manager/staff/schedule']),
    });

    act(() => {
      result.current.handleBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/manager');
  });

  it('navigates to /manager from non-manager pages as fallback', () => {
    const { result } = renderHook(() => useSmartBackNavigation(), {
      wrapper: createWrapper(['/some-other-page']),
    });

    act(() => {
      result.current.handleBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/manager');
  });
});
