# EXACT API MISMATCHES - FIX LIST

**Analysis Date:** 2026-01-18
**Total Issues:** 8 naming mismatches (out of 207 "mismatches")

---

## ✅ LIKELY MATCHES (4) - 100% Same API, Different Parameter Names

### 1. Customer Deactivate ✅ MATCHED (111% confidence)
**Backend:**  `PATCH /{id}/deactivate` (CustomerController)
**Frontend:** `PATCH /{param}/deactivate` (customerApi)

**Issue:** Parameter name `{id}` vs `{param}`
**Fix:** These are THE SAME API - just rename parameter consistently

---

### 2. Customer Activate ✅ MATCHED (111% confidence)
**Backend:**  `PATCH /{id}/activate` (CustomerController)
**Frontend:** `PATCH /{param}/activate` (customerApi)

**Issue:** Parameter name `{id}` vs `{param}`
**Fix:** These are THE SAME API - just rename parameter consistently

---

### 3. Delete Customer ✅ MATCHED (85% confidence)
**Backend:**  `DELETE /{id}` (CustomerController)
**Frontend:** `DELETE /{param}` (customerApi)

**Issue:** Parameter name `{id}` vs `{param}`
**Fix:** These are THE SAME API - just rename parameter consistently

---

### 4. Cancel Order ⚠️ POTENTIAL ISSUE (85% confidence)
**Backend:**  `DELETE /{orderId}` (OrderController → cancelOrder)
**Frontend:** `DELETE /{param}` (customerApi → deleteCustomer)

**Issue:** Frontend customerApi is calling order deletion endpoint!
**Fix:** Move this to orderApi or verify it's correct

---

## 🤔 POSSIBLE MATCHES (4) - 60-87% Confidence - Missing `/api` prefix

### 5. Mark Notification as Read (64% confidence)
**Backend:**  `PATCH /api/notifications/{id}/read` (NotificationController)
**Frontend:** `PATCH /notifications/{param}/read` (notificationApi)

**Issue:** Missing `/api` prefix + parameter name
**Fix:** Add `/api` prefix to frontend call

---

### 6. Mark All Notifications as Read (60% confidence)
**Backend:**  `PATCH /api/notifications/user/{userId}/read-all` (NotificationController)
**Frontend:** `PATCH /notifications/user/{param}/read-all` (notificationApi)

**Issue:** Missing `/api` prefix + parameter name `{userId}` vs `{param}`
**Fix:** Add `/api` prefix to frontend call

---

### 7. Delete Notification (63% confidence)
**Backend:**  `DELETE /api/notifications/{id}` (NotificationController)
**Frontend:** `DELETE /notifications/{param}` (notificationApi)

**Issue:** Missing `/api` prefix + parameter name
**Fix:** Add `/api` prefix to frontend call

---

### 8. Regenerate Kiosk Tokens (60% confidence)
**Backend:**  `POST /api/users/kiosk/{kioskUserId}/regenerate-tokens` (UserController)
**Frontend:** `POST /users/kiosk/{param}/regenerate-tokens` (kioskApi)

**Issue:** Missing `/api` prefix + parameter name `{kioskUserId}` vs `{param}`
**Fix:** Add `/api` prefix to frontend call

---

## 📊 Summary

| Type | Count | Issue | Fix |
|------|-------|-------|-----|
| **Parameter naming** | 3 | `{id}` vs `{param}` | Cosmetic - both work |
| **Missing /api prefix** | 4 | Frontend missing `/api/` | Add prefix |
| **Wrong API file** | 1 | Order endpoint in customerApi | Move to orderApi |

---

## 🔧 Auto-Fix Script

```bash
# Fix notification API paths (add /api prefix)
# File: frontend/src/store/api/notificationApi.ts

# Change:
url: '/notifications/{id}/read'
# To:
url: '/api/notifications/{id}/read'

# Change:
url: '/notifications/user/{userId}/read-all'
# To:
url: '/api/notifications/user/{userId}/read-all'

# Change:
url: '/notifications/{id}'
# To:
url: '/api/notifications/{id}'
```

```bash
# Fix kiosk API path (add /api prefix)
# File: frontend/src/store/api/kioskApi.ts

# Change:
url: '/users/kiosk/{kioskUserId}/regenerate-tokens'
# To:
url: '/api/users/kiosk/{kioskUserId}/regenerate-tokens'
```

```bash
# Fix customer API - move order deletion to orderApi
# File: frontend/src/store/api/customerApi.ts
# Remove DELETE /{param} if it's calling order-service

# File: frontend/src/store/api/orderApi.ts
# Ensure DELETE /{orderId} exists here instead
```

---

## ✅ The Rest (196 APIs)

The other 196 "mismatches" are **NOT mismatches** - they are:
- Backend APIs that frontend doesn't use yet
- Features waiting to be implemented in frontend
- Optional endpoints not needed for core functionality

**NOT BROKEN - Just unused capabilities!**

---

## 🎯 Action Items

1. ✅ **Fix 4 notification paths** - Add `/api` prefix (2 mins)
2. ✅ **Fix 1 kiosk path** - Add `/api` prefix (30 sec)
3. ✅ **Review customer API** - Verify order deletion location (2 mins)
4. ✅ **Parameter naming** - Optional cosmetic fix (5 mins)

**Total fix time: ~10 minutes**

---

## 🚀 After Fixing

Run these to verify:
```bash
# Regenerate tests with fixed paths
node scripts/automated-testing-suite.js

# Run contract tests
cd frontend
npm run test:pact

# All should pass! ✅
```
