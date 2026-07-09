import React from 'react';
import { t, cardStyle, sectionTitleStyle } from './manager-tokens';
import { ManagerStatCard, ManagerEmptyState, ManagerLoadingBlock, ManagerErrorState } from './components';
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
import {
  sumWasteCost,
  filterWasteByStore,
  countItems,
  topStockItemNames,
  countLiveOrders,
  countPendingPayments,
  countRefundsOnDate,
} from './quickInfoMetrics';
import { getAgentStatusCounts, AGENT_CATALOG } from './agentCatalog';

interface Props {
  section: string;
  storeId: string;
}

const miniCard: React.CSSProperties = { ...cardStyle, padding: 14, marginBottom: 10 };
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

// === DASHBOARD ===
const DashboardSidebar = ({ storeId }: { storeId: string }) => {
  const {
    data: topProducts, isLoading: loadingProducts, isError: productsError, refetch: refetchProducts,
  } = useGetTopProductsQuery({ storeId, period: 'WEEKLY', sortBy: 'quantity' }, { skip: !storeId });
  const {
    data: sessions, isLoading: loadingSessions, isError: sessionsError, refetch: refetchSessions,
  } = useGetActiveStoreSessionsQuery(storeId, { skip: !storeId });
  const { data: sales, isLoading: loadingSales, isError: salesError } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });

  const products = topProducts?.topProducts?.slice(0, 5) ?? [];
  const activeSessions = sessions?.filter((s) => s.isActive).slice(0, 5) ?? [];

  return (
    <>
      <Heading title="Today" />
      <ManagerStatCard
        label="Orders today"
        value={sales?.todayOrderCount ?? 0}
        color={t.orange}
        loading={loadingSales}
        error={salesError}
        compact
      />

      <Heading title="Trending menus" />
      {loadingProducts && <ManagerLoadingBlock rows={3} compact label="Loading products…" />}
      {productsError && (
        <ManagerErrorState compact title="Products unavailable" onRetry={() => void refetchProducts()} />
      )}
      {!loadingProducts && !productsError && products.length === 0 && (
        <ManagerEmptyState compact title="No rankings yet" description="No product rankings for this week." />
      )}
      {!loadingProducts && !productsError && products.length > 0 && (
        <div style={miniCard}>
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
      )}

      <Heading title="On shift" />
      {loadingSessions && <ManagerLoadingBlock rows={2} compact label="Loading sessions…" />}
      {sessionsError && (
        <ManagerErrorState compact title="Sessions unavailable" onRetry={() => void refetchSessions()} />
      )}
      {!loadingSessions && !sessionsError && activeSessions.length === 0 && (
        <ManagerEmptyState compact title="No one on shift" description="No active staff sessions." />
      )}
      {!loadingSessions && !sessionsError && activeSessions.length > 0 && (
        <div style={miniCard}>
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
      )}
    </>
  );
};

// === ORDERS ===
const OrdersSidebar = ({ storeId }: { storeId: string }) => {
  const { data: orders, isLoading, isError, refetch } = useGetStoreOrdersQuery(storeId, { skip: !storeId });
  const { data: activeDeliveries, isLoading: loadingDel, isError: errDel } = useGetActiveDeliveriesCountQuery(storeId, { skip: !storeId });

  const today = new Date().toISOString().split('T')[0];
  const liveCount = countLiveOrders(orders);
  const pendingPayments = countPendingPayments(orders);
  const todayRefunds = countRefundsOnDate(orders, today);

  return (
    <>
      <Heading title="Order snapshot" />
      {isError && (
        <ManagerErrorState compact title="Orders unavailable" onRetry={() => void refetch()} />
      )}
      <ManagerStatCard label="Live orders" value={liveCount} color={t.orange} loading={isLoading} error={isError} compact />
      <ManagerStatCard label="Pending payments" value={pendingPayments} color={t.yellow} loading={isLoading} error={isError} compact />
      <ManagerStatCard label="Today's refunds" value={todayRefunds} color={t.red} loading={isLoading} error={isError} compact />
      <ManagerStatCard
        label="Active deliveries"
        value={activeDeliveries?.count ?? 0}
        color={t.blue}
        loading={loadingDel}
        error={errDel}
        compact
      />
    </>
  );
};

// === INVENTORY ===
const InventorySidebar = ({ storeId }: { storeId: string }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const fmt = (v: number) => formatMajorAmount(v, currency, locale);

  const {
    data: lowStock = [], isLoading: loadingLow, isError: errLow, refetch: refetchLow,
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

  const storeWaste = filterWasteByStore(wasteRows, storeId);
  const wasteCost = sumWasteCost(storeWaste);
  const topNames = topStockItemNames(lowStock, 3);

  return (
    <>
      <Heading title="Stock alerts" />
      {(errLow || errOut) && (
        <ManagerErrorState compact title="Stock alerts unavailable" onRetry={() => void refetchLow()} />
      )}
      <ManagerStatCard label="Low stock items" value={countItems(lowStock)} color={t.orange} loading={loadingLow} error={errLow} compact />
      <ManagerStatCard label="Out of stock" value={countItems(outOfStock)} color={t.red} loading={loadingOut} error={errOut} compact />
      {topNames.length > 0 && !loadingLow && !errLow && (
        <div style={{ ...miniCard, fontSize: 12, color: t.orangeDark, background: t.orangeLight }}>
          Top: {topNames.join(', ')}
        </div>
      )}
      {!loadingLow && !errLow && countItems(lowStock) === 0 && countItems(outOfStock) === 0 && (
        <ManagerEmptyState compact title="Stock healthy" description="No low or out-of-stock items for this store." />
      )}
      <Heading title="Supply" />
      <ManagerStatCard label="POs pending approval" value={countItems(pendingPOs)} color={t.blue} loading={loadingPO} error={errPO} compact />
      <ManagerStatCard
        label="Waste this week"
        value={fmt(wasteCost)}
        color={t.red}
        loading={loadingWaste}
        error={errWaste}
        compact
      />
    </>
  );
};

// === OPERATIONS ===
const OperationsSidebar = ({ storeId }: { storeId: string }) => {
  const { data: driverStatus, isLoading: loadingDrivers, isError: errDrivers, refetch: refetchDrivers } = useGetDriverStatusQuery(storeId, { skip: !storeId });
  const { data: kiosks, isLoading: loadingKiosks, isError: errKiosks, refetch: refetchKiosks } = useListKioskAccountsQuery(storeId, { skip: !storeId });

  const onlineKiosks = kiosks?.filter((k: KioskAccount) => k.isActive).length ?? 0;
  const offlineKiosks = kiosks?.filter((k: KioskAccount) => !k.isActive).length ?? 0;

  return (
    <>
      <Heading title="Drivers" />
      {errDrivers && (
        <ManagerErrorState compact title="Driver status unavailable" onRetry={() => void refetchDrivers()} />
      )}
      <ManagerStatCard label="Total drivers" value={driverStatus?.totalDrivers ?? 0} loading={loadingDrivers} error={errDrivers} compact />
      <ManagerStatCard label="Available" value={driverStatus?.availableDrivers ?? 0} color={t.green} loading={loadingDrivers} error={errDrivers} compact />
      <ManagerStatCard label="On delivery" value={driverStatus?.busyDrivers ?? 0} color={t.orange} loading={loadingDrivers} error={errDrivers} compact />

      <Heading title="Kiosks" />
      {loadingKiosks && <ManagerLoadingBlock rows={2} compact label="Loading kiosks…" />}
      {errKiosks && (
        <ManagerErrorState compact title="Kiosks unavailable" onRetry={() => void refetchKiosks()} />
      )}
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
  const { data: sessions, isLoading: loadingSessions, isError: errSessions } = useGetActiveStoreSessionsQuery(storeId, { skip: !storeId });
  const { data: leaderboard, isLoading: loadingLb } = useGetStaffLeaderboardQuery({ storeId, period: 'TODAY' }, { skip: !storeId });
  const { data: customerStats, isLoading: loadingCustomers, isError: errCustomers } = useGetCustomerStatsQuery(storeId, { skip: !storeId });

  const onShiftCount = sessions?.filter((s: WorkingSession) => s.isActive).length ?? 0;
  const topPerformer = leaderboard?.rankings?.[0];

  return (
    <>
      <Heading title="Staff today" />
      <ManagerStatCard label="On shift now" value={onShiftCount} color={t.green} loading={loadingSessions} error={errSessions} compact />
      {loadingLb && <ManagerLoadingBlock rows={1} compact label="Loading leaderboard…" />}
      {!loadingLb && topPerformer ? (
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
        !loadingLb && <ManagerEmptyState compact title="No leaderboard yet" description="No leaderboard data for today." />
      )}
      <Heading title="Customers" />
      <ManagerStatCard label="Total customers" value={customerStats?.totalCustomers ?? 0} loading={loadingCustomers} error={errCustomers} compact />
      <ManagerStatCard label="Active customers" value={customerStats?.activeCustomers ?? 0} color={t.green} loading={loadingCustomers} error={errCustomers} compact />
    </>
  );
};

// === ANALYTICS ===
const AnalyticsSidebar = ({ storeId }: { storeId: string }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const fmt = (v: number) => formatMajorAmount(v, currency, locale);
  const { data: summary, isLoading, isError, refetch } = useGetExecutiveSummaryQuery(storeId, { skip: !storeId });
  const { data: salesMetrics } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });
  const trendColor = (change?: number) => ((change ?? 0) >= 0 ? t.green : t.red);

  return (
    <>
      <Heading title="Key KPIs" />
      {isLoading && <ManagerLoadingBlock rows={2} compact label="Loading analytics…" />}
      {isError && (
        <ManagerErrorState compact title="Executive summary unavailable" onRetry={() => void refetch()} />
      )}
      {!isLoading && !isError && summary && (
        <>
          <div style={miniCard}>
            <p style={{ fontSize: 12, color: t.gray, margin: 0 }}>Revenue</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: trendColor(summary.revenue?.change), margin: '4px 0 0' }}>
              {fmt(summary.revenue?.total ?? 0)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: trendColor(summary.revenue?.change) }}>
              {(summary.revenue?.change ?? 0) >= 0 ? '+' : ''}{(summary.revenue?.change ?? 0).toFixed(1)}%
            </p>
          </div>
          <div style={miniCard}>
            <p style={{ fontSize: 12, color: t.gray, margin: 0 }}>Orders</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: trendColor(summary.orders?.change), margin: '4px 0 0' }}>
              {(summary.orders?.total ?? 0).toLocaleString()}
            </p>
          </div>
        </>
      )}
      {!isLoading && !isError && !summary && (
        <ManagerStatCard label="Today's orders" value={salesMetrics?.todayOrderCount ?? 0} compact />
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

// === AI (counts from shared catalog — not hardcoded) ===
const AiSidebar = () => {
  const counts = getAgentStatusCounts();
  const activeNames = AGENT_CATALOG.filter((a) => a.status === 'active').map((a) => a.name.split(' ')[0]).join(', ');

  return (
    <>
      <Heading title="Agent status" />
      <ManagerStatCard label="Live / wired" value={counts.active} color={t.green} compact />
      <ManagerStatCard label="Event-driven" value={counts.eventDriven} color={t.blue} compact />
      <ManagerStatCard label="Coming soon" value={counts.stub} color={t.yellow} compact />
      <div style={{ ...miniCard, fontSize: 12, color: t.gray, lineHeight: 1.45 }}>
        Active: {activeNames || 'none'}. Stubs are labeled on the AI Agents page — they do not auto-write data.
      </div>
    </>
  );
};

// === COMPLIANCE ===
const ComplianceSidebar = ({ storeId }: { storeId: string }) => {
  const { data: failures = [], isLoading, isError, refetch } = useGetSigningFailuresQuery(storeId, { skip: !storeId });
  const count = Array.isArray(failures) ? failures.length : 0;

  return (
    <>
      <Heading title="Fiscal" />
      {isError && (
        <ManagerErrorState compact title="Fiscal failures unavailable" onRetry={() => void refetch()} />
      )}
      <ManagerStatCard
        label="Open signing failures"
        value={count}
        color={count > 0 ? t.red : t.green}
        loading={isLoading}
        error={isError}
        compact
      />
      {!isLoading && !isError && count === 0 && (
        <ManagerEmptyState
          compact
          title="No open failures"
          description="HMRC MTD submit/export is not enabled here — those buttons stay unavailable."
        />
      )}
      {(count > 0 || isLoading) && (
        <p style={{ fontSize: 12, color: t.grayMuted, margin: '8px 0 0', lineHeight: 1.4 }}>
          HMRC MTD submit/export is not enabled in this environment — buttons show as unavailable.
        </p>
      )}
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
    <div
      style={{ padding: '24px 16px', fontFamily: t.font, overflowY: 'auto', height: '100%' }}
      data-testid="manager-quick-info"
    >
      <h3 style={{ ...sectionTitleStyle, fontSize: 16, marginBottom: 4 }}>Quick Info</h3>
      <p style={{ fontSize: 12, color: t.grayMuted, margin: '0 0 16px 0' }} data-testid="quick-info-section-label">
        {sectionLabels[section] || 'Overview'}
      </p>
      {!storeId && section !== 'ai' ? (
        <ManagerEmptyState compact title="Select a store" description="Choose a store to load metrics." />
      ) : (
        content()
      )}
    </div>
  );
};

export default RightSidebar;
