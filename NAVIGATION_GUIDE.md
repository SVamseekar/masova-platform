# MaSoVa Restaurant Management System - Navigation Guide

## Simple & Intuitive Flow

---

## 🍕 For Customers (Public Access)

### **Browse Menu - NO LOGIN REQUIRED**
```
URL: http://localhost:3000/
```

**What you can do:**
- ✅ Browse 65+ menu items across 8 cuisines
- ✅ Filter by cuisine, category, dietary preferences
- ✅ Search for specific dishes
- ✅ Select quantity with +/- buttons
- ✅ Add items to cart (stored in browser)
- ✅ View cart summary

**When you need to login:**
- ❌ NOT needed for browsing
- ❌ NOT needed for adding to cart
- ✅ ONLY when ready to checkout/place order (Phase 4)
- ✅ ONLY for viewing order history (Phase 4)
- ✅ ONLY for payment (Phase 4)

**Flow:**
1. Visit `http://localhost:3000/`
2. Browse menu freely
3. Add items to cart
4. When ready to checkout → Login/Register prompt
5. Complete payment & place order

---

## 👨‍💼 For Managers

### **Manager Dashboard - LOGIN REQUIRED**
```
Staff Login: http://localhost:3000/login
Email: manager@masova.com
Password: Manager@123
```

**After Login → Auto-redirect to:**
```
http://localhost:3000/manager
```

**What you can do:**
- ✅ View store overview (employees, sessions, hours, status)
- ✅ Clock in/out (working session management)
- ✅ View active sessions
- ✅ Manage store settings
- ✅ Manage shifts
- ✅ View employees
- ✅ Access working hours reports

**Navigation:**
- Dashboard has tabs: Overview, Sessions, Store, Shifts, Employees
- Header shows: User name, role (MANAGER), Logout button
- No menu access (managers don't need customer menu)

---

## 👨‍🍳 For Kitchen Staff

### **Kitchen Display - LOGIN REQUIRED**
```
Staff Login: http://localhost:3000/login
Email: kitchen@masova.com
Password: Kitchen@123
```

**After Login → Auto-redirect to:**
```
http://localhost:3000/kitchen
```

**What you can do:**
- ✅ View order queue (RECEIVED, PREPARING, OVEN, BAKED)
- ✅ Update order status
- ✅ See preparation times
- ✅ Priority indicators
- ✅ Real-time updates

**Navigation:**
- Kitchen board with status columns
- Header shows: User name, role (STAFF), Logout button
- No menu access (kitchen staff don't need customer menu)

---

## 📍 Complete URL Structure

### Public (No Login)
```
http://localhost:3000/           → Menu Page (home)
http://localhost:3000/about      → About/System Info
```

### Staff Only (Login Required)
```
http://localhost:3000/login      → Staff Login Page
http://localhost:3000/manager    → Manager Dashboard
http://localhost:3000/kitchen    → Kitchen Display
```

### Customer (Login Required for Orders - Phase 4)
```
http://localhost:3000/checkout   → Requires customer login (Phase 4)
http://localhost:3000/orders     → Order history (Phase 4)
http://localhost:3000/profile    → Customer profile (Phase 4)
```

---

## 🎯 Key Design Decisions

### Why Menu is Public?
- **Better UX**: Customers browse before deciding to order
- **No friction**: Add to cart without account creation
- **Standard practice**: Like all food delivery apps (Zomato, Swiggy, etc.)

### Why Managers/Staff Don't See Menu?
- **Different workflows**: They manage operations, not order food
- **Cleaner UX**: Each role sees only what they need
- **Manager**: Store operations, staff, sessions
- **Kitchen**: Order preparation, status updates

### When Customers Login?
- **Phase 4 Implementation**:
  - Checkout page will prompt login/register
  - Save delivery address
  - Payment processing
  - Order tracking
  - Order history

---

## 🔐 Authentication Summary

| Role | Login Required? | Home Page | Primary Function |
|------|----------------|-----------|------------------|
| **Customer (Browsing)** | ❌ No | Menu Page | Browse & add to cart |
| **Customer (Ordering)** | ✅ Yes | Checkout | Place order & pay |
| **Manager** | ✅ Yes | Manager Dashboard | Store management |
| **Kitchen Staff** | ✅ Yes | Kitchen Display | Order preparation |
| **Driver** | ✅ Yes | Driver Dashboard | Delivery tracking |

---

## 📱 User Journeys

### Customer Journey (Current - Phase 3)
```
1. Open http://localhost:3000/
2. See menu with 65+ items
3. Filter by cuisine/category
4. Add items to cart (quantity selector)
5. See "✓ Added!" confirmation
6. Cart updates (localStorage)
7. Continue browsing
8. [Phase 4] Click "Checkout" → Login/Register prompt
```

### Manager Journey
```
1. Open http://localhost:3000/login
2. Enter manager credentials
3. Auto-redirect to /manager
4. View dashboard overview
5. Navigate tabs (Sessions, Store, Shifts, Employees)
6. Clock in/out for working session
7. Logout when done
```

### Kitchen Staff Journey
```
1. Open http://localhost:3000/login
2. Enter kitchen credentials
3. Auto-redirect to /kitchen
4. See order queue (columns by status)
5. Update order status as cooking progresses
6. Logout when shift ends
```

---

## 🎨 Header on Every Page

**Components:**
- **MaSoVa Logo** (clickable → goes to home)
- **Page Title** (e.g., "Browse Our Menu", "Manager Dashboard")
- **User Info** (if logged in: Name + Role)
- **Logout Button** (if logged in, red gradient)
- **Staff Login Button** (if not logged in)

**Consistent everywhere:**
- ✅ Menu Page
- ✅ About Page
- ✅ Manager Dashboard
- ✅ Kitchen Display

---

## 🚀 Quick Start

### I want to browse menu:
```
Just go to: http://localhost:3000/
No login needed!
```

### I'm a manager:
```
Go to: http://localhost:3000/login
Login with manager credentials
Manage store operations
```

### I'm kitchen staff:
```
Go to: http://localhost:3000/login
Login with kitchen credentials
See order queue and update status
```

---

## 📊 Current Status (Phase 3 Complete)

### ✅ What Works Now
- Public menu browsing (no login)
- Add to cart functionality
- Cart persistence (localStorage)
- Manager dashboard with sessions
- Kitchen display system
- Staff authentication
- Neumorphic design throughout

### ⏳ Coming in Phase 4
- Customer login/register
- Checkout flow
- Payment integration
- Order placement
- Order tracking
- Customer order history
- Delivery management

---

**Last Updated**: October 22, 2025
**Version**: 1.0.0-PHASE3-COMPLETE
**Navigation**: ✅ Optimized for UX
