import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { useCheckoutStore } from '../checkout/components/checkoutContext';
import CheckoutSummary from '../checkout/components/CheckoutSummary';
import '../checkout/components/Checkout.css';

/**
 * Payment failed. Shows the provider's reason and keeps the cart so the customer can retry.
 */
const PaymentFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const checkout = useCheckoutStore();

  const orderId = searchParams.get('order_id');
  const errorMessage = searchParams.get('error') || 'Payment was not completed';

  return (
    <BrowseShell>
      <main className="checkout-page">
        <div className="checkout-columns checkout-columns-even">
          <section className="checkout-form checkout-result" aria-labelledby="payment-failed-title">
            <CircleAlert size={44} aria-hidden="true" className="checkout-result-icon checkout-result-error" />
            <h1 id="payment-failed-title">Payment failed</h1>
            <p>We couldn&apos;t complete your payment.</p>
            <div className="checkout-error" role="alert">
              <p>{errorMessage}</p>
              <p>Check your payment details or try another payment method.</p>
            </div>
            <div className="checkout-result-actions">
              <Link className="browse-primary" to="/checkout">Retry payment</Link>
              <Link className="browse-secondary" to="/menu">Back to menu</Link>
            </div>
            {orderId && <p className="checkout-secure-note">Order reference: {orderId}</p>}
          </section>
          {checkout.items.length > 0 && <CheckoutSummary checkout={checkout} />}
        </div>
      </main>
    </BrowseShell>
  );
};

export default PaymentFailedPage;
