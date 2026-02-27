# React Native Driver App Migration Plan

## Executive Summary

Convert the existing web-based Driver App to a production-ready React Native mobile application using the **Hybrid-Native approach** (industry standard for delivery apps). The app will use React Native for 90% of UI while implementing critical features (Background GPS + Push Notifications) in pure native code (Kotlin/Swift) to ensure reliability when the driver's screen is locked.

**Timeline:** 12 weeks
**Platforms:** iOS + Android
**Distribution:** Free (TestFlight + Google Play Internal Testing)

---

## Technology Stack

### Core Framework
- **React Native 0.75+** (Bare workflow - NOT Expo Managed)
- **TypeScript 5.8+** (existing codebase language)
- **Redux Toolkit + RTK Query** (reuse existing state management - 100% compatible)

### Native Modules (Custom Implementation)
- **Android GPS:** FusedLocationProviderClient + Foreground Service (Kotlin)
- **iOS GPS:** CLLocationManager + Background Location Updates (Swift)
- **Push Notifications:** Firebase Cloud Messaging (free, cross-platform)
- **Camera:** react-native-vision-camera (proof of delivery photos)
- **Offline Storage:** SQLite (action queue for offline mode)

### UI & Navigation
- **React Native Paper** (Material Design - matches existing MUI aesthetic)
- **React Navigation v6** (bottom tabs + stack navigation)
- **react-native-maps** (free - Apple Maps on iOS, Google Maps on Android)

### Reusable from Web App (70% of code)
- Redux store + RTK Query API slices (driverApi, orderApi, sessionApi)
- WebSocket service (STOMP/SockJS - works in React Native)
- Design tokens (colors, typography, spacing)
- Business logic and API integration

---

## Critical Files to Migrate

### High Priority - Core Business Logic (Copy with minimal changes)
1. `/frontend/src/apps/DriverApp/pages/DeliveryHomePage.tsx` → `src/screens/DeliveryHomeScreen.tsx`
   - GPS tracking, online/offline toggle, real-time stats
   - Replace Material-UI with React Native components

2. `/frontend/src/services/websocketService.ts` → `src/services/websocketService.ts`
   - STOMP/SockJS WebSocket service (works as-is in React Native)

3. `/frontend/src/store/api/driverApi.ts` → `src/store/api/driverApi.ts`
   - RTK Query endpoints (copy directly, change localStorage → AsyncStorage)

4. `/frontend/src/styles/driver-design-tokens.ts` → `src/styles/driverDesignTokens.ts`
   - Uber color palette, typography, spacing (convert to React Native StyleSheet)

5. `/frontend/src/apps/DriverApp/pages/ActiveDeliveryPage.tsx` → `src/screens/ActiveDeliveryScreen.tsx`
   - Active delivery screen with customer contact and navigation

### Medium Priority - UI Components (Rewrite)
- `/frontend/src/apps/DriverApp/components/shared/*` → `src/components/shared/*`
  - ActionButton: Material-UI Button → TouchableOpacity + custom styling
  - DeliveryCard: Box → View, Typography → Text
  - MetricCard: Box → View with icons
  - StatusBadge: Box → View with Animated API
  - StatsChart: recharts → react-native-chart-kit

### New Files - Native Modules
- `android/app/src/main/java/com/masovadriverapp/location/LocationService.kt` - Android GPS foreground service
- `ios/MaSoVaDriverApp/Location/LocationManager.swift` - iOS background location tracking
- `src/modules/LocationModule.ts` - React Native bridge for GPS
- `src/modules/NotificationModule.ts` - React Native bridge for push notifications
- `src/services/offlineQueue.ts` - SQLite offline action queue

---

## Implementation Phases (12 Weeks)

### Phase 1: Setup & Foundation (Week 1-2)

**Goal:** Get empty React Native app running with navigation skeleton

**Tasks:**
1. Initialize bare React Native project:
   ```bash
   npx react-native@latest init MaSoVaDriverApp --template react-native-template-typescript
   ```

2. Install core dependencies:
   ```bash
   npm install @reduxjs/toolkit react-redux redux-persist
   npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
   npm install react-native-paper react-native-vector-icons
   npm install @react-native-async-storage/async-storage
   npm install @stomp/stompjs sockjs-client
   ```

3. Set up project structure:
   ```
   src/
   ├── screens/           # 4 main screens (Home, Active, History, Profile)
   ├── components/        # Shared UI components
   ├── navigation/        # React Navigation setup
   ├── store/            # Redux + RTK Query (copy from web)
   ├── services/         # WebSocket, location, notifications
   ├── modules/          # Native module bridges
   └── styles/           # Design tokens
   ```

4. Configure EAS Build (free cloud builds):
   ```bash
   npm install -g eas-cli
   eas build:configure
   ```

**Deliverables:**
- App builds on Android and iOS
- Bottom tab navigation working (4 tabs)
- Hot reload functional

**Success Metrics:**
- Empty screens render on both platforms
- Navigation transitions smooth

---

### Phase 2: Core UI Migration (Week 3-5)

**Goal:** Migrate all 4 screens from Material-UI to React Native

**Tasks:**

1. **Migrate Design Tokens** (`driver-design-tokens.ts`):
   ```typescript
   // Convert CSS to React Native StyleSheet
   export const colors = {
     primary: { green: '#00B14F', black: '#000000' }, // Same
     // ...
   };

   export const spacing = {
     xs: 4, base: 8, md: 16, // Same values, remove 'px'
     // ...
   };
   ```

2. **Create Shared Components:**
   - ActionButton (TouchableOpacity + Text + neumorphic shadow)
   - DeliveryCard (View + Text + animations)
   - MetricCard (View + icons + stats)
   - StatusBadge (Animated.View with pulse effect)

3. **Migrate Screens:**

   **DeliveryHomeScreen** (from DeliveryHomePage.tsx):
   - Replace MUI Box → View
   - Replace Typography → Text
   - Replace Button → TouchableOpacity
   - Keep GPS logic (will connect to native module later)
   - Keep WebSocket service as-is

   **ActiveDeliveryScreen** (from ActiveDeliveryPage.tsx):
   - Replace MUI List → FlatList
   - Replace Card → Custom DeliveryCard component
   - Keep order status mutation logic

   **DeliveryHistoryScreen** (from DeliveryHistoryPage.tsx):
   - Replace timeline UI with FlatList + custom styling

   **DriverProfileScreen** (from DriverProfilePage.tsx):
   - Replace form components with React Native TextInput
   - Add logout functionality

4. **Set up React Native Paper Theming:**
   ```typescript
   const theme = {
     ...DefaultTheme,
     colors: {
       ...DefaultTheme.colors,
       primary: '#00B14F', // Uber green
     },
   };
   ```

**Deliverables:**
- All 4 screens visually match web design (80% parity)
- Bottom tabs with icons working
- Component library established

**Success Metrics:**
- No layout shifts or UI bugs
- Smooth animations (60 FPS)
- Design tokens applied consistently

---

### Phase 3: Native Modules Implementation (Week 6-8)

**Goal:** Implement background GPS, push notifications, camera, offline queue

**Tasks:**

#### 1. **Android Background GPS** (Kotlin)

Create `android/app/src/main/java/com/masovadriverapp/location/LocationService.kt`:
```kotlin
class LocationService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Create foreground notification (required for Android 8+)
        startForeground(NOTIFICATION_ID, createNotification())

        // Start high-accuracy GPS tracking
        fusedLocationClient.requestLocationUpdates(
            LocationRequest.create().apply {
                interval = 10000 // 10 seconds
                priority = LocationRequest.PRIORITY_HIGH_ACCURACY
            },
            locationCallback,
            Looper.getMainLooper()
        )

        return START_STICKY // Restart service if killed
    }
}
```

#### 2. **iOS Background GPS** (Swift)

Create `ios/MaSoVaDriverApp/Location/LocationManager.swift`:
```swift
class LocationManager: NSObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()

    func startTracking() {
        locationManager.requestAlwaysAuthorization()
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false

        // Adaptive strategy: high accuracy when active, significant-change when backgrounded
        if UIApplication.shared.applicationState == .active {
            locationManager.startUpdatingLocation()
        } else {
            locationManager.startMonitoringSignificantLocationChanges()
        }
    }
}
```

#### 3. **React Native GPS Bridge**

Create `src/modules/LocationModule.ts`:
```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';

const { LocationModule } = NativeModules;
const locationEmitter = new NativeEventEmitter(LocationModule);

export const LocationService = {
  startTracking: () => LocationModule.startTracking(),
  stopTracking: () => LocationModule.stopTracking(),
  onLocationUpdate: (callback) => {
    return locationEmitter.addListener('onLocationUpdate', callback);
  }
};
```

#### 4. **Firebase Cloud Messaging (Push Notifications)**

Install dependencies:
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

Create Firebase project and download config files:
- `google-services.json` → `android/app/`
- `GoogleService-Info.plist` → `ios/MaSoVaDriverApp/`

Implement notification handler:
```typescript
// src/services/notificationService.ts
import messaging from '@react-native-firebase/messaging';

export const NotificationService = {
  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
  },

  async getToken() {
    return await messaging().getToken();
  },

  onMessage(handler) {
    return messaging().onMessage(handler);
  },

  setBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      // Handle background notification
      console.log('Background notification:', remoteMessage);
    });
  }
};
```

#### 5. **Camera (Proof of Delivery)**

Install:
```bash
npm install react-native-vision-camera
```

Create camera screen:
```typescript
// src/screens/ProofOfDeliveryScreen.tsx
import { Camera, useCameraDevice } from 'react-native-vision-camera';

export const ProofOfDeliveryScreen = ({ orderId }) => {
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);

  const takePhoto = async () => {
    const photo = await camera.current?.takePhoto();
    await uploadProofOfDelivery(orderId, photo.path);
  };
};
```

#### 6. **Offline Queue (SQLite)**

Install:
```bash
npm install react-native-sqlite-storage
```

Create offline queue service:
```typescript
// src/services/offlineQueue.ts
class OfflineQueue {
  async enqueue(action: 'location_update' | 'order_status', payload: any) {
    await db.executeSql(
      'INSERT INTO action_queue (action_type, payload, timestamp) VALUES (?, ?, ?)',
      [action, JSON.stringify(payload), Date.now()]
    );
  }

  async processQueue() {
    const items = await db.executeSql('SELECT * FROM action_queue');
    for (let item of items) {
      try {
        await this.processAction(item.action_type, JSON.parse(item.payload));
        await db.executeSql('DELETE FROM action_queue WHERE id = ?', [item.id]);
      } catch (error) {
        // Retry later
      }
    }
  }
}
```

**Deliverables:**
- GPS tracking works in background (screen locked)
- Push notifications delivered within 5 seconds
- Camera captures photos
- Offline actions queued and synced

**Success Metrics:**
- GPS updates every 10 seconds (±2 sec accuracy)
- Battery drain <5% per hour during active delivery
- 100% notification delivery rate
- 0% data loss in offline queue

---

### Phase 4: State Management & API Integration (Week 9-10)

**Goal:** Connect Redux store, RTK Query, and WebSocket service

**Tasks:**

1. **Copy Redux Store from Web:**
   ```
   /frontend/src/store/ → src/store/
   ```

   Changes required:
   - Replace all `localStorage` with `AsyncStorage`:
     ```typescript
     // Before
     localStorage.setItem('auth', JSON.stringify(state));

     // After
     import AsyncStorage from '@react-native-async-storage/async-storage';
     await AsyncStorage.setItem('auth', JSON.stringify(state));
     ```

2. **Set up redux-persist** (auto-persist auth state):
   ```typescript
   import { persistStore, persistReducer } from 'redux-persist';
   import AsyncStorage from '@react-native-async-storage/async-storage';

   const persistConfig = {
     key: 'root',
     storage: AsyncStorage,
     whitelist: ['auth'] // Only persist auth
   };
   ```

3. **Copy RTK Query API Slices** (no changes needed):
   - `driverApi.ts` - Driver status, performance, location
   - `orderApi.ts` - Order management
   - `sessionApi.ts` - Clock in/out
   - `deliveryApi.ts` - Route optimization

4. **Copy WebSocket Service** (works as-is):
   ```
   /frontend/src/services/websocketService.ts → src/services/websocketService.ts
   ```

   No changes needed - STOMP.js works in React Native!

5. **Integrate GPS with WebSocket:**
   ```typescript
   // src/screens/DeliveryHomeScreen.tsx
   useEffect(() => {
     const unsubscribe = LocationService.onLocationUpdate((location) => {
       // Send to backend via WebSocket
       websocketService.sendLocationUpdate(driverId, location);
     });

     return unsubscribe;
   }, [driverId]);
   ```

6. **Test End-to-End Flow:**
   - Login → Token stored in AsyncStorage
   - Go online → GPS starts tracking
   - Accept delivery → Order status updated
   - Navigate → GPS sends updates every 10 sec
   - Mark delivered → Camera opens for proof photo
   - Upload photo → Order completed

**Deliverables:**
- All API endpoints working
- WebSocket real-time updates functional
- State persisted across app restarts
- Complete delivery flow working

**Success Metrics:**
- 100% API endpoint success rate
- WebSocket connects within 2 seconds
- State persists after force-quit

---

### Phase 5: Testing, Optimization & Distribution (Week 11-12)

**Goal:** Production-ready app distributed to drivers

**Tasks:**

#### 1. **Testing**

**Unit Tests (Jest + React Native Testing Library):**
```typescript
// __tests__/DeliveryHomeScreen.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import DeliveryHomeScreen from '../src/screens/DeliveryHomeScreen';

test('displays online status badge', () => {
  const { getByText } = render(<DeliveryHomeScreen />);
  expect(getByText('Online')).toBeTruthy();
});
```

Target: 70% code coverage

**E2E Tests (Detox):**
```typescript
// e2e/deliveryFlow.test.js
describe('Complete Delivery Flow', () => {
  it('should complete delivery from acceptance to proof upload', async () => {
    await element(by.id('active-tab')).tap();
    await element(by.id('delivery-card-0')).tap();
    await element(by.id('navigate-btn')).tap();
    await element(by.id('mark-delivered-btn')).tap();
    await element(by.id('capture-photo-btn')).tap();
    await expect(element(by.text('Delivery Completed'))).toBeVisible();
  });
});
```

**Manual QA Testing:**
- Test on 5+ devices (Android 8-14, iOS 13-17)
- Test poor network conditions
- Test background GPS (lock screen, force-quit, etc.)
- Test battery drain over 4-hour shift

#### 2. **Performance Optimization**

**Enable Hermes Engine** (50% faster startup):
```javascript
// android/app/build.gradle
project.ext.react = [
    enableHermes: true
]
```

**ProGuard/R8 (Android - reduce APK size 30%)**:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

**Batch GPS Updates** (reduce battery drain):
```typescript
const batchedLocationUpdates = debounce((location) => {
  websocketService.sendLocationUpdate(driverId, location);
}, 5000); // Send max once per 5 seconds
```

**Measure Battery Drain:**
- Target: <5% per hour during active delivery
- Use Android Battery Historian / Xcode Energy Log

#### 3. **Build Configuration**

**EAS Build Profiles** (`eas.json`):
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

**Build Commands:**
```bash
# Preview builds (for internal testing)
eas build --profile preview --platform all

# Production builds (for app stores)
eas build --profile production --platform all
```

#### 4. **Distribution Setup**

**Google Play Internal Testing (FREE):**
1. Create app in Play Console
2. Upload APK via EAS Submit:
   ```bash
   eas submit --platform android --profile preview
   ```
3. Add tester emails
4. Share internal testing link with drivers

**TestFlight (FREE, iOS):**
1. Create app in App Store Connect
2. Upload build via EAS Submit:
   ```bash
   eas submit --platform ios --profile preview
   ```
3. Add tester emails
4. Drivers install via TestFlight app

**Deliverables:**
- Android APK and iOS IPA production builds
- Test coverage report (70%+)
- Battery usage report (<5% drain/hour)
- First 10 drivers using app

**Success Metrics:**
- 0 critical bugs
- 99.5% crash-free rate
- Bundle size <30 MB
- Cold start time <3 seconds

---

## Distribution Strategy (FREE)

### Phase 1: Internal Testing (Month 1-2)
- **Android:** Google Play Internal Testing Track (unlimited testers, FREE)
- **iOS:** TestFlight (10,000 testers, FREE)
- Distribute to 10-20 drivers for feedback

### Phase 2: Beta Testing (Month 3-4)
- **Android:** Google Play Closed Beta (20,000 testers)
- **iOS:** TestFlight External Beta (public link)
- Staged rollout: 10% → 50% → 100% of drivers

### Phase 3: Production (Month 5+)
- **Android:** Google Play Store ($25 one-time fee)
- **iOS:** Apple App Store ($99/year) - REQUIRED for production

**Alternative (to avoid iOS cost initially):**
- Use TestFlight indefinitely (FREE, but builds expire after 90 days)
- Re-upload new build every 90 days

---

## File Structure (Final)

```
MaSoVaDriverApp/
├── android/
│   └── app/src/main/java/com/masovadriverapp/
│       ├── location/
│       │   └── LocationService.kt          # Background GPS
│       └── notifications/
│           └── NotificationModule.kt       # FCM native
│
├── ios/
│   └── MaSoVaDriverApp/
│       ├── Location/
│       │   └── LocationManager.swift       # Background GPS
│       └── Notifications/
│           └── NotificationModule.swift    # APNs/FCM
│
├── src/
│   ├── screens/
│   │   ├── DeliveryHomeScreen.tsx          # Home with GPS
│   │   ├── ActiveDeliveryScreen.tsx        # Active deliveries
│   │   ├── DeliveryHistoryScreen.tsx       # History timeline
│   │   ├── DriverProfileScreen.tsx         # Profile & settings
│   │   └── ProofOfDeliveryScreen.tsx       # Camera screen
│   │
│   ├── components/shared/
│   │   ├── ActionButton.tsx                # Custom button
│   │   ├── DeliveryCard.tsx                # Order card
│   │   ├── MetricCard.tsx                  # Stats card
│   │   ├── StatusBadge.tsx                 # Status indicator
│   │   └── StatsChart.tsx                  # Charts
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx                # Bottom tabs + stack
│   │
│   ├── store/                              # COPIED FROM WEB
│   │   ├── api/
│   │   │   ├── driverApi.ts                # RTK Query
│   │   │   ├── orderApi.ts
│   │   │   ├── sessionApi.ts
│   │   │   └── deliveryApi.ts
│   │   ├── slices/
│   │   │   └── authSlice.ts
│   │   └── store.ts                        # Redux store
│   │
│   ├── services/
│   │   ├── websocketService.ts             # COPIED FROM WEB
│   │   ├── locationService.ts              # Native GPS wrapper
│   │   ├── notificationService.ts          # FCM wrapper
│   │   └── offlineQueue.ts                 # SQLite queue
│   │
│   ├── modules/
│   │   ├── LocationModule.ts               # Native bridge
│   │   ├── NotificationModule.ts           # Native bridge
│   │   └── CameraModule.ts                 # Native bridge
│   │
│   ├── styles/
│   │   └── driverDesignTokens.ts           # COPIED FROM WEB
│   │
│   └── App.tsx
│
├── package.json
├── eas.json                                # EAS Build config
└── tsconfig.json
```

---

## Success Metrics

### Technical KPIs
- **GPS Accuracy:** 95% of updates within 10 meters
- **Battery Efficiency:** <5% drain per hour during delivery
- **Real-Time Latency:** <2 seconds for order updates
- **Crash-Free Rate:** >99.5%
- **Bundle Size:** <30 MB
- **Cold Start:** <3 seconds

### Business KPIs
- **Driver Adoption:** 80% using app within 3 months
- **Delivery Completion:** 95% via app
- **Driver Satisfaction:** 4.5/5 stars
- **Support Tickets:** <5% of deliveries

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Background GPS fails on Android 12+ | Use WorkManager + AlarmManager fallback |
| iOS background location rejected by App Store | Clear privacy policy, use significant-change API |
| Battery drain too high | Adaptive intervals, significant-change monitoring |
| Push notifications not delivered | Implement fallback polling |
| WebSocket reconnection issues | Exponential backoff, queue messages |
| Offline data loss | WAL mode SQLite, auto-backup to AsyncStorage |

---

## Post-Launch Roadmap

### Month 1-3: Stabilization
- Monitor crash reports (Firebase Crashlytics)
- Fix critical bugs
- Optimize battery based on real-world data

### Month 4-6: Enhancements
- Offline maps (download map tiles)
- Voice navigation
- Multi-language support
- Dark mode

### Month 7-12: Advanced Features
- AR navigation
- Multi-stop route optimization
- Driver earnings forecasting
- Wearable integration (Apple Watch)

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Set up development environment** - Install Xcode, Android Studio, Node
3. **Initialize React Native project** - Run `npx react-native init`
4. **Begin Phase 1** - Set up navigation and project structure
