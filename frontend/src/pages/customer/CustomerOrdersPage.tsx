import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, CircleAlert, CreditCard, MapPin } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartLocale } from '../../store/slices/cartSlice';
import { useGetCustomerByUserIdQuery } from '../../store/api/customerApi';
import { useGetCustomerOrdersQuery, useRequestCancelMutation, type Order } from '../../store/api/orderApi';
import { useGetAvailableMenuQuery } from '../../store/api/menuApi';
import { formatMajorAmount } from '../../utils/currency';
import { DishImage } from '../../apps/PublicWebsite/components/DishCard';
import { getApiErrorMessage } from '../utils/apiError';
import AccountLayout from './AccountLayout';
import { orderDate } from './CustomerDashboard';
import { statusCopy } from './orderStatus';
import { displayOrderNumber, TERMINAL_STATUSES } from './useCustomerOrder';
import './Tracking.css';

/** The kitchen can still stop an order in these states; later ones need the store. */
const CANCELLABLE = ['RECEIVED', 'PREPARING'];
const PAYMENT_LABEL: Record<string, string> = { CASH: 'Cash', CARD: 'Card', UPI: 'UPI', WALLET: 'Wallet' };
const newestFirst = (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

function OrderRow({ order, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  const locale = useAppSelector(selectCartLocale);
  const menu = useGetAvailableMenuQuery(order.storeId, { skip: !order.storeId });
  const [requestCancel, cancel] = useRequestCancelMutation();
  const [cancelError, setCancelError] = useState('');
  const copy = statusCopy(order.status);
  const money = (value: number) => formatMajorAmount(value, order.currency || 'EUR', locale);
  const dish = (menuItemId: string) => menu.currentData?.find(item => item.id === menuItemId);
  const items = order.items ?? [];
  const first = items[0] ? dish(items[0].menuItemId) : undefined;
  const number = displayOrderNumber(order.orderNumber);
  const panelId = `order-${order.id}-details`;
  const vat = order.totalVatAmount ?? order.tax;
  const requested = order.cancellationRequested || cancel.isSuccess;

  const askToCancel = async () => {
    setCancelError('');
    try {
      await requestCancel({ orderId: order.id }).unwrap();
    } catch (error) {
      console.error('Cancellation request was not sent', error);
      setCancelError(getApiErrorMessage(error, 'Your request was not sent. Try again.'));
    }
  };

  return <li className="account-order" data-open={open}>
    <div className="account-order-row">
      <span className="account-thumb">{first && <DishImage item={first} />}</span>
      <strong>#{number}</strong>
      <span className="account-muted">{orderDate(order.createdAt, new Date(), true)}</span>
      <span className="track-chip" data-tone={copy.tone}>{copy.chip}</span>
      <b>{money(order.total)}</b>
      <Link className="account-view" to={`/tracking/${encodeURIComponent(order.id)}`} aria-label={`View order ${number}`}>View</Link>
      <button type="button" className="account-toggle" aria-expanded={open} aria-controls={panelId} aria-label={`${open ? 'Hide' : 'Show'} details of order ${number}`} onClick={onToggle}>{open ? <ChevronDown size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}</button>
    </div>
    <div className="account-order-details" id={panelId} hidden={!open}>{open && <>
      <div>
        <ul className="account-lines">{items.map((item, index) => {
          const menuItem = dish(item.menuItemId);
          return <li key={`${item.menuItemId}-${index}`}>
            <span className="account-thumb">{menuItem && <DishImage item={menuItem} />}</span>
            <span><strong>{item.name}</strong>{(item.variant || !!item.customizations?.length) && <small>{[item.variant, ...(item.customizations || [])].filter(Boolean).join(', ')}</small>}</span>
            <span className="account-muted">{item.quantity} × {money(item.price)}</span>
            <span>{money(item.price * item.quantity)}</span>
          </li>;
        })}</ul>
        <dl className="track-totals">
          <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          {order.orderType === 'DELIVERY' && <div><dt>Delivery fee</dt><dd>{money(order.deliveryFee)}</dd></div>}
          <div><dt>VAT</dt><dd>{money(vat)}</dd></div>
          <div className="track-total"><dt>Total</dt><dd>{money(order.total)}</dd></div>
        </dl>
      </div>
      <div className="account-order-side">
        {order.orderType === 'DELIVERY' && order.deliveryAddress && <p><MapPin size={20} aria-hidden="true" /><span><strong>Delivery address</strong>{order.deliveryAddress.street}<br />{[order.deliveryAddress.pincode, order.deliveryAddress.city].filter(Boolean).join(' ')}</span></p>}
        {order.orderType !== 'DELIVERY' && <p><MapPin size={20} aria-hidden="true" /><span><strong>{order.orderType === 'DINE_IN' ? 'Dine in' : 'Pickup'}</strong>At the store</span></p>}
        <p><CreditCard size={20} aria-hidden="true" /><span><strong>Payment method</strong>{order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod : 'Not recorded'}{order.paymentStatus === 'PAID' ? ' · Paid' : order.paymentStatus === 'REFUNDED' ? ' · Refunded' : order.paymentStatus === 'FAILED' ? ' · Payment failed' : ' · Payment pending'}</span></p>
        {CANCELLABLE.includes(order.status) && (requested
          ? <p role="status" className="account-note">Cancellation requested. The store will confirm it.</p>
          : <>
            <button type="button" className="account-cancel" disabled={cancel.isLoading} onClick={askToCancel}>{cancel.isLoading ? 'Sending request…' : 'Request cancellation'}</button>
            <p className="account-note">You can request a cancellation while your order is being prepared. The store approves it.</p>
            {cancelError && <p role="alert" className="account-note">{cancelError}</p>}
          </>)}
      </div>
    </>}</div>
  </li>;
}

/** Board 07 panel 4. */
const CustomerOrdersPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const customer = useGetCustomerByUserIdQuery(user?.id || '', { skip: !user?.id });
  const orderList = useGetCustomerOrdersQuery(customer.data?.id || '', { skip: !customer.data?.id, pollingInterval: 15000 });
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);

  if (customer.isLoading || (!!customer.data?.id && orderList.isLoading)) return <AccountLayout><p role="status">Loading your orders…</p></AccountLayout>;
  // A signed-in visitor without a customer profile yet has no orders; that is not a failure.
  const noProfile = customer.isError && (customer.error as { status?: number | string } | undefined)?.status === 404;
  if ((customer.isError && !noProfile) || orderList.isError) return <AccountLayout><div className="track-state" role="alert"><CircleAlert size={36} aria-hidden="true" /><h1>Your orders could not be loaded</h1><p>Check your connection and try again.</p><button type="button" className="browse-primary" onClick={() => (customer.isError ? customer.refetch() : orderList.refetch())}>Try again</button></div></AccountLayout>;

  const orders = [...(orderList.data ?? [])].sort(newestFirst);
  const active = orders.filter(order => !TERMINAL_STATUSES.includes(order.status));
  const past = orders.filter(order => TERMINAL_STATUSES.includes(order.status));
  const shown = tab === 'active' ? active : past;
  // The newest active order starts open, as on the board; a choice by the customer replaces that.
  const openId = chosen === undefined ? (tab === 'active' ? active[0]?.id : undefined) : chosen;
  const choose = (next: 'active' | 'past') => { setTab(next); setChosen(undefined); };
  const onTabKey = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const next = tab === 'active' ? 'past' : 'active';
    choose(next);
    document.getElementById(`orders-tab-${next}`)?.focus();
  };

  return <AccountLayout>
    <h1 className="account-title">Your orders</h1>
    <div className="account-tabs" role="tablist" aria-label="Orders" onKeyDown={onTabKey}>
      <button type="button" role="tab" id="orders-tab-active" aria-selected={tab === 'active'} tabIndex={tab === 'active' ? 0 : -1} aria-controls="orders-panel" onClick={() => choose('active')}>Active orders ({active.length})</button>
      <button type="button" role="tab" id="orders-tab-past" aria-selected={tab === 'past'} tabIndex={tab === 'past' ? 0 : -1} aria-controls="orders-panel" onClick={() => choose('past')}>Past orders ({past.length})</button>
    </div>
    <div role="tabpanel" id="orders-panel" aria-labelledby={`orders-tab-${tab}`}>
      {shown.length === 0
        ? <div className="account-card account-muted">{tab === 'active' ? 'You have no orders in progress.' : 'You have no past orders yet.'} <Link to="/menu">Browse the menu</Link></div>
        : <ul className="account-orders">{shown.map(order => <OrderRow key={order.id} order={order} open={openId === order.id} onToggle={() => setChosen(openId === order.id ? null : order.id)} />)}</ul>}
    </div>
  </AccountLayout>;
};

export default CustomerOrdersPage;
