# Manager Dashboard Consolidation - Reztro Style Redesign

## Goal

Consolidate 25+ individual manager pages into 6 unified sections within a single Reztro-style 3-column shell. Zero feature loss. Drop neumorphic design for flat modern aesthetic.

## Reference

[Reztro Restaurant Dashboard](https://dribbble.com/shots/25698030-Reztro-Restaurant-Dashboard-Figma-Template)

## Architecture

### Shell Layout (ManagerShell.tsx)

Single wrapper component rendered at `/manager/*`. Contains:

- **Left Sidebar** (240px fixed): Logo, 6 nav items with icons, upgrade/info CTA at bottom
- **Header** (full width across middle + right): Page title + greeting, search bar, notification bell, settings icon, profile avatar + name + role + dropdown chevron
- **Middle Content** (flex): Active section content with internal tabs
- **Right Sidebar** (300px fixed): Contextual info that changes per section

Navigation is state-based (useState/URL params), not route-based page navigation. Single route `/manager` with optional query params for deep-linking (e.g. `/manager?section=orders&tab=payments`).

### Design Tokens

```
Orange accent:    #FF6B35
Orange light bg:  #FFF5F0
Main background:  #FAF7F2
White cards:      #FFFFFF
Dark text:        #1A1A1A
Gray text:        #6B7280
Gray border:      #E5E7EB
Green (up):       #10B981
Red (down):       #EF4444
Beige placeholder:#F5E6D3
Card radius:      16px
Font:             Inter, -apple-system, sans-serif
```

### Section Consolidation Map

#### 1. Dashboard (default view)
**Source pages:** DashboardPage.tsx, ConsolidatedOrdersDashboard.tsx
**No tabs** - single overview page
**Content:**
- Metric cards row: Total Orders, Total Customers, Total Revenue (from analyticsApi: useGetTodaySalesMetricsQuery)
- Revenue chart (line) with income/expense (from useGetSalesTrendsQuery)
- Top Categories donut chart (from useGetOrderTypeBreakdownQuery)
- Orders Overview bar chart (from useGetPeakHoursQuery)
- Order Types breakdown (from useGetOrderTypeBreakdownQuery)
- Recent Orders table (from useGetStoreOrdersQuery)
- Customer Reviews section (from reviewApi)
**Right sidebar:** Trending menus (useGetTopProductsQuery), Recent activity (from sessionApi)

#### 2. Orders & Payments
**Source pages:** OrderManagementPage.tsx, PaymentDashboardPage.tsx, RefundManagementPage.tsx, DeliveryManagementPage.tsx
**Tabs:** Orders | Payments | Refunds | Deliveries
**Content per tab:**
- Orders: Full order table with filters, status updates, order details modal - all from OrderManagementPage
- Payments: Payment history table, payment stats, transaction details - all from PaymentDashboardPage
- Refunds: Refund requests table, approve/reject actions - all from RefundManagementPage
- Deliveries: Active deliveries map/list, delivery status tracking - all from DeliveryManagementPage
**Right sidebar:** Live order count, pending payments, today's refunds, active deliveries count

#### 3. Inventory & Supply
**Source pages:** InventoryDashboardPage.tsx, SupplierManagementPage.tsx, PurchaseOrdersPage.tsx, WasteAnalysisPage.tsx
**Tabs:** Stock | Suppliers | Purchase Orders | Waste
**Content per tab:**
- Stock: Inventory table with stock levels, low stock alerts, reorder - all from InventoryDashboardPage
- Suppliers: Supplier list, add/edit supplier, contact info - all from SupplierManagementPage
- Purchase Orders: PO table, create PO, PO status tracking - all from PurchaseOrdersPage
- Waste: Waste tracking table, waste analytics charts - all from WasteAnalysisPage
**Right sidebar:** Low stock alerts, pending POs count, waste summary stats

#### 4. Operations
**Source pages:** RecipeManagementPage.tsx, KioskManagementPage.tsx, DriverManagementPage.tsx, StoreManagementPage.tsx
**Tabs:** Recipes | Drivers | Stores | Kiosks
**Content per tab:**
- Recipes: Recipe list, add/edit recipe, ingredient management - all from RecipeManagementPage
- Drivers: Driver list, status, assignment - all from DriverManagementPage
- Stores: Store list, add/edit store, store settings - all from StoreManagementPage
- Kiosks: Kiosk terminal management, status - all from KioskManagementPage
**Right sidebar:** Active drivers count, equipment status, kiosk online/offline counts
**Note:** POS is accessed separately at /pos (not part of manager shell)

#### 5. People & Marketing
**Source pages:** StaffManagementPage.tsx, StaffSchedulingPage.tsx, StaffLeaderboardPage.tsx, CustomerManagementPage.tsx, CampaignManagementPage.tsx, ReviewManagementPage.tsx
**Tabs:** Staff | Scheduling | Leaderboard | Customers | Campaigns | Reviews
**Content per tab:**
- Staff: Employee table, add/edit staff, roles - all from StaffManagementPage
- Scheduling: Shift calendar, weekly schedule - all from StaffSchedulingPage
- Leaderboard: Staff rankings, performance metrics - all from StaffLeaderboardPage
- Customers: Customer database, search, details - all from CustomerManagementPage
- Campaigns: Marketing campaigns, create/edit - all from CampaignManagementPage
- Reviews: Review list, respond to reviews - all from ReviewManagementPage
**Right sidebar:** Staff on shift today, top performer, new customers today, campaign stats

#### 6. Analytics & Reports
**Source pages:** KitchenAnalyticsPage.tsx, ProductAnalyticsPage.tsx, AdvancedReportsPage.tsx, EquipmentMonitoringPage.tsx
**Tabs:** Kitchen | Products | Reports | Equipment
**Content per tab:**
- Kitchen: Prep time analytics, kitchen performance - all from KitchenAnalyticsPage
- Products: Menu item performance, trends - all from ProductAnalyticsPage
- Reports: Comprehensive business reports, BI forecasts - all from AdvancedReportsPage
- Equipment: Kitchen equipment monitoring - all from EquipmentMonitoringPage
**Right sidebar:** Key KPIs, forecast summary, alerts from useGetExecutiveSummaryQuery

### API Hooks Preserved (complete list)

From analyticsApi: useGetTodaySalesMetricsQuery, useGetAverageOrderValueQuery, useGetDriverStatusQuery, useGetStaffPerformanceQuery, useGetSalesTrendsQuery, useGetOrderTypeBreakdownQuery, useGetPeakHoursQuery, useGetStaffLeaderboardQuery, useGetTopProductsQuery, useGetSalesForecastQuery, useGetCustomerBehaviorAnalysisQuery, useGetChurnPredictionQuery, useGetDemandForecastQuery, useGetCostAnalysisQuery, useGetExecutiveSummaryQuery, useClearAnalyticsCacheMutation

From orderApi: useGetStoreOrdersQuery + all order mutations
From deliveryApi: all delivery hooks
From customerApi: all customer hooks
From reviewApi: all review hooks
From sessionApi: useGetActiveStoreSessionsQuery, useApproveSessionMutation, useRejectSessionMutation
From storeApi: useGetStoreMetricsQuery
From shiftApi: useCheckWeeklyScheduleExistsQuery
From kioskApi: all kiosk hooks
From userApi: all user hooks
From notificationApi: all notification hooks

### File Structure

```
frontend/src/pages/manager/
  ManagerShell.tsx          # The 3-column shell layout
  DashboardSection.tsx      # Dashboard content
  OrdersSection.tsx         # Orders & Payments (4 tabs)
  InventorySection.tsx      # Inventory & Supply (4 tabs)
  OperationsSection.tsx     # Operations (4 tabs)
  PeopleSection.tsx         # People & Marketing (6 tabs)
  AnalyticsSection.tsx      # Analytics & Reports (4 tabs)
  RightSidebar.tsx          # Right sidebar with section-aware content
  manager-tokens.ts         # Reztro design tokens (replaces neumorphic)
```

### Routing Changes

**Before:** 25+ routes in App.tsx
**After:** Single route:
```tsx
<Route path="/manager/*" element={
  <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
    <ManagerShell />
  </ProtectedRoute>
} />
```

Deep-linking via URL search params: `/manager?section=orders&tab=payments`

### Pages to Delete After Migration

All 25 individual manager page files + ManagementHubSidebar.tsx + ConsolidatedOrdersDashboard.tsx + .bak files

### What Stays Unchanged

- All backend services and APIs
- All RTK Query API slices (analyticsApi, orderApi, etc.)
- Store/Redux state management
- Customer-facing pages (menu, checkout, tracking)
- Kitchen Display, POS System, Driver Dashboard
- Authentication and ProtectedRoute
- All API hooks and their data fetching logic

## Implementation Order

1. Create manager-tokens.ts (Reztro design tokens)
2. Create ManagerShell.tsx (3-column layout with sidebar nav + header)
3. Create RightSidebar.tsx (section-aware contextual sidebar)
4. Create DashboardSection.tsx (migrate DashboardPage content)
5. Create OrdersSection.tsx (merge 4 pages)
6. Create InventorySection.tsx (merge 4 pages)
7. Create OperationsSection.tsx (merge 4 pages)
8. Create PeopleSection.tsx (merge 6 pages)
9. Create AnalyticsSection.tsx (merge 4 pages)
10. Update App.tsx routing
11. Test all features work
12. Delete old files
