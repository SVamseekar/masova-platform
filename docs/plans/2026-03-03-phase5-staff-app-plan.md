# Phase 5 — Staff App (Consolidated React Native) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert `MaSoVaDriverApp` (React Native 0.81) into a single consolidated Staff App serving Manager, Kitchen Staff, Driver, and Cashier roles. Remove the separate staff-only app concept. Customer app (`masova-mobile`) stays separate.

**Architecture:** Single RN 0.81 codebase (`MaSoVaDriverApp`). JWT-decoded `user.type` field drives `RoleRouter` which dispatches to 4 role-specific tab navigators. Driver screens already exist — build 3 new tab navigators + 4 new screens. Shared components used across all roles.

**Tech Stack:** React Native 0.81, React Navigation 6, TypeScript, Redux Toolkit, Expo EAS (build config only — NOT Expo Go runtime)

**Working Directory:** `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/`

---

## Tools for This Phase

Read this section before starting ANY task. These are the exact tools to use and when.

### `typescript-lsp` — TypeScript Language Server (MCP tool)
**Use it:** Continuously while writing React Native TypeScript. The `RoleRouter`, navigator files, and new screens all use TypeScript — the LSP catches navigation prop type errors, missing screen definitions in the navigator, and incorrect Redux selector types immediately.
**Specifically:** When building `RoleRouter.tsx` in Task 5.2, the LSP will tell you if the `user.type` discriminated union is missing cases, which would cause silent routing failures for some roles.
**How to invoke:** Runs automatically. Use `mcp__ide__getDiagnostics` on any `.tsx` file explicitly.

### `feature-dev:code-explorer` (Agent)
**Use it:** At the very start — Task 5.1 (audit). Run this agent on the `MaSoVaDriverApp/` directory before writing a single line of code. It will map the existing navigation structure, screen list, Redux store shape, and API client setup.
**Specifically:** You need to know: What navigators already exist? What screens exist for the Driver role? Where is the JWT decoded? Where is Redux state stored? This agent answers all of it in one pass.
**How to invoke:** Use the Agent tool with `subagent_type: "feature-dev:code-explorer"` with the path `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/`.

### `feature-dev:code-architect` (Agent)
**Use it:** After the audit (Task 5.1), before writing `RoleRouter.tsx` (Task 5.2). This agent designs the component and navigation architecture based on what already exists.
**Specifically:** Give it the audit findings and ask it to design: the `RoleRouter` component structure, the 4 navigator files (DriverNavigator, KitchenNavigator, CashierNavigator, ManagerNavigator), the shared component API, and the Redux slice changes needed.
**How to invoke:** Use the Agent tool with `subagent_type: "feature-dev:code-architect"`.

### `frontend-design` (Skill)
**Use it:** Before building each role-specific tab navigator UI (Tasks 5.3–5.6). Each role has a distinct color identity:
- Driver: `#00B14F` (green)
- Kitchen: `#FF6B35` (orange)
- Cashier: `#2196F3` (blue)
- Manager: `#7B1FA2` (purple)

This skill guides creating distinctive, role-appropriate UI rather than generic screens.
**How to invoke:** Type `/frontend-design` with the role name and color before each navigator task.

### `context7` — Library Docs (MCP tool)
**Use it:** Before writing navigation code — React Navigation v6 API is specific about stack vs tab navigator configuration.
**Specifically:**
- Before Task 5.2: `resolve-library-id` for `@react-navigation/native` → `query-docs` for "createBottomTabNavigator" to confirm tab bar option types and `tabBarIcon` configuration in RN 0.81.
- Before Task 5.7 (OTP screen): `query-docs` for React Native `TextInput` `secureTextEntry` and numeric keyboard type — OTP must be numeric-only.
**How to invoke:** `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs`.

### `systematic-debugging` (Skill)
**Use it:** If the RoleRouter dispatches to the wrong navigator, or if a navigator shows a blank screen.
**Specifically:** The most common React Navigation bug is a missing screen registration in the navigator. Use this skill to trace: Is `user.type` being decoded correctly from JWT? Is the navigator receiving the right initial route? Are all screens registered?
**How to invoke:** Type `/systematic-debugging`.

### `commit-commands:commit` (Skill)
**Use it:** After every task. Task 5.1 (audit/no code) gets a "chore" commit. Task 5.2 (RoleRouter) gets its own commit. Each screen gets its own commit.
**How to invoke:** Type `/commit`.

---

## Task 5.1: Audit Existing MaSoVaDriverApp Structure

**Files:**
- Read: `MaSoVaDriverApp/src/navigation/AppNavigator.tsx`
- Read: `MaSoVaDriverApp/src/screens/auth/LoginScreen.tsx`
- Read: `MaSoVaDriverApp/src/navigation/` (all files)

**Step 1: Read AppNavigator.tsx**

Understand the current navigation structure. Find where `user.type` is read after login. Identify the driver-only login block.

**Step 2: List all existing screens**

```bash
find /Users/souravamseekarmarti/Projects/MaSoVaDriverApp/src/screens -name "*.tsx" | sort
```

Document what exists. The driver tab navigator and its screens should already exist.

**Step 3: Read LoginScreen.tsx**

Find the driver-only check. It's likely something like:
```tsx
if (user.type !== 'DRIVER') {
  Alert.alert('Access Denied', 'This app is for drivers only');
  return;
}
```

Note the exact location — will be replaced in Task 5.2.

**Step 4: Read existing DriverTabNavigator (or equivalent)**

Understand the driver screen structure (map, orders, profile tabs) as the template for new navigators.

**Step 5: Check existing design tokens**

```bash
find /Users/souravamseekarmarti/Projects/MaSoVaDriverApp/src -name "*token*" -o -name "*theme*" -o -name "*color*"
```

Read the existing design tokens file. This will be extended with role accent colors.

**Step 6: No commit — audit only.**

---

## Task 5.2: Remove Driver-Only Login Block + Add RoleRouter

**Files:**
- Modify: `MaSoVaDriverApp/src/navigation/AppNavigator.tsx`
- Modify: `MaSoVaDriverApp/src/screens/auth/LoginScreen.tsx`
- Create: `MaSoVaDriverApp/src/navigation/RoleRouter.tsx`

**Step 1: Remove driver-only check from LoginScreen.tsx**

Find and remove the block that rejects non-driver users. Replace with:

```tsx
// After successful login, navigate based on role:
const handleLoginSuccess = (user: User, token: string) => {
  dispatch(setUser({ user, token }));
  // Navigation will be handled by RoleRouter — no role check needed here
  navigation.replace('Main');
};
```

**Step 2: Create RoleRouter.tsx**

Create `MaSoVaDriverApp/src/navigation/RoleRouter.tsx`:

```tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { DriverTabNavigator } from './DriverTabNavigator';
import { KitchenTabNavigator } from './KitchenTabNavigator';
import { CashierTabNavigator } from './CashierTabNavigator';
import { ManagerTabNavigator } from './ManagerTabNavigator';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Dispatches to the correct tab navigator based on user.type from JWT.
 */
export const RoleRouter = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  switch (user?.type) {
    case 'DRIVER':
      return <DriverTabNavigator />;
    case 'KITCHEN_STAFF':
      return <KitchenTabNavigator />;
    case 'CASHIER':
    case 'KIOSK':
      return <CashierTabNavigator />;
    case 'MANAGER':
    case 'ASSISTANT_MANAGER':
      return <ManagerTabNavigator />;
    default:
      return (
        <View style={styles.center}>
          <Text style={styles.text}>Unknown role: {user?.type}</Text>
          <Text style={styles.subtext}>Please contact your manager.</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtext: { color: '#888' }
});
```

**Step 3: Wire RoleRouter into AppNavigator**

In `AppNavigator.tsx`, replace the current post-login navigator (likely `DriverTabNavigator` directly) with `RoleRouter`:

```tsx
// In the authenticated stack:
<Stack.Screen name="Main" component={RoleRouter} options={{ headerShown: false }} />
```

**Step 4: Build to verify no TypeScript errors**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
npx react-native bundle --entry-file index.js --platform android --dev false --bundle-output /tmp/test.bundle 2>&1 | tail -20
```

Or just:
```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git add src/navigation/RoleRouter.tsx
git add src/screens/auth/LoginScreen.tsx
git commit -m "feat(staff-app): add RoleRouter — dispatches to role-specific navigator based on user.type"
```

---

## Task 5.3: Add Role Accent Colors to Design Tokens

**Files:**
- Modify: `MaSoVaDriverApp/src/` design tokens file (find exact path in Task 5.1 audit)

**Step 1: Add role accent colors**

In the existing design tokens file, add:

```typescript
export const roleColors = {
  DRIVER: {
    primary: '#00B14F',      // Green — movement, delivery
    secondary: '#00D660',
    surface: 'rgba(0, 177, 79, 0.1)',
  },
  KITCHEN_STAFF: {
    primary: '#FF6B35',      // Orange — heat, cooking
    secondary: '#FF8C57',
    surface: 'rgba(255, 107, 53, 0.1)',
  },
  CASHIER: {
    primary: '#2196F3',      // Blue — trust, transactions
    secondary: '#42A5F5',
    surface: 'rgba(33, 150, 243, 0.1)',
  },
  MANAGER: {
    primary: '#7B1FA2',      // Purple — authority, oversight
    secondary: '#9C27B0',
    surface: 'rgba(123, 31, 162, 0.1)',
  },
} as const;

export type UserRole = keyof typeof roleColors;
```

**Step 2: Create useRoleColors hook**

Create `MaSoVaDriverApp/src/hooks/useRoleColors.ts`:

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { roleColors, UserRole } from '../design/tokens';

export const useRoleColors = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = (user?.type ?? 'DRIVER') as UserRole;
  return roleColors[role] ?? roleColors.DRIVER;
};
```

**Step 3: Commit**

```bash
git add src/design/tokens.ts  # adjust path
git add src/hooks/useRoleColors.ts
git commit -m "feat(staff-app): role accent colors — green/orange/blue/purple per role, useRoleColors hook"
```

---

## Task 5.4: Create Kitchen Tab Navigator + KitchenQueueScreen

**Files:**
- Create: `MaSoVaDriverApp/src/navigation/KitchenTabNavigator.tsx`
- Create: `MaSoVaDriverApp/src/screens/kitchen/KitchenQueueScreen.tsx`
- Create: `MaSoVaDriverApp/src/screens/kitchen/OrderDetailScreen.tsx`

**Step 1: Create KitchenTabNavigator**

Create `MaSoVaDriverApp/src/navigation/KitchenTabNavigator.tsx`:

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { KitchenQueueScreen } from '../screens/kitchen/KitchenQueueScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { roleColors } from '../design/tokens';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export const KitchenTabNavigator = () => (
  <Tab.Navigator screenOptions={{
    tabBarActiveTintColor: roleColors.KITCHEN_STAFF.primary,
    tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' }
  }}>
    <Tab.Screen
      name="Queue"
      component={KitchenQueueScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="restaurant" color={color} size={size} />,
        title: 'Order Queue'
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="person" color={color} size={size} />
      }}
    />
  </Tab.Navigator>
);
```

**Step 2: Create KitchenQueueScreen.tsx**

Create `MaSoVaDriverApp/src/screens/kitchen/KitchenQueueScreen.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { roleColors } from '../../design/tokens';
import { api } from '../../services/api';  // adjust to your API client

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  receivedAt: string;
  items: Array<{ name: string; quantity: number }>;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: string;
}

const KITCHEN_STATUSES = ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY'];

const getUrgencyColor = (receivedAt: string): string => {
  const minutes = (Date.now() - new Date(receivedAt).getTime()) / 60000;
  if (minutes > 10) return '#f44336';
  if (minutes > 5)  return '#FF9800';
  return '#4CAF50';
};

export const KitchenQueueScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/api/orders/kitchen?storeId=${user?.storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (e) {
      console.error('Failed to fetch kitchen queue:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);  // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleBump = async (order: Order) => {
    try {
      await api.post(`/api/orders/${order.id}/next-stage`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (e) {
      Alert.alert('Error', 'Could not advance order status');
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.card, { borderLeftColor: getUrgencyColor(item.receivedAt) }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>

      {item.orderType === 'DINE_IN' && item.tableNumber && (
        <Text style={styles.tableLabel}>Table {item.tableNumber}</Text>
      )}

      {item.items.map((i, idx) => (
        <Text key={idx} style={styles.itemText}>{i.quantity}× {i.name}</Text>
      ))}

      <TouchableOpacity
        style={[styles.bumpButton, { backgroundColor: roleColors.KITCHEN_STAFF.primary }]}
        onPress={() => handleBump(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.bumpText}>▶ Advance</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        onRefresh={() => { setRefreshing(true); fetchOrders().finally(() => setRefreshing(false)); }}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No orders in queue</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    margin: 8,
    padding: 16,
    borderLeftWidth: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNumber: { color: '#fff', fontSize: 18, fontWeight: '700' },
  status: { color: '#888', fontSize: 12, textTransform: 'uppercase' },
  tableLabel: { color: '#FF9800', fontSize: 13, marginBottom: 4 },
  itemText: { color: '#ccc', fontSize: 15, marginVertical: 2 },
  bumpButton: {
    marginTop: 12, padding: 14,
    borderRadius: 8, alignItems: 'center', minHeight: 48
  },
  bumpText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: '#555', fontSize: 16 },
});
```

**Step 3: Create OrderDetailScreen.tsx**

Create `MaSoVaDriverApp/src/screens/kitchen/OrderDetailScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';

export const OrderDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { order } = route.params;
  const token = useSelector((state: RootState) => state.auth.token);

  const handleAdvanceStatus = async (newStatus: string) => {
    try {
      await api.post(`/api/orders/${order.id}/status`,
        { status: newStatus, reason: 'Kitchen staff action' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', `Order moved to ${newStatus}`);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not update order status');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
      <Text style={styles.status}>{order.status}</Text>

      {order.items.map((item: any, i: number) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
          {item.customizations && (
            <Text style={styles.customizations}>{item.customizations}</Text>
          )}
        </View>
      ))}

      {order.specialInstructions ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Special Instructions:</Text>
          <Text style={styles.notesText}>{order.specialInstructions}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  orderNumber: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  status: { color: '#FF6B35', fontSize: 14, textTransform: 'uppercase', marginBottom: 16 },
  item: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8 },
  itemName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  customizations: { color: '#888', fontSize: 13, marginTop: 4 },
  notes: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginTop: 8 },
  notesLabel: { color: '#FF6B35', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  notesText: { color: '#ccc', fontSize: 14 },
});
```

**Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
git add src/navigation/KitchenTabNavigator.tsx
git add src/screens/kitchen/KitchenQueueScreen.tsx
git add src/screens/kitchen/OrderDetailScreen.tsx
git commit -m "feat(staff-app): KitchenTabNavigator, KitchenQueueScreen with urgency colors + bump button, OrderDetailScreen"
```

---

## Task 5.5: Create Cashier Tab Navigator + QuickOrderScreen

**Files:**
- Create: `MaSoVaDriverApp/src/navigation/CashierTabNavigator.tsx`
- Create: `MaSoVaDriverApp/src/screens/cashier/QuickOrderScreen.tsx`

**Step 1: Create CashierTabNavigator**

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QuickOrderScreen } from '../screens/cashier/QuickOrderScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { roleColors } from '../design/tokens';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export const CashierTabNavigator = () => (
  <Tab.Navigator screenOptions={{
    tabBarActiveTintColor: roleColors.CASHIER.primary,
    tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' }
  }}>
    <Tab.Screen
      name="NewOrder"
      component={QuickOrderScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="add-circle" color={color} size={size} />,
        title: 'New Order'
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="person" color={color} size={size} />
      }}
    />
  </Tab.Navigator>
);
```

**Step 2: Create QuickOrderScreen.tsx**

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';
import { roleColors } from '../../design/tokens';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export const QuickOrderScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DINE_IN'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/api/menu?storeId=${user?.storeId}&available=true`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMenu(res.data.content ?? res.data)).catch(console.error);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) { Alert.alert('Error', 'Enter customer name'); return; }
    if (cart.length === 0) { Alert.alert('Error', 'Add items to order'); return; }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) { Alert.alert('Error', 'Enter table number'); return; }

    setLoading(true);
    try {
      await api.post('/api/orders', {
        storeId: user?.storeId,
        customerName: customerName.trim(),
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        paymentMethod: 'CASH',
        createdByStaffId: user?.id,
        createdByStaffName: user?.name,
        items: cart.map(i => ({ menuItemId: i.id, name: i.name, quantity: i.quantity, price: i.price }))
      }, { headers: { Authorization: `Bearer ${token}` } });

      Alert.alert('Order Placed', `₹${cartTotal.toFixed(0)} — Cash to collect`, [
        { text: 'New Order', onPress: () => { setCart([]); setCustomerName(''); setTableNumber(''); } }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.nameInput}
        placeholder="Customer Name"
        placeholderTextColor="#555"
        value={customerName}
        onChangeText={setCustomerName}
      />

      {/* Order type toggle */}
      <View style={styles.typeRow}>
        {(['TAKEAWAY', 'DINE_IN'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, orderType === type && styles.typeBtnActive]}
            onPress={() => setOrderType(type)}
          >
            <Text style={[styles.typeBtnText, orderType === type && { color: roleColors.CASHIER.primary }]}>
              {type === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {orderType === 'DINE_IN' && (
        <TextInput
          style={styles.nameInput}
          placeholder="Table Number"
          placeholderTextColor="#555"
          value={tableNumber}
          onChangeText={setTableNumber}
          keyboardType="numeric"
        />
      )}

      {/* Menu items */}
      <FlatList
        data={menu}
        numColumns={2}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.menuItem} onPress={() => addToCart(item)}>
            <Text style={styles.menuName}>{item.name}</Text>
            <Text style={styles.menuPrice}>₹{item.price}</Text>
          </TouchableOpacity>
        )}
        style={styles.menuList}
      />

      {/* Cart summary + place order */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartSummary}>{cart.reduce((s, i) => s + i.quantity, 0)} items — ₹{cartTotal.toFixed(0)}</Text>
          <TouchableOpacity
            style={[styles.placeOrder, loading && styles.disabled]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            <Text style={styles.placeOrderText}>{loading ? 'Placing...' : 'Place Order (Cash)'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  nameInput: {
    backgroundColor: '#1a1a1a', color: '#fff', padding: 14,
    marginHorizontal: 8, marginTop: 8, borderRadius: 8,
    fontSize: 16, borderWidth: 1, borderColor: '#333'
  },
  typeRow: { flexDirection: 'row', margin: 8, gap: 8 },
  typeBtn: {
    flex: 1, padding: 12, borderRadius: 8,
    backgroundColor: '#1a1a1a', alignItems: 'center',
    borderWidth: 1, borderColor: '#333'
  },
  typeBtnActive: { borderColor: roleColors.CASHIER.primary },
  typeBtnText: { color: '#888', fontWeight: '600' },
  menuList: { flex: 1, margin: 4 },
  menuItem: {
    flex: 1, backgroundColor: '#1a1a1a', margin: 4,
    borderRadius: 8, padding: 14, alignItems: 'center'
  },
  menuName: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  menuPrice: { color: roleColors.CASHIER.primary, fontSize: 16, fontWeight: '700' },
  cartBar: {
    backgroundColor: '#1a1a1a', padding: 16,
    borderTopWidth: 1, borderTopColor: '#333',
    flexDirection: 'row', alignItems: 'center', gap: 12
  },
  cartSummary: { color: '#fff', flex: 1, fontSize: 15 },
  placeOrder: {
    backgroundColor: roleColors.CASHIER.primary,
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8
  },
  placeOrderText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
```

**Step 3: Commit**

```bash
git add src/navigation/CashierTabNavigator.tsx
git add src/screens/cashier/QuickOrderScreen.tsx
git commit -m "feat(staff-app): CashierTabNavigator, QuickOrderScreen — menu grid, cart, TAKEAWAY/DINE_IN, cash payment"
```

---

## Task 5.6: Create Manager Tab Navigator + QuickDashboardScreen

**Files:**
- Create: `MaSoVaDriverApp/src/navigation/ManagerTabNavigator.tsx`
- Create: `MaSoVaDriverApp/src/screens/manager/QuickDashboardScreen.tsx`

**Step 1: Create ManagerTabNavigator**

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QuickDashboardScreen } from '../screens/manager/QuickDashboardScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { roleColors } from '../design/tokens';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export const ManagerTabNavigator = () => (
  <Tab.Navigator screenOptions={{
    tabBarActiveTintColor: roleColors.MANAGER.primary,
    tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' }
  }}>
    <Tab.Screen
      name="Dashboard"
      component={QuickDashboardScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="dashboard" color={color} size={size} />,
        title: 'Dashboard'
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="person" color={color} size={size} />
      }}
    />
  </Tab.Navigator>
);
```

**Step 2: Create QuickDashboardScreen.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';
import { roleColors } from '../../design/tokens';

interface DashboardData {
  todayRevenue: number;
  activeOrders: number;
  avgPrepTime: number;
  activeStaff: number;
}

const KPICard = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <View style={[styles.kpiCard, { borderTopColor: accent }]}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
  </View>
);

export const QuickDashboardScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const accent = roleColors.MANAGER.primary;

  const fetchData = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        api.get(`/api/analytics/sales?period=today&storeId=${user?.storeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/orders?storeId=${user?.storeId}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setData(analyticsRes.data);
      setRecentOrders(ordersRes.data.content ?? ordersRes.data);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
        setRefreshing(true);
        fetchData().finally(() => setRefreshing(false));
      }} tintColor={accent} />}
    >
      <Text style={styles.title}>Today's Overview</Text>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        <KPICard label="Revenue" value={`₹${data?.todayRevenue ?? '--'}`} accent={accent} />
        <KPICard label="Active Orders" value={String(data?.activeOrders ?? '--')} accent={accent} />
        <KPICard label="Avg Prep" value={`${data?.avgPrepTime ?? '--'}m`} accent={accent} />
        <KPICard label="Staff On Duty" value={String(data?.activeStaff ?? '--')} accent={accent} />
      </View>

      {/* Recent orders */}
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {recentOrders.map(order => (
        <View key={order.id} style={styles.orderRow}>
          <View>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderMeta}>{order.orderType} · {order.customerName}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>₹{order.total}</Text>
            <Text style={[styles.orderStatus, { color: accent }]}>{order.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  kpiCard: {
    width: '46%', backgroundColor: '#1a1a1a', margin: '2%',
    borderRadius: 8, padding: 16, borderTopWidth: 3
  },
  kpiLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  kpiValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  sectionTitle: { color: '#888', fontSize: 13, textTransform: 'uppercase', padding: 16, paddingBottom: 8 },
  orderRow: {
    backgroundColor: '#1a1a1a', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginHorizontal: 8, marginBottom: 4, padding: 14, borderRadius: 8
  },
  orderNumber: { color: '#fff', fontWeight: '600', fontSize: 15 },
  orderMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { color: '#fff', fontWeight: '700', fontSize: 16 },
  orderStatus: { fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
});
```

**Step 3: Commit**

```bash
git add src/navigation/ManagerTabNavigator.tsx
git add src/screens/manager/QuickDashboardScreen.tsx
git commit -m "feat(staff-app): ManagerTabNavigator, QuickDashboardScreen — KPI grid + recent orders"
```

---

## Task 5.7: Shared Components

**Files:**
- Create: `MaSoVaDriverApp/src/components/NotificationBell.tsx`
- Create: `MaSoVaDriverApp/src/components/ProfileHeader.tsx`
- Create: `MaSoVaDriverApp/src/components/StatusBadge.tsx`
- Modify: `MaSoVaDriverApp/src/screens/shared/ProfileScreen.tsx` (or create if not exists)

**Step 1: Create StatusBadge**

```tsx
// MaSoVaDriverApp/src/components/StatusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#2196F3',
  PREPARING: '#FF9800',
  OVEN: '#F44336',
  BAKED: '#9C27B0',
  READY: '#4CAF50',
  DISPATCHED: '#00BCD4',
  OUT_FOR_DELIVERY: '#009688',
  DELIVERED: '#607D8B',
  SERVED: '#8BC34A',
  COMPLETED: '#607D8B',
  CANCELLED: '#F44336',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] ?? '#555' }]}>
    <Text style={styles.text}>{status.replace(/_/g, ' ')}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  text: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }
});
```

**Step 2: Create ProfileHeader**

```tsx
// MaSoVaDriverApp/src/components/ProfileHeader.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { roleColors, UserRole } from '../design/tokens';

export const ProfileHeader = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const colors = roleColors[(user?.type ?? 'DRIVER') as UserRole] ?? roleColors.DRIVER;

  const roleLabel = {
    DRIVER: 'Driver',
    KITCHEN_STAFF: 'Kitchen Staff',
    CASHIER: 'Cashier',
    MANAGER: 'Manager',
    ASSISTANT_MANAGER: 'Asst. Manager',
  }[user?.type ?? ''] ?? user?.type ?? 'Staff';

  return (
    <View style={[styles.container, { borderBottomColor: colors.primary }]}>
      <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <View>
        <Text style={styles.name}>{user?.name ?? 'Staff'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>{roleLabel}</Text>
        </View>
        <Text style={styles.store}>{user?.storeName ?? user?.storeId}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#1a1a1a', gap: 14, borderBottomWidth: 1
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700' },
  name: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  roleBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 2 },
  roleText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  store: { color: '#666', fontSize: 12 }
});
```

**Step 3: Commit**

```bash
git add src/components/StatusBadge.tsx
git add src/components/ProfileHeader.tsx
git commit -m "feat(staff-app): shared StatusBadge + ProfileHeader components with role accent colors"
```

---

## Task 5.8: Driver App Improvements

**Files:**
- Modify: `MaSoVaDriverApp/src/screens/driver/` (existing driver screens)

**Step 1: Replace polling with WebSocket subscription for order assignment**

Find where the driver app polls for new orders. Replace with STOMP WebSocket subscription:

```tsx
// In driver home screen or wherever orders are fetched:
useEffect(() => {
  // Subscribe to order assignments via WebSocket
  const stompClient = new Client({
    brokerURL: `ws://${API_HOST}/ws`,
    onConnect: () => {
      stompClient.subscribe(`/topic/driver/${user.id}`, (message) => {
        const order = JSON.parse(message.body);
        // New order assigned to this driver
        dispatch(setNewAssignment(order));
        showOrderAssignmentAlert(order);
      });
    }
  });
  stompClient.activate();
  return () => stompClient.deactivate();
}, [user.id]);
```

**Step 2: Simplify assignedDriverId check**

Find a block that checks `order.assignedDriverId || order.driverId || order.driver_id` (3 fallback checks). Replace with single canonical check:

```tsx
// Before (fragile):
const isAssignedToMe = order.assignedDriverId === user.id
  || order.driverId === user.id
  || order.driver_id === user.id;

// After (canonical — API reduction ensures single field name):
const isAssignedToMe = order.assignedDriverId === user.id;
```

**Step 3: Add OTP input screen before marking DELIVERED**

Create `MaSoVaDriverApp/src/screens/driver/OtpVerificationScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';
import { roleColors } from '../../design/tokens';

interface Props {
  orderId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OtpVerificationScreen = ({ orderId, onVerified, onCancel }: Props) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 4) { setError('Enter 4-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/delivery/verify-otp',
        { orderId, otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.verified) {
        onVerified();
      } else {
        setError('Invalid OTP. Ask the customer again.');
      }
    } catch {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery OTP</Text>
      <Text style={styles.subtitle}>Ask the customer for their 4-digit code</Text>

      <TextInput
        style={styles.otpInput}
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={4}
        placeholder="0000"
        placeholderTextColor="#555"
        textAlign="center"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.verifyBtn, (otp.length !== 4 || loading) && styles.disabled]}
        onPress={handleVerify}
        disabled={otp.length !== 4 || loading}
      >
        <Text style={styles.verifyText}>{loading ? 'Verifying...' : 'Verify & Complete Delivery'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  otpInput: {
    width: 180, backgroundColor: '#1a1a1a', color: '#fff',
    fontSize: 40, fontWeight: '700', letterSpacing: 16,
    borderRadius: 8, padding: 16, marginBottom: 16,
    borderWidth: 2, borderColor: roleColors.DRIVER.primary
  },
  error: { color: '#f44336', marginBottom: 16, textAlign: 'center' },
  verifyBtn: {
    backgroundColor: roleColors.DRIVER.primary,
    padding: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12
  },
  verifyText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#666', fontSize: 15 },
  disabled: { opacity: 0.5 }
});
```

In the driver delivery confirmation flow, show this screen before calling the DELIVERED API.

**Step 4: Commit**

```bash
git add src/screens/driver/OtpVerificationScreen.tsx
git add src/screens/driver/  # modified files
git commit -m "feat(driver): WebSocket order assignment, OTP verification screen, remove multi-field driver ID fallbacks"
```

---

## Task 5.9: Expo EAS Build Config

**Files:**
- Create: `MaSoVaDriverApp/eas.json`
- Modify: `MaSoVaDriverApp/app.json` (if Expo managed config)

**Step 1: Create eas.json**

Create `MaSoVaDriverApp/eas.json`:

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://192.168.50.88:8080",
        "EXPO_PUBLIC_AGENT_URL": "http://192.168.50.88:8000"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.masova.app",
        "EXPO_PUBLIC_AGENT_URL": "https://agent-staging.masova.app"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.masova.app",
        "EXPO_PUBLIC_AGENT_URL": "https://agent.masova.app"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Step 2: Repeat for masova-mobile**

Create `masova-mobile/eas.json` with the same structure (different app — customer app).

**Step 3: Commit**

```bash
git add eas.json
git commit -m "feat(staff-app): EAS build config — dev/preview/production environments with API URLs"
```

---

## Task 5.10: Customer Mobile Additions (masova-mobile)

**Files:**
- Modify: `/Users/souravamseekarmarti/Projects/masova-mobile/src/screens/` (LiveTracking or OrderTracking screen)

**Step 1: Show OTP when order is DISPATCHED**

Find the order tracking screen. Add OTP display:

```tsx
{order?.status === 'DISPATCHED' && (
  <View style={styles.otpContainer}>
    <Text style={styles.otpLabel}>Your Delivery OTP</Text>
    <Text style={styles.otp}>{order.deliveryOtp ?? '----'}</Text>
    <Text style={styles.otpSubtext}>Share this with your delivery driver</Text>
  </View>
)}
```

**Step 2: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/
git commit -m "feat(customer-mobile): show delivery OTP when order status is DISPATCHED"
```

---

## Execution Notes

### Working Directory
All Staff App tasks (5.1–5.9) run in `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/`.
Task 5.10 runs in `/Users/souravamseekarmarti/Projects/masova-mobile/`.

### Testing on Device (Mac M1)
- Metro bundler runs on port 8888 (set in app config): `npx react-native start --port 8888`
- API calls go to Dell at `192.168.50.88:8080` via the `EXPO_PUBLIC_API_URL` env var

### Task Order
1. Task 5.1 (audit) — must be first, informs everything else
2. Tasks 5.2 + 5.3 (RoleRouter + design tokens) — before any navigator/screen work
3. Tasks 5.4 + 5.5 + 5.6 (navigators + screens) — parallel
4. Task 5.7 (shared components) — can be done any time
5. Task 5.8 (driver improvements) — independent
6. Task 5.9 (EAS config) — last, deployment config only
7. Task 5.10 (masova-mobile) — independent, different repo
