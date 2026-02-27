# Manager Dashboard Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate 25 manager pages into 6 sections within a Reztro-style 3-column shell layout. Zero feature loss.

**Architecture:** Single ManagerShell component with left sidebar navigation, a persistent header, section-aware right sidebar, and a middle content area that switches between 6 sections (each with internal tabs). Navigation is state+URL-param based, not route-based. Each existing page's content becomes a tab panel inside its section.

**Tech Stack:** React 18, TypeScript, RTK Query (existing API slices), inline styles (Reztro design tokens), SVG icons (no emoji), Inter font

---

## Critical Context

- **Total existing code:** ~16,400 lines across 25 manager pages
- **Each existing page** uses `withPageStoreContext` HOC, `usePageStore()` hook, `useAppSelector(selectCurrentUser)` for store-scoped data
- **Pattern:** Every page derives `storeId` as: `selectedStoreId || currentUser?.storeId || ''`
- **API slices (DO NOT MODIFY):** analyticsApi, orderApi, deliveryApi, customerApi, reviewApi, sessionApi, storeApi, shiftApi, kioskApi, userApi, menuApi, paymentApi, inventoryApi, driverApi, equipmentApi, notificationApi
- **Existing chart components:** `SalesTrendChart`, `RevenueBreakdownChart`, `PeakHoursHeatmap` in `frontend/src/components/charts/`
- **The `/manager/staff/:staffId/profile` and `/staff/profile` routes** stay as separate routes (not part of shell)
- **POS (`/pos/*`), Kitchen (`/kitchen/*`), Driver (`/driver/*`)** stay as separate apps

## File Map

| New File | Purpose | Lines (est.) |
|---|---|---|
| `manager-tokens.ts` | Reztro design tokens + shared styles | ~80 |
| `ManagerShell.tsx` | 3-column shell: sidebar, header, content area, right sidebar | ~350 |
| `RightSidebar.tsx` | Section-aware contextual right panel | ~300 |
| `DashboardSection.tsx` | Dashboard overview (from DashboardPage 1391 lines + ConsolidatedOrdersDashboard 415 lines) | ~800 |
| `OrdersSection.tsx` | Orders+Payments+Refunds+Deliveries tabs (from 4 pages totaling ~3224 lines) | ~1800 |
| `InventorySection.tsx` | Stock+Suppliers+POs+Waste tabs (from 4 pages totaling ~1783 lines) | ~1200 |
| `OperationsSection.tsx` | Recipes+Drivers+Stores+Kiosks tabs (from 4 pages totaling ~2519 lines) | ~1600 |
| `PeopleSection.tsx` | Staff+Scheduling+Leaderboard+Customers+Campaigns+Reviews tabs (from 6 pages totaling ~4837 lines) | ~2800 |
| `AnalyticsSection.tsx` | Kitchen+Products+Reports+Equipment tabs (from 4 pages totaling ~1319 lines) | ~900 |

---

### Task 1: Create Reztro Design Tokens

**Files:**
- Create: `frontend/src/pages/manager/manager-tokens.ts`

**Step 1: Create the tokens file**

```ts
// Reztro-style design tokens for manager dashboard
export const t = {
  // Colors
  orange: '#FF6B35',
  orangeLight: '#FFF5F0',
  orangeDark: '#E55A2B',
  bgMain: '#FAF7F2',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: '#6B7280',
  grayLight: '#E5E7EB',
  grayMuted: '#9CA3AF',
  beige: '#F5E6D3',
  green: '#10B981',
  greenLight: '#D1FAE5',
  greenDark: '#065F46',
  red: '#EF4444',
  redLight: '#FEE2E2',
  blue: '#3B82F6',
  yellow: '#FBBF24',

  // Typography
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  // Spacing
  sidebarWidth: 240,
  rightSidebarWidth: 300,
  headerHeight: 68,

  // Border radius
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
  },
} as const;

// Shared style helpers
export const cardStyle: React.CSSProperties = {
  background: t.white,
  borderRadius: t.radius.lg,
  padding: 20,
};

export const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 20px',
  borderRadius: t.radius.md,
  border: 'none',
  background: active ? t.orange : 'transparent',
  color: active ? t.white : t.gray,
  fontWeight: active ? 600 : 500,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: t.font,
  transition: 'all 0.2s ease',
});

export const metricCardStyle: React.CSSProperties = {
  ...cardStyle,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

export const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left' as const,
  padding: '10px 8px',
  fontSize: 12,
  fontWeight: 600,
  color: t.gray,
  borderBottom: `2px solid ${t.grayLight}`,
};

export const tableCellStyle: React.CSSProperties = {
  padding: '14px 8px',
  fontSize: 13,
  color: t.black,
  borderBottom: `1px solid ${t.grayLight}`,
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: t.black,
  margin: 0,
};

export const selectStyle: React.CSSProperties = {
  padding: '4px 10px',
  border: `1px solid ${t.grayLight}`,
  borderRadius: t.radius.sm,
  fontSize: 12,
  color: t.gray,
  background: t.white,
  outline: 'none',
  fontFamily: t.font,
};

// SVG icon components (inline, no dependencies)
export const Icons = {
  Grid: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  File: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Box: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  BarChart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Down: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Wallet: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  Pkg: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};
```

**Step 2: Verify file compiles**

Run: `cd frontend && npx tsc --noEmit src/pages/manager/manager-tokens.ts 2>&1 | head -20`
Expected: No errors (or ignorable ones from broader project)

**Step 3: Commit**

```bash
git add frontend/src/pages/manager/manager-tokens.ts
git commit -m "feat: add Reztro design tokens for manager dashboard consolidation"
```

---

### Task 2: Create ManagerShell Layout

**Files:**
- Create: `frontend/src/pages/manager/ManagerShell.tsx`

**Step 1: Build the shell component**

This is the core 3-column layout. It manages which section is active (via `activeSection` state synced to URL `?section=` param), renders the left sidebar with navigation, the header with search/bell/profile, and delegates middle content + right sidebar to child section components.

Key implementation details:
- Import `useAppSelector(selectCurrentUser)` and `usePageStore()` for store context
- Wrap with `withPageStoreContext` HOC
- Use `useSearchParams()` from react-router-dom for deep-linking: `?section=orders&tab=payments`
- Define sections array: `{ id, label, icon }` for sidebar rendering
- Active section highlighted in sidebar with orange background
- Header shows section title + "Hello {firstName}, welcome back!"
- Left sidebar: 240px fixed, white bg, logo at top, nav items, logout at bottom
- Right sidebar: 300px fixed, renders `<RightSidebar section={activeSection} />`
- Middle: flex, renders the active section component
- Full viewport height, fixed positioning

Each section component receives: `{ storeId: string, activeTab: string, onTabChange: (tab: string) => void }`

**Step 2: Verify it renders**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add frontend/src/pages/manager/ManagerShell.tsx
git commit -m "feat: add ManagerShell 3-column layout component"
```

---

### Task 3: Create RightSidebar Component

**Files:**
- Create: `frontend/src/pages/manager/RightSidebar.tsx`

**Step 1: Build section-aware right sidebar**

Props: `{ section: string, storeId: string }`

Renders different contextual content based on `section`:
- **dashboard**: Trending menus (useGetTopProductsQuery), Recent activity (useGetActiveStoreSessionsQuery)
- **orders**: Live order count, pending payments summary, today's refunds
- **inventory**: Low stock alerts (useGetLowStockAlertsQuery), pending POs count
- **operations**: Active drivers (useGetDriverStatusQuery), equipment alerts
- **people**: Staff on shift (useGetActiveStoreSessionsQuery), top performer (useGetStaffLeaderboardQuery)
- **analytics**: Key KPIs (useGetExecutiveSummaryQuery), forecast summary

Each section's sidebar data uses the same API hooks already in use by the existing pages.

**Step 2: Commit**

```bash
git add frontend/src/pages/manager/RightSidebar.tsx
git commit -m "feat: add section-aware RightSidebar component"
```

---

### Task 4: Create DashboardSection

**Files:**
- Create: `frontend/src/pages/manager/DashboardSection.tsx`
- Source: `DashboardPage.tsx` (1391 lines), `ConsolidatedOrdersDashboard.tsx` (415 lines)

**Step 1: Build DashboardSection**

Migrate the core dashboard content from DashboardPage.tsx:
- All API hooks (useGetTodaySalesMetricsQuery, useGetAverageOrderValueQuery, useGetDriverStatusQuery, useGetSalesTrendsQuery, useGetOrderTypeBreakdownQuery, useGetPeakHoursQuery, useGetStaffLeaderboardQuery, useGetTopProductsQuery, useGetSalesForecastQuery, useGetChurnPredictionQuery, useGetExecutiveSummaryQuery, useGetCustomerBehaviorAnalysisQuery, useGetDemandForecastQuery, useGetCostAnalysisQuery)
- Session management (useGetActiveStoreSessionsQuery, useApproveSessionMutation, useRejectSessionMutation)
- Store metrics (useGetStoreMetricsQuery, useGetStoreOrdersQuery)
- Schedule check (useCheckWeeklyScheduleExistsQuery)

Layout in Reztro style:
- 3 metric cards row (Total Orders, Total Customers, Total Revenue) with orange icon boxes
- Revenue chart (SVG line chart or use existing SalesTrendChart)
- Top Categories donut (SVG)
- Orders Overview bar chart
- Recent Orders table
- Customer Reviews section
- Session approval cards (existing feature from DashboardPage)
- BI widgets (forecast, churn prediction - existing from DashboardPage)

Restyle all from neumorphic to flat Reztro tokens. NO feature removal.

**Step 2: Verify compile**

**Step 3: Commit**

```bash
git add frontend/src/pages/manager/DashboardSection.tsx
git commit -m "feat: add DashboardSection with all metrics and BI features"
```

---

### Task 5: Create OrdersSection

**Files:**
- Create: `frontend/src/pages/manager/OrdersSection.tsx`
- Source: `OrderManagementPage.tsx` (1461 lines), `PaymentDashboardPage.tsx` (424 lines), `RefundManagementPage.tsx` (396 lines), `DeliveryManagementPage.tsx` (943 lines)

**Step 1: Build OrdersSection with 4 tabs**

Props: `{ storeId, activeTab, onTabChange }`
Tabs: Orders | Payments | Refunds | Deliveries

**Orders tab** (from OrderManagementPage.tsx):
- API: useGetStoreOrdersQuery, useUpdateOrderStatusMutation, useUpdateOrderPriorityMutation, useCancelOrderMutation, useAssignDriverMutation, useUpdatePaymentStatusMutation, useGetOrdersByDateQuery, useGetOrdersByDateRangeQuery, useGetActiveDeliveriesCountQuery, useSearchOrdersQuery, useGetUsersQuery, useGetTodaySalesMetricsQuery
- UI: FilterBar with search/status/type/priority/date filters, orders table with status badges, order detail modal, status update actions, driver assignment, stats cards

**Payments tab** (from PaymentDashboardPage.tsx):
- API: useGetTransactionsByStoreIdQuery, useGetReconciliationReportQuery, useGetStoreOrdersQuery
- UI: Transaction table, date selector, metrics cards, reconciliation report

**Refunds tab** (from RefundManagementPage.tsx):
- API: useGetTransactionsByStoreIdQuery, useInitiateRefundMutation, useGetRefundsByTransactionIdQuery
- UI: Transaction list, refund form (amount, reason, type), refund status

**Deliveries tab** (from DeliveryManagementPage.tsx):
- API: useGetDeliveryMetricsQuery, useGetTodayMetricsQuery, useAutoDispatchMutation, useTrackOrderQuery, useGetAvailableDriversQuery, useListDeliveryZonesQuery, useGetDriverPerformanceQuery, useGetDriverStatusQuery, useAcceptDeliveryMutation, useRejectDeliveryMutation, useGetStoreOrdersQuery
- UI: Delivery table with filtering, driver tracking map (ManagerDriverTrackingMap component), driver selector modal, metrics cards

All tabs render only when active (conditional rendering to avoid unnecessary API calls).

**Step 2: Commit**

```bash
git add frontend/src/pages/manager/OrdersSection.tsx
git commit -m "feat: add OrdersSection merging orders, payments, refunds, deliveries"
```

---

### Task 6: Create InventorySection

**Files:**
- Create: `frontend/src/pages/manager/InventorySection.tsx`
- Source: `InventoryDashboardPage.tsx` (522 lines), `SupplierManagementPage.tsx` (429 lines), `PurchaseOrdersPage.tsx` (444 lines), `WasteAnalysisPage.tsx` (388 lines)

**Step 1: Build InventorySection with 4 tabs**

Tabs: Stock | Suppliers | Purchase Orders | Waste

**Stock tab** (from InventoryDashboardPage.tsx):
- API: useGetAllInventoryItemsQuery, useGetLowStockAlertsQuery, useGetOutOfStockItemsQuery, useGetExpiringItemsQuery, useGetTotalInventoryValueQuery, useDeleteInventoryItemMutation
- UI: Inventory table with filtering/sorting, stock adjustment dialog, add item dialog, alert cards

**Suppliers tab** (from SupplierManagementPage.tsx):
- API: useGetAllSuppliersQuery, useGetActiveSuppliersQuery, useGetPreferredSuppliersQuery, useUpdateSupplierStatusMutation, useMarkSupplierPreferredMutation
- UI: Supplier table, add/edit supplier dialog, status/preferred filters

**Purchase Orders tab** (from PurchaseOrdersPage.tsx):
- API: useGetAllPurchaseOrdersQuery, useGetPendingApprovalPurchaseOrdersQuery, useApprovePurchaseOrderMutation, useRejectPurchaseOrderMutation, useSendPurchaseOrderMutation, useAutoGeneratePurchaseOrdersMutation
- UI: PO table, create PO dialog, receive PO dialog, approve/reject/send actions

**Waste tab** (from WasteAnalysisPage.tsx):
- API: useGetAllWasteRecordsQuery, useGetTotalWasteCostQuery, useGetWasteCostByCategoryQuery, useGetTopWastedItemsQuery, useGetPreventableWasteAnalysisQuery, useRecordWasteMutation
- UI: Waste records table, stats cards, date range selector, record waste dialog

**Step 2: Commit**

```bash
git add frontend/src/pages/manager/InventorySection.tsx
git commit -m "feat: add InventorySection merging stock, suppliers, POs, waste"
```

---

### Task 7: Create OperationsSection

**Files:**
- Create: `frontend/src/pages/manager/OperationsSection.tsx`
- Source: `RecipeManagementPage.tsx` (816 lines), `DriverManagementPage.tsx` (627 lines), `StoreManagementPage.tsx` (624 lines), `KioskManagementPage.tsx` (452 lines)

**Step 1: Build OperationsSection with 4 tabs**

Tabs: Recipes | Drivers | Stores | Kiosks

**Recipes tab** (from RecipeManagementPage.tsx):
- API: useGetAllMenuItemsQuery, useUpdateMenuItemMutation (from menuApi)
- UI: Menu items list with search/cuisine filter, recipe editor (ingredients + instructions CRUD), portion calculator, JSON import, save form

**Drivers tab** (from DriverManagementPage.tsx):
- API: useGetAllDriversQuery, useGetOnlineDriversQuery, useGetDriverStatsQuery, useGetDriverPerformanceQuery, useActivateDriverMutation, useDeactivateDriverMutation (from driverApi)
- UI: Driver table with FilterBar, driver details modal, ManagerDriverTrackingMap, performance stats, activate/deactivate actions

**Stores tab** (from StoreManagementPage.tsx):
- API: useGetStoreQuery, useGetActiveStoresQuery, useCreateStoreMutation, useUpdateStoreMutation (from storeApi)
- UI: Store info form, operating config (weekly schedule, delivery radius, order limits), create store modal

**Kiosks tab** (from KioskManagementPage.tsx):
- API: useGetActiveStoresProtectedQuery (storeApi), useCreateKioskMutation, useListKioskAccountsQuery, useDeactivateKioskMutation (kioskApi)
- UI: Store selector, terminal ID form, kiosk accounts table, token display modal

**Step 2: Commit**

```bash
git add frontend/src/pages/manager/OperationsSection.tsx
git commit -m "feat: add OperationsSection merging recipes, drivers, stores, kiosks"
```

---

### Task 8: Create PeopleSection

**Files:**
- Create: `frontend/src/pages/manager/PeopleSection.tsx`
- Source: `StaffManagementPage.tsx` (1375 lines), `StaffSchedulingPage.tsx` (743 lines), `StaffLeaderboardPage.tsx` (287 lines), `CustomerManagementPage.tsx` (1010 lines), `CampaignManagementPage.tsx` (619 lines), `ReviewManagementPage.tsx` (803 lines)

**Step 1: Build PeopleSection with 6 tabs**

Tabs: Staff | Scheduling | Leaderboard | Customers | Campaigns | Reviews

**Staff tab** (from StaffManagementPage.tsx):
- API: useGetStoreEmployeesQuery, useCreateUserMutation, useUpdateUserMutation, useActivateUserMutation, useDeactivateUserMutation, useGetActiveStoreSessionsQuery, useGetStoreSessionsQuery, useGetEmployeeSessionReportQuery, useGetEmployeeSessionStatusQuery
- UI: Employee table with FilterBar, add/edit staff dialogs, session tracking, PIN display modal, role management

**Scheduling tab** (from StaffSchedulingPage.tsx):
- API: useGetWeeklyScheduleQuery, useBulkCreateShiftsMutation, useCopyPreviousWeekScheduleMutation, useDeleteShiftMutation, useUpdateShiftMutation, useGetStoreEmployeesQuery
- UI: Weekly calendar grid, shift creation form, copy previous week action, shift edit/delete

**Leaderboard tab** (from StaffLeaderboardPage.tsx):
- API: useGetStaffLeaderboardQuery (analyticsApi)
- UI: Staff rankings table with period selector, performance level badges

**Customers tab** (from CustomerManagementPage.tsx):
- API: useGetAllCustomersQuery, useGetCustomerByIdQuery, useGetHighValueCustomersQuery, useGetTopSpendersQuery, useGetInactiveCustomersQuery, useGetRecentlyActiveCustomersQuery, useSearchCustomersQuery, useDeactivateCustomerMutation, useActivateCustomerMutation, useAddNoteMutation, useGetCustomerStatsQuery, useGetCustomerOrderStatsQuery, useGetCustomerPreferencesQuery, useGetCustomerLoyaltyPointsQuery, useGetCustomerAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useRemoveAddressMutation, useSetDefaultAddressMutation
- UI: Customer table with segmentation filters, customer detail panel, address management, loyalty points, notes, preferences

**Campaigns tab** (from CampaignManagementPage.tsx):
- API: Campaign CRUD hooks (from notificationApi or dedicated campaign hooks)
- UI: Campaign table with MUI components, create/edit campaign dialog, campaign stats, tabs for active/scheduled/completed

**Reviews tab** (from ReviewManagementPage.tsx):
- API: useGetRecentReviewsQuery, useGetReviewsNeedingResponseQuery, useGetPendingReviewsQuery, useGetFlaggedReviewsQuery, useGetOverallStatsQuery, useCreateResponseMutation, useGetResponseTemplatesQuery, useApproveReviewMutation, useRejectReviewMutation
- UI: Review cards with ratings, response form with templates, approve/reject actions, review stats summary

**Step 2: Commit**

```bash
git add frontend/src/pages/manager/PeopleSection.tsx
git commit -m "feat: add PeopleSection merging staff, scheduling, leaderboard, customers, campaigns, reviews"
```

---

### Task 9: Create AnalyticsSection

**Files:**
- Create: `frontend/src/pages/manager/AnalyticsSection.tsx`
- Source: `KitchenAnalyticsPage.tsx` (394 lines), `ProductAnalyticsPage.tsx` (270 lines), `AdvancedReportsPage.tsx` (52 lines), `EquipmentMonitoringPage.tsx` (603 lines)

**Step 1: Build AnalyticsSection with 4 tabs**

Tabs: Kitchen | Products | Reports | Equipment

**Kitchen tab** (from KitchenAnalyticsPage.tsx):
- UI: Prep time stats, staff performance metrics, order completion rates (currently uses placeholder data - preserve as-is)

**Products tab** (from ProductAnalyticsPage.tsx):
- API: useGetTopProductsQuery (analyticsApi)
- UI: MUI table with product rankings, trending indicators, period toggle

**Reports tab** (from AdvancedReportsPage.tsx):
- Components: SalesTrendChart, RevenueBreakdownChart, PeakHoursHeatmap (from components/charts/)
- UI: Grid layout with 3 chart components

**Equipment tab** (from EquipmentMonitoringPage.tsx):
- API: useGetEquipmentByStoreQuery, useCreateEquipmentMutation, useUpdateEquipmentStatusMutation, useToggleEquipmentPowerMutation, useUpdateTemperatureMutation, useDeleteEquipmentMutation (equipmentApi)
- UI: Equipment cards with status indicators, temperature monitoring, power toggle, CRUD actions, add equipment form

**Step 2: Commit**

```bash
git add frontend/src/pages/manager/AnalyticsSection.tsx
git commit -m "feat: add AnalyticsSection merging kitchen, products, reports, equipment"
```

---

### Task 10: Update App.tsx Routing

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Replace 25+ manager routes with single shell route**

Remove all individual manager route imports and `<Route>` elements. Replace with:

```tsx
const ManagerShell = React.lazy(() => import('./pages/manager/ManagerShell'));
```

Replace all `/manager/*` routes with:

```tsx
<Route path="/manager" element={
  <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
    <ManagerShell />
  </ProtectedRoute>
} />
<Route path="/manager/*" element={
  <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
    <ManagerShell />
  </ProtectedRoute>
} />
```

**Keep these routes unchanged:**
- `/manager/staff/:staffId/profile` → StaffProfilePage
- `/staff/profile` → StaffProfilePage
- `/kitchen/*` → KitchenDisplayPage
- `/driver/*` → DriverDashboard
- `/pos/*` → POSSystem
- All customer, auth, and public routes

**Step 2: Verify the app compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`

**Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: consolidate manager routing to single ManagerShell"
```

---

### Task 11: Test All Features

**Step 1: Start the frontend**

Run: `cd frontend && npm run dev`

**Step 2: Manual verification checklist**

Test each section and tab to verify all features work:

- [ ] Dashboard loads with all metric cards, charts, session approval
- [ ] Orders tab: table loads, filters work, status update, cancel, assign driver
- [ ] Payments tab: transactions load, date filter, reconciliation report
- [ ] Refunds tab: initiate refund, view refund status
- [ ] Deliveries tab: delivery list, tracking map, auto-dispatch, driver metrics
- [ ] Inventory Stock tab: items load, low stock alerts, add/delete items
- [ ] Suppliers tab: list loads, add/edit supplier, mark preferred
- [ ] Purchase Orders tab: list loads, create/approve/reject/send PO
- [ ] Waste tab: records load, record waste, cost analytics
- [ ] Recipes tab: menu items load, edit recipe, portion calculator
- [ ] Drivers tab: driver list, tracking map, activate/deactivate
- [ ] Stores tab: store info loads, edit, create new store
- [ ] Kiosks tab: kiosk accounts load, create/deactivate kiosk
- [ ] Staff tab: employee list, add/edit, session tracking
- [ ] Scheduling tab: weekly calendar, create/edit/delete shifts
- [ ] Leaderboard tab: rankings load with period filter
- [ ] Customers tab: customer list with segmentation, detail panel, addresses
- [ ] Campaigns tab: campaign list, create/edit
- [ ] Reviews tab: review list, respond, approve/reject
- [ ] Kitchen Analytics tab: stats display
- [ ] Products tab: top products table with trends
- [ ] Reports tab: 3 chart components render
- [ ] Equipment tab: equipment list, status/power/temp controls, CRUD
- [ ] Right sidebar changes content per section
- [ ] URL deep-linking works (?section=orders&tab=payments)
- [ ] Profile dropdown, notification bell, search bar functional
- [ ] Logout works

**Step 3: Commit any fixes**

---

### Task 12: Clean Up Old Files

**Step 1: Delete old manager page files**

Only after all features are verified working.

Files to delete:
- `frontend/src/pages/manager/DashboardPage.tsx`
- `frontend/src/pages/manager/ConsolidatedOrdersDashboard.tsx`
- `frontend/src/pages/manager/OrderManagementPage.tsx`
- `frontend/src/pages/manager/PaymentDashboardPage.tsx`
- `frontend/src/pages/manager/RefundManagementPage.tsx`
- `frontend/src/pages/manager/DeliveryManagementPage.tsx`
- `frontend/src/pages/manager/InventoryDashboardPage.tsx`
- `frontend/src/pages/manager/SupplierManagementPage.tsx`
- `frontend/src/pages/manager/PurchaseOrdersPage.tsx`
- `frontend/src/pages/manager/WasteAnalysisPage.tsx`
- `frontend/src/pages/manager/RecipeManagementPage.tsx`
- `frontend/src/pages/manager/DriverManagementPage.tsx`
- `frontend/src/pages/manager/StoreManagementPage.tsx`
- `frontend/src/pages/manager/KioskManagementPage.tsx`
- `frontend/src/pages/manager/StaffManagementPage.tsx`
- `frontend/src/pages/manager/StaffSchedulingPage.tsx`
- `frontend/src/pages/manager/StaffLeaderboardPage.tsx`
- `frontend/src/pages/manager/CustomerManagementPage.tsx`
- `frontend/src/pages/manager/CampaignManagementPage.tsx`
- `frontend/src/pages/manager/ReviewManagementPage.tsx`
- `frontend/src/pages/manager/KitchenAnalyticsPage.tsx`
- `frontend/src/pages/manager/ProductAnalyticsPage.tsx`
- `frontend/src/pages/manager/AdvancedReportsPage.tsx`
- `frontend/src/pages/manager/EquipmentMonitoringPage.tsx`
- `frontend/src/pages/manager/AnalyticsPage.tsx`
- `frontend/src/components/common/ManagementHubSidebar.tsx`
- All `.bak` files in `frontend/src/pages/manager/`

Also delete old test files that reference deleted pages (can be recreated later):
- `frontend/src/pages/manager/*.test.tsx`

**Step 2: Verify app still compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`

**Step 3: Remove unused imports in App.tsx**

Any lazy imports for deleted pages should already be removed in Task 10.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old manager pages after consolidation"
```
