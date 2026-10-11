import type { Order } from '../../../store/api/orderApi';
import type { PaymentResponse } from '../../../store/api/paymentApi';
import { formatMajorAmount } from '../../../utils/currency';

export default function PaymentSummary({ order, payment, currency, locale }: { order: Order; payment?: PaymentResponse | null; currency: string; locale: string }) {
  const fmt = (amount?: number) => typeof amount === 'number' && Number.isFinite(amount) ? formatMajorAmount(amount, order.currency || currency, locale) : 'Not returned by store';
  return <aside className="checkout-summary" aria-label="Confirmed order summary"><h2>Confirmed order</h2><p>Order {order.orderNumber || order.id}</p>
    <ul className="checkout-lines">{order.items?.map((item, index) => <li key={`${item.menuItemId}:${index}`}><div><strong>{item.name}</strong><span>Quantity {item.quantity}{item.variant ? ` · ${item.variant}` : ''}</span>{!!item.customizations?.length && <span>{item.customizations.join(', ')}</span>}</div></li>)}</ul>
    <dl className="checkout-breakdown"><div><dt>Store subtotal</dt><dd>{fmt(order.subtotal)}</dd></div><div><dt>Delivery fee</dt><dd>{fmt(order.deliveryFee)}</dd></div><div><dt>{order.vatCountryCode ? 'VAT' : 'Tax'}</dt><dd>{fmt(order.totalVatAmount ?? order.tax)}</dd></div><div><dt>Order total</dt><dd>{fmt(order.total)}</dd></div>{payment && <div><dt>Payment amount</dt><dd>{formatMajorAmount(payment.amount, payment.currency, locale)}</dd></div>}</dl>
    <p className="checkout-note">Amounts returned by the store{payment ? ' and payment service' : ''}. Payment is confirmed only after the server records success.</p>
  </aside>;
}
