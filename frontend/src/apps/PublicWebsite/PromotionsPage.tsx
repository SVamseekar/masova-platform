import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';

const PROMOTIONS = [
  {
    id: 1,
    title: 'Weekend Special',
    description: 'Get 20% OFF on all pizzas this weekend!',
    discount: '20% OFF',
    validUntil: 'Valid till Sunday',
    category: 'Pizza',
    accent: '#c62a09',
    accentBg: 'rgba(198,42,9,0.12)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(198,42,9,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 19.5h20L12 2z"/>
        <path d="M12 8v6M9 15h6"/>
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Family Combo',
    description: '2 Large Pizzas + 2 Breads + 2 Drinks at ₹999',
    discount: 'Save ₹300',
    validUntil: 'Limited time offer',
    category: 'Combo',
    accent: '#d4a843',
    accentBg: 'rgba(212,168,67,0.12)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Free Delivery',
    description: 'Free delivery on orders above ₹500',
    discount: 'Free Delivery',
    validUntil: 'All week',
    category: 'Delivery',
    accent: '#4ade80',
    accentBg: 'rgba(74,222,128,0.1)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Biryani Bonanza',
    description: 'Buy 2 Biryanis, Get 1 Raita Free',
    discount: 'Free Raita',
    validUntil: 'Valid till Friday',
    category: 'Biryani',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
  },
  {
    id: 5,
    title: 'Lunch Special',
    description: 'Combo Meal with Main + Bread + Drink at ₹299',
    discount: '₹299 Only',
    validUntil: '12 PM – 3 PM',
    category: 'Combo',
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.1)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    id: 6,
    title: 'Dessert Delight',
    description: 'Order any 2 desserts and get 30% OFF',
    discount: '30% OFF',
    validUntil: 'Valid all week',
    category: 'Desserts',
    accent: '#ec4899',
    accentBg: 'rgba(236,72,153,0.1)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(236,72,153,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: 7,
    title: 'First Order Bonus',
    description: 'New customers get ₹150 OFF on orders above ₹500',
    discount: '₹150 OFF',
    validUntil: 'For new users only',
    category: 'Delivery',
    accent: '#22d3ee',
    accentBg: 'rgba(34,211,238,0.1)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(34,211,238,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 8,
    title: 'Pizza Party Pack',
    description: '4 Medium Pizzas + 4 Drinks at ₹1599',
    discount: 'Save ₹500',
    validUntil: 'Perfect for parties',
    category: 'Pizza',
    accent: '#c62a09',
    accentBg: 'rgba(198,42,9,0.12)',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(198,42,9,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
];

const CATEGORIES = [
  { label: 'All Offers', value: 'all' },
  { label: 'Pizza', value: 'Pizza' },
  { label: 'Biryani', value: 'Biryani' },
  { label: 'Combos', value: 'Combo' },
  { label: 'Desserts', value: 'Desserts' },
  { label: 'Delivery', value: 'Delivery' },
];

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const filtered = selectedCategory === 'all'
    ? PROMOTIONS
    : PROMOTIONS.filter(p => p.category === selectedCategory);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
      <AppHeader
        showPublicNav
        onCartClick={() => setCartDrawerOpen(true)}
      />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 48px' }}>

        {/* Heading */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            background: 'rgba(212,168,67,0.1)',
            border: '1px solid rgba(212,168,67,0.25)',
            borderRadius: 'var(--radius-pill)',
            marginBottom: '16px',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Limited Time
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: 900,
            color: 'var(--text-1)',
            marginBottom: '8px',
            lineHeight: 1.05,
          }}>
            Exclusive <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Deals</span>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem' }}>
            Limited-time offers — grab them before they're gone.
          </p>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '8px 20px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${selectedCategory === cat.value ? 'var(--gold)' : 'var(--border)'}`,
                background: selectedCategory === cat.value ? 'rgba(212,168,67,0.12)' : 'var(--surface)',
                color: selectedCategory === cat.value ? 'var(--gold)' : 'var(--text-2)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat.value) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat.value) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                }
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Promotions grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filtered.map(promo => (
            <div
              key={promo.id}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                transition: 'var(--transition)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}
            >
              {/* Image area — accent-tinted with SVG icon */}
              <div style={{
                height: '160px',
                background: promo.accentBg,
                borderBottom: `1px solid rgba(255,255,255,0.06)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {/* Subtle radial gradient behind icon */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at center, ${promo.accentBg} 0%, transparent 70%)`,
                }} />
                <div style={{ position: 'relative', opacity: 0.8 }}>
                  {promo.icon}
                </div>

                {/* Discount badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: promo.accent,
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.03em',
                  boxShadow: `0 4px 12px ${promo.accentBg}`,
                }}>
                  {promo.discount}
                </div>

                {/* Category chip */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'var(--text-2)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(8px)',
                }}>
                  {promo.category}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--text-1)',
                  marginBottom: '6px',
                }}>
                  {promo.title}
                </h3>
                <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: '6px', lineHeight: 1.5 }}>
                  {promo.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', margin: 0 }}>
                    {promo.validUntil}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/menu')}
                  style={{
                    background: 'transparent',
                    color: promo.accent,
                    border: `1px solid ${promo.accent}`,
                    borderRadius: 'var(--radius-pill)',
                    padding: '8px 20px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = promo.accentBg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  Order Now
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  );
};

export default PromotionsPage;
