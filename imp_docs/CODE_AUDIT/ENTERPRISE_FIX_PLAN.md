# MaSoVa Restaurant Management System
## Enterprise-Grade Security & Architecture Fix Plan

**Document Version:** 1.0
**Date:** November 30, 2025
**Severity Level:** CRITICAL
**Estimated Remediation Time:** 3-5 Business Days
**Impact:** All Services, All Environments

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Security Risk Analysis](#3-security-risk-analysis)
4. [Proposed Architecture](#4-proposed-architecture)
5. [Implementation Plan](#5-implementation-plan)
6. [Code Implementation Details](#6-code-implementation-details)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [Maintenance & Long-term Strategy](#10-maintenance--long-term-strategy)

---

## 1. Executive Summary

### 1.1 Critical Findings

The MaSoVa Restaurant Management System currently has **CRITICAL SECURITY VULNERABILITIES** affecting 7 out of 11 microservices:

- **7 services** have no authentication (permitAll)
- **5 services** have no JWT configuration
- **4 services** use mismatched JWT secrets
- **Frontend** bypasses API Gateway, directly connecting to services
- **Payment Service** (financial data) is publicly accessible
- **Customer Service** (PII) is publicly accessible
- **Inventory Route** in Gateway misconfigured (wrong port)

### 1.2 Business Impact

| Risk Category | Current State | Business Impact |
|---------------|---------------|-----------------|
| **Data Breach** | HIGH | Customer PII, payment data, business intelligence fully exposed |
| **Fraud** | HIGH | No payment validation, order manipulation possible |
| **Compliance** | CRITICAL | GDPR, PCI-DSS, SOC2 violations |
| **Financial Loss** | HIGH | Unauthorized transactions, inventory manipulation |
| **Reputation** | CRITICAL | Single breach could destroy customer trust |

### 1.3 Recommended Action

**IMMEDIATE:** Implement this comprehensive fix plan within 3-5 business days. Production deployment requires complete security overhaul.

---

## 2. Current State Assessment

### 2.1 Service Inventory

| # | Service | Port | Database | Security Status | JWT Config | CORS | Issues |
|---|---------|------|----------|-----------------|------------|------|--------|
| 1 | **api-gateway** | 8080 | N/A | ✅ CONFIGURED | ✅ Correct | ✅ Yes | Wrong inventory port |
| 2 | **user-service** | 8081 | MongoDB + Redis | ✅ SECURE | ✅ Correct | ✅ Yes | None |
| 3 | **menu-service** | 8082 | MongoDB + Redis | ❌ NO CONFIG | ❌ None | ❌ No | File missing |
| 4 | **order-service** | 8083 | MongoDB + Redis | ❌ PERMITALL | ⚠️ Wrong Secret | ✅ Yes | Security disabled |
| 5 | **analytics-service** | 8085 | MongoDB + Redis | ❌ PERMITALL | ⚠️ Wrong Secret | ✅ Yes | Security disabled |
| 6 | **payment-service** | 8086 | MongoDB | ❌ PERMITALL | ⚠️ Wrong Secret | ✅ Yes | Security disabled |
| 7 | **inventory-service** | 8088 | MongoDB + Redis | ❌ PERMITALL | ❌ None | ✅ Yes | Security disabled |
| 8 | **review-service** | 8089 | MongoDB + Redis | ⚠️ PARTIAL | ❌ None | ✅ Yes | No JWT filter |
| 9 | **delivery-service** | 8090 | MongoDB + Redis | ⚠️ PARTIAL | ⚠️ Wrong Secret | ✅ Yes | No JWT filter |
| 10 | **customer-service** | 8091 | MongoDB + Redis | ❌ PERMITALL | ❌ None | ✅ Yes | Security disabled |
| 11 | **notification-service** | 8092 | MongoDB + Redis | ❌ PERMITALL | ❌ None | ✅ Yes | Security disabled |

**Legend:**
✅ = Properly Configured
⚠️ = Partially Configured / Issues
❌ = Not Configured / Critical Issue

### 2.2 Frontend Configuration Analysis

**Current State:**
```typescript
// frontend/src/config/api.config.ts
USER_SERVICE_URL: 'http://localhost:8081'      // BYPASS Gateway
MENU_SERVICE_URL: 'http://localhost:8082'      // BYPASS Gateway
ORDER_SERVICE_URL: 'http://localhost:8083'     // BYPASS Gateway
PAYMENT_SERVICE_URL: 'http://localhost:8086'   // BYPASS Gateway
CUSTOMER_SERVICE_URL: 'http://localhost:8091'  // BYPASS Gateway
REVIEW_SERVICE_URL: 'http://localhost:8089'    // BYPASS Gateway
```

**Issues:**
- 10 out of 11 API files bypass the API Gateway
- Only inventoryApi.ts uses the gateway
- Direct connections defeat security, CORS, rate limiting, and monitoring
- No centralized request/response transformation

### 2.3 JWT Configuration Status

**Correct JWT Secret (512-bit for HS512):**
```
MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-512-bits-for-HS512-algorithm-security-requirement
```

**Services with Correct Secret:**
- ✅ api-gateway
- ✅ user-service

**Services with Wrong/Weak Secrets:**
- ❌ order-service: "your-secret-key-change-this-in-production..." (WEAK, different)
- ❌ payment-service: "MaSoVa2024SecretKeyForJWT..." (different)
- ❌ delivery-service: "MaSoVaSecretKeyForJWT..." (different)
- ❌ analytics-service: "your-secret-key-change-this..." (WEAK, different)

**Services with NO JWT Config:**
- ❌ menu-service
- ❌ inventory-service
- ❌ review-service
- ❌ customer-service
- ❌ notification-service

---

## 3. Security Risk Analysis

### 3.1 OWASP Top 10 Violations

| OWASP Risk | Violation | Current State | Impact |
|------------|-----------|---------------|---------|
| **A01: Broken Access Control** | CRITICAL | 7 services permitAll | Anyone can access any endpoint |
| **A02: Cryptographic Failures** | HIGH | JWT secrets exposed, varied | Token forgery possible |
| **A05: Security Misconfiguration** | CRITICAL | No security configs | Default configs insecure |
| **A07: Identification & Auth Failures** | CRITICAL | No JWT validation | Identity spoofing possible |
| **A09: Security Logging Failures** | HIGH | No centralized logging | Breaches undetectable |

### 3.2 Compliance Violations

#### PCI-DSS (Payment Card Industry Data Security Standard)
- **Requirement 1**: Install and maintain firewall - ❌ FAILED (no API gateway enforcement)
- **Requirement 2**: Change vendor defaults - ❌ FAILED (default permitAll)
- **Requirement 6**: Develop secure systems - ❌ FAILED (security disabled)
- **Requirement 7**: Restrict data access - ❌ FAILED (no authentication)
- **Requirement 8**: Authenticate access - ❌ FAILED (permitAll)
- **Requirement 10**: Track and monitor access - ❌ FAILED (no logging)

**Status:** **NOT COMPLIANT** - Cannot process credit cards in current state

#### GDPR (General Data Protection Regulation)
- **Article 5**: Security by design - ❌ FAILED (no security)
- **Article 25**: Data protection by default - ❌ FAILED (permitAll)
- **Article 32**: Security of processing - ❌ FAILED (no encryption, no auth)

**Status:** **NOT COMPLIANT** - €20M or 4% revenue fine risk

#### SOC 2 (Service Organization Control)
- **CC6.1**: Logical access controls - ❌ FAILED (no authentication)
- **CC6.6**: Cryptographic protection - ❌ FAILED (JWT inconsistent)
- **CC7.2**: System monitoring - ❌ FAILED (no monitoring)

**Status:** **NOT COMPLIANT** - Cannot serve enterprise customers

### 3.3 Attack Vectors (Current Vulnerabilities)

#### 1. Direct Service Access Attack
```bash
# Attacker can bypass gateway entirely
curl http://your-domain:8086/api/payments
# Returns all payments without authentication
```

#### 2. JWT Forgery Attack
```python
# Different services have different secrets
# Attacker forges JWT with weak secret from order-service
# Uses forged token on payment-service with different secret
# If secrets don't match, validation fails differently
```

#### 3. CORS Bypass Attack
```javascript
// Frontend bypasses gateway, connects directly to services
// CORS misconfiguration allows unauthorized origins
// XSS attacks can steal data from misconfigured CORS
```

#### 4. Data Exfiltration Attack
```bash
# No authentication on customer-service
curl http://your-domain:8091/api/customers
# Returns all customer PII (names, emails, addresses, phones)

# No authentication on analytics-service
curl http://your-domain:8085/api/analytics/revenue
# Returns all business intelligence
```

#### 5. Financial Fraud Attack
```bash
# No authentication on payment-service
curl -X POST http://your-domain:8086/api/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": -1000, "orderId": "ORDER123"}'
# Creates refund without authorization
```

---

## 4. Proposed Architecture

### 4.1 Target Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│                     http://localhost:3000                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ ALL requests via Gateway
                             │ JWT in Authorization header
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 8080)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Security Layer:                                       │ │
│  │  - CORS (centralized, allow localhost:3000)           │ │
│  │  - Rate Limiting (100 req/min/user)                   │ │
│  │  - JWT Validation (verify signature, expiry)          │ │
│  │  - Request Logging (audit trail)                      │ │
│  │  - Response Transformation                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routing Layer:                                        │ │
│  │  /api/auth/**        → user-service:8081              │ │
│  │  /api/users/**       → user-service:8081              │ │
│  │  /api/menu/**        → menu-service:8082              │ │
│  │  /api/orders/**      → order-service:8083             │ │
│  │  /api/analytics/**   → analytics-service:8085         │ │
│  │  /api/payments/**    → payment-service:8086           │ │
│  │  /api/inventory/**   → inventory-service:8088         │ │
│  │  /api/reviews/**     → review-service:8089            │ │
│  │  /api/delivery/**    → delivery-service:8090          │ │
│  │  /api/customers/**   → customer-service:8091          │ │
│  │  /api/notifications/** → notification-service:8092    │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  USER SERVICE   │ │  MENU SERVICE   │ │  ORDER SERVICE  │
│   Port 8081     │ │   Port 8082     │ │   Port 8083     │
│                 │ │                 │ │                 │
│  JWT Validation │ │  JWT Validation │ │  JWT Validation │
│  (Defense in    │ │  (Defense in    │ │  (Defense in    │
│   Depth)        │ │   Depth)        │ │   Depth)        │
└─────────────────┘ └─────────────────┘ └─────────────────┘

       (... all other services follow same pattern ...)

┌─────────────────────────────────────────────────────────────┐
│                    SHARED SECURITY LIBRARY                   │
│  - JwtAuthenticationFilter (reusable across all services)   │
│  - Shared JWT Secret (from environment variable)            │
│  - Common CORS Configuration                                │
│  - Audit Logging Utilities                                  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Security Principles

#### 1. Defense in Depth
- **Layer 1:** API Gateway validates all requests
- **Layer 2:** Each microservice independently validates JWT
- **Layer 3:** Database-level access controls
- **Layer 4:** Network-level firewalls (production)

#### 2. Zero Trust Architecture
- Never trust, always verify
- Every service validates every request
- No internal network trust assumptions
- Mutual TLS for service-to-service communication (future)

#### 3. Principle of Least Privilege
- Services only expose necessary endpoints
- Role-based access control (RBAC)
- Minimal token claims
- Time-limited sessions

#### 4. Centralized Authentication, Distributed Authorization
- User-service issues JWTs (centralized)
- Each service enforces its own authorization rules (distributed)
- Gateway validates tokens but doesn't make authorization decisions

### 4.3 JWT Token Structure

```json
{
  "header": {
    "alg": "HS512",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id_12345",
    "email": "user@example.com",
    "roles": ["ROLE_MANAGER", "ROLE_USER"],
    "storeId": "STORE001",
    "iat": 1732973640,
    "exp": 1732977240
  },
  "signature": "..."
}
```

**Claims:**
- `sub`: User ID (Subject)
- `email`: User email
- `roles`: Array of roles (ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, ROLE_CUSTOMER, ROLE_DRIVER)
- `storeId`: Associated store (for multi-tenant support)
- `iat`: Issued At timestamp
- `exp`: Expiration timestamp (1 hour for access tokens)

---

## 5. Implementation Plan

### 5.1 Phase 1: Preparation (Day 1 - Morning)

#### Task 1.1: Environment Configuration
**Priority:** CRITICAL
**Duration:** 30 minutes

**Actions:**
1. Create shared configuration file for all services
2. Move JWT secret to environment variable
3. Create environment-specific configs (dev, staging, prod)

**Files to Create:**
```bash
# Create .env files for each environment
/config/dev.env
/config/staging.env
/config/prod.env

# Create shared Spring configuration
/shared-config/application-common.yml
```

**Environment Variables:**
```bash
# config/dev.env
JWT_SECRET=MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-512-bits-for-HS512-algorithm-security-requirement
JWT_ACCESS_TOKEN_EXPIRATION=3600000
JWT_REFRESH_TOKEN_EXPIRATION=604800000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
API_GATEWAY_URL=http://localhost:8080

# Service Discovery (for production, use Eureka/Consul)
USER_SERVICE_URL=http://localhost:8081
MENU_SERVICE_URL=http://localhost:8082
ORDER_SERVICE_URL=http://localhost:8083
ANALYTICS_SERVICE_URL=http://localhost:8085
PAYMENT_SERVICE_URL=http://localhost:8086
INVENTORY_SERVICE_URL=http://localhost:8088
REVIEW_SERVICE_URL=http://localhost:8089
DELIVERY_SERVICE_URL=http://localhost:8090
CUSTOMER_SERVICE_URL=http://localhost:8091
NOTIFICATION_SERVICE_URL=http://localhost:8092
```

#### Task 1.2: Create Shared Security Library
**Priority:** CRITICAL
**Duration:** 2 hours

**Actions:**
1. Create shared-security module
2. Implement reusable JwtAuthenticationFilter
3. Implement JwtTokenProvider
4. Create SecurityConfigurationBase class

**Module Structure:**
```
shared-security/
├── pom.xml
└── src/main/java/com/MaSoVa/shared/security/
    ├── config/
    │   ├── SecurityConfigurationBase.java
    │   └── CorsConfigurationBase.java
    ├── filter/
    │   └── JwtAuthenticationFilter.java
    ├── util/
    │   ├── JwtTokenProvider.java
    │   └── SecurityConstants.java
    └── exception/
        ├── InvalidTokenException.java
        └── TokenExpiredException.java
```

### 5.2 Phase 2: API Gateway Enhancement (Day 1 - Afternoon)

#### Task 2.1: Fix API Gateway Routes
**Priority:** HIGH
**Duration:** 30 minutes

**Changes:**
1. Fix inventory-service route (8082 → 8088)
2. Replace hardcoded URLs with environment variables
3. Add health check aggregation
4. Implement request/response logging

#### Task 2.2: Enhance Gateway Security
**Priority:** CRITICAL
**Duration:** 1 hour

**Changes:**
1. Add rate limiting (100 requests/minute per user)
2. Add request size limits (10MB max)
3. Add IP whitelisting for admin endpoints
4. Implement circuit breaker pattern

### 5.3 Phase 3: Microservice Security (Day 2)

#### Task 3.1: Menu Service Security
**Priority:** CRITICAL
**Duration:** 1 hour

**Actions:**
1. Create SecurityConfig.java
2. Add JWT dependency
3. Configure JWT validation
4. Define public endpoints (GET /api/menu/public/**)
5. Require authentication for modifications

#### Task 3.2: Order Service Security
**Priority:** CRITICAL
**Duration:** 1 hour

**Actions:**
1. Remove permitAll
2. Add JWT authentication filter
3. Update JWT secret to match shared secret
4. Implement role-based access:
   - ROLE_CUSTOMER: Create own orders, view own orders
   - ROLE_STAFF: View all orders, update status
   - ROLE_MANAGER: Full access

#### Task 3.3: Inventory Service Security
**Priority:** CRITICAL
**Duration:** 1 hour

**Actions:**
1. Add JWT configuration
2. Add JWT authentication filter
3. Require authentication for all endpoints
4. Implement role-based access:
   - ROLE_STAFF: View inventory, request items
   - ROLE_MANAGER: Full CRUD, purchase orders
   - ROLE_ADMIN: All operations

#### Task 3.4: Payment Service Security
**Priority:** CRITICAL (Financial Data)
**Duration:** 1.5 hours

**Actions:**
1. Remove permitAll
2. Add JWT authentication filter
3. Update JWT secret
4. Keep webhook endpoint public (but verify webhook signature)
5. Implement strict role-based access:
   - ROLE_CUSTOMER: View own payments
   - ROLE_STAFF: Process payments
   - ROLE_MANAGER: Reconciliation, refunds
   - ROLE_ADMIN: Full access
6. Add audit logging for all payment operations
7. Implement PCI-DSS logging requirements

#### Task 3.5: Customer Service Security
**Priority:** CRITICAL (PII Data)
**Duration:** 1 hour

**Actions:**
1. Remove permitAll
2. Add JWT authentication filter
3. Implement role-based access:
   - ROLE_CUSTOMER: View/edit own profile
   - ROLE_STAFF: View customer profiles
   - ROLE_MANAGER: Full access
4. Add GDPR-compliant audit logging
5. Implement data masking for PII in logs

#### Task 3.6: Review Service Security
**Priority:** HIGH
**Duration:** 45 minutes

**Actions:**
1. Add JWT configuration
2. Add JWT authentication filter
3. Keep public endpoints public (GET /api/reviews/public/**)
4. Require authentication for creating/editing reviews

#### Task 3.7: Delivery Service Security
**Priority:** HIGH
**Duration:** 45 minutes

**Actions:**
1. Update JWT secret to match shared secret
2. Add JWT authentication filter
3. Verify protected endpoint access
4. Keep public tracking endpoint public

#### Task 3.8: Analytics Service Security
**Priority:** HIGH
**Duration:** 1 hour

**Actions:**
1. Remove permitAll
2. Add JWT authentication filter
3. Update JWT secret
4. Implement role-based access:
   - ROLE_MANAGER: View store analytics
   - ROLE_ADMIN: View all analytics

#### Task 3.9: Notification Service Security
**Priority:** MEDIUM
**Duration:** 45 minutes

**Actions:**
1. Remove permitAll
2. Add JWT authentication filter
3. Require authentication for all endpoints
4. Implement role-based access

### 5.4 Phase 4: Frontend Integration (Day 3)

#### Task 4.1: Update API Configuration
**Priority:** CRITICAL
**Duration:** 30 minutes

**Changes:**
```typescript
// frontend/src/config/api.config.ts

const API_CONFIG = {
  // ONLY use API Gateway
  API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',

  // Keep for reference only, DO NOT USE DIRECTLY
  // All requests MUST go through API Gateway
  _INTERNAL_SERVICES: {
    USER_SERVICE: 8081,
    MENU_SERVICE: 8082,
    ORDER_SERVICE: 8083,
    ANALYTICS_SERVICE: 8085,
    PAYMENT_SERVICE: 8086,
    INVENTORY_SERVICE: 8088,
    REVIEW_SERVICE: 8089,
    DELIVERY_SERVICE: 8090,
    CUSTOMER_SERVICE: 8091,
    NOTIFICATION_SERVICE: 8092
  }
} as const;

export default API_CONFIG;
```

#### Task 4.2: Update All API Files
**Priority:** CRITICAL
**Duration:** 2 hours

**Files to Update:**
- authApi.ts
- userApi.ts
- menuApi.ts
- orderApi.ts
- paymentApi.ts
- inventoryApi.ts
- reviewApi.ts
- deliveryApi.ts
- customerApi.ts
- analyticsApi.ts
- notificationApi.ts

**Pattern:**
```typescript
// OLD (WRONG)
const baseUrl = 'http://localhost:8081';

// NEW (CORRECT)
import API_CONFIG from '@/config/api.config';
const baseUrl = API_CONFIG.API_GATEWAY_URL;
```

#### Task 4.3: Fix Frontend Code Errors
**Priority:** MEDIUM
**Duration:** 1 hour

**Files to Fix:**
1. `src/store/api/userApi.ts` - Export useGetUsersQuery
2. `src/pages/manager/OrderManagementPage.tsx` - Fix import
3. `src/apps/POSSystem/components/OrderPanel.tsx` - Fix Takeout icon import
4. `src/pages/manager/PaymentDashboardPage.tsx` - Add null checks (line 288)
5. `src/pages/manager/SupplierManagementPage.tsx` - Add null checks
6. `src/pages/manager/RefundManagementPage.tsx` - Add React keys (line 224)
7. Fix ReviewManagementPage.tsx module loading

### 5.5 Phase 5: Testing (Day 4)

#### Task 5.1: Unit Testing
**Priority:** HIGH
**Duration:** 4 hours

**Test Coverage:**
- JwtTokenProvider (token generation, validation, expiration)
- JwtAuthenticationFilter (valid tokens, invalid tokens, expired tokens)
- Each service's SecurityConfig (public endpoints, protected endpoints, roles)

#### Task 5.2: Integration Testing
**Priority:** CRITICAL
**Duration:** 4 hours

**Test Scenarios:**
1. Login flow (user-service → JWT generation)
2. Gateway routing (all endpoints)
3. JWT validation (all services)
4. Unauthorized access (401 response)
5. Forbidden access (403 response - wrong role)
6. CORS (preflight requests)
7. Rate limiting
8. Token expiration and refresh

#### Task 5.3: Security Testing
**Priority:** CRITICAL
**Duration:** 3 hours

**Test Scenarios:**
1. Direct service access (should fail without JWT)
2. JWT forgery (tampered signature)
3. Expired token usage
4. Role escalation attempts
5. CORS bypass attempts
6. SQL injection attempts
7. XSS attempts
8. CSRF protection

#### Task 5.4: Load Testing
**Priority:** MEDIUM
**Duration:** 2 hours

**Metrics:**
- Requests per second (target: 1000 RPS)
- Average response time (target: <200ms)
- 95th percentile (target: <500ms)
- Error rate (target: <0.1%)

### 5.6 Phase 6: Deployment (Day 5)

#### Task 6.1: Staging Deployment
**Priority:** HIGH
**Duration:** 2 hours

**Steps:**
1. Deploy shared-security library to staging
2. Deploy all microservices to staging
3. Deploy API Gateway to staging
4. Deploy frontend to staging
5. Run smoke tests
6. Run full integration test suite

#### Task 6.2: Production Deployment
**Priority:** CRITICAL
**Duration:** 3 hours

**Steps:**
1. Create production environment variables
2. Update production secrets (rotate JWT secret)
3. Deploy database migration scripts
4. Deploy services in order:
   - shared-security
   - user-service (auth service first)
   - api-gateway
   - all other services (parallel)
   - frontend
5. Monitor logs for errors
6. Run health checks
7. Gradually shift traffic (blue-green deployment)
8. Monitor metrics for 24 hours

---

## 6. Code Implementation Details

### 6.1 Shared Security Library

#### File: shared-security/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.MaSoVa</groupId>
        <artifactId>restaurant-management</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>shared-security</artifactId>
    <packaging>jar</packaging>
    <name>Shared Security Library</name>
    <description>Common security components for all microservices</description>

    <dependencies>
        <!-- Spring Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Logging -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

#### File: shared-security/src/main/java/com/MaSoVa/shared/security/util/JwtTokenProvider.java
```java
package com.MaSoVa.shared.security.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Enterprise-grade JWT Token Provider
 * Handles token generation, validation, and parsing
 * Thread-safe and production-ready
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration:3600000}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration
    ) {
        // Convert string secret to SecretKey for HS512
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;

        log.info("JwtTokenProvider initialized with accessTokenExpiration={}ms, refreshTokenExpiration={}ms",
                accessTokenExpiration, refreshTokenExpiration);
    }

    /**
     * Generate access token from authentication
     */
    public String generateAccessToken(Authentication authentication) {
        return generateToken(authentication, accessTokenExpiration);
    }

    /**
     * Generate refresh token from authentication
     */
    public String generateRefreshToken(Authentication authentication) {
        return generateToken(authentication, refreshTokenExpiration);
    }

    /**
     * Core token generation logic
     */
    private String generateToken(Authentication authentication, long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(authentication.getName())
                .claim("roles", roles)
                .claim("email", authentication.getName()) // Assuming username is email
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Get user ID from token
     */
    public String getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    /**
     * Get roles from token
     */
    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Claims claims = parseToken(token);
        return (List<String>) claims.get("roles");
    }

    /**
     * Validate token
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (SignatureException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Parse and validate token
     * @throws JwtException if token is invalid
     */
    private Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException ex) {
            return true;
        } catch (JwtException ex) {
            return true;
        }
    }

    /**
     * Get expiration date from token
     */
    public Date getExpirationDateFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getExpiration();
    }
}
```

#### File: shared-security/src/main/java/com/MaSoVa/shared/security/filter/JwtAuthenticationFilter.java
```java
package com.MaSoVa.shared.security.filter;

import com.MaSoVa.shared.security.util.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Enterprise-grade JWT Authentication Filter
 * Extracts and validates JWT from Authorization header
 * Populates Spring Security context with authentication
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String jwt = extractJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                String userId = jwtTokenProvider.getUserIdFromToken(jwt);
                List<String> roles = jwtTokenProvider.getRolesFromToken(jwt);

                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Set authentication for user: {} with roles: {}", userId, roles);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
            // Don't throw exception - let it continue to be handled by Spring Security
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT from Authorization header
     * Expected format: "Bearer <token>"
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
}
```

#### File: shared-security/src/main/java/com/MaSoVa/shared/security/config/SecurityConfigurationBase.java
```java
package com.MaSoVa.shared.security.config;

import com.MaSoVa.shared.security.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Base Security Configuration for all microservices
 * Provides common security setup with customization options
 * Extend this class in each service to customize public endpoints
 */
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public abstract class SecurityConfigurationBase {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Override this method in each service to define public endpoints
     * Example: return new String[]{"/api/menu/public/**", "/actuator/health"};
     */
    protected abstract String[] getPublicEndpoints();

    /**
     * Main security filter chain configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (using JWT, stateless)
            .csrf(AbstractHttpConfigurer::disable)

            // Configure CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Stateless session management
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> {
                // Public endpoints (defined by each service)
                String[] publicEndpoints = getPublicEndpoints();
                if (publicEndpoints != null && publicEndpoints.length > 0) {
                    auth.requestMatchers(publicEndpoints).permitAll();
                }

                // All other endpoints require authentication
                auth.anyRequest().authenticated();
            })

            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS configuration
     * Allows requests from frontend origins
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins (from environment variable)
        configuration.setAllowedOrigins(getAllowedOrigins());

        // Allow all HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allow all headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    /**
     * Get allowed origins from environment or use defaults
     */
    protected List<String> getAllowedOrigins() {
        String allowedOriginsEnv = System.getenv("ALLOWED_ORIGINS");
        if (allowedOriginsEnv != null && !allowedOriginsEnv.isEmpty()) {
            return Arrays.asList(allowedOriginsEnv.split(","));
        }

        // Default origins for development
        return Arrays.asList("http://localhost:3000", "http://localhost:5173");
    }

    /**
     * Password encoder bean (BCrypt)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 6.2 Menu Service Security (Example Implementation)

#### File: menu-service/pom.xml (Add dependency)
```xml
<!-- Add this dependency -->
<dependency>
    <groupId>com.MaSoVa</groupId>
    <artifactId>shared-security</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### File: menu-service/src/main/java/com/MaSoVa/menu/config/SecurityConfig.java (NEW FILE)
```java
package com.MaSoVa.menu.config;

import com.MaSoVa.shared.security.config.SecurityConfigurationBase;
import com.MaSoVa.shared.security.filter.JwtAuthenticationFilter;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Menu Service Security Configuration
 * Extends shared security base with service-specific public endpoints
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig extends SecurityConfigurationBase {

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        super(jwtAuthenticationFilter);
    }

    /**
     * Define public endpoints for menu service
     * Public: Viewing menu items, categories
     * Protected: Creating, updating, deleting menu items
     */
    @Override
    protected String[] getPublicEndpoints() {
        return new String[]{
            "/api/menu/public/**",          // Public menu browsing
            "/api/menu/categories/public",  // Public categories
            "/actuator/health",             // Health check
            "/actuator/info",               // Service info
            "/swagger-ui/**",               // Swagger UI (dev only)
            "/v3/api-docs/**"               // OpenAPI docs (dev only)
        };
    }
}
```

#### File: menu-service/src/main/resources/application.yml (Update)
```yaml
server:
  port: 8082

spring:
  application:
    name: menu-service
  data:
    mongodb:
      uri: mongodb://localhost:27017/MaSoVa
    redis:
      host: localhost
      port: 6379

# JWT Configuration (from environment variables)
jwt:
  secret: ${JWT_SECRET}
  access-token-expiration: ${JWT_ACCESS_TOKEN_EXPIRATION:3600000}
  refresh-token-expiration: ${JWT_REFRESH_TOKEN_EXPIRATION:604800000}

# Logging for security
logging:
  level:
    com.MaSoVa.shared.security: DEBUG
    org.springframework.security: DEBUG
```

### 6.3 Order Service Security Fix

#### File: order-service/src/main/java/com/MaSoVa/order/config/SecurityConfig.java (UPDATE)
```java
package com.MaSoVa.order.config;

import com.MaSoVa.shared.security.config.SecurityConfigurationBase;
import com.MaSoVa.shared.security.filter.JwtAuthenticationFilter;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Order Service Security Configuration
 * UPDATED: Removed permitAll, added JWT authentication
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig extends SecurityConfigurationBase {

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        super(jwtAuthenticationFilter);
    }

    /**
     * Define public endpoints for order service
     * Most endpoints require authentication
     */
    @Override
    protected String[] getPublicEndpoints() {
        return new String[]{
            "/actuator/health",       // Health check
            "/actuator/info",         // Service info
            "/api/orders/tracking/**" // Public order tracking (with order ID + phone)
        };
    }
}
```

#### File: order-service/src/main/resources/application.yml (UPDATE)
```yaml
server:
  port: 8083

spring:
  application:
    name: order-service
  data:
    mongodb:
      uri: mongodb://localhost:27017/masova_orders
    redis:
      host: localhost
      port: 6379

# JWT Configuration (UPDATED to use shared secret from environment)
jwt:
  secret: ${JWT_SECRET}
  access-token-expiration: ${JWT_ACCESS_TOKEN_EXPIRATION:3600000}
  refresh-token-expiration: ${JWT_REFRESH_TOKEN_EXPIRATION:604800000}

logging:
  level:
    com.MaSoVa.shared.security: DEBUG
    org.springframework.security: DEBUG
```

### 6.4 Payment Service Security Fix (Critical - Financial Data)

#### File: payment-service/src/main/java/com/MaSoVa/payment/config/SecurityConfig.java (UPDATE)
```java
package com.MaSoVa.payment.config;

import com.MaSoVa.shared.security.config.SecurityConfigurationBase;
import com.MaSoVa.shared.security.filter.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

/**
 * Payment Service Security Configuration
 * CRITICAL: Handles financial data, requires strict security
 * PCI-DSS compliant configuration
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig extends SecurityConfigurationBase {

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        super(jwtAuthenticationFilter);
    }

    /**
     * Define public endpoints for payment service
     * Only webhook endpoint is public (verified separately)
     */
    @Override
    protected String[] getPublicEndpoints() {
        return new String[]{
            "/api/payments/webhook/**",  // Payment gateway webhooks (verify signature)
            "/actuator/health"           // Health check only
        };
    }

    /**
     * Enhanced security for payment service
     * Add custom configurations for PCI-DSS compliance
     */
    @Bean
    @Override
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Get base configuration
        SecurityFilterChain baseChain = super.securityFilterChain(http);

        // Add payment-specific security headers
        http.headers(headers -> headers
            .contentSecurityPolicy(csp -> csp
                .policyDirectives("default-src 'self'"))
            .frameOptions(frame -> frame.deny())
            .xssProtection(xss -> xss.disable()) // Handled by modern browsers
        );

        return http.build();
    }
}
```

#### File: payment-service/src/main/java/com/MaSoVa/payment/aspect/PaymentAuditAspect.java (NEW FILE - Audit Logging)
```java
package com.MaSoVa.payment.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Payment Audit Logging Aspect
 * PCI-DSS Requirement 10: Track and monitor all access to payment data
 */
@Slf4j
@Aspect
@Component
public class PaymentAuditAspect {

    @Before("execution(* com.MaSoVa.payment.service.PaymentService.*(..)) && " +
            "!execution(* com.MaSoVa.payment.service.PaymentService.get*(..))")
    public void auditPaymentOperation(JoinPoint joinPoint) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null ? auth.getName() : "SYSTEM";
        String operation = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        // Log to audit trail (should be sent to separate audit log system)
        log.info("PAYMENT_AUDIT: user={}, operation={}, timestamp={}, args={}",
                userId, operation, LocalDateTime.now(), maskSensitiveData(args));
    }

    @AfterReturning(pointcut = "execution(* com.MaSoVa.payment.service.PaymentService.processPayment(..))",
                    returning = "result")
    public void auditPaymentSuccess(JoinPoint joinPoint, Object result) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null ? auth.getName() : "SYSTEM";

        log.info("PAYMENT_SUCCESS: user={}, result={}, timestamp={}",
                userId, maskSensitiveData(result), LocalDateTime.now());
    }

    private Object maskSensitiveData(Object data) {
        // Mask credit card numbers, CVV, etc.
        // Implementation omitted for brevity
        return data.toString().replaceAll("\\d{13,19}", "****-****-****-****");
    }
}
```

### 6.5 API Gateway Route Fix

#### File: api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java (UPDATE)
```java
package com.MaSoVa.gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * API Gateway Configuration
 * UPDATED: Fixed inventory route, added environment variables
 */
@Slf4j
@Configuration
public class GatewayConfig {

    @Value("${services.user-service.url:http://localhost:8081}")
    private String userServiceUrl;

    @Value("${services.menu-service.url:http://localhost:8082}")
    private String menuServiceUrl;

    @Value("${services.order-service.url:http://localhost:8083}")
    private String orderServiceUrl;

    @Value("${services.analytics-service.url:http://localhost:8085}")
    private String analyticsServiceUrl;

    @Value("${services.payment-service.url:http://localhost:8086}")
    private String paymentServiceUrl;

    @Value("${services.inventory-service.url:http://localhost:8088}")  // FIXED: 8082 -> 8088
    private String inventoryServiceUrl;

    @Value("${services.review-service.url:http://localhost:8089}")
    private String reviewServiceUrl;

    @Value("${services.delivery-service.url:http://localhost:8090}")
    private String deliveryServiceUrl;

    @Value("${services.customer-service.url:http://localhost:8091}")
    private String customerServiceUrl;

    @Value("${services.notification-service.url:http://localhost:8092}")
    private String notificationServiceUrl;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        log.info("Configuring API Gateway routes");
        log.info("Inventory Service URL: {}", inventoryServiceUrl);  // Log for verification

        return builder.routes()
            // ============================================================
            // PUBLIC ROUTES (No JWT required)
            // ============================================================

            // Auth routes (login, register, refresh)
            .route("auth-routes", r -> r
                .path("/api/auth/**", "/api/users/login", "/api/users/register", "/api/users/refresh")
                .uri(userServiceUrl))

            // Public menu browsing
            .route("public-menu", r -> r
                .path("/api/menu/public/**")
                .and()
                .method(HttpMethod.GET)
                .uri(menuServiceUrl))

            // Public reviews
            .route("public-reviews", r -> r
                .path("/api/reviews/public/**")
                .and()
                .method(HttpMethod.GET)
                .uri(reviewServiceUrl))

            // Public order tracking
            .route("order-tracking", r -> r
                .path("/api/orders/tracking/**")
                .and()
                .method(HttpMethod.GET)
                .uri(orderServiceUrl))

            // Payment webhooks (verified separately)
            .route("payment-webhooks", r -> r
                .path("/api/payments/webhook/**")
                .uri(paymentServiceUrl))

            // Health checks (all services)
            .route("health-checks", r -> r
                .path("/actuator/health", "/actuator/info")
                .uri("lb://health-check"))  // Load balance health checks if using service discovery

            // ============================================================
            // PROTECTED ROUTES (JWT required - validated here and in services)
            // ============================================================

            // User service
            .route("user-service", r -> r
                .path("/api/users/**")
                .filters(f -> f.preserveHostHeader())
                .uri(userServiceUrl))

            // Store management
            .route("store-service", r -> r
                .path("/api/stores/**")
                .filters(f -> f.preserveHostHeader())
                .uri(userServiceUrl))

            // Menu service
            .route("menu-service", r -> r
                .path("/api/menu/**")
                .filters(f -> f.preserveHostHeader())
                .uri(menuServiceUrl))

            // Order service
            .route("order-service", r -> r
                .path("/api/orders/**")
                .filters(f -> f.preserveHostHeader())
                .uri(orderServiceUrl))

            // Analytics service
            .route("analytics-service", r -> r
                .path("/api/analytics/**")
                .filters(f -> f.preserveHostHeader())
                .uri(analyticsServiceUrl))

            // Payment service
            .route("payment-service", r -> r
                .path("/api/payments/**")
                .filters(f -> f.preserveHostHeader())
                .uri(paymentServiceUrl))

            // Inventory service (FIXED: now points to 8088)
            .route("inventory-service", r -> r
                .path("/api/inventory/**")
                .filters(f -> f.preserveHostHeader())
                .uri(inventoryServiceUrl))

            // Review service
            .route("review-service", r -> r
                .path("/api/reviews/**")
                .filters(f -> f.preserveHostHeader())
                .uri(reviewServiceUrl))

            // Delivery service
            .route("delivery-service", r -> r
                .path("/api/delivery/**")
                .filters(f -> f.preserveHostHeader())
                .uri(deliveryServiceUrl))

            // Customer service
            .route("customer-service", r -> r
                .path("/api/customers/**")
                .filters(f -> f.preserveHostHeader())
                .uri(customerServiceUrl))

            // Notification service
            .route("notification-service", r -> r
                .path("/api/notifications/**")
                .filters(f -> f.preserveHostHeader())
                .uri(notificationServiceUrl))

            .build();
    }

    /**
     * CORS configuration
     * Centralized CORS handling for all microservices
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        corsConfig.setAllowedHeaders(Arrays.asList("*"));
        corsConfig.setAllowCredentials(true);
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
```

#### File: api-gateway/src/main/resources/application.yml (UPDATE)
```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - ${ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - PATCH
              - OPTIONS
            allowedHeaders:
              - "*"
            allowCredentials: true
            maxAge: 3600
      # Default filters for all routes
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin

# JWT Configuration
jwt:
  secret: ${JWT_SECRET}
  access-token-expiration: ${JWT_ACCESS_TOKEN_EXPIRATION:3600000}
  refresh-token-expiration: ${JWT_REFRESH_TOKEN_EXPIRATION:604800000}

# Service URLs (from environment variables)
services:
  user-service:
    url: ${USER_SERVICE_URL:http://localhost:8081}
  menu-service:
    url: ${MENU_SERVICE_URL:http://localhost:8082}
  order-service:
    url: ${ORDER_SERVICE_URL:http://localhost:8083}
  analytics-service:
    url: ${ANALYTICS_SERVICE_URL:http://localhost:8085}
  payment-service:
    url: ${PAYMENT_SERVICE_URL:http://localhost:8086}
  inventory-service:
    url: ${INVENTORY_SERVICE_URL:http://localhost:8088}  # FIXED
  review-service:
    url: ${REVIEW_SERVICE_URL:http://localhost:8089}
  delivery-service:
    url: ${DELIVERY_SERVICE_URL:http://localhost:8090}
  customer-service:
    url: ${CUSTOMER_SERVICE_URL:http://localhost:8091}
  notification-service:
    url: ${NOTIFICATION_SERVICE_URL:http://localhost:8092}

# CORS Configuration
cors:
  allowed-origins: ${ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}

# Logging
logging:
  level:
    org.springframework.cloud.gateway: DEBUG
    com.MaSoVa.gateway: DEBUG
```

### 6.6 Frontend API Configuration

#### File: frontend/src/config/api.config.ts (UPDATE)
```typescript
/**
 * API Configuration for Frontend
 * UPDATED: All requests now route through API Gateway
 *
 * IMPORTANT: DO NOT bypass the API Gateway by directly connecting to services.
 * All service communication must go through the gateway for:
 * - Centralized authentication/authorization
 * - CORS handling
 * - Rate limiting
 * - Request/response transformation
 * - Monitoring and logging
 */

interface ApiConfig {
  readonly API_GATEWAY_URL: string;
  readonly TIMEOUT: number;
  readonly RETRY_ATTEMPTS: number;

  // Internal reference only - DO NOT USE for API calls
  readonly _INTERNAL_SERVICE_PORTS: {
    readonly [key: string]: number;
  };
}

const API_CONFIG: ApiConfig = {
  // Primary API Gateway URL - ALL requests must use this
  API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',

  // Request timeout (30 seconds)
  TIMEOUT: 30000,

  // Retry failed requests up to 3 times (for network errors only)
  RETRY_ATTEMPTS: 3,

  // Service ports for reference only
  // DO NOT use these for direct API calls
  _INTERNAL_SERVICE_PORTS: {
    GATEWAY: 8080,
    USER_SERVICE: 8081,
    MENU_SERVICE: 8082,
    ORDER_SERVICE: 8083,
    ANALYTICS_SERVICE: 8085,
    PAYMENT_SERVICE: 8086,
    INVENTORY_SERVICE: 8088,
    REVIEW_SERVICE: 8089,
    DELIVERY_SERVICE: 8090,
    CUSTOMER_SERVICE: 8091,
    NOTIFICATION_SERVICE: 8092,
  }
} as const;

export default API_CONFIG;

// Helper to ensure we're using the gateway
export const getApiUrl = (path: string): string => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Ensure we're not accidentally using a full URL (direct service call)
  if (cleanPath.includes('://')) {
    console.error('SECURITY ERROR: Attempted to bypass API Gateway!', cleanPath);
    throw new Error('Direct service calls are not allowed. Use API Gateway.');
  }

  return `${API_CONFIG.API_GATEWAY_URL}/${cleanPath}`;
};
```

#### File: frontend/src/store/api/baseApi.ts (NEW FILE - Shared RTK Query Base)
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '@/config/api.config';
import type { RootState } from '../store';

/**
 * Base API configuration for all RTK Query APIs
 * Provides:
 * - Centralized base URL (API Gateway)
 * - Automatic JWT token injection
 * - Error handling
 * - Request/response logging (dev mode)
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.API_GATEWAY_URL,
    timeout: API_CONFIG.TIMEOUT,

    // Automatically inject JWT token from Redux state
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Always set Content-Type for JSON
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      return headers;
    },

    // Credentials for CORS
    credentials: 'include',
  }),

  // Tag types for cache invalidation
  tagTypes: [
    'User',
    'Menu',
    'Order',
    'Payment',
    'Inventory',
    'Review',
    'Delivery',
    'Customer',
    'Analytics',
    'Notification',
  ],

  endpoints: () => ({}),
});
```

#### File: frontend/src/store/api/userApi.ts (UPDATE - Example)
```typescript
import { baseApi } from './baseApi';

/**
 * User API
 * UPDATED: Now uses baseApi which routes through API Gateway
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  storeId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',  // Routes to http://localhost:8080/api/auth/login
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Get all users (for admin)
    getUsers: builder.query<User[], void>({
      query: () => '/users',  // Routes to http://localhost:8080/api/users
      providesTags: ['User'],
    }),

    // Get user by ID
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Update user
    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    // Delete user
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useLoginMutation,
  useGetUsersQuery,  // EXPORTED (was missing before)
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
```

#### File: frontend/src/store/api/inventoryApi.ts (UPDATE - Already using gateway, verify)
```typescript
import { baseApi } from './baseApi';

/**
 * Inventory API
 * VERIFIED: Uses API Gateway (was already correct)
 */

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  // ... other fields
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryItems: builder.query<InventoryItem[], void>({
      query: () => '/inventory/items',  // http://localhost:8080/api/inventory/items
      providesTags: ['Inventory'],
    }),

    getLowStockItems: builder.query<InventoryItem[], void>({
      query: () => '/inventory/low-stock',
      providesTags: ['Inventory'],
    }),

    // ... other endpoints
  }),
});

export const {
  useGetInventoryItemsQuery,
  useGetLowStockItemsQuery,
  // ... other hooks
} = inventoryApi;
```

### 6.7 Environment Configuration Files

#### File: config/dev.env (NEW FILE)
```bash
# Development Environment Configuration
# DO NOT commit this file to Git with real secrets

# JWT Configuration
JWT_SECRET=MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-512-bits-for-HS512-algorithm-security-requirement
JWT_ACCESS_TOKEN_EXPIRATION=3600000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# API Gateway
API_GATEWAY_URL=http://localhost:8080

# Service URLs (for gateway routing)
USER_SERVICE_URL=http://localhost:8081
MENU_SERVICE_URL=http://localhost:8082
ORDER_SERVICE_URL=http://localhost:8083
ANALYTICS_SERVICE_URL=http://localhost:8085
PAYMENT_SERVICE_URL=http://localhost:8086
INVENTORY_SERVICE_URL=http://localhost:8088
REVIEW_SERVICE_URL=http://localhost:8089
DELIVERY_SERVICE_URL=http://localhost:8090
CUSTOMER_SERVICE_URL=http://localhost:8091
NOTIFICATION_SERVICE_URL=http://localhost:8092

# Database URLs (MongoDB)
MONGODB_URI=mongodb://localhost:27017
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging Level
LOG_LEVEL=DEBUG
```

#### File: config/prod.env.example (NEW FILE)
```bash
# Production Environment Configuration
# Copy this file to prod.env and fill in real values
# NEVER commit prod.env to Git

# JWT Configuration (ROTATE IN PRODUCTION!)
JWT_SECRET=<GENERATE-NEW-512-BIT-SECRET-KEY-FOR-PRODUCTION>
JWT_ACCESS_TOKEN_EXPIRATION=3600000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# CORS Configuration (production domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API Gateway (production URL)
API_GATEWAY_URL=https://api.yourdomain.com

# Service URLs (internal Kubernetes/Docker network)
USER_SERVICE_URL=http://user-service:8081
MENU_SERVICE_URL=http://menu-service:8082
ORDER_SERVICE_URL=http://order-service:8083
ANALYTICS_SERVICE_URL=http://analytics-service:8085
PAYMENT_SERVICE_URL=http://payment-service:8086
INVENTORY_SERVICE_URL=http://inventory-service:8088
REVIEW_SERVICE_URL=http://review-service:8089
DELIVERY_SERVICE_URL=http://delivery-service:8090
CUSTOMER_SERVICE_URL=http://customer-service:8091
NOTIFICATION_SERVICE_URL=http://notification-service:8092

# Database URLs (production)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
REDIS_HOST=<redis-production-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Logging Level
LOG_LEVEL=INFO

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

#### File: .gitignore (UPDATE - Add environment files)
```
# Environment files (contain secrets)
config/dev.env
config/staging.env
config/prod.env
.env
.env.local
.env.*.local

# Keep example files
!config/*.example
```

---

## 7. Testing Strategy

### 7.1 Unit Testing

#### Test Coverage Requirements
- **Minimum Coverage:** 80% for all security-critical components
- **Critical Components:** 100% coverage required
  - JwtTokenProvider
  - JwtAuthenticationFilter
  - SecurityConfigurationBase
  - All SecurityConfig classes

#### Example: JwtTokenProvider Unit Test
```java
package com.MaSoVa.shared.security.util;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Arrays;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String testSecret = "test-secret-key-must-be-at-least-512-bits-for-hs512-algorithm-test-secret-key-must-be-at-least-512-bits";
    private final long accessTokenExpiration = 3600000; // 1 hour
    private final long refreshTokenExpiration = 604800000; // 7 days

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(testSecret, accessTokenExpiration, refreshTokenExpiration);
    }

    @Test
    void generateAccessToken_ShouldCreateValidToken() {
        // Arrange
        List<SimpleGrantedAuthority> authorities = Arrays.asList(
            new SimpleGrantedAuthority("ROLE_USER"),
            new SimpleGrantedAuthority("ROLE_MANAGER")
        );
        Authentication auth = new UsernamePasswordAuthenticationToken("user@example.com", null, authorities);

        // Act
        String token = jwtTokenProvider.generateAccessToken(auth);

        // Assert
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("user@example.com", jwtTokenProvider.getUserIdFromToken(token));

        List<String> roles = jwtTokenProvider.getRolesFromToken(token);
        assertEquals(2, roles.size());
        assertTrue(roles.contains("ROLE_USER"));
        assertTrue(roles.contains("ROLE_MANAGER"));
    }

    @Test
    void validateToken_WithInvalidSignature_ShouldReturnFalse() {
        // Arrange
        String tamperedToken = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIn0.invalid_signature";

        // Act & Assert
        assertFalse(jwtTokenProvider.validateToken(tamperedToken));
    }

    @Test
    void validateToken_WithExpiredToken_ShouldReturnFalse() throws InterruptedException {
        // Arrange
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(testSecret, 100, 100); // 100ms expiration
        List<SimpleGrantedAuthority> authorities = Arrays.asList(new SimpleGrantedAuthority("ROLE_USER"));
        Authentication auth = new UsernamePasswordAuthenticationToken("user@example.com", null, authorities);

        String token = shortLivedProvider.generateAccessToken(auth);
        Thread.sleep(200); // Wait for expiration

        // Act & Assert
        assertFalse(shortLivedProvider.validateToken(token));
        assertTrue(shortLivedProvider.isTokenExpired(token));
    }

    @Test
    void getUserIdFromToken_ShouldExtractCorrectUserId() {
        // Arrange
        Authentication auth = new UsernamePasswordAuthenticationToken("user@example.com", null);
        String token = jwtTokenProvider.generateAccessToken(auth);

        // Act
        String userId = jwtTokenProvider.getUserIdFromToken(token);

        // Assert
        assertEquals("user@example.com", userId);
    }

    @Test
    void getExpirationDateFromToken_ShouldReturnFutureDate() {
        // Arrange
        Authentication auth = new UsernamePasswordAuthenticationToken("user@example.com", null);
        String token = jwtTokenProvider.generateAccessToken(auth);

        // Act
        Date expirationDate = jwtTokenProvider.getExpirationDateFromToken(token);

        // Assert
        assertNotNull(expirationDate);
        assertTrue(expirationDate.after(new Date()));
    }
}
```

### 7.2 Integration Testing

#### Example: API Gateway Integration Test
```java
package com.MaSoVa.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class ApiGatewayIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    private final String validJwtToken = "eyJhbGciOiJIUzUxMiJ9..."; // Generate valid token for test

    @Test
    void publicEndpoint_WithoutToken_ShouldReturn200() {
        webTestClient.get()
            .uri("/api/menu/public/categories")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    void protectedEndpoint_WithoutToken_ShouldReturn401() {
        webTestClient.get()
            .uri("/api/users")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void protectedEndpoint_WithValidToken_ShouldReturn200() {
        webTestClient.get()
            .uri("/api/users")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + validJwtToken)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    void protectedEndpoint_WithInvalidToken_ShouldReturn401() {
        webTestClient.get()
            .uri("/api/users")
            .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.token.here")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void cors_PreflightRequest_ShouldReturnCorrectHeaders() {
        webTestClient.options()
            .uri("/api/users")
            .header(HttpHeaders.ORIGIN, "http://localhost:3000")
            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type,Authorization")
            .exchange()
            .expectStatus().isOk()
            .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000")
            .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
    }
}
```

### 7.3 Security Testing Checklist

```markdown
# Security Testing Checklist

## Authentication Tests
- [ ] Login with valid credentials returns JWT
- [ ] Login with invalid credentials returns 401
- [ ] JWT contains correct user ID and roles
- [ ] JWT expires after configured time
- [ ] Expired JWT is rejected (401)
- [ ] Tampered JWT is rejected (401)
- [ ] JWT with wrong signature is rejected (401)
- [ ] Refresh token flow works correctly
- [ ] Refresh token expires after configured time

## Authorization Tests
- [ ] Unauthenticated requests to protected endpoints return 401
- [ ] Authenticated requests with wrong role return 403
- [ ] ROLE_USER cannot access admin endpoints
- [ ] ROLE_MANAGER can access manager endpoints
- [ ] ROLE_ADMIN can access all endpoints
- [ ] Users can only access their own data (data isolation)

## API Gateway Tests
- [ ] All routes proxy to correct services
- [ ] Inventory route points to port 8088 (not 8082)
- [ ] Public endpoints accessible without token
- [ ] Protected endpoints require valid token
- [ ] CORS headers present on all responses
- [ ] Preflight OPTIONS requests handled correctly
- [ ] Rate limiting enforced (100 req/min)
- [ ] Request size limits enforced (10MB max)

## CORS Tests
- [ ] Allowed origins (localhost:3000, localhost:5173) accepted
- [ ] Disallowed origins rejected
- [ ] All HTTP methods (GET, POST, PUT, DELETE, PATCH) allowed
- [ ] Credentials (cookies, auth headers) allowed
- [ ] Preflight cache set to 1 hour

## Input Validation Tests
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Path traversal attempts blocked
- [ ] Oversized requests rejected
- [ ] Invalid JSON rejected with 400
- [ ] Missing required fields rejected with 400

## Service-Specific Tests

### Payment Service
- [ ] All payment operations logged to audit trail
- [ ] Only authenticated users can view payments
- [ ] Users can only view their own payments
- [ ] Refunds require ROLE_MANAGER or higher
- [ ] Webhook endpoint public but signature verified
- [ ] Credit card numbers masked in logs
- [ ] PCI-DSS security headers present

### Customer Service
- [ ] Users can only view/edit their own profile
- [ ] ROLE_STAFF can view customer profiles (read-only)
- [ ] ROLE_MANAGER can edit customer profiles
- [ ] PII masked in logs (email, phone, address)
- [ ] GDPR-compliant audit logging

### Inventory Service
- [ ] ROLE_STAFF can view inventory
- [ ] ROLE_MANAGER can create/update inventory
- [ ] ROLE_ADMIN can delete inventory
- [ ] Stock levels cannot go negative

## Penetration Testing
- [ ] OWASP ZAP scan completed (0 high-severity issues)
- [ ] Burp Suite scan completed
- [ ] JWT cracking attempt fails
- [ ] Brute force login blocked by rate limiting
- [ ] Session fixation not possible (stateless JWT)
- [ ] CSRF not possible (no session cookies)

## Load Testing (via JMeter/Gatling)
- [ ] 1000 RPS sustained for 10 minutes
- [ ] Average response time < 200ms
- [ ] 95th percentile < 500ms
- [ ] 99th percentile < 1000ms
- [ ] Error rate < 0.1%
- [ ] No memory leaks during load test
```

---

## 8. Deployment Strategy

### 8.1 Pre-Deployment Checklist

```markdown
# Pre-Deployment Checklist

## Code Review
- [ ] All code changes peer-reviewed
- [ ] Security review completed
- [ ] No hardcoded secrets in code
- [ ] All environment variables documented
- [ ] Logging does not expose sensitive data

## Testing
- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] Security tests passing
- [ ] Load tests passing
- [ ] No critical or high-severity bugs

## Configuration
- [ ] Production JWT secret generated (512-bit minimum)
- [ ] All environment variables set in production
- [ ] CORS configured for production domains
- [ ] Database connection strings updated
- [ ] Redis connection configured
- [ ] Service URLs configured for production

## Database
- [ ] Database migration scripts tested
- [ ] Backup created before deployment
- [ ] Rollback plan documented
- [ ] Indexes optimized for production load

## Monitoring
- [ ] Application metrics enabled
- [ ] Log aggregation configured
- [ ] Alerting rules configured
- [ ] Health check endpoints verified
- [ ] Dashboard created for monitoring

## Documentation
- [ ] Deployment runbook updated
- [ ] API documentation updated
- [ ] Rollback procedures documented
- [ ] Incident response plan reviewed
```

### 8.2 Deployment Steps (Blue-Green Deployment)

#### Phase 1: Preparation
```bash
# 1. Create production environment file
cp config/prod.env.example config/prod.env
# Edit prod.env with production values

# 2. Generate new JWT secret for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Add to prod.env

# 3. Build all services
mvn clean package -DskipTests

# 4. Build frontend
cd frontend
npm run build
cd ..

# 5. Tag Docker images
docker build -t masova/api-gateway:1.0.0 ./api-gateway
docker build -t masova/user-service:1.0.0 ./user-service
# ... repeat for all services
```

#### Phase 2: Staging Deployment
```bash
# 1. Deploy to staging environment
kubectl apply -f k8s/staging/

# 2. Wait for all pods to be ready
kubectl wait --for=condition=ready pod -l app=masova -n staging --timeout=300s

# 3. Run smoke tests
./scripts/smoke-tests.sh staging

# 4. Run full integration tests
./scripts/integration-tests.sh staging

# 5. Verify no errors in logs
kubectl logs -l app=masova -n staging --tail=100 | grep -i error
```

#### Phase 3: Production Deployment (Blue-Green)
```bash
# Current production = Blue
# New deployment = Green

# 1. Deploy green environment
kubectl apply -f k8s/production-green/

# 2. Wait for green pods to be ready
kubectl wait --for=condition=ready pod -l app=masova,env=green -n production --timeout=300s

# 3. Run smoke tests on green
./scripts/smoke-tests.sh production-green

# 4. Gradually shift traffic (10% → 50% → 100%)
# 10% to green
kubectl patch service masova-gateway -n production -p '{"spec":{"selector":{"env":"green","weight":"10"}}}'
sleep 300 # Monitor for 5 minutes

# 50% to green
kubectl patch service masova-gateway -n production -p '{"spec":{"selector":{"weight":"50"}}}'
sleep 600 # Monitor for 10 minutes

# 100% to green (full cutover)
kubectl patch service masova-gateway -n production -p '{"spec":{"selector":{"env":"green","weight":"100"}}}'

# 5. Monitor metrics for 1 hour
# Check error rates, response times, throughput

# 6. If successful, label green as blue (new production)
kubectl label pods -l env=green env=blue --overwrite -n production

# 7. Remove old blue environment
kubectl delete deployment -l env=blue-old -n production
```

#### Phase 4: Rollback Plan (If Needed)
```bash
# If issues detected, rollback to blue

# 1. Shift traffic back to blue (old version)
kubectl patch service masova-gateway -n production -p '{"spec":{"selector":{"env":"blue"}}}'

# 2. Verify old version working
./scripts/smoke-tests.sh production-blue

# 3. Investigate green environment issues
kubectl logs -l env=green -n production --tail=1000 > green-errors.log

# 4. Keep green running for debugging
# Do not delete until issue identified

# 5. Fix issues and retry deployment
```

### 8.3 Post-Deployment Verification

```bash
# 1. Health checks
curl https://api.yourdomain.com/actuator/health

# 2. Verify JWT authentication
TOKEN=$(curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.accessToken')

echo "Token: $TOKEN"

# 3. Test protected endpoint
curl https://api.yourdomain.com/api/users \
  -H "Authorization: Bearer $TOKEN"

# 4. Verify CORS
curl -I https://api.yourdomain.com/api/menu/public/categories \
  -H "Origin: https://yourdomain.com" \
  | grep -i access-control

# 5. Check error logs (should be minimal)
kubectl logs -l app=masova -n production --since=1h | grep -i error | wc -l

# 6. Verify metrics
curl https://api.yourdomain.com/actuator/metrics

# 7. Test all critical user flows
# - User registration
# - Login
# - Place order
# - Make payment
# - Track delivery
```

---

## 9. Monitoring & Observability

### 9.1 Metrics to Monitor

#### Application Metrics
```yaml
# Prometheus metrics configuration

# Request metrics
- http_requests_total (counter)
  labels: method, endpoint, status_code, service

- http_request_duration_seconds (histogram)
  labels: method, endpoint, service
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]

# Authentication metrics
- jwt_validation_total (counter)
  labels: result (success/failure), reason

- jwt_generation_total (counter)
  labels: token_type (access/refresh)

# Business metrics
- orders_created_total (counter)
  labels: store_id, order_type

- payments_processed_total (counter)
  labels: payment_method, status

- inventory_low_stock_items (gauge)
  labels: store_id

# System metrics
- jvm_memory_used_bytes (gauge)
- jvm_threads_current (gauge)
- database_connections_active (gauge)
- cache_hits_total (counter)
- cache_misses_total (counter)
```

#### Logging Standards
```yaml
# Log format (JSON)
{
  "timestamp": "2025-11-30T10:15:30.123Z",
  "level": "INFO",
  "service": "payment-service",
  "traceId": "abc123def456",
  "spanId": "789ghi012jkl",
  "userId": "user_12345",
  "method": "POST",
  "endpoint": "/api/payments",
  "statusCode": 200,
  "duration": 145,
  "message": "Payment processed successfully",
  "paymentId": "PAY_789",
  "amount": 45.99
}

# Security audit log (separate stream)
{
  "timestamp": "2025-11-30T10:15:30.123Z",
  "level": "AUDIT",
  "service": "payment-service",
  "userId": "user_12345",
  "action": "PAYMENT_PROCESSED",
  "resource": "PAY_789",
  "result": "SUCCESS",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "details": {
    "amount": "****",  // Masked
    "method": "credit_card_****1234"
  }
}
```

### 9.2 Alerting Rules

```yaml
# Prometheus alerting rules

groups:
  - name: masova_alerts
    interval: 30s
    rules:

      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service)
          /
          sum(rate(http_requests_total[5m])) by (service)
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "{{ $labels.service }} has error rate > 5% for 5 minutes"

      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.service }}"
          description: "95th percentile response time > 1s on {{ $labels.service }}"

      # JWT validation failures
      - alert: HighJwtFailureRate
        expr: |
          sum(rate(jwt_validation_total{result="failure"}[5m])) by (service)
          /
          sum(rate(jwt_validation_total[5m])) by (service)
          > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High JWT validation failure rate"
          description: "{{ $labels.service }} has JWT failure rate > 10%"

      # Service down
      - alert: ServiceDown
        expr: up{job="masova-services"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          description: "{{ $labels.instance }} has been down for 1 minute"

      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: database_connections_active / database_connections_max > 0.9
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $labels.service }} using > 90% of connection pool"

      # Low inventory items
      - alert: LowInventoryItems
        expr: inventory_low_stock_items > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low inventory items for store {{ $labels.store_id }}"
          description: "{{ $value }} items below reorder level"
```

### 9.3 Dashboard Configuration (Grafana)

```json
{
  "dashboard": {
    "title": "MaSoVa Service Health Dashboard",
    "panels": [
      {
        "title": "Request Rate (RPS)",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[1m])) by (service)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate (%)",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) * 100"
          }
        ],
        "type": "graph",
        "alert": {
          "conditions": [
            {
              "evaluator": {
                "params": [5],
                "type": "gt"
              }
            }
          ]
        }
      },
      {
        "title": "Response Time (P50, P95, P99)",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))",
            "legendFormat": "P50 - {{service}}"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))",
            "legendFormat": "P95 - {{service}}"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))",
            "legendFormat": "P99 - {{service}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "JWT Validation Success Rate",
        "targets": [
          {
            "expr": "sum(rate(jwt_validation_total{result=\"success\"}[5m])) / sum(rate(jwt_validation_total[5m])) * 100"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "count(count by (userId) (http_requests_total{userId!=\"\"}))"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Service Status",
        "targets": [
          {
            "expr": "up{job=\"masova-services\"}"
          }
        ],
        "type": "status-history"
      }
    ]
  }
}
```

---

## 10. Maintenance & Long-term Strategy

### 10.1 Regular Maintenance Tasks

#### Daily
- Monitor error logs for unusual patterns
- Check alert notifications
- Verify backup completion
- Review security audit logs

#### Weekly
- Review JWT secret rotation schedule
- Analyze performance metrics trends
- Check for dependency updates (security patches)
- Review and archive old logs

#### Monthly
- Rotate JWT secret in production
- Review and update security policies
- Conduct security audit
- Performance optimization review
- Database index optimization

#### Quarterly
- Full security penetration testing
- Disaster recovery drill
- Review and update documentation
- Technology stack updates
- Load testing with projected growth

### 10.2 JWT Secret Rotation Procedure

```bash
# Monthly JWT Secret Rotation

# 1. Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "New Secret: $NEW_SECRET"

# 2. Add new secret to environment (both old and new)
# Update application.yml to support dual secrets temporarily
jwt:
  secret: ${JWT_SECRET}
  secret-new: ${JWT_SECRET_NEW}  # For rotation

# 3. Deploy update (blue-green)
# Services now validate tokens with both old and new secrets

# 4. Wait for all old tokens to expire (1 hour for access tokens)
sleep 3600

# 5. Update environment to use only new secret
jwt:
  secret: ${JWT_SECRET_NEW}

# 6. Deploy final update
# Remove dual-secret support

# 7. Verify all services working
./scripts/smoke-tests.sh production

# 8. Archive old secret securely
echo "$OLD_SECRET" >> /secure/archive/jwt-secrets-$(date +%Y%m%d).log
```

### 10.3 Scaling Strategy

#### Horizontal Scaling (Kubernetes)
```yaml
# Auto-scaling configuration

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: masova-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```

#### Database Scaling
```yaml
# MongoDB replica set for high availability

# Primary node (writes)
mongodb-primary:
  replicas: 1
  resources:
    requests:
      cpu: 2
      memory: 4Gi

# Secondary nodes (reads)
mongodb-secondary:
  replicas: 2
  resources:
    requests:
      cpu: 1
      memory: 2Gi

# Read preference: secondaryPreferred
spring:
  data:
    mongodb:
      uri: mongodb://primary:27017,secondary1:27017,secondary2:27017/masova?readPreference=secondaryPreferred
```

### 10.4 Future Enhancements

#### Phase 1 (Next 3 Months)
1. **Service Discovery** - Replace hardcoded URLs with Eureka/Consul
2. **Circuit Breaker** - Add Resilience4j for fault tolerance
3. **Distributed Tracing** - Implement Zipkin/Jaeger
4. **API Rate Limiting** - Per-user/per-endpoint rate limits
5. **WebSocket Security** - Secure real-time connections

#### Phase 2 (3-6 Months)
1. **Mutual TLS** - Service-to-service encryption
2. **OAuth2/OIDC** - Support for social login
3. **Multi-tenancy** - Proper data isolation per store
4. **GraphQL Gateway** - Alternative to REST
5. **Event-Driven Architecture** - Kafka for async communication

#### Phase 3 (6-12 Months)
1. **Machine Learning** - Fraud detection, demand forecasting
2. **Multi-region Deployment** - Global availability
3. **Advanced Analytics** - Real-time business intelligence
4. **Mobile Apps** - iOS/Android with same security model
5. **Blockchain** - Supply chain transparency (inventory)

---

## Appendix A: Quick Reference

### Service Ports
| Service | Port | Database |
|---------|------|----------|
| API Gateway | 8080 | N/A |
| User Service | 8081 | masova_db |
| Menu Service | 8082 | MaSoVa |
| Order Service | 8083 | masova_orders |
| Analytics Service | 8085 | masova_analytics |
| Payment Service | 8086 | masova_payments |
| Inventory Service | 8088 | masova_inventory |
| Review Service | 8089 | MaSoVa_reviews |
| Delivery Service | 8090 | delivery_db |
| Customer Service | 8091 | masova_customers |
| Notification Service | 8092 | masova-notification |

### Environment Variables
```bash
JWT_SECRET=<512-bit-secret>
JWT_ACCESS_TOKEN_EXPIRATION=3600000
JWT_REFRESH_TOKEN_EXPIRATION=604800000
ALLOWED_ORIGINS=<comma-separated-urls>
API_GATEWAY_URL=<gateway-url>
```

### Common Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f <service-name>

# Run tests
mvn test

# Build frontend
cd frontend && npm run build

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Appendix B: Compliance Checklist

### PCI-DSS Compliance
- ✅ Requirement 1: Firewall (API Gateway)
- ✅ Requirement 2: Change defaults (No permitAll)
- ✅ Requirement 6: Secure development (SecurityConfig)
- ✅ Requirement 7: Restrict access (RBAC)
- ✅ Requirement 8: Authenticate access (JWT)
- ✅ Requirement 10: Track access (Audit logging)

### GDPR Compliance
- ✅ Article 5: Security by design
- ✅ Article 25: Data protection by default
- ✅ Article 32: Security of processing
- ✅ Article 33: Breach notification (monitoring)

### SOC 2 Compliance
- ✅ CC6.1: Logical access controls
- ✅ CC6.6: Cryptographic protection
- ✅ CC7.2: System monitoring
- ✅ CC8.1: Change management

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-30 | Security Team | Initial comprehensive fix plan |

**Review Schedule:** This document should be reviewed and updated quarterly or after any major security incident.

**Document Classification:** INTERNAL - Contains architectural details

---

**END OF DOCUMENT**
