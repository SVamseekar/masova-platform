export function getThinkingSteps(userMessage: string, isProductSite: boolean): string[] {
  if (isProductSite) {
    const m = userMessage.toLowerCase()
    if (m.includes('pric') || m.includes('plan') || m.includes('cost'))
      return ['Support Agent engaged', 'Loading pricing tiers…', 'Preparing comparison…']
    if (m.includes('demo') || m.includes('book'))
      return ['Support Agent engaged', 'Checking availability context…', 'Drafting next steps…']
    return ['Support Agent engaged', 'Scanning product knowledge…', 'Composing answer…']
  }

  const m = userMessage.toLowerCase()
  if (m.includes('order') || m.includes('where') || m.includes('track') || m.includes('delivery'))
    return ['Support Agent engaged', 'Tool: get_order_status', 'Reading live delivery data…']
  if (m.includes('menu') || m.includes('allergen') || m.includes('gluten') || m.includes('dish'))
    return ['Support Agent engaged', 'Tool: search_menu', 'Checking allergen flags…']
  if (m.includes('refund') || m.includes('complaint') || m.includes('wrong'))
    return ['Support Agent engaged', 'Tool: get_order_context', 'Drafting refund options…']
  return ['Support Agent engaged', 'Selecting tools…', 'Querying live backend…']
}

export function inferToolTrace(userMessage: string, isProductSite: boolean): string {
  if (isProductSite) {
    return 'Knowledge base · product & pricing context'
  }

  const m = userMessage.toLowerCase()
  if (m.includes('order') || m.includes('track') || m.includes('delivery'))
    return 'Tools used · get_order_status · get_driver_eta'
  if (m.includes('menu') || m.includes('allergen'))
    return 'Tools used · search_menu · allergen_lookup'
  if (m.includes('refund'))
    return 'Tools used · get_order_context · draft_refund_option'
  return 'Tools used · agent routing · live API'
}

export function getCapabilityPills(isProductSite: boolean): string[] {
  if (isProductSite) {
    return ['8 agent tools', 'Live knowledge', 'Manager-safe']
  }
  return ['Live orders', 'Menu lookup', 'Refund drafts']
}