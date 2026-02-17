import React from 'react';

export interface KPICardData {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
}

interface ManagerMetricTemplateProps {
  title?: string;
  kpis: KPICardData[];
  chart?: React.ReactNode;
  table?: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

const ManagerMetricTemplate: React.FC<ManagerMetricTemplateProps> = ({
  title,
  kpis,
  chart,
  table,
  actions,
  isLoading = false,
}) => {
  const textPrimary = '#1a1a2e';
  const textSecondary = '#64748b';
  const accent = '#e53e3e';
  const cardBg = '#ffffff';
  const border = '#e2e8f0';

  if (isLoading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              height: '80px',
              background: '#e2e8f0',
              borderRadius: '12px',
              animation: 'mmtPulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`@keyframes mmtPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {title && (
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: textPrimary, margin: 0 }}>{title}</h2>
      )}

      {/* KPI Row */}
      {kpis.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(kpis.length, 5)}, 1fr)`,
          gap: '14px',
        }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{
              background: cardBg,
              borderRadius: '12px',
              padding: '16px 18px',
              borderTop: `3px solid ${kpi.accentColor ?? accent}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}>
              <div style={{
                fontSize: '26px',
                fontWeight: '800',
                color: kpi.accentColor ?? textPrimary,
                lineHeight: 1,
                marginBottom: '4px',
              }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '12px', color: textSecondary, fontWeight: '500' }}>
                {kpi.label}
              </div>
              {kpi.sub && (
                <div style={{
                  fontSize: '11px',
                  marginTop: '4px',
                  color: kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : textSecondary,
                  fontWeight: '500',
                }}>
                  {kpi.trend === 'up' ? '↑ ' : kpi.trend === 'down' ? '↓ ' : ''}{kpi.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chart && (
        <div style={{
          background: cardBg,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          {chart}
        </div>
      )}

      {/* Actions (filters, export buttons) */}
      {actions && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}

      {/* Table */}
      {table && (
        <div style={{
          background: cardBg,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          border: `1px solid ${border}`,
        }}>
          {table}
        </div>
      )}
    </div>
  );
};

export default ManagerMetricTemplate;
