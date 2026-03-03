# Phase 4 — Frontend Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform customer-facing web pages to a dark premium design system (gold/red/dark) while keeping staff pages in neumorphic. Add Google Places Autocomplete, voice input in ChatWidget, payment preference pre-selection, and AddressGate store selector.

**Architecture:** CSS custom properties in `index.css` for the dark design system. Staff routes keep existing neumorphic tokens. Only customer-facing route components get the new dark design. No design system rewrites — surgical changes page by page.

**Tech Stack:** React 19, TypeScript, MUI v5, RTK Query, CSS custom properties, Web Speech API, Google Places Autocomplete API

**Prerequisites:** Phase 0 complete (fixes backend blockers). Phase 3.3 (checkout prices) improves the same pages — coordinate if working in parallel.

---

## Tools for This Phase

Read this section before starting ANY task. These are the exact tools to use and when.

### `typescript-lsp` — TypeScript Language Server (MCP tool)
**Use it:** Continuously while editing React components. This phase creates new pages and modifies existing ones — TypeScript errors in props, missing imports, and incorrect RTK Query hook types are caught immediately by the LSP.
**Specifically:** When adding `SpeechRecognition` types in Task 4.10 (voice input), the LSP will tell you if the Web Speech API types are available or if you need `@types/dom-speech-recognition`.
**How to invoke:** Runs automatically in your editor. Use `mcp__ide__getDiagnostics` on any `.tsx` file for explicit diagnostics.

### `frontend-design` (Skill)
**Use it:** For Tasks 4.2 (HomePage), 4.3 (MenuPage), and 4.6 (Checkout/Tracking) where the visual design matters most. This skill guides creating distinctive, polished UI instead of generic components.
**How to invoke:** Type `/frontend-design` before starting each of these tasks. Describe the dark-premium aesthetic (gold accents, deep blacks, red CTA) and the component you're building.

### `playwright` — Browser Automation (MCP tools)
**Use it:** After EVERY UI task in this phase to visually verify the result. Do not trust that the code is correct without seeing it in a browser.
**Specifically:**
- After Task 4.1 (CSS variables): `browser_navigate` to `http://localhost:3000` → `browser_screenshot` to confirm dark background is applied.
- After Task 4.2 (HomePage): `browser_screenshot` → confirm hero section, category grid, featured items visible.
- After Task 4.9 (Google Places): `browser_fill_form` on the address input → `browser_screenshot` to confirm autocomplete dropdown appears.
- After any change: `browser_network_requests` to confirm RTK Query is hitting canonical API paths (not old `/api/v1/` paths).
**How to invoke:** Use `mcp__plugin_playwright_playwright__browser_navigate`, `browser_screenshot`, `browser_network_requests` etc.

### `context7` — Library Docs (MCP tool)
**Use it:** Before any unfamiliar API usage in this phase.
**Specifically:**
- Task 4.9 (Google Places Autocomplete): `resolve-library-id` for `@react-google-maps/api` → `query-docs` for "Autocomplete component" to get the exact React wrapper API.
- Task 4.10 (Voice Input): `resolve-library-id` for `web-speech-api` → `query-docs` for "SpeechRecognition" to confirm the browser API surface and TypeScript types.
- Task 4.7 (RTK Query): If RTK Query `invalidatesTags` behavior is unclear, `resolve-library-id` for `@reduxjs/toolkit` → `query-docs`.
**How to invoke:** `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs`.

### `test-driven-development` (Skill)
**Use it:** Before building each component. Write a Vitest component test that asserts the key behavior (renders correctly, responds to click, calls the right API) before writing the component.
**How to invoke:** Type `/test-driven-development` before each task.

### `pr-review-toolkit:comment-analyzer` (Agent)
**Use it:** After completing Tasks 4.2, 4.3, and 4.6 — the three most complex new page components. This agent verifies JSDoc comments are accurate and will not become stale.
**How to invoke:** Use the Agent tool with `subagent_type: "pr-review-toolkit:comment-analyzer"`.

### `commit-commands:commit` (Skill)
**Use it:** After every task. CSS variables (4.1), then each page (4.2, 4.3...) — commit them separately. If the dark theme breaks a staff page, you want to be able to revert just that commit.
**How to invoke:** Type `/commit`.

---

## Task 4.1: Dark Premium CSS Custom Properties

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html`

**Step 1: Read frontend/src/index.css**

Find the `:root` block. Check if dark design tokens are already there (unlikely from current neumorphic setup).

**Step 2: Add dark premium CSS variables**

In `frontend/src/index.css`, add a new scope for customer pages. Do NOT touch existing `:root` variables (staff pages depend on them):

```css
/* ============================================================
   DARK PREMIUM DESIGN SYSTEM — Customer-facing pages only
   Staff pages use .neumorphic-theme (existing tokens)
   ============================================================ */

.dark-premium-theme {
  --bg: #0A0908;
  --surface: #141210;
  --surface-2: #1C1916;
  --surface-3: #242018;
  --gold: #D4A843;
  --gold-light: #E8C060;
  --gold-dim: rgba(212, 168, 67, 0.6);
  --red: #C62A09;
  --red-light: #E53E3E;
  --border: rgba(212, 168, 67, 0.15);
  --border-strong: rgba(212, 168, 67, 0.35);
  --text-1: #FDFCF8;
  --text-2: #B0A898;
  --text-3: #6C6458;

  background-color: var(--bg);
  color: var(--text-1);
}
```

**Step 3: Add Google Fonts to index.html**

In `frontend/index.html`, inside the `<head>` tag, add:

```html
<!-- Dark Premium Typography — Playfair Display (headlines) + DM Sans (UI) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

**Step 4: Add a CustomerLayout wrapper**

Create `frontend/src/components/customer/CustomerLayout.tsx`:

```tsx
import { Box } from '@mui/material';
import { ReactNode } from 'react';

/**
 * Wrapper for all customer-facing pages.
 * Applies the dark-premium-theme class which activates dark CSS variables.
 */
export const CustomerLayout = ({ children }: { children: ReactNode }) => (
  <Box className="dark-premium-theme" sx={{ minHeight: '100vh' }}>
    {children}
  </Box>
);
```

Wrap each customer page with `<CustomerLayout>` in the router config.

**Step 5: Build to verify no errors**

```bash
cd frontend && npm run build
```

**Step 6: Commit**

```bash
git add frontend/src/index.css
git add frontend/index.html
git add frontend/src/components/customer/CustomerLayout.tsx
git commit -m "feat(frontend): add dark premium CSS variables, Google Fonts, CustomerLayout wrapper"
```

---

## Task 4.2: HomePage Dark Redesign

**Files:**
- Modify: `frontend/src/pages/customer/HomePage.tsx`

**Step 1: Read HomePage.tsx**

Understand the current structure: what hero text exists, how categories are shown, how menu items are listed.

**Step 2: Update hero section to Playfair Display + oversized text**

Replace the hero section with:

```tsx
{/* Hero */}
<Box sx={{
  background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
  py: { xs: 8, md: 16 },
  px: 3,
  textAlign: 'center'
}}>
  <Typography sx={{
    fontFamily: '"Playfair Display", serif',
    fontSize: { xs: '3rem', md: '5.5rem' },
    fontWeight: 900,
    lineHeight: 1.1,
    color: 'var(--text-1)',
    mb: 2
  }}>
    Restaurant<br />
    <Box component="span" sx={{ color: 'var(--gold)' }}>Excellence</Box>
  </Typography>
  <Typography sx={{
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '1.2rem',
    color: 'var(--text-2)',
    mb: 4
  }}>
    Authentic flavours, delivered with care
  </Typography>
  <Button variant="contained" size="large" sx={{
    bgcolor: 'var(--gold)', color: '#000', fontWeight: 600,
    '&:hover': { bgcolor: 'var(--gold-light)' },
    px: 4, py: 1.5
  }}>
    Order Now
  </Button>
</Box>
```

**Step 3: Category pills**

Replace category buttons with gold-bordered pills:

```tsx
{/* Category filter pills */}
<Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', px: 3, py: 2 }}>
  {categories.map(cat => (
    <Chip
      key={cat}
      label={cat}
      onClick={() => setActiveCategory(cat)}
      sx={{
        border: '1px solid',
        borderColor: activeCategory === cat ? 'var(--gold)' : 'var(--border)',
        bgcolor: activeCategory === cat ? 'rgba(212,168,67,0.1)' : 'var(--surface)',
        color: activeCategory === cat ? 'var(--gold)' : 'var(--text-2)',
        fontFamily: '"DM Sans", sans-serif',
        '&:hover': { borderColor: 'var(--gold-dim)' }
      }}
    />
  ))}
</Box>
```

**Step 4: "Most Popular" carousel section**

Add a horizontal scroll section for top menu items. Use circular food images (border-radius 50%) or square cards with gold borders.

**Step 5: Build and visual check**

```bash
npm run build && npm run dev
```

Open browser at `http://localhost:3000` — customer home page should show dark background, gold accents.

**Step 6: Commit**

```bash
git add frontend/src/pages/customer/HomePage.tsx
git commit -m "feat(customer): HomePage dark premium redesign — Playfair hero, gold category pills, dark cards"
```

---

## Task 4.3: MenuPage Dark Redesign

**Files:**
- Modify: `frontend/src/pages/customer/MenuPage.tsx`

**Step 1: Read MenuPage.tsx**

Understand sidebar filters, search bar, and menu card structure.

**Step 2: Fixed sidebar filters**

```tsx
{/* Left sidebar — fixed position */}
<Box sx={{
  width: 260,
  position: 'sticky',
  top: 80,
  height: 'fit-content',
  bgcolor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  p: 2
}}>
  <Typography sx={{ fontFamily: '"Playfair Display", serif', color: 'var(--gold)', mb: 2 }}>
    Filters
  </Typography>
  {/* Cuisine, Dietary, Price range, Rating filters */}
</Box>
```

**Step 3: Dark menu cards with gold price**

```tsx
{/* Menu item card */}
<Card sx={{
  bgcolor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  '&:hover': {
    borderColor: 'var(--border-strong)',
    transform: 'translateY(-2px)',
    transition: 'all 0.2s ease'
  }
}}>
  <CardMedia component="img" height={180} image={item.imageUrl} sx={{ objectFit: 'cover' }} />
  <CardContent>
    <Typography sx={{ fontFamily: '"DM Sans", sans-serif', color: 'var(--text-1)', fontWeight: 600 }}>
      {item.name}
    </Typography>
    <Typography sx={{ color: 'var(--text-2)', fontSize: '0.875rem', mb: 1 }}>
      {item.description}
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.2rem' }}>
        ₹{item.price}
      </Typography>
      <Button variant="outlined" size="small" sx={{
        borderColor: 'var(--gold)', color: 'var(--gold)',
        '&:hover': { bgcolor: 'rgba(212,168,67,0.1)' }
      }}>
        Add
      </Button>
    </Box>
  </CardContent>
</Card>
```

**Step 4: Sticky search bar**

```tsx
{/* Sticky search bar */}
<Box sx={{
  position: 'sticky', top: 64, zIndex: 10,
  bgcolor: 'var(--bg)', borderBottom: '1px solid var(--border)',
  px: 3, py: 1.5
}}>
  <TextField
    fullWidth
    placeholder="Search dishes..."
    value={searchQuery}
    onChange={e => setSearchQuery(e.target.value)}
    InputProps={{
      startAdornment: <SearchIcon sx={{ color: 'var(--text-3)', mr: 1 }} />,
      sx: {
        bgcolor: 'var(--surface)',
        color: 'var(--text-1)',
        borderRadius: 3,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--gold-dim)' },
      }
    }}
  />
</Box>
```

**Step 5: Build and commit**

```bash
npm run build
git add frontend/src/pages/customer/MenuPage.tsx
git commit -m "feat(customer): MenuPage dark redesign — sticky search, fixed sidebar, dark cards + gold price"
```

---

## Task 4.4: CartDrawer Dark Redesign

**Files:**
- Modify: `frontend/src/components/customer/CartDrawer.tsx` (or wherever cart drawer is)

**Step 1: Find the cart drawer component**

```bash
grep -r "CartDrawer\|cart.*drawer\|Drawer.*cart" frontend/src --include="*.tsx" -l
```

**Step 2: Apply dark styling to drawer**

```tsx
<Drawer
  anchor="right"
  open={isOpen}
  PaperProps={{
    sx: {
      width: { xs: '100vw', sm: 420 },
      bgcolor: 'var(--surface-2)',
      borderLeft: '1px solid var(--border)',
    }
  }}
>
  {/* Drawer header */}
  <Box sx={{ p: 3, borderBottom: '1px solid var(--border-strong)' }}>
    <Typography sx={{ fontFamily: '"Playfair Display", serif', color: 'var(--gold)', fontSize: '1.5rem' }}>
      Your Order
    </Typography>
  </Box>

  {/* Cart items with gold dividers */}
  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
    {items.map((item, i) => (
      <Box key={item.id}>
        {/* Cart item row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
          <Box>
            <Typography sx={{ color: 'var(--text-1)' }}>{item.name}</Typography>
            <Typography sx={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>₹{item.price} each</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Quantity controls */}
            <Typography sx={{ color: 'var(--gold)', fontWeight: 700 }}>₹{item.total}</Typography>
          </Box>
        </Box>
        {i < items.length - 1 && <Divider sx={{ borderColor: 'var(--border)' }} />}
      </Box>
    ))}
  </Box>

  {/* Totals + checkout button */}
  <Box sx={{ p: 3, borderTop: '1px solid var(--border-strong)' }}>
    <Button fullWidth variant="contained" sx={{
      bgcolor: 'var(--gold)', color: '#000', fontWeight: 700, py: 1.5,
      '&:hover': { bgcolor: 'var(--gold-light)' }
    }}>
      Checkout — ₹{cartTotal}
    </Button>
  </Box>
</Drawer>
```

**Step 3: Build and commit**

```bash
npm run build
git add frontend/src/components/customer/CartDrawer.tsx
git commit -m "feat(customer): CartDrawer dark redesign — surface-2 bg, gold accents, gold dividers"
```

---

## Task 4.5: Customer Login + Register Pages Dark Redesign

**Files:**
- Modify: `frontend/src/pages/customer/CustomerLoginPage.tsx`
- Modify: `frontend/src/pages/customer/CustomerRegisterPage.tsx` (or similar name)

**Step 1: Read CustomerLoginPage.tsx**

Find the current layout. It's likely a basic form.

**Step 2: Apply centered card with gold top border**

```tsx
<Box sx={{
  minHeight: '100vh',
  bgcolor: 'var(--bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: 2
}}>
  <Box sx={{
    width: '100%',
    maxWidth: 420,
    bgcolor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderTop: '3px solid var(--gold)',
    borderRadius: 2,
    p: 4
  }}>
    <Typography sx={{
      fontFamily: '"Playfair Display", serif',
      fontSize: '2rem',
      color: 'var(--text-1)',
      mb: 1
    }}>
      Welcome Back
    </Typography>
    <Typography sx={{ color: 'var(--text-2)', mb: 4, fontFamily: '"DM Sans", sans-serif' }}>
      Sign in to your MaSoVa account
    </Typography>

    {/* Email + Password fields with dark styling */}
    <TextField
      fullWidth
      label="Email"
      type="email"
      sx={{
        mb: 2,
        '& .MuiInputBase-root': { bgcolor: 'var(--surface-2)', color: 'var(--text-1)' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
        '& .MuiInputLabel-root': { color: 'var(--text-2)' }
      }}
    />

    <Button fullWidth variant="contained" sx={{
      bgcolor: 'var(--red)', color: '#fff', fontWeight: 600, py: 1.5, mb: 2,
      '&:hover': { bgcolor: 'var(--red-light)' }
    }}>
      Sign In
    </Button>

    {/* Google OAuth dark button */}
    <Button
      fullWidth
      variant="outlined"
      startIcon={<GoogleIcon />}
      sx={{
        borderColor: 'var(--border-strong)',
        color: 'var(--text-1)',
        '&:hover': { bgcolor: 'var(--surface-2)', borderColor: 'var(--gold-dim)' }
      }}
    >
      Continue with Google
    </Button>
  </Box>
</Box>
```

**Step 3: Apply same pattern to RegisterPage**

**Step 4: Build and commit**

```bash
npm run build
git add frontend/src/pages/customer/CustomerLoginPage.tsx
git add frontend/src/pages/customer/CustomerRegisterPage.tsx
git commit -m "feat(customer): Login + Register dark redesign — centered card, gold top border, dark OAuth button"
```

---

## Task 4.6: CheckoutPage + OrderTrackingPage Dark Redesign

**Files:**
- Modify: `frontend/src/pages/customer/CheckoutPage.tsx`
- Modify: `frontend/src/pages/customer/OrderTrackingPage.tsx`
- Modify: `frontend/src/pages/customer/LiveTrackingPage.tsx`

**Step 1: CheckoutPage 2-column layout**

```tsx
{/* 2-column checkout layout */}
<Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
  {/* Left column — order details */}
  <Box sx={{ flex: 1 }}>
    {/* Section card with gold left border */}
    <Box sx={{
      bgcolor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--gold)',
      borderRadius: 2,
      p: 3,
      mb: 2
    }}>
      <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600, color: 'var(--text-1)', mb: 2 }}>
        Delivery Address
      </Typography>
      {/* Address fields */}
    </Box>

    <Box sx={{
      bgcolor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--gold)',
      borderRadius: 2,
      p: 3
    }}>
      <Typography sx={{ fontWeight: 600, color: 'var(--text-1)', mb: 2 }}>
        Payment Method
      </Typography>
      {/* Payment options */}
    </Box>
  </Box>

  {/* Right column — order summary */}
  <Box sx={{ width: { xs: '100%', md: 320 } }}>
    <Box sx={{
      bgcolor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 2,
      p: 3,
      position: 'sticky',
      top: 80
    }}>
      <Typography sx={{ fontFamily: '"Playfair Display", serif', color: 'var(--gold)', mb: 2 }}>
        Order Summary
      </Typography>
      {/* Item list + totals */}
    </Box>
  </Box>
</Box>
```

**Step 2: OrderTrackingPage gold timeline**

```tsx
{/* Gold timeline */}
<Box sx={{ position: 'relative', pl: 4 }}>
  {/* Vertical line */}
  <Box sx={{
    position: 'absolute', left: 16, top: 0, bottom: 0,
    width: 2, bgcolor: 'var(--border)'
  }} />

  {statuses.map((status, i) => (
    <Box key={status} sx={{ position: 'relative', mb: 3 }}>
      {/* Circle indicator */}
      <Box sx={{
        position: 'absolute', left: -4,
        width: 12, height: 12, borderRadius: '50%',
        bgcolor: isCompleted(status) ? 'var(--gold)' : 'var(--surface-3)',
        border: `2px solid ${isCompleted(status) ? 'var(--gold)' : 'var(--border)'}`
      }} />
      <Typography sx={{
        color: isCompleted(status) ? 'var(--text-1)' : 'var(--text-3)',
        fontWeight: isCompleted(status) ? 600 : 400
      }}>
        {statusLabels[status]}
      </Typography>
    </Box>
  ))}
</Box>
```

**Step 3: Build and commit**

```bash
npm run build
git add frontend/src/pages/customer/CheckoutPage.tsx
git add frontend/src/pages/customer/OrderTrackingPage.tsx
git add frontend/src/pages/customer/LiveTrackingPage.tsx
git commit -m "feat(customer): Checkout 2-col layout + gold section borders, OrderTracking gold timeline"
```

---

## Task 4.7: Google Places Autocomplete for Delivery Address

**Files:**
- Modify: `frontend/src/pages/customer/CheckoutPage.tsx`
- Create: `frontend/src/components/customer/PlacesAutocomplete.tsx`

**Step 1: Load Google Maps Places library**

In `frontend/index.html`, add (after the existing Maps script if present):

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_KEY&libraries=places&callback=initGoogleMaps" async defer></script>
```

Add in `frontend/src/vite-env.d.ts`:
```typescript
interface Window {
  google: typeof google;
  initGoogleMaps: () => void;
}
```

**Step 2: Create PlacesAutocomplete component**

Create `frontend/src/components/customer/PlacesAutocomplete.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { TextField } from '@mui/material';

interface PlaceResult {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: PlaceResult) => void;
}

export const PlacesAutocomplete = ({ label = "Delivery Address", value, onChange, onPlaceSelected }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'in' },  // India only
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.geometry?.location) return;

      const components = place.address_components ?? [];
      const getComponent = (type: string) =>
        components.find(c => c.types.includes(type))?.long_name ?? '';

      onPlaceSelected({
        address: place.formatted_address ?? '',
        city: getComponent('locality'),
        state: getComponent('administrative_area_level_1'),
        pincode: getComponent('postal_code'),
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      });
      onChange(place.formatted_address ?? '');
    });
  }, []);

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      inputRef={inputRef}
      sx={{
        '& .MuiInputBase-root': { bgcolor: 'var(--surface-2)', color: 'var(--text-1)' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
        '& .MuiInputLabel-root': { color: 'var(--text-2)' }
      }}
    />
  );
};
```

**Step 3: Use in CheckoutPage**

Replace the plain delivery address `TextField` with `<PlacesAutocomplete>`. On `onPlaceSelected`, set lat/lng in state and trigger delivery fee calculation (from Phase 3.3).

**Step 4: Build and test**

```bash
npm run build
```

Test: enter address in checkout → autocomplete suggestions appear → select → lat/lng populated → delivery fee calculated.

**Step 5: Commit**

```bash
git add frontend/src/components/customer/PlacesAutocomplete.tsx
git add frontend/src/pages/customer/CheckoutPage.tsx
git add frontend/index.html
git commit -m "feat(customer): Google Places Autocomplete for delivery address — auto-fills lat/lng for fee calculation"
```

---

## Task 4.8: Voice Input in ChatWidget

**Files:**
- Modify: `frontend/src/components/ChatWidget.tsx` (or wherever chat widget lives)
- Create: `frontend/src/types/speech.d.ts`

**Step 1: Find ChatWidget.tsx**

```bash
find frontend/src -name "*Chat*" -o -name "*chat*" | grep -v node_modules
```

**Step 2: Create TypeScript declarations for Web Speech API**

Create `frontend/src/types/speech.d.ts`:

```typescript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}
```

**Step 3: Add mic button to ChatWidget**

Find the input row (text field + send button). Add mic button:

```tsx
const [isListening, setIsListening] = useState(false);
const recognitionRef = useRef<SpeechRecognition | null>(null);

const startListening = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Voice input is not supported in your browser. Please try Chrome.');
    return;
  }

  recognitionRef.current = new SpeechRecognition();
  recognitionRef.current.lang = 'en-IN';  // Indian English
  recognitionRef.current.continuous = false;
  recognitionRef.current.interimResults = false;

  recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    setInput(prev => prev + (prev ? ' ' : '') + transcript);
    setIsListening(false);
  };

  recognitionRef.current.onerror = () => setIsListening(false);
  recognitionRef.current.onend = () => setIsListening(false);

  recognitionRef.current.start();
  setIsListening(true);
};

const stopListening = () => {
  recognitionRef.current?.stop();
  setIsListening(false);
};

// In JSX — next to the send button:
<IconButton
  onClick={isListening ? stopListening : startListening}
  sx={{
    color: isListening ? '#f44336' : 'inherit',
    // Pulsing animation when listening
    ...(isListening && {
      animation: 'mic-pulse 1.5s infinite',
      '@keyframes mic-pulse': {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.2)' },
        '100%': { transform: 'scale(1)' }
      }
    })
  }}
>
  {isListening ? <MicOff /> : <Mic />}
</IconButton>
```

**Step 4: Build and test**

```bash
npm run build
```

Test: open ChatWidget → click mic → speak → text appears in input field.

**Step 5: Commit**

```bash
git add frontend/src/components/ChatWidget.tsx
git add frontend/src/types/speech.d.ts
git commit -m "feat(chat): voice input in ChatWidget using Web Speech API, lang en-IN, pulsing mic animation"
```

---

## Task 4.9: Payment Preference Pre-selection

**Files:**
- Modify: `frontend/src/pages/customer/CheckoutPage.tsx` (or PaymentPage.tsx)

**Step 1: Read the payment page**

Find where payment method is selected (CASH / CARD / UPI radio buttons or similar).

**Step 2: Add pre-selection on mount**

```tsx
const { data: preferences } = useGetPreferencesQuery(currentUser?.id);
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

useEffect(() => {
  if (preferences?.preferredPaymentMethod) {
    const pref = preferences.preferredPaymentMethod;
    // Pre-select if CARD or UPI (not CASH for delivery — security)
    if (orderType !== 'DELIVERY' || pref !== 'CASH') {
      setSelectedPaymentMethod(pref);
    }
  }
}, [preferences, orderType]);
```

**Step 3: Save preference after successful payment**

```tsx
const [updatePreferences] = useUpdatePreferencesMutation();

const handlePaymentSuccess = async (method: string) => {
  // Save as preferred for next time (fire and forget)
  updatePreferences({
    userId: currentUser!.id,
    preferredPaymentMethod: method
  }).catch(e => console.warn('Could not save payment preference:', e));
};
```

**Step 4: Commit**

```bash
git add frontend/src/pages/customer/
git commit -m "feat(customer): auto-select preferred payment method on checkout, save after successful payment"
```

---

## Task 4.10: Staff Login Revamp

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.tsx`

**Step 1: Read LoginPage.tsx**

Find any emoji usage, current layout, demo role buttons.

**Step 2: Remove emojis — replace with MUI icons**

```tsx
// Before:
<Button>🍳 Kitchen Staff</Button>

// After:
<Button startIcon={<RestaurantIcon />}>Kitchen Staff</Button>
```

**Step 3: Add 2 more demo role buttons (total 5)**

Current roles (typically): Manager, Kitchen Staff, Driver, Cashier
Add: Assistant Manager

```tsx
const demoRoles = [
  { role: 'MANAGER', label: 'Manager', icon: <AdminPanelSettings /> },
  { role: 'ASSISTANT_MANAGER', label: 'Asst. Manager', icon: <SupervisorAccount /> },
  { role: 'KITCHEN_STAFF', label: 'Kitchen Staff', icon: <Restaurant /> },
  { role: 'DRIVER', label: 'Driver', icon: <LocalShipping /> },
  { role: 'CASHIER', label: 'Cashier', icon: <PointOfSale /> },
];
```

**Step 4: Left panel dark with decorative grid**

```tsx
{/* Left panel — visible on md+ screens */}
<Box sx={{
  display: { xs: 'none', md: 'flex' },
  width: '45%',
  bgcolor: '#1a1a1a',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden'
}}>
  {/* Decorative dot grid */}
  <Box sx={{
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    opacity: 0.5
  }} />
  <Box sx={{ position: 'relative', textAlign: 'center', p: 4 }}>
    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>MaSoVa</Typography>
    <Typography sx={{ color: '#888' }}>Restaurant Management Platform</Typography>
  </Box>
</Box>
```

**Step 5: Show password toggle**

```tsx
<TextField
  type={showPassword ? 'text' : 'password'}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    )
  }}
/>
```

**Step 6: Loading state on submit**

```tsx
<Button
  type="submit"
  disabled={isLoading}
  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
>
  {isLoading ? 'Signing in...' : 'Sign In'}
</Button>
```

**Step 7: Forgot password inline toggle (no navigation)**

```tsx
const [showForgotPassword, setShowForgotPassword] = useState(false);

{showForgotPassword ? (
  <Box>
    <TextField label="Email" type="email" fullWidth sx={{ mb: 2 }} />
    <Button variant="contained" fullWidth>Send Reset Link</Button>
    <Button onClick={() => setShowForgotPassword(false)}>Back to login</Button>
  </Box>
) : (
  <Button onClick={() => setShowForgotPassword(true)}>Forgot password?</Button>
)}
```

**Step 8: Build and commit**

```bash
npm run build
git add frontend/src/pages/auth/LoginPage.tsx
git commit -m "feat(auth): login page revamp — remove emojis, 5 demo roles, dark left panel, password toggle, loading state"
```

---

## Task 4.11: Manager Metrics Template

**Files:**
- Create: `frontend/src/components/manager/ManagerMetricTemplate.tsx`
- Modify: `frontend/src/pages/manager/DashboardPage.tsx`

**Step 1: Create template component**

Create `frontend/src/components/manager/ManagerMetricTemplate.tsx`:

```tsx
import { Box, Grid, Typography, Paper } from '@mui/material';
import { ReactNode } from 'react';

interface KPI {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

interface Props {
  title: string;
  kpis: KPI[];
  chartComponent?: ReactNode;
  filterBar?: ReactNode;
  tableComponent?: ReactNode;
  actions?: ReactNode;
}

export const ManagerMetricTemplate = ({
  title, kpis, chartComponent, filterBar, tableComponent, actions
}: Props) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>{title}</Typography>

    {/* KPI Row */}
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {kpis.map(kpi => (
        <Grid item xs={12} sm={6} md={3} key={kpi.label}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>{kpi.value}</Typography>
            {kpi.subtitle && (
              <Typography variant="caption" color={
                kpi.trend === 'up' ? 'success.main' :
                kpi.trend === 'down' ? 'error.main' : 'text.secondary'
              }>
                {kpi.subtitle}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>

    {/* Chart + filter bar */}
    {(chartComponent || filterBar) && (
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        {filterBar && <Box sx={{ mb: 2 }}>{filterBar}</Box>}
        {chartComponent}
      </Paper>
    )}

    {/* Data table */}
    {tableComponent && (
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        {tableComponent}
      </Paper>
    )}

    {/* Actions */}
    {actions && <Box sx={{ display: 'flex', gap: 2 }}>{actions}</Box>}
  </Box>
);
```

**Step 2: Apply to DashboardPage.tsx**

Refactor `DashboardPage.tsx` to use `ManagerMetricTemplate`:

```tsx
<ManagerMetricTemplate
  title="Store Dashboard"
  kpis={[
    { label: "Today's Revenue", value: `₹${analytics?.todayRevenue ?? 0}`, trend: 'up', subtitle: '+12% vs yesterday' },
    { label: "Active Orders", value: analytics?.activeOrders ?? 0 },
    { label: "Avg Prep Time", value: `${analytics?.avgPrepTime ?? 0}m` },
    { label: "Customer Rating", value: `${analytics?.avgRating ?? 0}★` }
  ]}
  chartComponent={<SalesChart data={analytics?.salesTrend} />}
  filterBar={<DateRangeFilter onChange={setDateRange} />}
/>
```

**Step 3: Build and commit**

```bash
npm run build
git add frontend/src/components/manager/ManagerMetricTemplate.tsx
git add frontend/src/pages/manager/DashboardPage.tsx
git commit -m "feat(manager): ManagerMetricTemplate — KPI row, chart, filter bar, table, action buttons pattern"
```

---

## Task 4.12: PromotionsPage Dark Redesign

**Files:**
- Modify: `frontend/src/pages/customer/PromotionsPage.tsx`

**Step 1: 3-column promo grid with red discount badges**

```tsx
<Grid container spacing={2} sx={{ p: 3 }}>
  {promotions.map(promo => (
    <Grid item xs={12} sm={6} md={4} key={promo.id}>
      <Box sx={{
        bgcolor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 2,
        p: 3,
        position: 'relative',
        '&:hover': { borderColor: 'var(--gold-dim)', transform: 'translateY(-2px)' },
        transition: 'all 0.2s ease'
      }}>
        {/* Red discount badge */}
        {promo.discountPercent && (
          <Box sx={{
            position: 'absolute', top: -10, right: 16,
            bgcolor: 'var(--red)', color: '#fff',
            borderRadius: '12px', px: 1.5, py: 0.5,
            fontSize: '0.75rem', fontWeight: 700
          }}>
            {promo.discountPercent}% OFF
          </Box>
        )}
        <Typography sx={{
          fontFamily: '"Playfair Display", serif',
          color: 'var(--gold)',
          fontSize: '1.25rem',
          mb: 1
        }}>
          {promo.title}
        </Typography>
        <Typography sx={{ color: 'var(--text-2)', fontSize: '0.875rem', mb: 2 }}>
          {promo.description}
        </Typography>
        {promo.code && (
          <Box sx={{
            border: '1px dashed var(--border-strong)',
            borderRadius: 1, px: 2, py: 1,
            fontFamily: 'monospace', color: 'var(--gold)', textAlign: 'center'
          }}>
            {promo.code}
          </Box>
        )}
      </Box>
    </Grid>
  ))}
</Grid>
```

**Step 2: Build and commit**

```bash
npm run build
git add frontend/src/pages/customer/PromotionsPage.tsx
git commit -m "feat(customer): PromotionsPage 3-column dark grid, red discount badges, gold promo codes"
```

---

## Execution Notes

### Design Tokens Reference
All dark design tokens use CSS custom properties from `index.css` via `var(--token-name)`. Never hardcode these hex values in component files.

### Which Pages Get Dark Theme
Customer routes only:
- `/` (HomePage)
- `/menu` (MenuPage)
- `/checkout` (CheckoutPage)
- `/order/:id` (OrderTrackingPage, LiveTrackingPage)
- `/promotions` (PromotionsPage)
- `/login` → `CustomerLoginPage` (NOT the staff `/staff/login`)
- `/register`

Staff routes (keep neumorphic, do NOT wrap in `CustomerLayout`):
- `/manager/*`
- `/kitchen`
- `/driver`
- `/cashier`
- `/staff/login`

### Task Order
Tasks are independent of each other except:
- Task 4.1 (CSS variables) must come FIRST — all other tasks depend on the CSS custom properties
- Task 4.7 (Places Autocomplete) should come after Task 4.6 (CheckoutPage) since they modify the same file
