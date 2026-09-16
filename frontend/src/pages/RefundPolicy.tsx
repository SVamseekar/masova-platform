import React from 'react'
import LegalPageLayout from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'
import { colors } from '../apps/ProductSite/tokens'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export const RefundPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Refund Policy" updated="July 10, 2026">
      <div className="space-y-10">
        <Section title="1. Scope">
          <p>
            This policy covers payments processed through MaSoVa for restaurant orders (customer app /
            web / POS card payments). It does not replace mandatory consumer rights in your country
            (e.g. EU consumer law).
          </p>
        </Section>

        <Section title="2. Restaurant-controlled refunds">
          <p>
            Individual restaurants decide whether and how much to refund. Managers approve full or
            partial refunds in the MaSoVa manager console. AI support agents may only propose refunds;
            they never auto-execute payouts.
          </p>
        </Section>

        <Section title="3. Timing">
          <ul className="list-disc pl-5 space-y-1">
            <li>Approved card refunds typically appear in 5–10 business days depending on the bank.</li>
            <li>Cash / COD orders are settled at the store — not via card networks.</li>
            <li>Aggregator (Wolt, Deliveroo, etc.) refunds follow that platform&apos;s process.</li>
          </ul>
        </Section>

        <Section title="4. Subscription (SaaS)">
          <p>
            MaSoVa software subscription billing (if applicable to your plan) is separate from diner
            order refunds. Contact <SupportEmailLink /> for billing disputes.
          </p>
        </Section>

        <Section title="5. Contact">
          <div
            className="rounded-xl p-4 text-xs space-y-1"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <p>
              For a specific order, contact the restaurant first. Platform issues:{' '}
              <SupportEmailLink />
            </p>
          </div>
        </Section>
      </div>
    </LegalPageLayout>
  )
}

export default RefundPolicy
