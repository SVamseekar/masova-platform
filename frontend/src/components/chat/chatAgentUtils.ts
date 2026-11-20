export function getThinkingSteps(userMessage: string): string[] {
  const m = userMessage.toLowerCase()
  if (m.includes('order') || m.includes('where') || m.includes('track') || m.includes('delivery'))
    return ['Support Agent engaged', 'Tool: get_order_status', 'Reading live delivery data…']
  if (m.includes('menu') || m.includes('allergen') || m.includes('gluten') || m.includes('dish'))
    return ['Support Agent engaged', 'Tool: search_menu', 'Checking allergen flags…']
  if (m.includes('refund') || m.includes('complaint') || m.includes('wrong'))
    return ['Support Agent engaged', 'Tool: get_order_context', 'Drafting refund options…']
  return ['Support Agent engaged', 'Selecting tools…', 'Querying live backend…']
}

export function inferToolTrace(userMessage: string): string {
  const m = userMessage.toLowerCase()
  if (m.includes('order') || m.includes('track') || m.includes('delivery'))
    return 'Tools used · get_order_status · get_driver_eta'
  if (m.includes('menu') || m.includes('allergen'))
    return 'Tools used · search_menu · allergen_lookup'
  if (m.includes('refund'))
    return 'Tools used · get_order_context · draft_refund_option'
  return 'Tools used · agent routing · live API'
}

export function getCapabilityPills(): string[] {
  return ['Live orders', 'Menu lookup', 'Refund drafts']
}