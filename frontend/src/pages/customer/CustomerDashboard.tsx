import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CircleAlert, Crown } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartLocale } from '../../store/slices/cartSlice';
import { useGetCustomerByUserIdQuery } from '../../store/api/customerApi';
import { useGetCustomerOrdersQuery, type Order } from '../../store/api/orderApi';
import { formatMajorAmount } from '../../utils/currency';
import { useBrowseMenu } from '../../apps/PublicWebsite/components/useBrowseMenu';
import { DishImage } from '../../apps/PublicWebsite/components/DishCard';
import DishCustomization from '../../apps/PublicWebsite/components/DishCustomization';
import AccountLayout from './AccountLayout';
import { KITCHEN, statusCopy } from './orderStatus';
import { displayOrderNumber, TERMINAL_STATUSES } from './useCustomerOrder';
import './Tracking.css';

const TIER_LABEL: Record<string, string> = { BRONZE: 'Bronze tier', SILVER: 'Silver tier', GOLD: 'Gold tier', PLATINUM: 'Platinum tier' };

const greeting = (hour: number) => hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
const shortDate = (value: string | Date) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
/** "Today, 14:12" or "08 Oct 2026"; with `withTime`, "08 Oct 2026 at 19:24". */
export const orderDate = (value: string, now = new Date(), withTime = false) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const today = date.toDateString() === now.toDateString();
  if (withTime) return `${today ? 'Today, ' : ''}${shortDate(date)} at ${time}`;
  return today ? `Today, ${time}` : shortDate(date);
};
const newestFirst = (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** Board 07 panel 3. */
const CustomerDashboard: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const locale = useAppSelector(selectCartLocale);
  const customer = useGetCustomerByUserIdQuery(user?.id || '', { skip: !user?.id });
  const orderList = useGetCustomerOrdersQuery(customer.data?.id || '', { skip: !customer.data?.id, pollingInterval: 30000 });
  const browse = useBrowseMenu();
  const [dishId, setDishId] = useState<string | null>(null);
  const [today] = useState(() => new Date());

  if (customer.isLoading || (!!customer.data?.id && orderList.isLoading)) return <AccountLayout><p role="status">Loading your account…</p></AccountLayout>;
  // A signed-in visitor without a customer profile yet has an empty account, not a failed one.
  const noProfile = customer.isError && (customer.error as { status?: number | string } | undefined)?.status === 404;
  if (customer.isError && !noProfile) return <AccountLayout><div className="track-state" role="alert"><CircleAlert size={36} aria-hidden="true" /><h1>Your account could not be loaded</h1><p>Check your connection and try again.</p><button type="button" className="browse-primary" onClick={() => customer.refetch()}>Try again</button></div></AccountLayout>;

  const profile = noProfile ? undefined : customer.data;
  const orders = [...(orderList.data ?? [])].map(order => ({ ...order, items: order.items ?? [] })).sort(newestFirst);
  const active = orders.find(order => !TERMINAL_STATUSES.includes(order.status));
  const money = (order: Order, value: number) => formatMajorAmount(value, order.currency || 'EUR', locale);
  const givenName = (profile?.name || user?.name || '').trim().split(/\s+/)[0] ?? '';
  const firstName = givenName.charAt(0).toUpperCase() + givenName.slice(1);
  const loyalty = profile?.loyaltyInfo;

  // Saved favourites first; without any, the dishes ordered most often.
  const saved = profile?.preferences?.favoriteMenuItems ?? [];
  const counts = new Map<string, number>();
  orders.forEach(order => order.items.forEach(item => counts.set(item.menuItemId, (counts.get(item.menuItemId) ?? 0) + item.quantity)));
  const favouriteIds = [...new Set([...saved, ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)])];
  const favourites = favouriteIds.map(id => browse.items.find(item => item.id === id)).filter(item => !!item).slice(0, 3);
  const dish = browse.items.find(item => item.id === dishId);
  const canAdd = browse.online && browse.canOrder && !browse.menu.isFetching;

  const activeStep = active ? KITCHEN.findIndex(step => step.statuses.includes(active.status)) : -1;
  const activeCopy = active ? statusCopy(active.status) : null;
  const activeItem = active?.items[0];
  const activeDish = activeItem ? browse.items.find(item => item.id === activeItem.menuItemId) : undefined;

  return <AccountLayout>
    <div className="account-head">
      <div><h1>{greeting(today.getHours())}{firstName ? `, ${firstName}` : ''}</h1><p>Great to see you again!</p></div>
      <p className="account-today"><span>Today</span>{shortDate(today)}</p>
    </div>

    {active && activeCopy && <section className="account-card account-active" aria-label="Your active order">
      <Link className="account-active-top" to={`/tracking/${encodeURIComponent(active.id)}`}>
        <strong>Your active order</strong>
        <span className="track-chip" data-tone={activeCopy.tone}>{activeCopy.chip}</span>
        {active.preparationTime ? <span className="account-muted">Estimated {active.preparationTime} min</span> : <span />}
        <b>#{displayOrderNumber(active.orderNumber)}</b>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
      <div className="account-active-body">
        {activeItem && <div className="account-dish">
          <span className="account-thumb">{activeDish && <DishImage item={activeDish} />}</span>
          <div><strong>{activeItem.name}</strong>{active.items.length > 1 && <span>+ {active.items.length - 1} more {active.items.length === 2 ? 'item' : 'items'}</span>}<span>{activeItem.quantity} × {money(active, activeItem.price)}</span></div>
        </div>}
        {activeStep >= 0
          ? <ol className="track-steps" aria-label="Kitchen progress">{KITCHEN.map((step, index) => <li key={step.label} data-state={index < activeStep ? 'done' : index === activeStep ? 'current' : 'todo'} aria-current={index === activeStep ? 'step' : undefined}><span className="track-dot" /><b>{step.label}</b></li>)}</ol>
          : <p className="account-muted">{activeCopy.title}</p>}
      </div>
    </section>}

    {loyalty && <section className="account-card account-rewards" aria-label="MaSoVa Rewards">
      <Crown size={26} aria-hidden="true" />
      <div><strong>MaSoVa Rewards</strong><span>{TIER_LABEL[loyalty.tier] ?? loyalty.tier}{loyalty.pointsEarned > 0 ? ` · ${loyalty.pointsEarned} points earned in total` : ''}</span></div>
      <p className="account-points"><b>{loyalty.totalPoints ?? 0}</b>points</p>
    </section>}

    <div className="account-columns">
      <section className="account-card" aria-labelledby="account-favourites">
        <div className="account-card-head"><h2 id="account-favourites">{saved.length ? 'Your favourites' : 'Order again'}</h2><Link to="/menu">View all</Link></div>
        {favourites.length === 0
          ? <p className="account-muted">{browse.menu.isLoading ? 'Loading dishes…' : 'Dishes you order appear here.'}</p>
          : <ul className="account-list">{favourites.map(item => <li key={item.id}>
            <span className="account-thumb"><DishImage item={item} /></span>
            <div><strong>{item.name}</strong><span>{formatMajorAmount(item.basePrice / 100, browse.market.currency, browse.market.locale)}</span></div>
            <button type="button" className="browse-primary" disabled={!canAdd} aria-label={`Add ${item.name}`} onClick={() => setDishId(item.id)}>Add</button>
          </li>)}</ul>}
      </section>

      <section className="account-card" aria-labelledby="account-recent">
        <div className="account-card-head"><h2 id="account-recent">Recent orders</h2><Link to="/customer/orders">View all</Link></div>
        {orderList.isError ? <p role="alert">Your orders could not be loaded. <button type="button" onClick={() => orderList.refetch()}>Try again</button></p>
          : orders.length === 0 ? <p className="account-muted">You have no orders yet. <Link to="/menu">Browse the menu</Link></p>
          : <ul className="account-recent">{orders.slice(0, 4).map(order => {
            const copy = statusCopy(order.status);
            return <li key={order.id}>
              <Link to={`/tracking/${encodeURIComponent(order.id)}`}>#{displayOrderNumber(order.orderNumber)}</Link>
              <span className="track-chip" data-tone={copy.tone}>{copy.chip}</span>
              <span>{money(order, order.total)}</span>
              <span className="account-muted">{orderDate(order.createdAt, today)}</span>
            </li>;
          })}</ul>}
      </section>
    </div>

    {dish && <DishCustomization key={`${browse.selectedStoreId}:${dish.id}`} item={dish} currency={browse.market.currency} locale={browse.market.locale} canAdd={canAdd} onClose={() => setDishId(null)} />}
  </AccountLayout>;
};

export default CustomerDashboard;
