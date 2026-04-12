import React, { useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import { useGetStoreOrdersQuery, type Order } from '../../store/api/orderApi';
import { cardStyle, t, sectionTitleStyle, tableCellStyle, tableHeaderStyle } from './manager-tokens';

type Platform = 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';
const PLATFORMS: Platform[] = ['WOLT', 'DELIVEROO', 'JUST_EAT', 'UBER_EATS'];
const PLATFORM_COLORS: Record<Platform, string> = {
  WOLT: '#009DE0', DELIVEROO: '#00CCBC', JUST_EAT: '#FF8000', UBER_EATS: '#000',
};
const PLATFORM_LABELS: Record<Platform, string> = {
  WOLT: 'Wolt', DELIVEROO: 'Deliveroo', JUST_EAT: 'Just Eat', UBER_EATS: 'Uber Eats',
};

interface PlatformSummary {
  platform: Platform;
  orderCount: number;
  grossRevenue: number;
  totalCommission: number;
  netPayout: number;
  marginPercent: number;
  topItems: Array<{ name: string; count: number }>;
}

function buildPlatformSummary(orders: Order[]): PlatformSummary[] {
  return PLATFORMS.map((platform) => {
    const platformOrders = orders.filter((o) => o.orderSource === platform);
    const grossRevenue = platformOrders.reduce((s, o) => s + (o.total || 0), 0);
    const totalCommission = platformOrders.reduce((s, o) => s + (o.aggregatorCommission || 0), 0);
    const netPayout = platformOrders.reduce((s, o) => s + (o.aggregatorNetPayout || grossRevenue - totalCommission), 0);
    const marginPercent = grossRevenue > 0 ? ((netPayout / grossRevenue) * 100) : 0;

    const itemCounts: Record<string, number> = {};
    platformOrders.forEach((o) => o.items?.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    }));
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return { platform, orderCount: platformOrders.length, grossRevenue, totalCommission, netPayout, marginPercent, topItems };
  });
}

const PlatformPnLPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  const { data: orders = [], isLoading, error } = useGetStoreOrdersQuery(storeId, { skip: !storeId });

  const directOrders = useMemo(() =>
    orders.filter((o) => !o.orderSource || o.orderSource === 'MASOVA'), [orders]);
  const directRevenue = directOrders.reduce((s, o) => s + (o.total || 0), 0);

  const summaries = useMemo(() => buildPlatformSummary(orders), [orders]);
  const totalAggregatorRevenue = summaries.reduce((s, p) => s + p.grossRevenue, 0);
  const totalNetPayout = summaries.reduce((s, p) => s + p.netPayout, 0);
  const totalCommission = summaries.reduce((s, p) => s + p.totalCommission, 0);

  const fmt = (n: number) => n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (isLoading) return <div style={{ padding: 24 }}>Loading platform P&L…</div>;
  if (error) return <div style={{ padding: 24, color: t.red }}>Failed to load orders.</div>;
  if (!storeId) return <div style={{ padding: 24 }}>Select a store to view platform P&L.</div>;

  const selectedSummary = activePlatform ? summaries.find((s) => s.platform === activePlatform) : null;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={sectionTitleStyle}>Platform P&L</h2>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Direct Revenue</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0' }}>{fmt(directRevenue)}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Aggregator Gross</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0' }}>{fmt(totalAggregatorRevenue)}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Commission</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0', color: t.red }}>{fmt(totalCommission)}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Payout</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0', color: t.green }}>{fmt(totalNetPayout)}</p>
        </div>
      </div>

      {/* Per-platform table */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Platform', 'Orders', 'Gross Revenue', 'Commission', 'Net Payout', 'Margin %', ''].map((h) => (
                <th key={h} style={tableHeaderStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr
                key={s.platform}
                style={{ cursor: 'pointer' }}
                onClick={() => setActivePlatform(s.platform === activePlatform ? null : s.platform)}
              >
                <td style={tableCellStyle}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: PLATFORM_COLORS[s.platform], color: '#fff' }}>
                    {PLATFORM_LABELS[s.platform]}
                  </span>
                </td>
                <td style={tableCellStyle}>{s.orderCount}</td>
                <td style={tableCellStyle}>{fmt(s.grossRevenue)}</td>
                <td style={{ ...tableCellStyle, color: t.red }}>{fmt(s.totalCommission)}</td>
                <td style={{ ...tableCellStyle, color: t.green }}>{fmt(s.netPayout)}</td>
                <td style={tableCellStyle}>{s.marginPercent.toFixed(1)}%</td>
                <td style={tableCellStyle}>
                  <span style={{ fontSize: 12, color: t.orange }}>
                    {activePlatform === s.platform ? 'Hide ▲' : 'Details ▼'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded detail: top items for selected platform */}
      {selectedSummary && (
        <div style={{ ...cardStyle, borderTop: `4px solid ${PLATFORM_COLORS[selectedSummary.platform]}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>
            Top Items — {PLATFORM_LABELS[selectedSummary.platform]}
          </h3>
          {selectedSummary.topItems.length === 0 ? (
            <p style={{ color: t.gray }}>No orders for this platform yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Item</th>
                  <th style={tableHeaderStyle}>Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {selectedSummary.topItems.map((item) => (
                  <tr key={item.name}>
                    <td style={tableCellStyle}>{item.name}</td>
                    <td style={tableCellStyle}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Direct vs aggregator margin comparison */}
          <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>Margin Comparison</p>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <span style={{ fontSize: 11, color: t.gray }}>Direct orders</span>
                <p style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 0', color: t.green }}>100%</p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: t.gray }}>{PLATFORM_LABELS[selectedSummary.platform]}</span>
                <p style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 0', color: t.orange }}>
                  {selectedSummary.marginPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformPnLPage;
