import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { t, cardStyle, sectionTitleStyle, statusBadge } from './manager-tokens';
import {
  useGetActiveStoreSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
} from '../../store/api/sessionApi';
import { useGetStoreMetricsQuery } from '../../store/api/storeApi';
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

interface Props {
  storeId: string;
}

const DashboardSection: React.FC<Props> = ({ storeId }) => {
  const { data: sessions = [], isLoading: loadingSessions, error: sessionsError, refetch: refetchSessions } = useGetActiveStoreSessionsQuery(storeId, {
    skip: !storeId, pollingInterval: 30000,
  });
  const { data: storeMetrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useGetStoreMetricsQuery(storeId, {
    skip: !storeId, pollingInterval: 60000,
  });
  const { data: liveOrders = [], refetch: refetchOrders } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId, pollingInterval: 10000,
  });
  const { data: todaySalesMetrics } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId, pollingInterval: 60000 });
  const { data: driverStatus } = useGetDriverStatusQuery(storeId, { skip: !storeId, pollingInterval: 30000 });
  const { data: salesTrends } = useGetSalesTrendsQuery({ period: 'WEEKLY', storeId }, { skip: !storeId, pollingInterval: 300000 });
  const { data: orderTypeBreakdown } = useGetOrderTypeBreakdownQuery(storeId, { skip: !storeId, pollingInterval: 300000 });
  const { data: peakHours } = useGetPeakHoursQuery(storeId, { skip: !storeId, pollingInterval: 300000 });
  const { data: staffLeaderboard } = useGetStaffLeaderboardQuery({ storeId, period: 'TODAY' }, { skip: !storeId, pollingInterval: 120000 });
  const { data: topProducts } = useGetTopProductsQuery({ storeId, period: 'TODAY', sortBy: 'REVENUE' }, { skip: !storeId, pollingInterval: 300000 });
  const { data: salesForecast } = useGetSalesForecastQuery({ storeId, days: 7 }, { skip: !storeId, pollingInterval: 3600000 });
  const { data: churnPrediction } = useGetChurnPredictionQuery({ storeId, threshold: 0.5 }, { skip: !storeId, pollingInterval: 3600000 });
  const { data: executiveSummary } = useGetExecutiveSummaryQuery(storeId, { skip: !storeId, pollingInterval: 600000 });

  const [approveSession, { isLoading: approvingSession }] = useApproveSessionMutation();
  const [rejectSession, { isLoading: rejectingSession }] = useRejectSessionMutation();

  useEffect(() => {
    if (storeId) { refetchSessions(); refetchMetrics(); refetchOrders(); }
  }, [storeId, refetchSessions, refetchMetrics, refetchOrders]);

  const salesData = {
    today: todaySalesMetrics?.todaySales || 0,
    percentageChange: todaySalesMetrics?.percentChangeFromLastYear || 0,
    weeklyTotal: salesTrends?.totalSales || 0,
  };

  const orderQueue = liveOrders
    .filter(order => !['DELIVERED', 'CANCELLED'].includes(order.status))
    .map(order => ({
      id: order.orderNumber,
      status: order.status,
      items: order.items.length,
      time: new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      customer: order.customerName,
      priority: order.priority?.toLowerCase() || 'normal',
    }));

  const calculateDuration = (loginTime: string): string => {
    const diff = Date.now() - new Date(loginTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const handleApproveSession = async (sessionId: string) => {
    try { await approveSession(sessionId).unwrap(); } catch { alert('Failed to approve session'); }
  };
  const handleRejectSession = async (sessionId: string) => {
    try { await rejectSession({ sessionId, reason: 'Manager rejected' }).unwrap(); } catch { alert('Failed to reject session'); }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, background: t.orange, color: t.white }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Today's Sales</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{loadingMetrics ? '...' : formatCurrency(salesData.today)}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>+{salesData.percentageChange}% vs Last Year</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: t.gray, marginBottom: 4 }}>Weekly Total</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.black }}>{loadingMetrics ? '...' : formatCurrency(salesData.weeklyTotal)}</div>
          <div style={{ fontSize: 12, color: t.green }}>Last 7 days</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: t.gray, marginBottom: 4 }}>Active Staff</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.black }}>{loadingSessions ? '...' : storeMetrics?.activeEmployees || sessions.filter(s => s.isActive).length}</div>
          <div style={{ fontSize: 12, color: t.gray }}>Currently working</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: t.gray, marginBottom: 4 }}>Pending Orders</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.black }}>{loadingMetrics ? '...' : storeMetrics?.activeOrders || orderQueue.length}</div>
          <div style={{ fontSize: 12, color: t.red }}>{orderQueue.filter(o => o.priority === 'urgent').length} urgent</div>
        </div>
        {driverStatus && (
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: t.gray, marginBottom: 4 }}>Drivers</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: t.black }}>{driverStatus.availableDrivers}/{driverStatus.totalDrivers}</div>
            <div style={{ fontSize: 12, color: t.green }}>Available</div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Order Queue + Staff Sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Live Order Queue */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Live Order Queue</h3>
          <div style={{ marginTop: 12 }}>
            {orderQueue.length === 0 ? (
              <p style={{ textAlign: 'center', color: t.gray, padding: 20 }}>No pending orders</p>
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

        {/* Active Staff Sessions */}
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

          {/* Pending Approval Sessions */}
          {sessions.filter(s => s.status === 'PENDING_APPROVAL').length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: t.orange, marginBottom: 8 }}>Pending Approval</h4>
              {sessions.filter(s => s.status === 'PENDING_APPROVAL').map(session => (
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
          )}
        </div>
      </div>

      {/* Order Flow Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Order Flow Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {[
              { stage: 'Received', count: orderQueue.filter(o => o.status === 'RECEIVED').length, color: t.blue },
              { stage: 'In Kitchen', count: orderQueue.filter(o => ['PREPARING', 'OVEN'].includes(o.status)).length, color: t.yellow },
              { stage: 'Ready', count: orderQueue.filter(o => o.status === 'READY').length, color: t.green },
              { stage: 'Dispatched', count: orderQueue.filter(o => o.status === 'DISPATCHED').length, color: t.orange },
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

        {/* Order Type Breakdown */}
        {orderTypeBreakdown && (
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>Order Types</h3>
            <div style={{ marginTop: 16 }}>
              {Object.entries(orderTypeBreakdown).filter(([k]) => k !== 'storeId' && k !== 'period').map(([type, data]: [string, any]) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.grayLight}` }}>
                  <span style={{ fontSize: 13, color: t.black }}>{type}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.orange }}>{typeof data === 'number' ? data : data?.count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Staff Leaderboard */}
      {staffLeaderboard?.rankings && staffLeaderboard.rankings.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>Staff Leaderboard - {staffLeaderboard.period}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 16 }}>
            {staffLeaderboard.rankings.slice(0, 6).map((staff: any, idx: number) => (
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
      {topProducts?.topProducts && topProducts.topProducts.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>Top Selling Products - {topProducts.period}</h3>
          <div style={{ marginTop: 16 }}>
            {topProducts.topProducts.slice(0, 5).map((product: any) => (
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
      {executiveSummary && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>Executive Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: t.gray }}>Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.black }}>{formatCurrency(executiveSummary.revenue.total)}</div>
              <div style={{ fontSize: 11, color: executiveSummary.revenue.change >= 0 ? t.green : t.red }}>
                {executiveSummary.revenue.change >= 0 ? '+' : ''}{executiveSummary.revenue.change}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.gray }}>Orders</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.black }}>{executiveSummary.orders.total}</div>
              <div style={{ fontSize: 11, color: executiveSummary.orders.change >= 0 ? t.green : t.red }}>
                {executiveSummary.orders.change >= 0 ? '+' : ''}{executiveSummary.orders.change}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.gray }}>Customers At Risk</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.yellow }}>{executiveSummary.customers.atRisk}</div>
            </div>
          </div>
          {executiveSummary.topInsights?.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.black, marginBottom: 8 }}>Key Insights</div>
              {executiveSummary.topInsights.slice(0, 3).map((insight: string, idx: number) => (
                <div key={idx} style={{ fontSize: 12, color: t.gray, marginBottom: 4 }}>- {insight}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Churn Prediction */}
      {churnPrediction?.predictions && churnPrediction.predictions.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={sectionTitleStyle}>At-Risk Customers ({churnPrediction.totalAtRisk})</h3>
          <div style={{ fontSize: 12, color: t.gray, marginBottom: 12 }}>
            High: {churnPrediction.highRiskCount} | Medium: {churnPrediction.mediumRiskCount} | Low: {churnPrediction.lowRiskCount}
          </div>
          {churnPrediction.predictions.slice(0, 5).map((pred: any) => (
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
      {salesForecast?.forecasts && salesForecast.forecasts.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>7-Day Sales Forecast</h3>
          <div style={{ marginTop: 12 }}>
            {salesForecast.forecasts.map((forecast: any) => (
              <div key={forecast.date} style={{
                display: 'flex', justifyContent: 'space-between', padding: 10,
                background: t.bgMain, borderRadius: t.radius.md, marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.black }}>
                  {new Date(forecast.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.orange }}>{formatCurrency(forecast.forecastedSales)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSection;
