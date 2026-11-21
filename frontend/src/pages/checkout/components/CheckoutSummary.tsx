import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';
import { cartLineKey, selectCartItemCount, selectCartSubtotal } from '../../../store/slices/cartSlice';
import { formatMajorAmount } from '../../../utils/currency';
import type { Order } from '../../../store/api/orderApi';
import type { CheckoutOrderType, useCheckoutStore } from './checkoutContext';

export default function CheckoutSummary({ checkout, orderType, order, placesOrder }: { checkout: ReturnType<typeof useCheckoutStore>; orderType?: CheckoutOrderType | 'DINE_IN'; order?: Pick<Order, 'subtotal' | 'deliveryFee' | 'tax' | 'total' | 'totalVatAmount'>; placesOrder?: boolean }) {
  const count = useAppSelector(selectCartItemCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const fmt = (value: number) => formatMajorAmount(value, checkout.market.currency, checkout.market.locale);
  const confirmed = (value: number | undefined) => checkout.market.resolved && typeof value === 'number' && Number.isFinite(value) ? fmt(value) : '—';
  const taxLabel = checkout.market.countryCode ? 'VAT' : 'Tax';
  return <aside className="checkout-summary" aria-label="Order summary">
    <div className="checkout-summary-title"><h2>Order summary</h2>{!order && <Link to="/menu">Edit cart</Link>}</div>
    <p>{count} {count === 1 ? 'item' : 'items'}{checkout.store ? ` · ${checkout.store.name}` : ''}</p>
    <ul className="checkout-lines">{checkout.items.map(item => <li key={cartLineKey(item)}>
      {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}
      <div><strong>{item.name}</strong><span>Quantity {item.quantity}</span>{item.variant && <span>{item.variant}</span>}{!!item.customizations?.length && <span>{item.customizations.join(', ')}</span>}{item.notes && <span>Note: {item.notes}</span>}</div>
      <strong>{checkout.market.resolved ? fmt(item.price * item.quantity) : '—'}</strong>
    </li>)}</ul>
    {order ? <>
      <dl className="checkout-breakdown"><div><dt>Subtotal</dt><dd>{confirmed(order.subtotal)}</dd></div>{orderType === 'DELIVERY' && <div><dt>Delivery fee</dt><dd>{confirmed(order.deliveryFee)}</dd></div>}<div><dt>{taxLabel}</dt><dd>{confirmed(order.totalVatAmount ?? order.tax)}</dd></div><div><dt>Total</dt><dd>{confirmed(order.total)}</dd></div></dl>
      <p className="checkout-note">Amounts confirmed by the store for this order.</p>
    </> : <>
      <dl className="checkout-breakdown"><div><dt>Menu subtotal</dt><dd>{checkout.market.resolved ? fmt(subtotal) : '—'}</dd></div><div><dt>Delivery fee</dt><dd>{orderType === 'DELIVERY' || !orderType ? 'Confirmed with order' : orderType === 'TAKEAWAY' ? 'Not applicable to pickup' : 'Not applicable to dine in'}</dd></div><div><dt>{taxLabel}</dt><dd>Calculated by store</dd></div><div><dt>Final total</dt><dd>Confirmed with order</dd></div></dl>
      <p className="checkout-note">Menu subtotal is provisional. Delivery fees, discounts, tax and final amounts come from the store. {placesOrder ? 'The store confirms the final total when the order is placed, before you pay.' : 'Continuing does not place or pay for an order.'}</p>
    </>}
  </aside>;
}
