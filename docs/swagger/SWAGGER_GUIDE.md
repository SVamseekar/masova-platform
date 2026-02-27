# Swagger/OpenAPI Documentation Guide

## Quick Start

Swagger UI is now configured for all microservices in the MaSoVa Restaurant Management System. This guide shows you how to use it to debug API mismatches and test endpoints.

---

## Access Swagger UI

### Local Development URLs

Once you start a service, access its Swagger UI at:

| Service | Port | Swagger UI URL |
|---------|------|----------------|
| **User Service** | 8081 | http://localhost:8081/swagger-ui.html |
| **Menu Service** | 8082 | http://localhost:8082/swagger-ui.html |
| **Order Service** | 8083 | http://localhost:8083/swagger-ui.html |
| **Payment Service** | 8084 | http://localhost:8084/swagger-ui.html |
| **Inventory Service** | 8085 | http://localhost:8085/swagger-ui.html |
| **Analytics Service** | 8086 | http://localhost:8086/swagger-ui.html |
| **Delivery Service** | 8090 | http://localhost:8090/swagger-ui.html |
| **Customer Service** | 8091 | http://localhost:8091/swagger-ui.html |
| **Notification Service** | 8092 | http://localhost:8092/swagger-ui.html |
| **Review Service** | 8093 | http://localhost:8093/swagger-ui.html |

### OpenAPI JSON Spec

Get the raw OpenAPI specification (useful for code generation):
- **URL Pattern**: `http://localhost:{PORT}/v3/api-docs`
- **Example**: `http://localhost:8083/v3/api-docs`

---

## How to Debug API Mismatches

### Scenario: Frontend Feature Breaks

**Example**: Delivery feature fails with error `Cannot read property 'addressLine1' of undefined`

#### Step 1: Identify the Failing API Call

1. Open **Browser DevTools** (F12)
2. Go to **Network** tab
3. Find the failed request (e.g., `POST /delivery/auto-dispatch`)
4. Note the **status code**, **request payload**, and **response**

#### Step 2: Open Swagger UI

```
http://localhost:8090/swagger-ui.html (for delivery-service)
```

#### Step 3: Find the Endpoint

1. Look for the endpoint in Swagger UI
2. Click to expand it (e.g., **POST /delivery/auto-dispatch**)
3. You'll see:
   - **Request Body Schema** (what backend expects)
   - **Response Schema** (what backend returns)
   - **Required fields**
   - **Field types**

#### Step 4: Compare with Frontend

**Swagger shows:**
```json
{
  "orderId": "string",
  "storeId": "string",
  "deliveryAddress": {
    "street": "string",        ← Backend expects "street"
    "city": "string",
    "zipCode": "string",        ← Backend expects "zipCode"
    "latitude": 0,
    "longitude": 0
  }
}
```

**Frontend sends** (from `deliveryApi.ts`):
```typescript
deliveryAddress?: {
  addressLine1: string,   ← Frontend sends "addressLine1"
  city: string,
  postalCode: string      ← Frontend sends "postalCode"
}
```

**Mismatch Found!** ✅

- Backend expects: `street`, `zipCode`
- Frontend sends: `addressLine1`, `postalCode`

#### Step 5: Fix the Mismatch

**Option A: Update Frontend** (Recommended)
```typescript
// frontend/src/store/api/deliveryApi.ts
deliveryAddress?: {
  street: string,        // Changed from addressLine1
  city: string,
  zipCode: string,       // Changed from postalCode
  latitude: number,
  longitude: number
}
```

**Option B: Update Backend DTO**
```java
// delivery-service/src/main/java/com/MaSoVa/delivery/dto/AddressDTO.java
private String addressLine1;  // Changed from street
private String postalCode;    // Changed from zipCode
```

---

## Testing Endpoints in Swagger UI

### Without Authentication

1. Navigate to Swagger UI
2. Find your endpoint
3. Click **"Try it out"**
4. Fill in the request body/parameters
5. Click **"Execute"**
6. See the response immediately

### With Authentication (JWT Token)

Most endpoints require JWT authentication. Here's how to test them:

#### Get a JWT Token First

1. Go to **User Service Swagger**: `http://localhost:8081/swagger-ui.html`
2. Find **POST /auth/login** endpoint
3. Click **"Try it out"**
4. Enter credentials:
```json
{
  "username": "admin@masova.com",
  "password": "your-password"
}
```
5. Click **"Execute"**
6. Copy the `accessToken` from the response

#### Use Token in Other Services

1. Click the **"Authorize"** button (lock icon) at the top of Swagger UI
2. Paste your token in the format: `Bearer {your-token}`
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Click **"Authorize"**
4. Now all "Try it out" requests will include the token

---

## Common API Mismatch Patterns

### 1. Field Name Mismatch

**Symptom**: `undefined` or `null` values in frontend

**How to Detect**:
- Check Swagger Request/Response schemas
- Compare field names with frontend types

**Example**:
- Backend: `customerId`
- Frontend: `customer_id`

**Fix**: Standardize on one naming convention (camelCase recommended for REST APIs)

---

### 2. Data Type Mismatch

**Symptom**: Type errors, validation failures

**How to Detect**:
- Swagger shows exact types: `integer`, `number`, `string`, etc.
- Compare with TypeScript types

**Example**:
- Backend expects: `total: number (double)`
- Frontend sends: `total: "29.99"` (string)

**Fix**: Ensure frontend sends correct type:
```typescript
total: 29.99  // number, not "29.99" string
```

---

### 3. Missing Required Fields

**Symptom**: 400 Bad Request errors

**How to Detect**:
- Swagger marks required fields with a red asterisk (*)
- Backend returns validation error: "field X is required"

**Example**:
- Backend requires: `storeId` (required)
- Frontend doesn't send it

**Fix**: Add the required field to frontend request:
```typescript
{
  orderId: "123",
  storeId: "store-1",  // Add this
  // ...
}
```

---

### 4. Wrong HTTP Method

**Symptom**: 405 Method Not Allowed

**How to Detect**:
- Swagger clearly shows: GET, POST, PUT, DELETE, PATCH
- Check frontend API call method

**Example**:
- Backend: `PATCH /orders/{id}/status`
- Frontend: `POST /orders/{id}/status`

**Fix**: Update frontend to use correct method:
```typescript
method: 'PATCH'  // Not POST
```

---

### 5. Enum Value Mismatch

**Symptom**: Validation errors, unexpected behavior

**How to Detect**:
- Swagger shows enum values under schema
- Backend rejects unknown enum values

**Example**:
- Backend enum: `PREPARING`, `READY`, `DELIVERED`
- Frontend sends: `preparing` (lowercase)

**Fix**: Match exact enum values (case-sensitive):
```typescript
status: 'PREPARING'  // Not 'preparing'
```

---

## Using Swagger for Development

### Before Writing Frontend Code

1. **Open Swagger** for the service you're integrating
2. **Browse endpoints** to see what's available
3. **Test the endpoint** using "Try it out"
4. **Copy the exact request/response format**
5. **Create TypeScript types** matching the schemas
6. **Write frontend API call** using the correct format

### When Adding a New Backend Endpoint

1. **Create the controller method** with proper annotations
2. **Restart the service**
3. **Open Swagger UI** - your endpoint should appear automatically
4. **Test it** in Swagger before touching frontend
5. **Share the Swagger URL** with frontend devs

---

## Pro Tips

### 1. Filter Endpoints

Swagger UI has a **search/filter box** at the top. Use it to quickly find endpoints:
- Type "order" to see all order-related endpoints
- Type "POST" to see only POST endpoints

### 2. Download OpenAPI Spec

Use the OpenAPI JSON spec to:
- **Auto-generate TypeScript types** (using `openapi-generator`)
- **Import into Postman** for testing
- **Generate client SDKs** for other languages

Download from: `http://localhost:{PORT}/v3/api-docs`

### 3. Compare Environments

Save OpenAPI specs from different environments:
- Development: `http://localhost:8083/v3/api-docs`
- Production: `https://api.masova.com/order-service/v3/api-docs`

Use a diff tool to find API changes between environments.

### 4. Use Schemas Section

Scroll to the **"Schemas"** section at the bottom of Swagger UI to see all DTOs/models with their exact structure.

---

## Auto-Generate TypeScript Types (Advanced)

### Install OpenAPI Generator

```bash
npm install -g @openapitools/openapi-generator-cli
```

### Generate Types from Swagger

```bash
# Generate TypeScript types for Order Service
openapi-generator-cli generate \
  -i http://localhost:8083/v3/api-docs \
  -g typescript-fetch \
  -o frontend/src/types/generated/order-service

# For all services (run this script)
./scripts/generate-types-from-swagger.sh
```

### Use Generated Types

```typescript
import { Order, CreateOrderRequest } from '@/types/generated/order-service';

const newOrder: CreateOrderRequest = {
  storeId: "store-1",
  customerName: "John Doe",
  items: [...],
  // TypeScript will enforce exact structure from backend!
};
```

---

## Troubleshooting

### Swagger UI Not Loading

**Problem**: `http://localhost:8083/swagger-ui.html` returns 404

**Solutions**:
1. Check service is running: `curl http://localhost:8083/actuator/health`
2. Verify dependency in pom.xml: `springdoc-openapi-starter-webmvc-ui`
3. Check logs for errors during startup
4. Try `/swagger-ui/index.html` (alternative path)

---

### Endpoints Not Showing

**Problem**: Swagger UI loads but no endpoints visible

**Solutions**:
1. Check controller classes have `@RestController` annotation
2. Verify methods have mapping annotations (`@GetMapping`, etc.)
3. Check if security is blocking Swagger - add to SecurityConfig:
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
        // ... other rules
    );
    return http.build();
}
```

---

### Authentication Issues in Swagger

**Problem**: All "Try it out" requests return 401 Unauthorized

**Solutions**:
1. Click **"Authorize"** button (top right)
2. Enter token as: `Bearer {your-actual-jwt-token}`
3. Make sure you copied the full token (they're long!)
4. Token might be expired - get a new one from `/auth/login`

---

## Next Steps

1. **Start all services** using `./start-all.sh`
2. **Open Swagger UI** for each service
3. **Explore the endpoints** to familiarize yourself
4. **Test an endpoint** using "Try it out"
5. **Compare with frontend code** to find mismatches
6. **Fix the mismatches** systematically

---

## Support

For issues or questions:
- Check the [Spring Boot Documentation](https://springdoc.org/)
- Review the [OpenAPI Specification](https://swagger.io/specification/)
- See examples in this project's controller classes

---

**Happy Debugging!** 🚀
