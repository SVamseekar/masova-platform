import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';

/* ─────────────────── Data ─────────────────── */

const MENU_ITEMS = [
  {
    name: 'Masala Dosa',
    cuisine: 'South Indian',
    price: '₹149',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80',
    ring: '#d97706',
    tag: "Chef's Pick",
  },
  {
    name: 'Chicken Biryani',
    cuisine: 'North Indian',
    price: '₹299',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    ring: '#f59e0b',
    tag: 'Bestseller',
  },
  {
    name: 'Margherita Pizza',
    cuisine: 'Italian',
    price: '₹349',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
    ring: '#ef4444',
    tag: 'New',
  },
  {
    name: 'Hakka Noodles',
    cuisine: 'Indo-Chinese',
    price: '₹199',
    imageUrl: 'https://images.unsplash.com/photo-1617622141675-d3005b9067c5?w=400&q=80',
    ring: '#84cc16',
    tag: '',
  },
  {
    name: 'Chicken Burger',
    cuisine: 'American',
    price: '₹249',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    ring: '#fb923c',
    tag: 'Popular',
  },
  {
    name: 'Chocolate Lava Cake',
    cuisine: 'Desserts',
    price: '₹199',
    imageUrl: 'https://images.unsplash.com/photo-1633981823231-2a2a7c9b014c?w=400&q=80',
    ring: '#a78bfa',
    tag: '',
  },
];

const CATEGORIES = [
  { label: 'South Indian', filter: 'SOUTH_INDIAN' },
  { label: 'North Indian', filter: 'NORTH_INDIAN' },
  { label: 'Pizza', filter: 'PIZZA' },
  { label: 'Chinese', filter: 'CHINESE' },
  { label: 'Burgers', filter: 'BURGERS' },
  { label: 'Desserts', filter: 'DESSERTS' },
  { label: 'Beverages', filter: 'BEVERAGES' },
];

const FEATURES = [
  {
    title: 'Quality Ingredients',
    desc: 'Sourced fresh every morning from local farms and markets.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: '30-Min Delivery',
    desc: 'GPS-tracked riders. Your food arrives hot, guaranteed.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    title: 'Live Order Tracking',
    desc: 'Watch your order go from kitchen to your door in real time.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    title: 'Easy Reordering',
    desc: 'One tap to reorder your favourites. No fuss, no wait.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
      </svg>
    ),
  },
];

const FOOTER_LINKS = {
  Explore: ['Menu', 'Promotions', 'Track Order'],
  Support: ['Contact Us', 'FAQs', 'Privacy Policy'],
};

/* ─────────────────── Food image circle ─────────────────── */

interface FoodCircleProps {
  src: string;
  alt: string;
  size: number;
  ring?: string;
  shadow?: string;
  border?: string;
}

const FoodCircle: React.FC<FoodCircleProps> = ({ src, alt, size, ring = 'rgba(212,168,67,0.3)', shadow, border }) => {
  const [errored, setErrored] = useState(false);
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0,
      border: border ?? `2px solid ${ring}`,
      boxShadow: shadow ?? `0 0 0 1px ${ring}44, 0 8px 32px rgba(0,0,0,0.7)`,
      position: 'relative',
      background: '#1C1916',
    }}>
      {!errored ? (
        <img
          src={src}
          alt={alt}
          onError={() => setErrored(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        /* Fallback: dark gradient circle if image fails */
        <div style={{
          width: '100%', height: '100%',
          background: 'radial-gradient(circle at 38% 30%, rgba(212,168,67,0.3) 0%, rgba(212,168,67,0.05) 55%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
      )}
    </div>
  );
};

/* ─────────────────── Component ─────────────────── */

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}>
      <AppHeader showPublicNav onCartClick={() => setCartDrawerOpen(true)} />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background textures */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
        }} />
        {/* Left gold glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '-5%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Right red glow */}
        <div style={{
          position: 'absolute', top: '10%', right: '-10%',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198,42,9,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '40px' }}>

          {/* LEFT ── Text content */}
          <div style={{ flex: 1, zIndex: 1 }}>
            {/* Eyebrow badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px',
              background: 'rgba(212,168,67,0.1)',
              border: '1px solid rgba(212,168,67,0.3)',
              borderRadius: 'var(--radius-pill)',
              marginBottom: '28px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 6px var(--gold)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Hyderabad's Finest Delivery
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1.0,
              color: 'var(--text-1)',
              marginBottom: '0',
            }}>
              Your Go-To Spot
            </h1>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1.0,
              color: 'var(--text-1)',
              marginBottom: '8px',
            }}>
              for <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Quick</span> and
            </h1>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1.0,
              color: 'var(--red)',
              marginBottom: '28px',
              fontStyle: 'italic',
            }}>
              Tasty Eats!
            </h1>

            <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', marginBottom: '36px', maxWidth: '440px', lineHeight: 1.75 }}>
              Fresh ingredients, bold flavours, delivered to your door in 30 minutes or less. No compromises.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <button
                onClick={() => navigate('/menu')}
                style={{
                  background: 'var(--gold)',
                  color: '#0a0a0a',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '14px 32px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold-light)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                Order Now
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <button
                onClick={() => navigate('/promotions')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  padding: '14px 32px',
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

          </div>

          {/* RIGHT ── Chef photo + floating food circles */}
          <div style={{ flexShrink: 0, position: 'relative', width: '520px', height: '580px' }}>

            {/* Warm glow behind chef */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '420px', height: '420px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 60%, rgba(212,168,67,0.07) 0%, rgba(198,42,9,0.04) 50%, transparent 75%)',
              pointerEvents: 'none',
            }} />

            {/* Chef photo — full body, transparent-bg style via object-fit + dark bg removal */}
            <img
              src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=700&q=90"
              alt="Chef"
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-48%)',
                height: '92%',
                width: 'auto',
                objectFit: 'cover',
                objectPosition: 'top center',
                filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.85))',
                zIndex: 5,
                borderRadius: '0 0 0 0',
              }}
            />

            {/* Floating food circle — top-left: Masala Dosa */}
            <div style={{
              position: 'absolute',
              top: '6%', left: '0%',
              zIndex: 10,
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))',
            }}>
              <FoodCircle
                src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=220&q=85"
                alt="Masala Dosa"
                size={108}
                ring="rgba(217,119,6,0.5)"
                border="3px solid rgba(217,119,6,0.4)"
                shadow="0 6px 24px rgba(0,0,0,0.7)"
              />
            </div>

            {/* Floating food circle — mid-left: Biryani */}
            <div style={{
              position: 'absolute',
              top: '42%', left: '-4%',
              zIndex: 10,
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))',
            }}>
              <FoodCircle
                src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=220&q=85"
                alt="Chicken Biryani"
                size={96}
                ring="rgba(245,158,11,0.5)"
                border="3px solid rgba(245,158,11,0.4)"
                shadow="0 6px 24px rgba(0,0,0,0.7)"
              />
            </div>

            {/* Floating food circle — top-right: Pizza */}
            <div style={{
              position: 'absolute',
              top: '10%', right: '0%',
              zIndex: 10,
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))',
            }}>
              <FoodCircle
                src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=220&q=85"
                alt="Margherita Pizza"
                size={100}
                ring="rgba(239,68,68,0.5)"
                border="3px solid rgba(239,68,68,0.4)"
                shadow="0 6px 24px rgba(0,0,0,0.7)"
              />
            </div>

            {/* Floating food circle — mid-right: Lava Cake */}
            <div style={{
              position: 'absolute',
              top: '46%', right: '0%',
              zIndex: 10,
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))',
            }}>
              <FoodCircle
                src="https://images.unsplash.com/photo-1633981823231-2a2a7c9b014c?w=220&q=85"
                alt="Chocolate Lava Cake"
                size={88}
                ring="rgba(167,139,250,0.5)"
                border="3px solid rgba(167,139,250,0.4)"
                shadow="0 6px 24px rgba(0,0,0,0.7)"
              />
            </div>

            {/* "Live Now" badge */}
            <div style={{
              position: 'absolute', top: '4%', right: '20%',
              background: 'var(--red)',
              color: '#fff', padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: '0.75rem', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 24px rgba(198,42,9,0.5)',
              display: 'flex', alignItems: 'center', gap: '6px',
              zIndex: 20,
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', opacity: 0.85 }} />
              Live Now
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORY PILLS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '60px 48px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 2.5vw, 2.4rem)', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
              What are you <span style={{ color: 'var(--gold)' }}>craving?</span>
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Browse by cuisine</p>
          </div>
          <button
            onClick={() => navigate('/menu')}
            style={{
              background: 'transparent', border: '1px solid var(--border-strong)',
              color: 'var(--text-2)', fontFamily: 'var(--font-body)', fontWeight: 500,
              fontSize: '0.85rem', padding: '9px 22px', borderRadius: 'var(--radius-pill)',
              cursor: 'pointer', transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
          >
            View All
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.filter;
            return (
              <button
                key={cat.label}
                onClick={() => { setActiveCategory(active ? '' : cat.filter); navigate(`/menu${active ? '' : `?cuisine=${cat.filter}`}`); }}
                style={{
                  padding: '10px 22px',
                  background: active ? 'rgba(212,168,67,0.15)' : 'var(--surface)',
                  border: `1px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 'var(--radius-pill)',
                  color: active ? 'var(--gold)' : 'var(--text-2)',
                  fontFamily: 'var(--font-body)', fontWeight: 500,
                  fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface-2)'; el.style.borderColor = 'rgba(255,255,255,0.15)'; el.style.color = 'var(--text-1)'; el.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.color = 'var(--text-2)'; el.style.transform = 'translateY(0)'; } }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MENU CAROUSEL — real food photos
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '56px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Delicious Food Category Items
              </p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 700, color: 'var(--text-1)' }}>
                Our <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Popular</span> Menu
              </h2>
            </div>
            {/* Carousel arrows */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['left', 'right'] as const).map(dir => (
                <button
                  key={dir}
                  onClick={() => scrollCarousel(dir)}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: dir === 'right' ? 'var(--gold)' : 'var(--surface-2)',
                    border: `1px solid ${dir === 'right' ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                    color: dir === 'right' ? '#0a0a0a' : 'var(--text-2)',
                    cursor: 'pointer', transition: 'var(--transition)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {dir === 'left'
                      ? <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>
                      : <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
                    }
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable carousel — no scrollbar */}
        <div
          ref={carouselRef}
          style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            paddingLeft: '48px',
            paddingRight: '48px',
            paddingBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {MENU_ITEMS.map((item) => (
            <div
              key={item.name}
              onClick={() => navigate('/menu')}
              style={{
                flexShrink: 0,
                width: '210px',
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '80px',
                paddingBottom: '20px',
                paddingLeft: '20px',
                paddingRight: '20px',
                position: 'relative',
                marginTop: '70px',
                cursor: 'pointer',
                transition: 'var(--transition)',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = item.ring + '55'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${item.ring}22`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              {/* Food photo breaking out of top */}
              <div style={{
                position: 'absolute',
                top: '-70px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}>
                <FoodCircle
                  src={item.imageUrl}
                  alt={item.name}
                  size={140}
                  ring={item.ring + '55'}
                  border={`3px solid ${item.ring}44`}
                  shadow={`0 0 0 1px ${item.ring}22, 0 8px 32px rgba(0,0,0,0.8)`}
                />
                {/* Gold + button on plate */}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/menu'); }}
                  style={{
                    position: 'absolute',
                    bottom: '-2px', right: '-2px',
                    width: '34px', height: '34px',
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    border: '2px solid var(--surface-2)',
                    color: '#0a0a0a',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'var(--transition)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold-light)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              {/* Tag badge */}
              {item.tag && (
                <div style={{
                  position: 'absolute',
                  top: '16px', right: '14px',
                  background: item.ring + '22',
                  border: `1px solid ${item.ring}55`,
                  color: item.ring,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.62rem', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {item.tag}
                </div>
              )}

              {/* Text */}
              <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '2px', fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>
                {item.name}
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginBottom: '14px' }}>
                {item.cuisine}
              </p>
              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '10px' }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.1rem' }}>
                {item.price}
              </p>
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
              fontWeight: 500, fontSize: '0.9rem',
              padding: '12px 28px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer', transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
          >
            Explore Full Menu →
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          YOUR FOOD AT YOUR DOOR
      ══════════════════════════════════════════ */}
      <section style={{ padding: '80px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '64px', flexWrap: 'wrap' }}>
          {/* Left: food image composition */}
          <div style={{ position: 'relative', flexShrink: 0, width: '340px', height: '340px' }}>
            {/* Main dish — Butter Chicken */}
            <FoodCircle
              src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=85"
              alt="Butter Chicken"
              size={320}
              ring="rgba(198,42,9,0.3)"
              border="3px solid rgba(198,42,9,0.2)"
              shadow="0 0 0 2px rgba(198,42,9,0.12), 0 0 80px rgba(198,42,9,0.12), 0 40px 80px rgba(0,0,0,0.7)"
            />
            {/* Discount sticker */}
            <div style={{
              position: 'absolute', top: '-10px', right: '-10px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--gold)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(212,168,67,0.5)',
              border: '2px solid rgba(255,255,255,0.1)',
              zIndex: 2,
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', color: '#0a0a0a', lineHeight: 1 }}>30%</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#0a0a0a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OFF</span>
            </div>
            {/* Small floating dish — Mango Lassi */}
            <div style={{ position: 'absolute', bottom: '-10px', right: '-20px', zIndex: 1 }}>
              <FoodCircle
                src="https://images.unsplash.com/photo-1546173159-315724a31696?w=200&q=80"
                alt="Mango Lassi"
                size={90}
                ring="rgba(251,146,60,0.4)"
                border="2px solid rgba(251,146,60,0.35)"
                shadow="0 4px 16px rgba(0,0,0,0.6)"
              />
            </div>
          </div>

          {/* Right: Text + feature list */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <p style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Fast & Reliable
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--text-1)',
              marginBottom: '16px',
            }}>
              Your food, at your door{' '}
              <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>in just 30 minutes</span>
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '36px', maxWidth: '460px' }}>
              We take food seriously. That means real-time GPS tracking, insulated packaging, and riders who care about your order as much as you do.
            </p>

            {/* Feature cards — horizontal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {FEATURES.map(feat => (
                <div
                  key={feat.title}
                  style={{
                    padding: '20px',
                    background: 'var(--surface)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.25)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(212,168,67,0.08)',
                    border: '1px solid rgba(212,168,67,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '14px',
                  }}>
                    {feat.icon}
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)', marginBottom: '6px' }}>
                    {feat.title}
                  </h4>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOT OFFER BANNER
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '64px 48px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {/* Food image + sticker */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <FoodCircle
              src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=85"
              alt="Margherita Pizza"
              size={280}
              ring="rgba(239,68,68,0.3)"
              border="2px solid rgba(239,68,68,0.2)"
              shadow="0 0 0 2px rgba(239,68,68,0.1), 0 0 60px rgba(239,68,68,0.1), 0 30px 60px rgba(0,0,0,0.7)"
            />
            {/* Offer sticker */}
            <div style={{
              position: 'absolute', top: '-16px', left: '-16px',
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'var(--red)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(198,42,9,0.5)',
              border: '2px solid rgba(255,255,255,0.08)',
              transform: 'rotate(-15deg)',
              zIndex: 2,
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', color: '#fff', lineHeight: 1 }}>20%</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OFF</span>
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <p style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Weekend Special
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 700, lineHeight: 1.1,
              color: 'var(--text-1)', marginBottom: '16px',
            }}>
              <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Hot Offer</span>{' '}
              of the Week —{' '}
              <br />Grab it before it's gone!
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '28px', maxWidth: '420px' }}>
              This weekend, enjoy 20% off on all pizzas. Use code <span style={{ fontWeight: 700, color: 'var(--gold)' }}>PIZZA20</span> at checkout.
            </p>
            <button
              onClick={() => navigate('/promotions')}
              style={{
                background: 'var(--gold)',
                color: '#0a0a0a', fontFamily: 'var(--font-body)',
                fontWeight: 700, fontSize: '0.9rem',
                padding: '13px 32px',
                borderRadius: 'var(--radius-pill)',
                border: 'none', cursor: 'pointer',
                transition: 'var(--transition)',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold-light)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              Claim Offer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '48px 48px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '8px' }}>MaSoVa</div>
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
                  >{link}</div>
                ))}
              </div>
            ))}
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: '16px', fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                Stay Updated
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email" placeholder="Your email"
                  style={{ flex: 1, padding: '10px 16px', background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-pill)', color: 'var(--text-1)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none' }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button
                  style={{ padding: '10px 20px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'var(--transition)' }}
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

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} onCheckout={() => navigate('/checkout')} />
    </div>
  );
};

export default HomePage;
