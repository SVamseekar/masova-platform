# Plan A — handoff (branch `security-remediation-plan-a`)

**PR:** https://github.com/SVamseekar/masova-platform/pull/15

Plan A Java/gateway work is complete on this branch. **Do not deploy Dell until Plan B ships.**

## Before Dell deploy (env on Dell)

- `JWT_SECRET` (≥64 chars) — all services
- Rotate Razorpay keys in dashboard; update `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (old keys denylisted)
- `RAZORPAY_WEBHOOK_SECRET` — real value for prod/Docker
- `GOOGLE_OAUTH_CLIENT_ID` — core-service
- `CORS_ALLOWED_ORIGINS` — if using a new Vercel preview URL

## Also merge (separate repo)

`masova-support` branch `security-remediation-plan-a` — agent auth + approval gates (Tasks 1–4).

## New session — start Plan B

```
Continue security remediation Plan B (frontend + mobile).
Read docs/superpowers/plans/2026-06-22-security-remediation-plan-b-frontend-mobile.md.
Plan A PR #15 is open — do not deploy Dell until Plan B is done.
Use a worktree on security-remediation-plan-b; deploy Dell + Vercel together after both merge.
```

## After Plan A + Plan B merge

1. Dell: restart all 6 backend services with updated `.env`
2. Vercel: deploy frontend
3. Smoke: auth, Google OAuth, orders, tracking page, KDS (JWT), payments, agent API key

## Optional later

- Signed tracking token on `/api/orders/track/{orderId}`
- Mark `docs/full_codebase_security_audit.md` remediated after smoke pass