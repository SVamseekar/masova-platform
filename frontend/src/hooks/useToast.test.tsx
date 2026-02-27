import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const mockEnqueueSnackbar = vi.fn().mockReturnValue('snackbar-key');
const mockCloseSnackbar = vi.fn();
const mockDispatch = vi.fn();

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
    closeSnackbar: mockCloseSnackbar,
  }),
}));

vi.mock('../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock('../store/slices/notificationSlice', () => ({
  addNotification: (payload: any) => ({ type: 'notifications/addNotification', payload }),
}));

import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    mockEnqueueSnackbar.mockClear();
    mockCloseSnackbar.mockClear();
    mockDispatch.mockClear();
  });

  it('shows a success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Item saved');
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Item saved', expect.objectContaining({
      variant: 'success',
    }));
  });

  it('shows an error toast with longer duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error('Something failed');
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Something failed', expect.objectContaining({
      variant: 'error',
      autoHideDuration: 6000,
    }));
  });

  it('shows a warning toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.warning('Caution needed');
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Caution needed', expect.objectContaining({
      variant: 'warning',
    }));
  });

  it('shows an info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info('Just so you know');
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Just so you know', expect.objectContaining({
      variant: 'info',
    }));
  });

  it('shows a generic toast with specified variant', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast('Generic message', 'success');
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Generic message', expect.objectContaining({
      variant: 'success',
    }));
  });

  it('uses default variant when none specified', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast('Default message');
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Default message', expect.objectContaining({
      variant: 'default',
    }));
  });

  it('dismisses a specific snackbar', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.dismiss('key-1');
    });

    expect(mockCloseSnackbar).toHaveBeenCalledWith('key-1');
  });

  it('dismisses all snackbars', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.dismissAll();
    });

    expect(mockCloseSnackbar).toHaveBeenCalledWith();
  });

  describe('application-specific toasts', () => {
    it('orderConfirmed dispatches to redux and shows toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.orderConfirmed('ORD-123');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Order #ORD-123 confirmed!',
        expect.objectContaining({ variant: 'success' })
      );
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('orderReady dispatches and shows toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.orderReady('ORD-456');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Order #ORD-456 is ready for pickup!',
        expect.objectContaining({ variant: 'info' })
      );
    });

    it('paymentSuccess shows formatted amount', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.paymentSuccess(500);
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('500'),
        expect.objectContaining({ variant: 'success' })
      );
    });

    it('paymentFailed shows reason when provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.paymentFailed('Insufficient funds');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Payment failed: Insufficient funds',
        expect.objectContaining({ variant: 'error' })
      );
    });

    it('paymentFailed shows default message when no reason', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.paymentFailed();
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Payment failed. Please try again.',
        expect.objectContaining({ variant: 'error' })
      );
    });

    it('itemAdded shows item name', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.itemAdded('Margherita Pizza');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Margherita Pizza added to cart',
        expect.objectContaining({ variant: 'success' })
      );
    });

    it('itemRemoved shows item name', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.itemRemoved('Margherita Pizza');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Margherita Pizza removed from cart',
        expect.objectContaining({ variant: 'info' })
      );
    });

    it('driverAssigned shows driver name', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.driverAssigned('John');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'John is on the way!',
        expect.objectContaining({ variant: 'info' })
      );
    });

    it('deliveryUpdate shows appropriate message for known statuses', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.deliveryUpdate('DELIVERED');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Order delivered! Enjoy your meal!',
        expect.objectContaining({ variant: 'success' })
      );
    });

    it('deliveryUpdate shows generic message for unknown status', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.deliveryUpdate('CUSTOM_STATUS');
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Delivery status: CUSTOM_STATUS',
        expect.objectContaining({ variant: 'info' })
      );
    });

    it('connectionStatus shows connected message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.connectionStatus(true);
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Connected to live updates',
        expect.objectContaining({ variant: 'success' })
      );
    });

    it('connectionStatus shows disconnected message with persistence', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.connectionStatus(false);
      });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Connection lost. Reconnecting...',
        expect.objectContaining({ variant: 'warning', persist: true })
      );
    });
  });

  describe('duplicate prevention', () => {
    it('prevents duplicate messages within 5 seconds', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Same message');
      });

      act(() => {
        result.current.success('Same message');
      });

      // First call succeeds, second is suppressed
      expect(mockEnqueueSnackbar).toHaveBeenCalledTimes(1);
    });
  });
});
