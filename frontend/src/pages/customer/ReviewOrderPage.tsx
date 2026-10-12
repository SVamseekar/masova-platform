import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleAlert, CircleCheck, MapPin, Star } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { DishImage } from '../../apps/PublicWebsite/components/DishCard';
import { storeDisplayName } from '../../apps/PublicWebsite/components/CustomerStoreSelector';
import { useGetOrderQuery } from '../../store/api/orderApi';
import { useGetAvailableMenuQuery } from '../../store/api/menuApi';
import { useGetActiveStoresQuery } from '../../store/api/storeApi';
import { useCreateReviewMutation } from '../../store/api/reviewApi';
import { useAppSelector } from '../../store/hooks';
import { selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import { getApiErrorMessage } from '../utils/apiError';
import { statusCopy } from './orderStatus';
import { displayOrderNumber, TERMINAL_STATUSES } from './useCustomerOrder';
import './Tracking.css';
import './Account.css';

const RATING_WORD = ['', 'Poor', 'Fair', 'OK', 'Good', 'Excellent'];
const COMMENT_LIMIT = 500;

function Stars({ id, label, value, onChange, large }: { id: string; label: string; value: number; onChange: (value: number) => void; large?: boolean }) {
  return <fieldset className="review-stars" data-large={large}>
    <legend>{label}</legend>
    <div>
      {[1, 2, 3, 4, 5].map(star => <label key={star} data-on={star <= value}>
        <input type="radio" name={id} value={star} checked={value === star} onChange={() => onChange(star)} className="sr-only" />
        <Star size={large ? 30 : 24} aria-hidden="true" />
        <span className="sr-only">{star} {star === 1 ? 'star' : 'stars'}, {RATING_WORD[star]}</span>
      </label>)}
      {value > 0 && <span className="track-chip" data-tone="success" aria-hidden="true">{RATING_WORD[value]}</span>}
    </div>
  </fieldset>;
}

/**
 * Board 08 panel 4. Customers cannot list reviews, so a second review of one order is refused by
 * the server on submit and reported in the form.
 */
const ReviewOrderPage: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const locale = useAppSelector(selectCartLocale);
  const order = useGetOrderQuery(orderId, { skip: !orderId });
  const stores = useGetActiveStoresQuery();
  const menu = useGetAvailableMenuQuery(order.data?.storeId, { skip: !order.data?.storeId });
  const [createReview, create] = useCreateReviewMutation();
  const [overall, setOverall] = useState(0);
  const [food, setFood] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');

  const back = <Link className="track-back" to={orderId ? `/tracking/${encodeURIComponent(orderId)}` : '/customer/orders'}><ArrowLeft size={16} aria-hidden="true" />Back to order</Link>;
  const state = (title: string, text: string, action?: React.ReactNode, ok = false) => <BrowseShell><main className="track-page">{back}<div className="track-state" role={ok ? 'status' : 'alert'}>{ok ? <CircleCheck size={36} aria-hidden="true" /> : <CircleAlert size={36} aria-hidden="true" />}<h1>{title}</h1><p>{text}</p>{action}</div></main></BrowseShell>;

  if (order.isLoading) return <BrowseShell><main className="track-page">{back}<p role="status">Loading your order…</p></main></BrowseShell>;
  if (!order.data) return state('This order could not be loaded', 'Only the customer who placed an order can review it. Check your connection and try again.', <button type="button" className="browse-primary" onClick={() => order.refetch()}>Try again</button>);
  if (create.isSuccess) return state('Thank you for your review', 'Your feedback helps the kitchen and other customers.', <Link className="browse-primary" to="/customer/orders">Back to your orders</Link>, true);
  if (!TERMINAL_STATUSES.includes(order.data.status) || order.data.status === 'CANCELLED') return state('This order cannot be reviewed yet', 'You can review an order after it is delivered, collected or served.');

  const data = order.data;
  const items = data.items ?? [];
  const isDelivery = data.orderType === 'DELIVERY';
  const money = (value: number) => formatMajorAmount(value, data.currency || 'EUR', locale);
  const store = stores.data?.find(candidate => candidate.id === data.storeId || candidate.storeCode === data.storeId);
  const dish = items[0] ? menu.currentData?.find(item => item.id === items[0].menuItemId) : undefined;
  const placed = new Date(data.createdAt);
  const copy = statusCopy(data.status);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!overall) { setError('Choose an overall rating.'); document.querySelector<HTMLInputElement>('input[name="review-overall"]')?.focus(); return; }
    setError('');
    try {
      await createReview({
        orderId, overallRating: overall, comment: comment.trim() || undefined, isAnonymous: !isPublic,
        ...(food ? { foodQualityRating: food } : {}), ...(isDelivery && delivery ? { deliveryRating: delivery } : {}),
      }).unwrap();
    } catch (failure) {
      console.error('Review was not saved', failure);
      setError(getApiErrorMessage(failure, 'Your review was not saved. Try again.'));
    }
  };

  return <BrowseShell>
    <main className="track-page">
      {back}
      <div className="review-layout">
        <section className="track-card review-order" aria-label="Order summary">
          <div className="review-photo">{dish && <DishImage item={dish} />}</div>
          <div className="review-order-head"><strong>Order #{displayOrderNumber(data.orderNumber)}</strong><span className="track-chip" data-tone={copy.tone}>{copy.chip}</span></div>
          {!Number.isNaN(placed.getTime()) && <p className="account-muted">{placed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, {placed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>}
          {store && <p className="review-store"><MapPin size={18} aria-hidden="true" /><span><strong>{storeDisplayName(store.name)}</strong>{store.address?.city}</span></p>}
          <ul className="review-items">{items.map((item, index) => <li key={`${item.menuItemId}-${index}`}><span>{item.quantity} ×</span><span>{item.name}</span><span>{money(item.price * item.quantity)}</span></li>)}</ul>
          <dl className="track-totals">
            <div><dt>Subtotal</dt><dd>{money(data.subtotal)}</dd></div>
            {isDelivery && <div><dt>Delivery fee</dt><dd>{money(data.deliveryFee)}</dd></div>}
            <div><dt>VAT</dt><dd>{money(data.totalVatAmount ?? data.tax)}</dd></div>
            <div className="track-total"><dt>Total</dt><dd>{money(data.total)}</dd></div>
          </dl>
        </section>

        <form className="track-card review-form" onSubmit={submit} noValidate aria-labelledby="review-title">
          <h1 id="review-title">Rate your order</h1>
          <p className="account-muted">Tell us what you thought about your food{isDelivery ? ' and delivery experience' : ''}.</p>
          <Stars id="review-overall" label="Overall rating" value={overall} onChange={value => { setOverall(value); setError(''); }} large />
          <div className="review-pair">
            <Stars id="review-food" label="Food quality" value={food} onChange={setFood} />
            {isDelivery && <Stars id="review-delivery" label="Delivery experience" value={delivery} onChange={setDelivery} />}
          </div>
          <label htmlFor="review-comment" className="review-comment">Your comments <span className="account-muted">(optional)</span>
            <textarea id="review-comment" rows={4} maxLength={COMMENT_LIMIT} value={comment} onChange={event => setComment(event.target.value)} aria-describedby="review-count" />
          </label>
          <p id="review-count" className="review-count account-muted">{comment.length}/{COMMENT_LIMIT}</p>
          <div className="review-public">
            <label htmlFor="review-public"><strong>Make this review public</strong><span id="review-public-note" className="account-muted">Show your name with this review to help other customers. Your contact details are never shown.</span></label>
            <input id="review-public" type="checkbox" role="switch" className="account-switch" checked={isPublic} aria-describedby="review-public-note" onChange={event => setIsPublic(event.target.checked)} />
          </div>
          {error && <p role="alert" className="account-notice" data-tone="error"><CircleAlert size={18} aria-hidden="true" />{error}</p>}
          <div className="account-form-actions"><button type="submit" className="browse-primary" disabled={create.isLoading}>{create.isLoading ? 'Sending…' : 'Submit review'}</button></div>
        </form>
      </div>
    </main>
  </BrowseShell>;
};

export default ReviewOrderPage;
