import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';

const PROMOTIONS = [
  { id: 1, title: 'Weekend Special', description: 'Get 20% OFF on all pizzas this weekend!', discount: '20% OFF', validUntil: 'Valid till Sunday', category: 'Pizza', emoji: '🍕' },
  { id: 2, title: 'Family Combo', description: '2 Large Pizzas + 2 Breads + 2 Drinks at ₹999', discount: 'Save ₹300', validUntil: 'Limited time offer', category: 'Combo', emoji: '🍽️' },
  { id: 3, title: 'Free Delivery', description: 'Free delivery on orders above ₹500', discount: 'Free Delivery', validUntil: 'All week', category: 'Delivery', emoji: '🚀' },
  { id: 4, title: 'Biryani Bonanza', description: 'Buy 2 Biryanis, Get 1 Raita Free', discount: 'Free Raita', validUntil: 'Valid till Friday', category: 'Biryani', emoji: '🍚' },
  { id: 5, title: 'Lunch Special', description: 'Combo Meal with Main + Bread + Drink at ₹299', discount: '₹299 Only', validUntil: '12 PM – 3 PM', category: 'Combo', emoji: '🥗' },
  { id: 6, title: 'Dessert Delight', description: 'Order any 2 desserts and get 30% OFF', discount: '30% OFF', validUntil: 'Valid all week', category: 'Desserts', emoji: '🍰' },
  { id: 7, title: 'First Order Bonus', description: 'New customers get ₹150 OFF on orders above ₹500', discount: '₹150 OFF', validUntil: 'For new users only', category: 'Delivery', emoji: '🎁' },
  { id: 8, title: 'Pizza Party Pack', description: '4 Medium Pizzas + 4 Drinks at ₹1599', discount: 'Save ₹500', validUntil: 'Perfect for parties', category: 'Pizza', emoji: '🎉' },
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
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3.5rem)',
          fontWeight: 900,
          color: 'var(--text-1)',
          marginBottom: '8px',
        }}>
          Exclusive <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Deals</span>
        </h1>
        <p style={{ color: 'var(--text-2)', marginBottom: '32px', fontSize: '1rem' }}>
          Limited-time offers — grab them before they're gone.
        </p>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
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
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Image area */}
              <div style={{
                height: '200px',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem',
                position: 'relative',
              }}>
                {promo.emoji}
                {/* Discount badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--red)',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-body)',
                }}>
                  {promo.discount}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'var(--text-1)',
                  marginBottom: '6px',
                }}>
                  {promo.title}
                </h3>
                <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: '6px', lineHeight: 1.5 }}>
                  {promo.description}
                </p>
                <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginBottom: '16px' }}>
                  {promo.validUntil}
                </p>
                <button
                  onClick={() => navigate('/menu')}
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '8px 20px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                >
                  Order Now
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
