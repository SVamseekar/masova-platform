import { useState } from 'react';
import { ArrowRight, BarChart3, Building2, Check, Store } from 'lucide-react';
import { PRICING_TIERS, openContactForm } from '../constants';
import { revampCssVariables } from '../../../styles/design-tokens';
import './PricingSection.css';

// Approved plan comparison; purchasing and annual terms are confirmed in a walkthrough.
const planDetails = {
  Starter: { icon: Store, features: ['Up to 1 restaurant', 'Orders from websites and aggregators', 'Kitchen and delivery management', 'Stripe and Razorpay payments', 'Basic analytics', 'Email support'] },
  Growth: { icon: BarChart3, features: ['Up to 3 locations', 'All Starter features', 'Advanced analytics and reporting', 'Customer chat and manager insights', 'Delivery zones and dynamic pricing', 'Priority support'] },
  Enterprise: { icon: Building2, features: ['Multi-location groups with custom requirements', 'All Growth features', 'Custom integrations (API)', 'Dedicated account manager', 'Custom training and onboarding', 'Dedicated support'] },
};

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return <section id="pricing" className="product-pricing" style={revampCssVariables} aria-labelledby="product-pricing-title">
    <div className="product-pricing-inner">
      <header className="product-pricing-header">
        <p className="product-pricing-eyebrow">Pricing</p>
        <h2 id="product-pricing-title">Simple, transparent pricing for restaurants</h2>
        <p>Choose the plan that fits your restaurant.</p>
        <div className="product-pricing-billing" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
          <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Annual</button>
        </div>
        <p className="product-pricing-note" role="status">{annual
          ? 'Annual pricing is confirmed during your walkthrough.'
          : 'Monthly prices shown. Confirm your requirements during a walkthrough.'}</p>
      </header>
      <div className="product-pricing-plans">
        {PRICING_TIERS.map(({ name, price }) => {
          const details = planDetails[name as keyof typeof planDetails];
          const Icon = details.icon;
          return <article key={name} className={'product-pricing-plan' + (name === 'Growth' ? ' product-pricing-growth' : '')} aria-labelledby={'pricing-' + name}>
            <div className="product-pricing-plan-heading"><Icon size={28} aria-hidden="true" /><h3 id={'pricing-' + name}>{name}</h3></div>
            <p className="product-pricing-price">{price === null ? 'Custom' : annual ? 'Request a quote' : <><strong>€{price}</strong><span>/month</span></>}</p>
            <ul>{details.features.map(feature => <li key={feature}><Check size={18} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
            <button type="button" onClick={() => openContactForm()}>Book a walkthrough <ArrowRight size={18} aria-hidden="true" /></button>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
