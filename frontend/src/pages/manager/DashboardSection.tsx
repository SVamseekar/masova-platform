import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import {
  normalizeOrderTypeBreakdown,
  activePeakHours,
} from '../../utils/analyticsMetrics';
import { t, cardStyle, sectionTitleStyle, statusBadge } from './manager-tokens';
import {
  ManagerPageFrame,
  ManagerStatCard,
  ManagerEmptyState,
  ManagerErrorState,
  ManagerLoadingBlock,
} from './components';
import {
  useGetActiveStoreSessionsQuery,
  useGetPendingApprovalSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
} from '../../store/api/sessionApi';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';
import {
  useGetTodaySalesMetricsQuery,
  useGetSalesTrendsQuery,
  useGetOrderTypeBreakdownQuery,
  useGetPeakHoursQuery,
  useGetStaffLeaderboardQuery,
  useGetTopProductsQuery,
  useGetSalesForecastQuery,
  useGetChurnPredictionQuery,
  useGetExecutiveSummaryQuery,
  useGetDriverStatusQuery,
} from '../../store/api/analyticsApi';
import type { StaffRankingItem, ProductRankingItem, ChurnPredictionItem, SalesForecastItem } from '../types/analytics';

interface Props {
  storeId: string;
}

const DashboardSection: React.FC<Props> = ({ storeId }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const { data: sessions = [], isLoading: loadingSessions, error: sessionsError, refetch: refetchSessions } = useGetActiveStoreSessionsQuery(storeId, {
    skip: !storeId, pollingInterval: 30000,
  });
  const {
    data: pendingSessions = [],
    isLoading: loadingPendingSessions,
    error: pendingSessionsError,
    refetch: refetchPendingSessions,
  } = useGetPendingApprovalSessionsQuery(undefined, { skip: !storeId, pollingInterval: 30000 });
  // Store metrics endpoint removed from core API — derive staff/orders from live queries.
  const { data: liveOrders = [], isLoading: loadingOrders, isError: ordersError, refetch: refetchOrders } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId, pollingInterval: 10000,
  });
  const {
    data: todaySalesMetrics,
    isLoading: loadingSales,
    isError: salesError,
    refetch: refetchSales,
  } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId, pollingInterval: 60000 });
  const { data: driverStatus, isError: driverError } = useGetDriverStatusQuery(storeId, { skip: !storeId, pollingInterval: 30000 });
  const {
    data: salesTrends,
    isLoading: loadingTrends,
    isError: trendsError,
  } = useGetSalesTrendsQuery({ period: 'WEEKLY', storeId }, { skip: !storeId, pollingInterval: 300000 });
  const {
    data: orderTypeBreakdown,
    isLoading: loadingBreakdown,
    isError: breakdownError,
  } = useGetOrderTypeBreakdownQuery(storeId, { skip: !storeId, pollingInterval: 300000 });
  const {
    data: peakHours,
    isLoading: loadingPeak,
    isError: peakError,
  } = useGetPeakHoursQuery(storeId, { skip: !storeId, pollingInterval: 300000 });
  const { data: staffLeaderboard, isError: leaderboardError } = useGetStaffLeaderboardQuery({ storeId, period: 'TODAY' }, { skip: !storeId, pollingInterval: 120000 });
  const { data: topProducts, isError: productsError } = useGetTopProductsQuery({ storeId, period: 'TODAY', sortBy: 'REVENUE' }, { skip: !storeId, pollingInterval: 300000 });
  const { data: salesForecast, isError: forecastError } = useGetSalesForecastQuery({ storeId, days: 7 }, { skip: !storeId, pollingInterval: 3600000 });
  const { data: churnPrediction, isError: churnError } = useGetChurnPredictionQuery({ storeId, threshold: 0.5 }, { skip: !storeId, pollingInterval: 3600000 });
  const { data: executiveSummary, isError: execError } = useGetExecutiveSummaryQuery(storeId, { skip: !storeId, pollingInterval: 600000 });

  const [approveSession, { isLoading: approvingSession }] = useApproveSessionMutation();
  const [rejectSession, { isLoading: rejectingSession }] = useRejectSessionMutation();
  const [sessionActionError, setSessionActionError] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      refetchSessions();
      refetchPendingSessions();
      refetchOrders();
    }
  }, [storeId, refetchSessions, refetchPendingSessions, refetchOrders]);

  const orderTypeRows = normalizeOrderTypeBreakdown(orderTypeBreakdown);
  const peakActive = activePeakHours(peakHours);

  const salesData = {
    today: todaySalesMetrics?.todaySales || 0,
    percentageChange: todaySalesMetrics?.percentChangeFromLastYear || 0,
    weeklyTotal: salesTrends?.totalSales || 0,
    todayOrders: todaySalesMetrics?.todayOrderCount || 0,
  };

  const orderQueue = liveOrders
    .filter(order => !['DELIVERED', 'CANCELLED', 'COMPLETED', 'SERVED'].includes(order.status))
    .map(order => ({
      id: order.orderNumber,
      status: order.status,
      items: order.items.length,
      time: new Date(order.createdAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }),
      customer: order.customerName,
      priority: order.priority?.toLowerCase() || 'normal',
    }));

  const activeStaffCount = sessions.filter(s => s.isActive).length;

  const calculateDuration = (loginTime: string): string => {
    const diff = Date.now() - new Date(loginTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const storePendingSessions = pendingSessions.filter((s) => s.storeId === storeId);

  const handleApproveSession = async (sessionId: string) => {
    setSessionActionError(null);
    try {
      await approveSession(sessionId).unwrap();
      refetchPendingSessions();
      refetchSessions();
    } catch {
      setSessionActionError('Failed to approve session. Please try again.');
    }
  };
  const handleRejectSession = async (sessionId: string) => {
    setSessionActionError(null);
    try {
      await rejectSession({ sessionId, reason: 'Manager rejected' }).unwrap();
      refetchPendingSessions();
      refetchSessions();
    } catch {
      setSessionActionError('Failed to reject session. Please try again.');
    }
  };

  const formatCurrency = (val: number) => formatMajorAmount(val, currency, locale);

  return (
    <ManagerPageFrame
      title="Dashboard"
      subtitle="Live store overview"
      storeId={storeId || undefined}
      empty={!storeId}
      emptyTitle="Select a store"
      emptyDescription="Choose a store from the header to load dashboard metrics."
    >
      {sessionActionError && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            background: t.redLight,
            borderRadius: t.radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: t.red, fontWeight: 500 }}>{sessionActionError}</p>
          <button
            type="button"
            onClick={() => setSessionActionError(null)}
            style={{
              border: 'none',
              background: 'transparent',
              color: t.gray,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: t.font,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards — loading | error | data via ManagerStatCard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <ManagerStatCard
          label="Today's Sales"
          value={formatCurrency(salesData.today)}
          color={t.orange}
          loading={loadingSales}
          error={salesError}
          errorMessage="Sales API failed"
          hint={
            salesError
              ? undefined
              : `${salesData.todayOrders} completed · ${salesData.percentageChange >= 0 ? '+' : ''}${salesData.percentageChange}% vs last year`
          }
        />
        <ManagerStatCard
          label="Weekly Total"
          value={formatCurrency(salesData.weeklyTotal)}
          loading={loadingTrends}
          error={trendsError}
          errorMessage="Trends API failed"
          hint={trendsError ? undefined : `${salesTrends?.totalOrders ?? 0} orders · last 7 days`}
        />
        <ManagerStatCard
          label="Active Staff"
          value={activeStaffCount}
          loading={loadingSessions}
          error={!!sessionsError}
          errorMessage="Sessions API failed"
          hint="From active clock-in sessions"
        />
        <ManagerStatCard
          label="Pending Orders"
          value={orderQueue.length}
          loading={loadingOrders}
          error={ordersError}
          errorMessage="Orders API failed"
          hint={`${orderQueue.filter(o => o.priority === 'urgent').length} urgent`}
        />
        {(driverStatus || driverError) && (
          <ManagerStatCard
            label="Drivers"
            value={driverStatus ? `${driverStatus.availableDrivers}/${driverStatus.totalDrivers}` : '—'}
            error={driverError}
            errorMessage="Driver status failed"
            hint={driverStatus ? 'Available / total' : undefined}
          />
        )}
      </div>

      {salesError && (
        <div style={{ marginBottom: 16 }}>
          <ManagerErrorState title="Could not load today's sales" onRetry={() => void refetchSales()} />
        </div>
      )}

      {/* AI Insights Banner */}
      <div style={{
        ...cardStyle,
        marginBottom: 24,
        background: `linear-gradient(135deg, ${t.orange}08 0%, ${t.blue}12 50%, ${t.blue}06 100%)`,
        border: `1px solid ${t.grayLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${t.orange}, ${t.blue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.white, boxShadow: `0 4px 12px ${t.orange}25`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.black }}>AI Agents Active</div>
            <div style={{ fontSize: 12, color: t.gray, marginTop: 2 }}>
              {forecastError
                ? 'Forecast unavailable'
                : salesForecast?.forecasts?.length
                  ? `${salesForecast.forecasts.length}-day forecast ready (${Math.round(salesForecast.accuracy)}% model accuracy)`
                  : 'Demand forecasting runs nightly at 2 AM'}
              {churnError
                ? ' · Churn unavailable'
                : churnPrediction?.totalAtRisk
                  ? ` · ${churnPrediction.totalAtRisk} customers at churn risk`
                  : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Order Queue + Staff Sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Live Order Queue</h3>
          <div style={{ marginTop: 12 }}>
            {loadingOrders ? (
              <ManagerLoadingBlock rows={3} label="Loading orders…" />
            ) : ordersError ? (
              <ManagerErrorState title="Failed to load orders" onRetry={() => void refetchOrders()} />
            ) : orderQueue.length === 0 ? (
              <ManagerEmptyState compact title="No pending orders" description="Queue is clear right now." />
            ) : orderQueue.slice(0, 10).map(order => (
              <div key={order.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: `1px solid ${t.grayLight}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.black }}>
                    #{typeof order.id === 'string' ? order.id.slice(-3) : order.id} - {order.customer}
                  </div>
                  <div style={{ fontSize: 12, color: t.gray }}>
                    {order.items} items - {order.time}
                    {order.priority === 'urgent' && (
                      <span style={{ ...statusBadge('CANCELLED'), marginLeft: 8, fontSize: 10 }}>URGENT</span>
                    )}
                  </div>
                </div>
                <span style={statusBadge(order.status)}>{order.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Active Staff Sessions</h3>
          <div style={{ marginTop: 12 }}>
            {loadingSessions ? (
              <p style={{ textAlign: 'center', color: t.gray, padding: 20 }}>Loading sessions...</p>
            ) : sessionsError ? (
              <p style={{ textAlign: 'center', color: t.red, padding: 20 }}>Error loading sessions</p>
            ) : sessions.filter(s => s.isActive).length === 0 ? (
              <p style={{ textAlign: 'center', color: t.gray, padding: 20 }}>No active sessions</p>
            ) : sessions.filter(s => s.isActive).map(session => (
              <div key={session.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: `1px solid ${t.grayLight}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: t.orange,
                  color: t.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {session.employeeName?.split(' ').map(n => n[0]).join('') || '??'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.black }}>{session.employeeName || 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: t.gray }}>{session.role} - {calculateDuration(session.loginTime)}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.green }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: t.orange, marginBottom: 8 }}>
              Pending Session Approvals ({storePendingSessions.length})
            </h4>
            {loadingPendingSessions && (
              <p style={{ textAlign: 'center', color: t.gray, padding: 12, fontSize: 12 }}>Loading pending sessions...</p>
            )}
            {!loadingPendingSessions && pendingSessionsError && (
              <p style={{ textAlign: 'center', color: t.red, padding: 12, fontSize: 12 }}>Failed to load pending sessions</p>
            )}
            {!loadingPendingSessions && !pendingSessionsError && storePendingSessions.length === 0 && (
              <p style={{ textAlign: 'center', color: t.gray, padding: 12, fontSize: 12 }}>No sessions awaiting approval</p>
            )}
            {storePendingSessions.map(session => (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${t.grayLight}` }}>
                <div style={{ flex: 1, fontSize: 13 }}>{session.employeeName} - {session.role}</div>
                <button onClick={() => handleApproveSession(session.id)} disabled={approvingSession}
                  style={{ padding: '4px 12px', background: t.green, color: t.white, border: 'none', borderRadius: t.radius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Approve
                </button>
                <button onClick={() => handleRejectSession(session.id)} disabled={rejectingSession}
                  style={{ padding: '4px 12px', background: t.red, color: t.white, border: 'none', borderRadius: t.radius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Flow + Types + Peak hours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Order Flow Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {[
              { stage: 'Received', count: orderQueue.filter(o => o.status === 'RECEIVED').length, color: t.blue },
              { stage: 'In Kitchen', count: orderQueue.filter(o => ['PREPARING', 'OVEN', 'BAKED'].includes(o.status)).length, color: t.yellow },
              { stage: 'Ready', count: orderQueue.filter(o => o.status === 'READY').length, color: t.green },
              { stage: 'Dispatched', count: orderQueue.filter(o => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.status)).length, color: t.orange },
            ].map(item => (
              <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: t.gray }}>{item.stage}</div>
                <div style={{ flex: 1, height: 24, background: t.grayLight, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min((item.count / (orderQueue.length || 1)) * 100, 100)}%`,
                    background: item.color, borderRadius: 6, transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ width: 32, textAlign: 'right', fontSize: 15, fontWeight: 700, color: t.black }}>{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Order Types</h3>
          {loadingBreakdown && <ManagerLoadingBlock rows={2} label="Loading order types…" />}
          {breakdownError && (
            <p style={{ color: t.red, fontSize: 13, marginTop: 12 }}>Failed to load order-type breakdown.</p>
          )}
          {!loadingBreakdown && !breakdownError && orderTypeRows.length === 0 && (
            <ManagerEmptyState compact title="No order types yet" description="Breakdown needs completed orders." />
          )}
          {!loadingBreakdown && !breakdownError && orderTypeRows.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {orderTypeRows.map((row) => (
                <div key={row.orderType} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.grayLight}` }}>
                  <span style={{ fontSize: 13, color: t.black }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.orange }}>
                    {row.count} · {formatCurrency(row.sales)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Peak hours</h3>
          {loadingPeak && <ManagerLoadingBlock rows={2} label="Loading peak hours…" />}
          {peakError && (
            <p style={{ color: t.red, fontSize: 13, marginTop: 12 }}>Failed to load peak hours.</p>
          )}
          {!loadingPeak && !peakError && peakActive.length === 0 && (
            <ManagerEmptyState compact title="No peak-hour data" description="Hourly sales appear after orders today." />
          )}
          {!loadingPeak && !peakError && peakHours && peakActive.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 13, color: t.black }}>
              <div style={{ marginBottom: 8 }}>
                Busiest hour: <strong style={{ color: t.orange }}>{peakHours.peakHour}:00</strong>
                {' '}({peakHours.peakHourOrders} orders · {formatCurrency(peakHours.peakHourSales)})
              </div>
              <div style={{ marginBottom: 12 }}>
                Quietest hour: <strong style={{ color: t.gray }}>{peakHours.slowestHour}:00</strong>
              </div>
              {peakActive.slice(0, 6).map((h) => (
                <div key={h.hour} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.grayLight}` }}>
                  <span>{h.label}</span>
                  <span style={{ fontWeight: 600 }}>{h.orderCount} orders · {formatCurrency(h.sales)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Leaderboard */}
      {leaderboardError && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <ManagerErrorState title="Staff leaderboard unavailable" />
        </div>
      )}
      {staffLeaderboard?.rankings && staffLeaderboard.rankings.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>Staff Leaderboard - {staffLeaderboard.period}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 16 }}>
            {staffLeaderboard.rankings.slice(0, 6).map((staff: StaffRankingItem, idx: number) => (
              <div key={staff.staffId} style={{
                padding: 12, background: idx < 3 ? t.orangeLight : t.bgMain, borderRadius: t.radius.md,
                border: idx === 0 ? `2px solid ${t.orange}` : `1px solid ${t.grayLight}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: idx < 3 ? t.orange : t.gray }}>#{staff.rank}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.black }}>{staff.staffName}</div>
                    <div style={{ fontSize: 11, color: t.gray }}>{staff.performanceLevel}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: t.gray }}>
                  Orders: {staff.ordersProcessed} | Sales: {formatCurrency(staff.salesGenerated)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      {productsError && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <ManagerErrorState title="Top products unavailable" />
        </div>
      )}
      {topProducts?.topProducts && topProducts.topProducts.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>Top Selling Products - {topProducts.period}</h3>
          <div style={{ marginTop: 16 }}>
            {topProducts.topProducts.slice(0, 5).map((product: ProductRankingItem) => (
              <div key={product.itemId} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                background: t.bgMain, borderRadius: t.radius.md, marginBottom: 8,
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: product.rank === 1 ? t.orange : t.gray }}>#{product.rank}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.black }}>{product.itemName}</div>
                  <div style={{ fontSize: 11, color: t.gray }}>{product.category} | {product.quantitySold} units</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.black }}>{formatCurrency(product.revenue)}</div>
                  <div style={{ fontSize: 11, color: t.gray }}>{product.percentOfTotalRevenue.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {execError && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <ManagerErrorState title="Executive summary unavailable" />
        </div>
      )}
      {executiveSummary?.revenue && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>Executive Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: t.gray }}>Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.black }}>{formatCurrency(executiveSummary.revenue?.total ?? 0)}</div>
              <div style={{ fontSize: 11, color: (executiveSummary.revenue?.change ?? 0) >= 0 ? t.green : t.red }}>
                {(executiveSummary.revenue?.change ?? 0) >= 0 ? '+' : ''}{executiveSummary.revenue?.change ?? 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.gray }}>Orders</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.black }}>{executiveSummary.orders?.total ?? 0}</div>
              <div style={{ fontSize: 11, color: (executiveSummary.orders?.change ?? 0) >= 0 ? t.green : t.red }}>
                {(executiveSummary.orders?.change ?? 0) >= 0 ? '+' : ''}{executiveSummary.orders?.change ?? 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.gray }}>Customers At Risk</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.yellow }}>{executiveSummary.customers?.atRisk ?? 0}</div>
            </div>
          </div>
          {(executiveSummary.topInsights?.length ?? 0) > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.black, marginBottom: 8 }}>Key Insights</div>
              {executiveSummary.topInsights!.slice(0, 3).map((insight: string, idx: number) => (
                <div key={idx} style={{ fontSize: 12, color: t.gray, marginBottom: 4 }}>- {insight}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Churn Prediction */}
      {churnError && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <ManagerErrorState title="Churn prediction unavailable" />
        </div>
      )}
      {churnPrediction?.predictions && churnPrediction.predictions.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>At-Risk Customers ({churnPrediction.totalAtRisk})</h3>
          <div style={{ fontSize: 12, color: t.gray, marginBottom: 12 }}>
            High: {churnPrediction.highRiskCount} | Medium: {churnPrediction.mediumRiskCount} | Low: {churnPrediction.lowRiskCount}
          </div>
          {churnPrediction.predictions.slice(0, 5).map((pred: ChurnPredictionItem) => (
            <div key={pred.customerId} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 10, background: t.bgMain, borderRadius: t.radius.md, marginBottom: 6,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.black }}>{pred.customerName}</div>
                <div style={{ fontSize: 11, color: t.gray }}>Last order: {pred.daysSinceLastOrder} days ago</div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: t.white,
                background: pred.riskLevel === 'HIGH' ? t.red : pred.riskLevel === 'MEDIUM' ? t.yellow : t.blue,
              }}>{pred.riskLevel}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sales Forecast */}
      {forecastError && (
        <div style={cardStyle}>
          <ManagerErrorState title="Sales forecast unavailable" />
        </div>
      )}
      {salesForecast?.forecasts && salesForecast.forecasts.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>7-Day Sales Forecast</h3>
          <p style={{ fontSize: 12, color: t.gray, marginTop: 4 }}>
            Model accuracy {Math.round(salesForecast.accuracy)}% · period {salesForecast.period}
          </p>
          <div style={{ marginTop: 12 }}>
            {salesForecast.forecasts.map((forecast: SalesForecastItem) => (
              <div key={forecast.date} style={{
                display: 'flex', justifyContent: 'space-between', padding: 10,
                background: t.bgMain, borderRadius: t.radius.md, marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.black }}>
                  {new Date(forecast.date).toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.orange }}>{formatCurrency(forecast.forecastedSales)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ManagerPageFrame>
  );
};

export default DashboardSection;
