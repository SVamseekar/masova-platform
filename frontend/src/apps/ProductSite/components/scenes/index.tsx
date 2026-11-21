/** Where each product scene appears. Every scene is used in exactly one place on the site. */
import type { ReactNode } from 'react'
import type { ProductArea } from '../../locales'
import { CounterPinScene, CounterRefundScene, CounterTapScene, DeliveryDeckScene, DeliveryDispatchScene, DeliveryRatingScene, OrderingChannelsScene, OrderingCheckoutScene, OrderingMenuScene } from './FrontScenes'
import { StockCostScene, StockReceiveScene, StockTanksScene, TeamAccessScene, TeamCalendarScene, TeamPresenceScene, TeamTipsScene } from './BackScenes'
import { GuestCampaignScene, GuestCardScene, GuestPrivacyScene, GuestReviewScene, InsightAskScene, InsightLiveScene, InsightMarginScene, InsightStoresScene } from './InsightScenes'
import { KitchenEquipmentScene, KitchenQualityScene, KitchenTicketsScene } from './KitchenScenes'

export { HeroPinsList, HeroTonightScene, JourneyAiScene, JourneyDriverScene, JourneyKitchenScene, JourneyManagerScene, JourneyOrderScene } from './HomeScenes'
export { RoleScene } from './RoleScenes'
export { AreaThumbScene } from './ThumbScenes'
export { AiCopilotScene, AiGuestChatScene } from './InsightScenes'

const AREA_SCENES: Record<ProductArea, (() => ReactNode)[]> = {
  ordering: [() => <OrderingMenuScene />, () => <OrderingCheckoutScene />, () => <OrderingChannelsScene />],
  counter: [() => <CounterTapScene />, () => <CounterPinScene />, () => <CounterRefundScene />],
  kitchen: [() => <KitchenTicketsScene />, () => <KitchenQualityScene />, () => <KitchenEquipmentScene />],
  delivery: [() => <DeliveryDispatchScene />, () => <DeliveryDeckScene />, () => <DeliveryRatingScene />],
  stock: [() => <StockTanksScene />, () => <StockReceiveScene />, () => <StockCostScene />],
  team: [() => <TeamCalendarScene />, () => <TeamPresenceScene />, () => <TeamTipsScene />, () => <TeamAccessScene />],
  guests: [() => <GuestCardScene />, () => <GuestCampaignScene />, () => <GuestReviewScene />, () => <GuestPrivacyScene />],
  insights: [() => <InsightLiveScene />, () => <InsightMarginScene />, () => <InsightStoresScene />, () => <InsightAskScene />],
}

/** How many feature groups of an area have a scene. Must match the copy in every language. */
export function areaSceneCount(area: ProductArea): number {
  return AREA_SCENES[area].length
}

/** The scene for one feature group on a product page. A group without a scene is a bug: loud in dev, empty in production. */
export function AreaScene({ area, group }: { area: ProductArea; group: number }) {
  const render = AREA_SCENES[area][group]
  if (!render) {
    if (import.meta.env.DEV) throw new Error(`AreaScene: no scene for ${area} group ${group} (have ${AREA_SCENES[area].length})`)
    return null
  }
  return <>{render()}</>
}

