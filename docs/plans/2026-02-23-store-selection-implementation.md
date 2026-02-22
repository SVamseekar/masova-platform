# Domino's-style Store Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a Domino's-style address gate that selects the serving store and shows accurate distance-based delivery fees before the customer sees the menu.

**Architecture:** New public backend endpoint `/api/stores/find-by-location` resolves coordinates → store + delivery zone + fee. Frontend AddressGate component blocks menu access until address is confirmed. Zone fee stored in Redux replaces all hardcoded ₹50 values.

**Tech Stack:** Spring Boot (core-service), React 19 + TypeScript, Redux Toolkit (RTK Query), Google Places Autocomplete API, Haversine distance (already implemented in Store.java)

---

## Task 1: Backend — `LocationQueryResult` DTO

**Files:**
- Create: `core-service/src/main/java/com/MaSoVa/core/user/dto/LocationQueryResult.java`

**Step 1: Create the DTO class**

```java
package com.MaSoVa.core.user.dto;

public class LocationQueryResult {

    // Minimal store info returned to client
    public static class StoreInfo {
        private String id;
        private String name;
        private String storeCode;
        private String city;
        private String state;
        private String pincode;
        private String phoneNumber;
        private double distanceKm;

        public StoreInfo() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getStoreCode() { return storeCode; }
        public void setStoreCode(String storeCode) { this.storeCode = storeCode; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getPincode() { return pincode; }
        public void setPincode(String pincode) { this.pincode = pincode; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public double getDistanceKm() { return distanceKm; }
        public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }
    }

    private StoreInfo store;           // The serving store (null if outside all radii)
    private StoreInfo nearestStore;    // Always present — for pickup suggestion
    private boolean withinDeliveryArea;
    private String zone;               // "A", "B", "C", or null
    private double deliveryFeeINR;
    private int estimatedDeliveryMinutes;
    private double distanceKm;

    public LocationQueryResult() {}

    public StoreInfo getStore() { return store; }
    public void setStore(StoreInfo store) { this.store = store; }
    public StoreInfo getNearestStore() { return nearestStore; }
    public void setNearestStore(StoreInfo nearestStore) { this.nearestStore = nearestStore; }
    public boolean isWithinDeliveryArea() { return withinDeliveryArea; }
    public void setWithinDeliveryArea(boolean withinDeliveryArea) { this.withinDeliveryArea = withinDeliveryArea; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public double getDeliveryFeeINR() { return deliveryFeeINR; }
    public void setDeliveryFeeINR(double deliveryFeeINR) { this.deliveryFeeINR = deliveryFeeINR; }
    public int getEstimatedDeliveryMinutes() { return estimatedDeliveryMinutes; }
    public void setEstimatedDeliveryMinutes(int estimatedDeliveryMinutes) { this.estimatedDeliveryMinutes = estimatedDeliveryMinutes; }
    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }
}
```

**Step 2: Verify the file compiles**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn21 -pl core-service -am compile -q
```

Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/user/dto/LocationQueryResult.java
git commit -m "feat(core): add LocationQueryResult DTO for find-by-location endpoint"
```

---

## Task 2: Backend — `StoreService.findByLocation()`

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/StoreService.java`

**Context:** `StoreService` already has `getActiveStores()`, `getStoresInDeliveryRadius()`, and imports for `Store`, `StoreStatus`. `Store.java` has `isWithinDeliveryRadius(lat, lon)` and `calculateDistance()` is private — we'll use the Haversine formula inline (same as in `StoreSelector.tsx`).

**Step 1: Add the `findByLocation` method to `StoreService.java`**

Add these imports at the top if not already present:
```java
import com.MaSoVa.core.user.dto.LocationQueryResult;
import java.util.Comparator;
import java.util.Optional;
```

Add this method to the `StoreService` class body:

```java
public LocationQueryResult findByLocation(double latitude, double longitude) {
    List<Store> activeStores = getActiveStores();

    // Compute distance from each store to the customer
    record StoreDistance(Store store, double distanceKm) {}

    List<StoreDistance> withDistances = activeStores.stream()
        .filter(s -> s.getAddress() != null
                  && s.getAddress().getLatitude() != null
                  && s.getAddress().getLongitude() != null)
        .map(s -> new StoreDistance(s, haversineKm(
            s.getAddress().getLatitude(), s.getAddress().getLongitude(),
            latitude, longitude)))
        .sorted(Comparator.comparingDouble(StoreDistance::distanceKm))
        .toList();

    LocationQueryResult result = new LocationQueryResult();

    // Always set the nearest store (for pickup suggestion)
    if (!withDistances.isEmpty()) {
        StoreDistance nearest = withDistances.get(0);
        result.setNearestStore(toStoreInfo(nearest.store(), nearest.distanceKm()));
    }

    // Find the closest store whose delivery radius covers the customer
    Optional<StoreDistance> serving = withDistances.stream()
        .filter(sd -> sd.store().isWithinDeliveryRadius(latitude, longitude))
        .findFirst();

    if (serving.isPresent()) {
        StoreDistance sd = serving.get();
        Store store = sd.store();
        double distKm = sd.distanceKm();

        result.setWithinDeliveryArea(true);
        result.setStore(toStoreInfo(store, distKm));
        result.setDistanceKm(distKm);

        // Determine delivery zone
        if (store.getConfiguration() != null && store.getConfiguration().getServiceArea() != null) {
            store.getConfiguration().getServiceArea().getZones().stream()
                .filter(z -> z.isActive() && z.containsDistance(distKm))
                .findFirst()
                .ifPresentOrElse(zone -> {
                    result.setZone(zone.getZoneName());
                    result.setDeliveryFeeINR(zone.getDeliveryFeeINR());
                    result.setEstimatedDeliveryMinutes(zone.getEstimatedDeliveryMinutes());
                }, () -> {
                    // Fallback: no zone match — use config defaults
                    result.setZone(null);
                    result.setDeliveryFeeINR(50.0);
                    result.setEstimatedDeliveryMinutes(store.getConfiguration().getMaxDeliveryTimeMinutes());
                });
        } else {
            // No ServiceArea configured — use flat fee fallback
            result.setZone(null);
            result.setDeliveryFeeINR(50.0);
            result.setEstimatedDeliveryMinutes(30);
        }
    } else {
        result.setWithinDeliveryArea(false);
        result.setDistanceKm(withDistances.isEmpty() ? 0 : withDistances.get(0).distanceKm());
    }

    return result;
}

private LocationQueryResult.StoreInfo toStoreInfo(Store store, double distanceKm) {
    LocationQueryResult.StoreInfo info = new LocationQueryResult.StoreInfo();
    info.setId(store.getId());
    info.setName(store.getName());
    info.setStoreCode(store.getCode());
    info.setDistanceKm(Math.round(distanceKm * 10.0) / 10.0);
    if (store.getAddress() != null) {
        info.setCity(store.getAddress().getCity());
        info.setState(store.getAddress().getState());
        info.setPincode(store.getAddress().getPincode());
    }
    info.setPhoneNumber(store.getPhoneNumber());
    return info;
}

private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
    final int R = 6371;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
             + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
             * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

**Step 2: Compile**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn21 -pl core-service -am compile -q
```

Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/user/service/StoreService.java
git commit -m "feat(core): add StoreService.findByLocation() with zone-based fee resolution"
```

---

## Task 3: Backend — `StoreController` endpoint

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java`

**Step 1: Add the public endpoint**

In `StoreController.java`, in the `// PUBLIC ENDPOINTS` section, add after the existing public endpoints:

```java
@GetMapping("/public/find-by-location")
@Operation(summary = "Find serving store and delivery zone by coordinates (public)")
public ResponseEntity<com.MaSoVa.core.user.dto.LocationQueryResult> findByLocation(
        @RequestParam("latitude") double latitude,
        @RequestParam("longitude") double longitude) {
    com.MaSoVa.core.user.dto.LocationQueryResult result = storeService.findByLocation(latitude, longitude);
    return ResponseEntity.ok(result);
}
```

**Note:** The URL is `/api/stores/public/find-by-location` (public, no auth). Frontend calls this URL.

**Step 2: Compile**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn21 -pl core-service -am compile -q
```

Expected: BUILD SUCCESS

**Step 3: Quick manual smoke test** (core-service must be running on :8085)

```bash
curl -s "http://localhost:8085/api/stores/public/find-by-location?latitude=12.9716&longitude=77.5946" | python3 -m json.tool
```

Expected: JSON with `withinDeliveryArea`, `nearestStore`, `deliveryFeeINR` fields.

**Step 4: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java
git commit -m "feat(core): add GET /stores/public/find-by-location endpoint"
```

---

## Task 4: Frontend — `storeApi.ts` addition

**Files:**
- Modify: `frontend/src/store/api/storeApi.ts`

**Step 1: Add the TypeScript type and RTK Query endpoint**

After the existing `DeliveryRadiusCheckResult` interface, add:

```ts
export interface StoreInfo {
  id: string;
  name: string;
  storeCode: string;
  city: string;
  state: string;
  pincode: string;
  phoneNumber?: string;
  distanceKm: number;
}

export interface LocationQueryResult {
  store: StoreInfo | null;
  nearestStore: StoreInfo | null;
  withinDeliveryArea: boolean;
  zone: 'A' | 'B' | 'C' | null;
  deliveryFeeINR: number;
  estimatedDeliveryMinutes: number;
  distanceKm: number;
}
```

Inside the `endpoints: (builder) => ({` block, add before the closing `}),`:

```ts
// Find serving store by coordinates (Domino's-style address gate)
findByLocation: builder.query<LocationQueryResult, { latitude: number; longitude: number }>({
  query: ({ latitude, longitude }) =>
    `/stores/public/find-by-location?latitude=${latitude}&longitude=${longitude}`,
}),
```

At the bottom, add `useFindByLocationQuery` to the exports:

```ts
export const {
  useGetStoreQuery,
  useGetStoreByCodeQuery,
  useGetActiveStoresQuery,
  useGetActiveStoresProtectedQuery,
  useGetStoresByRegionQuery,
  useGetNearbyStoresQuery,
  useCheckDeliveryRadiusQuery,
  useFindByLocationQuery,   // ADD THIS
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useGetOperationalStatusQuery,
  useGetStoreMetricsQuery,
} = storeApi;
```

**Step 2: Verify TypeScript compiles**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to storeApi.ts

**Step 3: Commit**

```bash
git add frontend/src/store/api/storeApi.ts
git commit -m "feat(frontend): add findByLocation RTK Query endpoint to storeApi"
```

---

## Task 5: Frontend — `cartSlice.ts` delivery location state

**Files:**
- Modify: `frontend/src/store/slices/cartSlice.ts`

**Step 1: Add delivery location fields to `CartState` interface**

Replace the existing `CartState` interface with:

```ts
interface DeliveryLocation {
  formatted: string;
  latitude: number;
  longitude: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  deliveryFee: number;           // kept for backward compat, driven by deliveryFeeINR
  isLoading: boolean;
  selectedStoreId: string | null;
  selectedStoreName: string | null;
  // Delivery location (set by AddressGate)
  deliveryLocation: DeliveryLocation | null;
  deliveryZone: 'A' | 'B' | 'C' | null;
  deliveryFeeINR: number;
  estimatedDeliveryMinutes: number;
  withinDeliveryArea: boolean;
  addressGateConfirmed: boolean;  // true once customer has confirmed address
}
```

**Step 2: Update `loadCartFromStorage` and initial state defaults**

In `loadCartFromStorage`, add default values for the new fields:

```ts
return {
  items: savedCart.items || [],
  total: savedCart.total || 0,
  itemCount: savedCart.itemCount || 0,
  deliveryFee: savedCart.deliveryFeeINR || 50,
  isLoading: false,
  selectedStoreId: savedCart.selectedStoreId || null,
  selectedStoreName: savedCart.selectedStoreName || null,
  deliveryLocation: savedCart.deliveryLocation || null,
  deliveryZone: savedCart.deliveryZone || null,
  deliveryFeeINR: savedCart.deliveryFeeINR || 50,
  estimatedDeliveryMinutes: savedCart.estimatedDeliveryMinutes || 30,
  withinDeliveryArea: savedCart.withinDeliveryArea ?? true,
  addressGateConfirmed: !!sessionStorage.getItem('masova_delivery_address'),
};
```

Also update the fallback `return` (no localStorage) defaults similarly (all nulls/defaults).

**Step 3: Add new reducers**

Inside the `reducers:` object, add:

```ts
setDeliveryLocation: (state, action: PayloadAction<{
  formatted: string;
  latitude: number;
  longitude: number;
  zone: 'A' | 'B' | 'C' | null;
  deliveryFeeINR: number;
  estimatedDeliveryMinutes: number;
  withinDeliveryArea: boolean;
  storeId: string;
  storeName: string;
}>) => {
  const { formatted, latitude, longitude, zone, deliveryFeeINR,
          estimatedDeliveryMinutes, withinDeliveryArea, storeId, storeName } = action.payload;
  state.deliveryLocation = { formatted, latitude, longitude };
  state.deliveryZone = zone;
  state.deliveryFeeINR = deliveryFeeINR;
  state.deliveryFee = deliveryFeeINR;   // keep in sync
  state.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
  state.withinDeliveryArea = withinDeliveryArea;
  state.selectedStoreId = storeId;
  state.selectedStoreName = storeName;
  state.addressGateConfirmed = true;
  sessionStorage.setItem('masova_delivery_address', JSON.stringify({ formatted, latitude, longitude }));
  saveCartToStorage(state);
},

clearDeliveryLocation: (state) => {
  state.deliveryLocation = null;
  state.deliveryZone = null;
  state.deliveryFeeINR = 50;
  state.deliveryFee = 50;
  state.estimatedDeliveryMinutes = 30;
  state.withinDeliveryArea = true;
  state.addressGateConfirmed = false;
  sessionStorage.removeItem('masova_delivery_address');
},
```

**Step 4: Export new selectors** — add after the existing `selectSelectedStoreName`:

```ts
export const selectDeliveryLocation = (state: { cart: CartState }) => state.cart.deliveryLocation;
export const selectDeliveryFeeINR = (state: { cart: CartState }) => state.cart.deliveryFeeINR;
export const selectDeliveryZone = (state: { cart: CartState }) => state.cart.deliveryZone;
export const selectEstimatedDeliveryMinutes = (state: { cart: CartState }) => state.cart.estimatedDeliveryMinutes;
export const selectWithinDeliveryArea = (state: { cart: CartState }) => state.cart.withinDeliveryArea;
export const selectAddressGateConfirmed = (state: { cart: CartState }) => state.cart.addressGateConfirmed;
```

**Step 5: Export new actions** — add to the existing `export const { ... } = cartSlice.actions`:

```ts
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setSelectedStore,
  setDeliveryLocation,    // ADD
  clearDeliveryLocation,  // ADD
} = cartSlice.actions;
```

**Step 6: TypeScript check**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

**Step 7: Commit**

```bash
git add frontend/src/store/slices/cartSlice.ts
git commit -m "feat(frontend): add delivery location state to cartSlice (zone, fee, ETA)"
```

---

## Task 6: Frontend — `AddressGate` component

**Files:**
- Create: `frontend/src/components/common/AddressGate.tsx`

**Context:** Google Maps is already set up in this project. The API key env var is `VITE_GOOGLE_MAPS_API_KEY`. The existing `useGeocoding` hook at `frontend/src/hooks/useGeocoding.tsx` may already load the Maps script — check it before loading a second instance.

**Step 1: Check existing Google Maps loading**

```bash
grep -r "maps.googleapis" /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend/src --include="*.ts" --include="*.tsx" -l
```

Note which files load the script — AddressGate should reuse the same loader, not add a second `<script>` tag.

**Step 2: Create `AddressGate.tsx`**

```tsx
// frontend/src/components/common/AddressGate.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setDeliveryLocation,
  selectAddressGateConfirmed,
} from '../../store/slices/cartSlice';
import { useLazyFindByLocationQuery } from '../../store/api/storeApi';
import { colors, spacing, typography } from '../../styles/design-tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlaceResult {
  formatted: string;
  latitude: number;
  longitude: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

const AddressGate: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmed = useAppSelector(selectAddressGateConfirmed);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [triggerFindByLocation, { data: locationResult, isFetching }] =
    useLazyFindByLocationQuery();

  // ── Initialize Google Places Autocomplete ──────────────────────────────────

  useEffect(() => {
    if (!inputRef.current || autocompleteRef.current) return;

    // Wait for Google Maps to be loaded (loaded elsewhere in the app)
    const initAutocomplete = () => {
      if (!window.google?.maps?.places) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current!,
        {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry'],
          types: ['geocode'],
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current!.getPlace();
        if (!place.geometry?.location) return;

        setSelectedPlace({
          formatted: place.formatted_address || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
        setError(null);
      });
    };

    // Try immediately, poll if not ready
    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval);
          initAutocomplete();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // ── Fetch store result when place selected ─────────────────────────────────

  useEffect(() => {
    if (!selectedPlace) return;
    triggerFindByLocation({
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
    });
  }, [selectedPlace, triggerFindByLocation]);

  // ── Confirm handler ────────────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    if (!selectedPlace || !locationResult) return;
    setIsConfirming(true);

    const store = locationResult.withinDeliveryArea
      ? locationResult.store
      : locationResult.nearestStore;

    dispatch(setDeliveryLocation({
      formatted: selectedPlace.formatted,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      zone: locationResult.zone,
      deliveryFeeINR: locationResult.withinDeliveryArea ? locationResult.deliveryFeeINR : 0,
      estimatedDeliveryMinutes: locationResult.estimatedDeliveryMinutes,
      withinDeliveryArea: locationResult.withinDeliveryArea,
      storeId: store?.storeCode ?? '',
      storeName: store?.name ?? '',
    }));

    setIsConfirming(false);
  }, [selectedPlace, locationResult, dispatch]);

  // ── Don't render if already confirmed ─────────────────────────────────────

  if (confirmed) return null;

  // ── Result card content ────────────────────────────────────────────────────

  const renderResult = () => {
    if (isFetching) {
      return (
        <div style={styles.resultCard}>
          <span style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            Finding nearest store...
          </span>
        </div>
      );
    }

    if (!locationResult || !selectedPlace) return null;

    if (locationResult.withinDeliveryArea && locationResult.store) {
      const s = locationResult.store;
      return (
        <div style={{ ...styles.resultCard, borderColor: '#22c55e' }}>
          <div style={styles.resultIcon}>✅</div>
          <div>
            <div style={styles.resultTitle}>Delivering from {s.name}</div>
            <div style={styles.resultSub}>
              {s.city} · {s.distanceKm.toFixed(1)} km away
            </div>
            <div style={styles.resultMeta}>
              Zone {locationResult.zone} ·{' '}
              <strong>₹{locationResult.deliveryFeeINR}</strong> delivery ·{' '}
              ~{locationResult.estimatedDeliveryMinutes} min
            </div>
          </div>
        </div>
      );
    }

    // Outside radius — show pickup suggestion
    const nearest = locationResult.nearestStore;
    return (
      <div style={{ ...styles.resultCard, borderColor: '#f59e0b' }}>
        <div style={styles.resultIcon}>📍</div>
        <div>
          <div style={styles.resultTitle}>Delivery not available in your area</div>
          {nearest && (
            <div style={styles.resultSub}>
              Nearest store: {nearest.name} ({nearest.distanceKm.toFixed(1)} km)
            </div>
          )}
          <div style={styles.resultMeta}>You can still order for Pickup</div>
        </div>
      </div>
    );
  };

  const canConfirm = selectedPlace && locationResult && !isFetching;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <span style={styles.brandText}>MaSoVa</span>
          <span style={styles.brandSub}>Fresh food, delivered fast</span>
        </div>

        <h2 style={styles.heading}>Where are we delivering?</h2>
        <p style={styles.subheading}>
          Enter your delivery address to find your nearest store and see delivery options.
        </p>

        {/* Address Input */}
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}>📍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter your area, street or pincode..."
            style={styles.input}
            onChange={() => {
              // Clear previous selection if user edits the text
              setSelectedPlace(null);
            }}
          />
        </div>

        {/* Result Card */}
        {renderResult()}

        {/* Error */}
        {error && (
          <div style={styles.errorText}>{error}</div>
        )}

        {/* CTA */}
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isConfirming}
          style={{
            ...styles.confirmBtn,
            opacity: canConfirm && !isConfirming ? 1 : 0.5,
            cursor: canConfirm && !isConfirming ? 'pointer' : 'not-allowed',
          }}
        >
          {locationResult?.withinDeliveryArea === false
            ? 'Continue with Pickup'
            : 'Find Food Near Me'}
        </button>
      </div>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: colors.surface.primary,
    borderRadius: '20px',
    padding: spacing[8],
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  brandText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.brand.primary,
    letterSpacing: '-0.5px',
  },
  brandSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: '2px',
  },
  heading: {
    margin: 0,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subheading: {
    margin: 0,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing[3],
    fontSize: '16px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[8]}`,
    border: `2px solid ${colors.surface.border}`,
    borderRadius: '12px',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.primary,
    background: colors.surface.secondary,
    color: colors.text.primary,
    outline: 'none',
    boxSizing: 'border-box',
  },
  resultCard: {
    display: 'flex',
    gap: spacing[3],
    padding: spacing[4],
    border: '2px solid',
    borderRadius: '12px',
    background: colors.surface.secondary,
    alignItems: 'flex-start',
  },
  resultIcon: {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px',
  },
  resultTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: '2px',
  },
  resultSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: '4px',
  },
  resultMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  confirmBtn: {
    width: '100%',
    padding: `${spacing[4]} ${spacing[6]}`,
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '12px',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.primary,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
};

export default AddressGate;
```

**Note:** `useLazyFindByLocationQuery` — add this export to `storeApi.ts` exports if RTK Query generates it automatically (it should from `findByLocation: builder.query`). RTK Query auto-generates both `useFindByLocationQuery` and `useLazyFindByLocationQuery`.

**Step 3: TypeScript check**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npx tsc --noEmit 2>&1 | grep -i "AddressGate\|addressgate" | head -20
```

Fix any type errors before proceeding.

**Step 4: Commit**

```bash
git add frontend/src/components/common/AddressGate.tsx
git commit -m "feat(frontend): add AddressGate component with Google Places autocomplete"
```

---

## Task 7: Frontend — Wire `AddressGate` into `App.tsx`

**Files:**
- Modify: `frontend/src/App.tsx`

**Context:** `App.tsx` uses `React.lazy` for all page components. `AddressGate` should render inside the Redux `<Provider>` and `<Router>` context, wrapping only the customer-facing routes. It should NOT appear for manager, staff, kitchen, driver, or POS routes.

**Step 1: Read the full App.tsx first**

```bash
cat /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend/src/App.tsx
```

**Step 2: Import AddressGate**

Near the top of `App.tsx`, after the existing component imports, add:

```tsx
import AddressGate from './components/common/AddressGate';
```

(Not lazy-loaded — it's a gate, needs to be synchronous)

**Step 3: Create a `CustomerGate` wrapper component**

Inside `App.tsx`, before the `export default App` function, add:

```tsx
// Wraps customer-facing routes with the AddressGate
const CustomerGate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <AddressGate />
    {children}
  </>
);
```

**Step 4: Wrap customer routes**

In the JSX routes, wrap ONLY the public customer routes (HomePage, PublicMenuPage, CheckoutPage, CartPage, CustomerDashboard etc.) with `<CustomerGate>`. Do NOT wrap `/manager`, `/staff`, `/kitchen`, `/driver`, `/pos`.

Example pattern — find the customer routes section and wrap:
```tsx
<Route path="/" element={<CustomerGate><Suspense fallback={<AppLoader />}><HomePage /></Suspense></CustomerGate>} />
<Route path="/menu" element={<CustomerGate><Suspense fallback={<AppLoader />}><PublicMenuPage /></Suspense></CustomerGate>} />
```

Or wrap at the layout level if a customer layout component exists.

**Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 6: Test in browser**

Start the frontend (`npm run dev` in `/frontend`), navigate to `http://localhost:5173/` — the AddressGate modal should appear. Entering an address and confirming should dismiss it.

**Step 7: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): wire AddressGate into App.tsx for customer routes"
```

---

## Task 8: Frontend — Replace hardcoded ₹50 with Redux `deliveryFeeINR`

**Files:**
- Modify: `frontend/src/apps/POSSystem/components/OrderPanel.tsx`
- Modify: `frontend/src/pages/customer/CartPage.tsx`

**Step 1: `OrderPanel.tsx` — read the delivery fee from props**

`OrderPanel.tsx` already calculates `deliveryFee` from a hardcoded `50`. The POS doesn't use AddressGate (it's staff-facing), so leave POS logic alone — it uses its own order type. No change needed here unless the POS uses Redux delivery fee. Skip this file.

**Step 2: `CartPage.tsx` — use Redux `deliveryFeeINR`**

Read the current CartPage:
```bash
cat /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend/src/pages/customer/CartPage.tsx | head -80
```

Find where `deliveryFee` is referenced. Replace hardcoded fee with Redux selector:

```tsx
import { selectDeliveryFeeINR, selectWithinDeliveryArea, selectEstimatedDeliveryMinutes } from '../../store/slices/cartSlice';

// In the component:
const deliveryFeeINR = useAppSelector(selectDeliveryFeeINR);
const withinDeliveryArea = useAppSelector(selectWithinDeliveryArea);
const estimatedMinutes = useAppSelector(selectEstimatedDeliveryMinutes);
```

Replace any hardcoded `50` or `deliveryFee: 50` with `deliveryFeeINR`.

Show the delivery ETA if available:
```tsx
<span>{withinDeliveryArea ? `₹${deliveryFeeINR} · ~${estimatedMinutes} min` : 'Pickup only'}</span>
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add frontend/src/pages/customer/CartPage.tsx
git commit -m "feat(frontend): use Redux deliveryFeeINR in CartPage instead of hardcoded 50"
```

---

## Task 9: Frontend — Simplify `StoreSelector.tsx`

**Files:**
- Modify: `frontend/src/components/StoreSelector.tsx`

**Context:** StoreSelector currently does GPS auto-select on mount. With AddressGate in place, this is no longer needed for the customer variant. We simplify it to: show selected store name + "Change" link that clears `addressGateConfirmed` to re-show the gate.

**Step 1: Update customer variant of StoreSelector**

In `StoreSelector.tsx`, remove the `useEffect` GPS auto-select block (lines ~94-122).

Add a "Change" button for the customer variant that dispatches `clearDeliveryLocation`:

```tsx
import { clearDeliveryLocation } from '../store/slices/cartSlice';

// In handleStoreSelect or as a new handler:
const handleChangeAddress = () => {
  dispatch(clearDeliveryLocation());
};
```

In the button render, add a small "Change" link next to the store name for the customer variant:

```tsx
{variant === 'customer' && selectedStoreId && (
  <button
    onClick={handleChangeAddress}
    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
  >
    Change
  </button>
)}
```

Keep the full dropdown for `variant === 'manager'` unchanged.

**Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add frontend/src/components/StoreSelector.tsx
git commit -m "feat(frontend): simplify StoreSelector — remove GPS auto-select, add Change link"
```

---

## Task 10: End-to-end verification

**Step 1: Start backend**

```bash
# In MaSoVa-restaurant-management-system root
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn21 -pl core-service -am spring-boot:run &
```

Wait for "Started CoreServiceApplication" in logs.

**Step 2: Test the endpoint**

```bash
# Bangalore city center coords
curl -s "http://localhost:8085/api/stores/public/find-by-location?latitude=12.9716&longitude=77.5946" | python3 -m json.tool
```

Expected response shape:
```json
{
  "withinDeliveryArea": true | false,
  "store": { "name": "...", "storeCode": "DOM001", "distanceKm": 2.3 },
  "nearestStore": { "name": "..." },
  "zone": "A",
  "deliveryFeeINR": 30.0,
  "estimatedDeliveryMinutes": 15,
  "distanceKm": 2.3
}
```

**Step 3: Start frontend**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm run dev
```

**Step 4: Manual browser test checklist**

- [ ] Navigate to `http://localhost:5173/` — AddressGate modal appears
- [ ] Type an address in the input — Places autocomplete dropdown shows
- [ ] Select an address — result card appears with store name, zone, fee, ETA
- [ ] Click "Find Food Near Me" — gate dismisses, menu loads
- [ ] Refresh page — gate does NOT reappear (sessionStorage persists)
- [ ] Click "Change" in header StoreSelector — gate reappears
- [ ] Navigate to `/manager` — gate does NOT appear

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Domino's-style address gate with distance-based delivery pricing — complete"
```

---

## Summary of all files changed

| File | Change |
|------|--------|
| `core-service/.../dto/LocationQueryResult.java` | **CREATE** — response DTO |
| `core-service/.../service/StoreService.java` | **MODIFY** — add `findByLocation()` |
| `core-service/.../controller/StoreController.java` | **MODIFY** — add `GET /stores/public/find-by-location` |
| `frontend/src/store/api/storeApi.ts` | **MODIFY** — add `findByLocation` query |
| `frontend/src/store/slices/cartSlice.ts` | **MODIFY** — add delivery location state |
| `frontend/src/components/common/AddressGate.tsx` | **CREATE** — gate component |
| `frontend/src/App.tsx` | **MODIFY** — wire AddressGate |
| `frontend/src/pages/customer/CartPage.tsx` | **MODIFY** — use Redux delivery fee |
| `frontend/src/components/StoreSelector.tsx` | **MODIFY** — simplify, add Change link |
