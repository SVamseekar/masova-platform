# MaSoVa — Complete Remaining Work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the codebase from "code written but scattered" to "fully merged, feature-complete, and deployed on GCP."

**Architecture:** Six independent work streams executed in order: merge pending branches → commit masova-support → build missing Crew App screens → upgrade Dockerfiles → deploy to GCP via Cloud Run + Firebase Hosting.

**Tech Stack:** Git, Spring Boot 3, React Native 0.83, Python/FastAPI, Docker multi-stage, GCP Cloud Run, Firebase Hosting, GitHub Actions

---

## Work Stream Overview (execute in order)

1. **Merge pending branches** — PR #7 (Phase 0), feat/postgres-migration (Phase 2), feature/phase4-frontend-revamp (Phase 4)
2. **Commit masova-support** — all Phase 6 agent code is untracked
3. **Build missing Crew App screens** — Kitchen, Cashier, Manager role-specific tabs (Phase 5 Tasks 5.4–5.6)
4. **Fix AppNavigator** — wire KitchenTabNavigator, CashierTabNavigator, ManagerTabNavigator into RoleRouter
5. **Multi-stage Dockerfiles** — upgrade all 6 Java services + masova-support
6. **GCP deployment** — Cloud Run services, Firebase Hosting, GitHub Actions CI/CD

---

## Task 1: Merge PR #7 (Phase 0 — OUT_FOR_DELIVERY fix)

**Context:** PR #7 on GitHub adds `OUT_FOR_DELIVERY` to the `Order.java` inner enum. It's OPEN, all tests confirmed passing in the PR description. The fix is in `.worktrees/phase0/`.

**Files:**
- `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java` (will be updated after merge)

- [ ] **Step 1: Merge PR #7 via gh CLI**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
gh pr merge 7 --squash --delete-branch
```

Expected: "Merged pull request #7"

- [ ] **Step 2: Pull the merge commit**

```bash
git pull origin main
```

- [ ] **Step 3: Verify OUT_FOR_DELIVERY is now in the inner enum**

```bash
grep -n "OUT_FOR_DELIVERY" commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java
```

Expected: line showing `OUT_FOR_DELIVERY` inside the `OrderStatus` enum.

---

## Task 2: Merge feat/postgres-migration (Phase 2 — PostgreSQL dual-write)

**Context:** Branch `feat/postgres-migration` (in `.worktrees/feat/postgres-migration/`) has all the PostgreSQL work — Flyway migrations, JPA entities, dual-write in UserService and OrderService, PostgreSQL in docker-compose. It was never merged to main.

- [ ] **Step 1: Check for conflicts before merging**

```bash
git fetch origin
git merge --no-commit --no-ff feat/postgres-migration
```

If conflicts: resolve them (likely none since the branch diverged cleanly), then `git merge --continue`.
If clean: proceed.

- [ ] **Step 2: Complete the merge**

```bash
git merge feat/postgres-migration -m "feat(phase2): merge PostgreSQL dual-write — Flyway migrations, JPA entities, docker-compose postgres"
```

- [ ] **Step 3: Verify PostgreSQL is now in docker-compose**

```bash
grep -n "postgres" docker-compose.yml
```

Expected: postgres service definition with port 5432.

- [ ] **Step 4: Verify Flyway migrations exist on main**

```bash
find . -name "V*.sql" -not -path "./.worktrees/*" -not -path "./.git/*"
```

Expected: `core-service/.../V1__users_schema.sql`, `commerce-service/.../V1__orders_schema.sql`, etc.

- [ ] **Step 5: Verify dual-write in OrderService**

```bash
grep -n "orderJpaRepository\|saveToPostgres\|dual" commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java | head -5
```

Expected: references to a JPA repository alongside the MongoDB repository.

- [ ] **Step 6: Push to origin**

```bash
git push origin main
```

---

## Task 3: Merge feature/phase4-frontend-revamp (Phase 4 — Dark-Premium CSS token system)

**Context:** Branch `feature/phase4-frontend-revamp` adds the proper `--dp-*` CSS variable system, DM Sans font, and `CustomerLayout` wrapper. 4 commits. Never merged to main.

- [ ] **Step 1: Merge**

```bash
git merge feature/phase4-frontend-revamp -m "feat(phase4): merge dark-premium CSS token system — CustomerLayout wrapper, --dp-* vars, DM Sans font"
```

- [ ] **Step 2: Verify CustomerLayout exists on main**

```bash
find frontend/src -name "CustomerLayout*"
```

Expected: `frontend/src/components/CustomerLayout.tsx` or similar.

- [ ] **Step 3: Verify --dp-* CSS vars exist**

```bash
grep -rn "\-\-dp-bg\|\-\-dp-surface" frontend/src/ --include="*.css" | head -5
```

Expected: definitions in a CSS file (not just usage).

- [ ] **Step 4: Build frontend to confirm no regressions**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Push**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git push origin main
```

---

## Task 4: Commit masova-support Phase 6 agents

**Context:** All Phase 6 agent code is untracked on branch `feature/phase6-ai-agents` in the masova-support repo. Everything needs to be staged and committed.

- [ ] **Step 1: Stage all untracked files**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
git add src/masova_agent/__init__.py
git add src/masova_agent/chat.py
git add src/masova_agent/core/
git add src/masova_agent/data/
git add src/masova_agent/exceptions/
git add src/masova_agent/services/
git add src/masova_agent/tools/system_briefing.py
git add src/masova_agent/utils/__init__.py
git add src/masova_agent/utils/logger.py
git add src/masova_agent/agents/
git add src/masova_agent/scheduler/
git add tests/
git add config/
git add pyproject.toml setup.py Makefile
```

- [ ] **Step 2: Verify what's staged**

```bash
git status --short
```

Expected: all the above files show as `A` (added/staged).

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(agents): all 8 AI agents — support chat, demand forecasting, inventory reorder, churn prevention, review response, shift optimisation, kitchen coach, dynamic pricing"
```

- [ ] **Step 4: Push branch**

```bash
git push -u origin feature/phase6-ai-agents
```

- [ ] **Step 5: Open PR**

```bash
gh pr create --title "feat(phase6): 8 AI agents — APScheduler, RabbitMQ consumer, all agents wired" --body "$(cat <<'EOF'
## Summary
- All 8 AI agents implemented and wired (Agent 1–8)
- APScheduler integrated into FastAPI lifespan (nightly/daily/every-6h jobs)
- Agent 1 support chat: 8 tools wired (get_order_status, get_menu_items, get_store_hours, submit_complaint, request_refund, get_loyalty_points, get_store_wait_time, cancel_order)
- Agent 5 review response: RabbitMQ consumer via aio_pika
- Redis session service (DB 1) for conversation persistence

## Test plan
- [ ] `uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload` starts without errors
- [ ] `POST /agent/chat` with `{message: "what's on the menu?"}` returns a menu response
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] APScheduler jobs registered (check startup logs)
EOF
)"
```

---

## Task 5: Build KitchenTabNavigator + KitchenQueueScreen

**Context:** All non-driver roles (KITCHEN_STAFF, CASHIER, MANAGER) currently route to `StaffTabNavigator` which shows Shifts/Schedule/Earnings/Profile — generic personal screens. The plan requires role-specific operational tabs. This task builds the Kitchen role tabs.

**Files:**
- Create: `MaSoVaCrewApp/src/navigation/KitchenTabNavigator.tsx`
- Create: `MaSoVaCrewApp/src/screens/kitchen/KitchenQueueScreen.tsx`
- Create: `MaSoVaCrewApp/src/screens/kitchen/OrderDetailScreen.tsx`

**Key facts from existing code:**
- RTK Query: use `orderApi` from `src/store/api/orderApi.ts` (has `baseUrl: API_CONFIG.ORDER_SERVICE_URL`, auth headers auto-injected)
- Auth: `state.auth.accessToken` (not `token`), `state.auth.user` has `storeId`, `id`, `type`
- Role colors: `colors.roles.kitchen = '#FF6B35'` from `src/styles/driverDesignTokens.ts`
- RootState: import from `../../store/store`
- API endpoint for kitchen orders: `GET /orders/kitchen?storeId={storeId}` (returns active kitchen orders)
- API endpoint for next stage: `POST /orders/{id}/next-stage` (advance order status)

- [ ] **Step 1: Create KitchenTabNavigator.tsx**

Create `src/navigation/KitchenTabNavigator.tsx`:

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, components } from '../styles/driverDesignTokens';
import { KitchenQueueScreen } from '../screens/kitchen/KitchenQueueScreen';
import MyShiftsScreen from '../screens/shared/MyShiftsScreen';
import MyProfileScreen from '../screens/shared/MyProfileScreen';

const Tab = createBottomTabNavigator();
const ACCENT = colors.roles.kitchen; // '#FF6B35'

export const KitchenTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: ACCENT,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: {
        height: components.bottomNav.height,
        backgroundColor: colors.surface.background,
        borderTopColor: colors.surface.border,
        borderTopWidth: 1,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerStyle: {
        backgroundColor: colors.surface.background,
        elevation: 0, shadowOpacity: 0,
        borderBottomWidth: 3, borderBottomColor: ACCENT,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: { fontWeight: '700', fontSize: 18 },
    }}
  >
    <Tab.Screen
      name="KitchenQueue"
      component={KitchenQueueScreen}
      options={{
        title: 'Order Queue',
        tabBarIcon: ({ color, size }) => <Icon name="restaurant" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="KitchenShifts"
      component={MyShiftsScreen}
      options={{
        title: 'My Shifts',
        tabBarIcon: ({ color, size }) => <Icon name="timer" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="KitchenProfile"
      component={MyProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default KitchenTabNavigator;
```

- [ ] **Step 2: Create KitchenQueueScreen.tsx**

Create `src/screens/kitchen/KitchenQueueScreen.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { colors } from '../../styles/driverDesignTokens';
import { useGetKitchenOrdersQuery, useAdvanceOrderStageMutation } from '../../store/api/orderApi';

const ACCENT = colors.roles.kitchen;

const getUrgencyColor = (receivedAt: string): string => {
  const minutes = (Date.now() - new Date(receivedAt).getTime()) / 60000;
  if (minutes > 10) return colors.semantic.error;
  if (minutes > 5) return colors.semantic.warning;
  return colors.semantic.success;
};

const getUrgencyLabel = (receivedAt: string): string => {
  const minutes = Math.floor((Date.now() - new Date(receivedAt).getTime()) / 60000);
  return `${minutes}m ago`;
};

export const KitchenQueueScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: orders = [], isLoading, isError, refetch } = useGetKitchenOrdersQuery(
    user?.storeId ?? '',
    { pollingInterval: 15000, skip: !user?.storeId }
  );
  const [advanceStage] = useAdvanceOrderStageMutation();
  const [advancing, setAdvancing] = useState<string | null>(null);

  const handleBump = useCallback(async (orderId: string, orderNumber: string) => {
    setAdvancing(orderId);
    try {
      await advanceStage(orderId).unwrap();
    } catch {
      Alert.alert('Error', `Could not advance order #${orderNumber}`);
    } finally {
      setAdvancing(null);
    }
  }, [advanceStage]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load orders</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={orders}
      keyExtractor={item => item.id}
      onRefresh={refetch}
      refreshing={false}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No active orders</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { borderLeftColor: getUrgencyColor(item.createdAt) }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.urgency}>{getUrgencyLabel(item.createdAt)}</Text>
          </View>

          <Text style={[styles.status, { color: ACCENT }]}>{item.status}</Text>

          {item.orderType === 'DINE_IN' && item.tableNumber != null && (
            <Text style={styles.tableTag}>Table {item.tableNumber}</Text>
          )}

          {item.items.map((lineItem: { name: string; quantity: number; customizations?: string }, idx: number) => (
            <View key={idx} style={styles.lineItem}>
              <Text style={styles.lineItemText}>{lineItem.quantity}× {lineItem.name}</Text>
              {lineItem.customizations ? (
                <Text style={styles.customizations}>{lineItem.customizations}</Text>
              ) : null}
            </View>
          ))}

          {item.specialInstructions ? (
            <Text style={styles.notes}>📝 {item.specialInstructions}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.bumpBtn, advancing === item.id && styles.bumpBtnDisabled]}
            onPress={() => handleBump(item.id, item.orderNumber)}
            disabled={advancing === item.id}
            activeOpacity={0.8}
          >
            {advancing === item.id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.bumpText}>▶  Advance Status</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  errorText: { color: colors.semantic.error, fontSize: 16, marginBottom: 12 },
  retryBtn: { backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: { color: colors.text.tertiary, fontSize: 16 },
  card: {
    backgroundColor: colors.surface.background,
    borderRadius: 10, margin: 8, padding: 16,
    borderLeftWidth: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderNumber: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  urgency: { color: colors.text.tertiary, fontSize: 12 },
  status: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  tableTag: { color: colors.semantic.warning, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  lineItem: { marginVertical: 2 },
  lineItemText: { color: colors.text.primary, fontSize: 15 },
  customizations: { color: colors.text.secondary, fontSize: 12, marginLeft: 8 },
  notes: { color: colors.text.secondary, fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  bumpBtn: {
    backgroundColor: ACCENT, marginTop: 14,
    padding: 14, borderRadius: 8, alignItems: 'center', minHeight: 48,
  },
  bumpBtnDisabled: { opacity: 0.5 },
  bumpText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default KitchenQueueScreen;
```

- [ ] **Step 3: Add RTK Query endpoints to orderApi.ts**

Read `src/store/api/orderApi.ts` to find the `endpoints` block, then add these two endpoints:

```ts
// Add inside the endpoints: (builder) => ({ ... }) block

getKitchenOrders: builder.query<KitchenOrder[], string>({
  query: (storeId) => `/orders/kitchen?storeId=${storeId}`,
  providesTags: ['Orders'],
}),

advanceOrderStage: builder.mutation<void, string>({
  query: (orderId) => ({
    url: `/orders/${orderId}/next-stage`,
    method: 'POST',
  }),
  invalidatesTags: ['Orders'],
}),
```

Also add this type at the top of `orderApi.ts` (after existing imports):

```ts
export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; customizations?: string }>;
  specialInstructions?: string;
}
```

And export the hooks — RTK Query auto-generates them. Add to the `export const { ... }` block:
```ts
useGetKitchenOrdersQuery,
useAdvanceOrderStageMutation,
```

- [ ] **Step 4: Create OrderDetailScreen.tsx** (for tapping an order card in the future)

Create `src/screens/kitchen/OrderDetailScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../../styles/driverDesignTokens';
import type { KitchenOrder } from '../../store/api/orderApi';

type RouteParams = { OrderDetail: { order: KitchenOrder } };

export const OrderDetailScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'OrderDetail'>>();
  const { order } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
      <Text style={[styles.status, { color: colors.roles.kitchen }]}>{order.status}</Text>

      {order.orderType === 'DINE_IN' && order.tableNumber != null && (
        <Text style={styles.tableTag}>Table {order.tableNumber}</Text>
      )}

      {order.items.map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
          {item.customizations ? (
            <Text style={styles.customizations}>{item.customizations}</Text>
          ) : null}
        </View>
      ))}

      {order.specialInstructions ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Special Instructions</Text>
          <Text style={styles.notesText}>{order.specialInstructions}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt, padding: 16 },
  orderNumber: { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  status: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  tableTag: { color: colors.semantic.warning, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  item: { backgroundColor: colors.surface.background, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemName: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  customizations: { color: colors.text.secondary, fontSize: 12, marginTop: 4 },
  notes: { backgroundColor: colors.surface.background, borderRadius: 8, padding: 12, marginTop: 8 },
  notesLabel: { color: colors.roles.kitchen, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  notesText: { color: colors.text.primary, fontSize: 14 },
});

export default OrderDetailScreen;
```

- [ ] **Step 5: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
git add src/navigation/KitchenTabNavigator.tsx
git add src/screens/kitchen/KitchenQueueScreen.tsx
git add src/screens/kitchen/OrderDetailScreen.tsx
git add src/store/api/orderApi.ts
git commit -m "feat(crew-app): KitchenTabNavigator, KitchenQueueScreen — urgency colors, RTK Query polling, bump button"
```

---

## Task 6: Build CashierTabNavigator + QuickOrderScreen

**Context:** Cashier role needs a quick order entry screen (menu grid → cart → place cash order). Uses `crewApi` base setup pattern but new endpoints needed.

**Files:**
- Create: `MaSoVaCrewApp/src/navigation/CashierTabNavigator.tsx`
- Create: `MaSoVaCrewApp/src/screens/cashier/QuickOrderScreen.tsx`
- Modify: `MaSoVaCrewApp/src/store/api/orderApi.ts` (add getMenuItems, placeStaffOrder endpoints)

**Key facts:**
- Role color: `colors.roles.kiosk = '#2196F3'` (cashier uses kiosk color per CLAUDE.md: Cashier=`#2196F3`)
- Menu endpoint: `GET /menu?storeId={storeId}&available=true`
- Place order endpoint: `POST /orders` with body including `createdByStaffId`
- Auth headers auto-injected by orderApi baseQuery

- [ ] **Step 1: Create CashierTabNavigator.tsx**

Create `src/navigation/CashierTabNavigator.tsx`:

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, components } from '../styles/driverDesignTokens';
import { QuickOrderScreen } from '../screens/cashier/QuickOrderScreen';
import MyShiftsScreen from '../screens/shared/MyShiftsScreen';
import MyProfileScreen from '../screens/shared/MyProfileScreen';

const Tab = createBottomTabNavigator();
const ACCENT = colors.roles.kiosk; // '#2196F3'

export const CashierTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: ACCENT,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: {
        height: components.bottomNav.height,
        backgroundColor: colors.surface.background,
        borderTopColor: colors.surface.border,
        borderTopWidth: 1,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerStyle: {
        backgroundColor: colors.surface.background,
        elevation: 0, shadowOpacity: 0,
        borderBottomWidth: 3, borderBottomColor: ACCENT,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: { fontWeight: '700', fontSize: 18 },
    }}
  >
    <Tab.Screen
      name="NewOrder"
      component={QuickOrderScreen}
      options={{
        title: 'New Order',
        tabBarIcon: ({ color, size }) => <Icon name="add-circle" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="CashierShifts"
      component={MyShiftsScreen}
      options={{
        title: 'My Shifts',
        tabBarIcon: ({ color, size }) => <Icon name="timer" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="CashierProfile"
      component={MyProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default CashierTabNavigator;
```

- [ ] **Step 2: Add menu + staff order endpoints to orderApi.ts**

Inside the `endpoints: (builder) => ({` block in `src/store/api/orderApi.ts`, add:

```ts
getMenuItems: builder.query<MenuItem[], string>({
  query: (storeId) => `/menu?storeId=${storeId}&available=true`,
  transformResponse: (res: { content: MenuItem[] } | MenuItem[]) =>
    Array.isArray(res) ? res : res.content,
}),

placeStaffOrder: builder.mutation<{ id: string; orderNumber: string }, StaffOrderRequest>({
  query: (body) => ({ url: '/orders', method: 'POST', body }),
  invalidatesTags: ['Orders'],
}),
```

Add these types at the top of `orderApi.ts`:

```ts
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

export interface StaffOrderRequest {
  storeId: string;
  customerName: string;
  orderType: 'TAKEAWAY' | 'DINE_IN';
  tableNumber?: string;
  paymentMethod: 'CASH';
  createdByStaffId: string;
  items: Array<{ menuItemId: string; name: string; quantity: number; price: number }>;
}
```

Add to the `export const { ... }` block:
```ts
useGetMenuItemsQuery,
usePlaceStaffOrderMutation,
```

- [ ] **Step 3: Create QuickOrderScreen.tsx**

Create `src/screens/cashier/QuickOrderScreen.tsx`:

```tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { colors } from '../../styles/driverDesignTokens';
import {
  useGetMenuItemsQuery,
  usePlaceStaffOrderMutation,
  type MenuItem,
} from '../../store/api/orderApi';

const ACCENT = colors.roles.kiosk;

interface CartEntry extends MenuItem { quantity: number; }

export const QuickOrderScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: menu = [], isLoading } = useGetMenuItemsQuery(user?.storeId ?? '', {
    skip: !user?.storeId,
  });
  const [placeStaffOrder, { isLoading: placing }] = usePlaceStaffOrderMutation();

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DINE_IN'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState('');

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) { Alert.alert('Required', 'Enter customer name'); return; }
    if (cart.length === 0) { Alert.alert('Required', 'Add at least one item'); return; }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      Alert.alert('Required', 'Enter table number for dine in');
      return;
    }

    try {
      const result = await placeStaffOrder({
        storeId: user!.storeId,
        customerName: customerName.trim(),
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
        paymentMethod: 'CASH',
        createdByStaffId: user!.id,
        items: cart.map(i => ({
          menuItemId: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      }).unwrap();

      Alert.alert(
        'Order Placed',
        `#${result.orderNumber} — ₹${cartTotal.toFixed(0)} cash`,
        [{ text: 'New Order', onPress: () => { setCart([]); setCustomerName(''); setTableNumber(''); } }],
      );
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Could not place order';
      Alert.alert('Error', msg);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Customer Name"
        placeholderTextColor={colors.text.tertiary}
        value={customerName}
        onChangeText={setCustomerName}
        autoCapitalize="words"
      />

      <View style={styles.typeRow}>
        {(['TAKEAWAY', 'DINE_IN'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, orderType === type && { borderColor: ACCENT }]}
            onPress={() => setOrderType(type)}
          >
            <Text style={[styles.typeBtnText, orderType === type && { color: ACCENT }]}>
              {type === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {orderType === 'DINE_IN' && (
        <TextInput
          style={styles.input}
          placeholder="Table Number"
          placeholderTextColor={colors.text.tertiary}
          value={tableNumber}
          onChangeText={setTableNumber}
          keyboardType="numeric"
        />
      )}

      <FlatList
        data={menu}
        numColumns={2}
        keyExtractor={item => item.id}
        style={styles.menuList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.menuCard} onPress={() => addToCart(item)}>
            <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.menuPrice, { color: ACCENT }]}>₹{item.price}</Text>
            {cart.find(c => c.id === item.id) && (
              <View style={[styles.badge, { backgroundColor: ACCENT }]}>
                <Text style={styles.badgeText}>
                  {cart.find(c => c.id === item.id)!.quantity}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartSummary}>{cartCount} items · ₹{cartTotal.toFixed(0)}</Text>
          <TouchableOpacity
            style={[styles.placeOrderBtn, placing && styles.disabled]}
            onPress={handlePlaceOrder}
            disabled={placing}
          >
            {placing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.placeOrderText}>Place Order (Cash)</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input: {
    backgroundColor: colors.surface.background,
    color: colors.text.primary,
    padding: 14, marginHorizontal: 8, marginTop: 8,
    borderRadius: 8, fontSize: 16,
    borderWidth: 1, borderColor: colors.surface.border,
  },
  typeRow: { flexDirection: 'row', margin: 8, gap: 8 },
  typeBtn: {
    flex: 1, padding: 12, borderRadius: 8,
    backgroundColor: colors.surface.background,
    alignItems: 'center', borderWidth: 2, borderColor: colors.surface.border,
  },
  typeBtnText: { color: colors.text.secondary, fontWeight: '600', fontSize: 14 },
  menuList: { flex: 1, marginHorizontal: 4 },
  menuCard: {
    flex: 1, backgroundColor: colors.surface.background,
    margin: 4, borderRadius: 10, padding: 12,
    alignItems: 'center', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  menuName: { color: colors.text.primary, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  menuPrice: { fontSize: 16, fontWeight: '700' },
  badge: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cartBar: {
    backgroundColor: colors.surface.background,
    padding: 16, borderTopWidth: 1, borderTopColor: colors.surface.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cartSummary: { color: colors.text.primary, flex: 1, fontSize: 15, fontWeight: '600' },
  placeOrderBtn: {
    backgroundColor: ACCENT, paddingVertical: 12,
    paddingHorizontal: 20, borderRadius: 8, minWidth: 160, alignItems: 'center',
  },
  placeOrderText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
});

export default QuickOrderScreen;
```

- [ ] **Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
git add src/navigation/CashierTabNavigator.tsx
git add src/screens/cashier/QuickOrderScreen.tsx
git add src/store/api/orderApi.ts
git commit -m "feat(crew-app): CashierTabNavigator, QuickOrderScreen — menu grid, cart badges, TAKEAWAY/DINE_IN, cash order"
```

---

## Task 7: Build ManagerTabNavigator + QuickDashboardScreen

**Context:** Manager role needs a quick dashboard with today's KPIs and recent orders. Uses `orderApi` + a new analytics endpoint.

**Files:**
- Create: `MaSoVaCrewApp/src/navigation/ManagerTabNavigator.tsx`
- Create: `MaSoVaCrewApp/src/screens/manager/QuickDashboardScreen.tsx`
- Modify: `MaSoVaCrewApp/src/store/api/orderApi.ts` (add getTodayAnalytics, getRecentOrders endpoints)

**Key facts:**
- Role color: `colors.roles.manager = '#7B1FA2'` (per CLAUDE.md: Manager=`#7B1FA2`)
- Analytics endpoint: `GET /analytics/sales?period=today&storeId={storeId}`
- Recent orders: `GET /orders?storeId={storeId}&limit=5`

- [ ] **Step 1: Create ManagerTabNavigator.tsx**

Create `src/navigation/ManagerTabNavigator.tsx`:

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, components } from '../styles/driverDesignTokens';
import { QuickDashboardScreen } from '../screens/manager/QuickDashboardScreen';
import MyShiftsScreen from '../screens/shared/MyShiftsScreen';
import MyProfileScreen from '../screens/shared/MyProfileScreen';

const Tab = createBottomTabNavigator();
const ACCENT = colors.roles.manager; // '#7B1FA2'

export const ManagerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: ACCENT,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: {
        height: components.bottomNav.height,
        backgroundColor: colors.surface.background,
        borderTopColor: colors.surface.border,
        borderTopWidth: 1,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerStyle: {
        backgroundColor: colors.surface.background,
        elevation: 0, shadowOpacity: 0,
        borderBottomWidth: 3, borderBottomColor: ACCENT,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: { fontWeight: '700', fontSize: 18 },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={QuickDashboardScreen}
      options={{
        title: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Icon name="dashboard" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="ManagerShifts"
      component={MyShiftsScreen}
      options={{
        title: 'Staff Shifts',
        tabBarIcon: ({ color, size }) => <Icon name="people" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="ManagerProfile"
      component={MyProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default ManagerTabNavigator;
```

- [ ] **Step 2: Add analytics + recent orders endpoints to orderApi.ts**

Inside the `endpoints` block in `src/store/api/orderApi.ts`, add:

```ts
getTodayAnalytics: builder.query<TodayAnalytics, string>({
  query: (storeId) => `/analytics/sales?period=today&storeId=${storeId}`,
}),

getRecentOrders: builder.query<RecentOrder[], string>({
  query: (storeId) => `/orders?storeId=${storeId}&limit=5`,
  transformResponse: (res: { content: RecentOrder[] } | RecentOrder[]) =>
    Array.isArray(res) ? res : res.content,
  providesTags: ['Orders'],
}),
```

Add these types at the top of `orderApi.ts`:

```ts
export interface TodayAnalytics {
  todayRevenue: number;
  activeOrders: number;
  avgPrepTime: number;
  activeStaff: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  customerName: string;
  status: string;
  total: number;
}
```

Add to the `export const { ... }` block:
```ts
useGetTodayAnalyticsQuery,
useGetRecentOrdersQuery,
```

- [ ] **Step 3: Create QuickDashboardScreen.tsx**

Create `src/screens/manager/QuickDashboardScreen.tsx`:

```tsx
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { colors } from '../../styles/driverDesignTokens';
import {
  useGetTodayAnalyticsQuery,
  useGetRecentOrdersQuery,
  type TodayAnalytics,
  type RecentOrder,
} from '../../store/api/orderApi';

const ACCENT = colors.roles.manager;

const KPICard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={[styles.kpiValue, { color: ACCENT }]}>{value}</Text>
  </View>
);

const OrderRow = ({ order }: { order: RecentOrder }) => (
  <View style={styles.orderRow}>
    <View style={styles.orderLeft}>
      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
      <Text style={styles.orderMeta}>{order.orderType} · {order.customerName}</Text>
    </View>
    <View style={styles.orderRight}>
      <Text style={styles.orderTotal}>₹{order.total}</Text>
      <Text style={[styles.orderStatus, { color: ACCENT }]}>{order.status}</Text>
    </View>
  </View>
);

export const QuickDashboardScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const storeId = user?.storeId ?? '';

  const {
    data: analytics,
    isLoading: loadingAnalytics,
    refetch: refetchAnalytics,
  } = useGetTodayAnalyticsQuery(storeId, { skip: !storeId, pollingInterval: 60000 });

  const {
    data: recentOrders = [],
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useGetRecentOrdersQuery(storeId, { skip: !storeId, pollingInterval: 30000 });

  const isLoading = loadingAnalytics || loadingOrders;
  const onRefresh = () => { refetchAnalytics(); refetchOrders(); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={ACCENT} />
      }
    >
      <Text style={styles.title}>Today's Overview</Text>

      {isLoading && !analytics ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.kpiGrid}>
          <KPICard label="Revenue" value={analytics ? `₹${analytics.todayRevenue}` : '--'} />
          <KPICard label="Active Orders" value={analytics ? String(analytics.activeOrders) : '--'} />
          <KPICard label="Avg Prep" value={analytics ? `${analytics.avgPrepTime}m` : '--'} />
          <KPICard label="Staff On Duty" value={analytics ? String(analytics.activeStaff) : '--'} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {recentOrders.length === 0 && !loadingOrders ? (
        <Text style={styles.emptyText}>No orders yet today</Text>
      ) : (
        recentOrders.map(order => <OrderRow key={order.id} order={order} />)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  title: { color: colors.text.primary, fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  kpiCard: {
    width: '46%', backgroundColor: colors.surface.background,
    margin: '2%', borderRadius: 10, padding: 16,
    borderTopWidth: 3, borderTopColor: ACCENT,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  kpiLabel: { color: colors.text.secondary, fontSize: 12, marginBottom: 6 },
  kpiValue: { fontSize: 24, fontWeight: '700' },
  sectionTitle: {
    color: colors.text.tertiary, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 1,
    padding: 16, paddingBottom: 8,
  },
  emptyText: { color: colors.text.tertiary, textAlign: 'center', padding: 24 },
  orderRow: {
    backgroundColor: colors.surface.background,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 8, marginBottom: 4, padding: 14, borderRadius: 10,
  },
  orderLeft: { flex: 1 },
  orderNumber: { color: colors.text.primary, fontWeight: '600', fontSize: 15 },
  orderMeta: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { color: colors.text.primary, fontWeight: '700', fontSize: 16 },
  orderStatus: { fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
});

export default QuickDashboardScreen;
```

- [ ] **Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
git add src/navigation/ManagerTabNavigator.tsx
git add src/screens/manager/QuickDashboardScreen.tsx
git add src/store/api/orderApi.ts
git commit -m "feat(crew-app): ManagerTabNavigator, QuickDashboardScreen — KPI grid, recent orders, RTK Query polling"
```

---

## Task 8: Wire new navigators into AppNavigator RoleRouter

**Context:** AppNavigator.tsx has a `RoleRouter` that routes KITCHEN_STAFF/CASHIER/MANAGER to `StaffTabNavigator`. We need to route each to their specific navigator.

**Files:**
- Modify: `MaSoVaCrewApp/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Read the current AppNavigator**

```bash
cat /Users/souravamseekarmarti/Projects/MaSoVaCrewApp/src/navigation/AppNavigator.tsx
```

- [ ] **Step 2: Update AppNavigator.tsx**

Replace the file content with:

```tsx
// src/navigation/AppNavigator.tsx
// Role-based navigation root — routes to correct navigator based on user type
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';

// Role navigators
import DriverTabNavigator from './DriverTabNavigator';
import KitchenTabNavigator from './KitchenTabNavigator';
import CashierTabNavigator from './CashierTabNavigator';
import ManagerTabNavigator from './ManagerTabNavigator';
import StaffTabNavigator from './StaffTabNavigator';

const RoleRouter = () => {
  const user = useSelector(selectCurrentUser);
  const type = user?.type?.toUpperCase() ?? '';

  if (type === 'DRIVER') return <DriverTabNavigator />;
  if (type === 'KITCHEN_STAFF' || type === 'STAFF') return <KitchenTabNavigator />;
  if (type === 'CASHIER' || type === 'KIOSK') return <CashierTabNavigator />;
  if (type === 'MANAGER' || type === 'ASSISTANT_MANAGER') return <ManagerTabNavigator />;

  // Fallback for any other authenticated role — shows personal screens
  if (type) return <StaffTabNavigator />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 }}>
        Access Denied
      </Text>
      <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
        Role not supported. Please contact your manager.
      </Text>
    </View>
  );
};

export const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <NavigationContainer>
      {!isAuthenticated ? <LoginScreen /> : <RoleRouter />}
    </NavigationContainer>
  );
};

export default AppNavigator;
```

- [ ] **Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
git add src/navigation/AppNavigator.tsx
git commit -m "feat(crew-app): wire KitchenTabNavigator, CashierTabNavigator, ManagerTabNavigator into RoleRouter"
```

- [ ] **Step 4: Push all Crew App commits**

```bash
git push origin main
```

---

## Task 9: Multi-Stage Dockerfiles for all Java services

**Context:** Current Dockerfiles are single-stage (build + runtime in one image). Need multi-stage: Maven builder + JRE runtime only. This shrinks image size from ~700MB to ~200MB and adds non-root user + health checks. Do this on the main repo.

**Files (all in main repo):**
- Modify: `core-service/Dockerfile`
- Modify: `commerce-service/Dockerfile`
- Modify: `logistics-service/Dockerfile`
- Modify: `payment-service/Dockerfile`
- Modify: `intelligence-service/Dockerfile`
- Modify: `api-gateway/Dockerfile`
- Create: `.dockerignore` (root)
- Create: `core-service/.dockerignore` (repeat for each service)

**Service → port mapping:**
- core-service → 8085
- commerce-service → 8084
- logistics-service → 8086
- payment-service → 8089
- intelligence-service → 8087
- api-gateway → 8080

- [ ] **Step 1: Write core-service/Dockerfile**

```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy parent pom + shared modules (layer caching for deps)
COPY pom.xml .
COPY shared-models/pom.xml shared-models/pom.xml
COPY shared-security/pom.xml shared-security/pom.xml
COPY core-service/pom.xml core-service/pom.xml
RUN mvn dependency:go-offline -pl core-service -am -q 2>/dev/null || true

# Copy source and build
COPY shared-models/src shared-models/src
COPY shared-security/src shared-security/src
COPY core-service/src core-service/src
RUN mvn package -pl core-service -am -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
RUN groupadd -r masova && useradd -r -g masova -u 1001 masova
USER masova
COPY --from=builder --chown=masova:masova /build/core-service/target/core-service-*.jar app.jar
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8085/actuator/health || exit 1
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "-Xmx512m", "-XX:+UseContainerSupport", "-Dspring.profiles.active=prod", "app.jar"]
```

- [ ] **Step 2: Write commerce-service/Dockerfile** (port 8084)

Same template as above, replacing `core-service` with `commerce-service` and port `8085` with `8084`.

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
COPY shared-models/pom.xml shared-models/pom.xml
COPY shared-security/pom.xml shared-security/pom.xml
COPY commerce-service/pom.xml commerce-service/pom.xml
RUN mvn dependency:go-offline -pl commerce-service -am -q 2>/dev/null || true
COPY shared-models/src shared-models/src
COPY shared-security/src shared-security/src
COPY commerce-service/src commerce-service/src
RUN mvn package -pl commerce-service -am -DskipTests -q

FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
RUN groupadd -r masova && useradd -r -g masova -u 1001 masova
USER masova
COPY --from=builder --chown=masova:masova /build/commerce-service/target/commerce-service-*.jar app.jar
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8084/actuator/health || exit 1
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "-Xmx512m", "-XX:+UseContainerSupport", "-Dspring.profiles.active=prod", "app.jar"]
```

- [ ] **Step 3: Write logistics-service/Dockerfile** (port 8086)

Same template, `logistics-service`, port `8086`.

- [ ] **Step 4: Write payment-service/Dockerfile** (port 8089)

Same template, `payment-service`, port `8089`.

- [ ] **Step 5: Write intelligence-service/Dockerfile** (port 8087)

Same template, `intelligence-service`, port `8087`.

- [ ] **Step 6: Write api-gateway/Dockerfile** (port 8080)

Same template, `api-gateway`, port `8080`. Note: api-gateway does not depend on shared-models/shared-security in the same way — adjust the COPY lines to only include what it needs:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
COPY api-gateway/pom.xml api-gateway/pom.xml
RUN mvn dependency:go-offline -pl api-gateway -am -q 2>/dev/null || true
COPY api-gateway/src api-gateway/src
RUN mvn package -pl api-gateway -am -DskipTests -q

FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
RUN groupadd -r masova && useradd -r -g masova -u 1001 masova
USER masova
COPY --from=builder --chown=masova:masova /build/api-gateway/target/api-gateway-*.jar app.jar
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Xmx512m", "-XX:+UseContainerSupport", "-Dspring.profiles.active=prod", "app.jar"]
```

- [ ] **Step 7: Create root .dockerignore**

Create `.dockerignore` at project root:

```
.git/
node_modules/
*/target/
docs/
backups/
archive/
*.bak
frontend/node_modules/
frontend/dist/
.worktrees/
*.md
.idea/
*.iml
```

- [ ] **Step 8: Create per-service .dockerignore**

Create `core-service/.dockerignore` (and repeat for commerce, logistics, payment, intelligence, api-gateway):

```
target/
*.md
.git/
src/test/
*.bak
*.iml
.idea/
```

- [ ] **Step 9: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git add core-service/Dockerfile commerce-service/Dockerfile logistics-service/Dockerfile
git add payment-service/Dockerfile intelligence-service/Dockerfile api-gateway/Dockerfile
git add core-service/.dockerignore commerce-service/.dockerignore logistics-service/.dockerignore
git add payment-service/.dockerignore intelligence-service/.dockerignore api-gateway/.dockerignore
git add .dockerignore
git commit -m "feat(docker): multi-stage builds — JRE runtime, non-root user, health checks for all 6 Java services"
```

---

## Task 10: masova-support Dockerfile

**Files:**
- Create/rewrite: `masova-support/Dockerfile`
- Create: `masova-support/.dockerignore`

- [ ] **Step 1: Check if Dockerfile already exists**

```bash
ls /Users/souravamseekarmarti/Projects/masova-support/Dockerfile 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
```

- [ ] **Step 2: Write masova-support/Dockerfile**

```dockerfile
FROM python:3.11-slim AS runtime
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd -m -u 1001 masova && chown -R masova:masova /app
USER masova

COPY --chown=masova:masova src/ src/

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

EXPOSE 8000
CMD ["uvicorn", "src.masova_agent.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

- [ ] **Step 3: Create masova-support/.dockerignore**

```
__pycache__/
*.pyc
*.pyo
.venv/
venv/
.env*
tests/
*.md
.git/
docs/
```

- [ ] **Step 4: Commit on feature/phase6-ai-agents branch**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
git add Dockerfile .dockerignore
git commit -m "feat(docker): masova-support Dockerfile — slim Python 3.11, non-root user, health check"
git push origin feature/phase6-ai-agents
```

---

## Task 11: GCP Setup + Deploy

**Context:** All services have working Dockerfiles. GitHub Actions deploy.yml already exists but has never run against real GCP infra. This task provisions the real infra and wires the secrets.

**Prerequisites (manual — you need to do these in browser/terminal before this task):**
1. Create a GCP project named `masova-app` at console.cloud.google.com
2. Enable billing on the project
3. Create a MongoDB Atlas M0 cluster (free, Mumbai region) at cloud.mongodb.com
4. Create Upstash Redis (free tier) at upstash.com
5. Create CloudAMQP Little Lemur (free) at cloudamqp.com

- [ ] **Step 1: Authenticate gcloud CLI**

```bash
gcloud auth login
gcloud config set project masova-app
```

- [ ] **Step 2: Enable required GCP APIs**

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

Expected: "Operation finished successfully" for each.

- [ ] **Step 3: Create Artifact Registry repository**

```bash
gcloud artifacts repositories create masova-images \
  --repository-format=docker \
  --location=asia-south1 \
  --description="MaSoVa container images"
```

- [ ] **Step 4: Create GCP service account for GitHub Actions**

```bash
gcloud iam service-accounts create masova-github-actions \
  --display-name="MaSoVa GitHub Actions Deploy"

# Grant Cloud Run deploy permission only
gcloud projects add-iam-policy-binding masova-app \
  --member="serviceAccount:masova-github-actions@masova-app.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding masova-app \
  --member="serviceAccount:masova-github-actions@masova-app.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding masova-app \
  --member="serviceAccount:masova-github-actions@masova-app.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Export key
gcloud iam service-accounts keys create /tmp/masova-sa-key.json \
  --iam-account=masova-github-actions@masova-app.iam.gserviceaccount.com
```

- [ ] **Step 5: Store secrets in GCP Secret Manager**

Run this script once you have your external service credentials (MongoDB Atlas URI, Upstash Redis URL, CloudAMQP URL, Google API key for masova-support):

```bash
# Replace values with your actual credentials
gcloud secrets create MONGODB_URI --data-file=- <<< "mongodb+srv://user:pass@cluster.mongodb.net/masova"
gcloud secrets create REDIS_URL --data-file=- <<< "rediss://user:pass@hostname:port"
gcloud secrets create RABBITMQ_URL --data-file=- <<< "amqps://user:pass@hostname/vhost"
gcloud secrets create GOOGLE_API_KEY --data-file=- <<< "your-google-api-key"
gcloud secrets create JWT_SECRET --data-file=- <<< "your-jwt-secret-min-32-chars"

# Grant service account access to secrets
gcloud secrets add-iam-policy-binding MONGODB_URI \
  --member="serviceAccount:masova-github-actions@masova-app.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
# Repeat for each secret
```

- [ ] **Step 6: Add secrets to GitHub repository**

```bash
# Add the service account key
gh secret set GCP_SA_KEY < /tmp/masova-sa-key.json

# Add other secrets
gh secret set GCP_PROJECT_ID --body "masova-app"
gh secret set GCP_REGION --body "asia-south1"
```

- [ ] **Step 7: Setup Firebase Hosting (use Firebase MCP tools)**

The `frontend/firebase.json` and `.firebaserc` already exist. Use Firebase MCP tools to connect them to a real project:

```
mcp__plugin_firebase_firebase__firebase_list_projects  → check if masova-app exists
mcp__plugin_firebase_firebase__firebase_get_project    → get project details
mcp__plugin_firebase_firebase__firebase_get_sdk_config → get config for frontend
```

Then create `frontend/.env.production`:
```
VITE_API_BASE_URL=https://api-gateway-<hash>-el.a.run.app
VITE_FIREBASE_API_KEY=<from sdk config>
VITE_FIREBASE_PROJECT_ID=masova-app
```

- [ ] **Step 8: Push main to trigger CI/CD**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git push origin main
```

Then watch GitHub Actions:

```bash
gh run list --limit 5
gh run watch  # watch the latest run
```

Expected: CI workflow passes (build + test), then CD workflow deploys to Cloud Run.

- [ ] **Step 9: Verify services are running**

```bash
gcloud run services list --region=asia-south1
```

Expected: 7 services (api-gateway, core-service, commerce-service, logistics-service, payment-service, intelligence-service, masova-support) all with status `READY`.

- [ ] **Step 10: Get the API gateway URL and smoke test**

```bash
GATEWAY_URL=$(gcloud run services describe api-gateway --region=asia-south1 --format='value(status.url)')
echo $GATEWAY_URL
curl $GATEWAY_URL/actuator/health
```

Expected: `{"status":"UP"}`

- [ ] **Step 11: Update frontend .env.production with real URL and redeploy**

```bash
cd frontend
echo "VITE_API_BASE_URL=$GATEWAY_URL" > .env.production
npm run build
npx firebase deploy --only hosting
```

Expected: Firebase CLI output with live URL like `https://masova-app.web.app`.

- [ ] **Step 12: Commit the .env.production reference (not the file itself)**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
echo "frontend/.env.production" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore frontend/.env.production (contains prod API URL)"
git push origin main
```

---

## Execution Order Summary

```
Task 1  → Merge PR #7 (5 min)
Task 2  → Merge feat/postgres-migration (10 min)
Task 3  → Merge feature/phase4-frontend-revamp (10 min)
Task 4  → Commit masova-support agents (10 min)
Task 5  → KitchenTabNavigator + KitchenQueueScreen (30 min)
Task 6  → CashierTabNavigator + QuickOrderScreen (30 min)
Task 7  → ManagerTabNavigator + QuickDashboardScreen (30 min)
Task 8  → Wire navigators into AppNavigator (10 min)
Task 9  → Multi-stage Dockerfiles (20 min)
Task 10 → masova-support Dockerfile (10 min)
Task 11 → GCP Deploy (60 min — requires GCP account setup)
```

Tasks 1–4 are git operations (no new code).
Tasks 5–8 are in MaSoVaCrewApp (Mac, no Dell needed).
Tasks 9–10 are Dockerfile edits (can be done on Mac).
Task 11 requires GCP account + external services setup (MongoDB Atlas, Upstash, CloudAMQP).
