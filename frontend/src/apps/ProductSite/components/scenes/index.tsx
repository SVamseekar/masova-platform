/** Where each product scene appears. Every scene is used in exactly one place on the site. */
import type { ReactNode } from 'react'
import type { ProductArea } from '../../locales'
import { CounterPinScene, CounterRefundScene, CounterTapScene, DeliveryDeckScene, DeliveryDispatchScene, DeliveryRatingScene, OrderingChannelsScene, OrderingCheckoutScene, OrderingMenuScene } from './FrontScenes'
import { StockCostScene, StockReceiveScene, StockTanksScene, TeamAccessScene, TeamCalendarScene, TeamPresenceScene, TeamTipsScene } from './BackScenes'
import { GuestCampaignScene, GuestCardScene, GuestPrivacyScene, GuestReviewScene, InsightAskScene, InsightLiveScene, InsightMarginScene, InsightStoresScene } from './InsightScenes'
import { KitchenEquipmentScene, KitchenQualityScene, KitchenTicketsScene } from './KitchenScenes'

export { HeroTonightScene, JourneyAiScene, JourneyDriverScene, JourneyKitchenScene, JourneyManagerScene, JourneyOrderScene } from './HomeScenes'
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

/** The scene for one feature group on a product page. */
export function AreaScene({ area, group }: { area: ProductArea; group: number }) {
  const render = AREA_SCENES[area][group]
  return render ? <>{render()}</> : null
}

