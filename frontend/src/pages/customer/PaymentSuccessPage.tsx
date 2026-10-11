import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CircleAlert, CircleCheck, Clock } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { useVerifyPaymentMutation } from '../../store/api/paymentApi';
import { useGetOrderQuery, useTrackOrderQuery, type Order } from '../../store/api/orderApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCart, selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import '../checkout/components/Checkout.css';

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Received', PREPARING: 'Preparing', OVEN: 'In oven', BAKED: 'Ready', READY: 'Ready',
  DISPATCHED: 'Awaiting pickup', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered',
  SERVED: 'Served', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

/**
 * Payment result. Supports Stripe (order_id + redirect_status query) and
 * legacy Razorpay verify params when present. "Successful" is only shown once
 * the store reports the order as paid.
 */
const PaymentSuccessPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const locale = useAppSelector(selectCartLocale);
  const [searchParams] = useSearchParams();
  const [verifyPayment, { isLoading: isVerifying, isError: verifyFailed, isSuccess: verified }] = useVerifyPaymentMutation();
  const [timedOut, setTimedOut] = useState(false);

  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  const razorpayOrderId = searchParams.get('razorpay_order_id');
  const razorpaySignature = searchParams.get('razorpay_signature');
  const orderId = searchParams.get('order_id');
  const redirectStatus = searchParams.get('redirect_status');

  // Signed-in customers get the full order with amounts and payment state. The public tracking
  // view carries neither, so it is only used when the full order is not available to this visitor.
  const signedIn = useAppSelector(state => state.auth.isAuthenticated);
  const fullOrderQuery = useGetOrderQuery(orderId || '', { skip: !orderId || !signedIn });
  const fullOrderDenied = fullOrderQuery.isError && [401, 403].includes((fullOrderQuery.error as { status?: number })?.status ?? 0);
  const limitedView = !!orderId && (!signedIn || fullOrderDenied);
  const trackQuery = useTrackOrderQuery(orderId || '', { skip: !limitedView });
  const orderQuery = limitedView ? trackQuery : fullOrderQuery;
  const order = orderQuery.data;
  const paid = order?.paymentStatus === 'PAID' || verified;
  const providerDeclined = (!!redirectStatus && redirectStatus !== 'succeeded' && redirectStatus !== 'processing') || order?.paymentStatus === 'FAILED';
  const failed = verifyFailed || providerDeclined;
  const waiting = !!orderId && !limitedView && !paid && !failed;
  const { refetch } = orderQuery;

  // Keep the cart when the payment did not go through, so the customer can retry
  useEffect(() => {
    if (!failed) dispatch(clearCart());
  }, [dispatch, failed]);

  useEffect(() => {
    if (orderId) sessionStorage.setItem('activeOrderId', orderId);
  }, [orderId]);

  useEffect(() => {
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      verifyPayment({ razorpayPaymentId, razorpayOrderId, razorpaySignature });
    }
  }, [razorpayPaymentId, razorpayOrderId, razorpaySignature, verifyPayment]);

  // The store marks the order paid from a payment-provider event, which can arrive after the redirect
  useEffect(() => {
    if (!waiting || timedOut) return;
    const timer = window.setInterval(() => refetch(), 5000);
    const stop = window.setTimeout(() => setTimedOut(true), 60000);
    return () => { window.clearInterval(timer); window.clearTimeout(stop); };
  }, [waiting, timedOut, refetch]);

  let Icon = Clock;
  let tone = 'pending';
  let title = 'Confirming your payment';
  let message = 'Your payment was submitted. The store has not confirmed it yet; this page updates automatically.';
  if (failed) {
    Icon = CircleAlert; tone = 'error'; title = 'Payment not confirmed';
    message = 'We could not confirm this payment. If money was charged, contact the store with your order number.';
  } else if (paid) {
    Icon = CircleCheck; tone = 'success'; title = 'Payment successful!';
    message = 'Your order has been received.';
  } else if (!orderId) {
    title = 'Payment submitted';
    message = 'We could not identify the order for this payment on this page. Check your orders for its status.';
  } else if (limitedView) {
    title = 'Payment submitted';
    message = 'Payment status cannot be shown on this page. Track your order for updates.';
  } else if (isVerifying) {
    message = 'Please wait while we confirm your payment with the payment provider.';
  } else if (timedOut) {
    message = 'The store has not confirmed your payment yet. This can take a few minutes; check again or track your order.';
  }

  return (
    <BrowseShell>
      <main className="checkout-page">
        <div className="checkout-columns checkout-columns-even">
          <section className="checkout-form checkout-result" aria-labelledby="payment-result-title">
            <Icon size={44} aria-hidden="true" className={`checkout-result-icon checkout-result-${tone}`} />
            <h1 id="payment-result-title">{title}</h1>
            <p role="status">{message}</p>
            {orderId && (
              <dl className="checkout-result-reference">
                <div><dt>Order number</dt><dd>{order?.orderNumber ? `#${order.orderNumber}` : orderId}</dd></div>
                {order?.createdAt && <div><dt>Placed</dt><dd>{new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>}
              </dl>
            )}
            <div className="checkout-result-actions">
              <Link className="browse-primary" to={orderId ? `/tracking/${encodeURIComponent(orderId)}` : '/customer/orders'}>Track order <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link className="browse-secondary" to="/customer/orders">View orders</Link>
            </div>
            {waiting && timedOut && <button type="button" className="checkout-check-again" onClick={() => { setTimedOut(false); refetch(); }}>Check again</button>}
            {paid && order && Number.isFinite(order.total) && order.currency && (
              <p className="checkout-secure-note">You paid {formatMajorAmount(order.total, order.currency, locale)}.</p>
            )}
          </section>

          {orderId && <ResultOrderSummary order={order} loading={orderQuery.isLoading} failed={orderQuery.isError} onRetry={refetch} paid={paid} locale={locale} />}
        </div>
      </main>
    </BrowseShell>
  );
};

function ResultOrderSummary({ order, loading, failed, onRetry, paid, locale }: { order?: Order; loading: boolean; failed: boolean; onRetry: () => void; paid: boolean; locale: string }) {
  if (loading) return <aside className="checkout-summary" aria-label="Order summary"><p role="status">Loading order details…</p></aside>;
  if (failed || !order) {
    return (
      <aside className="checkout-summary" aria-label="Order summary">
        <h2>Order summary</h2>
        <div className="checkout-error" role="alert"><p>Order details could not be loaded.</p><button type="button" onClick={onRetry}>Retry</button></div>
      </aside>
    );
  }
  const money = (value: number | undefined) => order.currency && typeof value === 'number' && Number.isFinite(value) ? formatMajorAmount(value, order.currency, locale) : '—';
  return (
    <aside className="checkout-summary" aria-label="Order summary">
      <div className="checkout-summary-title"><h2>Order summary</h2><span className="checkout-status-chip">{STATUS_LABELS[order.status] || order.status}</span></div>
      <ul className="checkout-lines">
        {(order.items || []).map((item, index) => (
          <li key={`${item.menuItemId}-${index}`}>
            <div><strong>{item.quantity} × {item.name}</strong>{item.variant && <span>{item.variant}</span>}{!!item.customizations?.length && <span>{item.customizations.join(', ')}</span>}</div>
            <strong>{money(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>
      <dl className="checkout-breakdown">
        <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
        {order.orderType === 'DELIVERY' && <div><dt>Delivery fee</dt><dd>{money(order.deliveryFee)}</dd></div>}
        <div><dt>{order.vatCountryCode ? 'VAT' : 'Tax'}</dt><dd>{money(order.totalVatAmount ?? order.tax)}</dd></div>
        <div><dt>{paid ? 'Total paid' : 'Total'}</dt><dd>{money(order.total)}</dd></div>
      </dl>
    </aside>
  );
}

export default PaymentSuccessPage;
