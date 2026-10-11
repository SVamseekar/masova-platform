import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRound, UserPlus, ShoppingBag } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { useAppSelector } from '../../store/hooks';
import { getDefaultDashboard } from '../../utils/security';
import CheckoutSummary from './components/CheckoutSummary';
import { useCheckoutStore } from './components/checkoutContext';
import './components/Checkout.css';

export default function CheckoutPage() {
  const checkout = useCheckoutStore();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const [choice, setChoice] = useState('signin');
  const customer = isAuthenticated && user?.type === 'CUSTOMER';
  useEffect(() => {
    if (isAuthenticated && user && user.type !== 'CUSTOMER') navigate(getDefaultDashboard(user.type, user.role), { replace: true });
  }, [isAuthenticated, navigate, user]);
  const proceed = () => {
    if (!checkout.ready || !checkout.items.length) return;
    if (customer || choice === 'guest') navigate('/guest-checkout');
    else navigate(choice === 'signin' ? '/customer-login' : '/register', { state: { from: '/checkout' } });
  };
  return <BrowseShell><main className="checkout-page">
    <Link to="/menu">Back to menu</Link>
    <div className="checkout-heading"><h1>Checkout</h1><p>Choose how you’d like to continue.</p></div>
    <div className="checkout-columns"><section className="checkout-form" aria-label="Checkout options">
      {checkout.stores.isLoading && <p role="status">Loading store details…</p>}
      {checkout.stores.isError && <div className="checkout-error" role="alert"><p>Store details could not be loaded.</p><button type="button" onClick={() => checkout.stores.refetch()}>Retry store</button></div>}
      {!checkout.items.length && <p role="status">Your cart is empty. <Link to="/menu">Browse menu</Link></p>}
      {!checkout.ready && !checkout.stores.isLoading && !checkout.stores.isError && <p role="status">Choose an available store before continuing.</p>}
      {customer ? <p>Continue with your account, {user.name}.</p> : <fieldset><legend className="sr-only">Continue checkout as</legend>
        {[{ id: 'signin', title: 'Sign in', description: 'Use your account and saved addresses.', Icon: UserRound }, { id: 'register', title: 'Create account', description: 'Create your account before checkout.', Icon: UserPlus }, { id: 'guest', title: 'Continue as guest', description: 'Enter contact details for this order.', Icon: ShoppingBag }].map(({ id, title, description, Icon }) => <label className="checkout-choice" key={id}><Icon size={24} aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span><input type="radio" name="checkout-choice" value={id} checked={choice === id} onChange={() => setChoice(id)} /></label>)}
      </fieldset>}
      <button type="button" className="browse-primary browse-full" disabled={!checkout.ready || !checkout.items.length || (isAuthenticated && !customer)} onClick={proceed}>Continue</button>
    </section><CheckoutSummary checkout={checkout} /></div>
  </main></BrowseShell>;
}
