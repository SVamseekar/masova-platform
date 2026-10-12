import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCartCurrency, selectCartLocale, selectSelectedStoreName } from '../../store/slices/cartSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardOverview from './DashboardOverview';
import DashboardInsights from './DashboardInsights';
import { formatMajorAmount } from '../../utils/currency';
import { derivedFromSummary } from './storeOrderMetrics';

import {
  normalizeOrderTypeBreakdown,
  activePeakHours,
} from '../../utils/analyticsMetrics';
import { t } from './manager-tokens';
import {
  ManagerPageFrame,
  ManagerErrorState,
} from './components';
import {
  useGetActiveStoreSessionsQuery,
  useGetPendingApprovalSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
} from '../../store/api/sessionApi';
import { useGetStoreEmployeesQuery } from '../../store/api/userApi';
import { useGetKitchenQueueQuery, useGetOrdersQuery, useGetStoreOrderSummaryQuery } from '../../store/api/orderApi';
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
} from '../../store/api/analyticsApi';

interface Props {
  storeId: string;
}

const DashboardSection: React.FC<Props> = ({ storeId }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const storeName = useAppSelector(selectSelectedStoreName);
  const currentUser = useAppSelector(selectCurrentUser);
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
  const {
    data: storeSummary,
    isLoading: loadingOrders,
    isError: ordersError,
    refetch: refetchOrders,
  } = useGetStoreOrderSummaryQuery(
    { storeId, days: 30 },
    { skip: !storeId, pollingInterval: 30000 },
  );
  const { data: todaySummary, isLoading: loadingTodaySummary, isError: todaySummaryError, refetch: refetchTodaySummary } = useGetStoreOrderSummaryQuery(
    { storeId, days: 1 },
    { skip: !storeId, pollingInterval: 60000 },
  );
  const {
    data: kitchenQueue = [],
    isLoading: loadingQueue,
    isError: queueError,
    refetch: refetchQueue,
  } = useGetKitchenQueueQuery(storeId, { skip: !storeId, pollingInterval: 15000 });
  // READY orders are not part of the kitchen queue but are still active on the board.
  const {
    data: readyOrders = [],
    isLoading: loadingReady,
    isError: readyError,
    refetch: refetchReady,
  } = useGetOrdersQuery({ storeId, status: 'READY' }, { skip: !storeId, pollingInterval: 15000 });
  const activeOrders = useMemo(() => [...kitchenQueue, ...readyOrders], [kitchenQueue, readyOrders]);
  const {
    data: todaySalesMetrics,
    isError: salesError,
    refetch: refetchSales,
  } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId, pollingInterval: 60000 });
  const { data: storeEmployees = [] } = useGetStoreEmployeesQuery(storeId, { skip: !storeId, pollingInterval: 60000 });
  const {
    data: salesTrends,
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
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (storeId) {
      refetchSessions();
      refetchPendingSessions();
      refetchOrders();
    }
  }, [storeId, refetchSessions, refetchPendingSessions, refetchOrders]);

  const orderTypeRowsRaw = normalizeOrderTypeBreakdown(orderTypeBreakdown);
  const derived = useMemo(() => derivedFromSummary(storeSummary), [storeSummary]);
  const orderTypeRows =
    orderTypeRowsRaw.length > 0 ? orderTypeRowsRaw : normalizeOrderTypeBreakdown(derived.typeBreakdown);
  const peakActive = activePeakHours(
    (peakHours && activePeakHours(peakHours).length > 0) ? peakHours : derived.peakHours,
  );

  const salesData = {
    today: (todaySalesMetrics?.todaySales || 0) > 0 ? todaySalesMetrics!.todaySales : derived.todaySales,
    percentageChange: todaySalesMetrics?.percentChangeFromLastYear,
    weeklyTotal: (salesTrends?.totalSales || 0) > 0 ? salesTrends!.totalSales : derived.weekSales,
    todayOrders: (todaySalesMetrics?.todayOrderCount || 0) > 0 ? todaySalesMetrics!.todayOrderCount : derived.todayOrderCount,
  };

  const activeStaffCount = sessions.filter(s => s.isActive).length;
  const driverEmployeeIds = new Set(
    storeEmployees.filter((e) => String(e.type || '').toUpperCase() === 'DRIVER').map((e) => e.id),
  );
  const clockedInDrivers = sessions.filter(
    (s) => s.isActive && (driverEmployeeIds.has(s.employeeId) || String(s.role || '').toUpperCase() === 'DRIVER'),
  ).length;

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
      hideHeading
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

      <DashboardOverview
        greetingName={(currentUser?.name || 'Manager').split(' ')[0]}
        storeName={storeName || ''}
        currency={currency}
        locale={locale}
        revenueToday={salesData.today}
        revenueHint={
          salesData.percentageChange === undefined
            ? `${salesData.todayOrders} orders today`
            : `${salesData.percentageChange >= 0 ? '+' : ''}${salesData.percentageChange}% vs last year`
        }
        hourlyRevenue={(todaySummary?.hours || []).map((h) => ({ hour: h.hour, sales: h.sales || 0 }))}
        hourlyLoading={loadingTodaySummary}
        hourlyError={todaySummaryError}
        onRetryHourly={() => void refetchTodaySummary()}
        activeOrders={activeOrders}
        ordersLoading={loadingQueue || loadingReady}
        ordersError={queueError || readyError}
        onRetryOrders={() => {
          void refetchQueue();
          void refetchReady();
        }}
        staffLoading={loadingSessions}
        staffError={!!sessionsError}
        attentionLoading={loadingOrders || loadingPendingSessions}
        attentionError={ordersError || !!pendingSessionsError}
        staffOnShift={activeStaffCount}
        staffRoster={storeEmployees.length}
        driversClockedIn={clockedInDrivers}
        needsAttention={derived.pendingPaymentCount + storePendingSessions.length}
        needsAttentionHint={`${derived.pendingPaymentCount} unpaid · ${storePendingSessions.length} approvals`}
      />

      {salesError && derived.todaySales === 0 && (
        <div style={{ marginBottom: 16 }}>
          <ManagerErrorState title="Could not load today's sales" onRetry={() => void refetchSales()} />
        </div>
      )}

      <DashboardInsights
        formatCurrency={formatCurrency}
        activeOrders={activeOrders}
        sessions={{ data: sessions, loading: loadingSessions, error: !!sessionsError }}
        pendingSessions={{ data: storePendingSessions, loading: loadingPendingSessions, error: !!pendingSessionsError }}
        nowMs={nowMs}
        actionError={sessionActionError}
        onDismissActionError={() => setSessionActionError(null)}
        onApprove={handleApproveSession}
        onReject={handleRejectSession}
        actionBusy={approvingSession || rejectingSession}
        orderTypes={{ data: orderTypeRows, loading: loadingBreakdown, error: breakdownError }}
        peakHours={{ data: peakActive, loading: loadingPeak, error: peakError }}
        topProducts={{
          data: topProducts?.topProducts?.length ? topProducts.topProducts : derived.topProducts,
          error: productsError && derived.topProducts.length === 0,
        }}
        executiveSummary={{ data: executiveSummary?.revenue ? executiveSummary : undefined, error: execError }}
        forecast={{
          data: salesForecast?.forecasts?.length
            ? { items: salesForecast.forecasts, accuracy: salesForecast.accuracy, period: salesForecast.period }
            : undefined,
          error: forecastError,
        }}
        leaderboard={{
          data: staffLeaderboard?.rankings?.length
            ? { items: staffLeaderboard.rankings, period: staffLeaderboard.period }
            : undefined,
          error: leaderboardError,
        }}
        churn={{
          data: churnPrediction?.predictions?.length
            ? {
                items: churnPrediction.predictions,
                total: churnPrediction.totalAtRisk,
                high: churnPrediction.highRiskCount,
                medium: churnPrediction.mediumRiskCount,
                low: churnPrediction.lowRiskCount,
              }
            : undefined,
          error: churnError,
        }}
      />
    </ManagerPageFrame>
  );
};

export default DashboardSection;
