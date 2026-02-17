import React, { useState, useEffect } from 'react';
import ManagerMetricTemplate, { KPICardData } from './ManagerMetricTemplate';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import Card from '../../components/ui/neumorphic/Card';
import Button from '../../components/ui/neumorphic/Button';
import Badge from '../../components/ui/neumorphic/Badge';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import {
  useGetActiveStoreSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
  WorkingSession
} from '../../store/api/sessionApi';
import { useGetStoreMetricsQuery } from '../../store/api/storeApi';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';
import { useCheckWeeklyScheduleExistsQuery } from '../../store/api/shiftApi';
import {
  useGetTodaySalesMetricsQuery,
  useGetAverageOrderValueQuery,
  useGetDriverStatusQuery,
  useGetSalesTrendsQuery,
  useGetOrderTypeBreakdownQuery,
  useGetPeakHoursQuery,
  useGetStaffLeaderboardQuery,
  useGetTopProductsQuery,
  useGetSalesForecastQuery,
  useGetChurnPredictionQuery,
  useGetExecutiveSummaryQuery,
  useGetCustomerBehaviorAnalysisQuery,
  useGetDemandForecastQuery,
  useGetCostAnalysisQuery,
} from '../../store/api/analyticsApi';
import { pushNotificationService } from '../../services/pushNotificationService';
import { colors, shadows, spacing, typography } from '../../styles/design-tokens';

// TypeScript interfaces
interface SalesData {
  today: number;
  lastYear: number;
  percentageChange: number;
  yesterday: number;
  weeklyTotal: number;
}

interface Order {
  id: string;
  status: 'PREPARING' | 'OVEN' | 'BAKED' | 'DISPATCHED';
  items: number;
  time: string;
  customer: string;
  priority: 'normal' | 'urgent';
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentDate] = useState(new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  // Determine active tab from URL
  const getTabFromPath = () => {
    if (location.pathname.includes('/staff')) return 'staff';
    if (location.pathname.includes('/analytics')) return 'analytics';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();

  // Use selected store or fallback to user's store
  const storeId = selectedStoreId || currentUser?.storeId || '';

  // API Hooks
  // Pass storeId to trigger refetch when store changes
  const { data: sessions = [], isLoading: loadingSessions, error: sessionsError, refetch: refetchSessions } = useGetActiveStoreSessionsQuery(storeId, {
    skip: !storeId,
    pollingInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  // Pass storeId to trigger refetch when store changes
  const { data: storeMetrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useGetStoreMetricsQuery(storeId, {
    skip: !storeId,
    pollingInterval: 60000, // Poll every minute
  });

  // Pass storeId to trigger refetch when store changes
  const { data: liveOrders = [], isLoading: loadingOrders, refetch: refetchOrders } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId,
    pollingInterval: 10000, // Poll every 10 seconds for live updates
  });

  // Analytics API queries
  const { data: todaySalesMetrics, isLoading: loadingSales } = useGetTodaySalesMetricsQuery(storeId, {
    skip: !storeId,
    pollingInterval: 60000, // Poll every minute
  });

  const { data: avgOrderValue } = useGetAverageOrderValueQuery(storeId, {
    skip: !storeId,
    pollingInterval: 60000,
  });

  const { data: driverStatus } = useGetDriverStatusQuery(storeId, {
    skip: !storeId,
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const { data: salesTrends } = useGetSalesTrendsQuery(
    { period: 'WEEKLY', storeId },
    { skip: !storeId, pollingInterval: 300000 } // Poll every 5 minutes
  );

  const { data: orderTypeBreakdown } = useGetOrderTypeBreakdownQuery(storeId, {
    skip: !storeId,
    pollingInterval: 300000,
  });

  const { data: peakHours } = useGetPeakHoursQuery(storeId, {
    skip: !storeId,
    pollingInterval: 300000,
  });

  const { data: staffLeaderboard } = useGetStaffLeaderboardQuery(
    { storeId, period: 'TODAY' },
    { skip: !storeId, pollingInterval: 120000 } // Poll every 2 minutes
  );

  const { data: topProducts } = useGetTopProductsQuery(
    { storeId, period: 'TODAY', sortBy: 'REVENUE' },
    { skip: !storeId, pollingInterval: 300000 }
  );

  // BI Analytics
  const { data: salesForecast } = useGetSalesForecastQuery(
    { storeId, days: 7 },
    { skip: !storeId, pollingInterval: 3600000 } // Refresh hourly
  );

  const { data: churnPrediction } = useGetChurnPredictionQuery(
    { storeId, threshold: 0.5 },
    { skip: !storeId, pollingInterval: 3600000 }
  );

  const { data: executiveSummary } = useGetExecutiveSummaryQuery(storeId, {
    skip: !storeId,
    pollingInterval: 600000, // Refresh every 10 minutes
  });

  const { data: customerBehavior } = useGetCustomerBehaviorAnalysisQuery(storeId, {
    skip: !storeId,
    pollingInterval: 3600000, // Refresh every hour
  });

  const { data: demandForecast } = useGetDemandForecastQuery(
    { storeId, days: 7 },
    { skip: !storeId, pollingInterval: 3600000 }
  );

  const { data: costAnalysis } = useGetCostAnalysisQuery(
    { storeId, period: 'MONTH' },
    { skip: !storeId, pollingInterval: 3600000 }
  );

  // Refetch all data when store changes
  useEffect(() => {
    if (storeId) {
      refetchSessions();
      refetchMetrics();
      refetchOrders();
    }
  }, [storeId, refetchSessions, refetchMetrics, refetchOrders]);

  const [approveSession, { isLoading: approvingSession }] = useApproveSessionMutation();
  const [rejectSession, { isLoading: rejectingSession }] = useRejectSessionMutation();

  // Check if we should show schedule reminder (Thursday-Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 4 = Thursday, 6 = Saturday
  const shouldShowScheduleReminder = dayOfWeek === 0 || dayOfWeek >= 4; // Thursday, Friday, Saturday, Sunday

  // Calculate next Monday's date for schedule check
  const getNextMonday = () => {
    const date = new Date();
    const day = date.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day; // If Sunday, 1 day, otherwise 8 - current day
    date.setDate(date.getDate() + daysUntilMonday);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const nextMondayDate = getNextMonday();

  // Check if next week's schedule exists
  const { data: scheduleCheck } = useCheckWeeklyScheduleExistsQuery(
    { storeId, startDate: nextMondayDate },
    { skip: !storeId || !shouldShowScheduleReminder }
  );

  // Show banner if it's Thursday-Sunday AND next week has no or incomplete schedule
  const showScheduleBanner = shouldShowScheduleReminder &&
    scheduleCheck &&
    (!scheduleCheck.exists || scheduleCheck.shiftCount < 5);

  // Request notification permission and schedule push notifications
  useEffect(() => {
    if (showScheduleBanner && scheduleCheck) {
      // Request permission on first load
      pushNotificationService.requestPermission().then(granted => {
        if (granted) {
          // Schedule push notification reminder
          pushNotificationService.scheduleWeeklyReminder(nextMondayDate);
        }
      });

      // Clean up old reminder flags
      pushNotificationService.clearOldReminders();
    }
  }, [showScheduleBanner, nextMondayDate, scheduleCheck]);

  // Real sales data from analytics API
  const salesData: SalesData = {
    today: todaySalesMetrics?.todaySales || 0,
    lastYear: todaySalesMetrics?.lastYearSameDaySales || 0,
    percentageChange: todaySalesMetrics?.percentChangeFromLastYear || 0,
    yesterday: todaySalesMetrics?.yesterdaySalesAtSameTime || 0,
    weeklyTotal: salesTrends?.totalSales || 0
  };

  // Get active orders from API
  const orderQueue: Order[] = liveOrders
    .filter(order => !['DELIVERED', 'CANCELLED'].includes(order.status))
    .map(order => ({
      id: order.orderNumber,
      status: order.status as Order['status'],
      items: order.items.length,
      time: new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      customer: order.customerName,
      priority: order.priority.toLowerCase() as Order['priority']
    }));

  const handleApproveSession = async (sessionId: string): Promise<void> => {
    try {
      await approveSession(sessionId).unwrap();
      // Success handled by RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to approve session:', error);
      alert('Failed to approve session. Please try again.');
    }
  };

  const handleRejectSession = async (sessionId: string): Promise<void> => {
    try {
      await rejectSession({ sessionId, reason: 'Manager rejected' }).unwrap();
      // Success handled by RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to reject session:', error);
      alert('Failed to reject session. Please try again.');
    }
  };

  // Helper function to calculate duration
  const calculateDuration = (loginTime: string): string => {
    const login = new Date(loginTime);
    const now = new Date();
    const diff = now.getTime() - login.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Helper function to format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };



  const OverviewTab: React.FC = () => {
    const dashboardKPIs: KPICardData[] = [
      {
        label: "Today's Sales",
        value: loadingMetrics ? '...' : `₹${salesData.today.toLocaleString('en-IN')}`,
        sub: `+${salesData.percentageChange}% vs Last Year`,
        trend: salesData.percentageChange >= 0 ? 'up' : 'down',
        accentColor: '#e53e3e',
      },
      {
        label: 'Weekly Total',
        value: loadingMetrics ? '...' : `₹${salesData.weeklyTotal.toLocaleString('en-IN')}`,
        sub: 'Last 7 days',
        trend: 'neutral',
        accentColor: '#7B1FA2',
      },
      {
        label: 'Active Staff',
        value: loadingSessions ? '...' : (storeMetrics?.activeEmployees || sessions.filter(s => s.isActive).length),
        sub: 'Currently working',
        trend: 'neutral',
        accentColor: '#00B14F',
      },
      {
        label: 'Pending Orders',
        value: loadingMetrics ? '...' : (storeMetrics?.activeOrders || orderQueue.filter(o => o.status !== 'DISPATCHED').length),
        sub: `${orderQueue.filter(o => o.priority === 'urgent').length} urgent`,
        trend: orderQueue.filter(o => o.priority === 'urgent').length > 0 ? 'down' : 'neutral',
        accentColor: '#FF6B35',
      },
    ];

    return (
    <div>
      <ManagerMetricTemplate kpis={dashboardKPIs} isLoading={loadingMetrics && loadingSessions} />
      <div style={{ marginTop: spacing[6] }}>

      {/* Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[5] }}>
        <Card elevation="lg" padding="base" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: spacing[6],
            borderBottom: `1px solid ${colors.surface.border}`,
            background: `linear-gradient(135deg, ${colors.surface.background} 0%, ${colors.surface.secondary} 100%)`,
            margin: `-${spacing[6]} -${spacing[6]} ${spacing[5]} -${spacing[6]}`
          }}>
            <h3 style={{
              margin: '0',
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              Live Order Queue
            </h3>
          </div>
          <div>
            {orderQueue.length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: colors.text.secondary,
                padding: spacing[5]
              }}>
                No pending orders
              </p>
            ) : (
              orderQueue.map(order => (
                <Card
                  key={order.id}
                  elevation="sm"
                  padding="base"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing[3]
                  }}
                >
                  <div>
                    <div style={{
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      #{order.id.slice(-3)} - {order.customer}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary
                    }}>
                      {order.items} items • {order.time}
                      {order.priority === 'urgent' && (
                        <Badge variant="error" size="sm" style={{ marginLeft: spacing[2] }}>
                          URGENT
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      order.status === 'BAKED' ? 'success' :
                      order.status === 'OVEN' ? 'error' :
                      order.status === 'DISPATCHED' ? 'secondary' :
                      'warning'
                    }
                    size="sm"
                  >
                    {order.status}
                  </Badge>
                </Card>
              ))
            )}
          </div>
        </Card>

        <Card elevation="lg" padding="base" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: spacing[6],
            borderBottom: `1px solid ${colors.surface.border}`,
            background: `linear-gradient(135deg, ${colors.surface.background} 0%, ${colors.surface.secondary} 100%)`,
            margin: `-${spacing[6]} -${spacing[6]} ${spacing[5]} -${spacing[6]}`
          }}>
            <h3 style={{
              margin: '0',
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              Active Staff Sessions
            </h3>
          </div>
          <div>
            {loadingSessions ? (
              <p style={{
                textAlign: 'center',
                color: colors.text.secondary,
                padding: spacing[5]
              }}>
                Loading sessions...
              </p>
            ) : sessionsError ? (
              <p style={{
                textAlign: 'center',
                color: colors.semantic.error,
                padding: spacing[5]
              }}>
                Error loading sessions
              </p>
            ) : sessions.filter(s => s.isActive).length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: colors.text.secondary,
                padding: spacing[5]
              }}>
                No active sessions
              </p>
            ) : (
              sessions.filter(s => s.isActive).map(session => (
                <Card
                  key={session.id}
                  elevation="sm"
                  padding="base"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[4],
                    marginBottom: spacing[3]
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, ${colors.brand.secondaryDark} 100%)`,
                    color: colors.text.inverse,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    boxShadow: shadows.brand.secondary
                  }}>
                    {session.employeeName?.split(' ').map(n => n[0]).join('') || '??'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: '2px'
                    }}>
                      {session.employeeName || 'Unknown Employee'}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary
                    }}>
                      {session.role} • {calculateDuration(session.loginTime)}
                    </div>
                  </div>
                  <Badge variant="success" dot />
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
  };

  const StaffTab: React.FC = () => (
    <div>
      <Card elevation="lg" padding="lg" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: spacing[6],
          borderBottom: `1px solid ${colors.surface.border}`,
          background: `linear-gradient(135deg, ${colors.surface.background} 0%, ${colors.surface.secondary} 100%)`,
          margin: `-${spacing[6]} -${spacing[6]} ${spacing[6]} -${spacing[6]}`
        }}>
          <h3 style={{
            margin: '0',
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary
          }}>
            Staff Working Sessions
          </h3>
        </div>
        <div>
          {loadingSessions ? (
            <p style={{
              textAlign: 'center',
              color: colors.text.secondary,
              padding: spacing[10]
            }}>
              Loading sessions...
            </p>
          ) : sessionsError ? (
            <p style={{
              textAlign: 'center',
              color: colors.semantic.error,
              padding: spacing[10]
            }}>
              Error loading sessions. Please try again.
            </p>
          ) : sessions.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: colors.text.secondary,
              padding: spacing[10]
            }}>
              No sessions found for today
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: spacing[5]
            }}>
              {sessions.map(session => (
                <Card key={session.id} elevation="sm" padding="lg">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[4],
                    marginBottom: spacing[4]
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, ${colors.brand.secondaryDark} 100%)`,
                      color: colors.text.inverse,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      boxShadow: shadows.brand.secondary
                    }}>
                      {session.employeeName?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 style={{
                        margin: '0 0 4px 0',
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary
                      }}>
                        {session.employeeName}
                      </h4>
                      <p style={{
                        margin: '0',
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary
                      }}>
                        {session.role}
                      </p>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <Badge variant={session.isActive ? 'success' : 'error'} size="sm">
                        {session.isActive ? 'ACTIVE' : 'OFFLINE'}
                      </Badge>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: spacing[4],
                    marginBottom: spacing[4]
                  }}>
                    <div>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.secondary
                      }}>
                        LOGIN TIME
                      </p>
                      <p style={{
                        margin: '0',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary
                      }}>
                        {formatTime(session.loginTime)}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.secondary
                      }}>
                        {session.isActive ? 'DURATION' : 'LOGOUT TIME'}
                      </p>
                      <p style={{
                        margin: '0',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary
                      }}>
                        {session.isActive ? calculateDuration(session.loginTime) : (session.logoutTime ? formatTime(session.logoutTime) : 'N/A')}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.secondary
                      }}>
                        BREAK TIME
                      </p>
                      <p style={{
                        margin: '0',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary
                      }}>
                        {session.breakTime}m
                      </p>
                    </div>
                    <div>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.secondary
                      }}>
                        TOTAL HOURS
                      </p>
                      <p style={{
                        margin: '0',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary
                      }}>
                        {session.totalHours ? `${session.totalHours}h` : calculateDuration(session.loginTime)}
                      </p>
                    </div>
                  </div>

                  {session.status === 'PENDING_APPROVAL' && (
                    <div style={{ display: 'flex', gap: spacing[2] }}>
                      <Button
                        variant="secondary"
                        size="base"
                        onClick={() => handleApproveSession(session.id)}
                        disabled={approvingSession}
                        isLoading={approvingSession}
                        style={{ flex: 1, background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successDark} 100%)` }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="base"
                        onClick={() => handleRejectSession(session.id)}
                        disabled={rejectingSession}
                        isLoading={rejectingSession}
                        style={{ flex: 1 }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const AnalyticsTab: React.FC = () => (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: spacing[5],
        marginBottom: spacing[8]
      }}>
        {/* Quick Stats */}
        <Card elevation="base" padding="lg">
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[2]
          }}>
            WEEKLY REVENUE
          </div>
          <div style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            marginBottom: spacing[1]
          }}>
            {loadingMetrics ? '...' : `₹${salesData.weeklyTotal.toLocaleString('en-IN')}`}
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.semantic.success
          }}>
            ↑ {salesData.percentageChange}% vs last week
          </div>
        </Card>

        <Card elevation="base" padding="lg">
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[2]
          }}>
            AVG ORDER VALUE
          </div>
          <div style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            marginBottom: spacing[1]
          }}>
            {loadingMetrics ? '...' : `₹${(storeMetrics?.averageOrderValue || 0).toLocaleString('en-IN')}`}
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary
          }}>
            Per customer
          </div>
        </Card>

        <Card elevation="base" padding="lg">
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[2]
          }}>
            TOTAL ORDERS
          </div>
          <div style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            marginBottom: spacing[1]
          }}>
            {loadingMetrics ? '...' : (storeMetrics?.totalOrders || 0)}
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary
          }}>
            This week
          </div>
        </Card>

        <Card elevation="base" padding="lg">
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[2]
          }}>
            COMPLETION RATE
          </div>
          <div style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            marginBottom: spacing[1]
          }}>
            {loadingMetrics ? '...' : '98.5%'}
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.semantic.success
          }}>
            ↑ 2.3% improvement
          </div>
        </Card>
      </div>

      {/* Main Analytics Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing[5] }}>
        <Card elevation="lg" padding="lg">
          <h3 style={{
            margin: `0 0 ${spacing[5]} 0`,
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary
          }}>
            Order Flow Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            {[
              { stage: 'Received', count: orderQueue.filter(o => o.status === 'PREPARING').length, color: colors.semantic.info },
              { stage: 'In Kitchen', count: orderQueue.filter(o => ['PREPARING', 'OVEN'].includes(o.status)).length, color: colors.semantic.warning },
              { stage: 'Ready', count: orderQueue.filter(o => o.status === 'BAKED').length, color: colors.semantic.success },
              { stage: 'Dispatched', count: orderQueue.filter(o => o.status === 'DISPATCHED').length, color: colors.brand.secondary },
            ].map(item => (
              <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <div style={{
                  width: '100px',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary
                }}>
                  {item.stage}
                </div>
                <div style={{
                  flex: 1,
                  height: '28px',
                  backgroundColor: colors.surface.primary,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: shadows.inset.sm
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((item.count / (orderQueue.length || 1)) * 100, 100)}%`,
                    backgroundColor: item.color,
                    transition: 'width 0.3s ease',
                    boxShadow: shadows.floating.sm
                  }} />
                </div>
                <div style={{
                  width: '40px',
                  textAlign: 'right',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary
                }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card elevation="lg" padding="lg">
          <h3 style={{
            margin: `0 0 ${spacing[5]} 0`,
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary
          }}>
            Top Performers
          </h3>
          {sessions.filter(s => s.isActive).length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: colors.text.secondary,
              padding: spacing[5]
            }}>
              No active staff
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {sessions.filter(s => s.isActive).slice(0, 5).map((staff, idx) => (
                <Card
                  key={staff.id}
                  elevation="sm"
                  padding="base"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                    ...(idx === 0 && {
                      background: `linear-gradient(135deg, ${colors.semantic.warningLight}22 0%, ${colors.semantic.warning}11 100%)`,
                      border: `2px solid ${colors.semantic.warning}`,
                    })
                  }}
                >
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.extrabold,
                    color: idx === 0 ? colors.semantic.warning : colors.text.tertiary,
                    width: '24px'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary
                    }}>
                      {staff.employeeName}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary
                    }}>
                      {staff.role}
                    </div>
                  </div>
                  {idx === 0 && <span style={{ fontSize: typography.fontSize.xl }}>🏆</span>}
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Staff Leaderboard */}
      {staffLeaderboard && staffLeaderboard.rankings && staffLeaderboard.rankings.length > 0 && (
        <div style={{ marginTop: spacing[5] }}>
          <Card elevation="lg" padding="lg">
            <h3 style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              Staff Leaderboard - {staffLeaderboard.period}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[4] }}>
              {staffLeaderboard.rankings.slice(0, 6).map((staff: any, idx: number) => (
                <Card key={staff.staffId} elevation="sm" padding="base">
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                    <div style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.extrabold,
                      color: idx < 3 ? colors.semantic.warning : colors.text.tertiary
                    }}>
                      #{staff.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>
                        {staff.staffName}
                      </div>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                        {staff.performanceLevel}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                    Orders: {staff.ordersProcessed} | Sales: ₹{staff.salesGenerated.toLocaleString('en-IN')}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Top Products */}
      {topProducts && topProducts.topProducts && topProducts.topProducts.length > 0 && (
        <div style={{ marginTop: spacing[5] }}>
          <Card elevation="lg" padding="lg">
            <h3 style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              Top Selling Products - {topProducts.period}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {topProducts.topProducts.slice(0, 5).map((product: any) => (
                <div key={product.itemId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  padding: spacing[3],
                  backgroundColor: colors.surface.secondary,
                  borderRadius: '12px'
                }}>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.extrabold,
                    color: product.rank === 1 ? colors.semantic.warning : colors.text.tertiary
                  }}>
                    #{product.rank}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
                      {product.itemName}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                      {product.category} | Sold: {product.quantitySold} units
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>
                      ₹{product.revenue.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                      {product.percentOfTotalRevenue.toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Executive Summary - BI */}
      {executiveSummary && (
        <div style={{ marginTop: spacing[5] }}>
          <Card elevation="lg" padding="lg">
            <h3 style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              Executive Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[4], marginBottom: spacing[4] }}>
              <div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Revenue</div>
                <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>
                  ₹{executiveSummary.revenue.total.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, color: executiveSummary.revenue.change >= 0 ? colors.semantic.success : colors.semantic.error }}>
                  {executiveSummary.revenue.change >= 0 ? '↑' : '↓'} {Math.abs(executiveSummary.revenue.change)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Orders</div>
                <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>
                  {executiveSummary.orders.total}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, color: executiveSummary.orders.change >= 0 ? colors.semantic.success : colors.semantic.error }}>
                  {executiveSummary.orders.change >= 0 ? '↑' : '↓'} {Math.abs(executiveSummary.orders.change)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Customers At Risk</div>
                <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.semantic.warning }}>
                  {executiveSummary.customers.atRisk}
                </div>
              </div>
            </div>
            {executiveSummary.topInsights && executiveSummary.topInsights.length > 0 && (
              <div>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>
                  Key Insights
                </div>
                {executiveSummary.topInsights.slice(0, 3).map((insight: string, idx: number) => (
                  <div key={idx} style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[1] }}>
                    • {insight}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Churn Prediction - BI */}
      {churnPrediction && churnPrediction.predictions && churnPrediction.predictions.length > 0 && (
        <div style={{ marginTop: spacing[5] }}>
          <Card elevation="lg" padding="lg">
            <h3 style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              At-Risk Customers ({churnPrediction.totalAtRisk})
            </h3>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
              High Risk: {churnPrediction.highRiskCount} | Medium: {churnPrediction.mediumRiskCount} | Low: {churnPrediction.lowRiskCount}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {churnPrediction.predictions.slice(0, 5).map((pred: any) => (
                <div key={pred.customerId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing[3],
                  backgroundColor: colors.surface.secondary,
                  borderRadius: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: typography.fontWeight.semibold }}>{pred.customerName}</div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                      Last order: {pred.daysSinceLastOrder} days ago
                    </div>
                  </div>
                  <div style={{
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: '8px',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    backgroundColor: pred.riskLevel === 'HIGH' ? colors.semantic.error : pred.riskLevel === 'MEDIUM' ? colors.semantic.warning : colors.semantic.info,
                    color: '#ffffff'
                  }}>
                    {pred.riskLevel}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Sales Forecast - BI */}
      {salesForecast && salesForecast.forecasts && salesForecast.forecasts.length > 0 && (
        <div style={{ marginTop: spacing[5] }}>
          <Card elevation="lg" padding="lg">
            <h3 style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              7-Day Sales Forecast
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {salesForecast.forecasts.map((forecast: any) => (
                <div key={forecast.date} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: spacing[3],
                  backgroundColor: colors.surface.secondary,
                  borderRadius: '12px'
                }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>
                    {new Date(forecast.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontWeight: typography.fontWeight.bold }}>
                    ₹{forecast.forecastedSales.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.surface.background,
      fontFamily: typography.fontFamily.primary,
    }}>
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .sidebar-curve {
          position: absolute;
          left: -20px;
          top: 0;
          bottom: 0;
          width: 20px;
          background: ${colors.surface.background};
        }

        .sidebar-curve::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 20px;
          height: 100%;
          border-radius: 0 20px 20px 0;
          box-shadow: inset -8px 0 16px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <AppHeader title="Manager Dashboard" showManagerNav={true} storeSelectorContextKey="dashboard" />

      {/* Schedule Reminder Banner */}
      {showScheduleBanner && (
        <div style={{
          backgroundColor: colors.semantic.warning,
          color: colors.text.primary,
          padding: spacing[4],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: shadows.floating.sm,
          borderBottom: `2px solid ${colors.semantic.warningDark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <span style={{ fontSize: typography.fontSize['2xl'] }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold }}>
                Schedule Reminder
              </h3>
              <p style={{ margin: 0, fontSize: typography.fontSize.sm, opacity: 0.9 }}>
                {scheduleCheck?.shiftCount === 0
                  ? "Next week's schedule hasn't been created yet."
                  : `Next week's schedule is incomplete (${scheduleCheck?.shiftCount || 0} shifts scheduled).`}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/manager/staff-scheduling')}
            style={{
              backgroundColor: colors.brand.secondary,
              color: colors.text.inverse,
            }}
          >
            Go to Scheduling
          </Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        position: 'sticky',
        top: '64px',
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 999,
        backgroundColor: colors.surface.primary,
        borderBottom: `1px solid ${colors.surface.border}`,
        padding: `0 ${spacing[8]}`,
        boxShadow: shadows.floating.sm,
        marginBottom: spacing[6]
      }}>
        <div style={{ display: 'flex', gap: spacing[10] }}>
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'staff', label: 'Staff Sessions', icon: '👥' },
            { key: 'analytics', label: 'Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                navigate(`/manager/${tab.key === 'overview' ? '' : tab.key}`);
              }}
              style={{
                padding: `${spacing[5]} 0`,
                background: 'none',
                border: 'none',
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                color: activeTab === tab.key ? colors.brand.secondary : colors.text.secondary,
                borderBottom: activeTab === tab.key ? `3px solid ${colors.brand.secondary}` : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ fontSize: typography.fontSize.lg }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: spacing[8] }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
};

export default withPageStoreContext(DashboardPage, 'dashboard');
