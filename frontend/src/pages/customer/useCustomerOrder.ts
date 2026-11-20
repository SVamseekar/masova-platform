import { useState } from 'react';
import { useGetOrderQuery, useTrackOrderQuery } from '../../store/api/orderApi';
import { useAppSelector } from '../../store/hooks';

/** Order number as customers read it: the store's ORD prefix is dropped after the hash sign. */
export const displayOrderNumber = (orderNumber: string) => orderNumber.replace(/^ORD[-_]?/i, '');

export const TERMINAL_STATUSES = ['DELIVERED', 'COMPLETED', 'SERVED', 'CANCELLED'];

const errorStatus = (error: unknown) => (error as { status?: number | string } | undefined)?.status;

/**
 * Order for the current visitor. Signed-in customers get the full order with amounts and payment
 * state; guests, and customers the full order is denied to, get the public tracking view, which
 * carries status, order type and item names only. The public view is what anyone holding the
 * order link sees, so pages must not add owner-only details or actions to it. Polling stops when the order reaches a final state.
 */
export function useCustomerOrder(orderId: string | undefined, pollingInterval = 10000) {
  const signedIn = useAppSelector(state => state.auth.isAuthenticated);
  const id = orderId || '';
  // Remembered per order, so a denied request is not repeated and a finished order is not polled.
  const [seen, setSeen] = useState({ id, denied: false, final: false });
  const current = seen.id === id ? seen : { id, denied: false, final: false };
  const interval = current.final ? 0 : pollingInterval;

  const full = useGetOrderQuery(id, { skip: !orderId || !signedIn || current.denied, pollingInterval: interval });
  const denied = current.denied || (full.isError && [401, 403].includes(Number(errorStatus(full.error))));
  const limited = !!orderId && (!signedIn || denied);
  const tracked = useTrackOrderQuery(id, { skip: !limited, pollingInterval: interval });
  const query = limited ? tracked : full;
  const final = TERMINAL_STATUSES.includes(query.data?.status ?? '');
  if (seen.id !== id || seen.denied !== denied || seen.final !== final) setSeen({ id, denied, final });

  return { order: query.data, isLoading: query.isLoading, isError: query.isError, notFound: query.isError && errorStatus(query.error) === 404, refetch: query.refetch, limited };
}
