# Customer Web Revamp — Design Document

**Date:** 2026-02-18
**Scope:** All customer-facing web pages
**Goal:** Replace the neumorphic light-gray design with a dark, premium European-restaurant aesthetic inspired by top Dribbble restaurant designs and EU food delivery leaders (Deliveroo, Wolt, Glovo).

---

## 1. Design System

### Color Palette
```
--bg:           #0A0908   Near-black warm canvas
--surface:      #141210   Card backgrounds
--surface-2:    #1C1916   Elevated panels, drawers
--surface-3:    #242018   Modals, tooltips
--gold:         #D4A843   Gold — headlines, hover states, price highlights, borders
--gold-light:   #E8C060   Lighter gold for hover
--red:          #C62A09   Red — primary CTAs ("Order Now", "Add to Cart")
--red-light:    #E53E3E   Brand red — badges, dietary indicators, live status
--border:       rgba(212,168,67,0.15)   Faint gold border on cards
--border-strong:rgba(212,168,67,0.35)   Hover/focus border
--text-1:       #FDFCF8   Primary text (warm near-white)
--text-2:       #B0A898   Secondary text
--text-3:       #6C6458   Tertiary / placeholder
--overlay:      rgba(10,9,8,0.8)   Drawer/modal overlay
```

### Typography
- **Display / Hero headlines:** `Playfair Display` (Google Font, serif)
  — Used for H1/H2 hero text: "it's not just Food, It's an Experience."
  — Mixed weight: light article words + bold nouns (achieved via `<em>` or `<span>` with bold weight)
- **Body / UI labels / buttons:** `DM Sans` (Google Font, clean geometric sans)
- **Prices / numbers / order IDs:** `DM Sans` 700 weight
- Import: `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap`

### Visual Patterns (from Dribbble references)
- **Circular food images** that visually "break out" of card boundaries (negative margin top on image)
- **Oversized hero headline** — 3–4 lines, 64–80px, mixed weight serif
- **Gold horizontal rule** or `gradient-to-right` fade as section dividers
- **Dark cards** with `border: 1px solid var(--border)` + subtle `box-shadow: 0 8px 32px rgba(0,0,0,0.6)` on hover
- **No neumorphic shadows** anywhere — replaced by dark surface + gold border system
- **CSS transitions** only — no new animation libraries (project uses MUI + RTK Query, keep deps stable)

---

## 2. Page-by-Page Design

### A. AppHeader (all pages)
**Reference:** Wolt.com / Deliveroo nav
- Dark bar: `background: rgba(10,9,8,0.95)`, `backdrop-filter: blur(20px)`, sticky top-0
- Left: `MaSoVa` in Playfair Display bold, gold color
- Center: nav links (Menu, Promotions, Track Order) in DM Sans, text-2 color, gold underline on hover
- Right: cart icon with red badge count, profile avatar or "Sign In" pill button
- Mobile: hamburger → slide-down dark menu

### B. HomePage (/)
**Reference:** noma.dk hero + Dribbble shot "Huff & Puff" (shot 4)

**Section 1 — Hero:**
- Full-viewport dark section
- Left: Playfair Display 72px headline: `"it's not just Food, It's an Experience."` (italic "an Experience" in gold)
- Below headline: subtitle in DM Sans text-2, 16px
- Two buttons: `[View Menu]` red filled + `[Our Story]` transparent with gold border
- Social proof row: 3 avatar circles + "4.9★ from 2,400+ reviews" in text-2
- Right: large circular bowl/dish photo (400×400px, `border-radius: 50%`) with floating herb/ingredient cutouts
- Background: `#0A0908` with subtle grain texture overlay (CSS `noise` via SVG filter or pseudo-element)

**Section 2 — Category Pills:**
- Horizontal scroll row of cuisine category pills
- Each pill: dark surface-2 card, 80×80px image, category name below
- Active/hover: gold border, slight scale(1.05)

**Section 3 — Most Popular Items:**
- Heading: `"Our Best <span gold>Delivered</span>"` in Playfair Display
- 4-column horizontal card carousel
- Each card: dark surface, circular food image breaking out of top, item name, description, price in gold/bold, red cart button

**Section 4 — Promotions Banner:**
- Full-width dark band with gold headline and a featured promo card
- `"Hot Offer of the Week — Grab it before it's gone!"`

**Section 5 — Why MaSoVa:**
- 3-column icon + text features: Fresh Ingredients / Fast Delivery / Easy Ordering
- Icons in gold, text in text-2

**Section 6 — Footer:**
- Dark surface-2 background
- 4 columns: Logo+tagline, Quick Links, Support, Newsletter signup
- Social icons in gold on hover

---

### C. PromotionsPage (/promotions)
**Reference:** Glovo promotions grid
- Header: `"Exclusive Deals"` Playfair Display, gold accent on "Deals"
- Category filter pills (same style as homepage pills) — dark surface, gold active state
- 3-column promo card grid
- Each card: dark surface, top image (16:9 ratio), discount badge (red pill top-right), title, validity, "Order Now" red button
- Hover: card lifts with `translateY(-4px)`, gold border appears

---

### D. PublicMenuPage + MenuPage (/menu)
**Reference:** Deliveroo menu page layout

**Layout:** Fixed left sidebar (280px) + main content area

**Left Sidebar:**
- Store selector (dark surface-2 card at top)
- Cuisine filter (accordion sections, gold active indicator)
- Dietary filter (checkbox pills: Veg / Vegan / Non-Veg / Jain)
- Spice level filter

**Main Area:**
- Sticky top search bar (dark input, gold focus ring)
- Section headers per cuisine (Playfair Display 28px + thin gold divider line)
- Menu grid: `repeat(auto-fill, minmax(300px, 1fr))`
- **Menu card:** dark surface, food photo (200px height, cover), item name (DM Sans 600), description (text-2, 2-line clamp), dietary badges (color-coded pills), price in gold bold, "Add" button (red, right-aligned)
- Cart quantity control: `-` qty `+` in red, replaces "Add" once item in cart

---

### E. CartDrawer
**Reference:** Thuisbezorgd.nl (Takeaway.com Netherlands) cart sidebar
- Slide in from right, 420px wide, `background: var(--surface-2)`
- Header: `"Your Order"` in Playfair Display + gold divider
- Item rows: thumbnail left, name + customizations center, quantity controls + price right
- Empty state: large food icon illustration + "Your cart is empty" in text-2
- Footer (sticky): subtotal / delivery / tax rows → Total in Playfair Display gold → "Proceed to Checkout" red full-width button

---

### F. CustomerLoginPage (/customer-login)
**Reference:** Deliveroo auth page
- Centered card (max 440px), `background: var(--surface)`, gold top border accent
- Logo + "Welcome back" in Playfair Display
- Email + Password inputs: dark surface-2 bg, gold focus border
- "Sign in" button: red full-width
- Google OAuth button: dark surface, white Google logo, text-1
- "Don't have an account? Register" link in gold

---

### G. RegisterPage (/register)
- Same card layout as login
- "Create your account" heading
- Fields: First Name, Last Name, Email, Phone, Password, Confirm Password
- Same dark input styling with gold focus
- "Create Account" red button
- Terms acceptance checkbox

---

### H. GuestCheckoutPage (/guest-checkout)
**Reference:** Wolt checkout flow
- 2-column: form left (8 cols) + sticky order summary right (4 cols)
- Section cards with gold left-border accent (3px solid var(--gold))
- Address cards for saved addresses: dark surface, label badge, gold "Select" on hover
- New address form: same dark inputs with gold focus
- Order summary card: dark surface-2, items list, bill breakdown, total in gold bold

---

### I. OrderTrackingPage + LiveTrackingPage
**Reference:** Glovo live tracking
- Dark background continues
- Status timeline: vertical line in gold, completed steps filled gold circles, pending steps hollow
- Driver info card: dark surface, circular avatar, name, phone (call button)
- Map container: dark map tiles (`style: 'mapbox://styles/mapbox/dark-v11'` or existing Google Maps with dark theme applied)
- ETA badge: prominent gold pill at top

---

## 3. What Changes vs Current

| Current | New |
|---------|-----|
| `#f0f0f0` neumorphic base | `#0A0908` dark warm base |
| Raised/inset box shadows | Dark surface + gold border system |
| SF Pro Display font | Playfair Display (display) + DM Sans (body) |
| Blue gradient CTAs | Red `#C62A09` CTAs |
| Light gray card backgrounds | `#141210` dark card surfaces |
| ₹ hardcoded in UI text | Kept as-is (localization phase 2) |
| Emojis in headings | Clean text + icon components |
| `colors.brand.primary` (#e53e3e) as primary accent | Gold `#D4A843` for highlights, red for actions |

---

## 4. What Does NOT Change

- All RTK Query API calls (zero backend changes)
- Redux store structure
- Cart logic, checkout flow, auth flow
- Indian currency/address/phone (localization is a separate phase)
- Routing structure in App.tsx
- MUI ThemeProvider (we override via `sx` props and CSS variables, not a new theme)
- WebSocket order tracking functionality

---

## 5. Implementation Order

1. **Design tokens** — update `design-tokens.ts` with new dark palette + add Google Fonts import to `index.html`
2. **AppHeader** — dark glassmorphic nav (affects all pages)
3. **HomePage** — full redesign (hero, category pills, popular items, footer)
4. **MenuPage** — sidebar layout + dark menu cards
5. **CartDrawer** — dark slide-in drawer
6. **PromotionsPage** — dark card grid
7. **CustomerLoginPage + RegisterPage** — dark auth cards
8. **GuestCheckoutPage** — dark checkout layout
9. **OrderTrackingPage + LiveTrackingPage** — dark tracking UI

---

## 6. Technical Notes

- Add Google Fonts to `frontend/index.html` `<head>` (no npm package needed)
- Use CSS custom properties (`var(--bg)` etc.) defined in `:root` inside `index.css` — this avoids touching MUI theme and keeps changes scoped
- All new colors use the CSS vars; existing MUI theme stays untouched
- `design-tokens.ts` updated to export new dark tokens (existing neumorphic tokens kept but marked as legacy)
- No new npm dependencies required
