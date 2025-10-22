# Frontend-Backend Connection Guide

## Current Status: ✅ CONFIGURED & READY

The frontend and backend are already configured to work together. Here's how to start and test the connection.

---

## Prerequisites

### Backend Services Running:
- ✅ User Service: http://localhost:8081
- ✅ MongoDB: localhost:27017 (via Docker)
- ✅ Redis: localhost:6379 (via Docker)

### Demo Users Created:
✅ 8 users created and stored in MongoDB (2 of each type)

---

## Starting the Frontend

### Option 1: From VS Code Terminal
```bash
cd D:\projects\MaSoVa-restaurant-management-system\frontend
npm run dev
```

### Option 2: From PowerShell
```powershell
cd D:\projects\MaSoVa-restaurant-management-system\frontend
npm run dev
```

The frontend will start on: **http://localhost:5173**

---

## Testing the Connection

### Step 1: Access the Login Page
Open your browser to: http://localhost:5173

### Step 2: Test Login with Demo Users

Try logging in with any of these accounts:

**MANAGER:**
- Email: `suresh.manager@masova.com`
- Password: `manager123`

**CUSTOMER:**
- Email: `priya.customer@masova.com`
- Password: `customer123`

**DRIVER:**
- Email: `rajesh.driver@masova.com`
- Password: `driver123`

**STAFF:**
- Email: `rahul.staff@masova.com`
- Password: `staff123`

### Step 3: Verify Connection
✅ Successful login = Frontend ↔️ Backend connection working!

---

## What's Already Connected

### ✅ Authentication & Authorization
- Login/Logout
- JWT token management
- Automatic token refresh
- Role-based access control

### ✅ API Configuration
- Base URL: http://localhost:8081
- All endpoints properly configured
- Axios interceptors for auth headers
- Error handling and retry logic

### ✅ CORS Configuration
- Backend allows frontend origin
- Credentials enabled
- All HTTP methods supported

### ✅ State Management
- Redux Toolkit with RTK Query
- Persistent auth state
- Token storage in localStorage

---

## Connection Architecture

```
┌─────────────────┐
│   Frontend      │
│  React + Vite   │
│  Port: 5173     │
└────────┬────────┘
         │
         │ HTTP/REST
         │ JWT Auth
         │
┌────────▼────────┐
│  User Service   │
│  Spring Boot    │
│  Port: 8081     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼──┐
│MongoDB│ │Redis│
│ 27017│  │ 6379│
└──────┘  └─────┘
```

---

## Troubleshooting

### Frontend Won't Start
```bash
cd frontend
npm install
npm run dev
```

### CORS Error
- Check SecurityConfig.java line 59-69
- Verify backend is running on port 8081

### Login Fails
1. Check browser console (F12) for errors
2. Verify backend is running: http://localhost:8081/actuator/health
3. Check MongoDB connection
4. Verify user exists in database

### Token Issues
- Clear localStorage in browser DevTools
- Try logging in again
- Check JWT secret in application.yml

---

## Next Steps

Once login is working, you can:
1. ✅ Test different user types and their dashboards
2. ✅ Verify role-based routing
3. ✅ Test working session management
4. 🔄 Implement Phase 3: Menu Service (next phase)

---

## Quick Commands Reference

**Start Backend:**
```bash
cd D:\projects\MaSoVa-restaurant-management-system\user-service
mvn spring-boot:run
```

**Start Frontend:**
```bash
cd D:\projects\MaSoVa-restaurant-management-system\frontend
npm run dev
```

**Verify Backend Health:**
```bash
curl http://localhost:8081/actuator/health
```

**Test Login API Directly:**
```bash
curl -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"suresh.manager@masova.com","password":"manager123"}'
```

---

## All Demo Users

**DRIVERS:**
- rajesh.driver@masova.com / driver123
- amit.driver@masova.com / driver123

**CUSTOMERS:**
- priya.customer@masova.com / customer123
- vikram.customer@masova.com / customer123

**MANAGERS:**
- suresh.manager@masova.com / manager123
- anjali.manager@masova.com / manager123

**STAFF:**
- rahul.staff@masova.com / staff123
- neha.staff@masova.com / staff123

---

**Status: Everything is configured and ready! Just start the frontend and test the login.** 🚀
