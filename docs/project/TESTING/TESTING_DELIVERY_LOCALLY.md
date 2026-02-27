# 🧪 Testing Delivery Features Locally

## Problem: Testing as Both Driver and Customer

When you're testing locally, you're physically at the same location as both the customer and driver. This makes it impossible to test real GPS-based delivery features. This guide provides solutions.

---

## ✅ SOLUTION 1: Mock GPS Coordinates (Implemented)

The system now **automatically uses mock coordinates** when in development mode.

### How It Works

1. **Test Mode Detection**: Automatically enabled in development (`NODE_ENV === 'development'`)
2. **Mock Locations**: Uses realistic Mumbai coordinates with varying distances
3. **Automatic Switching**: Production mode uses real GPS coordinates

### Mock Locations Used

```
📍 Store: MaSoVa Pizza - Andheri West
  - Latitude: 19.1136
  - Longitude: 72.8697

📍 Customer Locations (randomly selected):
  - NEARBY: Lokhandwala (0.8 km, 5 min)
  - MEDIUM: Versova (2.5 km, 15 min)
  - FAR: Bandra West (5.2 km, 25 min)
  - VERY_FAR: Worli (12 km, 45 min)
```

### Using Mock Coordinates

**No configuration needed!** Just use the app normally:

1. Create a delivery order in POS or Customer App
2. Go to Delivery Management Page as Manager
3. Click "🤖 Auto-Dispatch"
4. System automatically uses mock coordinates
5. You'll see an alert showing the test route details

### Example Alert

```
✅ Driver dispatched!

📍 Test Route:
From: MaSoVa Pizza - Andheri West
To: Versova
Distance: 2.5 km from store - 15 min delivery
```

---

## ✅ SOLUTION 2: Manual Driver Assignment

For more control, manually assign drivers to orders.

### Steps

1. **Click "👤 Choose Driver"** on any ready order
2. **Select a driver** from the list showing:
   - Driver name
   - Phone number
   - Rating (⭐ 4.7)
   - Active deliveries count
3. **Click "Assign Driver"**

### Benefits

- Test specific driver assignment
- Simulate high-workload scenarios (driver with multiple deliveries)
- Test driver ratings impact on auto-dispatch

---

## ✅ SOLUTION 3: Browser GPS Spoofing (Chrome DevTools)

Simulate real GPS movement for driver apps.

### Chrome DevTools Method

1. Open **Driver App** in Chrome
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "sensor" and select **"Show Sensors"**
5. In the Sensors tab, select **"Location"**
6. Choose a preset (e.g., "Tokyo, Japan") or enter custom coordinates:
   ```
   Latitude: 19.1200
   Longitude: 72.8750
   ```
7. Your driver app now thinks it's at that location!

### Test Realistic Delivery Flow

**Driver 1 (Chrome with GPS spoofing):**
```
Location: Near Store (19.1140, 72.8700)
Role: Driver waiting for orders
```

**Driver 2 (Chrome incognito with different GPS):**
```
Location: Far away (19.0900, 72.8500)
Role: Driver on another delivery
```

**Manager (Your main browser):**
```
Click auto-dispatch → Driver 1 should be selected (closer)
```

---

## ✅ SOLUTION 4: Mobile Device GPS Testing

Use actual mobile devices for the most realistic testing.

### Setup

**Your Phone (as Driver):**
1. Install driver app or open driver web app
2. Enable GPS
3. Walk around your neighborhood
4. Accept delivery orders

**Desktop (as Manager):**
1. Create order with mock coordinates
2. Dispatch driver
3. Track driver's real GPS location

### GPS Simulation Apps

If you can't physically move:

**Android:**
- Fake GPS Location (by Lexa)
- GPS Emulator

**iOS:**
- Requires Xcode for GPS simulation (more complex)

---

## 🔧 Configuration Files

### `frontend/.env.local`
```env
# Enable test mode (already set)
VITE_TEST_MODE=true

# API URL
VITE_API_BASE_URL=http://localhost:8080
```

### `frontend/src/config/test-locations.ts`
Modify to add your own test locations:

```typescript
export const MY_CUSTOM_LOCATION: TestLocation = {
  latitude: 19.1234,
  longitude: 72.5678,
  name: "My House",
  description: "1 km from store - 8 min delivery"
};
```

---

## 📊 Test Scenarios

### Scenario 1: Quick Nearby Delivery
```typescript
// Order placed at: Lokhandwala (0.8 km)
// Expected driver: Closest available
// Expected time: 5 minutes
```

### Scenario 2: Medium Distance with Traffic
```typescript
// Order placed at: Versova (2.5 km)
// Expected driver: Best score (considering workload)
// Expected time: 15 minutes
```

### Scenario 3: Long Distance Rush Hour
```typescript
// Order placed at: Bandra West (5.2 km)
// Expected driver: Least busy driver
// Expected time: 25 minutes
```

### Scenario 4: Manual Assignment Override
```typescript
// Order placed at: Worli (12 km)
// Manager manually assigns: Specific driver
// System bypasses auto-dispatch algorithm
```

---

## 🐛 Troubleshooting

### Problem: "Order missing GPS coordinates"

**Cause**: Order created in POS without geocoding

**Solution 1**: Add latitude/longitude manually in MongoDB:
```javascript
db.orders.updateOne(
  { _id: ObjectId("your-order-id") },
  {
    $set: {
      "deliveryAddress.latitude": 19.1200,
      "deliveryAddress.longitude": 72.8750
    }
  }
)
```

**Solution 2**: Order will use mock coordinates in test mode automatically

---

### Problem: "No available drivers"

**Cause**: No drivers with status = AVAILABLE

**Check**:
```bash
# In user-service MongoDB
db.users.find({ type: "DRIVER", status: "AVAILABLE" })
```

**Fix**: Create test driver:
```javascript
db.users.insertOne({
  firstName: "Test",
  lastName: "Driver",
  email: "driver@test.com",
  phone: "9876543210",
  type: "DRIVER",
  status: "AVAILABLE",
  storeId: "your-store-id",
  rating: 4.5
})
```

---

### Problem: Mock coordinates not working

**Check**:
1. Verify `.env.local` has `VITE_TEST_MODE=true`
2. Restart Vite dev server
3. Check browser console for "🧪 TEST MODE" message
4. Ensure you're in development, not production build

---

## 🚀 Moving to Production

When deploying to production, the system automatically:

1. ✅ Disables test mode (`NODE_ENV === 'production'`)
2. ✅ Requires real GPS coordinates
3. ✅ Validates lat/lng exist before dispatch
4. ✅ Uses actual driver locations

**No code changes needed!**

---

## 📱 Recommended Testing Setup

**Optimal 3-Device Setup:**

| Device | Role | Browser/App |
|--------|------|-------------|
| Desktop 1 | Manager | Chrome (main) |
| Desktop 2 (or Phone) | Driver 1 | Chrome Incognito + GPS spoofing |
| Phone | Driver 2 | Mobile browser with real GPS |

**Budget 1-Device Setup:**

| Tab | Role | GPS Setting |
|-----|------|-------------|
| Tab 1 | Manager | Uses mock coordinates |
| Tab 2 (Incognito) | Driver | Chrome DevTools GPS: Location A |
| Tab 3 (Different profile) | Customer | Chrome DevTools GPS: Location B |

---

## 🎯 Quick Start Checklist

- [ ] `.env.local` has `VITE_TEST_MODE=true`
- [ ] Restart Vite dev server
- [ ] Create delivery order
- [ ] Go to Delivery Management
- [ ] Click "🤖 Auto-Dispatch"
- [ ] See test route alert with mock coordinates
- [ ] Try "👤 Choose Driver" for manual assignment

---

## 💡 Pro Tips

1. **Vary test data**: Each auto-dispatch randomly picks different customer locations for variety
2. **Check console**: Look for "📍 Mock Locations" log to see which scenario was used
3. **Test edge cases**: Manually assign drivers with different ratings/workloads
4. **Monitor backend**: Check delivery-service logs to see driver scoring algorithm
5. **Use test drivers**: Create drivers with different ratings (3.0, 4.5, 5.0) to test scoring

---

## 📚 Related Files

- `frontend/src/config/test-locations.ts` - Mock GPS coordinates configuration
- `frontend/src/pages/manager/DeliveryManagementPage.tsx` - Auto-dispatch UI
- `delivery-service/src/main/java/com/MaSoVa/delivery/service/AutoDispatchService.java` - Dispatch logic
- `delivery-service/src/main/java/com/MaSoVa/delivery/dto/AutoDispatchRequest.java` - API contract

---

## 🤝 Need Help?

Common issues:
1. Coordinates still (0, 0) → Check test mode is enabled
2. Driver not assigned → Check driver status = AVAILABLE
3. Modal not showing → Check availableDrivers.length > 0
4. Wrong distance calculated → Backend using Haversine formula (straight line)

Happy Testing! 🚀
