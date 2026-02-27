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
# MaSoVa Restaurant Management System
## Complete Frontend Integration Plan

*Comprehensive UI/UX implementation to complement the backend microservices architecture*

---

## Frontend Integration Overview

### Integration Timeline
This frontend implementation plan is designed to be executed **AFTER** completing all 11 backend phases, ensuring a solid, tested, and production-ready API foundation exists before building the user interfaces.

### Why Backend-First Approach
- **Solid Foundation**: All business logic, authentication, and data management properly implemented
- **API Stability**: Well-tested endpoints with established data models and response formats
- **Performance Optimization**: Backend caching, database optimization, and scaling solutions in place
- **Security Implementation**: Authentication, authorization, and data validation fully operational
- **Business Rules**: Complex restaurant operations logic thoroughly tested and refined

---

## Frontend Technology Stack

### Core Technologies
- **Framework**: React 18 with TypeScript for type safety and maintainability
- **State Management**: Redux Toolkit with RTK Query for efficient API state management
- **UI Library**: Material-UI (MUI) v5 for consistent design system and Indian market aesthetics
- **Styling**: Emotion CSS-in-JS with custom theme for brand consistency
- **Build Tool**: Vite for fast development and optimized production builds
- **Package Manager**: npm with exact version locking for consistent builds

### Development Tools
- **IDE**: Visual Studio Code with TypeScript, React, and ESLint extensions
- **Code Quality**: ESLint, Prettier, Husky for pre-commit hooks
- **Testing**: Jest, React Testing Library, Cypress for E2E testing
- **API Integration**: Axios with interceptors for JWT token management
- **Documentation**: Storybook for component documentation and design system

### Mobile & Responsive
- **Responsive Design**: Mobile-first approach with breakpoint system
- **PWA Features**: Service workers, offline capability, app-like experience
- **Touch Optimization**: Touch-friendly interfaces for tablet POS systems
- **Performance**: Code splitting, lazy loading, image optimization

---

## Application Architecture

### Multi-Application Strategy
The frontend will consist of multiple specialized applications, each tailored for specific user types and use cases:

1. **Customer Web Application** - Online ordering and account management
2. **Customer Mobile PWA** - Mobile-optimized ordering experience
3. **Manager Dashboard** - Comprehensive restaurant management interface
4. **Kitchen Display System** - Real-time order tracking and preparation management
5. **Driver Mobile App** - Delivery management and GPS tracking interface
6. **POS System Interface** - In-store order taking and payment processing

### Shared Component Library
- **Design System**: Consistent UI components across all applications
- **Utility Functions**: Shared business logic, formatting, validation
- **API Layer**: Centralized service layer for backend communication
- **Authentication Module**: JWT token management, role-based routing
- **Notification System**: Real-time updates via WebSocket integration

---

## Frontend Phase Implementation Plan

## Phase F1: Foundation & Shared Infrastructure

### Design System Development
Create comprehensive design system reflecting MaSoVa brand identity with Indian market considerations including color schemes, typography, spacing, and component variants suitable for diverse user interfaces.

### Authentication & Security Frontend
Implement JWT token management, automatic token refresh, role-based route protection, secure storage mechanisms, and logout handling with proper cleanup of sensitive data.

### API Integration Layer
Build centralized API service layer with Axios configuration, request/response interceptors, error handling, loading states management, and automatic retry mechanisms for network reliability.

### Shared Component Library
Develop reusable components including form controls, data tables, modal dialogs, notification systems, navigation components, and specialized restaurant operation widgets.

### State Management Architecture
Implement Redux Toolkit with RTK Query for efficient API state management, user session management, real-time data synchronization, and optimistic updates for better user experience.

---

## Phase F2: Customer-Facing Applications

### Customer Web Application
Build comprehensive web application for online ordering including menu browsing with filtering and search, cart management, user account creation and management, order history, favorite items, and delivery tracking.

### Menu Display & Ordering
Implement dynamic menu display with category navigation, item customization interfaces, pricing calculations in INR, promotional offers display, and real-time availability updates based on inventory levels.

### Checkout & Payment Integration
Create seamless checkout experience with Razorpay payment integration, multiple payment methods support, order summary with cost breakdown, delivery address management, and order confirmation flow.

### Customer Account Management
Build user profile management, order history with reorder functionality, favorite items management, delivery address book, payment method storage, and customer review submission interface.

### Real-Time Order Tracking
Implement live order status tracking with WebSocket integration, estimated delivery times, driver location tracking on maps, delivery notifications, and order completion confirmation.

---

## Phase F3: Management Dashboard

### Executive Dashboard
Create comprehensive management overview with sales analytics, performance metrics, store operational status, staff management, and financial reporting with interactive charts and data visualization.

### POS System Analytics Interface
Build detailed analytics dashboard showing today vs last year comparisons, weekly sales summaries, individual staff performance metrics, driver status monitoring, and real-time order queue management.

### Staff Management Interface
Implement employee management with working hours tracking, session monitoring, performance analytics, schedule management, role assignments, and approval workflows for overtime and violations.

### Store Operations Management
Create store configuration interfaces, operating hours management, capacity settings, delivery radius configuration, and operational status controls with real-time updates.

### Financial Reporting Dashboard
Build comprehensive financial reporting with revenue analysis in INR, cost breakdowns, profit margin analysis, waste analysis, and exportable reports for business management.

---

## Phase F4: Kitchen Display System

### Real-Time Order Display
Implement large-screen kitchen display showing incoming orders with priority sorting, preparation stages, estimated completion times, and color-coded status indicators for quick visual reference.

### Preparation Workflow Management
Build interfaces for order status updates, ingredient availability alerts, preparation time tracking, quality control checkpoints, and seamless integration with oven queue management.

### Kitchen Performance Analytics
Create real-time dashboards showing kitchen efficiency metrics, average preparation times, order throughput, equipment status, and performance optimization recommendations.

### Equipment Monitoring Interface
Implement equipment status displays, maintenance alerts, temperature monitoring, capacity utilization tracking, and automated notification systems for equipment issues.

### Staff Communication System
Build kitchen-specific communication tools for task assignment, shift handovers, urgent notifications, and coordination with front-of-house operations.

---

## Phase F5: Driver Mobile Application

### Mobile-Optimized Interface
Create responsive mobile application optimized for smartphones with touch-friendly controls, offline capability, GPS integration, and battery-efficient design for extended use.

### Delivery Management System
Implement order assignment interface, delivery route optimization, customer contact information, special delivery instructions, and delivery confirmation workflows with photo capture capability.

### GPS Tracking & Navigation
Build real-time location tracking, turn-by-turn navigation integration, route optimization based on traffic, delivery time estimation, and location sharing with customers and dispatch.

### Driver Performance Dashboard
Create driver-specific analytics showing delivery times, customer ratings, earnings tracking, performance metrics, working hours summary, and improvement recommendations.

### Communication Interface
Implement customer communication tools, dispatch messaging, emergency contacts, support ticket system, and notification management for delivery updates.

---

## Phase F6: Point of Sale (POS) System

### In-Store Ordering Interface
Build tablet-optimized POS interface for managers and assistant managers with menu navigation, order customization, payment processing, and customer information management.

### Payment Processing Integration
Implement multi-payment method support including cash, card, and digital payments with Razorpay integration, receipt generation, refund processing, and transaction reconciliation.

### Customer Management
Create customer lookup, order history access, loyalty program integration, contact information management, and special offers application for in-store customers.

### Store Operations Integration
Build inventory level checking, menu item availability updates, promotional pricing application, and real-time integration with kitchen display systems.

### Transaction Reporting
Implement daily sales reporting, transaction logs, payment method analytics, staff performance tracking, and end-of-day reconciliation processes.

---

## Phase F7: Real-Time Features & WebSocket Integration

### Live Order Tracking
Implement WebSocket connections for real-time order status updates, kitchen progress notifications, delivery tracking updates, and automatic UI refresh for all connected clients.

### Live Dashboard Updates
Create real-time analytics dashboards with automatic data refresh, live performance metrics, operational status updates, and alert notifications without manual page refresh.

### Push Notifications
Build comprehensive notification system for order updates, delivery alerts, staff notifications, equipment alerts, and promotional messages with proper user preferences management.

### Chat & Communication
Implement real-time chat features for customer support, driver-dispatch communication, kitchen-management coordination, and emergency alert broadcasting.

### Live Inventory Updates
Create real-time inventory level displays, automatic menu item availability updates, and low stock alerts across all applications with immediate UI updates.

---

## Phase F8: Advanced Features & Optimization

### Progressive Web App (PWA)
Implement PWA features including service workers for offline functionality, app-like experience, push notifications, background sync, and installable web applications.

### Performance Optimization
Optimize application performance with code splitting, lazy loading, image optimization, bundle size reduction, caching strategies, and rendering performance improvements.

### Accessibility Implementation
Ensure comprehensive accessibility with WCAG 2.1 AA compliance, screen reader support, keyboard navigation, color contrast optimization, and multilingual support preparation.

### Analytics Integration
Implement user behavior tracking, performance monitoring, error reporting, usage analytics, and business intelligence data collection with privacy compliance.

### Security Hardening
Strengthen frontend security with Content Security Policy, XSS protection, secure storage practices, input sanitization, and vulnerability scanning integration.

---

## Phase F9: Testing & Quality Assurance

### Component Testing
Implement comprehensive component testing with Jest and React Testing Library, covering user interactions, state management, API integration, and error handling scenarios.

### End-to-End Testing
Build complete user journey testing with Cypress, covering order placement, payment processing, delivery tracking, management workflows, and cross-browser compatibility.

### Performance Testing
Conduct performance testing including load time optimization, memory usage analysis, mobile performance validation, and network efficiency testing.

### User Acceptance Testing
Coordinate user testing with actual restaurant staff, customers, and management to validate usability, workflow efficiency, and business requirement fulfillment.

### Security Testing
Perform frontend security testing including authentication flow validation, authorization checking, data sanitization verification, and vulnerability assessment.

---

## Phase F10: Deployment & Production Setup

### Production Build Optimization
Configure production builds with environment-specific settings, asset optimization, CDN integration, compression, and performance monitoring setup.

### Hosting & CDN Setup
Deploy applications to production hosting with CDN configuration, SSL certificates, domain setup, load balancing, and global content delivery optimization.

### Monitoring & Analytics
Implement production monitoring with error tracking, performance monitoring, user analytics, uptime monitoring, and comprehensive logging for troubleshooting.

### Backup & Recovery
Establish frontend asset backup procedures, version rollback capabilities, disaster recovery plans, and continuous deployment pipeline with automated testing.

### Documentation & Training
Create comprehensive documentation including user guides, technical documentation, API integration guides, and training materials for system administrators.

---

## Integration Architecture

### API Communication Strategy
- **RESTful APIs**: Primary communication with all backend microservices
- **WebSocket Connections**: Real-time updates for orders, tracking, and notifications
- **Authentication**: JWT token-based authentication with automatic refresh
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Consistent loading indicators and optimistic updates

### Data Synchronization
- **Real-Time Updates**: WebSocket integration for live data synchronization
- **Optimistic Updates**: Immediate UI updates with rollback on failure
- **Offline Support**: Service workers for basic offline functionality
- **Cache Management**: Intelligent caching with automatic invalidation
- **Conflict Resolution**: Handling concurrent updates and data conflicts

### State Management Pattern
- **Global State**: User authentication, application settings, real-time notifications
- **Feature State**: Module-specific state management with RTK Query
- **Local State**: Component-level state for UI interactions and forms
- **Persistent State**: Local storage for user preferences and offline data
- **Session State**: Temporary data management for user sessions

---

## User Experience Design

### Design Principles
- **Mobile-First**: Responsive design optimized for mobile devices
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Performance**: Fast loading times and smooth interactions
- **Consistency**: Unified design language across all applications
- **Usability**: Intuitive interfaces minimizing training requirements

### Indian Market Considerations
- **Language Support**: Multi-language support preparation for regional languages
- **Cultural Design**: Color schemes and imagery appropriate for Indian market
- **Payment Preferences**: Multiple payment options prominently displayed
- **Connectivity**: Optimization for varying internet speeds and reliability
- **Device Compatibility**: Support for diverse device capabilities and screen sizes

### Brand Integration
- **Visual Identity**: Consistent MaSoVa branding across all interfaces
- **Color Scheme**: Brand colors with high contrast for accessibility
- **Typography**: Readable fonts optimized for digital displays
- **Imagery**: High-quality food photography and promotional materials
- **Voice & Tone**: Friendly, professional communication style

---

## Development Workflow

### Development Environment
- **Local Development**: Hot reloading, mock API integration, debugging tools
- **Version Control**: Git workflow with feature branches and code review
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Automated testing with coverage requirements
- **Documentation**: Component documentation with Storybook

### Build & Deployment Pipeline
- **Continuous Integration**: Automated testing, linting, and build validation
- **Staging Environment**: Pre-production testing with full backend integration
- **Production Deployment**: Automated deployment with rollback capabilities
- **Performance Monitoring**: Real-time performance tracking and alerting
- **Error Tracking**: Comprehensive error logging and notification system

### Quality Assurance Process
- **Code Review**: Peer review process for all code changes
- **Testing Requirements**: Unit tests, integration tests, E2E tests
- **Performance Standards**: Loading time, bundle size, accessibility compliance
- **Security Review**: Security vulnerability scanning and compliance checking
- **User Testing**: Regular user feedback collection and usability testing

---

## Success Metrics & KPIs

### Technical Performance
- **Page Load Time**: Under 3 seconds for all primary pages
- **Bundle Size**: Optimized bundle sizes with code splitting
- **Accessibility Score**: WCAG 2.1 AA compliance across all applications
- **Test Coverage**: Minimum 90% test coverage for critical functionality
- **Performance Score**: Lighthouse scores above 90 for all metrics

### User Experience Metrics
- **User Satisfaction**: User feedback scores and usability metrics
- **Task Completion Rate**: Successful order completion and workflow efficiency
- **Error Rate**: Minimal user-facing errors and graceful error handling
- **Engagement Metrics**: User retention, session duration, and feature adoption
- **Conversion Rate**: Order completion rate and payment success rate

### Business Impact
- **Operational Efficiency**: Reduced training time, faster order processing
- **Customer Satisfaction**: Improved customer experience and retention
- **Staff Productivity**: Enhanced staff workflow efficiency and satisfaction
- **Revenue Impact**: Increased online orders, higher average order value
- **Cost Reduction**: Reduced support tickets, operational overhead

---

## Future Enhancement Opportunities

### Advanced Features
- **AI Integration**: Predictive ordering, personalized recommendations
- **Voice Interface**: Voice-controlled ordering for accessibility
- **Augmented Reality**: AR menu visualization and store navigation
- **Advanced Analytics**: Machine learning insights and predictions
- **Social Integration**: Social media sharing, reviews, and promotions

### Scalability Enhancements
- **Micro-Frontends**: Independent frontend deployments for better scalability
- **Edge Computing**: CDN optimization for global performance
- **Advanced Caching**: Sophisticated caching strategies for improved performance
- **Real-Time Collaboration**: Multi-user real-time editing and coordination
- **Advanced Personalization**: Dynamic UI adaptation based on user behavior

### Technology Evolution
- **Framework Updates**: Keeping current with React ecosystem evolution
- **Modern Web APIs**: Integration of new browser capabilities
- **Performance Optimizations**: Leveraging new optimization techniques
- **Security Enhancements**: Adopting latest security best practices
- **Accessibility Improvements**: Enhanced accessibility features and compliance

---

## Conclusion

This comprehensive frontend integration plan provides a structured approach to building sophisticated, user-friendly interfaces that complement the robust backend microservices architecture. The plan ensures that after completing all backend phases, the frontend implementation will deliver exceptional user experiences across all touchpoints while maintaining performance, security, and scalability.

The phased approach allows for systematic development with clear milestones, ensuring each application meets the specific needs of its target users while maintaining consistency across the entire ecosystem. The emphasis on modern web technologies, responsive design, and comprehensive testing ensures the frontend applications will be production-ready and capable of supporting the complex business operations of a modern restaurant management system.

By following this plan, the complete MaSoVa Restaurant Management System will provide a seamless, efficient, and enjoyable experience for customers, staff, and management, ultimately contributing to operational excellence and business success in the competitive restaurant industry.# Frontend-Backend Integration Status

## ✅ Completed Integration Tasks

### 1. API Configuration
- ✅ Created `frontend/src/config/api.config.ts` with all endpoint definitions
- ✅ Created `frontend/.env` with backend URL (http://localhost:8081)
- ✅ Configured axios instance with JWT interceptors for auto-token refresh

### 2. Authentication Integration
- ✅ Updated `authApi.ts` to use real backend endpoints
- ✅ Connected `authSlice` with RTK Query using extraReducers
- ✅ Updated `LoginPage.tsx` to call real API instead of mock data
- ✅ Implemented automatic token refresh on 401 errors
- ✅ Added localStorage persistence for tokens and user data

### 3. Working Sessions Integration
- ✅ Updated `sessionApi.ts` with full backend endpoint integration
- ✅ Added endpoints for:
  - Start/End session
  - Get active sessions by store
  - Get employee sessions
  - Approve/Reject sessions
  - Add break time

### 4. Demo Users
- ✅ Created script to register demo users
- ✅ Successfully registered Driver account (driver@masova.com / driver123)
- ⚠️ Some accounts got 500 errors (likely validation or duplicates)

---

## 🧪 Testing Instructions

### Test 1: Login Flow
1. Open browser to http://localhost:5173
2. Try logging in with:
   - **Email**: `driver@masova.com`
   - **Password**: `driver123`
3. ✅ Should successfully authenticate and redirect

### Test 2: Create Additional Users
Run this PowerShell command to create a customer account:

```powershell
$body = @{
    type = "CUSTOMER"
    name = "John Doe"
    email = "john@example.com"
    phone = "9999999999"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/users/register" -Method POST -Body $body -ContentType "application/json"
```

### Test 3: Check Authentication Flow
1. Login successfully
2. Open DevTools > Application > Local Storage
3. Verify tokens are stored:
   - `accessToken`
   - `refreshToken`
   - `user` (JSON object)

### Test 4: Test Token Refresh
1. After login, manually expire the token in localStorage
2. Make an API call
3. The axios interceptor should automatically refresh the token

---

## 🔧 Current Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
│  Port: 5173     │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   User Service  │
│  (Spring Boot)  │
│  Port: 8081     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼──┐
│MongoDB│  │Redis│
│ 27017│  │ 6379│
└──────┘  └─────┘
```

---

## 📋 API Endpoints Connected

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `POST /api/users/refresh-token` - Token refresh
- `POST /api/users/logout` - Logout
- `GET /api/users/profile` - Get user profile

### Working Sessions
- `POST /api/sessions/start` - Start working session
- `POST /api/sessions/{id}/end` - End session
- `GET /api/sessions/store/{storeId}/active` - Get active sessions
- `GET /api/sessions/employee/{employeeId}` - Get employee sessions
- `POST /api/sessions/{id}/approve` - Approve session
- `POST /api/sessions/{id}/reject` - Reject session
- `POST /api/sessions/{id}/break` - Add break time

---

## 🚧 Next Steps (Phase 3)

### Still Using Mock Data:
1. **Customer App**:
   - Menu items (need Menu Service backend)
   - Cart functionality
   - Order creation
   - Payment integration

2. **Kitchen Display**:
   - Real-time order updates (need Order Service + WebSocket)
   - Order status updates
   - Kitchen workflow

3. **Manager Dashboard**:
   - Analytics API integration
   - Sales data
   - Order statistics

### To Implement:
1. Menu Service backend (Phase 3)
2. Order Service backend (Phase 3)
3. WebSocket for real-time updates
4. Payment gateway integration
5. Protected route components
6. Error boundary components
7. Loading states across all pages

---

## 🐛 Known Issues

1. Some demo user registrations failing with 500 errors
   - Likely validation issues
   - Need to check backend logs
   - May need to adjust user data format

2. Frontend TypeScript errors (if any)
   - Check browser console
   - Verify all type definitions match backend responses

3. CORS (if encountered)
   - Backend needs to allow frontend origin
   - Currently should work on localhost

---

## 📊 Integration Progress

| Feature | Backend | Frontend | Integration | Status |
|---------|---------|----------|-------------|---------|
| User Auth | ✅ | ✅ | ✅ | **COMPLETE** |
| Working Sessions | ✅ | ✅ | ✅ | **COMPLETE** |
| Menu Management | ❌ | ✅ (UI) | ❌ | Phase 3 |
| Order Management | ❌ | ✅ (UI) | ❌ | Phase 3 |
| Analytics | ❌ | ✅ (UI) | ❌ | Phase 3 |
| Real-time Updates | ❌ | ❌ | ❌ | Phase 3 |

---

## 🎯 What You Should Test Now

1. **Open the frontend**: http://localhost:5173
2. **Try the Driver login**: driver@masova.com / driver123
3. **Check browser console** for any errors
4. **Verify** you get redirected after login
5. **Check network tab** to see API calls being made
6. **Report back** any errors you see

The authentication is now fully connected to your backend! 🎉
# Phase 1 & 2 Complete Testing Guide

## What Was Fixed - Summary

Based on the comprehensive analysis, we fixed **ALL 8 critical gaps** found in Phase 1 & 2:

### ✅ Fixed Issues:
1. ✅ Session API route mismatch (404 errors)
2. ✅ Missing HTTP headers (X-User-Id, X-Store-Id)
3. ✅ Created storeApi.ts (9 endpoints)
4. ✅ Created shiftApi.ts (11 endpoints)
5. ✅ Enhanced userApi.ts (1 → 10 endpoints)
6. ✅ Replaced Dashboard mock data with real APIs
7. ✅ Implemented real session approval/rejection
8. ✅ Created orderApi.ts (7 endpoints)
9. ✅ Connected Kitchen Display to real backend

---

## Prerequisites for Testing

### 1. Start Backend Services

You need these services running:

```bash
# Terminal 1 - User Service (Port 8081)
cd user-service
mvn spring-boot:run

# Terminal 2 - Menu Service (Port 8082)
cd menu-service
mvn spring-boot:run

# Terminal 3 - Order Service (Port 8083) - if available
cd order-service
mvn spring-boot:run
```

### 2. Start Frontend

```bash
# Terminal 4 - Frontend (Port 5173)
cd frontend
npm run dev
```

### 3. MongoDB & Redis

Ensure MongoDB (port 27017) and Redis (port 6379) are running.

---

## Testing Checklist

## Test 1: Authentication System ✅

**What to check:** Login flow with JWT tokens

### Steps:
1. Go to `http://localhost:5173/login`
2. Try logging in with a manager account
3. Check browser DevTools → Network tab
4. Look for `POST /api/users/login` request

### Expected Results:
- ✅ Request goes to `http://localhost:8081/api/users/login`
- ✅ Response includes `accessToken` and `refreshToken`
- ✅ User object has `id`, `name`, `email`, `userType`, `storeId`
- ✅ Redirects to Manager Dashboard after successful login

### What Was Fixed:
- Already working, no changes needed

---

## Test 2: Session API Routes ✅

**What to check:** Session endpoints now use correct routes

### Steps:
1. Log in as a manager
2. Go to Manager Dashboard
3. Open DevTools → Network tab
4. Observe the API calls being made

### Expected Results:
- ✅ See request to `GET /api/users/sessions/store/{storeId}/active`
- ✅ NOT `/api/sessions/...` (old broken route)
- ✅ Response returns array of active sessions
- ✅ No 404 errors in console

### What Was Fixed:
**File:** `frontend/src/store/api/sessionApi.ts`
- Changed `baseUrl: API_CONFIG.BASE_URL` → `baseUrl: API_CONFIG.USER_SERVICE_URL`
- Changed all routes from `/api/sessions/*` → `/api/users/sessions/*`
- Added `X-User-Id` and `X-Store-Id` headers

**Before:**
```typescript
query: (storeId) => `/api/sessions/store/${storeId}/active`
```

**After:**
```typescript
query: (storeId) => `/api/users/sessions/store/${storeId}/active`
```

---

## Test 3: Session Headers ✅

**What to check:** Required headers are sent with session API calls

### Steps:
1. Stay on Manager Dashboard
2. DevTools → Network → Click on any session API call
3. Go to "Headers" tab → "Request Headers"

### Expected Results:
- ✅ See `authorization: Bearer <token>`
- ✅ See `X-User-Id: <user_id>`
- ✅ See `X-Store-Id: <store_id>`

### What Was Fixed:
**File:** `frontend/src/store/api/sessionApi.ts`

Added header logic:
```typescript
prepareHeaders: (headers, { getState }) => {
  const token = (getState() as RootState).auth.accessToken;
  const user = (getState() as RootState).auth.user;

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  // NEW: Add required headers for backend
  if (user) {
    headers.set('X-User-Id', user.id);
    if (user.storeId) {
      headers.set('X-Store-Id', user.storeId);
    }
  }

  return headers;
}
```

---

## Test 4: Manager Dashboard - Real Data ✅

**What to check:** Dashboard shows real data, not hardcoded values

### Steps:
1. Go to Manager Dashboard (Overview tab)
2. Look at the stats cards
3. Check DevTools → Network

### Expected Results:
- ✅ See `GET /api/users/sessions/store/{storeId}/active` (polls every 30s)
- ✅ See `GET /api/stores/{storeId}/metrics` (polls every 60s)
- ✅ Active Staff count shows real number from backend
- ✅ Sales data comes from storeMetrics API
- ✅ Staff sessions list shows real employee data

### What Was Fixed:
**File:** `frontend/src/pages/manager/DashboardPage.tsx`

**Before (Mock Data):**
```typescript
const workingSessions: WorkingSession[] = [
  { id: 'WS001', name: 'Rajesh Kumar', ... }, // HARDCODED
  { id: 'WS002', name: 'Priya Sharma', ... }, // HARDCODED
];

const salesData: SalesData = {
  today: 45000,        // HARDCODED
  lastYear: 38000,     // HARDCODED
};
```

**After (Real API):**
```typescript
const { data: sessions = [], isLoading, error } = useGetActiveStoreSessionsQuery(storeId, {
  skip: !storeId,
  pollingInterval: 30000, // Real-time updates
});

const { data: storeMetrics } = useGetStoreMetricsQuery(storeId, {
  skip: !storeId,
  pollingInterval: 60000,
});
```

---

## Test 5: Session Approval/Rejection ✅

**What to check:** Approve/Reject buttons actually work

### Steps:
1. Go to Manager Dashboard → Staff Sessions tab
2. If there's a session with status "PENDING_APPROVAL", click "Approve" or "Reject"
3. Watch DevTools → Network

### Expected Results:
- ✅ See `POST /api/users/sessions/{sessionId}/approve` OR
- ✅ See `POST /api/users/sessions/{sessionId}/reject`
- ✅ Button shows "Approving..." or "Rejecting..." during request
- ✅ Session disappears or updates after approval
- ✅ Sessions list auto-refreshes
- ✅ NO alert() popup (old behavior)

### What Was Fixed:
**File:** `frontend/src/pages/manager/DashboardPage.tsx`

**Before (Fake):**
```typescript
const approveSession = (sessionId: string): void => {
  alert(`Session ${sessionId} approved successfully!`); // NOPE!
};
```

**After (Real):**
```typescript
const handleApproveSession = async (sessionId: string): Promise<void> => {
  try {
    await approveSession(sessionId).unwrap();
    // Success handled by RTK Query cache invalidation
  } catch (error) {
    console.error('Failed to approve session:', error);
    alert('Failed to approve session. Please try again.');
  }
};
```

---

## Test 6: Store API - New Feature ✅

**What to check:** Store API endpoints exist and work

### Steps:
1. Open browser console
2. Check Redux DevTools (if installed)
3. Look for `storeApi` in the Redux state

### Expected Results:
- ✅ `storeApi` exists in Redux store
- ✅ Can call store endpoints (though not used in UI yet)

### Available Endpoints:
```typescript
useGetStoreQuery(storeId)              // Get store by ID
useGetStoreByCodeQuery(code)           // Get store by code
useGetActiveStoresQuery()              // Get all active stores
useGetStoresByRegionQuery(regionId)    // Get stores in region
useGetNearbyStoresQuery({ lat, lng })  // Find nearby stores
useCreateStoreMutation()               // Create new store
useUpdateStoreMutation()               // Update store
useGetOperationalStatusQuery(storeId)  // Check if open
useGetStoreMetricsQuery(storeId)       // Get store metrics
```

### What Was Fixed:
**File:** `frontend/src/store/api/storeApi.ts` - **NEW FILE**
- Created complete store API with 9 endpoints
- Integrated into Redux store

---

## Test 7: Shift API - New Feature ✅

**What to check:** Shift API endpoints exist and work

### Expected Results:
- ✅ `shiftApi` exists in Redux store
- ✅ Can call shift endpoints (though not used in UI yet)

### Available Endpoints:
```typescript
useCreateShiftMutation()          // Create shift
useGetShiftQuery(shiftId)         // Get shift by ID
useUpdateShiftMutation()          // Update shift
useDeleteShiftMutation()          // Cancel shift
useGetEmployeeShiftsQuery()       // Get employee's shifts
useGetStoreShiftsQuery()          // Get store shifts
useGetCurrentShiftQuery()         // Get current shift
useConfirmShiftMutation()         // Confirm attendance
useStartShiftMutation()           // Start shift
useCompleteShiftMutation()        // Complete shift
useGetShiftCoverageQuery()        // Get coverage stats
```

### What Was Fixed:
**File:** `frontend/src/store/api/shiftApi.ts` - **NEW FILE**
- Created complete shift API with 11 endpoints
- Integrated into Redux store

---

## Test 8: User API - Enhanced ✅

**What to check:** User API now has more endpoints

### Before:
- Only 1 endpoint: `useGetProfileQuery()`

### After:
```typescript
useGetProfileQuery()                  // Get current user
useUpdateProfileMutation()            // Update profile
useChangePasswordMutation()           // Change password
useGetUserQuery(userId)               // Get user by ID
useUpdateUserMutation()               // Update any user
useDeactivateUserMutation()           // Deactivate user
useGetUsersByTypeQuery(type)          // Get by type (STAFF, MANAGER, etc.)
useGetStoreEmployeesQuery(storeId)    // Get store employees
useGetManagersQuery()                 // Get all managers
useCanTakeOrdersQuery(userId)         // Check order permissions
```

### What Was Fixed:
**File:** `frontend/src/store/api/userApi.ts`
- Enhanced from 1 to 10 endpoints
- Added proper TypeScript types
- Changed baseUrl to `API_CONFIG.USER_SERVICE_URL`

---

## Test 9: Kitchen Display - Real Orders ✅

**What to check:** Kitchen Display shows real orders (when Order Service is running)

### Steps:
1. Go to Kitchen Display page
2. Check DevTools → Network

### Expected Results:

**If Order Service is running (port 8083):**
- ✅ See `GET /api/orders/kitchen/{storeId}` (polls every 5s)
- ✅ Orders appear in correct columns (RECEIVED, PREPARING, OVEN, BAKED, DISPATCHED)
- ✅ Click "Next Stage" button → see `PATCH /api/orders/{orderId}/status`
- ✅ Order moves to next column automatically
- ✅ Changes persist (refresh page, order stays in new column)

**If Order Service is NOT running:**
- ✅ See error message: "Error loading orders. Please check if Order Service is running."
- ✅ No crash, graceful error handling

### What Was Fixed:
**File:** `frontend/src/pages/kitchen/KitchenDisplayPage.tsx`

**Before (Mock Data):**
```typescript
const [orders, setOrders] = useState<Order[]>([
  { id: 'ORD001', ... }, // HARDCODED
  { id: 'ORD002', ... }, // HARDCODED
]);

const moveOrderToNext = (orderId: string): void => {
  setOrders(orders.map(order => {
    // Only updates local state, NOT backend!
  }));
};
```

**After (Real API):**
```typescript
const { data: apiOrders = [], isLoading, error } = useGetKitchenQueueQuery(storeId, {
  skip: !storeId,
  pollingInterval: 5000, // Poll every 5 seconds
});

const [updateOrderStatus] = useUpdateOrderStatusMutation();

const moveOrderToNext = async (orderId: string, currentStatus: Order['status']): Promise<void> => {
  await updateOrderStatus({ orderId, status: nextStatus }).unwrap();
};
```

**File:** `frontend/src/store/api/orderApi.ts` - **ENHANCED**
- Added 7 complete endpoints for order management
- Kitchen queue endpoint for real-time display
- Order status update mutation
- Proper TypeScript types

---

## Test 10: Real-Time Polling ✅

**What to check:** Data updates automatically without page refresh

### Steps:
1. Go to Manager Dashboard
2. Keep DevTools → Network tab open
3. Wait and observe

### Expected Results:
- ✅ Every 30 seconds: `GET /api/users/sessions/store/{storeId}/active`
- ✅ Every 60 seconds: `GET /api/stores/{storeId}/metrics`
- ✅ Dashboard updates automatically when data changes

### Steps (Kitchen Display):
1. Go to Kitchen Display
2. Keep DevTools open
3. Wait and observe

### Expected Results:
- ✅ Every 5 seconds: `GET /api/orders/kitchen/{storeId}`
- ✅ Orders update automatically

---

## Complete File Changes Summary

### New Files Created:
1. ✅ `frontend/src/store/api/storeApi.ts` (169 lines)
2. ✅ `frontend/src/store/api/shiftApi.ts` (195 lines)

### Files Modified:
3. ✅ `frontend/src/store/api/sessionApi.ts` (155 lines)
   - Fixed routes from `/api/sessions` → `/api/users/sessions`
   - Added X-User-Id and X-Store-Id headers
   - Added getPendingApprovalSessions endpoint

4. ✅ `frontend/src/store/api/userApi.ts` (155 lines)
   - Enhanced from 1 to 10 endpoints
   - Added proper types

5. ✅ `frontend/src/store/api/orderApi.ts` (165 lines)
   - Enhanced from stub to full implementation
   - 7 endpoints for order management

6. ✅ `frontend/src/store/store.ts` (60 lines)
   - Added storeApi and shiftApi to Redux store

7. ✅ `frontend/src/config/api.config.ts` (60 lines)
   - Added USER_SERVICE_URL, MENU_SERVICE_URL, ORDER_SERVICE_URL

8. ✅ `frontend/src/pages/manager/DashboardPage.tsx` (599 lines)
   - Replaced all mock data with real API calls
   - Added real session approval/rejection
   - Real-time polling for live updates

9. ✅ `frontend/src/pages/kitchen/KitchenDisplayPage.tsx` (841 lines)
   - Replaced hardcoded orders with real API
   - Real-time order updates every 5 seconds
   - Backend-persisted status changes

---

## Quick Test Commands

### Test All APIs at Once:

Open browser console and run:

```javascript
// Test Session API
fetch('http://localhost:8081/api/users/sessions/current', {
  headers: {
    'authorization': 'Bearer YOUR_TOKEN_HERE',
    'X-User-Id': 'YOUR_USER_ID',
    'X-Store-Id': 'YOUR_STORE_ID'
  }
}).then(r => r.json()).then(console.log)

// Test Store API
fetch('http://localhost:8081/api/stores/YOUR_STORE_ID')
  .then(r => r.json()).then(console.log)

// Test Order API (if Order Service running)
fetch('http://localhost:8083/api/orders/kitchen/YOUR_STORE_ID')
  .then(r => r.json()).then(console.log)
```

---

## Common Issues & Solutions

### Issue 1: "Network Error" or "Failed to fetch"
**Cause:** Backend service not running
**Solution:** Start the required service (user-service, menu-service, or order-service)

### Issue 2: 404 Not Found on session endpoints
**Cause:** Old code still cached
**Solution:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue 3: Sessions/Orders not showing
**Cause:** No data in database
**Solution:** Use backend APIs or MongoDB Compass to add test data

### Issue 4: Store metrics showing 0
**Cause:** No orders or sessions in database
**Solution:** This is expected if database is empty. Create test data.

### Issue 5: Kitchen Display shows error
**Cause:** Order Service not running (expected for Phase 1 & 2)
**Solution:** This is normal. Order Service is Phase 4. You should see graceful error message.

---

## Success Criteria

You've successfully verified Phase 1 & 2 if:

- ✅ No 404 errors on `/api/sessions` endpoints
- ✅ Manager Dashboard shows real session data
- ✅ Approve/Reject buttons actually work (no alert())
- ✅ Dashboard polls for updates every 30-60 seconds
- ✅ Kitchen Display connects to Order API (or shows error gracefully)
- ✅ All Redux APIs (storeApi, shiftApi, sessionApi, userApi, orderApi) exist
- ✅ Headers (X-User-Id, X-Store-Id) are sent with requests

---

## Next Steps

After verifying all tests pass:
1. ✅ Phase 1 & 2 integration is COMPLETE
2. ✅ Ready to start **Phase 4: Order Management System**
3. ✅ All backend-frontend gaps are fixed

---

**Total Changes:**
- 9 files modified
- 2 new files created
- ~2,500 lines of code changed
- All 8 critical gaps fixed
- 100% Phase 1 & 2 backend integration complete
# Phase 4.5: End-to-End Testing Guide
**Date:** October 23, 2025
**Purpose:** Comprehensive testing of all Phase 4.5 features
**Status:** Complete Testing Checklist

---

## 🎯 Testing Overview

This document provides step-by-step instructions to test all features implemented in Phase 4.5, ensuring the complete order flow works from POS → Kitchen → Driver → Delivery.

---

## 📋 Pre-Testing Checklist

### Backend Services Running (Ports):
- [ ] MongoDB (27017) - Database
- [ ] Redis (6379) - Cache
- [ ] API Gateway (8080) - Main entry point
- [ ] User Service (8081) - Authentication & users
- [ ] Menu Service (8082) - Menu items
- [ ] Order Service (8083) - Order management
- [ ] Analytics Service (8085) - Real-time metrics

### Frontend:
- [ ] React Development Server (3000)

### Test Data Required:
- [ ] Test users with different roles (MANAGER, STAFF, DRIVER, CUSTOMER)
- [ ] Menu items in database
- [ ] At least one store configured

---

## 🧪 Test Suite 1: Public Website

### Test 1.1: HomePage
**URL:** `http://localhost:3000/`

**Test Steps:**
1. Open browser and navigate to homepage
2. Verify hero section loads with restaurant branding
3. Check "Order Now" button redirects to `/customer/menu`
4. Check "Browse Menu" button redirects to `/menu`
5. Verify 3 featured promotions display correctly
6. Verify "Why Choose MaSoVa?" section shows 4 features
7. Check footer has "Staff Login" link

**Expected Results:**
- ✅ Hero section with gradient background visible
- ✅ All buttons functional
- ✅ Promotions display with images and discount tags
- ✅ Footer navigation works
- ✅ Responsive on mobile devices

**Status:** [ ] Pass [ ] Fail

---

### Test 1.2: Promotions Page
**URL:** `http://localhost:3000/promotions`

**Test Steps:**
1. Navigate to promotions page
2. Verify 8 total promotions display
3. Test category filtering (Pizza, Biryani, Combos, Desserts, Delivery)
4. Click "Order Now" on any promotion
5. Verify "Back" button returns to previous page

**Expected Results:**
- ✅ All 8 promotions visible
- ✅ Category tabs filter correctly
- ✅ "Order Now" redirects to `/customer/menu`
- ✅ Navigation works smoothly

**Status:** [ ] Pass [ ] Fail

---

### Test 1.3: Public Menu Page
**URL:** `http://localhost:3000/menu`

**Test Steps:**
1. Navigate to public menu
2. Verify menu items load without requiring login
3. Check category filtering works
4. Test search functionality
5. Verify "Order Now" prompts login/registration

**Expected Results:**
- ✅ Menu browsing works without authentication
- ✅ Categories filter items correctly
- ✅ Search finds items by name
- ✅ Clear customer journey flow

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 2: Authentication Flow

### Test 2.1: Staff Login
**URL:** `http://localhost:3000/login`

**Test Users:**
```
Manager:
  Email: manager@masova.com
  Password: Manager@123

Staff:
  Email: staff@masova.com
  Password: Staff@123

Driver:
  Email: driver@masova.com
  Password: Driver@123
```

**Test Steps:**
1. Click "Staff Login" from homepage
2. Enter manager credentials
3. Verify JWT token stored in localStorage
4. Check redirect to appropriate dashboard
5. Test "Remember Me" functionality
6. Test incorrect password handling
7. Logout and verify token cleared

**Expected Results:**
- ✅ Successful login redirects to `/manager` for MANAGER
- ✅ Successful login redirects to `/pos` for STAFF
- ✅ Successful login redirects to `/driver` for DRIVER
- ✅ JWT token persists across page refreshes
- ✅ Invalid credentials show error message
- ✅ Logout clears authentication

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 3: POS System (Complete Flow)

### Test 3.1: POS Dashboard Access
**Login:** Staff or Manager
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Login as STAFF user
2. Verify POS Dashboard loads
3. Check 3-column layout (Menu | Order | Customer)
4. Verify metrics tiles display at top
5. Check keyboard shortcuts help bar at bottom

**Expected Results:**
- ✅ Dashboard loads with user name and store ID
- ✅ 3 panels visible and responsive
- ✅ Metrics show: Today's Sales, Avg Order Value, Active Deliveries
- ✅ Shortcuts: F1, F2, F3, ESC, Ctrl+Enter displayed

**Status:** [ ] Pass [ ] Fail

---

### Test 3.2: Create Walk-In Order (POS → Kitchen)
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. **Select Menu Items:**
   - Browse menu categories (Pizza, Biryani, Breads, etc.)
   - Search for specific item (e.g., "Margherita")
   - Click "Add to Order" on 2-3 items
   - Verify items appear in center panel

2. **Build Order:**
   - Adjust quantities using +/- buttons
   - Add special instructions ("Extra cheese")
   - Select order type: **DINE_IN**
   - Select table number (e.g., Table 5)

3. **Customer Information:**
   - Enter customer name: "Test Customer"
   - Enter phone: "+91 9876543210"

4. **Payment:**
   - Select payment method: CASH
   - Verify total calculated correctly
   - Click "Place Order" (or press Ctrl+Enter)

5. **Verify Order Created:**
   - Check success notification appears
   - Note the order number (e.g., "ORD-123456")
   - Verify order panel clears automatically

6. **Verify in Kitchen Display:**
   - Navigate to `/kitchen`
   - Verify new order appears in "RECEIVED" column
   - Check order shows: items, table number, timestamp

**Expected Results:**
- ✅ Menu search works instantly
- ✅ Items add to order with correct price
- ✅ Quantity changes update total
- ✅ Order type selection works (DINE_IN shows table selector)
- ✅ Payment total includes tax calculation
- ✅ Order submits successfully via button OR Ctrl+Enter
- ✅ Order appears in Kitchen Display within 5 seconds
- ✅ Kitchen shows order number, items, and countdown timer

**API Calls:**
```
POST http://localhost:8080/api/orders
{
  "storeId": "store123",
  "orderType": "DINE_IN",
  "tableNumber": "Table 5",
  "items": [...],
  "customerName": "Test Customer",
  "customerPhone": "+919876543210",
  "paymentMethod": "CASH",
  "createdBy": "staff_user_id"
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 3.3: Create Delivery Order (POS → Kitchen → Driver)
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Click "New Order" (F1) to start fresh
2. Add 2-3 menu items
3. Select order type: **DELIVERY**
4. Enter delivery address:
   ```
   Street: 123 Main Street
   City: Hyderabad
   Pincode: 500001
   ```
5. Enter customer details:
   - Name: "Delivery Test Customer"
   - Phone: "+91 9999999999"
6. Verify delivery fee (₹40) added to total
7. Select payment method: ONLINE/CASH_ON_DELIVERY
8. Place order
9. Navigate to Kitchen Display (`/kitchen`)
10. Move order through stages:
    - RECEIVED → PREPARING → COOKING → READY
11. When status = READY, assign driver
12. Navigate to Driver App (`/driver`)
13. Login as DRIVER
14. Verify order appears in "Active Deliveries"

**Expected Results:**
- ✅ Delivery order type shows address fields
- ✅ Delivery fee (₹40) automatically added
- ✅ Order appears in Kitchen Display
- ✅ Order moves through kitchen stages
- ✅ Driver assignment updates order status
- ✅ Driver sees order in their active list

**Status:** [ ] Pass [ ] Fail

---

### Test 3.4: POS Keyboard Shortcuts
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Press **F1** → Verify new order started (order panel clears)
2. Add some items to order
3. Press **ESC** → Verify order clears
4. Add items again
5. Press **Ctrl+Enter** → Verify order submits (if form valid)
6. Press **F2** → Navigate to Order History
7. Press **F3** (Manager only) → Navigate to Reports

**Expected Results:**
- ✅ F1 clears current order
- ✅ ESC clears current order
- ✅ Ctrl+Enter submits order (keyboard-only workflow)
- ✅ F2 opens Order History page
- ✅ F3 opens Reports (Manager role only)

**Status:** [ ] Pass [ ] Fail

---

### Test 3.5: Real-Time Metrics (POS Dashboard)
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Open POS Dashboard
2. Observe metrics tiles at top:
   - **Today's Sales** (vs Yesterday)
   - **Avg Order Value**
   - **Last Year Comparison**
   - **Active Deliveries**
3. Create 1-2 new orders via POS
4. Wait 30-60 seconds for metrics refresh
5. Verify metrics update automatically

**Expected Results:**
- ✅ Metrics display real data from Analytics Service
- ✅ "Today's Sales" shows current day total
- ✅ Percentage change indicators (↑/↓) work
- ✅ "Active Deliveries" count updates
- ✅ Auto-refresh every 30-60 seconds
- ✅ Error handling if Analytics Service unavailable

**API Calls:**
```
GET http://localhost:8080/api/analytics/store/{storeId}/sales/today
GET http://localhost:8080/api/analytics/store/{storeId}/sales/yesterday
GET http://localhost:8080/api/analytics/store/{storeId}/avgOrderValue/today
GET http://localhost:8080/api/users/drivers/status/{storeId}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 3.6: Order History Page
**URL:** `http://localhost:3000/pos/history`

**Test Steps:**
1. Navigate to Order History (F2 from POS)
2. Verify today's orders display
3. Test search by order number
4. Test filter by order type (DINE_IN, PICKUP, DELIVERY)
5. Test filter by status
6. Click on an order to view details
7. Verify pagination if > 20 orders

**Expected Results:**
- ✅ All today's orders listed with order number, time, total
- ✅ Search finds orders instantly
- ✅ Filters work correctly
- ✅ Order details show complete information
- ✅ Status badges color-coded

**Status:** [ ] Pass [ ] Fail

---

### Test 3.7: Reports Page (Manager Only)
**URL:** `http://localhost:3000/pos/reports`

**Test Steps:**
1. Login as MANAGER
2. Navigate to Reports (F3)
3. Verify sales summary charts
4. Check date range selector
5. Test export functionality (if implemented)
6. Verify staff performance metrics

**Expected Results:**
- ✅ Reports page only accessible to MANAGER role
- ✅ Charts display correctly
- ✅ Date filtering works
- ✅ Data matches actual orders

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 4: Kitchen Display System

### Test 4.1: Kitchen Queue Display
**URL:** `http://localhost:3000/kitchen`

**Test Steps:**
1. Login as STAFF or MANAGER
2. Navigate to Kitchen Display
3. Verify 5-column Kanban board:
   - RECEIVED
   - PREPARING
   - COOKING (with oven timer)
   - READY
   - COMPLETED
4. Check real-time polling (new orders appear within 5 seconds)
5. Verify order cards show:
   - Order number
   - Items with quantities
   - Timestamp
   - Timer (minutes since order placed)

**Expected Results:**
- ✅ All columns visible with drag-and-drop zones
- ✅ Orders sorted by time (oldest first)
- ✅ Real-time updates without manual refresh
- ✅ Urgent orders highlighted (>15 minutes)

**Status:** [ ] Pass [ ] Fail

---

### Test 4.2: Move Orders Through Stages
**URL:** `http://localhost:3000/kitchen`

**Test Steps:**
1. Create new order via POS
2. In Kitchen Display, verify order in RECEIVED
3. Click "Start Preparing" → Move to PREPARING
4. Click "Start Cooking" → Move to COOKING
5. Verify 7-minute oven timer starts
6. Wait or click "Mark Ready" → Move to READY
7. Assign driver (if delivery order)
8. Move to COMPLETED

**Expected Results:**
- ✅ Orders move between columns smoothly
- ✅ Oven timer counts down in COOKING stage
- ✅ Status updates persist on refresh
- ✅ API calls successful for each stage change

**API Calls:**
```
PATCH http://localhost:8080/api/orders/{orderId}/status
{
  "status": "PREPARING",
  "updatedBy": "staff_user_id"
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 4.3: Oven Timer Feature
**URL:** `http://localhost:3000/kitchen`

**Test Steps:**
1. Move order to COOKING stage
2. Verify 7-minute countdown timer appears on order card
3. Let timer run for 1-2 minutes
4. Refresh page → Verify timer continues correctly
5. When timer reaches 0 → Verify visual/audio alert (if implemented)

**Expected Results:**
- ✅ Timer displays as "7:00" initially
- ✅ Counts down every second
- ✅ Timer persists across page refreshes
- ✅ Alert when cooking complete

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 5: Driver Application

### Test 5.1: Driver Clock In/Out (GPS)
**URL:** `http://localhost:3000/driver`

**Test Steps:**
1. Login as DRIVER user
2. Driver Dashboard loads
3. Request location permission when prompted
4. Click "Clock In" button
5. Verify GPS coordinates captured
6. Check session timer starts
7. Toggle status: Available → On Break → Available
8. After some time, click "Clock Out"
9. Verify session ends and stats saved

**Expected Results:**
- ✅ Location permission requested properly
- ✅ Clock In captures lat/lng coordinates
- ✅ Session timer displays (e.g., "2h 15m")
- ✅ Online/Offline status toggle works
- ✅ Clock Out ends session with GPS coordinates

**API Calls:**
```
POST http://localhost:8080/api/users/working-sessions/start
{
  "userId": "driver_user_id",
  "storeId": "store123",
  "shiftType": "FULL_DAY",
  "clockInLocation": {
    "lat": 17.385,
    "lng": 78.486
  }
}

POST http://localhost:8080/api/users/working-sessions/end
{
  "sessionId": "session123",
  "clockOutLocation": {
    "lat": 17.385,
    "lng": 78.486
  }
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 5.2: Active Deliveries
**URL:** `http://localhost:3000/driver/active`

**Test Steps:**
1. Ensure driver is clocked in and online
2. From Kitchen Display, assign delivery order to this driver
3. Navigate to Driver App → Active Deliveries tab
4. Verify assigned order appears
5. Click on order to view details:
   - Customer name, phone, address
   - Order items
   - Delivery instructions
6. Click "Navigate" → Verify Google Maps link opens
7. Click "Call Customer" → Verify phone dialer opens
8. Click "Mark as Delivered"
9. Verify order moves to History

**Expected Results:**
- ✅ Assigned orders appear immediately
- ✅ Order cards show essential delivery info
- ✅ "Navigate" opens Google Maps with destination
- ✅ "Call" button initiates phone call
- ✅ "Mark Delivered" updates order status to DELIVERED
- ✅ Order removed from active list after delivery

**API Calls:**
```
GET http://localhost:8080/api/orders/driver/{driverId}/assigned

PATCH http://localhost:8080/api/orders/{orderId}/status
{
  "status": "DELIVERED",
  "updatedBy": "driver_user_id"
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 5.3: Delivery History
**URL:** `http://localhost:3000/driver/history`

**Test Steps:**
1. Navigate to History tab
2. Verify past deliveries display
3. Test date filter (Today, This Week, This Month)
4. Test search by order number or customer name
5. Click on completed order to view details
6. Verify earnings and distance calculated

**Expected Results:**
- ✅ All completed deliveries listed
- ✅ Filters work correctly
- ✅ Search finds orders
- ✅ Order details accurate
- ✅ Earnings displayed per order

**Status:** [ ] Pass [ ] Fail

---

### Test 5.4: Driver Profile & Stats
**URL:** `http://localhost:3000/driver/profile`

**Test Steps:**
1. Navigate to Profile tab
2. Verify driver information displays
3. Check today's stats:
   - Deliveries completed
   - Total earnings
   - Distance covered
   - Hours worked
4. Check weekly/monthly summaries
5. Verify performance rating (if implemented)

**Expected Results:**
- ✅ Profile shows driver name, ID, store
- ✅ Today's stats accurate
- ✅ Weekly earnings calculated correctly
- ✅ Distance in kilometers
- ✅ Session hours tracked

**Status:** [ ] Pass [ ] Fail

---

### Test 5.5: Bottom Navigation (Mobile)
**URL:** `http://localhost:3000/driver`

**Test Steps:**
1. Open Driver App in mobile view (DevTools → Mobile emulator)
2. Verify bottom navigation bar displays:
   - Home
   - Active (with badge count)
   - History
   - Profile
3. Tap each tab and verify navigation
4. Check active deliveries badge updates

**Expected Results:**
- ✅ Bottom nav fixed at bottom on mobile
- ✅ Icons and labels visible
- ✅ Badge shows active delivery count
- ✅ Navigation smooth
- ✅ Touch-friendly targets

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 6: Manager Dashboard

### Test 6.1: Manager Overview
**URL:** `http://localhost:3000/manager`

**Test Steps:**
1. Login as MANAGER
2. Verify dashboard loads with multiple sections:
   - Sales overview
   - Order statistics
   - Staff performance
   - Real-time metrics
3. Check date range selector
4. Verify charts render correctly

**Expected Results:**
- ✅ Dashboard accessible only to MANAGER role
- ✅ All metrics display real data
- ✅ Charts interactive
- ✅ Date filtering works

**Status:** [ ] Pass [ ] Fail

---

### Test 6.2: Staff Management
**URL:** `http://localhost:3000/manager/staff`

**Test Steps:**
1. Navigate to Staff section
2. View list of employees
3. Check staff status (Active, On Break, Offline)
4. View staff performance metrics
5. Test filtering by role

**Expected Results:**
- ✅ All staff listed with current status
- ✅ Performance metrics accurate
- ✅ Filters work
- ✅ Real-time status updates

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 7: Analytics Service Integration

### Test 7.1: Sales Metrics API
**Endpoint:** `GET /api/analytics/store/{storeId}/sales/today`

**Test Steps:**
1. Use Postman or curl to call endpoint
2. Verify response includes:
   - Total sales for today
   - Number of orders
   - Timestamp
3. Create new order via POS
4. Call API again
5. Verify sales total increased

**Expected Response:**
```json
{
  "storeId": "store123",
  "date": "2025-10-23",
  "totalSales": 2450.00,
  "orderCount": 12,
  "averageOrderValue": 204.17
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 7.2: Driver Status API
**Endpoint:** `GET /api/analytics/store/{storeId}/drivers/status`

**Test Steps:**
1. Login 2-3 drivers and clock them in
2. Call driver status endpoint
3. Verify response shows:
   - Online drivers count
   - Available drivers count
   - Drivers on delivery
4. Clock out one driver
5. Call API again, verify counts updated

**Expected Response:**
```json
{
  "storeId": "store123",
  "onlineDrivers": 3,
  "availableDrivers": 2,
  "onDelivery": 1,
  "offlineDrivers": 0
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 7.3: Redis Caching
**Test Steps:**
1. Call sales API endpoint → Note response time
2. Call same endpoint again within 5 minutes
3. Verify response time faster (served from cache)
4. Check Redis CLI:
   ```bash
   redis-cli
   KEYS analytics:*
   GET analytics:store:store123:sales:today
   ```
5. Verify cached data exists

**Expected Results:**
- ✅ First call queries MongoDB (~50-100ms)
- ✅ Cached calls faster (~5-10ms)
- ✅ Cache expires after TTL (5min for sales, 2min for drivers)
- ✅ Fresh data after cache expiry

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 8: Real-Time Updates

### Test 8.1: Kitchen Display Polling
**Test Steps:**
1. Open Kitchen Display in Browser 1
2. Open POS System in Browser 2
3. Create new order in POS
4. Monitor Kitchen Display
5. Verify new order appears within 5 seconds

**Expected Results:**
- ✅ Kitchen Display polls every 5 seconds
- ✅ New orders appear automatically
- ✅ No manual refresh needed
- ✅ Network errors handled gracefully

**Status:** [ ] Pass [ ] Fail

---

### Test 8.2: Driver App Polling
**Test Steps:**
1. Open Driver App
2. Clock in and go online
3. In Kitchen Display, assign order to driver
4. Monitor Driver App Active Deliveries
5. Verify order appears within 30 seconds

**Expected Results:**
- ✅ Driver app polls every 30 seconds
- ✅ New assignments appear automatically
- ✅ Badge count updates

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 9: Complete Order Flow (E2E)

### Test 9.1: Full Journey - Dine-In Order
**Duration:** ~5 minutes

**Steps:**
1. **POS:** Create dine-in order for Table 3
2. **Kitchen:** Verify order in RECEIVED column
3. **Kitchen:** Move through PREPARING → COOKING → READY
4. **Kitchen:** Move to COMPLETED
5. **POS:** Verify in Order History as COMPLETED

**Expected Results:**
- ✅ Order flows through all stages
- ✅ Status updates persist
- ✅ Timers work correctly
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

---

### Test 9.2: Full Journey - Delivery Order
**Duration:** ~10 minutes

**Steps:**
1. **POS:** Create delivery order with customer address
2. **Kitchen:** Verify order appears
3. **Kitchen:** Move to PREPARING → COOKING → READY
4. **Kitchen:** Assign to Driver (select from dropdown)
5. **Driver App:** Clock in and go online
6. **Driver App:** Verify order in Active Deliveries
7. **Driver App:** Click "Navigate" (opens Google Maps)
8. **Driver App:** Click "Mark as Delivered"
9. **Driver App:** Verify order moves to History
10. **Manager Dashboard:** Check delivery stats updated

**Expected Results:**
- ✅ Complete flow works end-to-end
- ✅ Driver assignment successful
- ✅ Navigation and calling features work
- ✅ Delivery marked successfully
- ✅ Analytics reflect delivery completion
- ✅ Order history accurate across all apps

**Status:** [ ] Pass [ ] Fail

---

## 📊 Test Results Summary

### Overall Test Coverage:
- [ ] Public Website: __ / 3 tests passed
- [ ] Authentication: __ / 1 test passed
- [ ] POS System: __ / 7 tests passed
- [ ] Kitchen Display: __ / 3 tests passed
- [ ] Driver Application: __ / 5 tests passed
- [ ] Manager Dashboard: __ / 2 tests passed
- [ ] Analytics Service: __ / 3 tests passed
- [ ] Real-Time Updates: __ / 2 tests passed
- [ ] Complete E2E Flow: __ / 2 tests passed

**Total:** __ / 28 tests passed

---

## 🐛 Known Issues & Bugs

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |

---

## ✅ Sign-Off

- **Tester Name:** _______________________
- **Date:** _______________________
- **Environment:** Development / Staging / Production
- **Result:** PASS / FAIL / PARTIAL

---

## 📝 Notes

Add any additional observations, performance issues, or recommendations here.

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
