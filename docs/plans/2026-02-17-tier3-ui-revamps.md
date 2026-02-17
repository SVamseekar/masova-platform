# Tier 3 — UI/UX Revamps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Revamp the staff login page, KDS, POS system, customer web pages, customer mobile app, and create a reusable manager metrics template.

**Architecture:** Four independent revamp streams — all frontend-only changes. No API changes. All web revamps use existing neumorphic design tokens and inline styles. Mobile revamps apply the existing glassmorphism theme system consistently.

**Tech Stack:** React 19, TypeScript, MUI icons (`@mui/icons-material`), browser Audio API, browser Fullscreen API, browser Geolocation API, Recharts v3.2.1 (already installed), React Native 0.81.5 + Expo ~54.0.30, `@expo/vector-icons` (Ionicons), `expo-haptics`, `expo-blur`, react-navigation CardStyleInterpolators, React Native core Animated API (Reanimated NOT installed — do not add without testing build pipeline).

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
  { type: 'Kiosk (POS)', email: 'kiosk.pos@masova.com', password: 'kiosk123', Icon: PointOfSaleIcon, description: 'Point of Sale Terminal', route: '/pos', accentColor: '#2196F3' },
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

**Audit findings (confirmed before writing this plan):**
- 6 food emojis in `HomeScreen.tsx` category chips: `🍕 Pizza`, `🍔 Burgers`, `🍚 Rice`, `🥞 Breakfast`, `🍜 Noodles`, `🥤 Drinks`
- 7 cuisine emojis in `MenuScreen.tsx` filter bar: `🇮🇳 North Indian`, `🫓 South Indian`, `🍕 Italian`, etc.
- 15+ spice level peppers `🌶️` as spice indicators on menu item cards in `MenuScreen.tsx`
- Social login buttons in `AuthScreen.tsx` render `G` and `f` as text characters (placeholders)
- No `react-native-reanimated` installed — only core `Animated` API is available
- `expo-haptics` is installed and ready for touch feedback

**Tech Stack for this task:** React Native 0.81.5, Expo ~54.0.30, `expo-vector-icons` (Ionicons), `expo-blur`, `expo-haptics`, core `Animated` API (no Reanimated — do NOT add it without testing build pipeline).

**Files:**
- Modify: `masova-mobile/src/screens/home/HomeScreen.tsx`
- Modify: `masova-mobile/src/screens/menu/MenuScreen.tsx`
- Modify: `masova-mobile/src/screens/auth/AuthScreen.tsx` (or equivalent login screen)
- Create: `masova-mobile/src/components/SkeletonLoader.tsx`
- Modify: `masova-mobile/src/navigation/` (add transition interpolators)

---

**Step 1: Read all target files before editing**

Read each of these fully before making any changes:
- `masova-mobile/src/screens/home/HomeScreen.tsx`
- `masova-mobile/src/screens/menu/MenuScreen.tsx`
- Find the auth/login screen: `masova-mobile/src/screens/auth/` (check directory listing)

---

**Step 2: Replace HomeScreen category emojis with Ionicons**

Find the category chips array in `HomeScreen.tsx`. It looks approximately like:

```typescript
const categories = [
  { id: 'pizza', label: '🍕 Pizza', icon: '🍕' },
  { id: 'burgers', label: '🍔 Burgers', icon: '🍔' },
  { id: 'rice', label: '🍚 Rice', icon: '🍚' },
  { id: 'breakfast', label: '🥞 Breakfast', icon: '🥞' },
  { id: 'noodles', label: '🍜 Noodles', icon: '🍜' },
  { id: 'drinks', label: '🥤 Drinks', icon: '🥤' },
];
```

Replace with Ionicons:

```typescript
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: 'pizza',     label: 'Pizza',     iconName: 'pizza-outline' as const },
  { id: 'burgers',   label: 'Burgers',   iconName: 'fast-food-outline' as const },
  { id: 'rice',      label: 'Rice',      iconName: 'restaurant-outline' as const },
  { id: 'breakfast', label: 'Breakfast', iconName: 'cafe-outline' as const },
  { id: 'noodles',   label: 'Noodles',   iconName: 'nutrition-outline' as const },
  { id: 'drinks',    label: 'Drinks',    iconName: 'wine-outline' as const },
];
```

Update the chip render to use `<Ionicons name={cat.iconName} size={16} color={isSelected ? '#fff' : theme.colors.textSecondary} />` instead of the emoji.

Category chip JSX pattern:
```tsx
{CATEGORIES.map(cat => {
  const isSelected = selectedCategory === cat.id;
  return (
    <TouchableOpacity
      key={cat.id}
      onPress={() => setSelectedCategory(cat.id)}
      style={[
        styles.categoryChip,
        isSelected && { backgroundColor: theme.colors.brand.primary }
      ]}
      activeOpacity={0.8}
    >
      <Ionicons
        name={cat.iconName}
        size={16}
        color={isSelected ? '#fff' : theme.colors.textSecondary}
      />
      <Text style={[
        styles.categoryLabel,
        { color: isSelected ? '#fff' : theme.colors.textSecondary }
      ]}>
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
})}
```

---

**Step 3: Replace MenuScreen cuisine emojis with Ionicons**

Find the cuisine filter array in `MenuScreen.tsx`. It has entries like:
```typescript
{ id: 'NORTH_INDIAN', label: '🇮🇳 North Indian' }
```

Replace with Ionicons. The cuisine filter doesn't need custom icons per cuisine — use a generic food icon for all, with selection state making it clear:

```typescript
import { Ionicons } from '@expo/vector-icons';

// Replace emoji labels with clean text labels only:
const CUISINES = [
  { id: 'ALL',          label: 'All' },
  { id: 'NORTH_INDIAN', label: 'North Indian' },
  { id: 'SOUTH_INDIAN', label: 'South Indian' },
  { id: 'ITALIAN',      label: 'Italian' },
  { id: 'CHINESE',      label: 'Chinese' },
  { id: 'FAST_FOOD',    label: 'Fast Food' },
  { id: 'BEVERAGES',    label: 'Beverages' },
];
```

Pill-style filter chip (no icon needed — clean text is fine for cuisines):
```tsx
{CUISINES.map(cuisine => {
  const isActive = activeCuisine === cuisine.id;
  return (
    <TouchableOpacity
      key={cuisine.id}
      onPress={() => setActiveCuisine(cuisine.id)}
      style={[
        styles.cuisineChip,
        isActive && { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary }
      ]}
    >
      <Text style={[
        styles.cuisineLabel,
        { color: isActive ? '#fff' : theme.colors.textSecondary }
      ]}>
        {cuisine.label}
      </Text>
    </TouchableOpacity>
  );
})}
```

Chip style:
```typescript
cuisineChip: {
  paddingHorizontal: 14,
  paddingVertical: 7,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: theme.colors.border,   // use theme token
  marginRight: 8,
  backgroundColor: theme.colors.surface,
},
cuisineLabel: { fontSize: 13, fontWeight: '500' },
```

---

**Step 4: Replace spice level peppers in MenuScreen item cards**

Find the spice level renderer in `MenuScreen.tsx` (or a shared `MenuItemCard` component). It likely looks like:

```tsx
{Array(item.spiceLevel).fill(0).map((_, i) => (
  <Text key={i}>🌶️</Text>
))}
```

Replace with solid red dot indicators:

```tsx
{item.spiceLevel > 0 && (
  <View style={styles.spiceContainer}>
    {Array(Math.min(item.spiceLevel, 3)).fill(0).map((_, i) => (
      <View
        key={i}
        style={[
          styles.spiceDot,
          { opacity: i < item.spiceLevel ? 1 : 0.25 }
        ]}
      />
    ))}
  </View>
)}
```

Add to StyleSheet:
```typescript
spiceContainer: { flexDirection: 'row', gap: 3, marginTop: 4 },
spiceDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: '#ef4444',
},
```

---

**Step 5: Fix social login button placeholders in AuthScreen**

Find the Google and Facebook login buttons in the auth screen. They currently render a text letter `G` and `f`. Replace with Ionicons:

```typescript
import { Ionicons } from '@expo/vector-icons';
```

Replace Google button content:
```tsx
{/* Before: <Text style={styles.socialText}>G</Text> */}
{/* After: */}
<Ionicons name="logo-google" size={20} color="#DB4437" />
<Text style={styles.socialText}>Continue with Google</Text>
```

Replace Facebook button content:
```tsx
{/* Before: <Text style={styles.socialText}>f</Text> */}
{/* After: */}
<Ionicons name="logo-facebook" size={20} color="#4267B2" />
<Text style={styles.socialText}>Continue with Facebook</Text>
```

Note: these buttons are placeholders (no OAuth logic yet — that's Tier 4 Point 1). Just make them look professional.

---

**Step 6: Create SkeletonLoader component**

```typescript
// masova-mobile/src/components/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
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
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    return () => shimmer.stopAnimation();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[styles.base, { width: width as any, height, borderRadius, opacity }, style]}
    />
  );
};

const styles = StyleSheet.create({
  base: { backgroundColor: '#D1D5DB' },
});

export default SkeletonLoader;
```

---

**Step 7: Replace ActivityIndicator with skeleton cards in MenuScreen**

Find the loading state in `MenuScreen.tsx` (likely `ActivityIndicator`). Replace with skeleton grid:

```tsx
import SkeletonLoader from '../../components/SkeletonLoader';

// In the loading branch:
{isLoading ? (
  <View style={styles.skeletonGrid}>
    {[1, 2, 3, 4, 5, 6].map(i => (
      <View key={i} style={styles.skeletonCard}>
        <SkeletonLoader height={150} borderRadius={12} style={{ marginBottom: 8 }} />
        <SkeletonLoader height={16} width="75%" style={{ marginBottom: 6 }} />
        <SkeletonLoader height={14} width="45%" />
      </View>
    ))}
  </View>
) : (
  // existing FlatList / grid
)}
```

Add to StyleSheet:
```typescript
skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
skeletonCard: { width: '47%', margin: '1.5%', padding: 8 },
```

---

**Step 8: Improve food item card — larger image, better typography**

In `MenuScreen.tsx`, find the `renderItem` function for the menu FlatList. Update card to use a taller image container and better spacing:

```tsx
const renderMenuItem = ({ item }: { item: MenuItem }) => (
  <TouchableOpacity
    style={[styles.menuCard, { backgroundColor: theme.colors.surface, borderRadius: 14 }]}
    onPress={() => handleItemPress(item)}
    activeOpacity={0.85}
  >
    {/* Image area */}
    <View style={styles.menuCardImage}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.menuCardImagePlaceholder, { backgroundColor: getCategoryPlaceholderColor(item.category) }]}>
          <Ionicons name="restaurant-outline" size={32} color="rgba(255,255,255,0.7)" />
        </View>
      )}
      {!item.isAvailable && (
        <View style={styles.unavailableOverlay}>
          <Text style={styles.unavailableText}>Unavailable</Text>
        </View>
      )}
    </View>
    {/* Content */}
    <View style={styles.menuCardContent}>
      <Text style={[styles.menuCardName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
        {item.name}
      </Text>
      {item.spiceLevel > 0 && (
        <View style={styles.spiceContainer}>
          {Array(Math.min(item.spiceLevel, 3)).fill(0).map((_, i) => (
            <View key={i} style={styles.spiceDot} />
          ))}
        </View>
      )}
      <Text style={[styles.menuCardPrice, { color: theme.colors.brand.primary }]}>
        ₹{item.basePrice ?? item.price}
      </Text>
    </View>
  </TouchableOpacity>
);

// Helper for category placeholder colors
const getCategoryPlaceholderColor = (category: string): string => {
  const map: Record<string, string> = {
    PIZZA: '#ef4444', BURGER: '#f97316', BIRYANI: '#a855f7',
    DOSA: '#eab308', CURRY_GRAVY: '#8b5cf6', HOT_DRINKS: '#6366f1',
    COLD_DRINKS: '#3b82f6', ICE_CREAM: '#ec4899',
  };
  return map[category] ?? '#6b7280';
};
```

Styles to add:
```typescript
menuCard: {
  margin: 6,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  overflow: 'hidden',
},
menuCardImage: { height: 140, width: '100%', overflow: 'hidden', position: 'relative' },
menuCardImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
unavailableOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.45)',
  alignItems: 'center',
  justifyContent: 'center',
},
unavailableText: { color: '#fff', fontWeight: '700', fontSize: 12 },
menuCardContent: { padding: 10 },
menuCardName: { fontSize: 13, fontWeight: '600', marginBottom: 4, lineHeight: 18 },
menuCardPrice: { fontSize: 15, fontWeight: '800', marginTop: 4 },
spiceContainer: { flexDirection: 'row', gap: 3, marginBottom: 2 },
spiceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
```

---

**Step 9: Add haptic feedback to cart add button**

In the "Add to Cart" button `onPress`:

```typescript
import * as Haptics from 'expo-haptics';

// In the add-to-cart handler:
const handleAddToCart = async (item: MenuItem) => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  dispatch(addToCart(item));
};
```

---

**Step 10: Add screen transition interpolators**

Read `masova-mobile/src/navigation/` to find the main stack navigator. Find all `createStackNavigator()` usages.

```typescript
import { CardStyleInterpolators } from '@react-navigation/stack';

// Add to each Stack.Navigator screenOptions:
screenOptions={{
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  headerStyle: { elevation: 0, shadowOpacity: 0 }, // clean header
}}
```

---

**Step 11: Verify in Expo**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx expo start
```

Open in emulator or Expo Go. Check:
- HomeScreen category chips: Ionicons appear, no emoji characters anywhere
- MenuScreen cuisine filters: clean text-only pills, no emoji
- MenuScreen menu cards: 140px tall image area, spice dots (not peppers), larger price font
- MenuScreen loading: skeleton shimmer cards appear before data loads
- Auth screen: Google/Facebook icons visible (not `G`/`f` text)
- Navigate between screens: horizontal slide animation visible

---

**Step 12: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/components/SkeletonLoader.tsx src/screens/ src/navigation/
git commit -m "feat: mobile revamp — replace all emojis with Ionicons, skeleton loaders, improved menu cards, haptics"
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

---

## Task 6: POS System Revamp

**Files:**
- Modify: `frontend/src/apps/POSSystem/POSDashboard.tsx`
- Modify: `frontend/src/apps/POSSystem/components/MenuPanel.tsx`
- Modify: `frontend/src/apps/POSSystem/components/OrderPanel.tsx`
- Modify: `frontend/src/apps/POSSystem/components/CustomerPanel.tsx`
- Modify: `frontend/src/apps/POSSystem/components/PINAuthModal.tsx`

**What exists now (important — read before touching):**
- `POSDashboard.tsx` — dark header (`#1a1a1a`), 2 tabs (Orders / Analytics), 3-column POS layout (Menu 40%, Order 30%, Checkout 30%), keyboard shortcuts (F1/F2/Escape/Ctrl+Enter), Clock In/Out buttons for managers only
- `MenuPanel.tsx` — cuisine tabs → category tabs → dietary filter → grid of compact cards (140px min-width), popular quick-add strip
- `OrderPanel.tsx` — item list with quantity controls, order type toggle (PICKUP / DELIVERY), totals
- `CustomerPanel.tsx` — phone lookup → customer loyalty info, 4 payment methods (CASH/CARD/UPI/WALLET), delivery address fields, order submission
- `PINAuthModal.tsx` — 4-digit PIN entry for public/kiosk access (no login required)

**Problems to fix:**
1. Heavy emoji usage throughout — `🍽️`, `🔍`, `🔥`, `📊`, `🌿`, `🌱`, `🍖`, `🌶️`, `⭐`, `👑`, `📜`, `👥`, `🏆`, `💰`, `❌`, `ℹ️`
2. Menu grid cards (140px min-width) are too small — text truncates badly on 1080p POS screens
3. Header is very busy with manager Clock In/Out buttons — non-managers see almost nothing in the header
4. Analytics tab "Top Sellers" and "Recent Orders" section titles use emojis `🔥` and `📜`
5. PINAuthModal needs to match the neumorphic design system (currently likely plain/basic)
6. No visual distinction between PICKUP and DELIVERY order types in the order panel
7. The debug `console.log` calls in `MenuPanel.tsx` should be removed from production code
8. No empty-state illustration for when no store is selected

**Revamp goals:**
1. Remove ALL emojis — replace with MUI icons throughout
2. Expand menu cards to 160px min-width with item image support (show `item.image` if available, else color-coded placeholder by category)
3. Add a clear "No Store Selected" empty state to `MenuPanel` and `CustomerPanel` when `storeId` is null
4. Improve order type toggle — pill toggle with color: green for PICKUP, blue for DELIVERY, and a small icon per type
5. Make PINAuthModal fully neumorphic — use neumorphic Card, Input, Button components
6. Remove all debug `console.log` statements from `MenuPanel.tsx`
7. Analytics tab: replace emoji section headers with MUI icons (`TrendingUp`, `Receipt`, `People`)
8. Consistent font sizes — POS is used on 1080p wall displays; bump `MenuPanel` footer text from `xs` to `sm`

---

**Step 1: Remove debug console.logs from MenuPanel.tsx**

In `MenuPanel.tsx`, delete lines 29-44 (the two `useEffect` blocks that call `console.log`):

```typescript
// DELETE these two useEffect blocks:
useEffect(() => {
  console.log('[MenuPanel] Menu data:', { ... });
}, [menuItems, isLoading, error, selectedStoreId]);

useEffect(() => {
  if (selectedStoreId) {
    console.log('[MenuPanel] Store changed, refetching menu for store:', selectedStoreId);
    refetch();
  }
}, [selectedStoreId, refetch]);
```

Keep the `refetch` call but move it into a `useEffect` WITHOUT the console.log:

```typescript
// Keep only:
useEffect(() => {
  if (selectedStoreId) {
    refetch();
  }
}, [selectedStoreId, refetch]);
```

**Step 2: Run tests to make sure nothing breaks**

```bash
cd frontend && npx vitest run src/apps/POSSystem/components/MenuPanel.test.tsx
```
Expected: all pass (removing console.logs doesn't change behavior).

**Step 3: Replace emojis with MUI icons in MenuPanel.tsx**

Import icons at top of `MenuPanel.tsx`:
```typescript
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SpaIcon from '@mui/icons-material/Spa'; // vegetarian
import GrassIcon from '@mui/icons-material/Grass'; // vegan
import SetMealIcon from '@mui/icons-material/SetMeal'; // non-veg
import LocalDiningIcon from '@mui/icons-material/LocalDining'; // spicy
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
```

Replace:
- `🍽️` header → `<RestaurantMenuIcon fontSize="small" />`
- `🔍` search prefix div → `<SearchIcon fontSize="small" style={{ color: colors.text.tertiary }} />`
- `⭐` on recommended badge → `<StarIcon style={{ fontSize: 12, color: colors.semantic.warning }} />`
- `🔥 Popular Items` header → `<LocalFireDepartmentIcon fontSize="small" style={{ color: '#ef4444' }} /> Popular Items`
- `🥬` dietary → `<SpaIcon style={{ fontSize: 10, color: '#16a34a' }} />`
- `🌱` dietary → `<GrassIcon style={{ fontSize: 10, color: '#15803d' }} />`
- `🍖` dietary → `<SetMealIcon style={{ fontSize: 10, color: '#b91c1c' }} />`
- `🌶️` spicy → `<LocalDiningIcon style={{ fontSize: 10, color: '#dc2626' }} />`
- `📊` footer → `<InfoOutlinedIcon style={{ fontSize: 12 }} />`
- `ℹ️` empty state card → `<InfoOutlinedIcon style={{ fontSize: 20 }} />`
- `❌` error card → remove, use red border + text "Failed to load menu. Please try again."

**Step 4: Expand menu card width and add image support**

Change the grid in `MenuPanel.tsx` line 499:
```typescript
// Before:
gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
// After:
gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
```

Add image support inside each menu card (before the item name div):
```typescript
{/* Item image or colored placeholder */}
<div style={{
  width: '100%',
  height: '72px',
  borderRadius: '8px',
  marginBottom: spacing[2],
  overflow: 'hidden',
  backgroundColor: item.image ? 'transparent' : getCategoryColor(item.category),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
}}>
  {item.image ? (
    <img
      src={item.image}
      alt={item.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  ) : (
    <RestaurantMenuIcon style={{ fontSize: 28, color: '#ffffff88' }} />
  )}
</div>
```

Add this helper function before the return statement in `MenuPanel`:
```typescript
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    PIZZA: '#ef4444',
    BURGER: '#f97316',
    DOSA: '#eab308',
    CURRY_GRAVY: '#a855f7',
    FRIED_RICE: '#14b8a6',
    NOODLES: '#06b6d4',
    HOT_DRINKS: '#8b5cf6',
    COLD_DRINKS: '#3b82f6',
    ICE_CREAM: '#ec4899',
  };
  return colorMap[category] || colors.brand.primary;
};
```

**Step 5: Run tests**

```bash
cd frontend && npx vitest run src/apps/POSSystem/components/MenuPanel.test.tsx
```
Expected: pass.

**Step 6: Commit MenuPanel changes**

```bash
git add frontend/src/apps/POSSystem/components/MenuPanel.tsx
git commit -m "$(cat <<'EOF'
refactor: remove emojis and expand menu cards in POS MenuPanel

Replace all emoji usage with MUI icons, remove debug console.log
calls, expand menu card min-width to 160px with image/placeholder
support per category.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

**Step 7: Replace emojis in POSDashboard.tsx analytics tab**

Import icons in `POSDashboard.tsx`:
```typescript
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // for #1 crown
import PaidIcon from '@mui/icons-material/Paid'; // for "Mark Paid" button
import AccessTimeIcon from '@mui/icons-material/AccessTime';
```

Replace in POSDashboard analytics section:
- `🔥 Top Sellers Today` h3 → `<TrendingUpIcon fontSize="small" /> Top Sellers Today`
- `👑` rank-1 icon → `<EmojiEventsIcon style={{ fontSize: 16, color: '#fff' }} />`
- `📜 Recent Orders` h3 → `<ReceiptLongIcon fontSize="small" /> Recent Orders`
- `💰 Mark Paid` button text → `<PaidIcon style={{ fontSize: 12 }} /> Mark Paid`
- `👥 Staff Leaderboard` h3 → `<PeopleIcon fontSize="small" /> Staff Leaderboard`
- `🏆` rank-1 staff icon → `<EmojiEventsIcon style={{ fontSize: 20, color: '#fff' }} />`

**Step 8: Improve order type toggle in OrderPanel.tsx**

Import icons in `OrderPanel.tsx`:
```typescript
import StoreIcon from '@mui/icons-material/Store'; // pickup
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining'; // delivery
```

Replace the existing order type buttons with a pill toggle:
```typescript
{/* Order Type Toggle */}
<div style={{
  display: 'flex',
  gap: 0,
  backgroundColor: colors.surface.secondary,
  borderRadius: '12px',
  padding: '3px',
  border: `1px solid ${colors.surface.border}`,
  marginBottom: spacing[3]
}}>
  {(['PICKUP', 'DELIVERY'] as const).map((type) => (
    <button
      key={type}
      onClick={() => onOrderTypeChange(type)}
      style={{
        flex: 1,
        padding: `${spacing[2]} ${spacing[3]}`,
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
        fontFamily: typography.fontFamily.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[1],
        transition: 'all 0.2s ease',
        ...(orderType === type ? {
          backgroundColor: type === 'PICKUP' ? '#16a34a' : '#2563eb',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        } : {
          backgroundColor: 'transparent',
          color: colors.text.secondary
        })
      }}
    >
      {type === 'PICKUP'
        ? <StoreIcon style={{ fontSize: 14 }} />
        : <DeliveryDiningIcon style={{ fontSize: 14 }} />
      }
      {type}
    </button>
  ))}
</div>
```

**Step 9: Add "No Store Selected" empty state to MenuPanel**

After the `isLoading` guard and before the filter logic in `MenuPanel`, add a guard at the top of the returned JSX (just before the `{isLoading && ...}` block):

```typescript
{!selectedStoreId && !isLoading && (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[10],
    color: colors.text.tertiary
  }}>
    <StoreIcon style={{ fontSize: 48, color: colors.surface.border }} />
    <div style={{
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.secondary
    }}>
      No Store Selected
    </div>
    <div style={{
      fontSize: typography.fontSize.sm,
      textAlign: 'center',
      maxWidth: '200px'
    }}>
      Select a store from the header to view menu items
    </div>
  </div>
)}
```

Import `StoreIcon` in MenuPanel:
```typescript
import StoreIcon from '@mui/icons-material/Store';
```

**Step 10: Revamp PINAuthModal to use neumorphic design**

Read `PINAuthModal.tsx` fully first, then replace inline button/input styles with neumorphic components.

The PIN grid should use 12 large neumorphic `Button` components (1-9, clear, 0, backspace) in a 3×4 grid. Each button: `size="lg"`, variant `"secondary"`.

The 4-digit display should use a row of 4 neumorphic `Input`-like circles showing filled vs empty state:
```typescript
{/* PIN display */}
<div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', marginBottom: spacing[6] }}>
  {[0, 1, 2, 3].map((i) => (
    <div key={i} style={{
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: pin.length > i ? colors.brand.primary : colors.surface.border,
      transition: 'background-color 0.15s ease',
      boxShadow: pin.length > i ? `0 0 8px ${colors.brand.primary}44` : shadows.inset.sm
    }} />
  ))}
</div>
```

**Step 11: Run all POS tests**

```bash
cd frontend && npx vitest run src/apps/POSSystem/
```
Expected: all pass (no behavior changes, only visual).

**Step 12: Commit all remaining POS changes**

```bash
git add frontend/src/apps/POSSystem/
git commit -m "$(cat <<'EOF'
refactor: revamp POS system UI - remove emojis, improve layout

- Replace all emoji usage across POSDashboard, OrderPanel with MUI icons
- Add pill-style order type toggle (green Pickup / blue Delivery)
- Add No Store Selected empty state to MenuPanel
- Revamp PINAuthModal to use neumorphic design components
- Bump MenuPanel footer font to sm for 1080p POS displays

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Tier 3 Verification

```bash
# Web: start frontend
cd frontend && npm run dev

# Login page
# → Navigate to /login
# → 5 role cards visible (Manager, Kitchen Staff, Driver, Kiosk (POS), Asst. Manager)
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
# → Open in emulator → HomeScreen
# → Category chips show Ionicons (pizza/fast-food/cafe/wine icons) — NO emoji characters
# → Open MenuScreen → cuisine filter pills are clean text, no emoji flags
# → Menu cards show 140px image area, spice dots (red circles, NOT 🌶️ pepper emoji)
# → Menu loading state → shimmer skeleton cards appear before data loads
# → Auth screen → Google button has logo-google icon, Facebook has logo-facebook icon
# → Navigate between screens → horizontal slide transition visible
# → Tap "Add to Cart" → subtle haptic vibration felt on device

# POS System
# → Navigate to /pos
# → No emojis visible anywhere in the UI
# → Menu panel: cards are 160px wide, categories show colored placeholder when no image
# → With no storeId: "No Store Selected" empty state shows in menu panel
# → Order type: pill toggle — green PICKUP / blue DELIVERY with icons
# → Analytics tab: section headers use MUI icons (not emojis)
# → Click "New Order" with no user logged in → PIN modal opens → neumorphic design with dot display
# → console: no [MenuPanel] debug logs appear
```
