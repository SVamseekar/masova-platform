# MongoDB Workshop Quick Reference - MaSoVa Project

## 🚀 Your Elevator Pitch (30 seconds)

> "I built **MaSoVa**, a full-stack restaurant management system with **10 MongoDB databases** handling orders, payments, inventory, and delivery tracking. We process **10,000+ documents** with embedded schemas, compound indexes, and aggregation pipelines for real-time analytics. I'm here to validate our design and prepare for certification!"

---

## 💪 Your MongoDB Experience

| Concept | What You Did | Example |
|---------|-------------|---------|
| **Databases** | 10 separate DBs for microservices | `masova_orders`, `masova_payments`, etc. |
| **Embedded Docs** | Order items, delivery address | `items: [...]`, `deliveryAddress: {...}` |
| **References** | Cross-collection links | `customerId`, `paymentId`, `deliveryId` |
| **Denormalization** | Customer name in orders | `customerName: "John"` (faster reads) |
| **Indexes** | 6 on orders collection | `(customerId, createdAt)`, `(storeId, status)` |
| **Queries** | Complex multi-field finds | `find({ storeId, status, createdAt: $gte })` |
| **Aggregations** | Sales analytics, top items | `$group`, `$unwind`, `$sort` |
| **Driver** | Spring Data MongoDB | `@Repository`, connection pooling |

---

## 🎯 Smart Questions by Session

### **10:05 AM - Modeling**
1. "I embedded order items vs separate collection. When is this wrong?"
2. "How to handle denormalized data updates across documents?"
3. "Single orders collection or partition by date? Best practice?"

### **10:45 AM - CRUD**
1. "Update order status frequently - store history as array or separate docs?"
2. "Querying array field (storeIds) - optimize $in or restructure?"
3. "Soft deletes: {isDeleted: true} vs deleted_orders collection?"

### **11:40 AM - Aggregations**
1. "Daily analytics: real-time aggregation or materialized views?"
2. "$unwind on 10,000+ orders - will it be slow?"
3. "Join orders+customers: $lookup or denormalize?"

### **01:10 PM - Indexes**
1. "Compound index (storeId, status) - does query on just storeId use it?"
2. "6 indexes on orders - when do indexes hurt inserts?"
3. "Date range queries - index direction matter?"

### **02:00 PM - Drivers**
1. "Spring Data @Query vs method names - when to use which?"
2. "Connection pool min=10, max=100 for 50 concurrent orders - sized right?"
3. "Payment transactions across collections - MongoDB support?"

---

## 📊 Your Project Stats (Impress Them!)

- **10 MongoDB databases** (microservices)
- **10,000+ documents** (orders, menus, customers)
- **6 compound indexes** (orders collection)
- **Embedded documents** (items array, address object)
- **Denormalization** (customer data in orders)
- **Reference pattern** (foreign key links)
- **Spring Data MongoDB** (Java driver)
- **Connection pooling** (10-100 connections)

---

## 🔥 Power Phrases (Use These!)

✅ "In my production system..."
✅ "We denormalized X for performance..."
✅ "Our compound index on..."
✅ "For high-volume scenarios..."
✅ "We're using embedded docs because..."
✅ "Our aggregation pipeline calculates..."
✅ "Connection pool is configured at..."

❌ Avoid beginner phrases:
- "What is MongoDB?"
- "How do I insert?"
- "What's an index?"

---

## 📋 Quick Schema Examples (Your Code!)

### **Order with Embedded Items**
```javascript
{
  orderId: "ORD-20260130-1234",
  customerId: "cust_456",        // Reference
  customerName: "John Doe",      // Denormalized!
  items: [{                      // Embedded array
    itemId: "item_123",
    name: "Margherita Pizza",
    quantity: 2,
    customizations: [{           // Nested embedding
      name: "Size",
      option: "Large"
    }]
  }],
  deliveryAddress: {             // Embedded object
    street: "123 Main St",
    city: "Mumbai"
  }
}
```

### **Your Indexes**
```javascript
db.orders.createIndex({ "orderId": 1 }, { unique: true })
db.orders.createIndex({ "customerId": 1, "createdAt": -1 })
db.orders.createIndex({ "storeId": 1, "status": 1 })
db.orders.createIndex({ "status": 1, "createdAt": -1 })
```

### **Aggregation Example**
```javascript
// Top selling items
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: {
      _id: "$items.itemId",
      totalSold: { $sum: "$items.quantity" }
  }},
  { $sort: { totalSold: -1 } },
  { $limit: 10 }
])
```

---

## 🎓 Certification Topics (From Your Project)

✅ **Schema Design** - embed vs reference, denormalization
✅ **CRUD** - insert, find, update, delete, array operations
✅ **Indexes** - single, compound, unique, query optimization
✅ **Aggregation** - $match, $group, $project, $sort, $unwind, $lookup
✅ **Drivers** - Spring Data MongoDB, connection pooling
✅ **Transactions** - multi-document ACID (if you use)

---

## 💼 Networking Script

**Opening:**
> "Hi! I'm working on a restaurant management platform with 10 MongoDB databases. What brings you here?"

**If they ask about your project:**
> "MaSoVa handles orders, payments, delivery, and analytics. We're processing thousands of orders with embedded schemas and compound indexes. I'm here to learn best practices and get certified!"

**Questions for speakers:**
> "In your experience, what's the biggest schema design mistake developers make?"
> "For high-write collections, what index strategy do you recommend?"

---

## ✅ Bring Tomorrow

- [ ] Laptop with code ready
- [ ] `docs/MONGODB_SCHEMAS.md` open
- [ ] This cheat sheet printed
- [ ] Questions list
- [ ] Notebook for notes
- [ ] LinkedIn QR / business card

---

## 🎯 Your Goal Tomorrow

1. ✅ Earn MongoDB Skill Badges
2. ✅ Validate your MaSoVa design
3. ✅ Ask smart questions
4. ✅ Network with experts
5. ✅ Prepare for certification
6. ✅ Learn what to improve

---

## 🚀 Confidence Boosters

You already know:
- ✅ 10 production databases
- ✅ Complex embedded schemas
- ✅ Multiple index strategies
- ✅ Aggregation pipelines
- ✅ Driver configuration
- ✅ Microservices patterns

**You're not a beginner - you're an experienced developer validating your knowledge!**

---

**Print this. Bring it. Dominate.** 💪

**Good luck tomorrow!** 🎉
