export interface ChatQuickAction {
  label: string
  message: string
  icon?: 'sparkles' | 'package' | 'calendar'
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
  agentName: string
  agentRole: string
  subtitle: string
  welcome: string
  fabLabel: string
  inputPlaceholder: string
  quickActionsLabel: string
  quickActions: ChatQuickAction[]
  fabShadow: string
  panelShadow: string
}

const ACCENT = '#FA2D48'
const ACCENT_DARK = '#D41E3A'
const ACCENT_MUTED = 'rgba(250, 45, 72, 0.14)'
const ACCENT_BORDER = 'rgba(250, 45, 72, 0.32)'
const ACCENT_SHADOW = 'rgba(250, 45, 72, 0.32)'

const PRODUCT_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'Explain the agents', message: 'How do MaSoVa smart assistants work for restaurant managers?', icon: 'sparkles' },
  { label: 'Compare plans', message: 'What are your pricing plans and what is included in each?', icon: 'package' },
  { label: 'Book a walkthrough', message: 'I would like to book a demo for my restaurant group.', icon: 'calendar' },
]

const APP_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'Track my order', message: 'Where is my order right now?', icon: 'package' },
  { label: 'Menu & allergens', message: 'Can you help me with the menu and allergen information?', icon: 'sparkles' },
  { label: 'Start a refund', message: 'I need help with a refund on my order.', icon: 'calendar' },
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
    agentName: 'Support Agent',
    agentRole: 'On-demand · chat',
    inputPlaceholder: 'Tell the agent what to check…',
    quickActionsLabel: 'Agent can do this now',
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
      agentBubbleBg: '#141414',
      agentBubbleBorder: 'rgba(212,175,55,0.15)',
      inputBg: '#1a1a1a',
      fontFamily: 'Inter, system-ui, sans-serif',
      subtitle: '8 tools wired · proposes, never auto-acts',
      welcome:
        "I'm the Support Agent — not a FAQ bot. I reason over your question and pull real product context before I answer. What should I look into?",
      fabLabel: 'Agent',
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
    agentBubbleBorder: 'rgba(212,168,67,0.12)',
    inputBg: '#1C1916',
    fontFamily: 'var(--font-body)',
    subtitle: 'Live APIs · order · menu · refunds',
    welcome:
      "I'm the Support Agent. I call live tools on your orders and menu — then reply with facts, not scripts. What should I check for you?",
    fabLabel: 'Agent',
    quickActions: APP_QUICK_ACTIONS,
  }
}