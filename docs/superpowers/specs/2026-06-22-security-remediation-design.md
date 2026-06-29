# Security Remediation — Design Spec
**Date:** 2026-06-22
**Scope:** All 6 backend services, api-gateway, AI agent (masova-support), frontend, mobile apps (MaSoVaCrewApp + masova-mobile)
**Source audits:** [`full_codebase_security_audit.md`](../../full_codebase_security_audit.md), [`oauth_security_audit.md`](../../oauth_security_audit.md)
**Companion plans:** [Plan A — Backend/Gateway/AI-Agent/OAuth](../plans/2026-06-22-security-remediation-plan-a-backend.md), [Plan B — Frontend/Mobile](../plans/2026-06-22-security-remediation-plan-b-frontend-mobile.md)

---

## 1. Context

Two independent audits (an internal pass and an independent Cursor-agent re-verification) found 19 confirmed findings spanning every service in the platform plus the Google OAuth flow. Severity ranges from CRITICAL (unauthenticated order cancellation via chat, cross-store IDOR) to LOW (CORS wildcard, dead code). None of these are theoretical — each has a concrete exploit path against the live codebase as of 2026-06-22.

This spec does not re-derive the findings (see the source audits for full technical detail, code snippets, and line numbers). It defines:
- How the 19 findings are grouped into two execution plans
- The shared invariant each plan must restore
- Acceptance criteria per finding
- What is explicitly out of scope

## 2. Core Invariant Being Restored

**The server must never trust a client-supplied identity or scope claim that the JWT doesn't already cryptographically attest.**

Nearly every CRITICAL/HIGH finding is a variant of this single violation:
- Store IDOR: trusts `X-Selected-Store-Id` header instead of deriving allowed stores from the JWT subject
- Order IDOR: trusts the URL path `{orderId}` without checking it against the JWT's `X-User-Id`
- AI agent: trusts LLM-extracted `customer_id`/`order_id` from chat text instead of session identity
- AI agent privilege: trusts a single static `MANAGER` header for every request regardless of caller
- PIN lockout: trusts client-supplied `X-Forwarded-For` as the rate-limit key
- OAuth audience bypass: trusts the token's claims without enforcing the audience check when config is blank

Fixing each finding individually is necessary, but the unifying fix pattern is: **derive authorization context server-side from the verified JWT/session, never from a header, path param, or LLM-parsed argument that the caller controls.**

## 3. Grouping Rationale

| Group | Findings | Why grouped |
|---|---|---|
| **Plan A** | Backend IDOR (store + order), JWT secret fallback, PIN lockout, OTP PRNG, KDS public endpoint, Razorpay fallback creds, order tracking PII leak, CORS wildcard, AI agent auth + approval gate + IDOR, OAuth audience/email_verified/phone bugs | All Java/Python backend changes, deployed together on Dell, share the JWT/store-context trust boundary, highest severity and blast radius |
| **Plan B** | Receipt HTML injection, dead `useSecureAuth.ts` hook, mobile plaintext token storage, mobile manifest gaps | Frontend/RN-only, lower severity, no shared backend dependency, can ship independently on Mac without touching Dell services |

## 4. Acceptance Criteria (per finding — applies to both plans)

A finding is "done" only when:
1. The fix is implemented at the location cited in the audit
2. A test exists that fails on the pre-fix code and passes on the post-fix code (regression proof, not just a happy-path test)
3. `superpowers:code-reviewer` AND `feature-dev:code-reviewer` agents have reviewed the diff and all flagged issues are resolved (per existing project convention — see CLAUDE.md memory)
4. For backend changes: `mvn compile` and the affected service's test suite pass on Dell
5. No new finding is introduced (e.g. fixing store IDOR must not break legitimate multi-store manager access)

## 5. Explicitly Out of Scope

- **Rotating the exposed Razorpay test credentials** in the Razorpay dashboard — that's a manual action for the user, not a code change. Plan A removes the hardcoded fallback; rotation is called out as a follow-up action item, not an automated task.
- **Full token-storage migration on mobile to Keychain/Keystore** is scoped as "add the dependency and migrate the auth slice" in Plan B, not a general security hardening pass on either RN app.
- **Penetration testing / external security review** — these audits and this remediation are not a substitute for a third-party pentest before any production launch with real payments.
- **CSRF protection** — both audits confirm Bearer-token-only auth means CSRF is out of scope; not revisited here.
- **The AI agent's "propose, don't write" architecture redesign beyond gating the 3 specific tools** (`cancel_order`, `submit_complaint`, `request_refund`) named in the audit — a full approval-queue UI/workflow is a separate feature, not a security patch.

## 6. Risk of Not Fixing (why this can't wait for a future phase)

- Finding A1 (store IDOR) and A8 (AI agent manager-token) mean **any authenticated user today can read or mutate any other restaurant's data** — this is live in the current deployed state, not a future risk.
- Finding A9 (AI agent `cancel_order` with no approval) means **any chat message can cancel a real customer's real order right now** — directly contradicts the documented design invariant in CLAUDE.md ("Agents NEVER auto-write to the database").
- Finding A3 (JWT secret fallback) and A7 (Razorpay fallback) are **silent failure modes** — they only manifest if an env var is unset, which is exactly the kind of misconfiguration that happens during deployment/redeploy and would not be caught by normal functional testing.

## 7. Sequencing Constraint

Plan A must be executed in priority order as listed in the plan (not findings in audit order) because:
- The AI agent fixes (auth + approval gate) close the most exploitable path and have no dependency on other fixes
- The store/order IDOR fixes share a common helper (`StoreContextUtil` and equivalent order-ownership check) — doing them together avoids two passes over the same files
- OAuth fixes are isolated to `UserService.java` / `application.yml` and can be done in any order relative to the others, but are bundled into Plan A because they're the same codebase (core-service) and same JWT trust-boundary theme
