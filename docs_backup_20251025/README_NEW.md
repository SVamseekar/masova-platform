# MaSoVa Restaurant Management System

**A comprehensive, production-ready restaurant management platform built with Java 21, Spring Boot, MongoDB, and React.**

---

## 📚 Documentation Index

This project has comprehensive documentation organized by purpose. Start here:

### 🚀 Getting Started
- **[Project Instructions](MaSoVa_project_instructions.md)** - Setup, installation, quick start guides
- **[Navigation Guide](NAVIGATION_GUIDE.md)** - How to navigate the codebase

### 📋 Planning & Development
- **[Project Roadmap](MaSoVa_project_roadmap.md)** - High-level timeline and milestones
- **[Project Phases](MaSoVa_project_phases.md)** - Detailed phase-by-phase development history
- **[Phase 4.5 Complete Plan](PHASE_4.5_COMPLETE_SEGREGATION_PLAN.md)** - Detailed Phase 4.5 breakdown

### 🔧 Technical Documentation
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference for all services
- **[Frontend-Backend Connection](FRONTEND_BACKEND_CONNECTION.md)** - Integration guide and testing
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### 👥 User Guides
- **[User Manuals](USER_MANUALS.md)** - End-user documentation for all applications

---

## ⚡ Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d mongodb redis

# 2. Start backend services (separate terminals)
cd api-gateway && mvn spring-boot:run      # Port 8080
cd user-service && mvn spring-boot:run     # Port 8081
cd menu-service && mvn spring-boot:run     # Port 8082
cd order-service && mvn spring-boot:run    # Port 8083
cd analytics-service && mvn spring-boot:run # Port 8085

# 3. Start frontend
cd frontend && npm install && npm run dev   # Port 5173
```

Access at: **http://localhost:5173**

**Test Credentials:**
- Manager: `manager@masova.com` / `Manager@123`
- Staff: `staff@masova.com` / `Staff@123`
- Driver: `driver@masova.com` / `Driver@123`

---

## 🏗️ System Architecture

**Backend (5 Microservices):**
- API Gateway (8080) - Routing, auth, rate limiting
- User Service (8081) - Authentication, sessions
- Menu Service (8082) - Menu management
- Order Service (8083) - Order processing
- Analytics Service (8085) - Real-time metrics

**Frontend (6 Applications):**
- Public Website - Landing page, promotions
- Customer App - Online ordering
- POS System - In-store operations
- Kitchen Display - Order management
- Driver App - Delivery management
- Manager Dashboard - Analytics & reports

**Infrastructure:**
- MongoDB - Data storage
- Redis - Caching layer
- WebSocket - Real-time updates

---

## 📊 Current Status

**Completed:** Phases 1-4.5 (75% of Phase 4.5)
- ✅ User Management & Authentication
- ✅ Session Tracking & Working Hours
- ✅ Multi-Cuisine Menu System
- ✅ Complete Order Management (6-stage lifecycle)
- ✅ Real-time WebSocket Updates
- ✅ API Gateway with JWT Auth
- ✅ POS System Frontend
- ✅ Kitchen Display System
- ✅ Driver Application
- ✅ Public Website
- ✅ Analytics Service

**Next:** Phase 5 (Payment Integration with Razorpay)

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Java 21, Spring Boot 3.x, Spring Security, MongoDB, Redis |
| Frontend | React 18, TypeScript, Redux Toolkit, Material-UI, Vite |
| Real-time | WebSocket (STOMP + SockJS) |
| Build | Maven, npm |
| Deployment | Docker, Docker Compose |

---

## 📖 Key Features

- **Multi-role System** - Customer, Staff, Driver, Manager
- **Real-time Updates** - WebSocket for live order tracking
- **6-Stage Order Lifecycle** - RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → DELIVERED
- **GPS Tracking** - Driver location and delivery management
- **Analytics Dashboard** - Real-time sales metrics
- **Indian Market Focus** - INR currency, local phone validation
- **Keyboard Shortcuts** - Efficient POS operations (F1-F3, Ctrl+Enter)
- **Mobile-Optimized** - Driver app with bottom navigation

---

## 🎯 For Developers

Start with these documents in order:

1. **[Navigation Guide](NAVIGATION_GUIDE.md)** - Understand the codebase structure
2. **[Project Instructions](MaSoVa_project_instructions.md)** - Set up your dev environment
3. **[API Documentation](API_DOCUMENTATION.md)** - Explore available endpoints
4. **[Frontend-Backend Connection](FRONTEND_BACKEND_CONNECTION.md)** - Integration patterns

---

## 🎯 For Project Managers

Review these documents:

1. **[Project Roadmap](MaSoVa_project_roadmap.md)** - Overall timeline
2. **[Project Phases](MaSoVa_project_phases.md)** - Detailed progress
3. **[Phase 4.5 Plan](PHASE_4.5_COMPLETE_SEGREGATION_PLAN.md)** - Current work

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with real-world restaurant management experience** 🍕
