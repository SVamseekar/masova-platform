# MaSoVa Restaurant Management System - Documentation Guide

## 📚 Documentation Overview

This guide provides access to all documentation for the MaSoVa Restaurant Management System, including backend APIs, frontend components, and database schemas.

---

## 🚀 Quick Start

### Generate All Documentation

```bash
# Generate Smart-doc API documentation
mvn clean compile smart-doc:html

# Generate OpenAPI/Swagger documentation (automatically available when services run)
./start-all.sh

# Generate TypeDoc for frontend (see Frontend section below)
cd frontend && npm run docs
```

---

## 🔧 Backend Documentation

### 1. Smart-doc API Documentation

**What it includes:**
- All REST API endpoints
- Request/Response models
- Authentication requirements
- Example requests and responses
- Data dictionaries for enums

**How to generate:**

```bash
# Generate HTML documentation
mvn smart-doc:html

# Generate Markdown documentation
mvn smart-doc:markdown

# Generate OpenAPI 3.0 spec
mvn smart-doc:openapi

# Generate Postman Collection
mvn smart-doc:postman
```

**Output location:** `target/smart-doc/`

**View documentation:**
```bash
# Open HTML docs
open target/smart-doc/index.html
```

---

### 2. Swagger UI (OpenAPI) - Interactive API Testing

**What it includes:**
- Interactive API explorer
- Try-it-out functionality for testing
- Schema definitions
- Authentication support

**Access URLs (when services are running):**

| Service | Swagger UI | OpenAPI JSON |
|---------|-----------|--------------|
| API Gateway | http://localhost:8080/swagger-ui.html | http://localhost:8080/v3/api-docs |
| User Service | http://localhost:8081/swagger-ui.html | http://localhost:8081/v3/api-docs |
| Menu Service | http://localhost:8082/swagger-ui.html | http://localhost:8082/v3/api-docs |
| Order Service | http://localhost:8083/swagger-ui.html | http://localhost:8083/v3/api-docs |
| Payment Service | http://localhost:8084/swagger-ui.html | http://localhost:8084/v3/api-docs |
| Analytics Service | http://localhost:8085/swagger-ui.html | http://localhost:8085/v3/api-docs |
| Inventory Service | http://localhost:8086/swagger-ui.html | http://localhost:8086/v3/api-docs |
| Customer Service | http://localhost:8091/swagger-ui.html | http://localhost:8091/v3/api-docs |
| Delivery Service | http://localhost:8090/swagger-ui.html | http://localhost:8090/v3/api-docs |
| Notification Service | http://localhost:8092/swagger-ui.html | http://localhost:8092/v3/api-docs |
| Review Service | http://localhost:8093/swagger-ui.html | http://localhost:8093/v3/api-docs |

**Testing APIs with Swagger:**
1. Start services: `./start-all.sh`
2. Open Swagger UI URL
3. Click "Authorize" button
4. Enter JWT token: `Bearer <your-token>`
5. Try out any endpoint

---

### 3. Microservices Architecture

**Services Overview:**

1. **API Gateway** (Port 8080)
   - Entry point for all client requests
   - Request routing and load balancing
   - JWT validation

2. **User Service** (Port 8081)
   - User authentication and authorization
   - Role management (ADMIN, MANAGER, STAFF, CUSTOMER)
   - Working session management
   - JWT token generation

3. **Menu Service** (Port 8082)
   - Menu item management
   - Categories and modifiers
   - Recipe management
   - Multi-store menu support

4. **Order Service** (Port 8083)
   - Order creation and management
   - Kitchen display system (KDS)
   - Order status tracking
   - Tax calculation
   - Preparation time estimation

5. **Payment Service** (Port 8084)
   - Payment processing
   - Multiple payment methods
   - Refund management
   - Transaction history

6. **Analytics Service** (Port 8085)
   - Sales analytics
   - Revenue reports
   - Product performance
   - Staff analytics

7. **Inventory Service** (Port 8086)
   - Stock management
   - Purchase orders
   - Supplier management
   - Waste tracking

8. **Customer Service** (Port 8091)
   - Customer profiles
   - Loyalty programs
   - Promotions and campaigns

9. **Delivery Service** (Port 8090)
   - Delivery management
   - Driver assignment
   - Route tracking
   - Delivery status updates

10. **Notification Service** (Port 8092)
    - Email notifications (Brevo integration)
    - Order confirmations
    - Payment receipts
    - Delivery updates

11. **Review Service** (Port 8093)
    - Customer reviews and ratings
    - Review moderation
    - Response management

---

## 🎨 Frontend Documentation

### TypeDoc - React/TypeScript Documentation

**What it includes:**
- Component documentation
- Props interfaces
- Redux state management
- API client functions
- Utility functions
- Type definitions

**How to generate:**

```bash
cd frontend

# Install TypeDoc (if not already installed)
npm install --save-dev typedoc

# Generate documentation
npm run docs

# Output will be in frontend/docs/
```

**Add to package.json (if not present):**

```json
{
  "scripts": {
    "docs": "typedoc --out docs --entryPointStrategy expand ./src"
  }
}
```

**View documentation:**
```bash
open frontend/docs/index.html
```

---

## 🗄️ Database Documentation

### MongoDB Schema Documentation

**Database Structure:**

#### Collections by Service:

**masova_db (User Service):**
- `users` - User accounts and authentication
- `roles` - Role definitions and permissions
- `stores` - Store information and settings
- `working_sessions` - Staff clock-in/out records

**masova_menu (Menu Service):**
- `menu_items` - Menu items with pricing and availability
- `categories` - Menu categories
- `modifiers` - Item modifiers (size, extras, etc.)
- `recipes` - Recipe definitions and ingredients

**masova_orders (Order Service):**
- `orders` - Order records with items and status
- `order_items` - Individual order line items
- `delivery_addresses` - Customer delivery addresses

**masova_payments (Payment Service):**
- `payments` - Payment transactions
- `refunds` - Refund records

**masova_inventory (Inventory Service):**
- `inventory` - Stock levels and items
- `purchase_orders` - PO records
- `suppliers` - Supplier information

**masova_customers (Customer Service):**
- `customers` - Customer profiles
- `loyalty_points` - Loyalty program data
- `promotions` - Active promotions and campaigns

**masova_delivery (Delivery Service):**
- `deliveries` - Delivery records
- `drivers` - Driver information and availability
- `delivery_tracking` - Real-time tracking data

**masova_notifications (Notification Service):**
- `notification_logs` - Sent notification history

**masova_reviews (Review Service):**
- `reviews` - Customer reviews and ratings
- `review_responses` - Business responses to reviews

---

## 🔐 Authentication & Security

### JWT Token Structure

**Access Token (expires in 1 hour):**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "MANAGER",
  "storeId": "store_id",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**How to get a token:**

1. **Login via User Service:**
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masova.com",
    "password": "your_password"
  }'
```

2. **Use token in API calls:**
```bash
curl -X GET http://localhost:8082/api/menu/items \
  -H "Authorization: Bearer <your_token>"
```

---

## 📊 API Documentation Formats

Smart-doc generates documentation in multiple formats:

### 1. HTML (Interactive Web Documentation)
- **Command:** `mvn smart-doc:html`
- **Output:** `target/smart-doc/index.html`
- **Best for:** Browsing and exploring APIs

### 2. Markdown (GitHub-friendly)
- **Command:** `mvn smart-doc:markdown`
- **Output:** `target/smart-doc/README.md`
- **Best for:** Version control and GitHub wikis

### 3. OpenAPI 3.0 Spec (Industry Standard)
- **Command:** `mvn smart-doc:openapi`
- **Output:** `target/smart-doc/openapi.json`
- **Best for:** Import into API tools, code generation

### 4. Postman Collection (API Testing)
- **Command:** `mvn smart-doc:postman`
- **Output:** `target/smart-doc/postman.json`
- **Best for:** Import into Postman for testing

---

## 🛠️ Maintenance

### Updating Documentation

Documentation auto-updates when you:
- **Smart-doc:** Run `mvn compile` or `mvn smart-doc:html`
- **Swagger UI:** Start the service (docs refresh automatically)
- **TypeDoc:** Run `npm run docs` in frontend

### Best Practices

1. **Write Javadoc comments** for all public methods:
```java
/**
 * Creates a new order for a customer.
 *
 * @param orderRequest The order details including items and delivery info
 * @return The created order with assigned ID and status
 * @throws OrderValidationException if order data is invalid
 */
@PostMapping("/orders")
public OrderResponse createOrder(@RequestBody OrderRequest orderRequest) {
    // implementation
}
```

2. **Use @Schema annotations** for better OpenAPI docs:
```java
public class OrderRequest {
    @Schema(description = "Customer ID", example = "cust_123")
    private String customerId;

    @Schema(description = "Store ID", example = "store_456")
    private String storeId;
}
```

3. **Document TypeScript types** with JSDoc:
```typescript
/**
 * Represents a menu item in the system
 */
interface MenuItem {
  /** Unique identifier */
  id: string;
  /** Display name of the item */
  name: string;
  /** Price in INR */
  price: number;
}
```

---

## 📖 Additional Resources

### Configuration Files

- **Smart-doc config:** `smart-doc.json` (root directory)
- **OpenAPI configs:** `*/src/main/java/com/MaSoVa/*/config/OpenApiConfig.java`
- **TypeDoc config:** Add to `frontend/package.json`

### Useful Commands

```bash
# Generate all documentation formats at once
mvn clean compile smart-doc:html smart-doc:markdown smart-doc:openapi smart-doc:postman

# Start all services with Swagger UI
./start-all.sh

# Check service health
curl http://localhost:8081/actuator/health

# View logs
tail -f user-service/logs/user-service.log
```

---

## 🤝 Contributing to Documentation

When adding new features:

1. ✅ Add Javadoc comments to all public methods
2. ✅ Update OpenAPI annotations if needed
3. ✅ Regenerate Smart-doc: `mvn smart-doc:html`
4. ✅ Test Swagger UI to ensure endpoints appear
5. ✅ Update this guide if adding new services or major features

---

## 📞 Support

For questions or issues with documentation:
- **Email:** dev@masova.com
- **GitHub Issues:** [Report documentation issues](https://github.com/masova/restaurant-management/issues)

---

**Last Updated:** 2026-01-30
**Version:** 2.1.0
