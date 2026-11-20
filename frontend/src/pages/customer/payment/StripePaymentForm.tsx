import { useEffect, useMemo, useRef, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementLocale } from '@stripe/stripe-js';
import { revamp } from '../../../styles/design-tokens';
import { formatMajorAmount } from '../../../utils/currency';

interface Props { clientSecret: string; publishableKey: string; orderId: string; amount: number; currency: string; locale: string; disabled?: boolean; onReturn: () => void }
export default function StripePaymentForm(props: Props) {
  const stripePromise = useMemo(() => loadStripe(props.publishableKey), [props.publishableKey]);
  const locale: StripeElementLocale = ['en', 'de', 'fr', 'it', 'nl', 'hu'].includes(props.locale.split('-')[0]) ? props.locale.split('-')[0] as StripeElementLocale : 'auto';
  return <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret, locale, appearance: { theme: 'stripe', variables: { colorPrimary: revamp.colors.primary, colorText: revamp.colors.text, colorBackground: revamp.colors.surface, borderRadius: '8px', fontFamily: revamp.typography.uiFont } } }}><StripeConfirm {...props} /></Elements>;
}
function StripeConfirm({ orderId, amount, currency, locale, disabled, onReturn }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const confirm = async () => {
    if (lock.current || disabled || !ready || !stripe || !elements) return;
    lock.current = true; setPending(true); setError(''); setStatus('');
    try {
      const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/payment/success?order_id=${encodeURIComponent(orderId)}` } });
      if (!alive.current) return;
      if (result.error) setError(result.error.message || 'The provider could not confirm payment. Review your details.');
      else { setStatus('Provider returned. Checking the server for payment confirmation.'); onReturn(); }
    } catch { if (alive.current) setError('Provider confirmation is unavailable. Check payment status before retrying.'); }
    finally { lock.current = false; if (alive.current) setPending(false); }
  };
  return <section aria-label="Stripe card details"><h2>Card details</h2><p>Gateway: Stripe</p><PaymentElement onReady={() => setReady(true)} onLoadError={event => setError(event.error.message || 'Card fields could not be loaded.')} />
    {!ready && !error && <p role="status">Loading provider fields…</p>}{error && <p className="checkout-error" role="alert">{error}</p>}{status && <p role="status">{status}</p>}
    <button type="button" className="browse-primary browse-full" disabled={disabled || pending || !ready || !stripe || !elements} onClick={confirm}>{pending ? 'Confirming with provider…' : `Confirm ${formatMajorAmount(amount, currency, locale)} with Stripe`}</button>
  </section>;
}
