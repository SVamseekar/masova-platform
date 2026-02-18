import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';

const CATEGORIES = [
  { label: 'South Indian', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M8 12h8M12 8v8"/>
    </svg>
  )},
  { label: 'North Indian', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  )},
  { label: 'Pizza', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 19.5h20L12 2z"/>
      <path d="M12 2v17.5"/>
    </svg>
  )},
  { label: 'Chinese', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  )},
  { label: 'Burgers', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <path d="M3 6h18"/>
      <path d="M3 18h18"/>
    </svg>
  )},
  { label: 'Desserts', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M5 8H4a4 4 0 0 0 0 8h1"/>
      <line x1="8" y1="8" x2="8" y2="16"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="16" y1="8" x2="16" y2="16"/>
    </svg>
  )},
  { label: 'Beverages', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
    </svg>
  )},
];

const POPULAR_ITEMS = [
  {
    name: 'Masala Dosa',
    desc: 'Crispy crepe with spiced potato filling',
    price: '₹149',
    accent: 'rgba(212,168,67,0.15)',
    accentBorder: 'rgba(212,168,67,0.4)',
  },
  {
    name: 'Chicken Biryani',
    desc: 'Aromatic basmati rice with tender chicken',
    price: '₹299',
    accent: 'rgba(198,42,9,0.15)',
    accentBorder: 'rgba(198,42,9,0.4)',
  },
  {
    name: 'Margherita Pizza',
    desc: 'San Marzano tomato, fresh mozzarella',
    price: '₹349',
    accent: 'rgba(74,222,128,0.1)',
    accentBorder: 'rgba(74,222,128,0.3)',
  },
  {
    name: 'Chocolate Lava Cake',
    desc: 'Warm molten centre, vanilla ice cream',
    price: '₹199',
    accent: 'rgba(139,92,246,0.12)',
    accentBorder: 'rgba(139,92,246,0.35)',
  },
];

const FEATURES = [
  {
    title: 'Fresh Every Day',
    desc: 'Ingredients sourced daily from local markets — no frozen shortcuts.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: '30-Min Delivery',
    desc: 'Real-time tracking. Your food arrives hot, every time.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    title: 'Easy Ordering',
    desc: 'Browse, customise, checkout in under 2 minutes. No fuss.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
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

        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '64px' }}>
          {/* Left — editorial text column */}
          <div style={{ flex: 1 }}>
            {/* Eyebrow */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(212,168,67,0.1)',
              border: '1px solid rgba(212,168,67,0.25)',
              borderRadius: 'var(--radius-pill)',
              marginBottom: '24px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Hyderabad's Finest Delivery
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 5vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: 'var(--text-1)',
              marginBottom: '12px',
            }}>
              It's not just Food,
            </h1>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 5vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: 'var(--gold)',
              fontStyle: 'italic',
              marginBottom: '28px',
            }}>
              It's an Experience.
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', marginBottom: '36px', maxWidth: '480px', lineHeight: 1.7 }}>
              Fresh ingredients, bold flavours, delivered to your door in 30 minutes or less.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/menu')}
                style={{
                  background: 'var(--red)',
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '15px 36px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                Order Now
              </button>
              <button
                onClick={() => navigate('/promotions')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  fontSize: '1rem',
                  padding: '15px 36px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
              >
                View Deals
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '40px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex' }}>
                {['#c62a09', '#d4a843', '#2d6a4f'].map((c, i) => (
                  <div key={i} style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: c, border: '2px solid var(--bg)',
                    marginLeft: i > 0 ? '-12px' : '0',
                  }} />
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem', marginLeft: '4px' }}>4.9</span>
                </div>
                <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>2,400+ happy customers</span>
              </div>
            </div>
          </div>

          {/* Right: abstract food visual — dark editorial panel */}
          <div style={{ flexShrink: 0, position: 'relative' }}>
            {/* Main panel */}
            <div style={{
              width: '420px',
              height: '520px',
              borderRadius: '200px 200px 120px 120px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0 80px rgba(212,168,67,0.1), 0 40px 80px rgba(0,0,0,0.5)',
            }}>
              {/* Gold gradient top sweep */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '50%',
                background: 'linear-gradient(180deg, rgba(212,168,67,0.12) 0%, transparent 100%)',
              }} />
              {/* Decorative circles */}
              <div style={{
                position: 'absolute',
                top: '30px', left: '50%', transform: 'translateX(-50%)',
                width: '180px', height: '180px',
                borderRadius: '50%',
                border: '1px solid rgba(212,168,67,0.2)',
              }} />
              <div style={{
                position: 'absolute',
                top: '50px', left: '50%', transform: 'translateX(-50%)',
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: 'rgba(212,168,67,0.06)',
                border: '1px solid rgba(212,168,67,0.15)',
              }} />
              {/* MaSoVa wordmark overlay */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  color: 'var(--gold)',
                  lineHeight: 1,
                  opacity: 0.15,
                  letterSpacing: '-0.02em',
                }}>
                  MaSoVa
                </div>
              </div>
              {/* Bottom stats strip */}
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                padding: '24px',
                background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-around',
              }}>
                {[{ val: '30', unit: 'min', label: 'Avg Delivery' }, { val: '50+', unit: '', label: 'Menu Items' }, { val: '5', unit: '', label: 'Locations' }].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1 }}>
                      {stat.val}<span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{stat.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-24px',
              background: 'var(--red)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.78rem',
              boxShadow: '0 8px 24px rgba(198,42,9,0.4)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Live Now
            </div>

            {/* Floating order card */}
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-32px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '14px 20px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              minWidth: '190px',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Latest Order
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.875rem', marginBottom: '4px' }}>
                Chicken Biryani
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>Out for delivery</span>
              </div>
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
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                fontSize: '0.875rem',
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
              {cat.icon}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
                fontWeight: 700,
                color: 'var(--text-1)',
                marginBottom: '6px',
              }}>
                Our Best <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Delivered</span>
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Crowd favourites, made fresh daily</p>
            </div>
            <button
              onClick={() => navigate('/menu')}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.875rem',
                padding: '10px 24px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
            >
              Full Menu
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {POPULAR_ITEMS.map((item) => (
              <div
                key={item.name}
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  transition: 'var(--transition)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                onClick={() => navigate('/menu')}
              >
                {/* Color-accented image area */}
                <div style={{
                  height: '120px',
                  background: item.accent,
                  borderBottom: `1px solid ${item.accentBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  {/* Abstract plate graphic */}
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    border: `2px solid ${item.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: item.accentBorder,
                      opacity: 0.5,
                    }} />
                  </div>
                </div>

                <div style={{ padding: '16px 18px 18px' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px', fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>
                    {item.name}
                  </p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginBottom: '14px', lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: '1.05rem' }}>
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
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.35)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(212,168,67,0.08)',
                border: '1px solid rgba(212,168,67,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                {feat.icon}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.15rem',
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
