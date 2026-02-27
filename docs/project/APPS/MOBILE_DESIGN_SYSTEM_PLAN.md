# MaSoVa Mobile Customer App - Design System Plan

## Executive Summary

This document outlines a comprehensive design system for the MaSoVa mobile customer app, proposing a **"Glassmorphism + Material You Hybrid"** approach as an alternative to the web app's neumorphic design. This system maintains the premium, distinctive feel of the current brand while being optimized for mobile performance and accessibility.

---

## 1. Why Neumorphic Design Doesn't Work for Mobile

### Current Web Design Analysis

Your web app uses a sophisticated neumorphic system with:
- Dual shadow effects (light top-left, dark bottom-right)
- Soft surfaces (`#f0f0f0`, `#e8e8e8`, `#d0d0d0`)
- Prominent 3D embossed/depressed effects
- MaSoVa brand red (`#e53e3e`) as primary accent

### Mobile Limitations of Neumorphism

| Issue | Impact |
|-------|--------|
| **Performance** | Complex dual shadows are computationally expensive, causing battery drain and frame drops |
| **Sunlight Visibility** | Subtle shadow contrasts become invisible in outdoor lighting |
| **Touch Targets** | Soft edges blur tap boundaries, reducing precision |
| **Accessibility** | Low contrast ratios fail WCAG AA standards |
| **Screen Size** | Detailed shadow work gets lost on smaller displays |
| **Dark Mode** | Neumorphism fundamentally relies on light backgrounds |

---

## 2. Recommended Alternative: "Glassmorphism + Material You Hybrid"

### Design Philosophy

A modern, premium design system that combines:

1. **Glassmorphism** - Frosted glass effects with subtle blur and transparency
2. **Material You (M3)** - Dynamic theming, expressive typography, accessible components
3. **Food Photography Focus** - Design that makes food imagery the hero

### Why This Approach?

| Benefit | Description |
|---------|-------------|
| **Industry Proven** | Used by Uber Eats, DoorDash, Deliveroo for food delivery |
| **Performance Optimized** | Native blur APIs are GPU-accelerated on iOS/Android |
| **Distinctive** | Stands out from flat Material apps while being functional |
| **Dark Mode Native** | Looks stunning in both light and dark themes |
| **Accessible** | Meets WCAG AA/AAA with proper implementation |
| **Brand Flexible** | MaSoVa red works beautifully with glass effects |

---

## 3. Design Tokens - Mobile Adaptation

### 3.1 Color System

#### Primary Palette (From Current Brand)

```typescript
const colors = {
  // Brand Colors (Maintained from web)
  brand: {
    primary: '#E53E3E',      // MaSoVa Red
    primaryLight: '#FF6B6B',
    primaryDark: '#C0392B',
    secondary: '#0066CC',    // Accent Blue
  },

  // Semantic Colors (Adapted for mobile)
  semantic: {
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },

  // Light Theme Surfaces
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: 'rgba(255, 255, 255, 0.85)',
    glassSurface: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    divider: 'rgba(0, 0, 0, 0.08)',
  },

  // Dark Theme Surfaces
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceElevated: 'rgba(30, 30, 30, 0.9)',
    glassSurface: 'rgba(40, 40, 40, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    divider: 'rgba(255, 255, 255, 0.08)',
  },
};
```

#### Dynamic Color Extraction

For food images, extract dominant colors to create contextual accents:

```typescript
// Example: Pizza image with warm tones
const dynamicColors = {
  accent: extractDominantColor(foodImage),      // Warm orange
  accentContainer: lighten(accent, 0.7),
  onAccent: getContrastingColor(accent),
};
```

### 3.2 Typography System

#### Font Stack

```typescript
const typography = {
  fontFamily: {
    // iOS: San Francisco, Android: Roboto (system fonts for best performance)
    primary: 'System',
    display: 'System',
    mono: 'monospace',
  },

  // Type Scale (Optimized for mobile readability)
  scale: {
    hero: { size: 34, lineHeight: 41, weight: '700', tracking: 0.25 },
    h1: { size: 28, lineHeight: 34, weight: '700', tracking: 0 },
    h2: { size: 22, lineHeight: 28, weight: '600', tracking: 0 },
    h3: { size: 20, lineHeight: 25, weight: '600', tracking: 0.15 },
    h4: { size: 18, lineHeight: 24, weight: '600', tracking: 0 },
    bodyLarge: { size: 17, lineHeight: 24, weight: '400', tracking: 0 },
    body: { size: 15, lineHeight: 22, weight: '400', tracking: 0 },
    bodySmall: { size: 13, lineHeight: 18, weight: '400', tracking: 0 },
    caption: { size: 12, lineHeight: 16, weight: '400', tracking: 0.4 },
    overline: { size: 11, lineHeight: 14, weight: '500', tracking: 1.5 },
    button: { size: 15, lineHeight: 20, weight: '600', tracking: 0.5 },
    buttonSmall: { size: 13, lineHeight: 18, weight: '600', tracking: 0.5 },
  },
};
```

### 3.3 Spacing System

```typescript
const spacing = {
  // 4px base unit for tighter mobile layouts
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,

  // Touch targets (minimum 44pt for iOS, 48dp for Android)
  touchTarget: 48,

  // Screen margins
  screenHorizontal: 16,
  screenVertical: 16,

  // Card internal padding
  cardPadding: 16,
  cardPaddingLarge: 20,

  // List item spacing
  listItemGap: 12,
  sectionGap: 24,
};
```

### 3.4 Border Radius

```typescript
const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,

  // Component-specific
  card: 16,
  button: 12,
  buttonPill: 24,
  input: 12,
  chip: 20,
  bottomSheet: 24,
  image: 12,
};
```

### 3.5 Shadows & Elevation

```typescript
const shadows = {
  // Simplified shadow system for mobile performance
  none: 'none',

  sm: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    android: { elevation: 2 },
  },

  md: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    android: { elevation: 4 },
  },

  lg: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
    android: { elevation: 8 },
  },

  xl: {
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 },
    android: { elevation: 12 },
  },

  // Brand shadow (uses MaSoVa red)
  brand: {
    ios: { shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    android: { elevation: 6 },
  },
};
```

### 3.6 Glassmorphism Effects

```typescript
const glass = {
  // Standard glass surface
  surface: {
    background: 'rgba(255, 255, 255, 0.72)',
    backdropBlur: 20,
    border: '1px solid rgba(255, 255, 255, 0.5)',
  },

  // Elevated glass (for modals, bottom sheets)
  elevated: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropBlur: 40,
    border: '1px solid rgba(255, 255, 255, 0.6)',
  },

  // Dark theme glass
  dark: {
    background: 'rgba(30, 30, 30, 0.72)',
    backdropBlur: 20,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },

  // Brand glass (subtle red tint)
  brand: {
    background: 'rgba(229, 62, 62, 0.08)',
    backdropBlur: 20,
    border: '1px solid rgba(229, 62, 62, 0.2)',
  },
};
```

---

## 4. Component Library

### 4.1 Navigation Components

#### Bottom Tab Bar

```
┌─────────────────────────────────────────────────────────────┐
│  Glass surface with blur                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │  🏠  │  │  🔍  │  │  🛒  │  │  ❤️  │  │  👤  │          │
│  │ Home │  │Search│  │ Cart │  │Saved │  │ You  │          │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘          │
│             ▲                                                │
│         Active: Brand red fill + label                       │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 83pt (iOS Safe Area) / 80dp (Android)
- Glass background with 20px blur
- Active state: MaSoVa red (#E53E3E) icon + label
- Inactive state: Gray (#666666) icon, no label
- Cart badge: Brand red circle with white count

#### Floating Cart Button (Alternative)

```
       ┌────────────────────────┐
       │  🛒  ₹349  (3 items)   │
       └────────────────────────┘
         ▲ Glass pill with brand shadow
```

### 4.2 Card Components

#### Restaurant/Menu Item Card

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │         [Food Image]                │ │  ← Hero image (16:10 ratio)
│ │         Full bleed                  │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  Margherita Pizza                       │  ← h4, primary text
│  Classic Italian • Vegetarian 🌿        │  ← bodySmall, secondary
│                                         │
│  ┌─────────┐                   ┌─────┐ │
│  │ ₹349    │                   │ ADD │ │  ← Price + CTA
│  │ ₹449    │                   └─────┘ │
│  └─────────┘                           │
│   ▲ Strike-through original            │
└─────────────────────────────────────────┘
   ▲ White card, md shadow, 16px radius
```

**Specifications:**
- Card background: White (light) / #1E1E1E (dark)
- Image aspect ratio: 16:10 for food prominence
- Border radius: 16px
- Shadow: md elevation
- Padding: 16px (below image only)

#### Horizontal Scroll Card (Categories)

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│  🍕    │  │  🍔    │  │  🍜    │
│ Pizza  │  │ Burger │  │ Noodles│
└─────────┘  └─────────┘  └─────────┘
 ▲ Glass cards with subtle border
```

### 4.3 Button Components

#### Primary Button

```typescript
const PrimaryButton = {
  // Default state
  default: {
    background: 'linear-gradient(135deg, #E53E3E 0%, #C0392B 100%)',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadow: 'brand',
  },

  // Pressed state
  pressed: {
    background: '#C0392B',
    transform: 'scale(0.98)',
  },

  // Disabled state
  disabled: {
    background: '#E5E5E5',
    color: '#999999',
  },
};
```

**Visual:**
```
┌──────────────────────────────────────┐
│          Add to Cart - ₹349          │
└──────────────────────────────────────┘
 ▲ Gradient red, white text, brand shadow
```

#### Secondary Button (Ghost)

```typescript
const SecondaryButton = {
  default: {
    background: 'transparent',
    borderColor: colors.brand.primary,
    borderWidth: 1.5,
    color: colors.brand.primary,
  },
};
```

#### Pill Button (Filters, Tags)

```
┌──────────┐  ┌───────────────┐  ┌──────────────┐
│ 🌿 Veg  │  │ ⭐ Top Rated │  │ 🚀 Fast Delivery│
└──────────┘  └───────────────┘  └──────────────┘
 ▲ Active: Brand red bg, white text
 ▲ Inactive: Glass surface with border
```

### 4.4 Input Components

#### Search Bar

```
┌─────────────────────────────────────────────────────────┐
│  🔍  Search for dishes, restaurants...           🎤    │
└─────────────────────────────────────────────────────────┘
 ▲ Glass surface, 12px radius, subtle shadow
```

**Specifications:**
- Height: 48dp minimum touch target
- Background: Glass surface (light blur)
- Icon color: Secondary text
- Microphone icon for voice search

#### Quantity Selector

```
┌─────────────────────────┐
│  ⊖  │     2     │  ⊕  │
└─────────────────────────┘
 ▲ Glass surface, brand red icons when active
```

### 4.5 Feedback Components

#### Toast / Snackbar

```
┌────────────────────────────────────────────────┐
│  ✓  Added to cart                    UNDO     │
└────────────────────────────────────────────────┘
 ▲ Dark glass surface (dark: rgba(30,30,30,0.9))
```

#### Loading States

```typescript
const LoadingStates = {
  // Skeleton with shimmer animation
  skeleton: {
    baseColor: 'rgba(0, 0, 0, 0.06)',
    shimmerColor: 'rgba(0, 0, 0, 0.02)',
    animationDuration: '1.5s',
  },

  // Lottie animation for order status
  orderProgress: {
    animation: 'cooking-animation.json',
    primaryColor: colors.brand.primary,
  },
};
```

---

## 5. Screen-by-Screen Design

### 5.1 Home Screen

```
┌─────────────────────────────────────────┐
│ ≡  📍 Deliver to: Home              🔔 │  ← Header with glass
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🔍 Search for dishes, restaurants  │ │  ← Search bar
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│         [Hero Banner Carousel]          │  ← Promotions
│      ● ○ ○ ○  (page indicators)         │
├─────────────────────────────────────────┤
│ Categories                        See all│
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ │🍕 │ │🍔 │ │🍜 │ │🌮 │ │☕ │     │  ← Horizontal scroll
│ └────┘ └────┘ └────┘ └────┘ └────┘     │
├─────────────────────────────────────────┤
│ Recommended for You                     │
│ ┌─────────────────────────────────────┐ │
│ │         [Food Card]                 │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │         [Food Card]                 │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  🏠    🔍    🛒    ❤️    👤           │  ← Tab bar
└─────────────────────────────────────────┘
```

### 5.2 Menu/Browse Screen

```
┌─────────────────────────────────────────┐
│ ←  Pizza Menu                      🔍  │
├─────────────────────────────────────────┤
│ ┌──────┐ ┌───────────┐ ┌────────┐      │
│ │ All  │ │ Veg Only │ │ Spicy  │      │  ← Filter chips
│ └──────┘ └───────────┘ └────────┘      │
├─────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────┐  │
│ │   [Food Img]     │ │   [Food Img] │  │
│ │   Margherita     │ │   Pepperoni  │  │  ← 2-column grid
│ │   ₹349   [ADD]   │ │   ₹449 [ADD] │  │
│ └──────────────────┘ └──────────────┘  │
│ ┌──────────────────┐ ┌──────────────┐  │
│ │   [Food Img]     │ │   [Food Img] │  │
│ │   BBQ Chicken    │ │   Paneer     │  │
│ │   ₹499   [ADD]   │ │   ₹399 [ADD] │  │
│ └──────────────────┘ └──────────────┘  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  🛒  View Cart (3)        ₹1,247   │ │  ← Floating cart bar
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 5.3 Item Detail Screen

```
┌─────────────────────────────────────────┐
│ ←                                  ❤️  │  ← Transparent header
│                                         │     (overlays image)
│         [Full-width Food Image]         │
│              with parallax              │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │  ← Bottom sheet style
│ │  Margherita Pizza              🌿   │ │     (glass surface)
│ │  ⭐ 4.5 (230 reviews)               │ │
│ │                                     │ │
│ │  Classic Italian pizza with fresh   │ │
│ │  mozzarella, basil, and tomato      │ │
│ │  sauce on a thin crust.             │ │
│ ├─────────────────────────────────────┤ │
│ │  Size                               │ │
│ │  ○ Regular (8")  ○ Large (12") +₹100│ │
│ ├─────────────────────────────────────┤ │
│ │  Extra Toppings                     │ │
│ │  ☐ Extra Cheese +₹50               │ │
│ │  ☐ Jalapenos +₹30                  │ │
│ ├─────────────────────────────────────┤ │
│ │ ┌──────────────────────────────────┐│ │
│ │ │    Add to Cart - ₹349            ││ │
│ │ └──────────────────────────────────┘│ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 5.4 Cart Screen

```
┌─────────────────────────────────────────┐
│ ←  Your Cart                            │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [img] Margherita Pizza        ₹349 │ │
│ │       Large, Extra Cheese          │ │
│ │       ⊖  2  ⊕                      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [img] Garlic Bread            ₹149 │ │
│ │       ⊖  1  ⊕                      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🏷️ Apply Coupon               →   │ │  ← Coupon input
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  Bill Details                           │
│  ─────────────────────────────────────  │
│  Item Total                      ₹847  │
│  Delivery Fee                     ₹40  │
│  Taxes & Charges                  ₹50  │
│  ─────────────────────────────────────  │
│  To Pay                          ₹937  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │    Proceed to Checkout - ₹937      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 5.5 Order Tracking Screen

```
┌─────────────────────────────────────────┐
│ ←  Order #MV-2024-1234                  │
├─────────────────────────────────────────┤
│                                         │
│         [Map with driver location]      │
│         Animated route + car icon       │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │  ← Glass card overlay
│ │  Arriving in 12 mins               │ │
│ │  ━━━━━━━━━━━━●━━━━━━━━━━━━━        │ │  ← Progress bar
│ │  Ordered → Preparing → On the way  │ │
│ ├─────────────────────────────────────┤ │
│ │  👤 Rahul Kumar                    │ │
│ │  Your delivery partner              │ │
│ │  ┌──────┐  ┌────────────┐          │ │
│ │  │ Call │  │  Message   │          │ │
│ │  └──────┘  └────────────┘          │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  Order Summary                    →     │
│  2 items • ₹937                        │
└─────────────────────────────────────────┘
```

---

## 6. Animation & Motion System

### 6.1 Principles

1. **Purposeful** - Every animation guides attention or provides feedback
2. **Fast** - Micro-interactions under 300ms, transitions under 500ms
3. **Natural** - Spring physics for organic feel
4. **Consistent** - Same easing curves throughout the app

### 6.2 Animation Tokens

```typescript
const animation = {
  // Durations
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    pageTransition: 350,
  },

  // Easing curves
  easing: {
    // For elements entering the screen
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',

    // For elements leaving the screen
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',

    // For elements moving on screen
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

    // Spring physics for natural feel
    spring: { damping: 15, stiffness: 150, mass: 1 },
  },
};
```

### 6.3 Key Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Button press | Scale to 0.98 | 100ms | easeOut |
| Card tap | Subtle scale + shadow | 150ms | spring |
| Page transition | Slide + fade | 350ms | easeInOut |
| Bottom sheet | Spring slide up | 400ms | spring |
| Toast appear | Slide up + fade | 300ms | easeOut |
| Skeleton shimmer | Infinite gradient | 1500ms | linear |
| Add to cart | Item flies to cart | 500ms | spring |
| Success state | Lottie checkmark | 1000ms | - |

---

## 7. Iconography

### 7.1 Icon System

- **Primary:** SF Symbols (iOS) / Material Symbols (Android) for consistency
- **Custom:** MaSoVa-specific icons for brand identity (logo, food categories)
- **Size:** 24dp standard, 20dp compact, 28dp prominent
- **Style:** Outlined default, filled for active states

### 7.2 Key Icons

```
Navigation:
🏠 Home  🔍 Search  🛒 Cart  ❤️ Saved  👤 Profile

Actions:
➕ Add  ➖ Remove  ✓ Done  ✕ Close  ← Back  → Forward

Status:
⏱ Preparing  🚗 On the way  ✓ Delivered  ⭐ Rating

Food categories:
🍕 Pizza  🍔 Burger  🍜 Noodles  🌮 Tacos  ☕ Beverages
🥗 Salads  🍰 Desserts  🌿 Vegetarian  🌶️ Spicy
```

---

## 8. Accessibility Guidelines

### 8.1 Touch Targets

- Minimum: 44×44pt (iOS) / 48×48dp (Android)
- Recommended: 48×48pt for frequently used actions
- Spacing: 8dp minimum between targets

### 8.2 Color Contrast

| Element | Minimum Ratio | Target Ratio |
|---------|---------------|--------------|
| Body text | 4.5:1 (AA) | 7:1 (AAA) |
| Large text (18pt+) | 3:1 | 4.5:1 |
| UI components | 3:1 | 4.5:1 |
| Brand red on white | 4.63:1 ✓ | - |

### 8.3 Dynamic Type Support

```typescript
const dynamicType = {
  // Scale multipliers for accessibility sizes
  xSmall: 0.82,
  small: 0.88,
  medium: 0.94,
  large: 1.0,      // Default
  xLarge: 1.12,
  xxLarge: 1.24,
  xxxLarge: 1.41,

  // Maximum scale to prevent layout breaking
  maxScale: 1.5,
};
```

### 8.4 Screen Reader Support

- All images: Descriptive alt text
- Buttons: Clear action labels
- Status changes: Announced via accessibility APIs
- Food items: Full description including price, dietary info

---

## 9. Dark Mode Implementation

### 9.1 Automatic Switching

```typescript
const useTheme = () => {
  const colorScheme = useColorScheme(); // 'light' | 'dark'
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};
```

### 9.2 Visual Differences

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | #FAFAFA | #121212 |
| Surface | #FFFFFF | #1E1E1E |
| Glass | rgba(255,255,255,0.72) | rgba(40,40,40,0.72) |
| Primary text | #1A1A1A | #FFFFFF |
| Dividers | rgba(0,0,0,0.08) | rgba(255,255,255,0.08) |
| Shadows | Visible | Reduced opacity |
| Brand red | #E53E3E | #FF6B6B (slightly lighter) |

### 9.3 Dark Mode Enhancements

- Food images: Slightly increased saturation
- Glass effects: More prominent border
- Elevation: Reduced shadow, increased surface brightness

---

## 10. Performance Guidelines

### 10.1 Image Optimization

```typescript
const imageConfig = {
  // Use WebP format for 30% smaller files
  format: 'webp',

  // Responsive sizes
  sizes: {
    thumbnail: { width: 150, height: 150 },
    card: { width: 400, height: 250 },
    hero: { width: 750, height: 400 },
    full: { width: 1080, height: 'auto' },
  },

  // Lazy loading with blur placeholder
  loading: 'lazy',
  placeholder: 'blur',
  blurDataURL: 'data:image/jpeg;base64,...',
};
```

### 10.2 Animation Performance

- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `width`, `height`, `margin`, `padding`
- Use `will-change` sparingly for complex animations
- Disable animations when `prefers-reduced-motion` is set

### 10.3 Component Optimization

- Virtualized lists for menu items (react-native-flashlist)
- Memoized components for frequent re-renders
- Skeleton loaders for perceived performance
- Optimistic UI updates for cart actions

---

## 11. Implementation Technology

### 11.1 Recommended Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile development |
| **Expo** | Simplified development workflow |
| **React Navigation** | Native navigation experience |
| **React Native Reanimated** | High-performance animations |
| **React Native Gesture Handler** | Native touch handling |
| **React Native Blur** | Glassmorphism blur effects |
| **Lottie** | Complex loading/success animations |
| **React Query** | API caching & state management |

### 11.2 Alternative: Native Development

For maximum performance and platform fidelity:
- **iOS:** SwiftUI with native blur effects
- **Android:** Jetpack Compose with Material 3

---

## 12. Brand Consistency with Web

### 12.1 Maintained Elements

| Element | Web (Neumorphic) | Mobile (Glass + M3) |
|---------|------------------|---------------------|
| Brand red | #E53E3E | #E53E3E ✓ |
| Typography scale | 6 weights | 6 weights ✓ |
| 8px spacing | Base unit | 4px (tighter) |
| Border radius | 12-20px | 12-16px ✓ |
| Gradient buttons | Red gradient | Red gradient ✓ |
| Success/Error colors | Same palette | Same palette ✓ |

### 12.2 Adapted Elements

| Element | Web | Mobile |
|---------|-----|--------|
| Shadows | Dual neumorphic | Single drop shadow |
| Surfaces | Soft gray | White/Dark + Glass |
| Depth | Emboss/Deboss | Elevation + Blur |
| Interactions | Hover states | Touch feedback |
| Navigation | Sidebar | Bottom tabs |

---

## 13. Comparison: Neumorphic vs Glassmorphism + M3

| Aspect | Neumorphic (Web) | Glass + M3 (Mobile) |
|--------|------------------|---------------------|
| Visual style | Soft, embossed surfaces | Frosted, layered surfaces |
| Depth creation | Dual shadows | Blur + subtle shadow |
| Performance | CPU-intensive shadows | GPU-accelerated blur |
| Dark mode | Limited | Native support |
| Accessibility | Lower contrast | WCAG AA compliant |
| Touch feedback | Subtle | Clear, tactile |
| Industry adoption | Niche | Mainstream (Uber, Apple) |
| Food imagery | Background focus | Hero focus |

---

## 14. Next Steps

### Phase 1: Foundation (Design System)
- [ ] Create design tokens in code
- [ ] Build base components (Button, Card, Input)
- [ ] Implement theming (light/dark)
- [ ] Set up typography and spacing

### Phase 2: Core Screens
- [ ] Home screen with categories
- [ ] Menu browsing with filters
- [ ] Item detail with customization
- [ ] Cart and checkout flow

### Phase 3: Order Experience
- [ ] Payment integration (Razorpay)
- [ ] Real-time order tracking
- [ ] Push notifications
- [ ] Rating and review

### Phase 4: Polish
- [ ] Animations and micro-interactions
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Dark mode refinement

---

## Conclusion

This **Glassmorphism + Material You Hybrid** design system provides:

1. **Premium Feel** - Maintains the distinctive, high-quality aesthetic of MaSoVa
2. **Mobile Optimization** - Fast, accessible, and battery-efficient
3. **Brand Consistency** - Same colors, typography scale, and visual language
4. **Industry Standard** - Follows proven patterns from Uber Eats, DoorDash, Deliveroo
5. **Scalability** - Easy to maintain and extend
6. **Dark Mode** - First-class support for both themes
7. **Accessibility** - WCAG AA compliant from the start

The design puts **food photography at the center** while using glass effects for UI elements, creating a layered, modern experience that stands out in the crowded food delivery market.

---

## References & Inspiration

### Industry Research
- [Top 10 Inspiring Food Delivery App UI/UX Designs](https://uistudioz.com/top-10-inspiring-food-delivery-app-ui-ux-designs/)
- [Food Delivery App UI UX Design in 2025 — Trends, Principles & Best Practices](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee)
- [Top 8 Food Delivery App Design Trends to Follow in 2025](https://theme.bitrixinfotech.com/blog/top-food-delivery-app-design-trends)
- [Top 10 Food App Design Tips for 2025](https://www.netguru.com/blog/food-app-design-tips)

### Design Systems
- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design vs iOS Human Interface: Complete Comparison](https://www.freecardsort.com/comparisons/material-design-vs-ios-human-interface-complete-comparison)
