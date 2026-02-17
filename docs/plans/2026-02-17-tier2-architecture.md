# Tier 2 — Architecture & Structural Decisions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the React Native driver app into a multi-role staff app, enhance the StoreSelector with geolocation, and complete the RabbitMQ interview assignment with documented patterns.

**Architecture:** Three independent work streams: (1) MaSoVaDriverApp role-based navigation with 4 new screens; (2) StoreSelector in-place enhancement with browser Geolocation API; (3) RabbitMQ interview assignment in a `docker/` directory + pattern documentation.

**Tech Stack:** React Native 0.83.1, React Navigation v6, Redux Toolkit, React (browser Geolocation API), Docker Compose, RabbitMQ 3.10, Python Pika.

**Depends on:** Tier 1 complete (seed data used to verify role logins, driver app audit read before starting).

---

## Critical Context

- `MaSoVaDriverApp/src/screens/LoginScreen.tsx` line 159: currently blocks login if `data.user.type !== 'DRIVER'` — this check must be removed/replaced with role routing.
- `MaSoVaDriverApp/src/types/user.ts` line 3: User.type is `'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER' | 'KIOSK'` — CASHIER is not in this union yet. Add it.
- `MaSoVaDriverApp/src/navigation/AppNavigator.tsx` — currently: unauthenticated → LoginScreen, authenticated → driver bottom tab. Replace with RoleRouter.
- `frontend/src/components/StoreSelector.tsx` — 160+ lines of neumorphic dropdown. No geolocation. Extend in-place.
- Root project is Maven. `docker/` directory for RabbitMQ interview assignment is a sibling to `docker-compose.yml` at the monorepo root.

---

## Task 1: Remove Driver-Only Gate from LoginScreen (MaSoVaDriverApp)

**Files:**
- Modify: `MaSoVaDriverApp/src/screens/LoginScreen.tsx` (around line 159)
- Modify: `MaSoVaDriverApp/src/types/user.ts` (line 3)

**Step 1: Add CASHIER to User type union**

In `MaSoVaDriverApp/src/types/user.ts`, find:
```typescript
type: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER' | 'KIOSK';
```

Replace with:
```typescript
type: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER' | 'CASHIER' | 'KIOSK';
```

Do the same for the `userType` field on the same interface if it also lists the union.

**Step 2: Remove the DRIVER-only check in LoginScreen**

Find in `LoginScreen.tsx` around line 155–165:
```typescript
if (data.user.type !== 'DRIVER') {
  // some error or block
}
```

Replace with a comment explaining routing is now handled by AppNavigator:
```typescript
// Role-based routing is handled by AppNavigator's RoleRouter.
// All staff types (DRIVER, STAFF, MANAGER, CASHIER, ASSISTANT_MANAGER) are accepted.
const allowedTypes = ['DRIVER', 'STAFF', 'MANAGER', 'ASSISTANT_MANAGER', 'CASHIER'];
if (!allowedTypes.includes(data.user.type)) {
  Alert.alert('Access Denied', 'This app is for MaSoVa staff only.');
  return;
}
```

**Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
git add src/screens/LoginScreen.tsx src/types/user.ts
git commit -m "feat: allow all staff roles in login, add CASHIER user type"
```

---

## Task 2: Add Role-Based Navigation to MaSoVaDriverApp

**Files:**
- Modify: `MaSoVaDriverApp/src/navigation/AppNavigator.tsx`
- Create: `MaSoVaDriverApp/src/navigation/KitchenNavigator.tsx`
- Create: `MaSoVaDriverApp/src/navigation/CashierNavigator.tsx`
- Create: `MaSoVaDriverApp/src/navigation/ManagerNavigator.tsx`

**Step 1: Create KitchenNavigator**

```typescript
// MaSoVaDriverApp/src/navigation/KitchenNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../styles/driverDesignTokens';

// Screens (created in Task 3)
import KitchenQueueScreen from '../screens/kitchen/KitchenQueueScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen'; // reuse for profile

const Tab = createBottomTabNavigator();

const KITCHEN_COLOR = '#FF6B35';

export const KitchenNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: KITCHEN_COLOR,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: { backgroundColor: colors.surface.background, borderTopColor: colors.surface.border, borderTopWidth: 1 },
      headerStyle: { backgroundColor: colors.surface.background, elevation: 0, shadowOpacity: 0 },
      headerTintColor: colors.text.primary,
    }}
  >
    <Tab.Screen
      name="Queue"
      component={KitchenQueueScreen}
      options={{ title: 'Order Queue', tabBarLabel: 'Queue', tabBarIcon: ({ color, size }) => <Icon name="restaurant" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="KitchenProfile"
      component={DriverProfileScreen}
      options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} /> }}
    />
  </Tab.Navigator>
);

export default KitchenNavigator;
```

**Step 2: Create CashierNavigator**

```typescript
// MaSoVaDriverApp/src/navigation/CashierNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../styles/driverDesignTokens';
import QuickOrderScreen from '../screens/pos/QuickOrderScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';

const Tab = createBottomTabNavigator();
const CASHIER_COLOR = '#2196F3';

export const CashierNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: CASHIER_COLOR,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: { backgroundColor: colors.surface.background, borderTopColor: colors.surface.border, borderTopWidth: 1 },
      headerStyle: { backgroundColor: colors.surface.background, elevation: 0, shadowOpacity: 0 },
      headerTintColor: colors.text.primary,
    }}
  >
    <Tab.Screen
      name="Order"
      component={QuickOrderScreen}
      options={{ title: 'New Order', tabBarLabel: 'Order', tabBarIcon: ({ color, size }) => <Icon name="point-of-sale" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="CashierProfile"
      component={DriverProfileScreen}
      options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} /> }}
    />
  </Tab.Navigator>
);

export default CashierNavigator;
```

**Step 3: Create ManagerNavigator**

```typescript
// MaSoVaDriverApp/src/navigation/ManagerNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../styles/driverDesignTokens';
import QuickDashboardScreen from '../screens/manager/QuickDashboardScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';

const Tab = createBottomTabNavigator();
const MANAGER_COLOR = '#7B1FA2';

export const ManagerNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: MANAGER_COLOR,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: { backgroundColor: colors.surface.background, borderTopColor: colors.surface.border, borderTopWidth: 1 },
      headerStyle: { backgroundColor: colors.surface.background, elevation: 0, shadowOpacity: 0 },
      headerTintColor: colors.text.primary,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={QuickDashboardScreen}
      options={{ title: 'Dashboard', tabBarLabel: 'Dashboard', tabBarIcon: ({ color, size }) => <Icon name="dashboard" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="ManagerProfile"
      component={DriverProfileScreen}
      options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} /> }}
    />
  </Tab.Navigator>
);

export default ManagerNavigator;
```

**Step 4: Update AppNavigator to use RoleRouter**

Replace the entire authenticated section of `AppNavigator.tsx` with a RoleRouter:

```typescript
// MaSoVaDriverApp/src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';

// Role navigators
import DriverTabNavigator from './DriverTabNavigator'; // rename existing Tab.Navigator block to this
import KitchenNavigator from './KitchenNavigator';
import CashierNavigator from './CashierNavigator';
import ManagerNavigator from './ManagerNavigator';

const RoleRouter = () => {
  const user = useSelector(selectCurrentUser);
  const type = user?.type?.toUpperCase() ?? '';

  if (type === 'DRIVER') return <DriverTabNavigator />;
  if (type === 'STAFF') return <KitchenNavigator />;
  if (type === 'CASHIER') return <CashierNavigator />;
  if (type === 'MANAGER' || type === 'ASSISTANT_MANAGER') return <ManagerNavigator />;

  // Fallback: show kitchen queue for unknown staff types
  return <KitchenNavigator />;
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

**Step 5: Extract existing tab navigator into DriverTabNavigator**

Create `MaSoVaDriverApp/src/navigation/DriverTabNavigator.tsx` by copying the existing `Tab.Navigator` block from `AppNavigator.tsx` (the 4-tab Home/Active/History/Profile navigator).

**Step 6: Commit**

```bash
git add src/navigation/
git commit -m "feat: add role-based navigation (Kitchen, Cashier, Manager navigators)"
```

---

## Task 3: New Screens for Kitchen, POS, and Manager (MaSoVaDriverApp)

**Files:**
- Create: `MaSoVaDriverApp/src/screens/kitchen/KitchenQueueScreen.tsx`
- Create: `MaSoVaDriverApp/src/screens/kitchen/OrderDetailScreen.tsx`
- Create: `MaSoVaDriverApp/src/screens/pos/QuickOrderScreen.tsx`
- Create: `MaSoVaDriverApp/src/screens/manager/QuickDashboardScreen.tsx`

**Step 1: Create KitchenQueueScreen**

This is a mobile KDS — shows active orders in a scrollable list grouped by status.

```typescript
// MaSoVaDriverApp/src/screens/kitchen/KitchenQueueScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { colors, typography, spacing } from '../../styles/driverDesignTokens';

const STATUS_ORDER = ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'DISPATCHED'];
const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'New', PREPARING: 'Preparing', OVEN: 'In Oven', BAKED: 'Ready', DISPATCHED: 'Dispatched'
};
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#3b82f6', PREPARING: '#f59e0b', OVEN: '#ef4444', BAKED: '#10b981', DISPATCHED: '#6b7280'
};

interface OrderItem { name: string; quantity: number; }
interface Order { id: string; orderNumber: string; status: string; items: OrderItem[]; orderType: string; createdAt: string; }

const KitchenQueueScreen = () => {
  const user = useSelector(selectCurrentUser);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const storeId = user?.storeId ?? '';
  const API_BASE = 'http://10.0.2.2:8080'; // Android emulator → localhost

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/kitchen/queue?storeId=${storeId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.content ?? []);
      }
    } catch (e) {
      console.warn('KDS fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [storeId]);

  const bumpOrder = async (orderId: string, currentStatus: string) => {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    if (idx < 0 || idx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[idx + 1];
    try {
      await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    } catch (e) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[item.status] ?? '#ccc' }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={[styles.statusBadge, { color: STATUS_COLORS[item.status] ?? '#666' }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
        <Text style={styles.orderType}>{item.orderType}</Text>
        {item.items.map((it, i) => (
          <Text key={i} style={styles.itemText}>• {it.quantity}× {it.name}</Text>
        ))}
        <TouchableOpacity
          style={[styles.bumpButton, { backgroundColor: STATUS_COLORS[STATUS_ORDER[STATUS_ORDER.indexOf(item.status) + 1]] ?? '#ccc' }]}
          onPress={() => bumpOrder(item.id, item.status)}
          activeOpacity={0.8}
        >
          <Text style={styles.bumpText}>→ {STATUS_LABELS[STATUS_ORDER[STATUS_ORDER.indexOf(item.status) + 1]] ?? 'Done'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary.green} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kitchen Queue ({orders.length} active)</Text>
      <FlatList
        data={orders.filter(o => !['DELIVERED', 'CANCELLED', 'SERVED'].includes(o.status))}
        keyExtractor={o => o.id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: spacing.md }}
        refreshing={loading}
        onRefresh={fetchOrders}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  header: { fontSize: 18, fontWeight: '700', padding: 16, color: colors.text.primary, backgroundColor: colors.surface.background, borderBottomWidth: 1, borderBottomColor: colors.surface.border },
  card: { flexDirection: 'row', backgroundColor: colors.surface.background, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, overflow: 'hidden' },
  statusBar: { width: 6 },
  cardContent: { flex: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  statusBadge: { fontSize: 13, fontWeight: '600' },
  orderType: { fontSize: 12, color: colors.text.secondary, marginBottom: 6 },
  itemText: { fontSize: 14, color: colors.text.primary, marginBottom: 2 },
  bumpButton: { marginTop: 10, padding: 10, borderRadius: 8, alignItems: 'center' },
  bumpText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default KitchenQueueScreen;
```

**Step 2: Create QuickDashboardScreen (Manager)**

```typescript
// MaSoVaDriverApp/src/screens/manager/QuickDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { colors, spacing } from '../../styles/driverDesignTokens';

interface KPI { label: string; value: string; sub?: string; color?: string; }

const QuickDashboardScreen = () => {
  const user = useSelector(selectCurrentUser);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const storeId = user?.storeId ?? '';
  const API_BASE = 'http://10.0.2.2:8080';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/summary?storeId=${storeId}`);
        if (res.ok) {
          const d = await res.json();
          setKpis([
            { label: "Today's Orders", value: String(d.todayOrders ?? '—'), color: '#3b82f6' },
            { label: "Today's Revenue", value: d.todayRevenue ? `₹${d.todayRevenue}` : '—', color: '#10b981' },
            { label: 'Active Orders', value: String(d.activeOrders ?? '—'), color: '#f59e0b' },
            { label: 'Avg Prep Time', value: d.avgPrepTime ? `${d.avgPrepTime}m` : '—', color: '#6b7280' },
          ]);
        }
      } catch {
        // Show placeholder KPIs if API unreachable
        setKpis([
          { label: "Today's Orders", value: '—' },
          { label: "Today's Revenue", value: '—' },
          { label: 'Active Orders', value: '—' },
          { label: 'Avg Prep Time', value: '—' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7B1FA2" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Today's Overview</Text>
      <Text style={styles.storeName}>{user?.name ?? ''} — {storeId}</Text>
      <View style={styles.grid}>
        {kpis.map((k, i) => (
          <View key={i} style={[styles.kpiCard, { borderTopColor: k.color ?? '#7B1FA2' }]}>
            <Text style={[styles.kpiValue, { color: k.color ?? '#7B1FA2' }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  title: { fontSize: 22, fontWeight: '700', margin: 20, color: colors.text.primary },
  storeName: { fontSize: 14, color: colors.text.secondary, marginHorizontal: 20, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  kpiCard: { width: '46%', margin: '2%', backgroundColor: colors.surface.background, borderRadius: 12, padding: 16, borderTopWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  kpiValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  kpiLabel: { fontSize: 13, color: colors.text.secondary },
});

export default QuickDashboardScreen;
```

**Step 3: Create QuickOrderScreen (POS stub)**

```typescript
// MaSoVaDriverApp/src/screens/pos/QuickOrderScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/driverDesignTokens';

// Phase 1 stub: Full POS implementation in Tier 3 (Point 5)
const QuickOrderScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>POS — Coming Soon</Text>
    <Text style={styles.sub}>Quick order screen will be implemented in Tier 3.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface.backgroundAlt },
  text: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', paddingHorizontal: 32 },
});

export default QuickOrderScreen;
```

**Step 4: Create directory structure**

```bash
mkdir -p /Users/souravamseekarmarti/Projects/MaSoVaDriverApp/src/screens/kitchen
mkdir -p /Users/souravamseekarmarti/Projects/MaSoVaDriverApp/src/screens/pos
mkdir -p /Users/souravamseekarmarti/Projects/MaSoVaDriverApp/src/screens/manager
```

**Step 5: Add role accent colors to driverDesignTokens**

In `MaSoVaDriverApp/src/styles/driverDesignTokens.ts`, find the `colors` export and add a `roles` sub-object:

```typescript
roles: {
  driver: '#00B14F',
  kitchen: '#FF6B35',
  cashier: '#2196F3',
  manager: '#7B1FA2',
},
```

**Step 6: Verify app builds**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
npx react-native start --reset-cache &
# In another terminal:
npx react-native run-android
```

Expected: app launches, login screen appears. Login with a STAFF-type account → KitchenQueueScreen. Login with DRIVER → existing home screen.

**Step 7: Commit**

```bash
git add src/screens/kitchen/ src/screens/pos/ src/screens/manager/ src/styles/driverDesignTokens.ts
git commit -m "feat: add kitchen queue, manager dashboard, POS stub screens for multi-role app"
```

---

## Task 4: Enhance StoreSelector with Geolocation

**Files:**
- Modify: `frontend/src/components/StoreSelector.tsx`

**Step 1: Read the full StoreSelector file before editing**

Read `frontend/src/components/StoreSelector.tsx` to understand the exact JSX structure and styles before making changes.

**Step 2: Add Haversine distance helper at top of file**

Add after the imports:

```typescript
// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Checks if a store is currently open based on operatingHours
function isStoreOpen(store: any): boolean {
  if (!store.operatingHours) return true; // assume open if no hours data
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const hours = store.operatingHours[today];
  if (!hours?.isOpen && hours?.isOpen !== undefined) return false;
  if (!hours?.open && !hours?.startTime) return true; // no hours = assume open
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openStr = hours.open ?? hours.startTime ?? '00:00';
  const closeStr = hours.close ?? hours.endTime ?? '23:59';
  const [oh, om] = openStr.split(':').map(Number);
  const [ch, cm] = closeStr.split(':').map(Number);
  return currentMins >= oh * 60 + om && currentMins <= ch * 60 + cm;
}
```

**Step 3: Add geolocation state inside the component**

In the `StoreSelectorProps` component function, add new state after existing state:

```typescript
const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
const [locationLoading, setLocationLoading] = useState(false);
```

**Step 4: Add geolocation effect — auto-detect and auto-select nearest store**

Add a new `useEffect` after the existing ones (after the `handleStoreSelect` function definition):

```typescript
useEffect(() => {
  if (!navigator.geolocation) return;
  setLocationLoading(true);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lon: longitude });
      setLocationLoading(false);

      // Auto-select nearest OPEN store only if nothing is currently selected
      if (!selectedStoreId && stores.length > 0) {
        const withDistance = stores
          .filter((s: any) => s.address?.latitude && s.address?.longitude)
          .map((s: any) => ({
            store: s,
            dist: haversineKm(latitude, longitude, s.address.latitude, s.address.longitude),
            open: isStoreOpen(s),
          }))
          .filter(x => x.open)
          .sort((a, b) => a.dist - b.dist);

        if (withDistance.length > 0) {
          const nearest = withDistance[0].store;
          handleStoreSelect(nearest.storeId ?? nearest.id, nearest.name);
        }
      }
    },
    () => setLocationLoading(false), // silently fail if user denies location
    { timeout: 5000, maximumAge: 60000 }
  );
}, [stores.length]); // run once when stores load
```

**Step 5: Enhance the store list dropdown to show distance + open/closed badge**

Find the dropdown list rendering (where `stores.map(...)` renders each store option). Add distance and status display:

```typescript
// Inside the stores.map() render, after the store name text, add:
{userLocation && store.address?.latitude && (
  <span style={{ fontSize: '11px', color: colors.text.tertiary, marginLeft: '8px' }}>
    {haversineKm(userLocation.lat, userLocation.lon, store.address.latitude, store.address.longitude).toFixed(1)} km
  </span>
)}
<span style={{
  fontSize: '10px',
  fontWeight: '600',
  padding: '2px 6px',
  borderRadius: '4px',
  marginLeft: '8px',
  backgroundColor: isStoreOpen(store) ? '#dcfce7' : '#fee2e2',
  color: isStoreOpen(store) ? '#16a34a' : '#dc2626',
}}>
  {isStoreOpen(store) ? 'OPEN' : 'CLOSED'}
</span>
```

**Step 6: Sort stores by distance when location is available**

Before the `stores.map()` in the dropdown render, sort the stores:

```typescript
const sortedStores = userLocation
  ? [...stores].sort((a: any, b: any) => {
      const da = a.address?.latitude ? haversineKm(userLocation.lat, userLocation.lon, a.address.latitude, a.address.longitude) : 999;
      const db = b.address?.latitude ? haversineKm(userLocation.lat, userLocation.lon, b.address.latitude, b.address.longitude) : 999;
      return da - db;
    })
  : stores;
```

Then replace `stores.map(...)` with `sortedStores.map(...)`.

**Step 7: Test in browser**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm run dev
```

Open the app, click the StoreSelector dropdown. Browser should prompt for location permission. After granting: nearest open store should be auto-selected, and stores should show "0.8 km" distance labels and OPEN/CLOSED badges.

**Step 8: Commit**

```bash
git add frontend/src/components/StoreSelector.tsx
git commit -m "feat: add geolocation auto-select, distance display, and open/closed badges to StoreSelector"
```

---

## Task 5: RabbitMQ Interview Assignment

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/cleverbot.Dockerfile`
- Create: `docker/cleverbot_bot.py`
- Create: `docs/development/RABBITMQ_PATTERNS.md`
- Modify: `docker-compose.yml` (main, add optional RabbitMQ service block)

**Step 1: Create docker directory**

```bash
mkdir -p /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/docker
```

**Step 2: Create interview assignment docker-compose.yml**

```yaml
# docker/docker-compose.yml
# Origin Capital interview assignment — RabbitMQ + Cleverbot chat bot
# Run with: docker-compose -f docker/docker-compose.yml up
version: '3.8'

networks:
  interview_net:
    driver: bridge
    ipam:
      config:
        - subnet: 10.100.0.0/24

services:
  rabbitmq:
    image: rabbitmq:3.10-management
    container_name: interview-rabbitmq
    ports:
      - "5672:5672"     # AMQP
      - "15672:15672"   # Management UI (admin/admin)
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    networks:
      interview_net:
        ipv4_address: 10.100.0.2
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 10s
      timeout: 5s
      retries: 5

  cleverbot:
    build:
      context: .
      dockerfile: cleverbot.Dockerfile
    container_name: interview-cleverbot
    depends_on:
      rabbitmq:
        condition: service_healthy
    environment:
      RABBITMQ_HOST: 10.100.0.2
      RABBITMQ_USER: admin
      RABBITMQ_PASS: admin
    networks:
      interview_net:
        ipv4_address: 10.100.0.3
    restart: on-failure
```

**Step 3: Create cleverbot.Dockerfile**

```dockerfile
# docker/cleverbot.Dockerfile
FROM python:3.11-slim

WORKDIR /app
RUN pip install --no-cache-dir pika requests

COPY cleverbot_bot.py .

CMD ["python", "cleverbot_bot.py"]
```

**Step 4: Create cleverbot_bot.py**

```python
# docker/cleverbot_bot.py
# RabbitMQ Cleverbot bot — uses topic exchange pattern
# Listens on 'chat.user.*' routing key, replies on 'chat.bot.*'

import pika
import os
import time
import logging
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.environ.get('RABBITMQ_USER', 'admin')
RABBITMQ_PASS = os.environ.get('RABBITMQ_PASS', 'admin')

EXCHANGE = 'chat_exchange'
USER_ROUTING_KEY = 'chat.user.#'
BOT_ROUTING_KEY = 'chat.bot.reply'


def get_cleverbot_reply(message: str) -> str:
    """Simple echo fallback — replace with real Cleverbot API if key available."""
    try:
        # Stub: echo the message back with a prefix
        # Real implementation: POST to https://www.cleverbot.com/getreply?key=...&input=...
        return f"[Bot] You said: {message}"
    except Exception as e:
        logger.warning(f"Cleverbot API error: {e}")
        return "[Bot] Sorry, I couldn't process that."


def on_message(channel, method, properties, body):
    message = body.decode('utf-8')
    logger.info(f"Received [{method.routing_key}]: {message}")

    reply = get_cleverbot_reply(message)
    logger.info(f"Replying: {reply}")

    channel.basic_publish(
        exchange=EXCHANGE,
        routing_key=BOT_ROUTING_KEY,
        body=reply.encode('utf-8')
    )
    channel.basic_ack(delivery_tag=method.delivery_tag)


def connect_with_retry(max_retries=10, delay=3):
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    params = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials, heartbeat=60)
    for attempt in range(1, max_retries + 1):
        try:
            conn = pika.BlockingConnection(params)
            logger.info(f"Connected to RabbitMQ at {RABBITMQ_HOST} (attempt {attempt})")
            return conn
        except Exception as e:
            logger.warning(f"Connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                time.sleep(delay)
    raise RuntimeError("Could not connect to RabbitMQ after retries")


def main():
    conn = connect_with_retry()
    channel = conn.channel()

    # Declare topic exchange
    channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)

    # Declare and bind user message queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue
    channel.queue_bind(exchange=EXCHANGE, queue=queue_name, routing_key=USER_ROUTING_KEY)

    logger.info(f"Waiting for messages on '{USER_ROUTING_KEY}'...")
    channel.basic_consume(queue=queue_name, on_message_callback=on_message)
    channel.start_consuming()


if __name__ == '__main__':
    main()
```

**Step 5: Test the interview assignment**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
docker-compose -f docker/docker-compose.yml up --build
```

Open RabbitMQ management UI at `http://localhost:15672` (admin/admin). Verify:
- Exchange `chat_exchange` exists (topic type)
- Cleverbot container is running

Send a test message via the management UI: publish to exchange `chat_exchange`, routing key `chat.user.test`, message `"Hello"`. Check logs for `[Bot] You said: Hello`.

**Step 6: Add optional RabbitMQ service to main docker-compose.yml**

Find the end of the `services:` block in `docker-compose.yml`. Add (commented out):

```yaml
  # ─── OPTIONAL: RabbitMQ for async event messaging ───────────────────────────
  # Uncomment to enable async notification fanout pattern.
  # See docs/development/RABBITMQ_PATTERNS.md for integration design.
  # rabbitmq:
  #   image: rabbitmq:3.10-management
  #   container_name: masova-rabbitmq
  #   ports:
  #     - "5672:5672"
  #     - "15672:15672"
  #   environment:
  #     RABBITMQ_DEFAULT_USER: masova
  #     RABBITMQ_DEFAULT_PASS: masova_secret
  #   networks:
  #     - masova-network
  #   healthcheck:
  #     test: rabbitmq-diagnostics -q ping
  #     interval: 15s
  #     timeout: 5s
  #     retries: 5
```

**Step 7: Write RABBITMQ_PATTERNS.md**

Create `docs/development/RABBITMQ_PATTERNS.md`:

```markdown
# RabbitMQ Patterns — Learnings & MaSoVa Application

## Interview Assignment Summary

The Origin Capital assignment demonstrated:
- **Topic exchange** routing: `chat.user.*` → Cleverbot consumer → reply on `chat.bot.reply`
- **Docker Compose** with fixed IP network (10.100.0.0/24) — ensures stable inter-container addressing
- **Pika client** (Python): blocking connection, queue bind, basic_consume loop
- **Health-check-based** service dependency — `depends_on: condition: service_healthy` prevents race conditions

## How This Maps to MaSoVa

### Current Architecture
Order status changes → `OrderService.save()` → synchronous `NotificationService.sendNotification()` → Brevo email API

### Proposed Async Pattern (when enabled)
```
OrderService.save()
  └── publish to 'order.events' topic exchange
        ├── 'order.status.changed' → notification.email queue → EmailConsumer → Brevo
        ├── 'order.status.changed' → notification.push queue → PushConsumer → Firebase
        └── 'order.status.changed' → notification.inapp queue → InAppConsumer → WebSocket broadcast
```

### Benefits
- Order save is not blocked by email sending latency
- Each notification channel is independently scalable
- Failed emails can be retried without affecting the order flow
- AI support agent (Point 13) can subscribe to `order.status.changed` for proactive updates

### Implementation Path (when ready)
1. Add `spring-boot-starter-amqp` to `notification-service/pom.xml`
2. Create `RabbitMQConfig.java` — declare exchange + 3 queues
3. In `OrderService.java`, add `rabbitTemplate.convertAndSend("order.events", "order.status.changed", event)` after order save
4. Enable with `RABBITMQ_ENABLED=true` env var (feature flag)

## Key Pika Patterns (Python, for masova-support agent)

```python
# Connect
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Topic exchange
channel.exchange_declare(exchange='order.events', exchange_type='topic', durable=True)

# Subscribe to all order events
channel.queue_bind(exchange='order.events', queue='support.events', routing_key='order.#')
```
```

**Step 8: Commit all**

```bash
git add docker/ docs/development/RABBITMQ_PATTERNS.md docker-compose.yml
git commit -m "feat: RabbitMQ interview assignment + pattern docs + optional service in docker-compose"
```

---

## Tier 2 Verification

```bash
# MaSoVaDriverApp: verify role routing
# (requires Android emulator or device)
# Login as STAFF user → should see KitchenQueueScreen
# Login as DRIVER user → should see DeliveryHomeScreen (existing)
# Login as MANAGER user → should see QuickDashboardScreen

# StoreSelector: open in browser at localhost:5173
# Allow location → nearest store should auto-select
# Open dropdown → stores sorted by distance with km labels and OPEN/CLOSED badges

# RabbitMQ interview assignment
docker-compose -f docker/docker-compose.yml up --build
# Open http://localhost:15672 — login admin/admin
# Verify: Exchanges → chat_exchange (topic) exists
# Cleverbot container logs: "Waiting for messages on 'chat.user.#'..."
docker-compose -f docker/docker-compose.yml down
```
