# Tier 3 — UI/UX Revamps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Revamp the staff login page, KDS, customer web pages, customer mobile app, and create a reusable manager metrics template.

**Architecture:** Four independent revamp streams — all frontend-only changes. No API changes. All web revamps use existing neumorphic design tokens and inline styles. Mobile revamps apply the existing glassmorphism theme system consistently.

**Tech Stack:** React 19, TypeScript, MUI icons (`@mui/icons-material`), browser Audio API, browser Fullscreen API, browser Geolocation API, Recharts v3.2.1 (already installed), React Native 0.81 + Expo 54, react-navigation CardStyleInterpolators, React Native Animated API.

**Depends on:** Tier 1 complete (seed data provides realistic content for UI testing). Tier 2 not required.

---

## Critical Context

- Web design tokens: `frontend/src/styles/design-tokens.ts` — `colors`, `spacing`, `typography`
- Neumorphic utilities: `frontend/src/styles/neumorphic-utils.ts` — `createNeumorphicSurface(variant, size, radius)`
- Neumorphic components: `frontend/src/components/ui/neumorphic/` — Button, Input, Card, Badge, Checkbox, LoadingSpinner
- MUI icons are already installed (DriverDashboard uses them). Import from `@mui/icons-material`.
- KDS file `KitchenDisplayPage.tsx` is 1133 lines — read it fully before editing.
- LoginPage.tsx is 522 lines — read it fully before editing.
- Mobile theme: `masova-mobile/src/styles/theme.ts` + `masova-mobile/src/styles/tokens.ts`
- Recharts already in `frontend/package.json` as `"recharts": "^3.2.1"`.
- Manager tokens: `frontend/src/pages/manager/manager-tokens.ts` — read before writing ManagerMetricTemplate.

---

## Task 1: Staff Login Page Revamp

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.tsx`

**Step 1: Read the full file**

Read `frontend/src/pages/auth/LoginPage.tsx` completely (522 lines) before making any changes.

**Step 2: Replace demo accounts array — add 5 roles, remove emojis**

Find the `demoAccounts` array (around line 62). Replace with:

```typescript
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

interface DemoAccount {
  type: string;
  email: string;
  password: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  description: string;
  route: string;
  accentColor: string;
}

const demoAccounts: DemoAccount[] = [
  { type: 'Manager', email: 'suresh.manager@masova.com', password: 'manager123', Icon: ManageAccountsIcon, description: 'Store Management Dashboard', route: '/manager', accentColor: '#7B1FA2' },
  { type: 'Kitchen Staff', email: 'rahul.staff@masova.com', password: 'staff123', Icon: RestaurantIcon, description: 'Kitchen Display System', route: '/kitchen', accentColor: '#FF6B35' },
  { type: 'Driver', email: 'ravi.driver@masova.com', password: 'driver123', Icon: LocalShippingIcon, description: 'Delivery Management', route: '/driver', accentColor: '#00B14F' },
  { type: 'Cashier', email: 'deepa.cashier@masova.com', password: 'cashier123', Icon: PointOfSaleIcon, description: 'Point of Sale', route: '/pos', accentColor: '#2196F3' },
  { type: 'Asst. Manager', email: 'rohan.asst@masova.com', password: 'asst123', Icon: SupervisorAccountIcon, description: 'Operations Support', route: '/manager', accentColor: '#FF9800' },
];
```

**Step 3: Add forgot password state**

Add to component state (after existing state declarations):

```typescript
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [forgotEmail, setForgotEmail] = useState('');
const [forgotSubmitted, setForgotSubmitted] = useState(false);

const handleForgotPassword = () => {
  if (!forgotEmail || !forgotEmail.includes('@')) {
    setError('Please enter a valid email address');
    return;
  }
  // In production: call POST /api/users/forgot-password
  setForgotSubmitted(true);
};
```

**Step 4: Replace the left panel styles**

Find the left panel div (the blue gradient panel) and replace its `style` with:

```typescript
const leftPanelStyles: React.CSSProperties = {
  background: '#1a1a1a',
  color: '#ffffff',
  padding: `${spacing[8]} ${spacing[10]}`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '100vh',
  backgroundImage: `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 40px,
      rgba(255,255,255,0.02) 40px,
      rgba(255,255,255,0.02) 41px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 40px,
      rgba(255,255,255,0.02) 40px,
      rgba(255,255,255,0.02) 41px
    )
  `,
};
```

**Step 5: Replace left panel content**

Replace the left panel's inner JSX with:

```tsx
{/* Brand identity */}
<div>
  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[8] }}>
    <div style={{ width: '44px', height: '44px', background: colors.semantic.error, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: '20px', fontWeight: '900', fontFamily: typography.fontFamily.primary }}>M</span>
    </div>
    <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff', fontFamily: typography.fontFamily.primary }}>MaSoVa</span>
  </div>

  <h1 style={{ fontSize: '36px', fontWeight: '800', lineHeight: 1.2, marginBottom: spacing[4], color: '#fff', fontFamily: typography.fontFamily.primary }}>
    Restaurant Management,<br />
    <span style={{ color: colors.semantic.error }}>Simplified.</span>
  </h1>
  <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '320px' }}>
    One platform for your kitchen, delivery, payments, and analytics.
  </p>
</div>

{/* Demo role cards — 5 roles in a grid */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
  {demoAccounts.map((account) => (
    <button
      key={account.type}
      onClick={() => handleDemoLogin(account)}
      disabled={isLoading}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid rgba(255,255,255,0.1)`,
        borderRadius: '10px',
        padding: `${spacing[3]} ${spacing[4]}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: spacing[2],
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
    >
      <account.Icon style={{ color: account.accentColor, fontSize: '20px' }} />
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{account.type}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{account.description}</div>
      </div>
    </button>
  ))}
</div>
```

**Step 6: Replace right panel form with forgot password toggle**

In the right panel form area, wrap the form and add a forgot password section:

```tsx
{!showForgotPassword ? (
  // Existing login form — no changes needed to form logic
  <form onSubmit={handleSubmit}>
    {/* ... existing form fields ... */}
    <button
      type="button"
      onClick={() => { setShowForgotPassword(true); setError(''); }}
      style={{ background: 'none', border: 'none', color: colors.semantic.info, cursor: 'pointer', fontSize: typography.fontSize.sm, padding: 0, marginTop: spacing[2] }}
    >
      Forgot password?
    </button>
    {/* ... existing submit button ... */}
  </form>
) : forgotSubmitted ? (
  <div style={{ textAlign: 'center', padding: spacing[8] }}>
    <div style={{ fontSize: '48px', marginBottom: spacing[4] }}>✓</div>
    <h3 style={{ marginBottom: spacing[2] }}>Check your email</h3>
    <p style={{ color: colors.text.secondary, marginBottom: spacing[6] }}>
      If {forgotEmail} has an account, a reset link has been sent.
    </p>
    <button onClick={() => { setShowForgotPassword(false); setForgotSubmitted(false); setForgotEmail(''); }}>
      Back to login
    </button>
  </div>
) : (
  <div>
    <h3 style={{ marginBottom: spacing[2] }}>Reset Password</h3>
    <p style={{ color: colors.text.secondary, marginBottom: spacing[6] }}>Enter your email to receive a reset link.</p>
    <Input
      type="email"
      placeholder="your@email.com"
      value={forgotEmail}
      onChange={e => setForgotEmail(e.target.value)}
    />
    {error && <div style={{ color: colors.semantic.error, fontSize: typography.fontSize.sm, marginTop: spacing[2] }}>{error}</div>}
    <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[4] }}>
      <Button variant="outline" onClick={() => { setShowForgotPassword(false); setError(''); }}>Cancel</Button>
      <Button onClick={handleForgotPassword}>Send Reset Link</Button>
    </div>
  </div>
)}
```

**Step 7: Add mobile responsive styles**

Add a `<style>` tag or use a CSS-in-JS approach for the two-column → single-column breakpoint. In the outer container, add a media query via JavaScript:

```typescript
// Near the top of the component render
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
// Use isMobile to conditionally apply styles to the outer grid

const outerGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
  minHeight: '100vh',
};
```

**Step 8: Verify in browser**

```bash
cd frontend && npm run dev
```

Navigate to `/login`. Verify:
- 5 role cards visible in left panel, no emojis
- Left panel is dark with grid pattern
- "Forgot password?" link visible
- Click it → email input appears
- Submit → success message appears
- Mobile: resize to <768px → single column

**Step 9: Commit**

```bash
git add frontend/src/pages/auth/LoginPage.tsx
git commit -m "feat: revamp login page — 5 roles, dark brand panel, forgot password, no emojis"
```

---

## Task 2: KDS Full Revamp

**Files:**
- Modify: `frontend/src/pages/kitchen/KitchenDisplayPage.tsx`

**Step 1: Read the full KDS file (1133 lines)**

Read `frontend/src/pages/kitchen/KitchenDisplayPage.tsx` completely before editing.

**Step 2: Add state for sound mute, full-screen, and summary bar**

Add to the component's state declarations:

```typescript
const [isMuted, setIsMuted] = useState(false);
const [isFullScreen, setIsFullScreen] = useState(false);
const prevOrderCountRef = React.useRef(0);
```

**Step 3: Add sound alert function**

Add after the state declarations. This uses a base64-encoded inline WAV (short beep, ~0.1 seconds):

```typescript
const playNewOrderChime = () => {
  if (isMuted) return;
  try {
    // Short 440Hz beep — inline base64 WAV, no external file needed
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};
```

**Step 4: Trigger chime on new orders**

Add a `useEffect` that watches the `orders` array for new RECEIVED items:

```typescript
useEffect(() => {
  const receivedCount = orders.filter(o => o.status === 'RECEIVED').length;
  if (receivedCount > prevOrderCountRef.current) {
    playNewOrderChime();
  }
  prevOrderCountRef.current = receivedCount;
}, [orders.length, isMuted]);
```

**Step 5: Add full-screen toggle function**

```typescript
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(() => {});
  } else {
    document.exitFullscreen().then(() => setIsFullScreen(false)).catch(() => {});
  }
};

// Listen for F key
useEffect(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'f' || e.key === 'F') toggleFullScreen(); };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Step 6: Add summary bar component (inline, before the Kanban columns)**

Add this JSX before the column grid render:

```tsx
{/* Summary Bar */}
{(() => {
  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED', 'SERVED', 'COMPLETED'].includes(o.status));
  const waitTimes = activeOrders.map(o => {
    const mins = Math.floor((currentTime.getTime() - new Date(o.receivedAt || o.createdAt || Date.now()).getTime()) / 60000);
    return mins;
  });
  const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
  const maxWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: '#1a1a1a', borderBottom: '1px solid #333', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
        {[
          { label: 'Active', value: String(activeOrders.length), color: '#3b82f6' },
          { label: 'Avg Wait', value: `${avgWait}m`, color: avgWait > 10 ? '#ef4444' : avgWait > 5 ? '#f59e0b' : '#10b981' },
          { label: 'Longest', value: `${maxWait}m`, color: maxWait > 10 ? '#ef4444' : maxWait > 5 ? '#f59e0b' : '#10b981' },
        ].map(kpi => (
          <div key={kpi.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setIsMuted(m => !m)}
          style={{ background: isMuted ? '#374151' : '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', color: isMuted ? '#9ca3af' : '#fff', cursor: 'pointer', fontSize: '12px' }}
          title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
        >
          {isMuted ? '🔇' : '🔔'}
        </button>
        <button
          onClick={toggleFullScreen}
          style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
          title="Toggle full screen (F)"
        >
          {isFullScreen ? '⊡' : '⊞'}
        </button>
      </div>
    </div>
  );
})()}
```

**Step 7: Add color urgency system to order cards**

Find where the order card `borderLeft` or card container style is set. Replace or add a border-left based on age:

```typescript
// Add this helper function in the component:
const getUrgencyStyle = (receivedAt: Date | undefined): React.CSSProperties => {
  if (!receivedAt) return {};
  const mins = Math.floor((currentTime.getTime() - new Date(receivedAt).getTime()) / 60000);
  if (mins >= 10) return { borderLeft: '4px solid #ef4444', animation: 'pulse-red 1.5s infinite' };
  if (mins >= 5) return { borderLeft: '4px solid #f59e0b' };
  return { borderLeft: '4px solid #10b981' };
};
```

Add the pulse keyframes via a `<style>` tag in the component JSX (or inject once):

```tsx
<style>{`
  @keyframes pulse-red {
    0%, 100% { border-left-color: #ef4444; }
    50% { border-left-color: #fca5a5; }
  }
`}</style>
```

Apply to each order card: spread `getUrgencyStyle(order.receivedAt)` into the card's style.

**Step 8: Increase typography for 1080p wall display**

Find the card styles that set `fontSize`. Increase:
- Order number: change to `fontSize: '22px'` (from ~16px)
- Item names: change to `fontSize: '15px'` (from ~14px)
- Quantity: change to `fontSize: '14px'`

**Step 9: Ensure bump button is minimum 48×48px touch target**

Find the "Next Stage" or bump button. Ensure its style has:

```typescript
minHeight: '48px',
minWidth: '48px',
padding: '12px 20px',
```

**Step 10: Remove remaining emojis from statusColumns**

Find `statusColumns` array (around line 377):

```typescript
const statusColumns: StatusColumn[] = [
  { status: 'RECEIVED', title: 'New Orders', icon: '', color: '#3b82f6' },
  // ...
];
```

Replace icon fields with MUI icon names (render separately) or empty strings. Update the column header render to use a MUI icon instead of the emoji `icon` string.

Import relevant icons:
```typescript
import FiberNewIcon from '@mui/icons-material/FiberNew';
import BuildIcon from '@mui/icons-material/Build';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
```

**Step 11: Verify in browser**

```bash
cd frontend && npm run dev
```

Navigate to `/kitchen`. Verify:
- Summary bar shows active order count, avg wait, longest wait
- Press F → full-screen mode
- Open a new order via seed data → chime plays
- Card older than 10 min → red pulsing border
- 5–10 min → amber border
- <5 min → green border
- No emojis in column headers

**Step 12: Commit**

```bash
git add frontend/src/pages/kitchen/KitchenDisplayPage.tsx
git commit -m "feat: KDS revamp — summary bar, urgency colors, sound alerts, full-screen mode, 48px touch targets"
```

---

## Task 3: Customer Web App Revamp

**Files:**
- Modify: `frontend/src/pages/customer/MenuPage.tsx`
- Modify: `frontend/src/pages/customer/CartPage.tsx`
- Modify: `frontend/src/apps/PublicWebsite/HomePage.tsx`
- Modify: `frontend/src/apps/PublicWebsite/PromotionsPage.tsx`

**Step 1: Read each file before editing**

Read all 4 files fully before making any changes.

**Step 2: MenuPage — 2-column grid layout**

Find the menu item list render (currently likely a `map` over items rendering list rows). Replace with a CSS grid:

```tsx
{/* Replace the items list container style with: */}
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: spacing[4],
  padding: spacing[4],
}}>
  {filteredItems.map(item => (
    <div key={item.id} style={{
      ...createNeumorphicSurface('raised', 'base', 'lg'),
      borderRadius: '16px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Image */}
      <div style={{ height: '180px', background: '#f0f0f0', overflow: 'hidden' }}>
        <img
          src={item.imageUrl || '/images/placeholder-food.jpg'}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-food.jpg'; }}
        />
      </div>
      {/* Content */}
      <div style={{ padding: spacing[4], flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[1] }}>
            <h3 style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary, margin: 0 }}>{item.name}</h3>
            <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.semantic.error }}>₹{item.basePrice ?? item.price}</span>
          </div>
          <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, margin: `${spacing[1]} 0`, lineHeight: 1.4 }}>{item.description}</p>
        </div>
        <button
          onClick={() => handleAddToCart(item)}
          style={{
            ...createNeumorphicSurface('raised', 'sm', 'md'),
            marginTop: spacing[3],
            padding: `${spacing[2]} ${spacing[4]}`,
            background: colors.semantic.error,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: typography.fontWeight.semibold,
            fontSize: typography.fontSize.sm,
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  ))}
</div>
```

**Step 3: MenuPage — sticky filter bar**

Find the category filter bar. Make it sticky:

```typescript
const filterBarStyles: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: colors.surface.primary,
  padding: `${spacing[3]} ${spacing[4]}`,
  borderBottom: `1px solid ${colors.surface.secondary}`,
  display: 'flex',
  gap: spacing[2],
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};
```

**Step 4: CartPage — ensure it uses CartDrawer**

Read `frontend/src/components/cart/CartDrawer.tsx`. If `CartPage.tsx` duplicates cart rendering logic instead of using CartDrawer, refactor CartPage to simply trigger the drawer open state (via Redux `uiSlice` or a local prop). CartDrawer is already a slide-up fixed panel — CartPage should defer to it.

If CartPage is a standalone route (`/cart`), keep it but ensure it reuses the same item list components as CartDrawer to avoid duplication.

**Step 5: HomePage — remove emojis, modernize hero**

Read `frontend/src/apps/PublicWebsite/HomePage.tsx` fully. Find all emoji characters (🍕, 🚀, ⭐, etc.) and replace with either:
- MUI icons: `import LocalPizzaIcon from '@mui/icons-material/LocalPizza'`
- Or remove entirely and use clean typography

Replace the hero section:

```tsx
{/* Hero Section */}
<section style={{
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%)',
  color: '#fff',
  padding: `${spacing[20]} ${spacing[8]}`,
  textAlign: 'center',
}}>
  <h1 style={{
    fontSize: 'clamp(2rem, 5vw, 4rem)',
    fontWeight: '900',
    lineHeight: 1.15,
    marginBottom: spacing[4],
    fontFamily: typography.fontFamily.primary,
  }}>
    Fresh food,<br />
    <span style={{ color: colors.semantic.error }}>at your door.</span>
  </h1>
  <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255,255,255,0.7)', maxWidth: '480px', margin: `0 auto ${spacing[8]}`, lineHeight: 1.6 }}>
    Order from MaSoVa's 5 Hyderabad branches. Real-time tracking. Pay with UPI.
  </p>
  <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', flexWrap: 'wrap' }}>
    <a href="/menu" style={{ background: colors.semantic.error, color: '#fff', padding: `${spacing[4]} ${spacing[8]}`, borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: typography.fontSize.lg, minHeight: '52px', display: 'flex', alignItems: 'center' }}>
      Order Now
    </a>
    <a href="/menu" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: `${spacing[4]} ${spacing[8]}`, borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: typography.fontSize.lg, minHeight: '52px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
      View Menu
    </a>
  </div>
</section>

{/* Food image strip */}
<section style={{ display: 'flex', gap: spacing[2], overflow: 'hidden', height: '200px' }}>
  {['/images/pizza-margherita.jpg', '/images/biryani-chicken.jpg', '/images/butter-chicken.jpg'].map((src, i) => (
    <div key={i} style={{ flex: 1, background: '#f0f0f0', overflow: 'hidden' }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
    </div>
  ))}
</section>
```

**Step 6: PromotionsPage — remove emojis**

Read `frontend/src/apps/PublicWebsite/PromotionsPage.tsx`. Find all emoji characters and remove/replace with text or MUI icons.

**Step 7: Commit**

```bash
git add frontend/src/pages/customer/MenuPage.tsx frontend/src/pages/customer/CartPage.tsx frontend/src/apps/PublicWebsite/HomePage.tsx frontend/src/apps/PublicWebsite/PromotionsPage.tsx
git commit -m "feat: customer web revamp — food grid menu, clean hero, remove emojis"
```

---

## Task 4: Customer Mobile App Revamp (masova-mobile)

**Files:**
- Modify: `masova-mobile/src/screens/menu/MenuScreen.tsx`
- Create: `masova-mobile/src/components/SkeletonLoader.tsx`
- Modify: `masova-mobile/src/navigation/` (add transition interpolators)
- Modify: multiple screens (token audit — replace hardcoded hex colors)

**Step 1: Create SkeletonLoader component**

```typescript
// masova-mobile/src/components/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: { backgroundColor: '#E0E0E0' },
});

export default SkeletonLoader;
```

**Step 2: Add SkeletonLoader to MenuScreen**

Read `masova-mobile/src/screens/menu/MenuScreen.tsx` fully. Find the loading state (likely `ActivityIndicator`). Replace it with skeleton cards:

```tsx
// In the loading branch, replace ActivityIndicator with:
{isLoading ? (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3, 4].map(i => (
      <View key={i} style={styles.skeletonCard}>
        <SkeletonLoader height={160} borderRadius={12} style={{ marginBottom: 8 }} />
        <SkeletonLoader height={20} width="70%" style={{ marginBottom: 6 }} />
        <SkeletonLoader height={16} width="40%" />
      </View>
    ))}
  </View>
) : (
  // existing content
)}
```

Add to StyleSheet:
```typescript
skeletonContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
skeletonCard: { width: '48%', margin: '1%', padding: 8 },
```

**Step 3: Improve food item card styling in MenuScreen**

Find the `FlatList` or `ScrollView` item renderer. Update the card style to use theme tokens and show a larger image:

```tsx
// Replace individual menu item card with:
<TouchableOpacity
  style={[styles.itemCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }]}
  onPress={() => navigateToDetail(item)}
  activeOpacity={0.85}
>
  <View style={styles.itemImageContainer}>
    <Image
      source={{ uri: item.imageUrl || '' }}
      style={styles.itemImage}
      resizeMode="cover"
    />
    {!item.isAvailable && (
      <View style={styles.unavailableOverlay}>
        <Text style={styles.unavailableText}>Unavailable</Text>
      </View>
    )}
  </View>
  <View style={styles.itemContent}>
    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
    <Text style={[styles.itemPrice, { color: theme.colors.brand.primary }]}>₹{item.basePrice ?? item.price}</Text>
  </View>
</TouchableOpacity>
```

Add to StyleSheet:
```typescript
itemCard: { margin: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, overflow: 'hidden' },
itemImageContainer: { height: 160, overflow: 'hidden' },
itemImage: { width: '100%', height: '100%' },
unavailableOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
unavailableText: { color: '#fff', fontWeight: '700', fontSize: 13 },
itemContent: { padding: 10 },
itemName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
itemPrice: { fontSize: 16, fontWeight: '800' },
```

**Step 4: Add screen transition interpolators to stack navigators**

Read `masova-mobile/src/navigation/` directory listing, then read the main stack navigator file.

Find all `Stack.Navigator` components. Add `screenOptions` with card transition:

```typescript
import { CardStyleInterpolators } from '@react-navigation/stack';

// Add to Stack.Navigator screenOptions:
screenOptions={{
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
  // ... existing options
}}
```

**Step 5: Token audit — find hardcoded hex colors**

```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" /Users/souravamseekarmarti/Projects/masova-mobile/src/screens/ --include="*.tsx" | grep -v "//.*#" | head -30
```

For each hardcoded color found that maps to a theme token, replace it with `theme.colors.*`. Use the `useTheme()` hook that should already exist in the codebase. Focus on the most common ones (background colors, text colors, brand colors).

**Step 6: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/components/SkeletonLoader.tsx src/screens/ src/navigation/
git commit -m "feat: mobile revamp — skeleton loaders, larger food cards, screen transitions, theme token audit"
```

---

## Task 5: Manager Metric Template

**Files:**
- Create: `frontend/src/pages/manager/ManagerMetricTemplate.tsx`
- Modify: `frontend/src/pages/manager/DashboardPage.tsx`
- Modify: `frontend/src/pages/manager/ProductAnalyticsPage.tsx`
- Modify: `frontend/src/pages/manager/KitchenAnalyticsPage.tsx`
- Modify: `frontend/src/pages/manager/AdvancedReportsPage.tsx`

**Step 1: Read manager-tokens.ts and the 4 target pages**

Read these files fully before writing any code:
- `frontend/src/pages/manager/manager-tokens.ts`
- `frontend/src/pages/manager/DashboardPage.tsx`
- `frontend/src/pages/manager/ProductAnalyticsPage.tsx`
- `frontend/src/pages/manager/KitchenAnalyticsPage.tsx`
- `frontend/src/pages/manager/AdvancedReportsPage.tsx`

**Step 2: Create ManagerMetricTemplate**

```typescript
// frontend/src/pages/manager/ManagerMetricTemplate.tsx
import React from 'react';

export interface KPICardData {
  label: string;
  value: string | number;
  sub?: string;         // subtitle/trend text
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string; // override default accent
}

interface ManagerMetricTemplateProps {
  title?: string;
  kpis: KPICardData[];
  chart?: React.ReactNode;       // Any chart component
  table?: React.ReactNode;       // Any table component
  actions?: React.ReactNode;     // Export buttons, filters, etc.
  isLoading?: boolean;
}

const ManagerMetricTemplate: React.FC<ManagerMetricTemplateProps> = ({
  title,
  kpis,
  chart,
  table,
  actions,
  isLoading = false,
}) => {
  // Import tokens inline to avoid circular deps
  const surface = '#f0f0f0';
  const cardBg = '#ffffff';
  const textPrimary = '#1a1a2e';
  const textSecondary = '#64748b';
  const accent = '#e53e3e';
  const border = '#e2e8f0';

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '80px', background: '#e2e8f0', borderRadius: '12px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      {title && (
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: textPrimary, margin: 0 }}>{title}</h2>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(kpis.length, 5)}, 1fr)`, gap: '16px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: cardBg,
            borderRadius: '12px',
            padding: '16px 20px',
            borderTop: `3px solid ${kpi.accentColor ?? accent}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: kpi.accentColor ?? textPrimary, lineHeight: 1, marginBottom: '4px' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '13px', color: textSecondary, fontWeight: '500' }}>{kpi.label}</div>
            {kpi.sub && (
              <div style={{ fontSize: '12px', marginTop: '4px', color: kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : textSecondary }}>
                {kpi.trend === 'up' ? '↑ ' : kpi.trend === 'down' ? '↓ ' : ''}{kpi.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      {chart && (
        <div style={{ background: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {chart}
        </div>
      )}

      {/* Actions (filters, export) */}
      {actions && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}

      {/* Table */}
      {table && (
        <div style={{ background: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${border}` }}>
          {table}
        </div>
      )}
    </div>
  );
};

export default ManagerMetricTemplate;
```

**Step 3: Apply template to DashboardPage**

Read `DashboardPage.tsx`. Find the top-level KPI cards section. Wrap the entire page content with `ManagerMetricTemplate`:

```tsx
// In DashboardPage.tsx, identify the existing KPI cards (revenue, orders, etc.)
// Extract their values into a kpis array and pass to the template.

// Example pattern (adapt to actual field names in the file):
const kpis: KPICardData[] = [
  { label: "Today's Revenue", value: `₹${summary?.todayRevenue ?? 0}`, trend: 'up', sub: '+12% vs yesterday', accentColor: '#10b981' },
  { label: "Today's Orders", value: summary?.todayOrders ?? 0, accentColor: '#3b82f6' },
  { label: 'Active Orders', value: summary?.activeOrders ?? 0, accentColor: '#f59e0b' },
  { label: 'Avg Prep Time', value: `${summary?.avgPrepTime ?? 0}m`, accentColor: '#6b7280' },
];

return (
  <ManagerMetricTemplate
    title="Dashboard"
    kpis={kpis}
    chart={<SalesTrendChart storeId={storeId} />}  // use existing chart component
    table={/* existing orders table */}
  />
);
```

> **Note:** Preserve all existing API calls, filters, and table functionality. Only wrap the layout — do not remove any data-fetching logic.

**Step 4: Apply template to ProductAnalyticsPage**

Same pattern as Step 3 — read the file, extract KPI values, wrap with template. ProductAnalytics KPIs should include: top item, total items sold, revenue from top items, avg item rating.

**Step 5: Apply template to KitchenAnalyticsPage**

KDS analytics KPIs: avg prep time, orders completed, longest wait, on-time rate.

**Step 6: Apply template to AdvancedReportsPage**

Advanced reports KPIs: total revenue (period), total orders, new customers, repeat rate.

**Step 7: Verify in browser**

```bash
cd frontend && npm run dev
```

Log in as Manager → `/manager`. Verify:
- DashboardPage shows KPI row (4 cards) with colored top borders
- Chart still renders below KPIs
- Table still renders below chart
- No features missing compared to original

**Step 8: Commit**

```bash
git add frontend/src/pages/manager/ManagerMetricTemplate.tsx frontend/src/pages/manager/DashboardPage.tsx frontend/src/pages/manager/ProductAnalyticsPage.tsx frontend/src/pages/manager/KitchenAnalyticsPage.tsx frontend/src/pages/manager/AdvancedReportsPage.tsx
git commit -m "feat: add ManagerMetricTemplate, apply to 4 manager pages"
```

---

## Tier 3 Verification

```bash
# Web: start frontend
cd frontend && npm run dev

# Login page
# → Navigate to /login
# → 5 role cards visible (Manager, Kitchen Staff, Driver, Cashier, Asst. Manager)
# → No emojis
# → Click "Forgot password?" → form appears → submit → success message
# → Resize window < 768px → single column layout

# KDS
# → Navigate to /kitchen
# → Summary bar visible at top
# → Press F → full-screen
# → An order older than 10 min → pulsing red border
# → No emojis in column headers

# Customer web
# → Navigate to /menu → 2-column food grid
# → Category filters are sticky when scrolling
# → Navigate to / → dark hero section, clean typography, no emojis

# Manager
# → Log in as manager → /manager → Dashboard
# → KPI row with 4 metric cards visible above chart

# Mobile (masova-mobile)
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx expo start
# → Open in emulator → MenuScreen
# → Shows shimmer skeleton while loading
# → Food cards show 160px image, name, price
# → Navigate between screens → horizontal swipe transition visible
```
