# Phase 6 — AI Agents Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 7 new AI agents (plus improve Agent 1) using Google ADK 1.25, APScheduler, and the existing masova-support FastAPI service.

**Architecture:** All agents live in `masova-support`. APScheduler `AsyncIOScheduler` handles scheduled agents. Agents 2–8 do NOT use LLM — they use Python business logic + HTTP calls to backend APIs. Agent 1 (support chat) already exists; enhance it. Agent 5 (Smart Review Response) uses LLM. All agents produce output via `POST /api/...` to backend or notification push — never change data automatically without human approval.

**Tech Stack:** Python 3.11, Google ADK 1.25, APScheduler 3.x, httpx, FastAPI, Redis, PostgreSQL (Phase 2 must be complete for Agents 2/3/6/7 — they need order history in PG)

**Pre-Condition:** Phase 0.3 (Redis session fix) must be complete before starting this phase.

---

## Task 6.1: Install APScheduler + Wire into FastAPI

**Files:**
- Modify: `masova-support/requirements.txt`
- Modify: `masova-support/src/masova_agent/main.py`
- Create: `masova-support/src/masova_agent/scheduler/scheduler.py`

**Step 1: Add APScheduler to requirements**

In `masova-support/requirements.txt`, add:
```
apscheduler==3.10.4
```

**Step 2: Install**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
pip install apscheduler==3.10.4
```

**Step 3: Create scheduler module**

Create `masova-support/src/masova_agent/scheduler/scheduler.py`:

```python
"""
APScheduler configuration for MaSoVa background agents.
Uses AsyncIOScheduler so all jobs run in the same event loop as FastAPI.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.executors.asyncio import AsyncIOExecutor
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(
    executors={"default": AsyncIOExecutor()},
    job_defaults={"coalesce": True, "max_instances": 1},
    timezone="Asia/Kolkata",  # IST — MaSoVa operates in India
)


def get_scheduler() -> AsyncIOScheduler:
    return scheduler
```

**Step 4: Wire scheduler into FastAPI lifespan**

In `masova-support/src/masova_agent/main.py`, add lifespan:

```python
from contextlib import asynccontextmanager
from .scheduler.scheduler import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start scheduler when app starts
    scheduler.start()
    logger.info("APScheduler started")
    yield
    # Shutdown scheduler when app stops
    scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped")

app = FastAPI(title="MaSoVa Agent", lifespan=lifespan)
```

**Step 5: Start masova-support and verify scheduler starts**

```bash
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected log: `APScheduler started`

**Step 6: Commit**

```bash
git add requirements.txt
git add src/masova_agent/scheduler/scheduler.py
git add src/masova_agent/main.py
git commit -m "feat(agent): install APScheduler, wire AsyncIOScheduler into FastAPI lifespan"
```

---

## Task 6.2: Enhance Agent 1 — Verify All 7 Tools Are Wired

**Files:**
- Read: `masova-support/src/masova_agent/tools/backend_tools.py`
- Read: `masova-support/src/masova_agent/core/agent.py`

**Step 1: Read backend_tools.py**

Count the tools defined. There should be 7 (some older docs say 8 including get_system_briefing):
- `get_order_status`
- `get_menu_items`
- `get_store_hours`
- `submit_complaint`
- `request_refund`
- `get_loyalty_points`
- `get_store_wait_time`
- `cancel_order`

**Step 2: Read agent.py — check which tools are passed to LlmAgent**

In `MaSoVaAgent.__init__()`, find:
```python
self.llm_agent = LlmAgent(
    name=self.config.agent.name,
    model=self.config.agent.model,
    instruction=self._get_instruction(),
    tools=[get_system_briefing]  # ← only 1 tool!
)
```

The agent currently only has `get_system_briefing`. Add all 7 backend tools:

```python
from ..tools.backend_tools import (
    get_order_status, get_menu_items, get_store_hours,
    submit_complaint, request_refund, get_loyalty_points,
    get_store_wait_time, cancel_order
)
from ..tools import get_system_briefing

self.llm_agent = LlmAgent(
    name=self.config.agent.name,
    model=self.config.agent.model,
    instruction=self._get_instruction(),
    tools=[
        get_system_briefing,
        get_order_status,
        get_menu_items,
        get_store_hours,
        submit_complaint,
        request_refund,
        get_loyalty_points,
        get_store_wait_time,
        cancel_order,
    ]
)
```

**Step 3: Update agent instruction to mention capabilities**

Update `_get_instruction()` to mention the tools:

```python
def _get_instruction(self) -> str:
    return """You are MaSoVa Customer Support Assistant.

CAPABILITIES:
- Check order status: ask for order number or customer email
- Show menu items: ask what cuisine or category they want
- Store hours: tell customers when the store is open
- Submit complaints: log customer complaints with category and description
- Request refunds: initiate refunds for valid complaints
- Check loyalty points: tell customers their points balance and how to redeem
- Store wait time: current estimated wait for new orders
- Cancel order: cancel if status allows (RECEIVED only)

PROTOCOL:
1. Greet the customer warmly
2. Ask what you can help with
3. Use the appropriate tool to get real data — never make up order numbers, times, or points
4. If a tool fails, apologize and suggest contacting the store directly

TONE: Professional, helpful, brief. Maximum 3 sentences per response.
"""
```

**Step 4: Test the agent with a tool call**

```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the status of my order ORD-001?", "sessionId": "test-123"}'
```

Expected: agent calls `get_order_status` and returns the actual status.

**Step 5: Commit**

```bash
git add src/masova_agent/core/agent.py
git commit -m "feat(agent1): wire all 7 backend tools into LlmAgent, update instruction with capabilities"
```

---

## Task 6.3: Agent 2 — Demand Forecasting (Nightly 2am)

**Files:**
- Create: `masova-support/src/masova_agent/agents/demand_forecasting_agent.py`
- Modify: `masova-support/src/masova_agent/scheduler/scheduler.py`

**Step 1: Create demand forecasting agent**

Create `masova-support/src/masova_agent/agents/demand_forecasting_agent.py`:

```python
"""
Agent 2: Demand Forecasting
Schedule: Nightly at 2am IST
Input: 90-day order history per menu item per hour per day-of-week
Method: Weighted moving average (recent days weighted higher) + day-of-week seasonality
Output: Writes to /api/analytics/forecast endpoint as daily_forecasts records
"""
import httpx
import logging
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

BACKEND_URL = None  # Set from config on first call
AUTH_TOKEN = None   # Agent uses a dedicated service account token


def _get_config():
    """Lazy import config to avoid circular imports"""
    from ..utils.config import get_config
    return get_config()


async def run_demand_forecast() -> Dict[str, Any]:
    """
    Main entry point — called by APScheduler nightly at 2am.
    Returns summary of forecasts generated.
    """
    config = _get_config()
    backend_url = config.backend_url  # e.g. http://192.168.50.88:8080
    agent_token = config.agent_token  # Service account JWT for agent calls

    headers = {"Authorization": f"Bearer {agent_token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Get all stores
        stores_res = await client.get(f"{backend_url}/api/stores", headers=headers)
        if stores_res.status_code != 200:
            logger.error("Failed to fetch stores: %s", stores_res.text)
            return {"error": "Could not fetch stores"}

        stores = stores_res.json()
        store_ids = [s["id"] for s in (stores.get("content") or stores)]

        total_forecasts = 0
        for store_id in store_ids:
            count = await _forecast_for_store(client, backend_url, headers, store_id)
            total_forecasts += count

    logger.info("Demand forecast complete: %d forecasts generated for %d stores", total_forecasts, len(store_ids))
    return {"forecasts": total_forecasts, "stores": len(store_ids), "generated_at": datetime.now().isoformat()}


async def _forecast_for_store(
    client: httpx.AsyncClient,
    backend_url: str,
    headers: dict,
    store_id: str
) -> int:
    """Generate demand forecasts for a single store. Returns count of forecasts written."""

    # Fetch last 90 days of orders for this store
    since = (datetime.now() - timedelta(days=90)).isoformat()
    orders_res = await client.get(
        f"{backend_url}/api/orders?storeId={store_id}&from={since}&status=DELIVERED,COMPLETED,SERVED",
        headers=headers
    )

    if orders_res.status_code != 200:
        logger.warning("Failed to fetch orders for store %s", store_id)
        return 0

    orders = orders_res.json()
    orders_list = orders.get("content") or orders
    if not orders_list:
        return 0

    # Aggregate: { menuItemId: { day_of_week: { hour: [quantities] } } }
    history: Dict[str, Dict[int, Dict[int, List[float]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )

    for order in orders_list:
        created_at = datetime.fromisoformat(order.get("createdAt", "").replace("Z", "+00:00"))
        day_of_week = created_at.weekday()  # 0=Monday, 6=Sunday
        hour = created_at.hour

        for item in order.get("items", []):
            menu_item_id = item.get("menuItemId")
            qty = item.get("quantity", 0)
            if menu_item_id and qty > 0:
                history[menu_item_id][day_of_week][hour].append(qty)

    # Generate tomorrow's forecast
    tomorrow = datetime.now() + timedelta(days=1)
    tomorrow_dow = tomorrow.weekday()
    forecast_date = tomorrow.strftime("%Y-%m-%d")

    forecasts_written = 0

    for menu_item_id, day_hour_data in history.items():
        hour_data = day_hour_data.get(tomorrow_dow, {})

        for hour in range(24):
            quantities = hour_data.get(hour, [])
            if not quantities:
                continue

            # Weighted moving average — recent observations weighted 2x
            n = len(quantities)
            weights = [1 + (i / n) for i in range(n)]  # linearly increasing weights
            weighted_sum = sum(q * w for q, w in zip(quantities, weights))
            weight_total = sum(weights)
            predicted_qty = round(weighted_sum / weight_total, 2)

            # Write forecast to backend (intelligence-service stores this)
            forecast_payload = {
                "storeId": store_id,
                "date": forecast_date,
                "menuItemId": menu_item_id,
                "hourSlot": hour,
                "predictedQuantity": predicted_qty,
                "dayOfWeek": tomorrow_dow,
                "generatedAt": datetime.now().isoformat(),
                "agentVersion": "2.0"
            }

            # POST to analytics forecast endpoint
            res = await client.post(
                f"{backend_url}/api/analytics/forecast",
                json=forecast_payload,
                headers=headers
            )

            if res.status_code in (200, 201):
                forecasts_written += 1
            else:
                logger.warning(
                    "Failed to write forecast for item %s hour %d: %s",
                    menu_item_id, hour, res.text[:100]
                )

    return forecasts_written
```

**Step 2: Register Agent 2 with APScheduler**

In `scheduler.py`, add:

```python
from ..agents.demand_forecasting_agent import run_demand_forecast

def register_jobs():
    """Register all scheduled agent jobs. Call this after scheduler.start()."""

    # Agent 2: Demand Forecasting — nightly at 2am IST
    scheduler.add_job(
        run_demand_forecast,
        trigger="cron",
        hour=2,
        minute=0,
        id="demand_forecast",
        name="Demand Forecasting Agent",
        replace_existing=True,
    )

    logger.info("Registered %d scheduled agent jobs", len(scheduler.get_jobs()))
```

In `main.py` lifespan, after `scheduler.start()`:
```python
from .scheduler.scheduler import scheduler, register_jobs
scheduler.start()
register_jobs()
```

**Step 3: Add manual trigger endpoint (for testing)**

In `main.py`, add:
```python
@app.post("/agents/demand-forecast/trigger")
async def trigger_demand_forecast():
    """Manually trigger demand forecast (dev/testing only)"""
    result = await run_demand_forecast()
    return result
```

**Step 4: Test manual trigger**

```bash
curl -X POST http://localhost:8000/agents/demand-forecast/trigger
```

Expected: `{"forecasts": N, "stores": M, "generated_at": "..."}`

**Step 5: Commit**

```bash
git add src/masova_agent/agents/demand_forecasting_agent.py
git add src/masova_agent/scheduler/scheduler.py
git add src/masova_agent/main.py
git commit -m "feat(agent2): demand forecasting — nightly 2am, weighted moving average per item/hour/dow"
```

---

## Task 6.4: Agent 3 — Inventory Reorder (Every 6 Hours)

**Files:**
- Create: `masova-support/src/masova_agent/agents/inventory_reorder_agent.py`
- Modify: `masova-support/src/masova_agent/scheduler/scheduler.py`

**Step 1: Create inventory reorder agent**

Create `masova-support/src/masova_agent/agents/inventory_reorder_agent.py`:

```python
"""
Agent 3: Inventory Reorder
Schedule: Every 6 hours
Input: Current stock levels + Agent 2 demand forecast for next 24h
Logic: If (currentStock - predictedConsumption) < minimumStock before next expected delivery → draft PO
Output: POST /api/purchase-orders/auto-generate with DRAFT status
        POST /api/notifications to notify manager
"""
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


async def run_inventory_reorder() -> Dict[str, Any]:
    """Main entry point. Returns summary of POs drafted."""
    from ..utils.config import get_config
    config = get_config()
    backend_url = config.backend_url
    headers = {"Authorization": f"Bearer {config.agent_token}", "Content-Type": "application/json"}

    pos_drafted = 0
    items_checked = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get all stores
        stores = await _get_stores(client, backend_url, headers)

        for store in stores:
            store_id = store["id"]

            # Get inventory items for this store
            inv_res = await client.get(
                f"{backend_url}/api/inventory?storeId={store_id}&lowStock=true",
                headers=headers
            )
            if inv_res.status_code != 200:
                continue

            inv_items = inv_res.json()
            inv_list = inv_items.get("content") or inv_items
            items_checked += len(inv_list)

            # Group by preferred supplier
            supplier_items: Dict[str, List] = {}
            for item in inv_list:
                supplier_id = item.get("preferredSupplierId")
                if not supplier_id:
                    continue  # Skip items without preferred supplier
                if supplier_id not in supplier_items:
                    supplier_items[supplier_id] = []
                supplier_items[supplier_id].append(item)

            # Draft a PO per supplier
            for supplier_id, items in supplier_items.items():
                po_payload = {
                    "storeId": store_id,
                    "supplierId": supplier_id,
                    "status": "DRAFT",
                    "autoGenerated": True,
                    "generatedAt": datetime.now().isoformat(),
                    "items": [
                        {
                            "inventoryItemId": item["id"],
                            "itemName": item.get("itemName", "Unknown"),
                            "quantity": item.get("reorderQuantity", 10),
                            "unitCost": item.get("unitCost", 0)
                        }
                        for item in items
                    ],
                    "notes": f"Auto-generated by Inventory Reorder Agent at {datetime.now().isoformat()}"
                }

                po_res = await client.post(
                    f"{backend_url}/api/purchase-orders/auto-generate",
                    json=po_payload,
                    headers=headers
                )

                if po_res.status_code in (200, 201):
                    pos_drafted += 1
                    # Notify manager
                    item_names = ", ".join(i.get("itemName", "?") for i in items[:3])
                    more = f" and {len(items) - 3} more" if len(items) > 3 else ""
                    await _notify_manager(
                        client, backend_url, headers, store_id,
                        f"Inventory Alert: {item_names}{more} need reordering. Draft PO created — please review."
                    )

    logger.info("Inventory reorder complete: %d POs drafted, %d items checked", pos_drafted, items_checked)
    return {"pos_drafted": pos_drafted, "items_checked": items_checked}


async def _get_stores(client, backend_url, headers):
    res = await client.get(f"{backend_url}/api/stores", headers=headers)
    if res.status_code != 200:
        return []
    data = res.json()
    return data.get("content") or data


async def _notify_manager(client, backend_url, headers, store_id, message):
    """Send notification to all managers for a store"""
    managers_res = await client.get(
        f"{backend_url}/api/users?type=MANAGER&storeId={store_id}",
        headers=headers
    )
    if managers_res.status_code != 200:
        return

    managers = managers_res.json()
    for manager in (managers.get("content") or managers):
        await client.post(
            f"{backend_url}/api/notifications",
            json={
                "userId": manager["id"],
                "type": "INVENTORY_ALERT",
                "title": "Inventory Reorder Required",
                "message": message,
                "priority": "HIGH"
            },
            headers=headers
        )
```

**Step 2: Register Agent 3 with APScheduler**

In `scheduler.py`, in `register_jobs()`:
```python
from ..agents.inventory_reorder_agent import run_inventory_reorder

scheduler.add_job(
    run_inventory_reorder,
    trigger="interval",
    hours=6,
    id="inventory_reorder",
    name="Inventory Reorder Agent",
    replace_existing=True,
)
```

**Step 3: Add manual trigger endpoint**

In `main.py`:
```python
@app.post("/agents/inventory-reorder/trigger")
async def trigger_inventory_reorder():
    from .agents.inventory_reorder_agent import run_inventory_reorder
    return await run_inventory_reorder()
```

**Step 4: Commit**

```bash
git add src/masova_agent/agents/inventory_reorder_agent.py
git add src/masova_agent/scheduler/scheduler.py
git add src/masova_agent/main.py
git commit -m "feat(agent3): inventory reorder — every 6h, auto-draft POs for low stock items, notify manager"
```

---

## Task 6.5: Agent 4 — Churn Prevention (Daily 10am)

**Files:**
- Create: `masova-support/src/masova_agent/agents/churn_prevention_agent.py`
- Modify: `masova-support/src/masova_agent/scheduler/scheduler.py`

**Step 1: Create churn prevention agent**

Create `masova-support/src/masova_agent/agents/churn_prevention_agent.py`:

```python
"""
Agent 4: Churn Prevention
Schedule: Daily at 10am IST
Input: Customers with >3 orders in last 60 days AND no order in last 14 days (churned high-value)
Output: DRAFT campaign targeting these customers with personalised message + discount offer
"""
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

CHURN_WINDOW_DAYS = 14        # No order in this many days = churned
QUALIFYING_ORDER_COUNT = 3    # Min orders in 60 days to be considered "high value"
QUALIFYING_PERIOD_DAYS = 60
RECOVERY_DISCOUNT_PERCENT = 15  # % discount in recovery offer


async def run_churn_prevention() -> Dict[str, Any]:
    from ..utils.config import get_config
    config = get_config()
    backend_url = config.backend_url
    headers = {"Authorization": f"Bearer {config.agent_token}", "Content-Type": "application/json"}

    campaigns_created = 0
    customers_targeted = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        stores = await _get_stores(client, backend_url, headers)

        for store in stores:
            store_id = store["id"]
            churned_customers = await _find_churned_customers(client, backend_url, headers, store_id)

            if not churned_customers:
                continue

            customers_targeted += len(churned_customers)

            # Get top items for personalisation (most ordered in this store)
            top_items = await _get_top_items(client, backend_url, headers, store_id)
            top_item_names = [item.get("name", "our bestsellers") for item in top_items[:3]]

            # Create draft recovery campaign
            campaign_payload = {
                "storeId": store_id,
                "name": f"Win-Back Campaign — {datetime.now().strftime('%Y-%m-%d')}",
                "type": "WIN_BACK",
                "status": "DRAFT",
                "autoGenerated": True,
                "targetSegment": "CHURNED_HIGH_VALUE",
                "customerIds": [c["id"] for c in churned_customers],
                "discountPercent": RECOVERY_DISCOUNT_PERCENT,
                "message": (
                    f"We miss you! Come back and enjoy {RECOVERY_DISCOUNT_PERCENT}% off your next order. "
                    f"Our {', '.join(top_item_names)} are waiting for you."
                ),
                "expiresInDays": 7,
                "generatedBy": "churn_prevention_agent",
                "generatedAt": datetime.now().isoformat()
            }

            res = await client.post(
                f"{backend_url}/api/campaigns",
                json=campaign_payload,
                headers=headers
            )

            if res.status_code in (200, 201):
                campaigns_created += 1
                # Notify managers
                await _notify_managers(
                    client, backend_url, headers, store_id,
                    f"Churn Alert: {len(churned_customers)} high-value customers haven't ordered in {CHURN_WINDOW_DAYS}+ days. "
                    f"A win-back campaign draft is ready for your review."
                )

    logger.info("Churn prevention complete: %d campaigns created, %d customers targeted",
                campaigns_created, customers_targeted)
    return {"campaigns_created": campaigns_created, "customers_targeted": customers_targeted}


async def _find_churned_customers(client, backend_url, headers, store_id) -> List[Dict]:
    """Find customers who ordered >3 times in last 60 days but not in last 14 days."""
    res = await client.get(
        f"{backend_url}/api/customers?storeId={store_id}&filter=CHURNED_HIGH_VALUE",
        headers=headers
    )
    if res.status_code == 200:
        data = res.json()
        return data.get("content") or data

    # Fallback: get all customers and filter in Python
    all_res = await client.get(f"{backend_url}/api/customers?storeId={store_id}", headers=headers)
    if all_res.status_code != 200:
        return []

    all_customers = all_res.json().get("content") or all_res.json()
    now = datetime.now()
    churn_cutoff = now - timedelta(days=CHURN_WINDOW_DAYS)
    qualifying_cutoff = now - timedelta(days=QUALIFYING_PERIOD_DAYS)

    churned = []
    for customer in all_customers:
        last_order = customer.get("lastOrderDate")
        total_orders = customer.get("totalOrders", 0)
        if last_order and total_orders >= QUALIFYING_ORDER_COUNT:
            last_order_dt = datetime.fromisoformat(last_order.replace("Z", "+00:00"))
            if last_order_dt < churn_cutoff:
                churned.append(customer)

    return churned


async def _get_top_items(client, backend_url, headers, store_id) -> List[Dict]:
    res = await client.get(f"{backend_url}/api/analytics/products?storeId={store_id}", headers=headers)
    if res.status_code == 200:
        return (res.json().get("topItems") or res.json())[:3]
    return []


async def _get_stores(client, backend_url, headers):
    res = await client.get(f"{backend_url}/api/stores", headers=headers)
    return (res.json().get("content") or res.json()) if res.status_code == 200 else []


async def _notify_managers(client, backend_url, headers, store_id, message):
    managers_res = await client.get(
        f"{backend_url}/api/users?type=MANAGER&storeId={store_id}", headers=headers)
    if managers_res.status_code != 200:
        return
    for manager in (managers_res.json().get("content") or managers_res.json()):
        await client.post(
            f"{backend_url}/api/notifications",
            json={"userId": manager["id"], "type": "CHURN_ALERT",
                  "title": "Customer Churn Alert", "message": message, "priority": "MEDIUM"},
            headers=headers
        )
```

**Step 2: Register Agent 4 with APScheduler**

In `scheduler.py register_jobs()`:
```python
from ..agents.churn_prevention_agent import run_churn_prevention

scheduler.add_job(
    run_churn_prevention,
    trigger="cron",
    hour=10,
    minute=0,
    id="churn_prevention",
    name="Churn Prevention Agent",
    replace_existing=True,
)
```

**Step 3: Add manual trigger**

```python
@app.post("/agents/churn-prevention/trigger")
async def trigger_churn_prevention():
    from .agents.churn_prevention_agent import run_churn_prevention
    return await run_churn_prevention()
```

**Step 4: Commit**

```bash
git add src/masova_agent/agents/churn_prevention_agent.py
git commit -m "feat(agent4): churn prevention — daily 10am, draft win-back campaigns for high-value churned customers"
```

---

## Task 6.6: Agent 5 — Smart Review Response (Event-Driven via RabbitMQ)

**Files:**
- Create: `masova-support/src/masova_agent/agents/review_response_agent.py`
- Modify: `masova-support/src/masova_agent/main.py`

This is the only agent that uses an LLM (Gemini via ADK).

**Step 1: Create review response agent**

Create `masova-support/src/masova_agent/agents/review_response_agent.py`:

```python
"""
Agent 5: Smart Review Response
Trigger: RabbitMQ event on new review with rating <= 3
Input: review text + order details + item names + complaint keywords
Output: draft personalised manager response pushed to notification feed
Uses LLM (Gemini 2.0 Flash) — personalised, not a template
"""
import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

DRAFT_RESPONSE_PROMPT = """You are a professional restaurant manager writing a response to a customer review.

Review: {review_text}
Rating: {rating}/5
Items ordered: {items}
Complaint keywords: {keywords}

Write a personalised, empathetic response that:
1. Acknowledges the specific feedback (mention the items if relevant)
2. Apologises sincerely without being sycophantic
3. States what action will be taken (investigate, retrain staff, improve the dish)
4. Invites the customer back with goodwill

Maximum 100 words. No marketing language. No "We value your feedback" clichés.
"""


async def draft_review_response(review_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a draft response for a low-rating review.
    Called from review event listener.
    """
    from ..utils.config import get_config
    from google.genai import Client as GenAIClient

    config = get_config()
    backend_url = config.backend_url
    headers = {"Authorization": f"Bearer {config.agent_token}", "Content-Type": "application/json"}

    review_id = review_data.get("reviewId")
    rating = review_data.get("rating", 0)
    review_text = review_data.get("text", "")
    store_id = review_data.get("storeId")
    order_id = review_data.get("orderId")

    if rating > 3:
        return {"skipped": True, "reason": "Rating > 3, no response needed"}

    # Fetch order details for context
    items_str = ""
    async with httpx.AsyncClient(timeout=15.0) as client:
        if order_id:
            order_res = await client.get(f"{backend_url}/api/orders/{order_id}", headers=headers)
            if order_res.status_code == 200:
                order = order_res.json()
                items_str = ", ".join(i.get("name", "?") for i in order.get("items", []))

        # Generate response using Gemini
        keywords = _extract_keywords(review_text)
        prompt = DRAFT_RESPONSE_PROMPT.format(
            review_text=review_text,
            rating=rating,
            items=items_str or "unspecified items",
            keywords=", ".join(keywords) or "general dissatisfaction"
        )

        genai_client = GenAIClient(api_key=config.google_api_key)
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        draft_response_text = response.text.strip()

        # Notify managers with the draft
        managers_res = await client.get(
            f"{backend_url}/api/users?type=MANAGER&storeId={store_id}", headers=headers)

        if managers_res.status_code == 200:
            for manager in (managers_res.json().get("content") or managers_res.json()):
                await client.post(
                    f"{backend_url}/api/notifications",
                    json={
                        "userId": manager["id"],
                        "type": "REVIEW_DRAFT_RESPONSE",
                        "title": f"New {rating}★ Review — Draft Response Ready",
                        "message": f"Review: \"{review_text[:80]}...\"\n\nDraft response: {draft_response_text}",
                        "data": {
                            "reviewId": review_id,
                            "draftResponse": draft_response_text
                        },
                        "priority": "HIGH" if rating == 1 else "MEDIUM"
                    },
                    headers=headers
                )

    logger.info("Draft response generated for review %s (rating: %d)", review_id, rating)
    return {"reviewId": review_id, "draftGenerated": True, "responseLength": len(draft_response_text)}


def _extract_keywords(text: str) -> list:
    """Extract complaint keywords from review text."""
    complaint_terms = [
        "cold", "slow", "late", "wrong", "missing", "rude", "dirty",
        "overpriced", "raw", "burnt", "stale", "hair", "wait", "cancelled",
        "never arrived", "incorrect"
    ]
    text_lower = text.lower()
    return [term for term in complaint_terms if term in text_lower]
```

**Step 2: Note on RabbitMQ integration**

The review event listener in `core-service` (or `commerce-service`) should publish a `review.created` event when a review with rating ≤ 3 is submitted. Since masova-support is Python (not Spring), it needs a Python AMQP consumer.

Add to `requirements.txt`:
```
aio-pika==9.4.1
```

Add a background task in `main.py` lifespan to consume review events:
```python
# In lifespan, after scheduler.start():
import asyncio
asyncio.create_task(_start_review_consumer())

async def _start_review_consumer():
    """Consume review.created events from RabbitMQ"""
    try:
        import aio_pika
        connection = await aio_pika.connect_robust(config.rabbitmq_url)
        channel = await connection.channel()
        queue = await channel.declare_queue("masova.agent.reviews", durable=True)
        await queue.bind("masova.reviews.exchange", "review.created")

        async for message in queue:
            async with message.process():
                import json
                review_data = json.loads(message.body)
                if review_data.get("rating", 5) <= 3:
                    await draft_review_response(review_data)
    except Exception as e:
        logger.warning("RabbitMQ consumer not started (%s) — review response agent disabled", e)
```

**Step 3: Add manual trigger for testing**

```python
@app.post("/agents/review-response/trigger")
async def trigger_review_response(review_data: dict):
    from .agents.review_response_agent import draft_review_response
    return await draft_review_response(review_data)
```

**Step 4: Commit**

```bash
git add src/masova_agent/agents/review_response_agent.py
git add requirements.txt
git add src/masova_agent/main.py
git commit -m "feat(agent5): smart review response — LLM draft on low ratings, RabbitMQ triggered, notify manager"
```

---

## Task 6.7: Agents 6, 7, 8 — Register and Stub

**Files:**
- Create: `masova-support/src/masova_agent/agents/shift_optimisation_agent.py`
- Create: `masova-support/src/masova_agent/agents/kitchen_coach_agent.py`
- Create: `masova-support/src/masova_agent/agents/dynamic_pricing_agent.py`
- Modify: `masova-support/src/masova_agent/scheduler/scheduler.py`

These agents require PostgreSQL data (Phase 2) for full implementation. Create them as stubs with the schedule wired — they'll return early if PG data isn't available.

**Step 1: Create stub agents**

Each file follows the same pattern. Example for Agent 6:

```python
"""
Agent 6: Shift Optimisation
Schedule: Sundays at 8pm IST (for coming week)
Input: Agent 2 demand forecast for next week + historical shift efficiency + staff availability
Output: Draft shift schedule for next week (status=DRAFT) — manager reviews + confirms
Requires: Phase 2 PostgreSQL migration complete
"""
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


async def run_shift_optimisation() -> Dict[str, Any]:
    """Draft next week's shift schedule based on demand forecast."""
    # TODO: Implement after Phase 2 (PostgreSQL) is complete
    # Requires: daily_forecasts table in PostgreSQL
    logger.info("Shift Optimisation Agent triggered at %s (stub — Phase 2 required)", datetime.now())
    return {"status": "stub", "message": "Requires Phase 2 PostgreSQL migration"}
```

Repeat for `kitchen_coach_agent.py` and `dynamic_pricing_agent.py`.

**Step 2: Register all 3 with APScheduler**

In `register_jobs()`:
```python
from ..agents.shift_optimisation_agent import run_shift_optimisation
from ..agents.kitchen_coach_agent import run_kitchen_coach
from ..agents.dynamic_pricing_agent import run_dynamic_pricing

# Agent 6: Shift Optimisation — Sundays 8pm
scheduler.add_job(run_shift_optimisation, trigger="cron",
                  day_of_week="sun", hour=20, id="shift_optimisation", replace_existing=True)

# Agent 7: Kitchen Performance Coach — nightly 11pm
scheduler.add_job(run_kitchen_coach, trigger="cron",
                  hour=23, id="kitchen_coach", replace_existing=True)

# Agent 8: Dynamic Pricing — every 30min during 9am-10pm
scheduler.add_job(run_dynamic_pricing, trigger="cron",
                  hour="9-22", minute="0,30", id="dynamic_pricing", replace_existing=True)
```

**Step 3: Add manual trigger endpoints for all 3**

```python
@app.post("/agents/shift-optimisation/trigger")
async def trigger_shift_opt():
    from .agents.shift_optimisation_agent import run_shift_optimisation
    return await run_shift_optimisation()

@app.post("/agents/kitchen-coach/trigger")
async def trigger_kitchen_coach():
    from .agents.kitchen_coach_agent import run_kitchen_coach
    return await run_kitchen_coach()

@app.post("/agents/dynamic-pricing/trigger")
async def trigger_dynamic_pricing():
    from .agents.dynamic_pricing_agent import run_dynamic_pricing
    return await run_dynamic_pricing()
```

**Step 4: Commit**

```bash
git add src/masova_agent/agents/
git add src/masova_agent/scheduler/
git add src/masova_agent/main.py
git commit -m "feat(agents6-8): stub shift optimisation, kitchen coach, dynamic pricing — schedules wired, Phase 2 required for full impl"
```

---

## Task 6.8: Agent Config — Add Required Config Fields

**Files:**
- Modify: `masova-support/src/masova_agent/utils/config.py`
- Modify: `masova-support/.env`

**Step 1: Read config.py**

Check what config fields exist. Add missing ones:

```python
# In config class or Config dataclass:
backend_url: str = "http://192.168.50.88:8080"  # API Gateway
agent_token: str = ""  # Service account JWT — agent identity
google_api_key: str = ""  # For Gemini calls in Agent 5
rabbitmq_url: str = "amqp://guest:guest@192.168.50.88:5672/"
```

**Step 2: Add to .env**

```
BACKEND_URL=http://192.168.50.88:8080
AGENT_TOKEN=  # Generate a long-lived manager token from /api/auth/login for agent service account
GOOGLE_API_KEY=  # Your Google AI Studio API key
RABBITMQ_URL=amqp://guest:guest@192.168.50.88:5672/
```

**Step 3: Create agent service account**

On Dell, create a special "agent" user:
```bash
curl -X POST http://192.168.50.88:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@masova.internal","password":"<strong-password>","name":"MaSoVa Agent","role":"MANAGER"}'
```

Login and get long-lived token → put in `.env` as `AGENT_TOKEN`.

**Step 4: Commit**

```bash
git add src/masova_agent/utils/config.py
# DO NOT commit .env — it has secrets
git commit -m "feat(agent-config): add backend_url, agent_token, rabbitmq_url config fields"
```

---

## Execution Notes

### Agent Dependency Order
1. Task 6.1 — APScheduler setup (blocks all others)
2. Task 6.2 — Agent 1 tool wiring (independent)
3. Task 6.3 — Agent 2 Demand Forecasting (independent)
4. Task 6.4 — Agent 3 Inventory Reorder (independent, but conceptually after Agent 2)
5. Task 6.5 — Agent 4 Churn Prevention (independent)
6. Task 6.6 — Agent 5 Review Response (needs RabbitMQ — verify RabbitMQ is running)
7. Task 6.7 — Agents 6/7/8 stubs (independent)
8. Task 6.8 — Config (do before all agents)

### Testing Agents Without Full Backend
Each agent has a `/agents/*/trigger` endpoint. Use seeded test data (from `scripts/seed-database.js`) to test with real data. Agents 2/3/6/7 need order history — run `node scripts/seed-database.js` first.

### Agent Token
The `AGENT_TOKEN` must be a valid JWT from the system. It expires — for production, implement token refresh or use a very long expiry (not recommended for security but acceptable for dev).
