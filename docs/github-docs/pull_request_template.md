## What does this PR do?
<!-- One paragraph summary of the change -->

## Type of change
- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `chore` — maintenance / deps / config
- [ ] `refactor` — no behaviour change
- [ ] `docs` — documentation only
- [ ] `test` — tests only

## Services / areas changed
<!-- List each service or frontend area modified -->

## How to test
<!-- Steps to verify this works -->
1. 
2. 
3. 

## Checklist
- [ ] `mvn test` passes (if backend changed)
- [ ] `npm run test` passes (if frontend changed)
- [ ] No `.env` secrets committed
- [ ] Branch is up to date with `main`
- [ ] New endpoints have `@PreAuthorize` or explicit public annotation
- [ ] New MongoDB query fields have `@Indexed`
- [ ] Financial data uses soft-delete (no raw `DELETE`)
- [ ] TypeScript strict — no `any`, no `@ts-ignore`
- [ ] New components have loading, error, and empty states
- [ ] Currency displayed via `formatMoney(amount, currency, locale)` — not hardcoded `formatINR()`
- [ ] No hardcoded tax rates — VAT handled by `EuVatEngine` server-side
- [ ] New menu fields respect allergen declaration gate (`allergensDeclared`)
- [ ] GDPR: new personal data fields have corresponding anonymisation in erasure flow

## Screenshots (if UI changes)
<!-- Before / After -->
