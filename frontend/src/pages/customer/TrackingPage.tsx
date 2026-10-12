import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CircleAlert, CircleHelp, Clock, Copy, CreditCard, MapPin, PackageCheck, Star, Store as StoreIcon, Truck } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { storeDisplayName } from '../../apps/PublicWebsite/components/CustomerStoreSelector';
import { useTrackOrderQuery as useDeliveryTrackQuery } from '../../store/api/deliveryApi';
import { useCreateReviewMutation } from '../../store/api/reviewApi';
import { useGetActiveStoresQuery } from '../../store/api/storeApi';
import { useAppSelector } from '../../store/hooks';
import { selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import RatingDialog from '../../components/delivery/RatingDialog';
import { SUPPORT_EMAIL } from '../../apps/ProductSite/constants';
import { getApiErrorMessage } from '../utils/apiError';
import { displayOrderNumber, TERMINAL_STATUSES, useCustomerOrder } from './useCustomerOrder';
import './Tracking.css';

type Tone = 'warning' | 'info' | 'success' | 'error';
interface Step { label: string; statuses: string[]; note?: string }

const KITCHEN: Step[] = [
  { label: 'Received', statuses: ['RECEIVED'] },
  { label: 'Preparing', statuses: ['PREPARING'] },
  { label: 'In oven', statuses: ['OVEN', 'BAKED'] },
  { label: 'Ready', statuses: ['READY'] },
];
const STEPS: Record<string, Step[]> = {
  DELIVERY: [...KITCHEN, { label: 'Dispatched', statuses: ['DISPATCHED'], note: 'Awaiting pickup' }, { label: 'Out for delivery', statuses: ['OUT_FOR_DELIVERY'] }, { label: 'Delivered', statuses: ['DELIVERED', 'COMPLETED'] }],
  TAKEAWAY: [...KITCHEN, { label: 'Collected', statuses: ['COMPLETED', 'DELIVERED'] }],
  DINE_IN: [...KITCHEN, { label: 'Served', statuses: ['SERVED', 'COMPLETED'] }],
};
/** Used when the public tracking view does not say how the order is fulfilled. */
const NEUTRAL_STEPS: Step[] = [...KITCHEN, { label: 'Completed', statuses: ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'SERVED', 'COMPLETED'] }];

const STATUS_COPY: Record<string, { chip: string; tone: Tone; title: string; text: string }> = {
  RECEIVED: { chip: 'Received', tone: 'info', title: 'Your order has been received', text: 'The kitchen will start on it shortly.' },
  PREPARING: { chip: 'Preparing', tone: 'warning', title: 'Your food is being prepared', text: 'The kitchen is working on your order.' },
  OVEN: { chip: 'In oven', tone: 'warning', title: 'Your food is in the oven', text: 'It will be ready soon.' },
  BAKED: { chip: 'In oven', tone: 'warning', title: 'Your food is out of the oven', text: 'It is being finished and packed.' },
  READY: { chip: 'Ready', tone: 'success', title: 'Your order is ready', text: 'It is packed and waiting.' },
  DISPATCHED: { chip: 'Dispatched', tone: 'info', title: 'A driver has been assigned', text: 'Your driver is collecting the order from the store.' },
  OUT_FOR_DELIVERY: { chip: 'Out for delivery', tone: 'success', title: 'Your order is on its way', text: 'Follow the driver on the live map.' },
  DELIVERED: { chip: 'Delivered', tone: 'success', title: 'Your order was delivered', text: 'Enjoy your meal.' },
  SERVED: { chip: 'Served', tone: 'success', title: 'Your order was served', text: 'Enjoy your meal.' },
  COMPLETED: { chip: 'Completed', tone: 'success', title: 'Your order is complete', text: 'Thank you for ordering with MaSoVa.' },
  CANCELLED: { chip: 'Cancelled', tone: 'error', title: 'This order was cancelled', text: 'Contact the store if you did not expect this.' },
};

const stepsFor = (type?: string) => !type ? NEUTRAL_STEPS : type === 'DINE_IN' ? STEPS.DINE_IN : type === 'DELIVERY' ? STEPS.DELIVERY : STEPS.TAKEAWAY;

/** Board 06 panel 3. */
const TrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const locale = useAppSelector(selectCartLocale);
  const signedIn = useAppSelector(state => state.auth.isAuthenticated);
  const { order, isLoading, isError, notFound, refetch, limited } = useCustomerOrder(orderId);
  const stores = useGetActiveStoresQuery();
  const [createReview] = useCreateReviewMutation();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingState, setRatingState] = useState<'idle' | 'sent' | 'failed'>('idle');
  const [ratingError, setRatingError] = useState('');
  const [copied, setCopied] = useState(false);

  const status = order?.status ?? '';
  const enRoute = status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY';
  const delivery = useDeliveryTrackQuery(orderId || '', { skip: !orderId || !enRoute || limited, pollingInterval: 10000 });

  // The header's order link follows the active order until it reaches a final state.
  useEffect(() => {
    if (!orderId || !status) return;
    if (TERMINAL_STATUSES.includes(status)) {
      if (sessionStorage.getItem('activeOrderId') === orderId) sessionStorage.removeItem('activeOrderId');
    } else {
      sessionStorage.setItem('activeOrderId', orderId);
    }
  }, [orderId, status]);

  const back = <Link className="track-back" to={signedIn ? '/customer/orders' : '/menu'}><ArrowLeft size={16} aria-hidden="true" />{signedIn ? 'Back to orders' : 'Back to menu'}</Link>;

  if (isLoading) return <BrowseShell><main className="track-page">{back}<div className="track-state" role="status"><Clock size={36} aria-hidden="true" /><h1>Loading your order…</h1></div></main></BrowseShell>;
  if (!order || !orderId) return <BrowseShell><main className="track-page">{back}<div className="track-state" role="alert"><CircleAlert size={36} aria-hidden="true" /><h1>{isError && !notFound ? 'Your order could not be loaded' : 'Order not found'}</h1><p>{isError && !notFound ? 'Check your connection and try again.' : 'Check the link in your confirmation, or contact the store.'}</p>{isError && !notFound ? <button type="button" className="browse-primary" onClick={() => refetch()}>Try again</button> : <Link className="browse-primary" to="/menu">Browse menu</Link>}</div></main></BrowseShell>;

  const steps = stepsFor(order.orderType);
  const stepIndex = steps.findIndex(step => step.statuses.includes(status));
  const cancelled = status === 'CANCELLED';
  const finished = TERMINAL_STATUSES.includes(status) && !cancelled;
  const copy = STATUS_COPY[status] ?? { chip: status.toLowerCase().replace(/_/g, ' '), tone: 'info' as Tone, title: 'Order status updated', text: '' };
  const store = stores.data?.find(candidate => candidate.id === order.storeId || candidate.storeCode === order.storeId);
  const currency = order.currency || 'EUR';
  const money = (value: number) => formatMajorAmount(value, currency, locale);
  const placed = new Date(order.createdAt);
  const placedText = Number.isNaN(placed.getTime()) ? '' : `${placed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${placed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  const vat = order.totalVatAmount ?? order.tax;
  const otp = delivery.data?.deliveryOtp;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Order number could not be copied', error);
    }
  };

  const submitRating = async (rating: number, feedback: string) => {
    try {
      await createReview({ orderId, overallRating: rating, comment: feedback, ...(order.orderType === 'DELIVERY' ? { deliveryRating: rating } : {}) }).unwrap();
      setRatingState('sent');
      setRatingOpen(false);
    } catch (error) {
      console.error('Rating was not saved', error);
      setRatingError(getApiErrorMessage(error, 'Your rating was not saved.'));
      setRatingState('failed');
      setRatingOpen(false);
    }
  };

  return <BrowseShell>
    <main className="track-page">
      {back}
      <div className="track-title">
        <h1>Order #{displayOrderNumber(order.orderNumber)}<button type="button" className="track-copy" onClick={copyNumber} aria-label="Copy order number"><Copy size={18} aria-hidden="true" /></button></h1>
        <span className="track-chip" data-tone={copy.tone}>{copy.chip}</span>
      </div>
      <p className="track-date">{placedText}<span role="status" className="sr-only">{copied ? 'Order number copied' : ''}</span></p>

      <section className="track-card" aria-label="Order progress">
        <div className="track-store">
          <span className="track-store-mark"><StoreIcon size={24} aria-hidden="true" /></span>
          <div className="track-store-text"><strong>{store ? storeDisplayName(store.name) : 'Your MaSoVa store'}</strong>{store?.address && <span>{[store.address.street, store.address.city].filter(Boolean).join(', ')}</span>}</div>
          <div className="track-actions"><a className="track-action" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Help with order ' + order.orderNumber)}`}><CircleHelp size={18} aria-hidden="true" />Need help?</a></div>
        </div>

        {!cancelled && <ol className="track-steps" aria-label="Order steps">
          {steps.map((step, index) => {
            const state = stepIndex < 0 ? 'todo' : index < stepIndex || (finished && index === stepIndex) ? 'done' : index === stepIndex ? 'current' : 'todo';
            return <li key={step.label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="track-dot">{state === 'done' && <Check size={14} strokeWidth={3} aria-hidden="true" />}</span>
              <b>{step.label}</b>
              <small>{state === 'current' ? 'Now' : state === 'todo' && step.note ? step.note : ''}<span className="sr-only">{state === 'done' ? ' Done' : state === 'todo' ? ' Not started' : ''}</span></small>
            </li>;
          })}
        </ol>}

        <div className="track-banner" data-tone={copy.tone} role="status" style={cancelled ? { marginTop: 16 } : undefined}>
          {cancelled ? <CircleAlert size={22} aria-hidden="true" /> : enRoute ? <Truck size={22} aria-hidden="true" /> : finished ? <PackageCheck size={22} aria-hidden="true" /> : <Clock size={22} aria-hidden="true" />}
          <div><strong>{copy.title}</strong><span>{copy.text}</span></div>
          {enRoute && order.orderType === 'DELIVERY' && <Link className="track-action" to={`/live-tracking/${encodeURIComponent(orderId)}`}><MapPin size={18} aria-hidden="true" />Track live delivery</Link>}
          {finished && signedIn && !limited && ratingState === 'idle' && <button type="button" className="track-action" onClick={() => setRatingOpen(true)}><Star size={18} aria-hidden="true" />Rate your order</button>}
        </div>
        {ratingState === 'sent' && <p role="status">Thank you. Your rating was saved.</p>}
        {ratingState === 'failed' && <p role="alert">{ratingError} <button type="button" onClick={() => { setRatingState('idle'); setRatingOpen(true); }}>Try again</button></p>}

        {enRoute && !limited && delivery.isError && <p role="alert">Your delivery code could not be loaded. <button type="button" onClick={() => delivery.refetch()}>Try again</button></p>}
        {otp && enRoute && !limited && <div className="track-banner" data-tone="info">
          <PackageCheck size={22} aria-hidden="true" />
          <div><strong>Delivery code</strong><span>Give this code to your driver when the order arrives.</span></div>
          <span className="track-otp" aria-label={`Delivery code ${otp.split('').join(' ')}`}>{otp}</span>
        </div>}

        <div className="track-columns">
          <div className="track-card">
            <h2>Order items</h2>
            <ul className="track-lines">{order.items.map((item, index) => <li key={`${item.menuItemId}-${index}`}>
              <span className="track-qty">{item.quantity} ×</span>
              <span>{item.name}{(item.variant || !!item.customizations?.length) && <small>{[item.variant, ...(item.customizations || [])].filter(Boolean).join(', ')}</small>}{item.notes && <small>Note: {item.notes}</small>}</span>
              {!limited && <span>{money(item.price * item.quantity)}</span>}
            </li>)}</ul>
          </div>
          <div className="track-card">
            <h2>Total</h2>
            {limited ? <p>Sign in to see the amounts for this order.</p> : <>
              <dl className="track-totals">
                <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
                {order.orderType === 'DELIVERY' && <div><dt>Delivery fee</dt><dd>{money(order.deliveryFee)}</dd></div>}
                <div><dt>VAT</dt><dd>{money(vat)}</dd></div>
                <div className="track-total"><dt>{order.paymentStatus === 'PAID' ? 'Total paid' : 'Total'}</dt><dd>{money(order.total)}</dd></div>
              </dl>
              <p className="track-paid"><CreditCard size={18} aria-hidden="true" />{order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'REFUNDED' ? 'Refunded' : order.paymentStatus === 'FAILED' ? 'Payment failed' : 'Payment pending'}{order.paymentMethod ? ` · ${order.paymentMethod === 'CASH' ? 'Cash' : order.paymentMethod === 'CARD' ? 'Card' : order.paymentMethod}` : ''}</p>
            </>}
          </div>
        </div>
      </section>

      {ratingOpen && <RatingDialog open onClose={() => setRatingOpen(false)} driverName={delivery.data?.driverName || 'your order'} orderId={orderId} onSubmit={submitRating} />}
    </main>
  </BrowseShell>;
};

export default TrackingPage;
