# MaSoVa Restaurant Management System - Project Context

## Project Overview
Building a comprehensive restaurant management platform replicating sophisticated MaSoVa operations system, combining firsthand management experience with modern technical architecture.

## Technical Stack
- Backend: Java (latest LTS), Spring Boot (latest), Spring Security (latest), Spring Data MongoDB (latest)
- Database: MongoDB (latest) with proper indexing and aggregation pipelines
- Architecture: Microservices with API Gateway
- Real-time: WebSocket for live updates, Server-Sent Events (SSE)
- Messaging: Spring Boot Event Publishing for inter-service communication
- Caching: Redis (latest) for frequently accessed data
- API Documentation: OpenAPI (latest) with Swagger
- Testing: JUnit (latest), Testcontainers (latest) for integration tests
- Build: Maven (latest)
- Deployment: Docker containers, Docker Compose
- IDE: VSCode with Java Extension Pack
- Payment Gateway: Razorpay API integration for Indian market
- Maps API: Google Maps API (free tier) or OpenStreetMap for route optimization

## Domain Knowledge Context
The user worked as a manager at MaSoVa and has deep operational knowledge:
- Order lifecycle: RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → DELIVERED
- Predictive make-table notifications (pizza prep starts before payment completion)
- POS system analytics (today vs last year same day sales comparison, weekly sales summary)
- Driver GPS tracking and live monitoring with manual delivery confirmation
- Real-time inventory management with waste analysis
- Kitchen workflow optimization (6-7 minute oven timing)
- Staff login system to track working hours, timings, dates, and durations
- Access control: Only managers and assistant managers can take orders in-store
- All currency values in Indian Rupees (INR)
- Payment integration with Razorpay for Indian market
- Customer review system for app and website feedback

## Core System Modules

### 1. Order Management System
- Multi-channel ordering (in-store POS, online web, mobile app)
- Real-time order status tracking with 6 stages
- Predictive make-table notifications
- Collection vs delivery workflow differentiation
- Customer order history and favorites
- Payment integration with Razorpay for INR transactions

### 2. Point of Sale (POS) System
- Today's sales vs last year same day percentage comparison (in INR)
- Yesterday's sales summary (in INR)
- Weekly sales summary with trends and patterns (in INR)
- Individual staff performance tracking (average order value per employee in INR)
- Driver status monitoring (on-road vs in-store)
- Real-time order queue management: Live display of all pending orders with preparation status, estimated completion times, and priority-based queue sorting to optimize kitchen workflow
- Access control: Only managers and assistant managers can take orders
- Staff login integration to track working hours

### 3. Kitchen Operations
- Make-table workflow management
- Oven queue optimization (6-7 minute bake time tracking)
- Recipe management and portion control
- Quality control checkpoints
- Equipment maintenance scheduling
- Integration with order queue for seamless workflow

### 4. Driver & Delivery Management
- GPS-enabled driver tracking with live map
- Auto dispatch assignment: Intelligent assignment of orders to available drivers based on factors like driver location, delivery address proximity, current workload, and estimated delivery times to optimize efficiency
- Manual delivery confirmation by driver (future: automatic confirmation when driver reaches customer location)
- Delivery time estimation using Google Maps API or free alternative
- Mobile driver app simulation
- Customer notification with driver location
- Driver login tracking for working hours and performance metrics

### 5. Inventory Management & Forecasting
- Predictive demand forecasting using historical data
- Automatic reorder point calculations
- Safety stock optimization to minimize waste
- Raw material to finished product variance tracking
- Expiry date management for perishables
- Supplier integration and purchase order automation
- Cost tracking in INR with supplier pricing

### 6. Analytics & Reporting
- Sales performance dashboards (all amounts in INR)
- Operational efficiency metrics
- Customer satisfaction tracking through review system
- Predictive analytics for business insights
- Waste analysis with cost implications in INR
- Staff performance and working hours analysis

## Database Schema (MongoDB Collections)

### Users Collection
```javascript
{
  _id: ObjectId,
  type: "CUSTOMER|STAFF|DRIVER|MANAGER|ASSISTANT_MANAGER",
  personalInfo: { name, email, phone, address },
  preferences: { favoriteOrders, paymentMethods },
  employeeDetails: { 
    storeId, 
    role, 
    permissions, 
    schedule,
    workingSessions: [{
      loginTime: Date,
      logoutTime: Date,
      totalHours: Number,
      date: Date
    }]
  },
  createdAt: Date,
  lastLogin: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String,
  customerId: ObjectId,
  storeId: ObjectId,
  orderType: "DELIVERY|COLLECTION",
  items: [{
    type: "PIZZA|SIDE|DRINK|DIP",
    details: { size, toppings, quantity, priceINR }
  }],
  statusHistory: [{
    status: "RECEIVED|PREPARING|OVEN|BAKED|DISPATCHED|DELIVERED",
    timestamp: Date,
    employeeId: ObjectId
  }],
  payment: { 
    method: "RAZORPAY|CASH|CARD", 
    amountINR: Number, 
    status: "PENDING|COMPLETED|FAILED", 
    razorpayTransactionId: String 
  },
  delivery: {
    address: Object,
    driverId: ObjectId,
    estimatedTime: Date,
    actualTime: Date,
    gpsTracking: [{ lat, lng, timestamp }],
    deliveryConfirmedBy: "DRIVER|CUSTOMER",
    deliveryConfirmationTime: Date
  },
  timings: {
    orderReceived: Date,
    prepStarted: Date,
    ovenIn: Date,
    ovenOut: Date,
    dispatched: Date,
    delivered: Date
  },
  customerReview: {
    rating: Number, // 1-5 stars
    comment: String,
    reviewDate: Date,
    reviewSource: "APP|WEBSITE"
  }
}
```

### Inventory Collection
```javascript
{
  _id: ObjectId,
  storeId: ObjectId,
  item: {
    name: String,
    category: "DOUGH|CHEESE|TOPPINGS|PACKAGING",
    sku: String,
    unit: "KG|PIECES|LITERS"
  },
  stock: {
    current: Number,
    reserved: Number,
    available: Number,
    reorderPoint: Number,
    maxStock: Number
  },
  cost: { unitCostINR: Number, totalValueINR: Number },
  supplier: { id, name, leadTimeDays: Number },
  expiryTracking: [{
    batchId: String,
    quantity: Number,
    receivedDate: Date,
    expiryDate: Date
  }],
  lastUpdated: Date
}
```

## Microservices Architecture

### Service Breakdown
1. **API Gateway Service** - Request routing, authentication, rate limiting
2. **User Service** - Customer, staff, driver management, authentication, login tracking
3. **Order Service** - Order lifecycle management, status tracking
4. **Menu Service** - Product catalog, pricing in INR, promotions
5. **Payment Service** - Razorpay integration, transaction management in INR
6. **Inventory Service** - Stock management, automatic reordering, cost tracking in INR
7. **Forecasting Service** - Demand prediction, safety stock calculations
8. **Location Service** - GPS tracking, Google Maps API integration
9. **Notification Service** - Real-time updates, alerts
10. **Analytics Service** - Sales reporting in INR, performance metrics
11. **Kitchen Service** - Make-table workflow, oven queue management
12. **Review Service** - Customer feedback management for app and website

## Key Technical Requirements

### Real-time Capabilities
- WebSocket connections for live order tracking
- Server-Sent Events for dashboard updates
- Real-time GPS tracking with coordinate streaming
- Live inventory level monitoring

### Performance Optimization
- Redis caching for frequently accessed data
- Database indexing strategy for fast queries
- Connection pooling for database access
- Async processing for non-critical operations

### Integration Points
- Razorpay API for payment processing in INR
- Google Maps API (free tier) for GPS and delivery tracking
- SMS/Email service providers for notifications
- Optional supplier APIs for automatic purchase order sending
- Customer review aggregation platforms

## Development Best Practices
- Follow Spring Boot best practices and latest conventions
- Use proper exception handling and validation
- Implement comprehensive logging with SLF4J
- Write unit and integration tests
- Use Docker for containerization
- Follow REST API design principles
- Implement proper security with Spring Security
- Use configuration properties for environment-specific settings

## Coding Style Requirements (LeetCode Style)
- **Clean and concise code** - No unnecessary verbosity, every line serves a purpose
- **Optimal algorithms** - Use best time and space complexity for business logic
- **Efficient data structures** - HashMap, TreeSet, PriorityQueue where optimal
- **Clear but short variable names** - `left`, `right`, `result` instead of verbose names
- **Minimal boilerplate** - Focus on core business logic, not ceremony
- **Smart comments** - Explain "why" for complex business rules, not "what"
- **Edge case handling** - Robust but not over-engineered
- **Method length** - Keep methods under 20 lines when possible
- **Single responsibility** - Each method does one thing well

## Production Grade System Design Requirements
- **Scalability** - Architecture can handle growth from 100 to 100,000+ orders
- **Database optimization** - Proper indexing, query optimization, connection pooling
- **Caching strategies** - Redis for hot data, reduce database load by 80%+
- **Performance** - Async processing, batch operations, proper pagination
- **Error handling** - Graceful failures, circuit breakers, proper logging
- **Security** - JWT tokens, role-based access, input validation, SQL injection prevention
- **Monitoring** - Health checks, metrics, observability for production deployment
- **Maintainability** - SOLID principles, clear separation of concerns
- **Resource efficiency** - Optimal memory usage, connection pooling, query batching

## Design Decision Documentation
Always explain and document the reasoning behind technical choices:
- Why MongoDB over PostgreSQL for this use case
- Why microservices architecture over monolith
- Why Redis for caching strategy
- Algorithm choices for order dispatch and kitchen optimization
- Performance trade-offs and their business impact
- Scalability bottlenecks and mitigation strategies
- Database schema design decisions and indexing strategy
- API design patterns and why they were chosen

## Project Goals
- Demonstrate enterprise-level architecture and design patterns
- Show real-world business problem solving with technology
- Implement complex workflows and business logic specific to Indian restaurant operations
- Build scalable, maintainable, and testable code
- Create impressive resume portfolio project with Indian market considerations
- Integrate payment systems suitable for Indian market (Razorpay)
- Implement staff management with working hours tracking
- Build comprehensive review system for customer feedback
- Handle all financial transactions in Indian Rupees (INR)

When helping with this project:
- Always use latest versions of Java, Spring Boot, and related frameworks
- Follow modern Spring Boot patterns and conventions
- Provide complete, working code examples
- Explain business logic alongside technical implementation
- Focus on practical, production-ready solutions
- Help create step-by-step implementation guides
- CRITICAL: Never use any symbols or emojis in code or documentation (no ❌, ✅, 🚀, ⚠️, 📝, etc.)
- Always handle currency values in INR with proper formatting
- Implement proper access controls (manager/assistant manager for order taking)
- Include staff login tracking for working hours management
- Consider Indian market payment preferences and methods