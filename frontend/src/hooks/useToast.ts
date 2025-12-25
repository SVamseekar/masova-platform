import { useSnackbar, VariantType, SnackbarKey, OptionsObject } from 'notistack';
import { useCallback, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { addNotification } from '../store/slices/notificationSlice';

interface ToastOptions {
  persist?: boolean;
  autoHideDuration?: number;
  preventDuplicate?: boolean;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  action?: React.ReactNode;
}

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface UseToastReturn {
  success: (message: string, options?: ToastOptions) => SnackbarKey;
  error: (message: string, options?: ToastOptions) => SnackbarKey;
  warning: (message: string, options?: ToastOptions) => SnackbarKey;
  info: (message: string, options?: ToastOptions) => SnackbarKey;
  toast: (message: string, variant?: ToastVariant, options?: ToastOptions) => SnackbarKey;
  dismiss: (key?: SnackbarKey) => void;
  dismissAll: () => void;
  orderConfirmed: (orderNumber: string) => SnackbarKey;
  orderReady: (orderNumber: string) => SnackbarKey;
  paymentSuccess: (amount: number) => SnackbarKey;
  paymentFailed: (reason?: string) => SnackbarKey;
  itemAdded: (itemName: string) => SnackbarKey;
  itemRemoved: (itemName: string) => SnackbarKey;
  driverAssigned: (driverName: string) => SnackbarKey;
  deliveryUpdate: (status: string) => SnackbarKey;
  connectionStatus: (connected: boolean) => SnackbarKey;
}

/**
 * Custom hook for toast notifications using notistack.
 * Provides pre-built notification methods for common application events.
 * Also integrates with Redux notification store for persistent notifications.
 */
export const useToast = (): UseToastReturn => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const recentMessages = useRef<Set<string>>(new Set());

  // Cleanup old messages from duplicate tracking after 5 seconds
  const trackMessage = useCallback((message: string) => {
    recentMessages.current.add(message);
    setTimeout(() => {
      recentMessages.current.delete(message);
    }, 5000);
  }, []);

  const showToast = useCallback((
    message: string,
    variant: VariantType = 'default',
    options?: ToastOptions
  ): SnackbarKey => {
    // Prevent duplicate messages by default
    if (options?.preventDuplicate !== false && recentMessages.current.has(message)) {
      return '';
    }
    trackMessage(message);

    const snackbarOptions: OptionsObject = {
      variant,
      autoHideDuration: options?.autoHideDuration ?? (variant === 'error' ? 6000 : 3000),
      persist: options?.persist,
      anchorOrigin: options?.anchorOrigin ?? { vertical: 'bottom', horizontal: 'right' },
      action: options?.action,
    };

    return enqueueSnackbar(message, snackbarOptions);
  }, [enqueueSnackbar, trackMessage]);

  // Also add to Redux store for persistent notification history
  const addToStore = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info',
    title?: string
  ) => {
    dispatch(addNotification({
      type,
      message,
      title,
      autoHide: true,
    }));
  }, [dispatch]);

  const success = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    // Errors stay longer by default
    return showToast(message, 'error', { autoHideDuration: 6000, ...options });
  }, [showToast]);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const toast = useCallback((message: string, variant?: ToastVariant, options?: ToastOptions) => {
    return showToast(message, variant ?? 'default', options);
  }, [showToast]);

  const dismiss = useCallback((key?: SnackbarKey) => {
    closeSnackbar(key);
  }, [closeSnackbar]);

  const dismissAll = useCallback(() => {
    closeSnackbar();
  }, [closeSnackbar]);

  // Pre-built notification methods for common application events
  const orderConfirmed = useCallback((orderNumber: string) => {
    addToStore(`Order #${orderNumber} confirmed!`, 'success', 'Order Confirmed');
    return showToast(`Order #${orderNumber} confirmed!`, 'success');
  }, [showToast, addToStore]);

  const orderReady = useCallback((orderNumber: string) => {
    addToStore(`Order #${orderNumber} is ready for pickup!`, 'info', 'Order Ready');
    return showToast(`Order #${orderNumber} is ready for pickup!`, 'info', {
      autoHideDuration: 5000,
    });
  }, [showToast, addToStore]);

  const paymentSuccess = useCallback((amount: number) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
    addToStore(`Payment of ${formattedAmount} successful`, 'success', 'Payment Success');
    return showToast(`Payment of ${formattedAmount} successful`, 'success');
  }, [showToast, addToStore]);

  const paymentFailed = useCallback((reason?: string) => {
    const message = reason ? `Payment failed: ${reason}` : 'Payment failed. Please try again.';
    addToStore(message, 'error', 'Payment Failed');
    return showToast(message, 'error', { autoHideDuration: 8000 });
  }, [showToast, addToStore]);

  const itemAdded = useCallback((itemName: string) => {
    return showToast(`${itemName} added to cart`, 'success', { autoHideDuration: 2000 });
  }, [showToast]);

  const itemRemoved = useCallback((itemName: string) => {
    return showToast(`${itemName} removed from cart`, 'info', { autoHideDuration: 2000 });
  }, [showToast]);

  const driverAssigned = useCallback((driverName: string) => {
    addToStore(`${driverName} is on the way!`, 'info', 'Driver Assigned');
    return showToast(`${driverName} is on the way!`, 'info', { autoHideDuration: 5000 });
  }, [showToast, addToStore]);

  const deliveryUpdate = useCallback((status: string) => {
    const statusMessages: Record<string, { message: string; variant: VariantType }> = {
      DISPATCHED: { message: 'Your order is on the way!', variant: 'info' },
      ARRIVED: { message: 'Driver has arrived at your location!', variant: 'info' },
      DELIVERED: { message: 'Order delivered! Enjoy your meal!', variant: 'success' },
    };
    const { message, variant } = statusMessages[status] ?? {
      message: `Delivery status: ${status}`,
      variant: 'info' as VariantType,
    };
    return showToast(message, variant);
  }, [showToast]);

  const connectionStatus = useCallback((connected: boolean) => {
    if (connected) {
      return showToast('Connected to live updates', 'success', { autoHideDuration: 2000 });
    } else {
      return showToast('Connection lost. Reconnecting...', 'warning', { persist: true });
    }
  }, [showToast]);

  return {
    success,
    error,
    warning,
    info,
    toast,
    dismiss,
    dismissAll,
    orderConfirmed,
    orderReady,
    paymentSuccess,
    paymentFailed,
    itemAdded,
    itemRemoved,
    driverAssigned,
    deliveryUpdate,
    connectionStatus,
  };
};

export default useToast;
