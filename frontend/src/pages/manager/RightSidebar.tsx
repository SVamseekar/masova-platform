import React from 'react';
import { t, cardStyle, sectionTitleStyle } from './manager-tokens';
import { useAppSelector } from '../../store/hooks';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import {
  useGetTopProductsQuery,
  useGetExecutiveSummaryQuery,
  useGetDriverStatusQuery,
  useGetStaffLeaderboardQuery,
  useGetTodaySalesMetricsQuery,
} from '../../store/api/analyticsApi';
import { useGetActiveStoreSessionsQuery } from '../../store/api/sessionApi';
import { useGetStoreOrdersQuery, useGetActiveDeliveriesCountQuery } from '../../store/api/orderApi';
import { useListKioskAccountsQuery, type KioskAccount } from '../../store/api/kioskApi';
import type { WorkingSession } from '../../store/api/sessionApi';
import type { ProductRankingItem } from '../types/analytics';
import { useGetCustomerStatsQuery } from '../../store/api/customerApi';
import {
  useGetLowStockItemsQuery,
  useGetOutOfStockItemsQuery,
  useGetPendingApprovalPurchaseOrdersQuery,
  useGetWasteRecordsByDateRangeQuery,
} from '../../store/api/inventoryApi';
import { useGetSigningFailuresQuery } from '../../store/api/fiscalApi';

interface Props {
  section: string;
  storeId: string;
}

const miniCard: React.CSSProperties = { ...cardStyle, padding: 14, marginBottom: 10 };
const label: React.CSSProperties = { fontSize: 12, color: t.gray, margin: 0 };
const value = (color?: string): React.CSSProperties => ({
  fontSize: 20, fontWeight: 700, color: color || t.black, margin: '4px 0 0 0',
});
const listItem: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', borderBottom: `1px solid ${t.grayLight}`, fontSize: 13,
};
const dot = (color: string): React.CSSProperties => ({
  width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8,
});

const Heading = ({ title }: { title: string }) => (
  <h4 style={{ ...sectionTitleStyle, marginBottom: 12, marginTop: 20 }}>{title}</h4>
);

const Stat = ({
  l, v, c, loading, error,
}: {
  l: string;
  v: string | number;
  c?: string;
  loading?: boolean;
  error?: boolean;
}) => (
  <div style={miniCard}>
    <p style={label}>{l}</p>
    <p style={value(error ? t.red : c)}>
      {loading ? '…' : error ? '—' : v}
    </p>
    {error && (
      <p style={{ margin: '4px 0 0', fontSize: 11, color: t.red }}>Could not load</p>
    )}
  </div>
);

const EmptyHint = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 13, color: t.grayMuted, margin: 0 }}>{children}</p>
);

// === DASHBOARD ===
const DashboardSidebar = ({ storeId }: { storeId: string }) => {
  const {
    data: topProducts, isLoading: loadingProducts, isError: productsError,
  } = useGetTopProductsQuery({ storeId, period: 'WEEKLY', sortBy: 'quantity' }, { skip: !storeId });
  const {
    data: sessions, isLoading: loadingSessions, isError: sessionsError,
  } = useGetActiveStoreSessionsQuery(storeId, { skip: !storeId });
  const { data: sales } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });

  const products = topProducts?.topProducts?.slice(0, 5) ?? [];
  const activeSessions = sessions?.filter((s) => s.isActive).slice(0, 5) ?? [];

  return (
    <>
      {sales && (
        <>
          <Heading title="Today" />
          <Stat l="Orders today" v={sales.todayOrderCount ?? 0} c={t.orange} />
        </>
      )}
      <Heading title="Trending menus" />
      <div style={miniCard}>
        {loadingProducts && <EmptyHint>Loading…</EmptyHint>}
        {productsError && <EmptyHint>Could not load products.</EmptyHint>}
        {!loadingProducts && !productsError && products.length === 0 && (
          <EmptyHint>No product rankings yet for this week.</EmptyHint>
        )}
        {products.map((p: ProductRankingItem, i: number) => (
          <div key={p.itemId} style={{ ...listItem, borderBottom: i < products.length - 1 ? `1px solid ${t.grayLight}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.gray, width: 18 }}>#{p.rank}</span>
              <span style={{ color: t.black, fontWeight: 500 }}>{p.itemName}</span>
            </div>
            <span style={{ fontSize: 12, color: t.green, fontWeight: 600 }}>{p.quantitySold} sold</span>
          </div>
        ))}
      </div>

      <Heading title="On shift" />
      <div style={miniCard}>
        {loadingSessions && <EmptyHint>Loading…</EmptyHint>}
        {sessionsError && <EmptyHint>Could not load sessions.</EmptyHint>}
        {!loadingSessions && !sessionsError && activeSessions.length === 0 && (
          <EmptyHint>No active staff sessions.</EmptyHint>
        )}
        {activeSessions.map((s: WorkingSession, i: number) => (
          <div key={s.id} style={{ ...listItem, borderBottom: i < activeSessions.length - 1 ? `1px solid ${t.grayLight}` : 'none' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: t.black }}>{s.employeeName}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: t.grayMuted }}>{s.role}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dot(t.green)} />
              <span style={{ fontSize: 11, color: t.green }}>Active</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// === ORDERS ===
const OrdersSidebar = ({ storeId }: { storeId: string }) => {
  const { data: orders, isLoading, isError } = useGetStoreOrdersQuery(storeId, { skip: !storeId });
  const { data: activeDeliveries } = useGetActiveDeliveriesCountQuery(storeId, { skip: !storeId });

  const liveCount = orders?.filter((o) => !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(o.status)).length ?? 0;
  const pendingPayments = orders?.filter((o) => o.paymentStatus === 'PENDING').length ?? 0;
  const todayRefunds = orders?.filter((o) => {
    const today = new Date().toISOString().split('T')[0];
    return o.paymentStatus === 'REFUNDED' && o.updatedAt?.startsWith(today);
  }).length ?? 0;

  return (
    <>
      <Heading title="Order snapshot" />
      <Stat l="Live orders" v={liveCount} c={t.orange} loading={isLoading} error={isError} />
      <Stat l="Pending payments" v={pendingPayments} c={t.yellow} loading={isLoading} error={isError} />
      <Stat l="Today's refunds" v={todayRefunds} c={t.red} loading={isLoading} error={isError} />
      <Stat l="Active deliveries" v={activeDeliveries?.count ?? 0} c={t.blue} />
    </>
  );
};

// === INVENTORY (was "--" placeholders) ===
const InventorySidebar = ({ storeId }: { storeId: string }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const fmt = (v: number) => formatMajorAmount(v, currency, locale);

  const {
    data: lowStock = [], isLoading: loadingLow, isError: errLow,
  } = useGetLowStockItemsQuery(storeId, { skip: !storeId });
  const {
    data: outOfStock = [], isLoading: loadingOut, isError: errOut,
  } = useGetOutOfStockItemsQuery(storeId, { skip: !storeId });
  const {
    data: pendingPOs = [], isLoading: loadingPO, isError: errPO,
  } = useGetPendingApprovalPurchaseOrdersQuery(storeId, { skip: !storeId });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const startDate = weekStart.toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  const {
    data: wasteRows = [], isLoading: loadingWaste, isError: errWaste,
  } = useGetWasteRecordsByDateRangeQuery({ startDate, endDate }, { skip: !storeId });

  const wasteCost = wasteRows.reduce((sum, r) => {
    const cost = (r as { totalCost?: number; cost?: number }).totalCost
      ?? (r as { cost?: number }).cost
      ?? 0;
    return sum + cost;
  }, 0);

  return (
    <>
      <Heading title="Stock alerts" />
      <Stat l="Low stock items" v={lowStock.length} c={t.orange} loading={loadingLow} error={errLow} />
      <Stat l="Out of stock" v={outOfStock.length} c={t.red} loading={loadingOut} error={errOut} />
      {lowStock.length > 0 && !loadingLow && (
        <div style={{ ...miniCard, fontSize: 12, color: t.orangeDark, background: t.orangeLight }}>
          Top: {lowStock.slice(0, 3).map((i) => i.itemName || i.itemCode).filter(Boolean).join(', ') || 'See Stock tab'}
        </div>
      )}
      <Heading title="Supply" />
      <Stat l="POs pending approval" v={pendingPOs.length} c={t.blue} loading={loadingPO} error={errPO} />
      <Stat
        l="Waste this week"
        v={errWaste ? '—' : loadingWaste ? '…' : fmt(wasteCost)}
        c={t.red}
        loading={loadingWaste}
        error={errWaste}
      />
    </>
  );
};

// === OPERATIONS ===
const OperationsSidebar = ({ storeId }: { storeId: string }) => {
  const { data: driverStatus, isLoading: loadingDrivers, isError: errDrivers } = useGetDriverStatusQuery(storeId, { skip: !storeId });
  const { data: kiosks, isLoading: loadingKiosks, isError: errKiosks } = useListKioskAccountsQuery(storeId, { skip: !storeId });

  const onlineKiosks = kiosks?.filter((k: KioskAccount) => k.isActive).length ?? 0;
  const offlineKiosks = kiosks?.filter((k: KioskAccount) => !k.isActive).length ?? 0;

  return (
    <>
      <Heading title="Drivers" />
      <Stat l="Total drivers" v={driverStatus?.totalDrivers ?? 0} loading={loadingDrivers} error={errDrivers} />
      <Stat l="Available" v={driverStatus?.availableDrivers ?? 0} c={t.green} loading={loadingDrivers} error={errDrivers} />
      <Stat l="On delivery" v={driverStatus?.busyDrivers ?? 0} c={t.orange} loading={loadingDrivers} error={errDrivers} />

      <Heading title="Kiosks" />
      {loadingKiosks && <EmptyHint>Loading…</EmptyHint>}
      {errKiosks && <EmptyHint>Could not load kiosks.</EmptyHint>}
      {!loadingKiosks && !errKiosks && (
        <div style={miniCard}>
          <div style={listItem}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dot(t.green)} /><span style={{ fontSize: 13, color: t.black }}>Active</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.green }}>{onlineKiosks}</span>
          </div>
          <div style={{ ...listItem, borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dot(t.red)} /><span style={{ fontSize: 13, color: t.black }}>Inactive</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.red }}>{offlineKiosks}</span>
          </div>
        </div>
      )}
    </>
  );
};

// === PEOPLE ===
const PeopleSidebar = ({ storeId }: { storeId: string }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const fmt = (v: number) => formatMajorAmount(v, currency, locale);
  const { data: sessions, isLoading: loadingSessions } = useGetActiveStoreSessionsQuery(storeId, { skip: !storeId });
  const { data: leaderboard } = useGetStaffLeaderboardQuery({ storeId, period: 'TODAY' }, { skip: !storeId });
  const { data: customerStats, isLoading: loadingCustomers } = useGetCustomerStatsQuery(storeId, { skip: !storeId });

  const onShiftCount = sessions?.filter((s: WorkingSession) => s.isActive).length ?? 0;
  const topPerformer = leaderboard?.rankings?.[0];

  return (
    <>
      <Heading title="Staff today" />
      <Stat l="On shift now" v={onShiftCount} c={t.green} loading={loadingSessions} />
      {topPerformer ? (
        <>
          <Heading title="Top performer" />
          <div style={miniCard}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.black }}>{topPerformer.staffName}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: t.gray }}>
              {topPerformer.ordersProcessed} orders · {fmt(topPerformer.salesGenerated)} sales
            </p>
          </div>
        </>
      ) : (
        <EmptyHint>No leaderboard data for today.</EmptyHint>
      )}
      <Heading title="Customers" />
      <Stat l="Total customers" v={customerStats?.totalCustomers ?? 0} loading={loadingCustomers} />
      <Stat l="Active customers" v={customerStats?.activeCustomers ?? 0} c={t.green} loading={loadingCustomers} />
    </>
  );
};

// === ANALYTICS ===
const AnalyticsSidebar = ({ storeId }: { storeId: string }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const fmt = (v: number) => formatMajorAmount(v, currency, locale);
  const { data: summary, isLoading, isError } = useGetExecutiveSummaryQuery(storeId, { skip: !storeId });
  const { data: salesMetrics } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });
  const trendColor = (change?: number) => ((change ?? 0) >= 0 ? t.green : t.red);

  return (
    <>
      <Heading title="Key KPIs" />
      {isLoading && <EmptyHint>Loading analytics…</EmptyHint>}
      {isError && <EmptyHint>Could not load executive summary.</EmptyHint>}
      {!isLoading && !isError && summary && (
        <>
          <div style={miniCard}>
            <p style={label}>Revenue</p>
            <p style={value(trendColor(summary.revenue?.change))}>{fmt(summary.revenue?.total ?? 0)}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: trendColor(summary.revenue?.change) }}>
              {(summary.revenue?.change ?? 0) >= 0 ? '+' : ''}{(summary.revenue?.change ?? 0).toFixed(1)}%
            </p>
          </div>
          <div style={miniCard}>
            <p style={label}>Orders</p>
            <p style={value(trendColor(summary.orders?.change))}>{(summary.orders?.total ?? 0).toLocaleString()}</p>
          </div>
        </>
      )}
      {!isLoading && !summary && (
        <Stat l="Today's orders" v={salesMetrics?.todayOrderCount ?? 0} />
      )}
      {(summary?.topInsights?.length ?? 0) > 0 && (
        <>
          <Heading title="Insights" />
          {summary!.topInsights!.slice(0, 4).map((insight: string, i: number) => (
            <div key={i} style={{ padding: '10px 12px', background: t.orangeLight, borderRadius: t.radius.sm, fontSize: 12, color: t.orangeDark, marginBottom: 8, lineHeight: 1.4 }}>
              {insight}
            </div>
          ))}
        </>
      )}
    </>
  );
};

// === AI ===
const AiSidebar = () => (
  <>
    <Heading title="Agent status" />
    <Stat l="Live / wired" v={4} c={t.green} />
    <Stat l="Event-driven" v={1} c={t.blue} />
    <Stat l="Coming soon" v={3} c={t.yellow} />
    <div style={{ ...miniCard, fontSize: 12, color: t.gray, lineHeight: 1.45 }}>
      Active: support, forecast, reorder, churn. Stubs are labeled on the AI Agents page — they do not auto-write data.
    </div>
  </>
);

// === COMPLIANCE ===
const ComplianceSidebar = ({ storeId }: { storeId: string }) => {
  const { data: failures = [], isLoading, isError } = useGetSigningFailuresQuery(storeId, { skip: !storeId });
  const count = Array.isArray(failures) ? failures.length : 0;

  return (
    <>
      <Heading title="Fiscal" />
      <Stat l="Open signing failures" v={count} c={count > 0 ? t.red : t.green} loading={isLoading} error={isError} />
      <EmptyHint>
        HMRC MTD submit/export is not enabled in this environment — buttons show as unavailable.
      </EmptyHint>
    </>
  );
};

const sectionLabels: Record<string, string> = {
  dashboard: 'Overview',
  orders: 'Orders & Payments',
  inventory: 'Inventory & Supply',
  operations: 'Operations',
  people: 'People & Marketing',
  analytics: 'Analytics & Reports',
  ai: 'AI Agents',
  compliance: 'Fiscal Compliance',
};

const RightSidebar: React.FC<Props> = ({ section, storeId }) => {
  const content = () => {
    switch (section) {
      case 'dashboard': return <DashboardSidebar storeId={storeId} />;
      case 'orders': return <OrdersSidebar storeId={storeId} />;
      case 'inventory': return <InventorySidebar storeId={storeId} />;
      case 'operations': return <OperationsSidebar storeId={storeId} />;
      case 'people': return <PeopleSidebar storeId={storeId} />;
      case 'analytics': return <AnalyticsSidebar storeId={storeId} />;
      case 'ai': return <AiSidebar />;
      case 'compliance': return <ComplianceSidebar storeId={storeId} />;
      default: return <DashboardSidebar storeId={storeId} />;
    }
  };

  return (
    <div style={{ padding: '24px 16px', fontFamily: t.font, overflowY: 'auto', height: '100%' }}>
      <h3 style={{ ...sectionTitleStyle, fontSize: 16, marginBottom: 4 }}>Quick Info</h3>
      <p style={{ fontSize: 12, color: t.grayMuted, margin: '0 0 16px 0' }}>{sectionLabels[section] || 'Overview'}</p>
      {!storeId && section !== 'ai' ? (
        <EmptyHint>Select a store to load metrics.</EmptyHint>
      ) : (
        content()
      )}
    </div>
  );
};

export default RightSidebar;
