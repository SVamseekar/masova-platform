# Customer Web Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the neumorphic light-gray customer UI with a dark, premium European restaurant design matching the approved "WorldPlate Dark" aesthetic from the design doc.

**Architecture:** CSS custom properties defined in `index.css` `:root` drive the entire dark palette — no MUI theme changes needed. Google Fonts added to `index.html`. Each page rewritten component by component using existing MUI primitives (`Box`, `Typography`, `Stack`, etc.) styled with `sx` props and the CSS vars. Zero new npm dependencies.

**Tech Stack:** React 19, TypeScript, MUI v5, RTK Query, Vite, CSS custom properties, Google Fonts (Playfair Display + DM Sans)

**Design doc:** `docs/plans/2026-02-18-customer-web-revamp-design.md`

---

## Task 1: Design Tokens & Global CSS
  
**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/styles/design-tokens.ts`

**Step 1: Add Google Fonts to index.html**

In `frontend/index.html`, add inside `<head>` before any existing `<link>` tags:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**Step 2: Add CSS custom properties to index.css**

Add at the top of `frontend/src/index.css` (before any existing rules):
```css
:root {
  --bg: #0A0908;
  --surface: #141210;
  --surface-2: #1C1916;
  --surface-3: #242018;
  --gold: #D4A843;
  --gold-light: #E8C060;
  --red: #C62A09;
  --red-light: #E53E3E;
  --border: rgba(212, 168, 67, 0.15);
  --border-strong: rgba(212, 168, 67, 0.35);
  --text-1: #FDFCF8;
  --text-2: #B0A898;
  --text-3: #6C6458;
  --overlay: rgba(10, 9, 8, 0.85);
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --radius-card: 16px;
  --radius-pill: 999px;
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-card-hover: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px var(--border-strong);
  --transition: 0.2s ease;
}

body {
  background-color: var(--bg);
  color: var(--text-1);
  font-family: var(--font-body);
  margin: 0;
}

* {
  box-sizing: border-box;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
```

**Step 3: Update design-tokens.ts dark section**

In `frontend/src/styles/design-tokens.ts`, add/replace the `colors` export dark section:
```typescript
export const darkColors = {
  bg: '#0A0908',
  surface: '#141210',
  surface2: '#1C1916',
  surface3: '#242018',
  gold: '#D4A843',
  goldLight: '#E8C060',
  red: '#C62A09',
  redLight: '#E53E3E',
  text1: '#FDFCF8',
  text2: '#B0A898',
  text3: '#6C6458',
};
```

**Step 4: Verify fonts load**

Run `npm run dev` from `frontend/`, open http://localhost:3000 in browser. Open DevTools → Network → filter "font" — should see Playfair Display and DM Sans loaded. Body background should be `#0A0908` (near-black).

**Step 5: Commit**
```bash
git add frontend/index.html frontend/src/index.css frontend/src/styles/design-tokens.ts
git commit -m "feat: add dark design tokens and Google Fonts for EU revamp"
```

---

## Task 2: AppHeader — Dark Glassmorphic Nav

**Files:**
- Modify: `frontend/src/components/common/AppHeader.tsx`

**Context:** AppHeader renders on all customer pages. Currently light-themed with neumorphic styling. Read the file first to understand the existing structure before editing.

**Step 1: Read the current file**
```bash
cat frontend/src/components/common/AppHeader.tsx
```

**Step 2: Replace the header container and logo styles**

The header `sx` prop on the root element should become:
```typescript
sx={{
  position: 'sticky',
  top: 0,
  zIndex: 1200,
  background: 'rgba(10, 9, 8, 0.92)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border)',
  px: { xs: 2, md: 6 },
  py: 1.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
}}
```

**Step 3: Update logo typography**
```typescript
// Logo text
<Typography
  sx={{
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1.5rem',
    color: 'var(--gold)',
    letterSpacing: '-0.02em',
    cursor: 'pointer',
  }}
  onClick={() => navigate('/')}
>
  MaSoVa
</Typography>
```

**Step 4: Update nav links**

Each nav link gets:
```typescript
sx={{
  color: 'var(--text-2)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  fontWeight: 500,
  textDecoration: 'none',
  pb: 0.5,
  borderBottom: '2px solid transparent',
  transition: 'var(--transition)',
  '&:hover': {
    color: 'var(--text-1)',
    borderBottomColor: 'var(--gold)',
  },
}}
```

**Step 5: Update cart icon button and badge**

Cart icon wrapper:
```typescript
sx={{
  color: 'var(--text-2)',
  '&:hover': { color: 'var(--gold)' },
  transition: 'var(--transition)',
}}
```

Badge (MUI `<Badge badgeContent={cartCount} color="error">`):
- Keep existing badge but ensure badge color uses `--red`

**Step 6: Update Sign In / Profile button**
```typescript
// Sign In pill
sx={{
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--border-strong)',
  color: 'var(--text-1)',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  px: 2.5,
  py: 0.75,
  '&:hover': {
    background: 'var(--surface-2)',
    borderColor: 'var(--gold)',
    color: 'var(--gold)',
  },
  transition: 'var(--transition)',
}}
```

**Step 7: Verify**

Open http://localhost:3000 — header should be dark, semi-transparent, sticky. Logo in gold Playfair Display. Nav links in warm gray with gold underline hover.

**Step 8: Commit**
```bash
git add frontend/src/components/common/AppHeader.tsx
git commit -m "feat: revamp AppHeader to dark glassmorphic nav"
```

---

## Task 3: HomePage — Full Dark Redesign

**Files:**
- Modify: `frontend/src/apps/PublicWebsite/HomePage.tsx`

**Context:** The current homepage has a light neumorphic hero, feature cards, and a footer. We're replacing all sections with the dark European design. The API calls and Redux usage stay identical.

**Step 1: Read current file**
```bash
cat frontend/src/apps/PublicWebsite/HomePage.tsx
```

**Step 2: Replace the page root background**

The outermost `Box` gets:
```typescript
sx={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-1)' }}
```

**Step 3: Hero section**

Replace the existing hero with:
```tsx
{/* Hero */}
<Box sx={{
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  px: { xs: 3, md: 10 },
  position: 'relative',
  overflow: 'hidden',
}}>
  {/* Background grain overlay */}
  <Box sx={{
    position: 'absolute', inset: 0,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
    opacity: 0.4,
    pointerEvents: 'none',
  }} />

  <Grid container spacing={6} alignItems="center" sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
    <Grid item xs={12} md={6}>
      <Typography
        sx={{
          fontFamily: 'var(--font-display)',
          fontSize: { xs: '3rem', md: '4.5rem', lg: '5.5rem' },
          fontWeight: 900,
          lineHeight: 1.1,
          color: 'var(--text-1)',
          mb: 3,
        }}
      >
        it's not just Food,{' '}
        <Box component="span" sx={{ color: 'var(--gold)', fontStyle: 'italic' }}>
          It's an Experience.
        </Box>
      </Typography>

      <Typography sx={{ color: 'var(--text-2)', fontSize: '1.1rem', mb: 4, maxWidth: 480 }}>
        Fresh ingredients, bold flavours, delivered to your door in 30 minutes or less.
      </Typography>

      <Stack direction="row" gap={2} flexWrap="wrap">
        <Button
          component={RouterLink} to="/menu"
          sx={{
            background: 'var(--red)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            px: 4, py: 1.5,
            borderRadius: 'var(--radius-pill)',
            '&:hover': { background: 'var(--red-light)', transform: 'translateY(-2px)' },
            transition: 'var(--transition)',
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          View Menu
        </Button>
        <Button
          sx={{
            border: '1px solid var(--border-strong)',
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            px: 4, py: 1.5,
            borderRadius: 'var(--radius-pill)',
            '&:hover': { borderColor: 'var(--gold)', color: 'var(--gold)' },
            transition: 'var(--transition)',
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          Our Story
        </Button>
      </Stack>

      {/* Social proof */}
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 4 }}>
        <Stack direction="row">
          {['#E53E3E', '#D4A843', '#4CAF50'].map((c, i) => (
            <Box key={i} sx={{
              width: 36, height: 36, borderRadius: '50%',
              background: c, border: '2px solid var(--bg)',
              ml: i > 0 ? -1.5 : 0,
            }} />
          ))}
        </Stack>
        <Typography sx={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
          <Box component="span" sx={{ color: 'var(--gold)', fontWeight: 700 }}>4.9★</Box>
          {' '}from 2,400+ happy customers
        </Typography>
      </Stack>
    </Grid>

    <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
      {/* Circular hero image */}
      <Box sx={{
        width: 480, height: 480,
        borderRadius: '50%',
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 0 80px rgba(212,168,67,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography sx={{ fontSize: '8rem' }}>🍜</Typography>
      </Box>
    </Grid>
  </Grid>
</Box>
```

**Step 4: Category pills section**

Replace existing cuisine section:
```tsx
{/* Category Pills */}
<Box sx={{ px: { xs: 3, md: 10 }, py: 8, maxWidth: 1400, mx: 'auto' }}>
  <Typography sx={{
    fontFamily: 'var(--font-display)',
    fontSize: { xs: '2rem', md: '2.75rem' },
    fontWeight: 700,
    mb: 1,
    color: 'var(--text-1)',
  }}>
    What are you{' '}
    <Box component="span" sx={{ color: 'var(--gold)' }}>craving?</Box>
  </Typography>
  <Typography sx={{ color: 'var(--text-2)', mb: 4 }}>
    Browse by cuisine — something for every mood
  </Typography>

  <Stack direction="row" gap={2} flexWrap="wrap">
    {[
      { label: 'South Indian', emoji: '🍛' },
      { label: 'North Indian', emoji: '🫓' },
      { label: 'Pizza', emoji: '🍕' },
      { label: 'Chinese', emoji: '🥡' },
      { label: 'Burgers', emoji: '🍔' },
      { label: 'Desserts', emoji: '🍰' },
      { label: 'Beverages', emoji: '🧋' },
    ].map((cat) => (
      <Box
        key={cat.label}
        component={RouterLink}
        to={`/menu?cuisine=${cat.label.toUpperCase().replace(' ', '_')}`}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 3, py: 1.5,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          color: 'var(--text-2)',
          textDecoration: 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: '0.9rem',
          transition: 'var(--transition)',
          '&:hover': {
            background: 'var(--surface-2)',
            borderColor: 'var(--gold)',
            color: 'var(--gold)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <span>{cat.emoji}</span>
        {cat.label}
      </Box>
    ))}
  </Stack>
</Box>
```

**Step 5: Most Popular Items section**

```tsx
{/* Most Popular */}
<Box sx={{ px: { xs: 3, md: 10 }, py: 8, background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
    <Typography sx={{
      fontFamily: 'var(--font-display)',
      fontSize: { xs: '2rem', md: '2.75rem' },
      fontWeight: 700,
      mb: 4,
      color: 'var(--text-1)',
    }}>
      Our Best{' '}
      <Box component="span" sx={{ color: 'var(--gold)', fontStyle: 'italic' }}>Delivered</Box>
    </Typography>

    <Grid container spacing={3}>
      {[
        { name: 'Masala Dosa', desc: 'Crispy crepe with spiced potato filling', price: '₹149', emoji: '🥞' },
        { name: 'Chicken Biryani', desc: 'Aromatic basmati rice with tender chicken', price: '₹299', emoji: '🍚' },
        { name: 'Margherita Pizza', desc: 'San Marzano tomato, fresh mozzarella', price: '₹349', emoji: '🍕' },
        { name: 'Chocolate Lava Cake', desc: 'Warm molten centre, vanilla ice cream', price: '₹199', emoji: '🍫' },
      ].map((item) => (
        <Grid item xs={12} sm={6} lg={3} key={item.name}>
          <Box sx={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border)',
            pt: 6, pb: 3, px: 3,
            position: 'relative',
            transition: 'var(--transition)',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 'var(--shadow-card-hover)',
              transform: 'translateY(-4px)',
            },
          }}>
            {/* Circular image breaking out of top */}
            <Box sx={{
              position: 'absolute', top: -40, left: '50%',
              transform: 'translateX(-50%)',
              width: 90, height: 90, borderRadius: '50%',
              background: 'var(--surface-3)',
              border: '3px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}>
              {item.emoji}
            </Box>
            <Typography sx={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              color: 'var(--text-1)',
              mb: 0.5,
              mt: 1,
            }}>
              {item.name}
            </Typography>
            <Typography sx={{
              color: 'var(--text-3)',
              fontSize: '0.8rem',
              mb: 2,
            }}>
              {item.desc}
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                color: 'var(--gold)',
                fontSize: '1.1rem',
              }}>
                {item.price}
              </Typography>
              <Box sx={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: 'var(--red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                fontSize: '1.25rem',
                cursor: 'pointer',
                '&:hover': { background: 'var(--red-light)' },
                transition: 'var(--transition)',
              }}>
                +
              </Box>
            </Stack>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
</Box>
```

**Step 6: Why MaSoVa section**

```tsx
{/* Why MaSoVa */}
<Box sx={{ px: { xs: 3, md: 10 }, py: 10, maxWidth: 1400, mx: 'auto' }}>
  <Grid container spacing={4}>
    {[
      { icon: '🌿', title: 'Fresh Every Day', desc: 'Ingredients sourced daily from local markets — no frozen shortcuts.' },
      { icon: '⚡', title: '30-Min Delivery', desc: 'Real-time tracking. Your food arrives hot, every time.' },
      { icon: '✨', title: 'Easy Ordering', desc: 'Browse, customise, checkout in under 2 minutes. No fuss.' },
    ].map((feat) => (
      <Grid item xs={12} md={4} key={feat.title}>
        <Box sx={{
          p: 4,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          height: '100%',
          '&:hover': { borderColor: 'var(--border-strong)' },
          transition: 'var(--transition)',
        }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>{feat.icon}</Typography>
          <Typography sx={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'var(--text-1)',
            mb: 1,
          }}>
            {feat.title}
          </Typography>
          <Typography sx={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
            {feat.desc}
          </Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
</Box>
```

**Step 7: Footer**

```tsx
{/* Footer */}
<Box sx={{
  background: 'var(--surface)',
  borderTop: '1px solid var(--border)',
  px: { xs: 3, md: 10 },
  py: 6,
}}>
  <Grid container spacing={4} sx={{ maxWidth: 1400, mx: 'auto' }}>
    <Grid item xs={12} md={4}>
      <Typography sx={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1.5rem',
        color: 'var(--gold)',
        mb: 1,
      }}>MaSoVa</Typography>
      <Typography sx={{ color: 'var(--text-3)', fontSize: '0.875rem', maxWidth: 280 }}>
        Modern flavours, timeless quality. Delivered to your door.
      </Typography>
    </Grid>
    <Grid item xs={6} md={2}>
      <Typography sx={{ fontWeight: 600, color: 'var(--text-2)', mb: 2, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Explore</Typography>
      {['Menu', 'Promotions', 'Track Order'].map(link => (
        <Typography key={link} sx={{ color: 'var(--text-3)', mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { color: 'var(--gold)' }, transition: 'var(--transition)' }}>{link}</Typography>
      ))}
    </Grid>
    <Grid item xs={6} md={2}>
      <Typography sx={{ fontWeight: 600, color: 'var(--text-2)', mb: 2, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Support</Typography>
      {['Contact Us', 'FAQs', 'Privacy Policy'].map(link => (
        <Typography key={link} sx={{ color: 'var(--text-3)', mb: 1, fontSize: '0.875rem', cursor: 'pointer', '&:hover': { color: 'var(--gold)' }, transition: 'var(--transition)' }}>{link}</Typography>
      ))}
    </Grid>
    <Grid item xs={12} md={4}>
      <Typography sx={{ fontWeight: 600, color: 'var(--text-2)', mb: 2, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stay Updated</Typography>
      <Stack direction="row" gap={1}>
        <Box component="input" placeholder="Your email" sx={{
          flex: 1, px: 2, py: 1.25,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          color: 'var(--text-1)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          outline: 'none',
          '&:focus': { borderColor: 'var(--gold)' },
        }} />
        <Box component="button" sx={{
          px: 3, py: 1.25,
          background: 'var(--red)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          cursor: 'pointer',
          '&:hover': { background: 'var(--red-light)' },
          transition: 'var(--transition)',
        }}>
          Subscribe
        </Box>
      </Stack>
    </Grid>
  </Grid>
  <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4, pt: 3, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography sx={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
      © 2026 MaSoVa. All rights reserved.
    </Typography>
    <Typography sx={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
      Crafted with ❤️ for food lovers
    </Typography>
  </Box>
</Box>
```

**Step 8: Verify**

Open http://localhost:3000 — dark hero with Playfair Display headline, gold accent text, circular food image placeholder, red CTA buttons, dark category pills, dark food cards with circular images breaking out of top.

**Step 9: Commit**
```bash
git add frontend/src/apps/PublicWebsite/HomePage.tsx
git commit -m "feat: revamp HomePage to dark European restaurant design"
```

---

## Task 4: MenuPage — Dark Sidebar + Card Grid

**Files:**
- Modify: `frontend/src/pages/customer/MenuPage.tsx`

**Step 1: Read the current file**
```bash
wc -l frontend/src/pages/customer/MenuPage.tsx
```

**Step 2: Update page container and layout**

The outermost Box wrapping MenuPage content:
```typescript
sx={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex' }}
```

**Step 3: Sidebar styling**

The filter sidebar container:
```typescript
sx={{
  width: 280,
  flexShrink: 0,
  background: 'var(--surface)',
  borderRight: '1px solid var(--border)',
  p: 3,
  position: 'sticky',
  top: 64,
  height: 'calc(100vh - 64px)',
  overflowY: 'auto',
  display: { xs: 'none', md: 'block' },
}}
```

Filter section headings:
```typescript
sx={{
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-3)',
  mb: 1.5,
  mt: 3,
}}
```

Filter pills (cuisine / dietary buttons):
```typescript
// Inactive
sx={{
  px: 2, py: 0.75,
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--text-2)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'var(--transition)',
  '&:hover': { borderColor: 'var(--border-strong)', color: 'var(--text-1)' },
}}

// Active
sx={{
  background: 'rgba(212, 168, 67, 0.15)',
  borderColor: 'var(--gold)',
  color: 'var(--gold)',
}}
```

**Step 4: Search bar styling**

```typescript
sx={{
  '& .MuiOutlinedInput-root': {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-pill)',
    '& fieldset': { borderColor: 'var(--border)' },
    '&:hover fieldset': { borderColor: 'var(--border-strong)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--gold)' },
    '& input': { color: 'var(--text-1)', fontFamily: 'var(--font-body)' },
    '& input::placeholder': { color: 'var(--text-3)' },
  },
}}
```

**Step 5: Section headers (per cuisine)**

```typescript
sx={{
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '1.75rem',
  color: 'var(--text-1)',
  mb: 0.5,
  mt: 4,
}}
// Gold divider after:
<Box sx={{ height: 1, background: 'linear-gradient(to right, var(--gold), transparent)', mb: 3 }} />
```

**Step 6: Menu item card**

Replace each card with:
```tsx
<Box sx={{
  background: 'var(--surface)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  transition: 'var(--transition)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 'var(--shadow-card-hover)',
  },
}}>
  {/* Food image */}
  <Box sx={{
    height: 180,
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '4rem',
    position: 'relative',
  }}>
    {/* Use actual image if available, else emoji fallback */}
    {item.imageUrl
      ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <span>🍽️</span>
    }
    {/* Dietary badge */}
    {item.dietaryInfo?.includes('VEGETARIAN') && (
      <Box sx={{
        position: 'absolute', top: 8, left: 8,
        width: 18, height: 18, borderRadius: '50%',
        background: '#2e7d32',
        border: '1px solid #4caf50',
      }} />
    )}
  </Box>

  {/* Card body */}
  <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
    <Typography sx={{
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      color: 'var(--text-1)',
      mb: 0.5,
      fontSize: '0.95rem',
    }}>
      {item.name}
    </Typography>
    <Typography sx={{
      color: 'var(--text-3)',
      fontSize: '0.78rem',
      mb: 2,
      flex: 1,
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    }}>
      {item.description}
    </Typography>

    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{
        fontWeight: 700,
        color: 'var(--gold)',
        fontFamily: 'var(--font-body)',
      }}>
        ₹{item.basePrice}
      </Typography>

      {/* Quantity controls or Add button */}
      {cartQty > 0 ? (
        <Stack direction="row" alignItems="center" gap={1}>
          <Box onClick={() => removeFromCart(item.id)} sx={qtyBtnSx}>−</Box>
          <Typography sx={{ color: 'var(--text-1)', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{cartQty}</Typography>
          <Box onClick={() => addToCart(item)} sx={{ ...qtyBtnSx, background: 'var(--red)' }}>+</Box>
        </Stack>
      ) : (
        <Box onClick={() => addToCart(item)} sx={{
          px: 2, py: 0.75,
          background: 'var(--red)',
          color: '#fff',
          borderRadius: 'var(--radius-pill)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '0.8rem',
          cursor: 'pointer',
          '&:hover': { background: 'var(--red-light)' },
          transition: 'var(--transition)',
        }}>
          Add
        </Box>
      )}
    </Stack>
  </Box>
</Box>
```

Where `qtyBtnSx`:
```typescript
const qtyBtnSx = {
  width: 28, height: 28,
  borderRadius: '50%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-1)',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'var(--transition)',
  '&:hover': { borderColor: 'var(--gold)', color: 'var(--gold)' },
};
```

**Step 7: Verify**

Open http://localhost:3000/menu — dark sidebar with gold filter pills, dark food cards, gold prices, red Add buttons.

**Step 8: Commit**
```bash
git add frontend/src/pages/customer/MenuPage.tsx
git commit -m "feat: revamp MenuPage to dark sidebar + card grid"
```

---

## Task 5: CartDrawer — Dark Slide-In Drawer

**Files:**
- Modify: `frontend/src/components/cart/CartDrawer.tsx`

**Step 1: Read the current file**

**Step 2: Update drawer container**
```typescript
// MUI Drawer paper props
PaperProps={{
  sx: {
    width: { xs: '100vw', sm: 420 },
    background: 'var(--surface-2)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
  },
}}
```

**Step 3: Drawer header**
```tsx
<Box sx={{
  px: 3, py: 2.5,
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}}>
  <Typography sx={{
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1.5rem',
    color: 'var(--text-1)',
  }}>
    Your Order
  </Typography>
  <IconButton onClick={onClose} sx={{ color: 'var(--text-2)' }}>
    <CloseIcon />
  </IconButton>
</Box>
```

**Step 4: Item rows**
```tsx
<Box sx={{
  display: 'flex',
  gap: 2,
  py: 2,
  borderBottom: '1px solid var(--border)',
  alignItems: 'flex-start',
}}>
  {/* Thumbnail */}
  <Box sx={{
    width: 60, height: 60,
    borderRadius: 'var(--radius-card)',
    background: 'var(--surface-3)',
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.75rem',
  }}>
    🍽️
  </Box>
  <Box sx={{ flex: 1 }}>
    <Typography sx={{ color: 'var(--text-1)', fontWeight: 600, fontSize: '0.9rem', mb: 0.25 }}>
      {item.menuItem.name}
    </Typography>
    <Typography sx={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
      {item.selectedVariant?.name}
    </Typography>
  </Box>
  {/* Qty + price */}
  <Stack alignItems="flex-end" gap={0.5}>
    <Typography sx={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.9rem' }}>
      ₹{item.totalPrice}
    </Typography>
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Box onClick={() => onDecrement(item)} sx={miniQtyBtnSx}>−</Box>
      <Typography sx={{ color: 'var(--text-1)', fontSize: '0.85rem', minWidth: 16, textAlign: 'center' }}>{item.quantity}</Typography>
      <Box onClick={() => onIncrement(item)} sx={{ ...miniQtyBtnSx, background: 'var(--red)' }}>+</Box>
    </Stack>
  </Stack>
</Box>
```

**Step 5: Footer summary**
```tsx
<Box sx={{
  mt: 'auto',
  borderTop: '1px solid var(--border)',
  px: 3, py: 3,
  background: 'var(--surface)',
}}>
  {/* Bill rows */}
  {[
    { label: 'Subtotal', value: `₹${subtotal}` },
    { label: 'Delivery', value: `₹29` },
    { label: 'Tax (5%)', value: `₹${tax}` },
  ].map(row => (
    <Stack key={row.label} direction="row" justifyContent="space-between" mb={1}>
      <Typography sx={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>{row.label}</Typography>
      <Typography sx={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>{row.value}</Typography>
    </Stack>
  ))}

  <Box sx={{ height: 1, background: 'var(--border)', my: 2 }} />

  <Stack direction="row" justifyContent="space-between" mb={3}>
    <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-1)', fontSize: '1.1rem' }}>Total</Typography>
    <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: '1.25rem' }}>₹{total}</Typography>
  </Stack>

  <Button
    fullWidth
    component={RouterLink}
    to="/checkout"
    onClick={onClose}
    sx={{
      background: 'var(--red)',
      color: '#fff',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      py: 1.75,
      borderRadius: 'var(--radius-pill)',
      fontSize: '1rem',
      textTransform: 'none',
      '&:hover': { background: 'var(--red-light)' },
      transition: 'var(--transition)',
    }}
  >
    Proceed to Checkout →
  </Button>
  <Typography sx={{ color: 'var(--text-3)', fontSize: '0.75rem', textAlign: 'center', mt: 1.5 }}>
    Items reserved for 15 minutes
  </Typography>
</Box>
```

**Step 6: Commit**
```bash
git add frontend/src/components/cart/CartDrawer.tsx
git commit -m "feat: revamp CartDrawer to dark slide-in drawer"
```

---

## Task 6: PromotionsPage — Dark Card Grid

**Files:**
- Modify: `frontend/src/apps/PublicWebsite/PromotionsPage.tsx`

**Step 1: Page container**
```typescript
sx={{ background: 'var(--bg)', minHeight: '100vh', px: { xs: 3, md: 10 }, py: 8 }}
```

**Step 2: Page heading**
```tsx
<Typography sx={{
  fontFamily: 'var(--font-display)',
  fontSize: { xs: '2.5rem', md: '3.5rem' },
  fontWeight: 900,
  color: 'var(--text-1)',
  mb: 1,
}}>
  Exclusive{' '}
  <Box component="span" sx={{ color: 'var(--gold)', fontStyle: 'italic' }}>Deals</Box>
</Typography>
```

**Step 3: Category filter pills** — same style as homepage pills (dark surface, gold active)

**Step 4: Promotion card**
```tsx
<Box sx={{
  background: 'var(--surface)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
  transition: 'var(--transition)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 'var(--shadow-card-hover)',
  },
}}>
  {/* Image area */}
  <Box sx={{
    height: 200,
    background: 'var(--surface-2)',
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '5rem',
  }}>
    {promo.emoji}
    {/* Discount badge */}
    <Box sx={{
      position: 'absolute', top: 12, right: 12,
      background: 'var(--red)',
      color: '#fff',
      px: 1.5, py: 0.5,
      borderRadius: 'var(--radius-pill)',
      fontWeight: 700,
      fontSize: '0.8rem',
    }}>
      {promo.discount}
    </Box>
  </Box>
  {/* Content */}
  <Box sx={{ p: 2.5 }}>
    <Typography sx={{
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: 'var(--text-1)',
      mb: 0.5,
    }}>
      {promo.title}
    </Typography>
    <Typography sx={{ color: 'var(--text-3)', fontSize: '0.8rem', mb: 2 }}>
      Valid until {promo.validUntil}
    </Typography>
    <Box sx={{
      display: 'inline-block',
      px: 3, py: 1,
      background: 'var(--red)',
      color: '#fff',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: '0.875rem',
      cursor: 'pointer',
      '&:hover': { background: 'var(--red-light)' },
      transition: 'var(--transition)',
    }}>
      Order Now
    </Box>
  </Box>
</Box>
```

**Step 5: Commit**
```bash
git add frontend/src/apps/PublicWebsite/PromotionsPage.tsx
git commit -m "feat: revamp PromotionsPage to dark card grid"
```

---

## Task 7: Auth Pages — CustomerLoginPage + RegisterPage

**Files:**
- Modify: `frontend/src/pages/auth/CustomerLoginPage.tsx`
- Modify: `frontend/src/pages/auth/RegisterPage.tsx`

**Step 1: Page layout (both pages)**

Both pages: split-screen or centred card. Use centred card for clean EU style:
```tsx
<Box sx={{
  minHeight: '100vh',
  background: 'var(--bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: 3,
}}>
  <Box sx={{
    width: '100%',
    maxWidth: 440,
    background: 'var(--surface)',
    borderRadius: 'var(--radius-card)',
    border: '1px solid var(--border)',
    borderTop: '3px solid var(--gold)',
    p: { xs: 3, md: 5 },
    boxShadow: 'var(--shadow-card)',
  }}>
    {/* Logo */}
    <Typography sx={{
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1.75rem',
      color: 'var(--gold)',
      mb: 0.5,
    }}>
      MaSoVa
    </Typography>
    <Typography sx={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-1)', mb: 3 }}>
      Welcome back
    </Typography>

    {/* Form fields */}
    {/* ... existing fields but restyled below ... */}

  </Box>
</Box>
```

**Step 2: Input field styling (both pages)**

Wrap all `TextField` components with `sx`:
```typescript
sx={{
  mb: 2,
  '& .MuiOutlinedInput-root': {
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius-card)',
    '& fieldset': { borderColor: 'var(--border)' },
    '&:hover fieldset': { borderColor: 'var(--border-strong)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--gold)', borderWidth: 1 },
    '& input': { color: 'var(--text-1)', fontFamily: 'var(--font-body)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-3)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--gold)' },
}}
```

**Step 3: Primary CTA button (both pages)**
```typescript
sx={{
  background: 'var(--red)',
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  py: 1.5,
  borderRadius: 'var(--radius-pill)',
  textTransform: 'none',
  fontSize: '1rem',
  '&:hover': { background: 'var(--red-light)' },
  transition: 'var(--transition)',
}}
```

**Step 4: Google button**
```typescript
sx={{
  background: 'var(--surface-2)',
  color: 'var(--text-1)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  py: 1.5,
  borderRadius: 'var(--radius-pill)',
  textTransform: 'none',
  '&:hover': { borderColor: 'var(--border-strong)', background: 'var(--surface-3)' },
  transition: 'var(--transition)',
}}
```

**Step 5: Links**
```typescript
sx={{ color: 'var(--gold)', '&:hover': { color: 'var(--gold-light)' } }}
```

**Step 6: Commit**
```bash
git add frontend/src/pages/auth/CustomerLoginPage.tsx frontend/src/pages/auth/RegisterPage.tsx
git commit -m "feat: revamp auth pages to dark card design"
```

---

## Task 8: GuestCheckoutPage — Dark Checkout Layout

**Files:**
- Modify: `frontend/src/pages/checkout/GuestCheckoutPage.tsx`

**Step 1: Page container**
```typescript
sx={{ background: 'var(--bg)', minHeight: '100vh', py: 4 }}
```

**Step 2: Section cards** (each form section — Contact, Address, etc.)
```typescript
sx={{
  background: 'var(--surface)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  borderLeft: '3px solid var(--gold)',
  p: 3,
  mb: 3,
}}
```

**Step 3: Section heading**
```typescript
sx={{
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '1.1rem',
  color: 'var(--text-1)',
  mb: 2,
}}
```

**Step 4: Saved address cards**
```typescript
// Selected
sx={{
  background: 'rgba(212,168,67,0.08)',
  border: '1px solid var(--gold)',
  borderRadius: 'var(--radius-card)',
  p: 2, mb: 1.5, cursor: 'pointer',
}}
// Unselected
sx={{
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-card)',
  p: 2, mb: 1.5, cursor: 'pointer',
  '&:hover': { borderColor: 'var(--border-strong)' },
  transition: 'var(--transition)',
}}
```

**Step 5: Order summary sidebar**
```typescript
sx={{
  background: 'var(--surface)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  p: 3,
  position: 'sticky',
  top: 80,
}}
```

**Step 6: Continue button**
Same as Task 7 Step 3 primary CTA style but full-width.

**Step 7: Commit**
```bash
git add frontend/src/pages/checkout/GuestCheckoutPage.tsx
git commit -m "feat: revamp GuestCheckoutPage to dark checkout layout"
```

---

## Task 9: OrderTrackingPage + LiveTrackingPage

**Files:**
- Modify: `frontend/src/pages/customer/OrderTrackingPage.tsx`
- Modify: `frontend/src/pages/customer/LiveTrackingPage.tsx`

**Step 1: Order list cards (OrderTrackingPage)**
```typescript
sx={{
  background: 'var(--surface)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  p: 3,
  mb: 2,
  '&:hover': { borderColor: 'var(--border-strong)' },
  transition: 'var(--transition)',
}}
```

Order status badge per status:
```typescript
const statusColor = {
  PENDING: 'var(--text-3)',
  PREPARING: 'var(--gold)',
  DISPATCHED: '#4CAF50',
  DELIVERED: '#4CAF50',
  CANCELLED: 'var(--red)',
};
```

**Step 2: Status timeline (LiveTrackingPage)**

Vertical timeline:
```tsx
<Box sx={{ position: 'relative', pl: 4 }}>
  {/* Vertical line */}
  <Box sx={{
    position: 'absolute',
    left: 11,
    top: 12,
    bottom: 12,
    width: 2,
    background: 'var(--border)',
  }} />

  {steps.map((step, i) => (
    <Stack key={step.label} direction="row" gap={2} mb={3} sx={{ position: 'relative' }}>
      {/* Circle */}
      <Box sx={{
        width: 24, height: 24,
        borderRadius: '50%',
        background: step.done ? 'var(--gold)' : 'var(--surface-2)',
        border: `2px solid ${step.done ? 'var(--gold)' : 'var(--border)'}`,
        flexShrink: 0,
        zIndex: 1,
      }} />
      <Box>
        <Typography sx={{ color: step.done ? 'var(--text-1)' : 'var(--text-3)', fontWeight: step.done ? 600 : 400, fontSize: '0.9rem' }}>
          {step.label}
        </Typography>
        {step.time && (
          <Typography sx={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>{step.time}</Typography>
        )}
      </Box>
    </Stack>
  ))}
</Box>
```

**Step 3: Map dark theme**

If using Google Maps, apply dark style. Find where `GoogleMap` or `MapView` renders and add:
```typescript
options={{
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1C1916' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#B0A898' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0908' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#242018' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#141210' }] },
  ],
  disableDefaultUI: true,
}}
```

**Step 4: ETA badge**
```tsx
<Box sx={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 2.5, py: 1,
  background: 'rgba(212,168,67,0.15)',
  border: '1px solid var(--gold)',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--gold)',
  fontWeight: 700,
  fontSize: '1rem',
  mb: 2,
}}>
  ⏱ Arriving in {eta} minutes
</Box>
```

**Step 5: Commit**
```bash
git add frontend/src/pages/customer/OrderTrackingPage.tsx frontend/src/pages/customer/LiveTrackingPage.tsx
git commit -m "feat: revamp order tracking pages to dark timeline design"
```

---

## Task 10: CheckoutPage (options picker) + CartPage

**Files:**
- Modify: `frontend/src/pages/checkout/CheckoutPage.tsx`
- Modify: `frontend/src/pages/customer/CartPage.tsx`

**Step 1: CheckoutPage option cards** (Login / Register / Guest)
```typescript
sx={{
  background: 'var(--surface)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  p: 3.5,
  cursor: 'pointer',
  transition: 'var(--transition)',
  '&:hover': {
    borderColor: 'var(--gold)',
    transform: 'translateY(-4px)',
    boxShadow: 'var(--shadow-card-hover)',
  },
}}
```

**Step 2: CartPage** — same dark card treatment as CartDrawer for item rows, same summary box style.

**Step 3: Commit**
```bash
git add frontend/src/pages/checkout/CheckoutPage.tsx frontend/src/pages/customer/CartPage.tsx
git commit -m "feat: revamp CheckoutPage and CartPage dark styling"
```

---

## Final Verification

After all tasks complete, run through the full customer journey:

1. `http://localhost:3000` — dark hero, gold text, red CTAs
2. `/menu` — dark sidebar + card grid
3. Add items → CartDrawer slides open dark
4. `/checkout` — dark option cards
5. `/customer-login` — dark centered card, gold top border
6. `/guest-checkout` — dark form with gold section borders
7. `/customer/orders` — dark list with gold status
8. `/live-tracking/:id` — dark map + gold timeline

Check on mobile viewport (375px): hamburger nav works, cards stack correctly, cart drawer goes full-width.

**Final commit:**
```bash
git add .
git commit -m "feat: complete customer web EU dark revamp"
```
