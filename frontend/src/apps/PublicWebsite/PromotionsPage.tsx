import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';

// ─── Deal data ─────────────────────────────────────────────────────────────
const HERO_DEAL = {
  id: 0,
  title: 'Weekend Mega Deal',
  headline: 'Any 2 Large Pizzas',
  subline: '+ 2 Drinks + Free Garlic Bread',
  originalPrice: '₹1,499',
  dealPrice: '₹899',
  savings: 'Save ₹600',
  endsIn: 'Ends Sunday midnight',
  badge: 'Best Seller',
  gradient: 'linear-gradient(135deg, #1C0800 0%, #3D1500 60%, #0A0400 100%)',
  accent: '#f97316',
  plateGradient: 'radial-gradient(circle at 38% 32%, rgba(249,115,22,0.35) 0%, rgba(249,115,22,0.08) 50%, transparent 100%)',
  plateRing: '#f97316',
};

const PROMOTIONS = [
  {
    id: 1,
    title: 'Weekend Special',
    description: 'All pizzas at 20% off every Saturday & Sunday',
    originalPrice: '₹599',
    dealPrice: '₹479',
    discount: '20% OFF',
    validUntil: 'Every Weekend',
    category: 'Pizza',
    accent: '#c62a09',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(198,42,9,0.3) 0%, rgba(198,42,9,0.06) 60%, transparent 100%)',
    ring: '#c62a09',
    isHot: true,
  },
  {
    id: 2,
    title: 'Family Combo',
    description: '2 Large Pizzas + 2 Breads + 2 Drinks — everything for the table',
    originalPrice: '₹1,299',
    dealPrice: '₹999',
    discount: 'Save ₹300',
    validUntil: 'Limited time',
    category: 'Combo',
    accent: '#d4a843',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(212,168,67,0.28) 0%, rgba(212,168,67,0.06) 60%, transparent 100%)',
    ring: '#d4a843',
    isHot: false,
  },
  {
    id: 3,
    title: 'Free Delivery',
    description: 'Zero delivery charges on any order above ₹500',
    originalPrice: null,
    dealPrice: 'Free',
    discount: '₹0 Delivery',
    validUntil: 'All week long',
    category: 'Delivery',
    accent: '#4ade80',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(74,222,128,0.22) 0%, rgba(74,222,128,0.05) 60%, transparent 100%)',
    ring: '#4ade80',
    isHot: false,
  },
  {
    id: 4,
    title: 'Biryani Bonanza',
    description: 'Buy 2 Biryanis and get a full Raita on the house',
    originalPrice: '₹799',
    dealPrice: '₹649',
    discount: 'Free Raita',
    validUntil: 'Mon – Fri only',
    category: 'Biryani',
    accent: '#f97316',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.06) 60%, transparent 100%)',
    ring: '#f97316',
    isHot: true,
  },
  {
    id: 5,
    title: 'Power Lunch',
    description: 'Main + Bread + Drink — a complete meal for ₹299',
    originalPrice: '₹499',
    dealPrice: '₹299',
    discount: '40% OFF',
    validUntil: '12 PM – 3 PM',
    category: 'Combo',
    accent: '#a78bfa',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(167,139,250,0.25) 0%, rgba(167,139,250,0.05) 60%, transparent 100%)',
    ring: '#a78bfa',
    isHot: false,
  },
  {
    id: 6,
    title: 'Dessert Delight',
    description: 'Pick any 2 desserts and enjoy 30% off the total',
    originalPrice: '₹399',
    dealPrice: '₹279',
    discount: '30% OFF',
    validUntil: 'All week',
    category: 'Desserts',
    accent: '#ec4899',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0.05) 60%, transparent 100%)',
    ring: '#ec4899',
    isHot: false,
  },
  {
    id: 7,
    title: 'First Order Bonus',
    description: 'New here? Get ₹150 off your very first order above ₹500',
    originalPrice: null,
    dealPrice: '₹150 OFF',
    discount: '₹150 OFF',
    validUntil: 'New users only',
    category: 'Delivery',
    accent: '#22d3ee',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0.05) 60%, transparent 100%)',
    ring: '#22d3ee',
    isHot: false,
  },
  {
    id: 8,
    title: 'Pizza Party Pack',
    description: '4 Medium Pizzas + 4 Drinks — bring the whole crew',
    originalPrice: '₹2,099',
    dealPrice: '₹1,599',
    discount: 'Save ₹500',
    validUntil: 'Order for 4+',
    category: 'Pizza',
    accent: '#c62a09',
    gradient: 'radial-gradient(circle at 35% 30%, rgba(198,42,9,0.3) 0%, rgba(198,42,9,0.06) 60%, transparent 100%)',
    ring: '#c62a09',
    isHot: false,
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

// Circular food plate illustration
const FoodPlate: React.FC<{ gradient: string; ring: string; size?: number }> = ({ gradient, ring, size = 110 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: gradient,
    border: `2px solid ${ring}30`,
    boxShadow: `0 0 0 1px ${ring}15, 0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)`,
    position: 'relative', flexShrink: 0,
  }}>
    {/* Specular highlight */}
    <div style={{ position: 'absolute', top: '12%', left: '18%', width: '28%', height: '16%', borderRadius: '50%', background: `rgba(255,255,255,0.12)`, transform: 'rotate(-20deg)', filter: 'blur(4px)' }} />
    {/* Inner rim */}
    <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: `1px solid ${ring}18` }} />
    {/* Fork & knife icon */}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size * 0.28} height={size * 0.28} viewBox="0 0 24 24" fill="none" stroke={`${ring}70`} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
      </svg>
    </div>
  </div>
);

// Countdown timer hook
function useCountdown(targetHour = 23) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(targetHour, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [targetHour]);
  return time;
}

const TimeBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1, minWidth: 52, background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
      {String(value).padStart(2, '0')}
    </div>
    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', marginTop: 5, textTransform: 'uppercase' }}>{label}</div>
  </div>
);

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const countdown = useCountdown(23);

  const filtered = selectedCategory === 'all' ? PROMOTIONS : PROMOTIONS.filter(p => p.category === selectedCategory);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
      <AppHeader showPublicNav onCartClick={() => setCartDrawerOpen(true)} />

      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '40px 32px' }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.22)', borderRadius: 99, marginBottom: 14 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live Offers</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'var(--text-1)', marginBottom: 8, lineHeight: 1.05 }}>
            Exclusive <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Deals</span>
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.95rem' }}>Handpicked offers — grab them before the clock runs out.</p>
        </div>

        {/* ── Hero deal banner ──────────────────────────────────── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: HERO_DEAL.gradient,
          border: `1px solid ${HERO_DEAL.accent}28`,
          borderRadius: 24, padding: '36px 40px',
          marginBottom: 40, display: 'flex', alignItems: 'center', gap: 32,
          boxShadow: `0 24px 64px rgba(0,0,0,0.7)`,
        }}>
          {/* Decorative rings */}
          <div style={{ position: 'absolute', right: -60, top: -60, width: 320, height: 320, borderRadius: '50%', border: `1px solid ${HERO_DEAL.accent}15`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, borderRadius: '50%', border: `1px solid ${HERO_DEAL.accent}10`, pointerEvents: 'none' }} />

          {/* Food plate */}
          <FoodPlate gradient={HERO_DEAL.plateGradient} ring={HERO_DEAL.plateRing} size={140} />

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-block', background: `${HERO_DEAL.accent}25`, border: `1px solid ${HERO_DEAL.accent}50`, borderRadius: 99, padding: '3px 12px', fontSize: '0.65rem', fontWeight: 700, color: HERO_DEAL.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              {HERO_DEAL.badge}
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', marginBottom: 4, lineHeight: 1.1 }}>{HERO_DEAL.headline}</h2>
            <p style={{ color: `${HERO_DEAL.accent}CC`, fontSize: '0.95rem', marginBottom: 16 }}>{HERO_DEAL.subline}</p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{HERO_DEAL.dealPrice}</span>
              <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through' }}>{HERO_DEAL.originalPrice}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: HERO_DEAL.accent, background: `${HERO_DEAL.accent}20`, padding: '3px 10px', borderRadius: 99 }}>{HERO_DEAL.savings}</span>
            </div>

            <button
              onClick={() => navigate('/menu')}
              style={{ background: HERO_DEAL.accent, color: '#fff', border: 'none', borderRadius: 99, padding: '12px 28px', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.02em' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              Grab This Deal →
            </button>
          </div>

          {/* Countdown */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: `${HERO_DEAL.accent}AA`, textTransform: 'uppercase', marginBottom: 12 }}>Ends in</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <TimeBlock value={countdown.h} label="hrs" />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>:</span>
              <TimeBlock value={countdown.m} label="min" />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>:</span>
              <TimeBlock value={countdown.s} label="sec" />
            </div>
          </div>
        </div>

        {/* ── Category filter pills ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '7px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem',
                borderRadius: 99, cursor: 'pointer', transition: 'all 0.15s ease',
                border: selectedCategory === cat.value ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                background: selectedCategory === cat.value ? 'rgba(212,168,67,0.12)' : 'var(--surface)',
                color: selectedCategory === cat.value ? 'var(--gold)' : 'var(--text-3)',
              }}
              onMouseEnter={e => { if (selectedCategory !== cat.value) { (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; } }}
              onMouseLeave={e => { if (selectedCategory !== cat.value) { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; } }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Deals grid ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {filtered.map(promo => (
            <div
              key={promo.id}
              style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px ${promo.accent}22`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              {/* Card visual area */}
              <div style={{ height: 170, background: `linear-gradient(160deg, ${promo.accent}12 0%, var(--surface-2) 100%)`, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <FoodPlate gradient={promo.gradient} ring={promo.ring} size={100} />

                {/* Discount badge */}
                <div style={{ position: 'absolute', top: 12, right: 12, background: promo.accent, color: '#fff', padding: '4px 12px', borderRadius: 99, fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.02em', boxShadow: `0 4px 12px ${promo.accent}55` }}>
                  {promo.discount}
                </div>

                {/* Hot badge */}
                {promo.isHot && (
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(198,42,9,0.4)', borderRadius: 99, padding: '3px 9px', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f97316' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#f97316', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hot</span>
                  </div>
                )}

                {/* Category chip */}
                <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(0,0,0,0.55)', color: 'var(--text-2)', padding: '2px 9px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
                  {promo.category}
                </div>
              </div>

              {/* Card content */}
              <div style={{ padding: '18px 20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)', marginBottom: 6 }}>{promo.title}</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginBottom: 14, lineHeight: 1.55 }}>{promo.description}</p>

                {/* Price row */}
                {promo.originalPrice && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: promo.accent }}>{promo.dealPrice}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>{promo.originalPrice}</span>
                  </div>
                )}
                {!promo.originalPrice && (
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: promo.accent }}>{promo.dealPrice}</span>
                  </div>
                )}

                {/* Validity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-3)', fontWeight: 500 }}>{promo.validUntil}</span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate('/menu')}
                  style={{
                    width: '100%', background: `${promo.accent}14`, color: promo.accent,
                    border: `1px solid ${promo.accent}40`, borderRadius: 99,
                    padding: '9px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${promo.accent}25`; (e.currentTarget as HTMLElement).style.borderColor = `${promo.accent}70`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${promo.accent}14`; (e.currentTarget as HTMLElement).style.borderColor = `${promo.accent}40`; }}
                >
                  Claim Deal
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} onCheckout={() => navigate('/checkout')} />

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
};

export default PromotionsPage;
