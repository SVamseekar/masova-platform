# MaSoVa Restaurant Management System
# Microservices to Monolithic Architecture Migration Plan

**Document Version:** 1.0
**Date:** December 11, 2025
**Author:** Architecture Team

---

  The document covers:

  1. Executive Summary - Benefits, challenges, and scope
  2. Current Architecture Analysis - All 11 microservices, ports, databases, communication patterns
  3. Target Architecture - Proposed monolithic package structure
  4. 10 Migration Phases with detailed code examples:
    - Project Setup
    - Database Consolidation
    - Service Layer Migration
    - Controller Migration
    - Security Consolidation
    - WebSocket Consolidation
    - Configuration Consolidation
    - Remove Deprecated Components
    - Caching Implementation
    - Scheduled Tasks Consolidation
  5. Database Strategy - Collection naming, indexes, migration scripts
  6. Code Transformation Guide - Before/after examples for removing HTTP clients, circuit breakers
  7. Configuration Consolidation - Unified application.yml, Docker setup
  8. Security Implementation - Role-based access matrix
  9. Frontend Changes - Minimal updates required
  10. Testing Strategy - Unit, integration, E2E testing approach
  11. Rollback Plan - Triggers, procedures, feature flags
  12. Risk Assessment - Risk matrix and success criteria
  13. Appendices - Complete MongoDB migration script, dependency comparison, cleanup checklist




---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Migration Phases](#4-migration-phases)
5. [Database Consolidation Strategy](#5-database-consolidation-strategy)
6. [Code Transformation Guide](#6-code-transformation-guide)
7. [Configuration Consolidation](#7-configuration-consolidation)
8. [Security Implementation](#8-security-implementation)
9. [Frontend Changes](#9-frontend-changes)
10. [Testing Strategy](#10-testing-strategy)
11. [Rollback Plan](#11-rollback-plan)
12. [Risk Assessment](#12-risk-assessment)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document outlines the comprehensive plan to migrate the MaSoVa Restaurant Management System from a microservices architecture (11 services) to a unified monolithic application.

### 1.2 Scope

The migration covers:
- All 11 microservices consolidation
- Database unification (10+ MongoDB databases → 1)
- API Gateway elimination
- Inter-service communication removal
- Frontend minimal updates

### 1.3 Key Benefits

| Benefit | Description |
|---------|-------------|
| **Simplified Deployment** | Single JAR/container instead of 11 separate services |
| **Reduced Latency** | Direct method calls replace HTTP communication |
| **ACID Transactions** | Cross-domain transactional consistency |
| **Lower Infrastructure Cost** | Single JVM vs 11 JVMs (~60-70% resource reduction) |
| **Easier Debugging** | Unified logging, single process debugging |
| **Simplified Operations** | No service discovery, load balancing between services |

### 1.4 Key Challenges

| Challenge | Mitigation Strategy |
|-----------|---------------------|
| Single point of failure | Horizontal scaling, health monitoring |
| Longer build times | Incremental builds, modular structure |
| Team coordination | Clear package boundaries, code ownership |
| Migration downtime | Phased rollout, feature flags |

---

## 2. Current Architecture Analysis

### 2.1 Microservices Inventory

| Service | Port | Database | Primary Responsibility |
|---------|------|----------|----------------------|
| API Gateway | 8080 | - | Routing, JWT auth, rate limiting |
| User Service | 8081 | masova_db | Authentication, staff, shifts, GDPR |
| Menu Service | 8082 | MaSoVa | Menu items, categories, pricing |
| Order Service | 8083 | masova_orders | Orders, kitchen display, WebSocket |
| Analytics Service | 8085 | masova_analytics | BI, reporting, dashboards |
| Payment Service | 8086 | masova_payments | Razorpay integration, refunds |
| Inventory Service | 8088 | masova_inventory | Stock, waste, purchase orders |
| Review Service | 8089 | MaSoVa_reviews | Ratings, responses |
| Delivery Service | 8090 | delivery_db | Tracking, drivers, routes |
| Customer Service | 8091 | masova_customers | Profiles, loyalty programs |
| Notification Service | 8092 | masova-notification | Email, SMS, push notifications |

### 2.2 Shared Modules

| Module | Purpose |
|--------|---------|
| shared-models | Common entities, DTOs, configurations |
| shared-security | JWT provider, security base config |
| shared | Additional utilities |

### 2.3 Inter-Service Communication Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (8080)                          │
│                    JWT Auth, Rate Limiting, Routing                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  User Service │           │ Order Service │           │ Menu Service  │
│    (8081)     │           │    (8083)     │           │    (8082)     │
└───────────────┘           └───────┬───────┘           └───────────────┘
        │                           │                           ▲
        │                           │ REST calls                │
        │                           ├───────────────────────────┘
        │                           │
        │                           ├──────────────────┐
        │                           │                  │
        │                           ▼                  ▼
        │                   ┌───────────────┐  ┌───────────────┐
        │                   │   Delivery    │  │   Payment     │
        │                   │   Service     │  │   Service     │
        │                   │    (8090)     │  │    (8086)     │
        │                   └───────────────┘  └───────────────┘
        │                           │
        │                           ▼
        │                   ┌───────────────┐
        │                   │   Customer    │
        │                   │   Service     │
        │                   │    (8091)     │
        │                   └───────────────┘
        │
        ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Analytics    │    │  Inventory    │    │ Notification  │
│   Service     │    │   Service     │    │   Service     │
│    (8085)     │    │    (8088)     │    │    (8092)     │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 2.4 Current Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Java 17, Spring Boot 3.x |
| Database | MongoDB 6.x |
| Cache | Redis 7.x |
| Message Broker | WebSocket (STOMP) |
| API Gateway | Spring Cloud Gateway |
| Resilience | Resilience4j |
| Security | Spring Security, JWT (JJWT) |
| Build | Maven |
| Frontend | React 19, TypeScript, Redux Toolkit |

---

## 3. Target Architecture

### 3.1 Monolithic Structure

```
masova-monolith/
├── pom.xml                          # Single Maven project
├── src/
│   ├── main/
│   │   ├── java/com/MaSoVa/
│   │   │   ├── MaSoVaApplication.java      # Main entry point
│   │   │   │
│   │   │   ├── config/                     # All configurations
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── WebSocketConfig.java
│   │   │   │   ├── CacheConfig.java
│   │   │   │   ├── MongoConfig.java
│   │   │   │   ├── AsyncConfig.java
│   │   │   │   └── SchedulerConfig.java
│   │   │   │
│   │   │   ├── security/                   # Security components
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── UserDetailsServiceImpl.java
│   │   │   │
│   │   │   ├── common/                     # Shared utilities
│   │   │   │   ├── exception/
│   │   │   │   ├── validation/
│   │   │   │   ├── dto/
│   │   │   │   └── util/
│   │   │   │
│   │   │   ├── user/                       # User domain
│   │   │   │   ├── controller/
│   │   │   │   │   ├── UserController.java
│   │   │   │   │   ├── StoreController.java
│   │   │   │   │   ├── ShiftController.java
│   │   │   │   │   └── GdprController.java
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── menu/                       # Menu domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── order/                      # Order domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   ├── dto/
│   │   │   │   └── websocket/
│   │   │   │
│   │   │   ├── payment/                    # Payment domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── delivery/                   # Delivery domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── customer/                   # Customer domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── inventory/                  # Inventory domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── analytics/                  # Analytics domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── notification/               # Notification domain
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   └── review/                     # Review domain
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── repository/
│   │   │       ├── entity/
│   │   │       └── dto/
│   │   │
│   │   └── resources/
│   │       ├── application.yml             # Unified configuration
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── logback-spring.xml
│   │
│   └── test/
│       └── java/com/MaSoVa/
│           ├── user/
│           ├── menu/
│           ├── order/
│           └── ...
│
└── frontend/                               # React application (minimal changes)
```

### 3.2 API Endpoints (Preserved)

All existing API paths remain unchanged for frontend compatibility:

| Domain | Base Path | Key Endpoints |
|--------|-----------|---------------|
| User | `/api/users` | login, register, refresh, profile |
| Store | `/api/stores` | CRUD, assignments |
| Menu | `/api/menu` | items, categories, public |
| Order | `/api/orders` | create, status, history |
| Payment | `/api/payment` | initiate, verify, refund |
| Delivery | `/api/delivery` | tracking, drivers, zones |
| Customer | `/api/customers` | profile, loyalty, preferences |
| Inventory | `/api/inventory` | stock, waste, purchase-orders |
| Analytics | `/api/analytics` | sales, staff, reports |
| Notification | `/api/notifications` | send, templates, preferences |
| Review | `/api/reviews` | create, respond, moderate |

---

## 4. Migration Phases

### Phase 1: Project Setup & Structure (Foundation)

**Objective:** Create the monolithic project skeleton

**Tasks:**

1.1 Create new Maven project with unified `pom.xml`
```xml
<project>
    <groupId>com.MaSoVa</groupId>
    <artifactId>masova-monolith</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <java.version>17</java.version>
        <spring-boot.version>3.2.0</spring-boot.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>

        <!-- External Integrations -->
        <dependency>
            <groupId>com.razorpay</groupId>
            <artifactId>razorpay-java</artifactId>
            <version>1.4.3</version>
        </dependency>
        <dependency>
            <groupId>com.sendgrid</groupId>
            <artifactId>sendgrid-java</artifactId>
            <version>4.9.3</version>
        </dependency>
        <dependency>
            <groupId>com.twilio.sdk</groupId>
            <artifactId>twilio</artifactId>
            <version>9.2.0</version>
        </dependency>
        <dependency>
            <groupId>com.google.firebase</groupId>
            <artifactId>firebase-admin</artifactId>
            <version>9.1.1</version>
        </dependency>

        <!-- Utilities -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>1.5.5.Final</version>
        </dependency>

        <!-- Monitoring -->
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
        </dependency>
    </dependencies>
</project>
```

1.2 Create package structure as defined in Section 3.1

1.3 Create main application class:
```java
@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableCaching
public class MaSoVaApplication {
    public static void main(String[] args) {
        SpringApplication.run(MaSoVaApplication.class, args);
    }
}
```

**Deliverables:**
- [ ] New Maven project created
- [ ] All packages created
- [ ] Main application class created
- [ ] Basic configuration files in place

---

### Phase 2: Database Consolidation

**Objective:** Migrate from 10+ databases to single unified database

**Tasks:**

2.1 Create database migration scripts

2.2 Update entity annotations with new collection names:

| Original Database | Original Collection | New Collection Name |
|-------------------|--------------------|--------------------|
| masova_db | users | users |
| masova_db | stores | stores |
| masova_db | shifts | shifts |
| masova_db | working_sessions | working_sessions |
| masova_db | gdpr_consents | gdpr_consents |
| MaSoVa | menu_items | menu_items |
| MaSoVa | categories | menu_categories |
| masova_orders | orders | orders |
| masova_payments | transactions | payment_transactions |
| masova_payments | refunds | payment_refunds |
| masova_customers | customers | customers |
| masova_customers | loyalty_points | customer_loyalty |
| masova_inventory | inventory_items | inventory_items |
| masova_inventory | waste_records | inventory_waste |
| masova_inventory | purchase_orders | inventory_purchase_orders |
| delivery_db | delivery_trackings | deliveries |
| delivery_db | driver_locations | delivery_driver_locations |
| masova_analytics | daily_summaries | analytics_daily |
| masova-notification | notifications | notifications |
| masova-notification | templates | notification_templates |
| MaSoVa_reviews | reviews | reviews |

2.3 Create MongoDB migration script:
```javascript
// migration-script.js
// Run: mongosh < migration-script.js

// Create unified database
use masova_unified;

// Migrate users
db.getSiblingDB('masova_db').users.find().forEach(function(doc) {
    db.users.insertOne(doc);
});

// Migrate stores
db.getSiblingDB('masova_db').stores.find().forEach(function(doc) {
    db.stores.insertOne(doc);
});

// Migrate menu items
db.getSiblingDB('MaSoVa').menuItems.find().forEach(function(doc) {
    db.menu_items.insertOne(doc);
});

// Migrate orders
db.getSiblingDB('masova_orders').orders.find().forEach(function(doc) {
    db.orders.insertOne(doc);
});

// Migrate payments
db.getSiblingDB('masova_payments').transactions.find().forEach(function(doc) {
    db.payment_transactions.insertOne(doc);
});

// Migrate customers
db.getSiblingDB('masova_customers').customers.find().forEach(function(doc) {
    db.customers.insertOne(doc);
});

// Migrate inventory
db.getSiblingDB('masova_inventory').inventoryItems.find().forEach(function(doc) {
    db.inventory_items.insertOne(doc);
});

// Migrate deliveries
db.getSiblingDB('delivery_db').deliveryTrackings.find().forEach(function(doc) {
    db.deliveries.insertOne(doc);
});

// Migrate notifications
db.getSiblingDB('masova-notification').notifications.find().forEach(function(doc) {
    db.notifications.insertOne(doc);
});

// Migrate reviews
db.getSiblingDB('MaSoVa_reviews').reviews.find().forEach(function(doc) {
    db.reviews.insertOne(doc);
});

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 });
db.users.createIndex({ "storeId": 1 });

db.orders.createIndex({ "storeId": 1, "createdAt": -1 });
db.orders.createIndex({ "customerId": 1 });
db.orders.createIndex({ "status": 1 });

db.menu_items.createIndex({ "storeId": 1, "isAvailable": 1 });
db.menu_items.createIndex({ "category": 1 });

db.customers.createIndex({ "phone": 1 }, { unique: true });
db.customers.createIndex({ "email": 1 });

db.deliveries.createIndex({ "orderId": 1 });
db.deliveries.createIndex({ "driverId": 1, "status": 1 });

db.inventory_items.createIndex({ "storeId": 1, "sku": 1 });

print("Migration completed successfully!");
```

2.4 Update MongoDB configuration:
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/masova_unified
      auto-index-creation: true
```

**Deliverables:**
- [ ] Migration scripts created and tested
- [ ] All entities updated with new collection names
- [ ] Data migrated to unified database
- [ ] Indexes created
- [ ] Data integrity verified

---

### Phase 3: Service Layer Migration

**Objective:** Copy and adapt all service classes, removing HTTP client dependencies

**Tasks:**

3.1 Migrate service classes from each microservice

3.2 Replace HTTP client calls with direct service injection

**Example Transformation - OrderService:**

**BEFORE (Microservice):**
```java
@Service
public class OrderService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.menu.url}")
    private String menuServiceUrl;

    @Value("${services.delivery.url}")
    private String deliveryServiceUrl;

    @CircuitBreaker(name = "menuService", fallbackMethod = "getMenuItemFallback")
    public MenuItem getMenuItem(String menuItemId) {
        return restTemplate.getForObject(
            menuServiceUrl + "/api/menu/items/" + menuItemId,
            MenuItem.class
        );
    }

    public MenuItem getMenuItemFallback(String menuItemId, Exception e) {
        log.warn("Menu service unavailable, using fallback");
        return null;
    }

    @CircuitBreaker(name = "deliveryService", fallbackMethod = "calculateDeliveryFeeFallback")
    public DeliveryFeeResponse calculateDeliveryFee(String storeId, double lat, double lng) {
        String url = deliveryServiceUrl + "/api/delivery/zone/fee?storeId=" + storeId
            + "&latitude=" + lat + "&longitude=" + lng;
        return restTemplate.getForObject(url, DeliveryFeeResponse.class);
    }

    public DeliveryFeeResponse calculateDeliveryFeeFallback(String storeId, double lat, double lng, Exception e) {
        return new DeliveryFeeResponse(50.0, true); // Default fallback fee
    }
}
```

**AFTER (Monolith):**
```java
@Service
public class OrderService {

    @Autowired
    private MenuService menuService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private NotificationService notificationService;

    public MenuItem getMenuItem(String menuItemId) {
        return menuService.getMenuItemById(menuItemId);
    }

    public DeliveryFeeResponse calculateDeliveryFee(String storeId, double lat, double lng) {
        return deliveryService.calculateFee(storeId, lat, lng);
    }

    @Transactional  // Now possible with single database!
    public Order createOrder(CreateOrderRequest request) {
        // Validate menu items
        validateMenuItems(request.getItems());

        // Get or create customer
        Customer customer = customerService.getOrCreateByPhone(request.getPhone());

        // Calculate delivery fee if delivery order
        if (request.isDelivery()) {
            DeliveryFeeResponse fee = calculateDeliveryFee(
                request.getStoreId(),
                request.getLatitude(),
                request.getLongitude()
            );
            request.setDeliveryFee(fee.getFee());
        }

        // Create order
        Order order = orderRepository.save(buildOrder(request, customer));

        // Reserve inventory
        inventoryService.reserveItems(order.getItems(), order.getStoreId());

        // Send confirmation notification
        notificationService.sendOrderConfirmation(order, customer);

        return order;
    }
}
```

3.3 Services to migrate (in order):

| Priority | Service | Dependencies |
|----------|---------|--------------|
| 1 | UserService | None |
| 2 | StoreService | UserService |
| 3 | MenuService | StoreService |
| 4 | CustomerService | None |
| 5 | InventoryService | StoreService |
| 6 | DeliveryService | StoreService |
| 7 | NotificationService | UserService, CustomerService |
| 8 | PaymentService | None (external: Razorpay) |
| 9 | OrderService | Menu, Customer, Delivery, Inventory, Notification |
| 10 | ReviewService | Customer, Order |
| 11 | AnalyticsService | All services |

**Deliverables:**
- [ ] All service classes migrated
- [ ] HTTP clients removed
- [ ] Direct service injections implemented
- [ ] Unit tests passing

---

### Phase 4: Controller Migration

**Objective:** Consolidate all REST controllers

**Tasks:**

4.1 Copy all controller classes maintaining original request mappings

4.2 Update controller package references

4.3 Remove gateway-specific annotations

**Controller Mapping Summary:**

```java
// User Domain Controllers
@RestController
@RequestMapping("/api/users")
public class UserController { }

@RestController
@RequestMapping("/api/stores")
public class StoreController { }

@RestController
@RequestMapping("/api/shifts")
public class ShiftController { }

@RestController
@RequestMapping("/api/gdpr")
public class GdprController { }

// Menu Domain
@RestController
@RequestMapping("/api/menu")
public class MenuController { }

// Order Domain
@RestController
@RequestMapping("/api/orders")
public class OrderController { }

// Payment Domain
@RestController
@RequestMapping("/api/payment")
public class PaymentController { }

@RestController
@RequestMapping("/api/payment/webhook")
public class WebhookController { }

// Delivery Domain
@RestController
@RequestMapping("/api/delivery")
public class DeliveryController { }

@RestController
@RequestMapping("/api/delivery/tracking")
public class TrackingController { }

@RestController
@RequestMapping("/api/delivery/dispatch")
public class DispatchController { }

// Customer Domain
@RestController
@RequestMapping("/api/customers")
public class CustomerController { }

// Inventory Domain
@RestController
@RequestMapping("/api/inventory")
public class InventoryController { }

// Analytics Domain
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController { }

// Notification Domain
@RestController
@RequestMapping("/api/notifications")
public class NotificationController { }

// Review Domain
@RestController
@RequestMapping("/api/reviews")
public class ReviewController { }
```

**Deliverables:**
- [ ] All controllers migrated
- [ ] API paths preserved
- [ ] Swagger documentation updated

---

### Phase 5: Security Consolidation

**Objective:** Implement unified security configuration

**Tasks:**

5.1 Create unified SecurityConfig:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(
                    "/api/users/login",
                    "/api/users/register",
                    "/api/users/refresh",
                    "/api/menu/public/**",
                    "/api/reviews/public/**",
                    "/api/customers/get-or-create",
                    "/api/payment/webhook",
                    "/actuator/health",
                    "/actuator/info",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/ws/**"
                ).permitAll()

                // Admin only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Manager endpoints
                .requestMatchers(
                    "/api/analytics/**",
                    "/api/inventory/admin/**",
                    "/api/users/staff/**"
                ).hasAnyRole("ADMIN", "MANAGER")

                // Staff endpoints
                .requestMatchers(
                    "/api/orders/kitchen/**",
                    "/api/inventory/stock/**"
                ).hasAnyRole("ADMIN", "MANAGER", "STAFF")

                // Driver endpoints
                .requestMatchers("/api/delivery/driver/**").hasAnyRole("ADMIN", "DRIVER")

                // All authenticated users
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

5.2 Create unified JWT filter:

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            String userId = jwtTokenProvider.getUserIdFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
                );

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

5.3 Implement rate limiting (replacement for gateway rate limiting):

```java
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, RateLimiter> rateLimiters = new ConcurrentHashMap<>();

    private static final Map<String, Integer> RATE_LIMITS = Map.of(
        "/api/users/login", 10,
        "/api/users/register", 5,
        "/api/orders", 200,
        "/api/payment", 100,
        "/api/delivery", 150
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = request.getRemoteAddr();

        Integer limit = RATE_LIMITS.entrySet().stream()
            .filter(e -> path.startsWith(e.getKey()))
            .map(Map.Entry::getValue)
            .findFirst()
            .orElse(100); // default

        String key = clientIp + ":" + path;
        RateLimiter limiter = rateLimiters.computeIfAbsent(key,
            k -> RateLimiter.create(limit / 60.0)); // per second

        if (!limiter.tryAcquire()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Rate limit exceeded");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

**Deliverables:**
- [ ] Unified security config created
- [ ] JWT filter implemented
- [ ] Rate limiting implemented
- [ ] CORS configured
- [ ] All endpoints secured appropriately

---

### Phase 6: WebSocket Consolidation

**Objective:** Merge all WebSocket configurations

**Tasks:**

6.1 Create unified WebSocket configuration:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(
            "/topic/orders",           // Order status updates
            "/topic/kitchen",          // Kitchen display updates
            "/topic/delivery",         // Delivery tracking
            "/topic/driver",           // Driver assignments
            "/topic/notifications",    // Real-time notifications
            "/topic/inventory"         // Inventory alerts
        );
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins(
                "http://localhost:5173",
                "http://localhost:3000"
            )
            .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                    MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = accessor.getFirstNativeHeader("Authorization");
                    // Validate JWT token for WebSocket connections
                    if (token != null && token.startsWith("Bearer ")) {
                        // Validate and set authentication
                    }
                }
                return message;
            }
        });
    }
}
```

6.2 Create unified WebSocket controller:

```java
@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Order updates
    public void sendOrderUpdate(String orderId, OrderStatusUpdate update) {
        messagingTemplate.convertAndSend("/topic/orders/" + orderId, update);
    }

    // Kitchen display updates
    public void sendKitchenUpdate(String storeId, KitchenUpdate update) {
        messagingTemplate.convertAndSend("/topic/kitchen/" + storeId, update);
    }

    // Delivery tracking
    public void sendDeliveryUpdate(String trackingId, DeliveryUpdate update) {
        messagingTemplate.convertAndSend("/topic/delivery/" + trackingId, update);
    }

    // Driver location
    public void sendDriverLocation(String driverId, LocationUpdate location) {
        messagingTemplate.convertAndSend("/topic/driver/" + driverId + "/location", location);
    }

    // User notifications
    public void sendNotification(String userId, Notification notification) {
        messagingTemplate.convertAndSendToUser(userId, "/topic/notifications", notification);
    }

    // Inventory alerts
    public void sendInventoryAlert(String storeId, InventoryAlert alert) {
        messagingTemplate.convertAndSend("/topic/inventory/" + storeId, alert);
    }

    // Handle incoming messages
    @MessageMapping("/order/status")
    public void handleOrderStatusUpdate(OrderStatusMessage message, Principal principal) {
        // Process and broadcast
    }

    @MessageMapping("/driver/location")
    public void handleDriverLocation(DriverLocationMessage message, Principal principal) {
        // Process driver location update
    }
}
```

**Deliverables:**
- [ ] Unified WebSocket config created
- [ ] All topics consolidated
- [ ] WebSocket authentication implemented
- [ ] Real-time features tested

---

### Phase 7: Configuration Consolidation

**Objective:** Merge all configuration files

**Tasks:**

7.1 Create unified `application.yml`:

```yaml
# application.yml - Unified Configuration

server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: masova-monolith

  # MongoDB Configuration
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/masova_unified}
      auto-index-creation: true

  # Redis Configuration
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    lettuce:
      pool:
        max-active: 50
        max-idle: 25
        min-idle: 10
        max-wait: 5000ms

  # Jackson Configuration
  jackson:
    serialization:
      write-dates-as-timestamps: false
    deserialization:
      fail-on-unknown-properties: false
    default-property-inclusion: non_null

# JWT Configuration
jwt:
  secret: ${JWT_SECRET:your-512-bit-secret-key-here-must-be-at-least-64-characters-long}
  access-token-expiration: 3600000      # 1 hour
  refresh-token-expiration: 604800000   # 7 days

# External Service Integrations
razorpay:
  key-id: ${RAZORPAY_KEY_ID}
  key-secret: ${RAZORPAY_KEY_SECRET}
  webhook-secret: ${RAZORPAY_WEBHOOK_SECRET}

sendgrid:
  api-key: ${SENDGRID_API_KEY}
  from-email: ${SENDGRID_FROM_EMAIL:noreply@masova.com}
  enabled: ${SENDGRID_ENABLED:true}

twilio:
  account-sid: ${TWILIO_ACCOUNT_SID}
  auth-token: ${TWILIO_AUTH_TOKEN}
  phone-number: ${TWILIO_PHONE_NUMBER}
  enabled: ${TWILIO_ENABLED:true}

firebase:
  credentials-path: ${FIREBASE_CREDENTIALS_PATH:firebase-credentials.json}
  enabled: ${FIREBASE_ENABLED:true}

google:
  maps:
    api-key: ${GOOGLE_MAPS_API_KEY}

# Caching Configuration
cache:
  users:
    ttl: 3600        # 1 hour
  menu:
    ttl: 7200        # 2 hours
  customers:
    ttl: 7200        # 2 hours
  analytics:
    ttl: 300         # 5 minutes

# Actuator & Monitoring
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99

# Logging Configuration
logging:
  level:
    root: INFO
    com.MaSoVa: DEBUG
    org.springframework.security: INFO
    org.springframework.data.mongodb: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/masova.log
    max-size: 10MB
    max-history: 30

# Async Configuration
async:
  core-pool-size: 10
  max-pool-size: 50
  queue-capacity: 500

# Scheduled Tasks
scheduling:
  inventory:
    auto-po-cron: "0 0 2 * * ?"         # 2 AM daily
  analytics:
    daily-aggregation-cron: "0 0 0 * * ?"  # Midnight
  notification:
    queue-process-interval: 300000       # 5 minutes
```

7.2 Create environment-specific configurations:

**application-dev.yml:**
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/masova_unified_dev

logging:
  level:
    com.MaSoVa: DEBUG
    org.springframework.web: DEBUG
```

**application-prod.yml:**
```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI}

server:
  ssl:
    enabled: true
    key-store: ${SSL_KEYSTORE_PATH}
    key-store-password: ${SSL_KEYSTORE_PASSWORD}

logging:
  level:
    root: WARN
    com.MaSoVa: INFO
```

**Deliverables:**
- [ ] Unified application.yml created
- [ ] Environment profiles configured
- [ ] All external integrations configured
- [ ] Logging configured

---

### Phase 8: Remove Deprecated Components

**Objective:** Clean up microservice-specific code

**Tasks:**

8.1 **Delete entire modules/directories:**

```
DELETE:
├── api-gateway/                           # Entire module
├── */src/main/java/**/client/             # All HTTP client packages
│   ├── MenuServiceClient.java
│   ├── OrderServiceClient.java
│   ├── DeliveryServiceClient.java
│   ├── CustomerServiceClient.java
│   ├── InventoryServiceClient.java
│   ├── UserServiceClient.java
│   └── ...
├── */CircuitBreakerConfiguration.java     # All circuit breaker configs
├── */JwtForwardingInterceptor.java        # Inter-service auth
├── */CorrelationIdInterceptor.java        # Distributed tracing (optional keep)
└── shared-models/src/.../CircuitBreakerConfiguration.java
```

8.2 **Remove from pom.xml:**

```xml
<!-- REMOVE these dependencies -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-circuitbreaker</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

8.3 **Remove annotations:**

```java
// REMOVE these annotations from service classes
@CircuitBreaker(name = "...", fallbackMethod = "...")
@Retry(name = "...")
@RateLimiter(name = "...")
@TimeLimiter(name = "...")
```

8.4 **Remove fallback methods:**

```java
// REMOVE fallback methods like:
public MenuItem getMenuItemFallback(String menuItemId, Exception e) { }
public DeliveryFeeResponse calculateDeliveryFeeFallback(...) { }
```

**Deliverables:**
- [ ] API Gateway module deleted
- [ ] All HTTP clients removed
- [ ] Circuit breaker code removed
- [ ] Dependencies cleaned up
- [ ] Build succeeds without removed code

---

### Phase 9: Caching Implementation

**Objective:** Implement unified caching strategy

**Tasks:**

9.1 Create cache configuration:

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${cache.users.ttl:3600}")
    private long usersTtl;

    @Value("${cache.menu.ttl:7200}")
    private long menuTtl;

    @Value("${cache.customers.ttl:7200}")
    private long customersTtl;

    @Value("${cache.analytics.ttl:300}")
    private long analyticsTtl;

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // User caches
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofSeconds(usersTtl)));
        cacheConfigurations.put("stores", defaultConfig.entryTtl(Duration.ofSeconds(usersTtl)));
        cacheConfigurations.put("permissions", defaultConfig.entryTtl(Duration.ofSeconds(usersTtl)));

        // Menu caches
        cacheConfigurations.put("menuItems", defaultConfig.entryTtl(Duration.ofSeconds(menuTtl)));
        cacheConfigurations.put("categories", defaultConfig.entryTtl(Duration.ofSeconds(menuTtl)));

        // Customer caches
        cacheConfigurations.put("customers", defaultConfig.entryTtl(Duration.ofSeconds(customersTtl)));
        cacheConfigurations.put("loyalty", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Analytics caches (short TTL)
        cacheConfigurations.put("salesAnalytics", defaultConfig.entryTtl(Duration.ofSeconds(analyticsTtl)));
        cacheConfigurations.put("staffMetrics", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // Inventory caches
        cacheConfigurations.put("inventory", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }

    @Bean
    public KeyGenerator customKeyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getSimpleName());
            sb.append(".");
            sb.append(method.getName());
            for (Object param : params) {
                sb.append(".");
                sb.append(param != null ? param.toString() : "null");
            }
            return sb.toString();
        };
    }
}
```

9.2 Apply caching annotations:

```java
@Service
public class MenuService {

    @Cacheable(value = "menuItems", key = "#id")
    public MenuItem getMenuItemById(String id) {
        return menuItemRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "menuItems", key = "'store:' + #storeId + ':available'")
    public List<MenuItem> getAvailableItems(String storeId) {
        return menuItemRepository.findByStoreIdAndIsAvailableTrue(storeId);
    }

    @CacheEvict(value = "menuItems", allEntries = true)
    public MenuItem updateMenuItem(String id, MenuItemUpdateRequest request) {
        // Update logic
    }

    @CachePut(value = "menuItems", key = "#result.id")
    public MenuItem createMenuItem(CreateMenuItemRequest request) {
        // Create logic
    }
}
```

**Deliverables:**
- [ ] Cache configuration created
- [ ] Caching applied to all services
- [ ] Cache eviction properly implemented
- [ ] Cache hit/miss rates monitored

---

### Phase 10: Scheduled Tasks Consolidation

**Objective:** Unify all scheduled jobs

**Tasks:**

10.1 Create unified scheduler:

```java
@Configuration
@EnableScheduling
public class SchedulerConfig {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CustomerService customerService;

    /**
     * Generate automatic purchase orders for low stock items
     * Runs daily at 2:00 AM
     */
    @Scheduled(cron = "${scheduling.inventory.auto-po-cron:0 0 2 * * ?}")
    public void generateAutoPurchaseOrders() {
        log.info("Starting automatic purchase order generation...");
        try {
            inventoryService.generateAutoPurchaseOrders();
            log.info("Automatic purchase order generation completed");
        } catch (Exception e) {
            log.error("Error in auto purchase order generation", e);
        }
    }

    /**
     * Aggregate daily analytics data
     * Runs at midnight
     */
    @Scheduled(cron = "${scheduling.analytics.daily-aggregation-cron:0 0 0 * * ?}")
    public void aggregateDailyAnalytics() {
        log.info("Starting daily analytics aggregation...");
        try {
            analyticsService.aggregateDailyMetrics();
            log.info("Daily analytics aggregation completed");
        } catch (Exception e) {
            log.error("Error in daily analytics aggregation", e);
        }
    }

    /**
     * Process notification queue
     * Runs every 5 minutes
     */
    @Scheduled(fixedRateString = "${scheduling.notification.queue-process-interval:300000}")
    public void processNotificationQueue() {
        try {
            notificationService.processQueuedNotifications();
        } catch (Exception e) {
            log.error("Error processing notification queue", e);
        }
    }

    /**
     * Clean up expired sessions
     * Runs every hour
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void cleanupExpiredSessions() {
        log.info("Cleaning up expired sessions...");
        // Session cleanup logic
    }

    /**
     * Update customer loyalty tiers
     * Runs weekly on Sunday at 3 AM
     */
    @Scheduled(cron = "0 0 3 ? * SUN")
    public void updateLoyaltyTiers() {
        log.info("Updating customer loyalty tiers...");
        try {
            customerService.recalculateLoyaltyTiers();
            log.info("Loyalty tier update completed");
        } catch (Exception e) {
            log.error("Error updating loyalty tiers", e);
        }
    }

    /**
     * Generate inventory reports
     * Runs weekly on Monday at 6 AM
     */
    @Scheduled(cron = "0 0 6 ? * MON")
    public void generateWeeklyInventoryReport() {
        log.info("Generating weekly inventory report...");
        try {
            inventoryService.generateWeeklyReport();
        } catch (Exception e) {
            log.error("Error generating inventory report", e);
        }
    }
}
```

**Deliverables:**
- [ ] All scheduled tasks consolidated
- [ ] Cron expressions configurable
- [ ] Error handling implemented
- [ ] Monitoring and alerting set up

---

## 5. Database Consolidation Strategy

### 5.1 Collection Naming Convention

```
{domain}_{entity}

Examples:
- users
- user_sessions
- stores
- menu_items
- menu_categories
- orders
- order_items
- payment_transactions
- payment_refunds
- customers
- customer_loyalty
- inventory_items
- inventory_waste
- deliveries
- delivery_zones
- notifications
- notification_templates
- reviews
```

### 5.2 Index Strategy

```javascript
// Users
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 }, { sparse: true });
db.users.createIndex({ "storeId": 1 });
db.users.createIndex({ "role": 1, "storeId": 1 });

// Stores
db.stores.createIndex({ "code": 1 }, { unique: true });
db.stores.createIndex({ "isActive": 1 });

// Menu Items
db.menu_items.createIndex({ "storeId": 1, "isAvailable": 1 });
db.menu_items.createIndex({ "category": 1 });
db.menu_items.createIndex({ "name": "text", "description": "text" });

// Orders
db.orders.createIndex({ "storeId": 1, "createdAt": -1 });
db.orders.createIndex({ "customerId": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1, "storeId": 1 });
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });

// Payments
db.payment_transactions.createIndex({ "orderId": 1 });
db.payment_transactions.createIndex({ "razorpayOrderId": 1 });
db.payment_transactions.createIndex({ "status": 1, "createdAt": -1 });

// Customers
db.customers.createIndex({ "phone": 1 }, { unique: true });
db.customers.createIndex({ "email": 1 }, { sparse: true });
db.customers.createIndex({ "loyaltyTier": 1 });

// Inventory
db.inventory_items.createIndex({ "storeId": 1, "sku": 1 }, { unique: true });
db.inventory_items.createIndex({ "currentStock": 1, "reorderLevel": 1 });

// Deliveries
db.deliveries.createIndex({ "orderId": 1 });
db.deliveries.createIndex({ "driverId": 1, "status": 1 });
db.deliveries.createIndex({ "status": 1, "assignedAt": -1 });

// Notifications
db.notifications.createIndex({ "userId": 1, "read": 1, "createdAt": -1 });
db.notifications.createIndex({ "type": 1, "createdAt": -1 });

// Reviews
db.reviews.createIndex({ "orderId": 1 });
db.reviews.createIndex({ "storeId": 1, "rating": 1 });
db.reviews.createIndex({ "customerId": 1 });
```

### 5.3 Data Migration Script

See Appendix A for complete migration script.

---

## 6. Code Transformation Guide

### 6.1 Service Client to Direct Service Call

**Pattern: Replace HTTP Client with Direct Injection**

```java
// BEFORE: HTTP Client in OrderService
@Service
public class OrderService {
    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.menu.url}")
    private String menuServiceUrl;

    public MenuItem getMenuItem(String id) {
        return restTemplate.getForObject(
            menuServiceUrl + "/api/menu/items/" + id,
            MenuItem.class
        );
    }
}

// AFTER: Direct Service Injection
@Service
public class OrderService {
    @Autowired
    private MenuService menuService;

    public MenuItem getMenuItem(String id) {
        return menuService.getMenuItemById(id);
    }
}
```

### 6.2 Remove Circuit Breaker Pattern

```java
// BEFORE: With Circuit Breaker
@CircuitBreaker(name = "menuService", fallbackMethod = "getMenuItemFallback")
public MenuItem getMenuItem(String id) {
    return restTemplate.getForObject(url, MenuItem.class);
}

public MenuItem getMenuItemFallback(String id, Exception e) {
    log.warn("Fallback for menu item {}", id);
    return null;
}

// AFTER: Direct Call with Exception Handling
public MenuItem getMenuItem(String id) {
    return menuService.getMenuItemById(id);
    // Exception handling moved to global exception handler or service layer
}
```

### 6.3 Transaction Management

```java
// NEW CAPABILITY: Cross-Domain Transactions
@Service
public class OrderService {

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        // All operations in single transaction
        Customer customer = customerService.getOrCreate(request.getPhone());
        Order order = orderRepository.save(buildOrder(request));
        inventoryService.reserveItems(order.getItems());
        notificationService.sendConfirmation(order);
        return order;
    }

    @Transactional
    public void cancelOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // All rollback together if any fails
        inventoryService.releaseReservedItems(order.getItems());
        paymentService.initiateRefund(order.getPaymentId());
        notificationService.sendCancellation(order);
    }
}
```

### 6.4 Event-Based Communication (Optional)

For loose coupling within monolith:

```java
// Event Publisher
@Service
public class OrderService {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    public Order createOrder(CreateOrderRequest request) {
        Order order = orderRepository.save(buildOrder(request));

        // Publish event for other components
        eventPublisher.publishEvent(new OrderCreatedEvent(order));

        return order;
    }
}

// Event Listener
@Component
public class OrderEventListener {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private InventoryService inventoryService;

    @EventListener
    @Async
    public void handleOrderCreated(OrderCreatedEvent event) {
        Order order = event.getOrder();
        notificationService.sendOrderConfirmation(order);
    }

    @EventListener
    public void handleInventoryReservation(OrderCreatedEvent event) {
        inventoryService.reserveItems(event.getOrder().getItems());
    }
}
```

---

## 7. Configuration Consolidation

### 7.1 Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/masova_unified

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-512-bit-secret-key-must-be-at-least-64-characters

# Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@masova.com
SENDGRID_ENABLED=true

# SMS
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_ENABLED=true

# Push Notifications
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
FIREBASE_ENABLED=true

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# Application
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
```

### 7.2 Docker Configuration

**Dockerfile:**
```dockerfile
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/masova-monolith-*.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms512m -Xmx2048m -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  masova-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - MONGODB_URI=mongodb://mongodb:27017/masova_unified
      - REDIS_HOST=redis
    depends_on:
      - mongodb
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

---

## 8. Security Implementation

### 8.1 Security Configuration

See Phase 5 for complete security configuration.

### 8.2 Role-Based Access Control

```java
public enum UserRole {
    ADMIN,      // Full system access
    MANAGER,    // Store management, analytics, staff
    STAFF,      // POS, kitchen, basic operations
    DRIVER,     // Delivery operations
    CUSTOMER    // Customer-facing operations
}
```

**Endpoint Access Matrix:**

| Endpoint | ADMIN | MANAGER | STAFF | DRIVER | CUSTOMER | Public |
|----------|-------|---------|-------|--------|----------|--------|
| /api/users/login | - | - | - | - | - | ✓ |
| /api/users/register | - | - | - | - | - | ✓ |
| /api/menu/public/** | - | - | - | - | - | ✓ |
| /api/menu/admin/** | ✓ | ✓ | - | - | - | - |
| /api/orders | ✓ | ✓ | ✓ | - | ✓ | - |
| /api/orders/kitchen/** | ✓ | ✓ | ✓ | - | - | - |
| /api/analytics/** | ✓ | ✓ | - | - | - | - |
| /api/inventory/** | ✓ | ✓ | - | - | - | - |
| /api/delivery/driver/** | ✓ | - | - | ✓ | - | - |
| /api/users/staff/** | ✓ | ✓ | - | - | - | - |
| /api/payment/webhook | - | - | - | - | - | ✓ |

---

## 9. Frontend Changes

### 9.1 API Configuration Update

**vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});
```

**api.config.ts:**
```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
};
```

### 9.2 WebSocket Connection Update

**websocketService.ts:**
```typescript
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WS_URL = 'http://localhost:8080/ws';  // Single endpoint

export const createWebSocketConnection = (token: string) => {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    // ... rest of config
  });

  return client;
};
```

### 9.3 No Changes Required

The following remain unchanged:
- All API endpoint paths (`/api/users`, `/api/orders`, etc.)
- Redux store structure
- RTK Query API definitions
- Component logic
- Authentication flow

---

## 10. Testing Strategy

### 10.1 Testing Phases

**Phase 1: Unit Tests**
- Migrate existing unit tests
- Update mocks (remove service client mocks)
- Add tests for new unified services

**Phase 2: Integration Tests**
- Test cross-domain operations
- Test transaction rollbacks
- Test caching behavior

**Phase 3: API Tests**
- Verify all endpoints respond correctly
- Compare responses with microservices version
- Load testing

**Phase 4: End-to-End Tests**
- Full user journey testing
- WebSocket functionality
- Payment flow
- Delivery tracking

### 10.2 Test Configuration

```java
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.yml")
public class OrderServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void createOrder_ValidRequest_ReturnsOrder() throws Exception {
        // Test implementation
    }
}
```

### 10.3 Comparison Testing Script

```bash
#!/bin/bash
# compare-endpoints.sh

MICRO_URL="http://localhost:8080"  # Gateway
MONO_URL="http://localhost:9080"   # Monolith

endpoints=(
    "/api/menu/public/items"
    "/api/stores"
    "/api/orders?storeId=STORE001"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    micro_response=$(curl -s "$MICRO_URL$endpoint")
    mono_response=$(curl -s "$MONO_URL$endpoint")

    if [ "$micro_response" == "$mono_response" ]; then
        echo "✓ MATCH"
    else
        echo "✗ MISMATCH"
        diff <(echo "$micro_response" | jq .) <(echo "$mono_response" | jq .)
    fi
done
```

---

## 11. Rollback Plan

### 11.1 Rollback Triggers

- Critical bugs in production
- Performance degradation > 20%
- Data integrity issues
- Security vulnerabilities

### 11.2 Rollback Procedure

1. **Immediate**: Switch load balancer back to microservices
2. **Data Sync**: Run reverse migration if needed
3. **Verification**: Confirm microservices operational
4. **Communication**: Notify stakeholders
5. **Analysis**: Document issues for resolution

### 11.3 Feature Flags

```java
@Configuration
public class FeatureFlags {

    @Value("${features.use-monolith-order-service:true}")
    private boolean useMonolithOrderService;

    @Value("${features.use-monolith-payment-service:true}")
    private boolean useMonolithPaymentService;

    // Getters
}
```

---

## 12. Risk Assessment

### 12.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | Critical | Backups, dry runs, validation |
| Extended downtime | Medium | High | Blue-green deployment |
| Performance degradation | Medium | Medium | Load testing, optimization |
| Security vulnerabilities | Low | Critical | Security audit, pen testing |
| Team learning curve | Medium | Low | Documentation, training |
| Integration failures | Medium | High | Comprehensive testing |

### 12.2 Success Criteria

- [ ] All API endpoints functional
- [ ] Response times within 10% of microservices
- [ ] Zero data loss
- [ ] All existing features working
- [ ] WebSocket real-time updates working
- [ ] Payment processing functional
- [ ] Notification delivery working
- [ ] Analytics reports accurate

---

## 13. Appendices

### Appendix A: Complete Database Migration Script

```javascript
// File: migration/migrate-to-unified.js
// Usage: mongosh < migrate-to-unified.js

print("Starting MaSoVa database migration...");
print("========================================");

const targetDb = db.getSiblingDB('masova_unified');

// Helper function to migrate collection
function migrateCollection(sourceDb, sourceCollection, targetCollection, transform = null) {
    const source = db.getSiblingDB(sourceDb);
    const count = source[sourceCollection].countDocuments();
    print(`Migrating ${sourceDb}.${sourceCollection} -> ${targetCollection} (${count} documents)`);

    source[sourceCollection].find().forEach(function(doc) {
        if (transform) {
            doc = transform(doc);
        }
        targetDb[targetCollection].insertOne(doc);
    });

    print(`✓ Completed: ${targetCollection}`);
}

// User Service Data
migrateCollection('masova_db', 'users', 'users');
migrateCollection('masova_db', 'stores', 'stores');
migrateCollection('masova_db', 'shifts', 'shifts');
migrateCollection('masova_db', 'workingSessions', 'working_sessions');
migrateCollection('masova_db', 'gdprConsents', 'gdpr_consents');
migrateCollection('masova_db', 'gdprDataBreaches', 'gdpr_data_breaches');
migrateCollection('masova_db', 'gdprAuditLogs', 'gdpr_audit_logs');

// Menu Service Data
migrateCollection('MaSoVa', 'menuItems', 'menu_items');
migrateCollection('MaSoVa', 'categories', 'menu_categories');

// Order Service Data
migrateCollection('masova_orders', 'orders', 'orders');

// Payment Service Data
migrateCollection('masova_payments', 'transactions', 'payment_transactions');
migrateCollection('masova_payments', 'refunds', 'payment_refunds');

// Customer Service Data
migrateCollection('masova_customers', 'customers', 'customers');
migrateCollection('masova_customers', 'loyaltyPoints', 'customer_loyalty');
migrateCollection('masova_customers', 'customerAddresses', 'customer_addresses');

// Inventory Service Data
migrateCollection('masova_inventory', 'inventoryItems', 'inventory_items');
migrateCollection('masova_inventory', 'wasteRecords', 'inventory_waste');
migrateCollection('masova_inventory', 'purchaseOrders', 'inventory_purchase_orders');
migrateCollection('masova_inventory', 'suppliers', 'inventory_suppliers');

// Delivery Service Data
migrateCollection('delivery_db', 'deliveryTrackings', 'deliveries');
migrateCollection('delivery_db', 'driverLocations', 'delivery_driver_locations');
migrateCollection('delivery_db', 'deliveryZones', 'delivery_zones');

// Analytics Service Data (optional - can be regenerated)
migrateCollection('masova_analytics', 'dailySummaries', 'analytics_daily');

// Notification Service Data
migrateCollection('masova-notification', 'notifications', 'notifications');
migrateCollection('masova-notification', 'templates', 'notification_templates');
migrateCollection('masova-notification', 'campaigns', 'notification_campaigns');
migrateCollection('masova-notification', 'userPreferences', 'notification_preferences');

// Review Service Data
migrateCollection('MaSoVa_reviews', 'reviews', 'reviews');
migrateCollection('MaSoVa_reviews', 'reviewResponses', 'review_responses');

print("");
print("========================================");
print("Creating indexes...");

// Users indexes
targetDb.users.createIndex({ "email": 1 }, { unique: true });
targetDb.users.createIndex({ "phone": 1 }, { sparse: true });
targetDb.users.createIndex({ "storeId": 1 });
targetDb.users.createIndex({ "role": 1, "storeId": 1 });

// Stores indexes
targetDb.stores.createIndex({ "code": 1 }, { unique: true });
targetDb.stores.createIndex({ "isActive": 1 });

// Menu indexes
targetDb.menu_items.createIndex({ "storeId": 1, "isAvailable": 1 });
targetDb.menu_items.createIndex({ "category": 1 });
targetDb.menu_items.createIndex({ "name": "text", "description": "text" });

// Orders indexes
targetDb.orders.createIndex({ "storeId": 1, "createdAt": -1 });
targetDb.orders.createIndex({ "customerId": 1, "createdAt": -1 });
targetDb.orders.createIndex({ "status": 1, "storeId": 1 });
targetDb.orders.createIndex({ "orderNumber": 1 }, { unique: true });

// Payments indexes
targetDb.payment_transactions.createIndex({ "orderId": 1 });
targetDb.payment_transactions.createIndex({ "razorpayOrderId": 1 });
targetDb.payment_transactions.createIndex({ "status": 1, "createdAt": -1 });

// Customers indexes
targetDb.customers.createIndex({ "phone": 1 }, { unique: true });
targetDb.customers.createIndex({ "email": 1 }, { sparse: true });
targetDb.customers.createIndex({ "loyaltyTier": 1 });

// Inventory indexes
targetDb.inventory_items.createIndex({ "storeId": 1, "sku": 1 }, { unique: true });
targetDb.inventory_items.createIndex({ "currentStock": 1, "reorderLevel": 1 });

// Deliveries indexes
targetDb.deliveries.createIndex({ "orderId": 1 });
targetDb.deliveries.createIndex({ "driverId": 1, "status": 1 });
targetDb.deliveries.createIndex({ "status": 1, "assignedAt": -1 });

// Notifications indexes
targetDb.notifications.createIndex({ "userId": 1, "read": 1, "createdAt": -1 });
targetDb.notifications.createIndex({ "type": 1, "createdAt": -1 });

// Reviews indexes
targetDb.reviews.createIndex({ "orderId": 1 });
targetDb.reviews.createIndex({ "storeId": 1, "rating": 1 });
targetDb.reviews.createIndex({ "customerId": 1 });

print("✓ All indexes created");
print("");
print("========================================");
print("Migration Summary:");
print("========================================");

const collections = targetDb.getCollectionNames();
collections.forEach(function(name) {
    const count = targetDb[name].countDocuments();
    print(`${name}: ${count} documents`);
});

print("");
print("Migration completed successfully!");
```

### Appendix B: Dependency Comparison

**Microservices Total Dependencies:**
- 11 separate Spring Boot applications
- ~150+ total dependencies (with duplicates)
- Multiple JVMs (11 x ~512MB = ~5.6GB RAM minimum)

**Monolith Dependencies:**
- 1 Spring Boot application
- ~50 unique dependencies
- Single JVM (~1-2GB RAM)

### Appendix C: Files to Delete

```
api-gateway/                                    # ENTIRE MODULE

# HTTP Clients (all services)
*/client/*ServiceClient.java

# Circuit Breaker Configs
shared-models/src/.../CircuitBreakerConfiguration.java
*/config/CircuitBreakerConfig.java

# Inter-service Auth
*/config/JwtForwardingInterceptor.java
*/filter/ServiceAuthFilter.java

# Service-specific application.yml (keep as reference)
# But replace with unified config

# Docker compose for multi-service
docker-compose-microservices.yml

# Service discovery (if any)
*/config/EurekaConfig.java
```

### Appendix D: Checklist

**Pre-Migration:**
- [ ] Full database backup
- [ ] Document current API responses
- [ ] Load test microservices baseline
- [ ] Team training on monolith structure

**Migration:**
- [ ] Phase 1: Project setup complete
- [ ] Phase 2: Database migrated
- [ ] Phase 3: Services migrated
- [ ] Phase 4: Controllers migrated
- [ ] Phase 5: Security configured
- [ ] Phase 6: WebSocket working
- [ ] Phase 7: Configuration complete
- [ ] Phase 8: Cleanup complete
- [ ] Phase 9: Caching implemented
- [ ] Phase 10: Schedulers configured

**Post-Migration:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] API comparison tests passing
- [ ] Load tests within acceptable range
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained on new structure
- [ ] Monitoring configured
- [ ] Alerting configured

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 11, 2025 | Architecture Team | Initial document |

---

**End of Document**
