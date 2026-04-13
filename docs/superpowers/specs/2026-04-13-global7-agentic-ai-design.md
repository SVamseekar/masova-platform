# Global-7: Agentic AI — The Manager That Never Sleeps
**Date:** 2026-04-13  
**Status:** Approved — ready for implementation planning  
**Depends on:** Global-6 (Aggregator Hub — complete)  
**Branch:** `feature/global-7-agentic-ai`

---

## Vision

Replace the cognitive load of being a store manager. The human becomes an approver, not an analyst. The AI watches the store at all times, acts autonomously on small things, and surfaces only the decisions that genuinely require a human.

The orchestrator operates in two modes based on time of day:
- **Service hours (10am–11pm store local time):** operational mode — watching live ops, reacting fast
- **Off-hours (11pm–10am):** business analysis mode — reading specialist findings, preparing proposals for the next day

---

## Architecture — Three Layers

```
Manager Interface (AgentControlCenterPage + chat + mobile cards)
         ↓
Orchestrator Agent (perceives, reasons, delegates, decides, executes, observes)
         ↓
7 Specialist Agents (domain experts — findings only, never write actions)
```

---

## Layer 1 — Foundation

### StoreMemory

Redis key `store_memory:{storeId}` — one document, two logical partitions.

**Operational layer** (updated every orchestrator cycle during service hours):
```
live_order_count        — orders in flight right now
kds_bottleneck          — items with >15min prep time in last hour
inventory_alerts        — items below par level right now
staff_on_shift          — who is clocked in
last_void_reason        — most recent void + who did it
```

**Business layer** (updated nightly, read during off-hours analysis):
```
baseline_metrics        — 30-day avg revenue, food cost %, labor %
supplier_patterns       — lead times, reliability scores per supplier
approval_history        — last 50 manager decisions (approved/rejected + action type)
action_outcomes         — results of past AUTO actions (did restock reduce waste?)
platform_pnl_trends     — per-aggregator margin trends last 30 days
specialist_findings     — last output per specialist domain
```

- **TTL:** 30-day, refreshed on every write
- **Snapshot:** Daily at 2am, MongoDB `store_memory_snapshots` collection (append-only, never deleted)

---

### StoreOrchestratorRegistry

Service class in `masova-support`. Owns the APScheduler job lifecycle for all stores.

- **Startup:** fetches all active stores from `GET /api/stores`, registers one APScheduler job per store with 5-minute interval trigger
- **Job ID format:** `orchestrator:{storeId}` — deterministic, no collisions
- **Dynamic registration:** listens on `masova.agents.exchange` routing keys `store.activated` and `store.deactivated`
  - `store.activated` → registers new job
  - `store.deactivated` → pauses (not removes) job
- **Registry state:** persisted in Redis `orchestrator_registry` key (job status per store) — survives process restart
- **Isolation:** each job is fully independent — one store's slow cycle never delays another

---

### 4 Internal Snapshot Endpoints

Authenticated via `X-Agent-API-Key` header. Never routed through api-gateway. Read-only — no writes ever.

| Service | Endpoint | Operational data | Business data |
|---|---|---|---|
| commerce-service | `GET /internal/store/{storeId}/snapshot` | Live orders, KDS queue, voids last hour | 24h order summary, aggregator breakdown, top items |
| logistics-service | `GET /internal/store/{storeId}/snapshot` | Items below par right now, pending deliveries | Waste last 7 days, supplier reliability, PO history |
| core-service | `GET /internal/store/{storeId}/snapshot` | Staff clocked in, shift gaps | Pending reviews, churn candidates, scheduled vs actual hours |
| intelligence-service | `GET /internal/store/{storeId}/snapshot` | Revenue vs forecast today | Food cost %, labor %, platform P&L delta vs last week |

All 4 are called concurrently via `asyncio.gather()` at the start of each orchestrator cycle.

---

## Layer 2 — Orchestrator Core

### Orchestrator Cycle (per store, every 5 minutes)

```
PERCEIVE → REASON → DELEGATE → AGGREGATE → DECIDE → EXECUTE → OBSERVE
```

**PERCEIVE**
Calls all 4 internal snapshot endpoints concurrently. Builds `StoreSnapshot` combining live + business data based on current mode (service hours vs off-hours). Updates `StoreMemory` operational layer.

**REASON**
Orchestrator `LlmAgent` reads `StoreSnapshot` + `StoreMemory`. Decides which specialist domains need attention this cycle. Not all 7 specialists run every cycle — orchestrator selects based on what changed since `last_findings` in `StoreMemory`.

**DELEGATE**
Invokes selected specialist `LlmAgent` instances. Each specialist receives only the data slice relevant to its domain — never the full snapshot.

**AGGREGATE**
Collects `SpecialistFinding` from each invoked specialist.

```python
@dataclass
class SpecialistFinding:
    domain: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    finding_text: str
    recommended_action: str
    action_params: dict
    confidence: float        # 0.0–1.0
    auto_executable: bool
```

**DECIDE**
Classifies each finding against the risk table. Routes to AUTO execution, PROPOSE, DISCUSS, or BLOCKED.

**EXECUTE**
AUTO actions call backend write endpoints directly via `X-Agent-API-Key`. Each AUTO action gets a 30-minute undo entry in Redis `undo_queue:{storeId}`.

**OBSERVE**
Writes action outcomes back to `StoreMemory.action_outcomes`. Updates `last_cycle_at`. Logs everything to `agent_action_log` MongoDB collection (append-only, never deleted).

---

### Risk Classification Table

| Action | Risk | Approval |
|---|---|---|
| Send restock reminder notification | AUTO | None |
| Post positive review response | AUTO | None |
| Create PO < €200 / ₹15,000 (pre-approved supplier) | AUTO | None |
| 86 a menu item when inventory hits zero | AUTO | None |
| Pause menu item (low demand signal) | PROPOSE | Manager tap |
| Price increase > 5% | PROPOSE | Manager tap |
| Create PO > €200 / ₹15,000 | PROPOSE | Manager tap |
| Draft shift schedule for next week | PROPOSE | Manager tap |
| Churn prevention campaign | PROPOSE | Manager tap |
| Adjust staff shift (live) | DISCUSS | Conversation |
| Any price decrease | DISCUSS | Conversation |
| Touch fiscal configuration | BLOCKED | Never |
| Delete any data | BLOCKED | Never |

---

### 7 Specialist Agents

Rebuilt as proper `LlmAgent` instances. Invoked by orchestrator only — no independent APScheduler schedules. Old cron jobs removed. Each returns one `SpecialistFinding`.

| Agent | Domain | Active mode | Input slice |
|---|---|---|---|
| `DemandForecastingSpecialist` | Demand prediction | Both | Order history, time of day, day of week, forecast vs actual |
| `InventorySpecialist` | Stock + suppliers | Both | Inventory levels, par levels, pending POs, supplier reliability |
| `ChurnSpecialist` | Customer retention | Off-hours | Churn candidates, last order dates, loyalty tier |
| `ReviewSpecialist` | Review response | Off-hours | Unresponded reviews rating ≤ 3, order context |
| `ShiftSpecialist` | Staff scheduling | Off-hours (Sun) | Demand forecast, staff availability, clock-in history |
| `KitchenCoachSpecialist` | Kitchen performance | Off-hours | Prep times, ticket counts, peak-hour throughput |
| `PricingSpecialist` | Dynamic pricing | Service hours | Live demand vs forecast, slow-moving items, margin data |

Each specialist has a narrow read-only tool set scoped to its domain. Cannot call tools outside its slice. Cannot call any write tool.

---

### Safety Constraints (Non-Negotiable)

1. Specialists never call write tools — findings only, orchestrator executes
2. No fiscal configuration touched by any agent at any level
3. No data deletion — pause/adjust only, never delete
4. No direct customer contact — always via `CustomerNotificationService`
5. Every AUTO action has 30-minute undo entry in Redis
6. If Gemini call fails — cycle ends silently, no fallback write actions
7. `POST /api/agents/pause?storeId=X` pauses that store's orchestrator within 5 minutes (next cycle skipped)
8. Proposals expire in 24 hours — expired proposals are never auto-executed

---

## Layer 3 — Proposal System + RabbitMQ

### ManagerProposal Document (MongoDB)

Collection: `manager_proposals`. Soft delete only — never hard deleted. Immutable after creation — corrections are new proposals.

```
id
storeId
createdAt
expiresAt                — createdAt + 24 hours
status                   — PENDING / APPROVED / REJECTED / EXPIRED / UNDONE
title                    — plain English summary
reasoning                — full orchestrator chain of thought
proposedActions          — list of { actionType, actionParams, estimatedImpact }
alternativeActions       — what else the manager could do
confidence               — 0.0–1.0
domain                   — which specialist raised this
severity                 — LOW / MEDIUM / HIGH / CRITICAL
approvedBy               — manager userId if approved
approvedAt
rejectedReason           — optional
```

---

### ProposalService

Lives in `masova-support`.

- Creates `ManagerProposal` documents from orchestrator DECIDE output
- Publishes `agent.proposal.created` to `masova.agents.exchange`
- Expiry job runs every 15 minutes — marks PENDING proposals older than 24h as EXPIRED (never executes them)
- `POST /agents/proposals/{id}/approve` — executes actions, publishes `agent.proposal.approved`
- `POST /agents/proposals/{id}/reject` — records reason, publishes `agent.proposal.rejected`, adds to `StoreMemory.approval_history`

---

### masova.agents.exchange

New RabbitMQ topic exchange.

| Routing key | Publisher | Subscribers | Purpose |
|---|---|---|---|
| `agent.proposal.created` | ProposalService | notification-service | Push notification to manager |
| `agent.proposal.approved` | ProposalService | intelligence-service | Track approval rate per domain |
| `agent.proposal.rejected` | ProposalService | intelligence-service | Track rejection rate, learn patterns |
| `agent.action.completed` | OrchestratorAgent | intelligence-service | Log AUTO action outcomes |
| `agent.action.undone` | OrchestratorAgent | intelligence-service | Log undo events |
| `agent.alert.critical` | OrchestratorAgent | notification-service | CRITICAL severity → SMS + push + email |
| `store.activated` | core-service | masova-support | Register new orchestrator job |
| `store.deactivated` | core-service | masova-support | Pause orchestrator job |

---

### Undo Window

Redis `undo_queue:{storeId}` — list of undo entries:
```
{ actionId, actionType, actionParams, reversalParams, executedAt, expiresAt (+30 min) }
```

- `AgentControlCenterPage` displays the live undo feed
- `POST /agents/actions/{actionId}/undo` → orchestrator calls reversal endpoint
- Entry deleted from Redis after 30 minutes — action is permanent after that

---

### agent_action_log (MongoDB)

Append-only, never deleted. Every orchestrator action — AUTO or proposal execution:

```
storeId, agentName, triggerType (SCHEDULED / MANUAL / PROPOSAL_APPROVED),
actionType, actionParams, outcome, durationMs, cycleId, createdAt
```

---

## Layer 4 — Interfaces

### AgentControlCenterPage (Manager Dashboard)

Three panels:

**Live Feed (left)**
- Scrolling log of everything the orchestrator did in the last 24 hours, per store
- Each entry: time, store, agent domain, action taken, outcome
- AUTO actions show undo button for 30 minutes — disappears when window expires
- CRITICAL alerts pinned at top until acknowledged

**Proposal Cards (centre)**
- One card per PENDING proposal, sorted by severity then createdAt
- Each card: title, reasoning (collapsed/expandable), confidence score, proposed action, alternative actions, expiry countdown
- Buttons: **Approve**, **Reject**, **Discuss**
- Discuss opens ConversationalManagerAgent chat pre-loaded with proposal context
- Expired proposals shown greyed out — not removed

**Agent Status (right)**
- Per-store, per-agent: last run time, last severity, action count today
- Store-level pause toggle
- Global pause button — pauses all agents across all stores instantly

---

### ConversationalManagerAgent

New `LlmAgent` in `masova-support` with full `StoreMemory` read access and proposal approval tools.

**Tools:**
```python
get_store_snapshot(storeId)          # full StoreMemory read
get_proposal(proposalId)             # load proposal context
approve_proposal(proposalId)         # execute proposal actions
reject_proposal(proposalId, reason)  # record rejection
get_action_log(storeId, hours)       # last N hours of actions
ask_specialist(domain, question)     # invoke specialist on demand
```

- Shows reasoning — tells manager which tool it called and why
- Exposed via existing `POST /agent/chat` endpoint
- Sessions keyed `manager:{userId}:{storeId}` in Redis DB 1
- When proposal loaded into context, opens with: *"I proposed X because [reasoning]. The data I used was [tool calls]. Want me to walk through the alternatives?"*

---

### Customer Support Agent Upgrade

Minimal changes to existing `LlmAgent`:

- Two new tools: `get_aggregator_order_status(aggregatorOrderId)`, `get_supported_languages()`
- System instruction addition: respond in customer's browser language if detectable, fall back to store locale
- Failed escalations → `POST /internal/support/tickets` on core-service → visible in AgentControlCenterPage Support Tickets tab

---

### MaSoVaCrewApp — Manager Role

Three additions:

- Proposal notification badge on manager home screen (count of PENDING proposals)
- Proposal cards screen — same data as web, mobile-optimised, one-tap Approve/Reject/Discuss
- Chat bottom sheet — ConversationalManagerAgent via FAB button, pre-loads current store context

---

### Internal Write Endpoints (X-Agent-API-Key, Never Through Gateway)

| Service | Endpoint | Action |
|---|---|---|
| commerce-service | `POST /internal/menu-items/{id}/pause` | 86 a menu item |
| commerce-service | `POST /internal/menu-items/{id}/resume` | Undo 86 |
| commerce-service | `POST /internal/menu-items/{id}/price` | Adjust price |
| logistics-service | `POST /internal/purchase-orders` | Create PO |
| logistics-service | `POST /internal/suppliers/{id}/message` | Send supplier message |
| core-service | `POST /internal/shifts/{id}/adjust` | Adjust shift |
| core-service | `POST /internal/campaigns` | Create campaign |
| core-service | `POST /internal/support/tickets` | Create support ticket |
| intelligence-service | `POST /internal/benchmarks/refresh` | Refresh store benchmarks |

All write endpoints:
- Validate `X-Agent-API-Key`
- Check store is not paused in `orchestrator_registry`
- Reject fiscal-related fields unconditionally
- Log to `agent_action_log`

---

## Database Changes

**MongoDB:**
- New collection: `manager_proposals` (soft delete, immutable after creation)
- New collection: `agent_action_log` (append-only, never deleted)
- New collection: `store_memory_snapshots` (append-only, daily snapshot)

**Redis:**
- `store_memory:{storeId}` — 30-day TTL, two-layer operational + business data
- `orchestrator_registry` — job status per store, survives restart
- `undo_queue:{storeId}` — 30-minute TTL per entry

**No new PostgreSQL migrations** — all agent data is document-oriented.

---

## Safety Floor Tests (Required Before Implementation Starts)

Per the master brief test strategy — these existing classes must be tested before Global-7 touches them:

- All 7 existing agent Python files — input/output contract tests
- `AnalyticsService` — verify current queries return expected shapes
- `CostAnalysisService` — document hardcoded ratio behaviour before replacing it

---

## Build Order (Layered)

```
Layer 1: StoreMemory + StoreOrchestratorRegistry + 4 snapshot endpoints
Layer 2: OrchestratorAgent + 7 SpecialistAgents + old cron jobs removed
Layer 3: ProposalService + masova.agents.exchange + undo window
Layer 4: AgentControlCenterPage + ConversationalManagerAgent + mobile + support upgrade
```

Each layer is independently testable before the next begins.
