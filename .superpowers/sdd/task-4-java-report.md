# Task 4 (Java half) — Report: Manager-approval gates for order cancellation and refunds

## Summary
Added manager-approval gates so the AI agent (or a customer) can only **request** an order
cancellation or a refund; neither takes effect until a manager explicitly approves. Implemented
in commerce-service (orders) and payment-service (refunds). Purely additive — existing
staff/manager direct-cancel and manager-initiated refund flows are unchanged.

---

## Part A — Order cancellation (commerce-service)

### Design chosen (matches brief's preferred "least invasive" approach)
Added 4 MongoDB-only fields to `Order` rather than overloading `OrderStatus`, so a pending
cancellation request does **not** change the order's lifecycle status — the kitchen still sees
it, it keeps cooking — until a manager approves:
- `cancellationRequested` (boolean, `@Indexed`)
- `cancellationRequestReason` (String)
- `cancellationRequestedBy` (String — customer id / "AGENT")
- `cancellationRequestedAt` (LocalDateTime)

Kept these MongoDB-only (no Flyway migration). Rationale: the existing `cancelOrder`/status-
transition paths do **not** mirror status changes to PostgreSQL today (only order *creation* and
*item edits* dual-write). Adding PG columns I'd never write to from these paths would be dead
schema. The cancellation-request flag is operational workflow metadata, not financial data.

### New service methods (`OrderService`)
- `requestCancellation(orderId, reason, requestedBy)` — sets the flag; status unchanged;
  publishes an `OrderStatusChangedEvent` with newStatus marker `CANCELLATION_REQUESTED`
  (same status in/out, follows the existing publish pattern — no new publisher invented).
  Rejects duplicate pending requests, already-cancelled, and delivered orders.
- `approveCancellationRequest(orderId)` — clears the flag and delegates to the existing
  `cancelOrder(orderId, reason)` (real cancel, real event, notifications).
- `rejectCancellationRequest(orderId, rejectionReason)` — clears the flag, order continues;
  publishes `CANCELLATION_REJECTED` marker event.

### New endpoints (`OrderController`)
- `POST /api/orders/{orderId}/cancel-request` — `CUSTOMER, MANAGER, ASSISTANT_MANAGER, STAFF`.
  **Ownership check**: a `CUSTOMER` may only request cancellation of their own order
  (verified against `order.customerId` vs `X-User-Id`); throws `AccessDeniedException` → 403.
  Requester recorded as `X-User-Id` (or user type, e.g. "AGENT", if no id).
- `POST /api/orders/{orderId}/cancel-request/approve` — `MANAGER, ASSISTANT_MANAGER`.
- `POST /api/orders/{orderId}/cancel-request/reject` — `MANAGER, ASSISTANT_MANAGER`.

### Change to existing DELETE
`DELETE /api/orders/{orderId}` `@PreAuthorize` changed from
`CUSTOMER, MANAGER, ASSISTANT_MANAGER, STAFF` → `MANAGER, ASSISTANT_MANAGER, STAFF`
(removed CUSTOMER). The direct-cancel path is now staff/manager only; customers go through
the request gate. Verified no customer-facing frontend caller of DELETE order — only manager
pages (`OrdersSection.tsx`, `OrderManagementPage.tsx`) use `useCancelOrderMutation`.

Added an `@ExceptionHandler(AccessDeniedException.class)` → 403 (previously such exceptions
fell through to the generic `RuntimeException` handler returning 400; 403 is more correct and
no existing test asserted the old behavior).

---

## Part B — Refunds (payment-service)

### Enum change (`Refund.RefundStatus`)
Added `PENDING_APPROVAL` (agent/customer-requested, no money moved) and `REJECTED`
(manager-rejected pending refund).

### Distinguishing agent vs manager refunds — chose **separate endpoints**, not header sniffing
The brief floated distinguishing agent vs manager at the same endpoint via `X-User-Type: AGENT`.
I found a cleaner, less error-prone split: a dedicated `POST /api/payments/refund/request`
endpoint for the gated path, leaving the existing `POST /api/payments/refund` (manager,
immediate) completely untouched. This is unambiguous and avoids depending on a header that
"arrives but isn't enforced server-side yet" (brief's own caveat). The agent's Python half just
calls `/request` instead of `/`.

### Service refactor (`RefundService`)
Extracted shared validation (`loadAndValidateRefundable` / `validateRefundable`) and execution
(`executeRefund`, `applyRazorpayStatus`) from the original `initiateRefund`, then added:
- `requestRefundApproval(request)` — validates against the transaction (caller gets immediate
  feedback on bad amounts) but creates the `Refund` in `PENDING_APPROVAL` with **no Razorpay
  call** and **no transaction/order mutation**. No money moves.
- `approveRefund(refundId, approvedBy)` — re-validates against **current** state, then executes
  Razorpay **on the existing pending record** (never creates a duplicate refund row), updates
  the transaction and order. Rejects non-PENDING_APPROVAL refunds (double-process guard).
- `rejectRefund(refundId, rejectedBy, reason)` — marks `REJECTED`, no money moves.

Double-refund prevention: `validateRefundable` only subtracts `PROCESSED` refunds from the
available amount (pending requests don't reserve funds); `approveRefund` re-runs this against
live data, so a refund requested when funds were available but approved after another refund
drained them is correctly blocked.

### New endpoints (`RefundController`)
- `POST /api/payments/refund/request` — `CUSTOMER, MANAGER, ASSISTANT_MANAGER, STAFF`.
  Stamps `initiatedBy` from `X-User-Id`. Returns 400 with `{error}` on invalid request.
- `POST /api/payments/refund/{refundId}/approve` — `MANAGER, ASSISTANT_MANAGER`.
- `POST /api/payments/refund/{refundId}/reject` — `MANAGER, ASSISTANT_MANAGER`.
Existing `POST /api/payments/refund` unchanged (manager UI `RefundManagementPage.tsx` uses it
via `useInitiateRefundMutation` → `POST /refund`; confirmed additive, not broken).

---

## Findings vs. brief's assumptions (corrections)

1. **Complaints are NOT gated (brief assumption wrong).** Brief said to "verify" complaints
   default to `PENDING`. They do **not**: `ReviewService.createReview()` hardcodes
   `.status(Review.ReviewStatus.APPROVED)` ("// Auto-approve for now"), and there is no separate
   `/reviews/complaints` endpoint — the agent's `submit_complaint` posts to the standard create
   path which auto-approves. **The complaint gate (Task 4's third leg) is open.** My Java brief
   scoped the "Write tests" section to Order + Refund only and said complaints need a Java change
   only "if they don't already" gate — they don't. I did **not** silently expand into core-service;
   flagging it here as a CONCERN for a follow-up (it's a core-service change: default complaint
   reviews to `PENDING`, or add an `isComplaint`-aware status).
2. **Order is dual-written, Refund is MongoDB-only** — confirmed. Cancellation-request fields kept
   MongoDB-only as explained above; no Flyway migration needed (consistent with how the existing
   cancel path behaves).
3. **No existing ownership helper to mirror** — `OrderController.getOrder()`/`cancelOrder()` had
   no ownership check; `validateAndGetStoreId` only checks store, not order ownership. Added the
   ownership check inline (cheap, correct regardless of Task 6 sequencing, per brief).

## TDD evidence
Wrote tests describing desired pending-approval behavior, then implemented:
- `OrderServiceCancellationRequestTest` (7): request doesn't change status; duplicate/delivered
  rejected; approve → CANCELLED; reject clears flag + keeps status; no-pending guards.
- `OrderControllerCancellationRequestTest` (5): owner can request; non-owner → 403 (service not
  called); agent routes to request (never direct cancel); approve/reject routing.
- `RefundServiceApprovalTest` (8): request → PENDING_APPROVAL, no Razorpay; request validates
  amount; manager-initiated still immediate; approve executes via Razorpay; approve rejects
  non-pending (no double-process); reject → REJECTED no money; approve blocked when funds
  exhausted.
- `RefundControllerApprovalTest` (4): request/approve/reject routing + 400 on invalid.

## Verification (JAVA_HOME = temurin-21)
- `mvn test -pl commerce-service`: **412 tests, 0 failures, 0 errors** — BUILD SUCCESS
- `mvn test -pl payment-service`: **176 tests, 0 failures, 0 errors, 1 skipped (pre-existing)** —
  BUILD SUCCESS

## Self-review
- Requesting cancellation/refund leaves order/payment functioning normally until a manager acts. ✔
- Existing manager-initiated refund flow (`POST /refund`) unmodified and still works. ✔
- Existing staff/manager DELETE direct-cancel works for MANAGER/ASSISTANT_MANAGER/STAFF. ✔
  (CUSTOMER intentionally removed — no customer caller existed.)
- Ownership check present on customer-facing cancel-request endpoint. ✔
- All new endpoints have `@PreAuthorize`, validation, structured `{error}` responses. ✔
- Refund state never double-processed: approve re-validates + guards on PENDING_APPROVAL +
  executes on the existing record (no duplicate row); pending requests don't reserve funds. ✔
- Swallowed-exception handlers log `log.warn(...)` with order/transaction/user context. ✔

## Concerns
1. **Complaint gate still open** (see finding #1) — out of this brief's Part A/B scope but is the
   third leg of the overall Task 4. Recommend a follow-up core-service change.
2. `X-User-Type: AGENT` is not yet enforced server-side (brief noted this). My design doesn't rely
   on it — the agent simply targets the `/request` and `/cancel-request` endpoints. If stronger
   enforcement is wanted later (prevent the agent from ever hitting the manager `approve`
   endpoints), gateway-level role mapping for the agent token is the right place, not these
   handlers.
3. Pre-existing frontend `paymentApi.ts` uses sub-path refund GETs (`/refund/transaction/{id}`)
   that don't match the canonical query-param controller — pre-existing, unrelated to this task.
