import React from 'react';
import { t, cardStyle, sectionTitleStyle } from './manager-tokens';
import { useGetFiscalSummaryQuery, useGetSigningFailuresQuery } from '../../store/api/fiscalApi';

const SIGNER_LABELS: Record<string, string> = {
  TSE: 'Germany TSE',
  NF525: 'France NF525',
  RT: 'Italy RT Device',
  FDM: 'Belgium FDM',
  NTCA: 'Hungary NTCA',
  MTD: 'UK Making Tax Digital',
  PASSTHROUGH: 'No signing required',
};

interface Props {
  storeId: string;
}

const FiscalCompliancePage: React.FC<Props> = ({ storeId }) => {
  const {
    data: summaries = [],
    isLoading: summaryLoading,
    error: summaryError,
  } = useGetFiscalSummaryQuery(storeId, { skip: !storeId });

  const {
    data: failures = [],
    isLoading: failuresLoading,
    error: failuresError,
  } = useGetSigningFailuresQuery(storeId, { skip: !storeId });

  const failureBadge: React.CSSProperties = {
    background: '#E53E3E',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600,
    marginLeft: 8,
  };

  if (!storeId) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: t.gray }}>Select a store to view fiscal compliance data.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ ...sectionTitleStyle, marginBottom: 24 }}>Fiscal Compliance</h2>

      {/* Signing summary */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ fontFamily: t.font, fontWeight: 600, color: t.black, marginBottom: 12 }}>
          Signing Status
        </h3>
        {summaryLoading && <p style={{ color: t.gray }}>Loading...</p>}
        {summaryError && <p style={{ color: '#E53E3E' }}>Failed to load fiscal summary.</p>}
        {!summaryLoading && summaries.length === 0 && (
          <p style={{ color: t.gray }}>No fiscal records for this store yet.</p>
        )}
        {summaries.map((s) => (
          <div key={s.storeId + s.signerSystem} style={{ marginBottom: 8 }}>
            <strong style={{ color: t.black }}>{SIGNER_LABELS[s.signerSystem] ?? s.signerSystem}</strong>
            {' — '}
            <span style={{ color: t.gray }}>{s.totalSigned} signed</span>
            {s.failedLast7Days > 0 && (
              <span style={failureBadge}>{s.failedLast7Days} failed (7d)</span>
            )}
            {s.lastSignedAt && (
              <span style={{ color: t.gray, fontSize: 12, marginLeft: 8 }}>
                Last: {new Date(s.lastSignedAt).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Signing failures requiring manager resolution */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ fontFamily: t.font, fontWeight: 600, color: t.black, marginBottom: 12 }}>
          Receipt Signing Failures
          {failures.length > 0 && (
            <span style={failureBadge}>{failures.length}</span>
          )}
        </h3>
        {failuresLoading && <p style={{ color: t.gray }}>Loading...</p>}
        {failuresError && <p style={{ color: '#E53E3E' }}>Failed to load failures.</p>}
        {!failuresLoading && failures.length === 0 && (
          <p style={{ color: t.gray }}>No signing failures — all receipts signed successfully.</p>
        )}
        {failures.map((f) => (
          <div
            key={f.orderId}
            style={{
              background: t.grayLight,
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 8,
              borderLeft: '4px solid #E53E3E',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: t.black }}>Order {f.orderId}</strong>
                <span style={{ color: t.gray, fontSize: 12, marginLeft: 8 }}>
                  {SIGNER_LABELS[f.signerSystem] ?? f.signerSystem} ({f.countryCode})
                </span>
              </div>
              <span style={{ color: t.gray, fontSize: 12 }}>
                {new Date(f.occurredAt).toLocaleString()}
              </span>
            </div>
            <p style={{ color: '#E53E3E', marginTop: 4, fontSize: 13 }}>{f.signingError}</p>
          </div>
        ))}
      </div>

      {/* UK MTD section — shown only for GB stores */}
      {summaries.some((s) => s.signerSystem === 'MTD') && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h3 style={{ fontFamily: t.font, fontWeight: 600, color: t.black, marginBottom: 8 }}>
            UK Making Tax Digital
          </h3>
          <p style={{ color: t.gray, marginBottom: 12 }}>
            Quarterly VAT ledger submission to HMRC. Your accountant can download the MTD-compatible
            JSON or submit directly.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                background: t.orange, color: t.white, border: 'none', borderRadius: 6,
                padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
              }}
              onClick={() => alert('MTD submission — Phase 2 feature')}
            >
              Submit to HMRC
            </button>
            <button
              style={{
                background: 'transparent', color: t.orange, border: `1px solid ${t.orange}`,
                borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
              }}
              onClick={() => alert('Download MTD export — Phase 2 feature')}
            >
              Download MTD JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiscalCompliancePage;
