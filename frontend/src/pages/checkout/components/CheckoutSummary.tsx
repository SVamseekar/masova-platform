import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';
import { cartLineKey, selectCartItemCount, selectCartSubtotal } from '../../../store/slices/cartSlice';
import { formatMajorAmount } from '../../../utils/currency';
import type { CheckoutOrderType, useCheckoutStore } from './checkoutContext';

export default function CheckoutSummary({ checkout, orderType }: { checkout: ReturnType<typeof useCheckoutStore>; orderType?: CheckoutOrderType }) {
  const count = useAppSelector(selectCartItemCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const fmt = (value: number) => formatMajorAmount(value, checkout.market.currency, checkout.market.locale);
  return <aside className="checkout-summary" aria-label="Order summary">
    <div className="checkout-summary-title"><h2>Order summary</h2><Link to="/menu">Edit cart</Link></div>
    <p>{count} {count === 1 ? 'item' : 'items'}{checkout.store ? ` · ${checkout.store.name}` : ''}</p>
    <ul className="checkout-lines">{checkout.items.map(item => <li key={cartLineKey(item)}>
      {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}
      <div><strong>{item.name}</strong><span>Quantity {item.quantity}</span>{item.variant && <span>{item.variant}</span>}{!!item.customizations?.length && <span>{item.customizations.join(', ')}</span>}</div>
      <strong>{checkout.market.resolved ? fmt(item.price * item.quantity) : '—'}</strong>
    </li>)}</ul>
    <dl className="checkout-breakdown"><div><dt>Menu subtotal</dt><dd>{checkout.market.resolved ? fmt(subtotal) : '—'}</dd></div><div><dt>Delivery fee</dt><dd>{orderType === 'TAKEAWAY' ? 'Not applicable to pickup' : 'Confirmed with order'}</dd></div><div><dt>{checkout.market.countryCode ? 'VAT' : 'Tax'}</dt><dd>Calculated by store</dd></div><div><dt>Final total</dt><dd>Confirmed with order</dd></div></dl>
    <p className="checkout-note">Menu subtotal is provisional. Delivery fees, discounts, tax and final amounts come from the store. Continuing does not place or pay for an order.</p>
  </aside>;
}
