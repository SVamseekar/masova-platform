export interface ChatQuickAction {
  label: string
  message: string
}

export interface ChatTheme {
  id: 'product' | 'app'
  accent: string
  accentDark: string
  accentMuted: string
  accentBorder: string
  brand: string
  brandMuted: string
  panelBg: string
  panelBorder: string
  messagesBg: string
  agentBubbleBg: string
  agentBubbleBorder: string
  userBubbleBg: string
  userBubbleText: string
  inputBg: string
  fontFamily: string
  title: string
  subtitle: string
  welcome: string
  quickActions: ChatQuickAction[]
  fabShadow: string
  panelShadow: string
}

/** Apple Music–style rose-red — matches ProductSite tokens */
const ACCENT = '#FA2D48'
const ACCENT_DARK = '#D41E3A'
const ACCENT_MUTED = 'rgba(250, 45, 72, 0.14)'
const ACCENT_BORDER = 'rgba(250, 45, 72, 0.32)'
const ACCENT_SHADOW = 'rgba(250, 45, 72, 0.32)'

const PRODUCT_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'How does it work?', message: 'How does MaSoVa work for multi-location restaurants?' },
  { label: 'Pricing', message: 'What are your pricing plans?' },
  { label: 'Book a demo', message: 'I would like to book a demo for my restaurant.' },
]

const APP_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'Track order', message: 'Where is my order?' },
  { label: 'Menu help', message: 'Can you help me with the menu and allergens?' },
  { label: 'Refund', message: 'I need help with a refund.' },
]

export function getChatTheme(isProductSite: boolean): ChatTheme {
  const base = {
    accent: ACCENT,
    accentDark: ACCENT_DARK,
    accentMuted: ACCENT_MUTED,
    accentBorder: ACCENT_BORDER,
    userBubbleBg: ACCENT,
    userBubbleText: '#ffffff',
    fabShadow: `0 10px 32px ${ACCENT_SHADOW}`,
    panelShadow: `0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px ${ACCENT_MUTED}`,
  }

  if (isProductSite) {
    return {
      ...base,
      id: 'product',
      brand: '#D4AF37',
      brandMuted: 'rgba(212,175,55,0.18)',
      panelBg: '#121212',
      panelBorder: 'rgba(255,255,255,0.1)',
      messagesBg: '#0a0a0a',
      agentBubbleBg: '#1a1a1a',
      agentBubbleBorder: 'rgba(255,255,255,0.08)',
      inputBg: '#1a1a1a',
      fontFamily: 'Inter, system-ui, sans-serif',
      title: 'MaSoVa Assistant',
      subtitle: 'Usually replies in seconds',
      welcome:
        "Hello! I can answer questions about MaSoVa, pricing, and how we help restaurant teams. What would you like to know?",
      quickActions: PRODUCT_QUICK_ACTIONS,
    }
  }

  return {
    ...base,
    id: 'app',
    brand: '#D4A843',
    brandMuted: 'rgba(212,168,67,0.15)',
    panelBg: '#141210',
    panelBorder: 'rgba(255,255,255,0.08)',
    messagesBg: '#0f0e0c',
    agentBubbleBg: '#1C1916',
    agentBubbleBorder: 'rgba(255,255,255,0.08)',
    inputBg: '#1C1916',
    fontFamily: 'var(--font-body)',
    title: 'MaSoVa Support',
    subtitle: 'Order help · menu · refunds',
    welcome:
      "Hi! I'm here for order status, menu questions, complaints, and refunds. How can I help you today?",
    quickActions: APP_QUICK_ACTIONS,
  }
}