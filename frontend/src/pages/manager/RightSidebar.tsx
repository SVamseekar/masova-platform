import React from 'react';
import { t, cardStyle, sectionTitleStyle } from './manager-tokens';
import {
  useGetTopProductsQuery,
  useGetExecutiveSummaryQuery,
  useGetDriverStatusQuery,
  useGetStaffLeaderboardQuery,
  useGetTodaySalesMetricsQuery,
} from '../../store/api/analyticsApi';
import { useGetActiveStoreSessionsQuery } from '../../store/api/sessionApi';
import { useGetStoreOrdersQuery, useGetActiveDeliveriesCountQuery } from '../../store/api/orderApi';
import { useListKioskAccountsQuery } from '../../store/api/kioskApi';
import { useGetCustomerStatsQuery } from '../../store/api/customerApi';

interface Props {
  section: string;
  storeId: string;
}

const miniCard: React.CSSProperties = { ...cardStyle, padding: 14, marginBottom: 10 };
const label: React.CSSProperties = { fontSize: 12, color: t.gray, margin: 0 };
const value = (color?: string): React.CSSProperties => ({ fontSize: 20, fontWeight: 700, color: color || t.black, margin: '4px 0 0 0' });
const listItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.grayLight}`, fontSize: 13 };
const dot = (color: string): React.CSSProperties => ({ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8 });

const Heading = ({ title }: { title: string }) => (
  <h4 style={{ ...sectionTitleStyle, marginBottom: 12, marginTop: 20 }}>{title}</h4>
);

const Stat = ({ l, v, c }: { l: string; v: string | number; c?: string }) => (
  <div style={miniCard}><p style={label}>{l}</p><p style={value(c)}>{v}</p></div>
);

// === DASHBOARD ===
const DashboardSidebar = ({ storeId }: { storeId: string }) => {
  const { data: topProducts } = useGetTopProductsQuery({ storeId, period: 'WEEKLY', sortBy: 'quantity' }, { skip: !storeId });
  const { data: sessions } = useGetActiveStoreSessionsQuery(storeId, { skip: !storeId });

  return (
    <>
      <Heading title="Trending Menus" />
      <div style={miniCard}>
        {topProducts?.topProducts?.slice(0, 5).map((p: any, i: number) => (
          <div key={p.itemId} style={{ ...listItem, borderBottom: i < 4 ? `1px solid ${t.grayLight}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.gray, width: 18 }}>#{p.rank}</span>
              <span style={{ color: t.black, fontWeight: 500 }}>{p.itemName}</span>
            </div>
            <span style={{ fontSize: 12, color: t.green, fontWeight: 600 }}>{p.quantitySold} sold</span>
          </div>
        )) || <p style={{ fontSize: 13, color: t.grayMuted }}>No data available</p>}
      </div>

      <Heading title="Recent Activity" />
      <div style={miniCard}>
        {sessions?.slice(0, 5).map((s: any, i: number) => (
          <div key={s.id} style={{ ...listItem, borderBottom: i < 4 ? `1px solid ${t.grayLight}` : 'none' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: t.black }}>{s.employeeName}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: t.grayMuted }}>{s.role}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dot(s.isActive ? t.green : t.grayMuted)} />
              <span style={{ fontSize: 11, color: s.isActive ? t.green : t.grayMuted }}>{s.isActive ? 'Active' : 'Offline'}</span>
            </div>
          </div>
        )) || <p style={{ fontSize: 13, color: t.grayMuted }}>No active sessions</p>}
      </div>
    </>
  );
};

// === ORDERS ===
const OrdersSidebar = ({ storeId }: { storeId: string }) => {
  const { data: orders } = useGetStoreOrdersQuery(storeId, { skip: !storeId });
  const { data: activeDeliveries } = useGetActiveDeliveriesCountQuery(storeId, { skip: !storeId });

  const liveCount = orders?.filter(o => !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(o.status)).length ?? 0;
  const pendingPayments = orders?.filter(o => o.paymentStatus === 'PENDING').length ?? 0;
  const todayRefunds = orders?.filter(o => {
    const today = new Date().toISOString().split('T')[0];
    return o.paymentStatus === 'REFUNDED' && o.updatedAt?.startsWith(today);
  }).length ?? 0;

  return (
    <>
      <Heading title="Order Snapshot" />
      <Stat l="Live Orders" v={liveCount} c={t.orange} />
      <Stat l="Pending Payments" v={pendingPayments} c={t.yellow} />
      <Stat l="Today's Refunds" v={todayRefunds} c={t.red} />
      <Stat l="Active Deliveries" v={activeDeliveries?.count ?? 0} c={t.blue} />
    </>
  );
};

// === INVENTORY ===
const InventorySidebar = () => (
  <>
    <Heading title="Stock Alerts" />
    <div style={{ padding: '10px 12px', background: t.orangeLight, borderRadius: t.radius.sm, fontSize: 12, color: t.orangeDark, marginBottom: 8, lineHeight: 1.4 }}>
      Check the Stock tab for items below reorder threshold.
    </div>
    <Heading title="Quick Stats" />
    <Stat l="Pending Purchase Orders" v="--" />
    <Stat l="Waste This Week" v="--" />
    <p style={{ fontSize: 12, color: t.grayMuted, lineHeight: 1.5, marginTop: 16 }}>
      Detailed inventory metrics are displayed in the Stock, Purchase Orders, and Waste tabs.
    </p>
  </>
);

// === OPERATIONS ===
const OperationsSidebar = ({ storeId }: { storeId: string }) => {
  const { data: driverStatus } = useGetDriverStatusQuery(storeId, { skip: !storeId });
  const { data: kiosks } = useListKioskAccountsQuery(storeId, { skip: !storeId });

  const onlineKiosks = kiosks?.filter((k: any) => k.isActive).length ?? 0;
  const offlineKiosks = kiosks?.filter((k: any) => !k.isActive).length ?? 0;

  return (
    <>
      <Heading title="Driver Status" />
      <Stat l="Total Drivers" v={driverStatus?.totalDrivers ?? 0} />
      <Stat l="Available" v={driverStatus?.availableDrivers ?? 0} c={t.green} />
      <Stat l="On Delivery" v={driverStatus?.busyDrivers ?? 0} c={t.orange} />

      <Heading title="Kiosk Status" />
      <div style={miniCard}>
        <div style={listItem}>
          <div style={{ display: 'flex', alignItems: 'center' }}><span style={dot(t.green)} /><span style={{ fontSize: 13, color: t.black }}>Online</span></div>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.green }}>{onlineKiosks}</span>
        </div>
        <div style={{ ...listItem, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><span style={dot(t.red)} /><span style={{ fontSize: 13, color: t.black }}>Offline</span></div>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.red }}>{offlineKiosks}</span>
        </div>
      </div>
    </>
  );
};

// === PEOPLE ===
const PeopleSidebar = ({ storeId }: { storeId: string }) => {
  const { data: sessions } = useGetActiveStoreSessionsQuery(storeId, { skip: !storeId });
  const { data: leaderboard } = useGetStaffLeaderboardQuery({ storeId, period: 'TODAY' }, { skip: !storeId });
  const { data: customerStats } = useGetCustomerStatsQuery(storeId, { skip: !storeId });

  const onShiftCount = sessions?.filter((s: any) => s.isActive).length ?? 0;
  const topPerformer = leaderboard?.rankings?.[0];

  return (
    <>
      <Heading title="Staff Today" />
      <Stat l="On Shift Now" v={onShiftCount} c={t.green} />
      {topPerformer && (
        <>
          <Heading title="Top Performer" />
          <div style={miniCard}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.black }}>{topPerformer.staffName}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: t.gray }}>
              {topPerformer.ordersProcessed} orders | ₹{topPerformer.salesGenerated.toFixed(0)} sales
            </p>
            <div style={{ marginTop: 8, padding: '4px 10px', background: t.orangeLight, borderRadius: t.radius.sm, display: 'inline-block', fontSize: 11, fontWeight: 600, color: t.orange }}>
              {topPerformer.performanceLevel}
            </div>
          </div>
        </>
      )}
      <Heading title="Customer Stats" />
      <Stat l="Total Customers" v={customerStats?.totalCustomers ?? 0} />
      <Stat l="Active Customers" v={customerStats?.activeCustomers ?? 0} c={t.green} />
    </>
  );
};

// === ANALYTICS ===
const AnalyticsSidebar = ({ storeId }: { storeId: string }) => {
  const { data: summary } = useGetExecutiveSummaryQuery(storeId, { skip: !storeId });
  const { data: salesMetrics } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });

  const trendColor = (change?: number) => (change ?? 0) >= 0 ? t.green : t.red;

  return (
    <>
      <Heading title="Key KPIs" />
      {summary ? (
        <>
          <div style={miniCard}>
            <p style={label}>Revenue</p>
            <p style={value(trendColor(summary.revenue.change))}>₹{summary.revenue.total.toLocaleString()}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: trendColor(summary.revenue.change) }}>
              {summary.revenue.change >= 0 ? '+' : ''}{summary.revenue.change.toFixed(1)}%
            </p>
          </div>
          <div style={miniCard}>
            <p style={label}>Orders</p>
            <p style={value(trendColor(summary.orders.change))}>{summary.orders.total.toLocaleString()}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: trendColor(summary.orders.change) }}>
              {summary.orders.change >= 0 ? '+' : ''}{summary.orders.change.toFixed(1)}%
            </p>
          </div>
        </>
      ) : (
        <Stat l="Today's Orders" v={salesMetrics?.todayOrderCount ?? '--'} />
      )}

      {summary?.topInsights && summary.topInsights.length > 0 && (
        <>
          <Heading title="Insights" />
          {summary.topInsights.slice(0, 4).map((insight: string, i: number) => (
            <div key={i} style={{ padding: '10px 12px', background: t.orangeLight, borderRadius: t.radius.sm, fontSize: 12, color: t.orangeDark, marginBottom: 8, lineHeight: 1.4 }}>
              {insight}
            </div>
          ))}
        </>
      )}
    </>
  );
};

// === MAIN ===
const sectionLabels: Record<string, string> = {
  dashboard: 'Overview', orders: 'Orders & Payments', inventory: 'Inventory & Supply',
  operations: 'Operations', people: 'People & Marketing', analytics: 'Analytics & Reports',
};

const RightSidebar: React.FC<Props> = ({ section, storeId }) => {
  const content = () => {
    switch (section) {
      case 'dashboard': return <DashboardSidebar storeId={storeId} />;
      case 'orders': return <OrdersSidebar storeId={storeId} />;
      case 'inventory': return <InventorySidebar />;
      case 'operations': return <OperationsSidebar storeId={storeId} />;
      case 'people': return <PeopleSidebar storeId={storeId} />;
      case 'analytics': return <AnalyticsSidebar storeId={storeId} />;
      default: return <DashboardSidebar storeId={storeId} />;
    }
  };

  return (
    <div style={{ padding: '24px 16px', fontFamily: t.font, overflowY: 'auto', height: '100%' }}>
      <h3 style={{ ...sectionTitleStyle, fontSize: 16, marginBottom: 4 }}>Quick Info</h3>
      <p style={{ fontSize: 12, color: t.grayMuted, margin: '0 0 16px 0' }}>{sectionLabels[section] || 'Overview'}</p>
      {content()}
    </div>
  );
};

export default RightSidebar;
