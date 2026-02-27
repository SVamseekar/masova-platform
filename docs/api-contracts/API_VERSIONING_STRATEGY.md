# API Versioning Strategy for MaSoVa

## Overview

This document defines the API versioning strategy to prevent breaking changes from affecting production systems.

**Industry Standard**: Used by Stripe, Twilio, GitHub, AWS, Google

---

## Versioning Approach: URI Versioning

**Pattern**: `/api/v{version}/{resource}`

**Examples**:
- `/api/v1/orders`
- `/api/v2/orders`
- `/api/v1/delivery/auto-dispatch`

---

## Version Lifecycle

### V1 (Current - Legacy)
- **Status**: Deprecated but supported
- **Sunset Date**: 6 months from V2 release
- **Changes**: No new features, bug fixes only

### V2 (Current - Recommended)
- **Status**: Active development
- **Stability**: Production-ready
- **Changes**: New features, improvements

### V3 (Future)
- **Status**: Beta/Development
- **Stability**: Not recommended for production
- **Changes**: Breaking changes from V2

---

## Implementation Guide

### Backend (Spring Boot)

#### Option 1: Separate Controllers (Recommended)

```java
// V1 Controller - Deprecated
@RestController
@RequestMapping("/api/v1/orders")
@Deprecated
public class OrderControllerV1 {

    @GetMapping("/{id}")
    public ResponseEntity<OrderV1Dto> getOrder(@PathVariable String id) {
        // Old implementation - never changed
        // Maintains backward compatibility
    }
}

// V2 Controller - Current
@RestController
@RequestMapping("/api/v2/orders")
public class OrderControllerV2 {

    @GetMapping("/{id}")
    public ResponseEntity<OrderV2Dto> getOrder(@PathVariable String id) {
        // New implementation with improvements
        // Can have different field names, structure
    }
}
```

#### Option 2: Single Controller with Version Parameter

```java
@RestController
@RequestMapping("/api/{version}/orders")
public class OrderController {

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(
        @PathVariable String version,
        @PathVariable String id
    ) {
        if ("v1".equals(version)) {
            return getOrderV1(id);
        } else if ("v2".equals(version)) {
            return getOrderV2(id);
        }
        throw new UnsupportedVersionException();
    }
}
```

### Frontend (TypeScript)

#### API Client Configuration

```typescript
// src/config/api.config.ts
export const API_CONFIG = {
  BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
  API_VERSION: 'v2', // Change this to switch versions globally

  // Service-specific versions
  SERVICES: {
    ORDER: 'v2',
    DELIVERY: 'v2',
    PAYMENT: 'v1', // Still on V1
    USER: 'v2',
  },
};

// Helper function
export const getApiUrl = (service: string, path: string) => {
  const version = API_CONFIG.SERVICES[service] || API_CONFIG.API_VERSION;
  return `${API_CONFIG.BASE_URL}/api/${version}/${path}`;
};
```

#### RTK Query with Versioning

```typescript
// src/store/api/orderApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiUrl } from '../../config/api.config';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl('ORDER', 'orders'),
    prepareHeaders: (headers, { getState }) => {
      // Add auth headers
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getOrder: builder.query({
      query: (id) => `/${id}`,
    }),
  }),
});
```

---

## Migration Strategy

### Step 1: Create V2 with Breaking Changes

**Backend**:
```java
// New field name: customerId -> customer_id
@RestController
@RequestMapping("/api/v2/orders")
public class OrderControllerV2 {
    // Use new DTOs with updated field names
}
```

**Frontend**:
```typescript
// Generated types from OpenAPI
import { OrderV2 } from '@/types/generated/order-service';

const order: OrderV2 = {
  customer_id: "123", // New field name
  // ...
};
```

### Step 2: Run Both Versions Simultaneously

- V1 endpoints: `/api/v1/orders`
- V2 endpoints: `/api/v2/orders`
- Both active in production

### Step 3: Gradual Migration

**Week 1-2**: Internal testing on V2
**Week 3-4**: Beta users on V2
**Week 5-8**: All new users on V2
**Month 3-6**: Migrate existing users to V2
**Month 6**: Sunset V1

### Step 4: Deprecation Notice

**Response Headers**:
```
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Deprecation: true
Link: </api/v2/orders>; rel="successor-version"
```

**In V1 Controllers**:
```java
@GetMapping("/{id}")
public ResponseEntity<Order> getOrder(@PathVariable String id) {
    return ResponseEntity.ok()
        .header("Deprecation", "true")
        .header("Sunset", "Sat, 31 Dec 2024 23:59:59 GMT")
        .header("Link", "</api/v2/orders>; rel=\"successor-version\"")
        .body(order);
}
```

---

## Breaking vs Non-Breaking Changes

### ✅ Non-Breaking (Can be added to existing version)

- **Adding** new optional fields
- **Adding** new endpoints
- **Adding** new query parameters (optional)
- Bug fixes that don't change behavior
- Performance improvements

**Example**: Safe to add to V1
```java
// Adding optional field - backward compatible
public class Order {
    private String id;
    private String customerName;
    private String email; // NEW - optional
}
```

### ❌ Breaking (Requires new version)

- **Removing** fields
- **Renaming** fields
- **Changing** field types
- **Changing** endpoint URLs
- **Changing** HTTP methods
- Making optional fields required
- Changing response format

**Example**: Requires V2
```java
// V1
public class Order {
    private String customerId; // OLD
}

// V2 - BREAKING CHANGE
public class Order {
    private String customer_id; // RENAMED - not compatible
}
```

---

## Version Support Policy

### Active Support (V2)
- **Duration**: Indefinite (current version)
- **Updates**: New features, bug fixes, security patches
- **SLA**: 99.9% uptime
- **Support**: Full support

### Deprecated (V1)
- **Duration**: 6 months after V2 release
- **Updates**: Critical bug fixes, security patches only
- **SLA**: 99% uptime
- **Support**: Limited support

### Sunset (End of Life)
- **After**: 6 months in deprecated status
- **Updates**: None
- **SLA**: None
- **Support**: No support
- **Action**: Returns 410 Gone

---

## Swagger/OpenAPI Integration

### Separate Specs per Version

```yaml
# V1 OpenAPI Spec
openapi: 3.0.0
info:
  title: Order Service API V1
  version: "1.0.0"
  deprecated: true
  description: "⚠️ DEPRECATED - Please migrate to V2"
servers:
  - url: http://localhost:8083/api/v1
```

```yaml
# V2 OpenAPI Spec
openapi: 3.0.0
info:
  title: Order Service API V2
  version: "2.0.0"
servers:
  - url: http://localhost:8083/api/v2
```

### Swagger UI Configuration

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public GroupedOpenApi v1Api() {
        return GroupedOpenApi.builder()
            .group("v1-deprecated")
            .pathsToMatch("/api/v1/**")
            .build();
    }

    @Bean
    public GroupedOpenApi v2Api() {
        return GroupedOpenApi.builder()
            .group("v2-current")
            .pathsToMatch("/api/v2/**")
            .build();
    }
}
```

---

## Monitoring & Metrics

### Track Version Usage

```java
@Aspect
@Component
public class ApiVersionMetrics {

    private final MeterRegistry registry;

    @Around("@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    public Object trackVersionUsage(ProceedingJoinPoint joinPoint) {
        String version = extractVersion(joinPoint);

        Counter.builder("api.requests")
            .tag("version", version)
            .register(registry)
            .increment();

        return joinPoint.proceed();
    }
}
```

### Alerts

- Alert when V1 usage > 10% (after migration period)
- Alert when deprecated API called after sunset date
- Dashboard showing version adoption rate

---

## Client Libraries

### Generated Clients per Version

```bash
# Generate V1 client
openapi-generator-cli generate \
  -i http://localhost:8083/api/v1/v3/api-docs \
  -g typescript-fetch \
  -o frontend/src/types/generated/order-service-v1

# Generate V2 client
openapi-generator-cli generate \
  -i http://localhost:8083/api/v2/v3/api-docs \
  -g typescript-fetch \
  -o frontend/src/types/generated/order-service-v2
```

---

## Example: Real Migration Scenario

### Problem: Rename `customerId` → `customer_id`

#### Step 1: Create V2 with new field name

**Backend V2 DTO**:
```java
@Data
public class OrderV2Dto {
    private String customer_id; // New snake_case
    private String customerName;
}
```

#### Step 2: Keep V1 working

**Backend V1 DTO** (unchanged):
```java
@Data
public class OrderV1Dto {
    private String customerId; // Old camelCase
    private String customerName;
}
```

#### Step 3: Frontend uses V2

```typescript
// Update config
API_CONFIG.SERVICES.ORDER = 'v2';

// Regenerate types
npm run sync-api-types

// Now TypeScript enforces new field name
const order: OrderV2 = {
  customer_id: "123", // Compiler error if using customerId
};
```

#### Step 4: Gradual rollout

- Week 1: Internal testing with V2
- Week 2: 10% of users on V2
- Week 3: 50% of users on V2
- Week 4: 100% of users on V2
- Month 6: Shutdown V1

---

## Tools & Automation

### Version Checker Script

```bash
#!/bin/bash
# scripts/check-api-versions.sh

echo "Checking API version usage..."

# Count V1 requests in last 24h
v1_count=$(grep "api/v1" /var/log/nginx/access.log | wc -l)

# Count V2 requests in last 24h
v2_count=$(grep "api/v2" /var/log/nginx/access.log | wc -l)

echo "V1: $v1_count requests"
echo "V2: $v2_count requests"

# Alert if V1 still getting significant traffic after sunset
if [ $v1_count -gt 1000 ]; then
  echo "⚠️  WARNING: V1 still receiving significant traffic!"
fi
```

---

## Best Practices

### DO ✅

- Version from day one
- Maintain at least one previous version
- Provide clear migration guides
- Give advance notice (3-6 months) before sunset
- Use semantic versioning for major breaking changes
- Document all changes in changelog

### DON'T ❌

- Break existing APIs without versioning
- Remove old versions without notice
- Mix breaking and non-breaking changes in same version
- Use too many active versions (max 2-3)
- Forget to update Swagger docs
- Skip migration testing

---

## Summary

**Versioning prevents**:
- Breaking production systems
- API mismatch issues
- Emergency hotfixes
- Customer complaints

**Cost**:
- Maintaining multiple versions temporarily
- Migration coordination

**Benefit**:
- Zero-downtime deployments
- Happy customers
- Safe refactoring
- Professional API management

**Next Steps**:
1. Implement V2 controllers for services with breaking changes
2. Update frontend to use versioned endpoints
3. Set up monitoring for version usage
4. Create migration timeline
5. Communicate with stakeholders
