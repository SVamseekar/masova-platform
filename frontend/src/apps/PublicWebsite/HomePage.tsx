import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';

const CATEGORIES = [
  { label: 'South Indian', emoji: '🍛' },
  { label: 'North Indian', emoji: '🫓' },
  { label: 'Pizza', emoji: '🍕' },
  { label: 'Chinese', emoji: '🥡' },
  { label: 'Burgers', emoji: '🍔' },
  { label: 'Desserts', emoji: '🍰' },
  { label: 'Beverages', emoji: '🧋' },
];

const POPULAR_ITEMS = [
  { name: 'Masala Dosa', desc: 'Crispy crepe with spiced potato filling', price: '₹149', emoji: '🥞' },
  { name: 'Chicken Biryani', desc: 'Aromatic basmati rice with tender chicken', price: '₹299', emoji: '🍚' },
  { name: 'Margherita Pizza', desc: 'San Marzano tomato, fresh mozzarella', price: '₹349', emoji: '🍕' },
  { name: 'Chocolate Lava Cake', desc: 'Warm molten centre, vanilla ice cream', price: '₹199', emoji: '🍫' },
];

const FEATURES = [
  { icon: '🌿', title: 'Fresh Every Day', desc: 'Ingredients sourced daily from local markets — no frozen shortcuts.' },
  { icon: '⚡', title: '30-Min Delivery', desc: 'Real-time tracking. Your food arrives hot, every time.' },
  { icon: '✨', title: 'Easy Ordering', desc: 'Browse, customise, checkout in under 2 minutes. No fuss.' },
];

const FOOTER_LINKS = {
  Explore: ['Menu', 'Promotions', 'Track Order'],
  Support: ['Contact Us', 'FAQs', 'Privacy Policy'],
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}>
      <AppHeader
        showPublicNav
        onCartClick={() => setCartDrawerOpen(true)}
      />

      {/* ── Hero ── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grain texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />
        {/* Radial gold glow */}
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '48px' }}>
          {/* Left */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 5vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: 'var(--text-1)',
              marginBottom: '24px',
            }}>
              it's not just Food,{' '}
              <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>It's an Experience.</span>
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', marginBottom: '32px', maxWidth: '480px', lineHeight: 1.7 }}>
              Fresh ingredients, bold flavours, delivered to your door in 30 minutes or less.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/menu')}
                style={{
                  background: 'var(--red)',
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '14px 32px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                View Menu
              </button>
              <button
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  fontSize: '1rem',
                  padding: '14px 32px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
              >
                Our Story
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
              <div style={{ display: 'flex' }}>
                {['#E53E3E', '#D4A843', '#4CAF50'].map((c, i) => (
                  <div key={i} style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: c, border: '2px solid var(--bg)',
                    marginLeft: i > 0 ? '-12px' : '0',
                  }} />
                ))}
              </div>
              <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>4.9★</span> from 2,400+ happy customers
              </span>
            </div>
          </div>

          {/* Right: circular hero image */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              width: '440px',
              height: '440px',
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9rem',
              boxShadow: '0 0 80px rgba(212,168,67,0.12), var(--shadow-card)',
            }}>
              🍜
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Pills ── */}
      <section style={{ padding: '64px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
          fontWeight: 700,
          marginBottom: '8px',
          color: 'var(--text-1)',
        }}>
          What are you <span style={{ color: 'var(--gold)' }}>craving?</span>
        </h2>
        <p style={{ color: 'var(--text-2)', marginBottom: '32px', fontSize: '1rem' }}>
          Browse by cuisine — something for every mood
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate(`/menu?cuisine=${cat.label.toUpperCase().replace(' ', '_')}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'var(--surface-2)';
                el.style.borderColor = 'var(--gold)';
                el.style.color = 'var(--gold)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'var(--surface)';
                el.style.borderColor = 'var(--border)';
                el.style.color = 'var(--text-2)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Popular Items ── */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '64px 48px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
            fontWeight: 700,
            marginBottom: '32px',
            color: 'var(--text-1)',
          }}>
            Our Best <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Delivered</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '48px 24px' }}>
            {POPULAR_ITEMS.map((item) => (
              <div
                key={item.name}
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border)',
                  paddingTop: '52px',
                  paddingBottom: '20px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  position: 'relative',
                  marginTop: '40px',
                  transition: 'var(--transition)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                onClick={() => navigate('/menu')}
              >
                {/* Circular emoji breaking out of top */}
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--surface-3)',
                  border: '3px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.25rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                }}>
                  {item.emoji}
                </div>
                <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
                  {item.name}
                </p>
                <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginBottom: '16px', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: '1.1rem' }}>
                    {item.price}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/menu'); }}
                    style={{
                      width: '32px', height: '32px',
                      borderRadius: '50%',
                      background: 'var(--red)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              onClick={() => navigate('/menu')}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.95rem',
                padding: '12px 28px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
            >
              View Full Menu →
            </button>
          </div>
        </div>
      </section>

      {/* ── Why MaSoVa ── */}
      <section style={{ padding: '80px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '48px',
          color: 'var(--text-1)',
        }}>
          Why <span style={{ color: 'var(--gold)' }}>MaSoVa?</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              style={{
                padding: '32px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border)',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{feat.icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.2rem',
                color: 'var(--text-1)',
                marginBottom: '8px',
              }}>
                {feat.title}
              </h3>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '48px 48px 24px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '8px' }}>
                MaSoVa
              </div>
              <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', maxWidth: '260px', lineHeight: 1.6 }}>
                Modern flavours, timeless quality. Delivered to your door.
              </p>
            </div>
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: '16px', fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  {heading}
                </div>
                {links.map(link => (
                  <div key={link} style={{ color: 'var(--text-3)', marginBottom: '8px', fontSize: '0.875rem', cursor: 'pointer', transition: 'var(--transition)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
                  >
                    {link}
                  </div>
                ))}
              </div>
            ))}
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: '16px', fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                Stay Updated
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="Your email"
                  style={{
                    flex: 1, padding: '10px 16px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                />
                <button
                  style={{
                    padding: '10px 20px',
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>© 2026 MaSoVa. All rights reserved.</span>
            <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>Crafted with care for food lovers</span>
          </div>
        </div>
      </footer>

      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  );
};

export default HomePage;
