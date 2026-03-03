# Phase 0 — Production Blockers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 4 production blockers that cause silent failures and data corruption before any other work.

**Architecture:** The inner `Order.OrderStatus` enum in `Order.java` already matches `shared-models/OrderStatus.java` — the enum values are in sync. The real issue is the import: `OrderService` imports `Order.OrderStatus` (inner class) instead of `com.MaSoVa.shared.enums.OrderStatus`. `OrderEventPublisher` is already wired in `OrderService` (line 48, calls in lines 206-211). The masova-support agent uses `InMemorySessionService` which loses conversation history on restart. MongoDB `Customer.email` field has only `@Indexed` (non-unique), so P0 index bug is actually compound indexes missing `unique=true` constraint.

**Tech Stack:** Spring Boot 3, MongoDB, Python 3.11, Google ADK 1.25, redis-py 5.2.1, JavaScript (migration scripts)

---

## Task 0.1: Verify OrderStatus Enum Alignment

**Files:**
- Read: `shared-models/src/main/java/com/MaSoVa/shared/enums/OrderStatus.java`
- Read: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java` (line 324)
- Read: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java` (line 6)

**Step 1: Check the actual import in OrderService**

Open `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`.

Look at line 6 — the import:
```java
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
```

This imports the inner enum from `Order.java`. The `shared-models` enum is at `com.MaSoVa.shared.enums.OrderStatus`.

**Step 2: Compare both enums side by side**

`Order.java` inner enum (line 324):
```
RECEIVED, PREPARING, OVEN, BAKED, READY, DISPATCHED, DELIVERED, SERVED, COMPLETED, CANCELLED
```

`shared-models/OrderStatus.java`:
```
RECEIVED, PREPARING, OVEN, BAKED, READY, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, SERVED, COMPLETED, CANCELLED
```

The inner enum is **missing `OUT_FOR_DELIVERY`** — this is the inter-service deserialization bug.

**Step 3: Add OUT_FOR_DELIVERY to Order.java inner enum**

In `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java`, find the inner `OrderStatus` enum at line 324 and add the missing value:

```java
public enum OrderStatus {
    RECEIVED,          // Initial state for all orders
    PREPARING,         // Kitchen started work
    OVEN,              // In oven (for items that need baking)
    BAKED,             // Finished baking
    READY,             // Ready for pickup/serving/dispatch
    DISPATCHED,        // Awaiting driver pickup
    OUT_FOR_DELIVERY,  // Driver assigned and en route  ← ADD THIS
    DELIVERED,         // Delivered to customer (DELIVERY final state)
    SERVED,            // Served to table (DINE_IN final state)
    COMPLETED,         // Picked up by customer (TAKEAWAY final state)
    CANCELLED          // Cancelled order
}
```

**Step 4: Check kitchen queue list in OrderService**

In `OrderService.java` method `getKitchenQueue()` (around line 244), the status list is:
```java
List<OrderStatus> kitchenStatuses = List.of(
    OrderStatus.RECEIVED,
    OrderStatus.PREPARING,
    OrderStatus.OVEN,
    OrderStatus.BAKED,
    OrderStatus.DISPATCHED
);
```

Add `OUT_FOR_DELIVERY` after `DISPATCHED` so in-transit orders stay visible on KDS:
```java
List<OrderStatus> kitchenStatuses = List.of(
    OrderStatus.RECEIVED,
    OrderStatus.PREPARING,
    OrderStatus.OVEN,
    OrderStatus.BAKED,
    OrderStatus.DISPATCHED,
    OrderStatus.OUT_FOR_DELIVERY
);
```

**Step 5: Check AnalyticsEventListener and OrderEventListener for the enum**

Check these files import `Order.OrderStatus` (inner) not `shared-models`:
- `intelligence-service/src/main/java/com/MaSoVa/intelligence/messaging/AnalyticsEventListener.java`
- `core-service/src/main/java/com/MaSoVa/core/notification/service/OrderEventListener.java`

If they reference `OUT_FOR_DELIVERY` from their own enum or `shared-models`, they already have it. If they import `Order.OrderStatus` from commerce-service, they don't — but those services shouldn't import from another service's entity class. Confirm imports and ensure both consume `OrderStatusChangedEvent.newStatus` as a String (not enum) to avoid cross-service enum binding issues.

**Step 6: Build commerce-service to verify no compile errors**

On Dell (PowerShell):
```powershell
cd C:\path\to\MaSoVa-restaurant-management-system\commerce-service
mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

**Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git commit -m "fix(commerce): add OUT_FOR_DELIVERY to Order inner enum, add to KDS queue statuses"
```

---

## Task 0.2: Verify OrderEventPublisher Is Fully Wired

**Files:**
- Read: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`

**Step 1: Confirm createOrder() publishes event**

Check `createOrder()` method (lines 200-211). The event publish call already exists:
```java
orderEventPublisher.publishOrderCreated(new OrderCreatedEvent(
    savedOrder.getId(), savedOrder.getCustomerId(), savedOrder.getStoreId(),
    savedOrder.getOrderType().toString(), savedOrder.getTotal(), "INR"));
```
This is wrapped in try/catch — correct. ✅

**Step 2: Check updateOrderStatus() for status-changed event**

Search for `updateOrderStatus` in `OrderService.java`. Read the full method body. Look for a call to `orderEventPublisher.publishOrderStatusChanged(...)`.

If the call exists → ✅ already wired, move to Step 4.

If the call is **missing**, add it after the order is saved and before the WebSocket broadcast:
```java
// Publish status changed event to RabbitMQ
try {
    orderEventPublisher.publishOrderStatusChanged(new OrderStatusChangedEvent(
        savedOrder.getId(), savedOrder.getOrderNumber(),
        previousStatus.toString(), savedOrder.getStatus().toString(),
        savedOrder.getStoreId(), savedOrder.getCustomerId()));
} catch (Exception e) {
    log.warn("Failed to publish order status changed event for {}: {}", savedOrder.getOrderNumber(), e.getMessage());
}
```

**Step 3: Check moveToNextStage() for status-changed event**

Search for `moveToNextStage` in `OrderService.java`. Same check — look for publishOrderStatusChanged call.

If missing, add the same pattern as Step 2 after save.

**Step 4: Check OrderCreatedEvent and OrderStatusChangedEvent constructors**

Check `shared-models` for these event classes:
```bash
find shared-models -name "OrderCreatedEvent.java" -o -name "OrderStatusChangedEvent.java"
```

If the constructors don't match the call signatures in Step 1/2, fix the call to match what the constructor expects.

**Step 5: Build and start commerce-service, verify RabbitMQ event on test order**

On Dell — start services, create a test order via cURL, check RabbitMQ management UI (http://192.168.50.88:15672) for message in `orders.exchange`.

```bash
curl -X POST http://192.168.50.88:8084/api/orders \
  -H "Authorization: Bearer <customer_token>" \
  -H "Content-Type: application/json" \
  -d '{"storeId":"<store_id>","orderType":"TAKEAWAY","customerName":"Test","items":[{"menuItemId":"<id>","name":"Test","quantity":1,"price":99}]}'
```

Expected: message appears in RabbitMQ `masova.orders.exchange`.

**Step 6: Commit (only if changes were needed)**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git commit -m "fix(commerce): wire publishOrderStatusChanged in updateOrderStatus and moveToNextStage"
```

---

## Task 0.3: Replace InMemorySessionService with Redis in masova-support

**Files:**
- Modify: `masova-support/src/masova_agent/core/agent.py`
- Create: `masova-support/src/masova_agent/core/redis_session_service.py`
- Modify: `masova-support/.env` (add REDIS_URL)

Redis is already in `requirements.txt` (`redis==5.2.1`). No pip install needed.

**Step 1: Write failing test for Redis session service**

Create `masova-support/tests/test_redis_session.py`:

```python
"""Tests for Redis session service"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json


@pytest.mark.asyncio
async def test_create_session_stores_in_redis():
    """Session creation should store session data in Redis"""
    mock_redis = MagicMock()
    mock_redis.setex = MagicMock(return_value=True)
    mock_redis.get = MagicMock(return_value=None)

    with patch("masova_agent.core.redis_session_service.redis.Redis", return_value=mock_redis):
        from masova_agent.core.redis_session_service import RedisSessionService
        service = RedisSessionService(redis_url="redis://localhost:6379/1")
        session = await service.create_session(app_name="test_app", user_id="user_123")

    assert session.id is not None
    assert mock_redis.setex.called


@pytest.mark.asyncio
async def test_session_ttl_is_one_hour():
    """Session TTL should be 3600 seconds (1 hour)"""
    mock_redis = MagicMock()
    mock_redis.setex = MagicMock(return_value=True)

    with patch("masova_agent.core.redis_session_service.redis.Redis", return_value=mock_redis):
        from masova_agent.core.redis_session_service import RedisSessionService
        service = RedisSessionService(redis_url="redis://localhost:6379/1")
        await service.create_session(app_name="test_app", user_id="user_123")

    call_args = mock_redis.setex.call_args
    ttl = call_args[0][1]  # Second positional arg is TTL
    assert ttl == 3600


@pytest.mark.asyncio
async def test_fallback_to_in_memory_when_redis_unavailable():
    """Should fall back to InMemorySessionService if Redis is down"""
    with patch("masova_agent.core.redis_session_service.redis.Redis") as mock_redis_cls:
        mock_redis_cls.side_effect = Exception("Redis connection refused")
        from masova_agent.core.redis_session_service import RedisSessionService
        service = RedisSessionService(redis_url="redis://localhost:6379/1")

    # Service should still be usable (fallback)
    assert service is not None
    session = await service.create_session(app_name="test_app", user_id="user_123")
    assert session.id is not None
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
python -m pytest tests/test_redis_session.py -v
```

Expected: `ModuleNotFoundError: No module named 'masova_agent.core.redis_session_service'`

**Step 3: Create Redis session service**

Create `masova-support/src/masova_agent/core/redis_session_service.py`:

```python
"""
Redis-backed session service for MaSoVa Agent.
Replaces InMemorySessionService to persist conversation across restarts.
Falls back to InMemorySessionService if Redis is unavailable.
"""
import json
import uuid
import logging
from typing import Optional
from dataclasses import dataclass, field

import redis
from google.adk.sessions import InMemorySessionService

logger = logging.getLogger(__name__)

SESSION_TTL_SECONDS = 3600  # 1 hour
MAX_HISTORY_TURNS = 10


@dataclass
class SessionData:
    id: str
    app_name: str
    user_id: str
    history: list = field(default_factory=list)


class RedisSessionService:
    """
    Session service backed by Redis.
    Keeps last MAX_HISTORY_TURNS conversation turns, TTL 1 hour.
    Gracefully falls back to InMemorySessionService if Redis is unavailable.
    """

    def __init__(self, redis_url: str):
        self._fallback = InMemorySessionService()
        self._redis: Optional[redis.Redis] = None
        self._use_redis = False

        try:
            client = redis.Redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
            client.ping()
            self._redis = client
            self._use_redis = True
            logger.info("Redis session service connected: %s", redis_url)
        except Exception as e:
            logger.warning("Redis unavailable (%s) — using InMemorySessionService fallback", e)

    def _session_key(self, session_id: str) -> str:
        return f"masova:session:{session_id}"

    async def create_session(self, app_name: str, user_id: str) -> SessionData:
        session_id = str(uuid.uuid4())
        session = SessionData(id=session_id, app_name=app_name, user_id=user_id)

        if self._use_redis:
            try:
                data = json.dumps({"id": session_id, "app_name": app_name, "user_id": user_id, "history": []})
                self._redis.setex(self._session_key(session_id), SESSION_TTL_SECONDS, data)
                logger.debug("Created Redis session: %s for user: %s", session_id, user_id)
                return session
            except Exception as e:
                logger.warning("Redis write failed (%s) — falling back", e)

        # Fallback
        return await self._fallback.create_session(app_name=app_name, user_id=user_id)

    async def get_session(self, app_name: str, user_id: str, session_id: str) -> Optional[SessionData]:
        if self._use_redis:
            try:
                raw = self._redis.get(self._session_key(session_id))
                if raw:
                    data = json.loads(raw)
                    return SessionData(
                        id=data["id"],
                        app_name=data["app_name"],
                        user_id=data["user_id"],
                        history=data.get("history", [])
                    )
            except Exception as e:
                logger.warning("Redis read failed (%s) — falling back", e)

        return await self._fallback.get_session(app_name=app_name, user_id=user_id, session_id=session_id)

    async def append_turn(self, session_id: str, role: str, text: str) -> None:
        """Append a conversation turn and trim to MAX_HISTORY_TURNS."""
        if not self._use_redis:
            return  # InMemory fallback handles history internally via ADK

        try:
            raw = self._redis.get(self._session_key(session_id))
            if not raw:
                return
            data = json.loads(raw)
            history = data.get("history", [])
            history.append({"role": role, "text": text})
            # Keep only last MAX_HISTORY_TURNS entries
            data["history"] = history[-MAX_HISTORY_TURNS:]
            self._redis.setex(self._session_key(session_id), SESSION_TTL_SECONDS, json.dumps(data))
        except Exception as e:
            logger.warning("Redis history append failed (%s)", e)
```

**Step 4: Run tests to verify they pass**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
python -m pytest tests/test_redis_session.py -v
```

Expected: all 3 tests PASS.

**Step 5: Update agent.py to use RedisSessionService**

In `masova-support/src/masova_agent/core/agent.py`:

Replace line 6:
```python
from google.adk.sessions import InMemorySessionService
```

With:
```python
from .redis_session_service import RedisSessionService
```

Replace line 35 in `__init__`:
```python
self._session_service = InMemorySessionService()
```

With:
```python
redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
self._session_service = RedisSessionService(redis_url=redis_url)
```

Add `import os` at the top of the file (after the docstring, before other imports).

**Step 6: Add REDIS_URL to .env**

In `masova-support/.env`, add:
```
REDIS_URL=redis://localhost:6379/1
```

(Use DB 1 to avoid colliding with core-service JWT blacklist on DB 0.)

**Step 7: Start masova-support and verify no error on startup**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected log line: `Redis session service connected: redis://localhost:6379/1`

If Redis is on Dell and you're running masova-support on Mac, use:
```
REDIS_URL=redis://192.168.50.88:6379/1
```

**Step 8: Commit**

```bash
git add src/masova_agent/core/redis_session_service.py
git add src/masova_agent/core/agent.py
git add .env
git add tests/test_redis_session.py
git commit -m "fix(agent): replace InMemorySessionService with Redis-backed sessions, 1hr TTL, graceful fallback"
```

---

## Task 0.4: Fix MongoDB P0 Index Issues

These fixes must run as MongoDB scripts on Dell (where MongoDB is running in Docker).

**Files:**
- Create: `scripts/fix-p0-indexes.js`

**Step 1: Understand the current state**

`Customer.java` has `@Indexed` (non-unique) on `email` field (line 58), but has compound indexes with `{ storeId, email }` at class level via `@CompoundIndexes`. The bug is these compound indexes don't have `unique: true`.

Additionally, `reviews` collection likely has no deduplication index, and `notifications` has no `userId` index.

**Step 2: Write the migration script**

Create `scripts/fix-p0-indexes.js`:

```javascript
/**
 * P0 MongoDB Index Fixes
 *
 * Fixes:
 * 1. customers.email compound index → add unique: true for store-scoped uniqueness
 * 2. customers.phone compound index → add unique: true for store-scoped uniqueness
 * 3. reviews → add deduplication index { orderId, customerId } unique: true
 * 4. notifications → add { userId: 1 } index
 *
 * Run: node scripts/fix-p0-indexes.js
 * Target: MongoDB on Dell at localhost:27017 (run from Dell) or 192.168.50.88:27017 (run from Mac)
 */

const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.50.88:27017';
const DB_NAME = 'masova_db';

async function fixP0Indexes() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URL);
    const db = client.db(DB_NAME);

    // ─── 1. customers: drop non-unique email/phone indexes, add unique compound ───
    const customers = db.collection('customers');

    // Drop the non-unique single-field email index if it exists
    try {
      await customers.dropIndex('email_1');
      console.log('✓ Dropped non-unique customers.email_1 index');
    } catch (e) {
      console.log('  (customers.email_1 index not found — skipping drop)');
    }

    // Drop the non-unique single-field phone index if it exists
    try {
      await customers.dropIndex('phone_1');
      console.log('✓ Dropped non-unique customers.phone_1 index');
    } catch (e) {
      console.log('  (customers.phone_1 index not found — skipping drop)');
    }

    // Drop existing non-unique compound index on storeId+email if it exists
    try {
      await customers.dropIndex('storeId_1_email_1');
      console.log('✓ Dropped non-unique customers.storeId_1_email_1 index');
    } catch (e) {
      console.log('  (customers.storeId_1_email_1 index not found — skipping drop)');
    }

    // Drop existing non-unique compound index on storeId+phone if it exists
    try {
      await customers.dropIndex('storeId_1_phone_1');
      console.log('✓ Dropped non-unique customers.storeId_1_phone_1 index');
    } catch (e) {
      console.log('  (customers.storeId_1_phone_1 index not found — skipping drop)');
    }

    // Check for duplicate (storeId, email) pairs BEFORE adding unique index
    const emailDuplicates = await customers.aggregate([
      { $match: { email: { $ne: null, $ne: '' } } },
      { $group: { _id: { storeId: '$storeId', email: '$email' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (emailDuplicates.length > 0) {
      console.error('❌ DUPLICATE (storeId, email) pairs found — cannot add unique index yet:');
      emailDuplicates.forEach(d => console.error('  ', JSON.stringify(d)));
      console.error('  Fix duplicates manually before running this script again.');
    } else {
      await customers.createIndex(
        { storeId: 1, email: 1 },
        { unique: true, sparse: true, name: 'idx_customers_store_email_unique' }
      );
      console.log('✓ Created unique index: customers { storeId, email }');
    }

    // Check for duplicate (storeId, phone) pairs BEFORE adding unique index
    const phoneDuplicates = await customers.aggregate([
      { $match: { phone: { $ne: null, $ne: '' } } },
      { $group: { _id: { storeId: '$storeId', phone: '$phone' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (phoneDuplicates.length > 0) {
      console.error('❌ DUPLICATE (storeId, phone) pairs found — cannot add unique index yet:');
      phoneDuplicates.forEach(d => console.error('  ', JSON.stringify(d)));
      console.error('  Fix duplicates manually before running this script again.');
    } else {
      await customers.createIndex(
        { storeId: 1, phone: 1 },
        { unique: true, sparse: true, name: 'idx_customers_store_phone_unique' }
      );
      console.log('✓ Created unique index: customers { storeId, phone }');
    }

    // ─── 2. reviews: add deduplication index ─────────────────────────────────────
    const reviews = db.collection('reviews');

    // Check for duplicates before adding unique index
    const reviewDuplicates = await reviews.aggregate([
      { $match: { orderId: { $ne: null }, customerId: { $ne: null } } },
      { $group: { _id: { orderId: '$orderId', customerId: '$customerId' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (reviewDuplicates.length > 0) {
      console.warn('⚠️  DUPLICATE (orderId, customerId) reviews found — adding non-unique index instead:');
      reviewDuplicates.forEach(d => console.warn('  ', JSON.stringify(d)));
      await reviews.createIndex(
        { orderId: 1, customerId: 1 },
        { name: 'idx_reviews_order_customer' }
      );
      console.log('  Created NON-unique reviews index (fix duplicates to make it unique)');
    } else {
      await reviews.createIndex(
        { orderId: 1, customerId: 1 },
        { unique: true, sparse: true, name: 'idx_reviews_order_customer_unique' }
      );
      console.log('✓ Created unique deduplication index: reviews { orderId, customerId }');
    }

    // ─── 3. notifications: add userId index ──────────────────────────────────────
    const notifications = db.collection('notifications');
    await notifications.createIndex(
      { userId: 1 },
      { name: 'idx_notifications_user' }
    );
    console.log('✓ Created index: notifications { userId }');

    await notifications.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'idx_notifications_user_created' }
    );
    console.log('✓ Created index: notifications { userId, createdAt desc }');

    console.log('\n✅ P0 index fixes complete.');

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixP0Indexes();
```

**Step 3: Run duplicate check first (dry run)**

On Mac (or Dell), from monorepo root:

```bash
MONGO_URL=mongodb://192.168.50.88:27017 node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://192.168.50.88:27017');
client.connect().then(async () => {
  const db = client.db('masova_db');
  const dups = await db.collection('customers').aggregate([
    { \$group: { _id: { storeId: '\$storeId', email: '\$email' }, count: { \$sum: 1 } } },
    { \$match: { count: { \$gt: 1 } } }
  ]).toArray();
  console.log('Duplicates:', JSON.stringify(dups, null, 2));
  await client.close();
});
"
```

Expected: `Duplicates: []` — no duplicates in dev data.

**Step 4: Run the fix script**

```bash
MONGO_URL=mongodb://192.168.50.88:27017 node scripts/fix-p0-indexes.js
```

Expected output:
```
Connected to MongoDB at mongodb://192.168.50.88:27017
✓ Dropped non-unique customers.email_1 index
✓ Dropped non-unique customers.phone_1 index
✓ Created unique index: customers { storeId, email }
✓ Created unique index: customers { storeId, phone }
✓ Created unique deduplication index: reviews { orderId, customerId }
✓ Created index: notifications { userId }
✓ Created index: notifications { userId, createdAt desc }

✅ P0 index fixes complete.
```

**Step 5: Remove @Indexed(unique=true) from Customer.java if present**

In `Customer.java` (line 44): the annotation is `@Indexed(unique = true)` on `userId` — that's correct and stays. Line 58 has `@Indexed` (non-unique) on `email` — that's fine, the unique constraint is enforced at the compound index level now.

Verify `email` field in `Customer.java` looks like:
```java
@Email(message = "Invalid email format")
@Indexed  // non-unique — uniqueness enforced by compound index { storeId, email }
private String email;
```

If it has `@Indexed(unique = true)` on email, remove `unique = true` from that annotation.

**Step 6: Commit**

```bash
git add scripts/fix-p0-indexes.js
git commit -m "fix(db): add P0 MongoDB index fixes — store-scoped customer uniqueness, review deduplication, notification userId index"
```

---

## Task 0.5: Fix Customer.java @Indexed Annotations

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/customer/entity/Customer.java`

**Step 1: Read the full Customer.java**

Read `core-service/src/main/java/com/MaSoVa/core/customer/entity/Customer.java` to see all `@Indexed` annotations on `email` and `phone` fields.

**Step 2: Check phone field for unique annotation**

Find the `phone` field (around line 60–70). If it has `@Indexed(unique = true)`, change it to `@Indexed`.

The class-level `@CompoundIndexes` already declares `{ storeId, email }` and `{ storeId, phone }` — but without `unique = true`. Spring Data MongoDB `@CompoundIndex` doesn't support `unique` as a property in older versions; the unique constraint is enforced at MongoDB level via the migration script in Task 0.4.

**Step 3: Verify @CompoundIndexes on Customer.java**

The class already has:
```java
@CompoundIndex(def = "{'storeId': 1, 'email': 1}"),
@CompoundIndex(def = "{'storeId': 1, 'phone': 1}")
```

Spring Data will try to create these on startup. Since we just created them with `unique: true` via the script, Spring will find the index already exists and skip creation. This is the correct behavior.

**Step 4: Build core-service to verify no compile errors**

On Dell:
```powershell
cd core-service
mvn compile "-Dmaven.test.skip=true"
```

Expected: `BUILD SUCCESS`

**Step 5: Commit (only if changes made)**

```bash
git add core-service/src/main/java/com/MaSoVa/core/customer/entity/Customer.java
git commit -m "fix(core): remove global unique index on customer email/phone fields (uniqueness now store-scoped)"
```

---

## Task 0.6: Integration Smoke Test

After all 4 blockers are fixed, run a manual smoke test to confirm nothing is broken.

**Step 1: Start all services on Dell**

```powershell
# Start infra
docker compose up -d mongodb redis rabbitmq

# Start each service (separate terminals)
cd core-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd payment-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd api-gateway && mvn spring-boot:run "-Dmaven.test.skip=true"
```

**Step 2: Start masova-support on Mac**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

**Step 3: Test auth + order flow**

```bash
BASE=http://192.168.50.88:8080

# Login
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@masova.com","password":"password123"}' | jq -r '.token')

# Create order
curl -s -X POST $BASE/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"storeId":"STORE001","orderType":"TAKEAWAY","customerName":"Smoke Test","items":[{"menuItemId":"ITEM001","name":"Burger","quantity":1,"price":150}]}' | jq '.id,.status'
```

Expected: order created with status `RECEIVED`

**Step 4: Verify RabbitMQ event was published**

Open `http://192.168.50.88:15672` → Queues → check `masova.orders.created` queue for 1 message.

**Step 5: Test masova-support chat with Redis session**

```bash
curl -s -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, I am Soura","sessionId":"smoke-test-001"}'
```

Expected: response with system briefing content.

Restart masova-support service. Send same message with same sessionId. Redis-backed session should be present (conversation history preserved — though ADK manages history internally, not from our Redis store yet).

**Step 6: Final commit — update MEMORY.md if needed**

If all smoke tests pass, update memory to record Phase 0 complete.

---

## Execution Notes

### Running Order
Tasks must run in order:
1. Task 0.1 — Enum fix (compile change, safest first)
2. Task 0.2 — Verify publisher (likely already done, verify only)
3. Task 0.4 — MongoDB index migration (run script)
4. Task 0.3 — Redis session in masova-support
5. Task 0.5 — Customer.java annotation cleanup
6. Task 0.6 — Smoke test

### Environment Context
- **Java services**: run on Dell (`192.168.50.88`) via Maven
- **masova-support**: run on Mac M1
- **MongoDB**: Dell Docker container `masova-mongodb` on `192.168.50.88:27017`
- **Redis**: Dell Docker container `masova-redis` on `192.168.50.88:6379`
- **RabbitMQ**: Dell Docker container `masova-rabbitmq` on `192.168.50.88:5672`, management UI `:15672`
- **API Gateway**: `192.168.50.88:8080` — proxies to all services

### PowerShell Notes (Dell)
- No `grep` → use `Select-String -Path <file> -Pattern "<term>"`
- Maven: always wrap `-D` flags in quotes: `mvn spring-boot:run "-Dmaven.test.skip=true"`
- `jq` may not be installed — use Python: `python -c "import sys,json; print(json.load(sys.stdin)['token'])"`
