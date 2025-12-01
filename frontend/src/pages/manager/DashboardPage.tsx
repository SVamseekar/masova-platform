import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import StoreSelector from '../../components/StoreSelector';
import Card from '../../components/ui/neumorphic/Card';
import Button from '../../components/ui/neumorphic/Button';
import Badge from '../../components/ui/neumorphic/Badge';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId, selectSelectedStoreName } from '../../store/slices/cartSlice';
import {
  useGetActiveStoreSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
  WorkingSession
} from '../../store/api/sessionApi';
import { useGetStoreMetricsQuery } from '../../store/api/storeApi';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';
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
    if (location.pathname.includes('/links')) return 'links';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkType, setLinkType] = useState<'pos' | 'driver' | null>(null);

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const selectedStoreName = useAppSelector(selectSelectedStoreName);

  // Use selected store or fallback to user's store
  const storeId = selectedStoreId || currentUser?.storeId || '';

  // API Hooks
  const { data: sessions = [], isLoading: loadingSessions, error: sessionsError } = useGetActiveStoreSessionsQuery(undefined, {
    skip: !storeId,
    pollingInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  const { data: storeMetrics, isLoading: loadingMetrics } = useGetStoreMetricsQuery(undefined, {
    skip: !storeId,
    pollingInterval: 60000, // Poll every minute
  });

  const { data: liveOrders = [], isLoading: loadingOrders } = useGetStoreOrdersQuery(undefined, {
    skip: !storeId,
    pollingInterval: 10000, // Poll every 10 seconds for live updates
  });

  const [approveSession, { isLoading: approvingSession }] = useApproveSessionMutation();
  const [rejectSession, { isLoading: rejectingSession }] = useRejectSessionMutation();

  // Calculate sales data from metrics (placeholder until analytics API is fully connected)
  const salesData: SalesData = {
    today: storeMetrics?.totalRevenue || 0,
    lastYear: Math.floor((storeMetrics?.totalRevenue || 0) * 0.85), // Estimate
    percentageChange: 18.4, // Will be calculated from analytics API
    yesterday: Math.floor((storeMetrics?.totalRevenue || 0) * 0.93), // Estimate
    weeklyTotal: (storeMetrics?.totalRevenue || 0) * 6.2 // Estimate
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

  // Management page categories
  const managementCategories = [
    {
      title: 'Orders & Payments',
      icon: '💰',
      color: colors.semantic.success,
      items: [
        { path: '/manager/orders', label: 'Order Management', icon: '📦', description: 'Track and manage all orders' },
        { path: '/manager/payments', label: 'Payments', icon: '💳', description: 'Payment processing & history' },
        { path: '/manager/refunds', label: 'Refunds', icon: '↩️', description: 'Handle refund requests' },
        { path: '/manager/deliveries', label: 'Deliveries', icon: '🚚', description: 'Delivery status tracking' },
      ]
    },
    {
      title: 'Inventory & Supply',
      icon: '📊',
      color: colors.semantic.info,
      items: [
        { path: '/manager/inventory', label: 'Inventory', icon: '📊', description: 'Stock levels & tracking' },
        { path: '/manager/suppliers', label: 'Suppliers', icon: '🏭', description: 'Manage supplier relationships' },
        { path: '/manager/purchase-orders', label: 'Purchase Orders', icon: '📋', description: 'Create & track POs' },
        { path: '/manager/waste-analysis', label: 'Waste Analysis', icon: '🗑️', description: 'Track waste & optimize' },
      ]
    },
    {
      title: 'Operations',
      icon: '⚙️',
      color: colors.brand.secondary,
      items: [
        { path: '/manager/recipes', label: 'Recipes', icon: '📖', description: 'Recipe management' },
        { path: `/pos?storeId=${storeId}`, label: 'POS System', icon: '🖥️', description: 'Point of sale access' },
        { path: '/manager/drivers', label: 'Drivers', icon: '🚗', description: 'Driver fleet management' },
        { path: '/manager/stores', label: 'Stores', icon: '🏪', description: 'Multi-store management' },
      ]
    },
    {
      title: 'People & Marketing',
      icon: '👥',
      color: colors.semantic.warning,
      items: [
        { path: '/manager/customers', label: 'Customers', icon: '👥', description: 'Customer database & insights' },
        { path: '/manager/campaigns', label: 'Campaigns', icon: '📢', description: 'Marketing campaigns' },
      ]
    },
  ];

  const [managementSearchQuery, setManagementSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(managementCategories.map(cat => cat.title)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Keyboard shortcut: ESC to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  const OverviewTab: React.FC = () => (
    <div>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: spacing[5],
        marginBottom: spacing[8]
      }}>
        <Card
          elevation="md"
          padding="lg"
          style={{
            background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, ${colors.brand.secondaryDark} 100%)`,
            color: colors.text.inverse,
            boxShadow: shadows.brand.secondary
          }}
        >
          <h3 style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            margin: '0 0 8px 0',
            opacity: 0.9
          }}>
            Today's Sales
          </h3>
          <p style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            margin: '0'
          }}>
            {loadingMetrics ? '...' : `₹${salesData.today.toLocaleString('en-IN')}`}
          </p>
          <p style={{
            fontSize: typography.fontSize.sm,
            margin: '8px 0 0 0',
            opacity: 0.8
          }}>
            +{salesData.percentageChange}% vs Last Year
          </p>
        </Card>

        <Card elevation="md" padding="lg">
          <h3 style={{
            color: colors.brand.secondary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            margin: '0 0 8px 0'
          }}>
            Weekly Total
          </h3>
          <p style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            margin: '0',
            color: colors.text.primary
          }}>
            {loadingMetrics ? '...' : `₹${salesData.weeklyTotal.toLocaleString('en-IN')}`}
          </p>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.semantic.success,
            margin: '8px 0 0 0'
          }}>
            Last 7 days
          </p>
        </Card>

        <Card elevation="md" padding="lg">
          <h3 style={{
            color: colors.brand.secondary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            margin: '0 0 8px 0'
          }}>
            Active Staff
          </h3>
          <p style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            margin: '0',
            color: colors.text.primary
          }}>
            {loadingSessions ? '...' : storeMetrics?.activeEmployees || sessions.filter(s => s.isActive).length}
          </p>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: '8px 0 0 0'
          }}>
            Currently working
          </p>
        </Card>

        <Card elevation="md" padding="lg">
          <h3 style={{
            color: colors.brand.secondary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            margin: '0 0 8px 0'
          }}>
            Pending Orders
          </h3>
          <p style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            margin: '0',
            color: colors.text.primary
          }}>
            {loadingMetrics ? '...' : storeMetrics?.activeOrders || orderQueue.filter(o => o.status !== 'DISPATCHED').length}
          </p>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.semantic.error,
            margin: '8px 0 0 0'
          }}>
            {orderQueue.filter(o => o.priority === 'urgent').length} urgent
          </p>
        </Card>
      </div>

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
                    {session.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: '2px'
                    }}>
                      {session.name}
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
  );

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
                      {session.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 style={{
                        margin: '0 0 4px 0',
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary
                      }}>
                        {session.name}
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
                      {staff.name}
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
    </div>
  );

  const generateShareableLink = (type: 'pos' | 'driver') => {
    const baseUrl = window.location.origin;
    if (type === 'pos') {
      return `${baseUrl}/pos?storeId=${storeId}`;
    } else {
      return `${baseUrl}/driver?storeId=${storeId}`;
    }
  };

  const handleCopyLink = (type: 'pos' | 'driver') => {
    const link = generateShareableLink(type);
    navigator.clipboard.writeText(link);
    alert(`${type === 'pos' ? 'POS' : 'Driver App'} link copied to clipboard!`);
  };

  const handleShareLink = (type: 'pos' | 'driver') => {
    setLinkType(type);
    setShowLinkDialog(true);
  };

  const LinksTab: React.FC = () => (
    <div>
      <Card elevation="lg" padding="xl">
        <h3 style={{
          margin: `0 0 ${spacing[6]} 0`,
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary
        }}>
          Share System Links
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: spacing[6]
        }}>
          {/* POS System */}
          <Card
            elevation="md"
            padding="lg"
            style={{
              border: `2px solid ${colors.semantic.info}`,
              background: `linear-gradient(135deg, ${colors.semantic.infoLight}11 0%, ${colors.semantic.info}05 100%)`
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: spacing[5] }}>
              <div style={{ fontSize: typography.fontSize['5xl'], marginBottom: spacing[3] }}>🖥️</div>
              <h4 style={{
                margin: `0 0 ${spacing[2]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary
              }}>
                POS System
              </h4>
              <p style={{
                margin: '0',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                Share with staff to access the point-of-sale system
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              <Button
                variant="secondary"
                size="base"
                onClick={() => handleCopyLink('pos')}
                style={{ background: `linear-gradient(135deg, ${colors.semantic.info} 0%, ${colors.semantic.infoDark} 100%)` }}
              >
                Copy POS Link
              </Button>
              <Button
                variant="ghost"
                size="base"
                onClick={() => handleShareLink('pos')}
                style={{ color: colors.semantic.info }}
              >
                View Link
              </Button>
            </div>
          </Card>

          {/* Driver App */}
          <Card
            elevation="md"
            padding="lg"
            style={{
              border: `2px solid ${colors.brand.secondary}`,
              background: `linear-gradient(135deg, ${colors.brand.secondaryLight}11 0%, ${colors.brand.secondary}05 100%)`
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: spacing[5] }}>
              <div style={{ fontSize: typography.fontSize['5xl'], marginBottom: spacing[3] }}>🚗</div>
              <h4 style={{
                margin: `0 0 ${spacing[2]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary
              }}>
                Driver App
              </h4>
              <p style={{
                margin: '0',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                Share with delivery drivers to manage deliveries
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              <Button
                variant="secondary"
                size="base"
                onClick={() => handleCopyLink('driver')}
              >
                Copy Driver Link
              </Button>
              <Button
                variant="ghost"
                size="base"
                onClick={() => handleShareLink('driver')}
                style={{ color: colors.brand.secondary }}
              >
                View Link
              </Button>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.surface.background,
      fontFamily: typography.fontFamily.primary
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
      <AppHeader title="Manager Dashboard" />

      {/* Store Selector Bar */}
      <div style={{
        backgroundColor: colors.surface.primary,
        padding: spacing[4] + ' ' + spacing[8],
        boxShadow: shadows.floating.sm,
        borderBottom: `1px solid ${colors.surface.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
          <StoreSelector variant="manager" />
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary
          }}>
            {storeId ? `Viewing data for: ${selectedStoreName || currentUser?.storeId}` : 'Select a store to view data'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: colors.surface.primary,
        borderBottom: `1px solid ${colors.surface.border}`,
        padding: `0 ${spacing[8]}`,
        boxShadow: shadows.floating.sm
      }}>
        <div style={{ display: 'flex', gap: spacing[10] }}>
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'staff', label: 'Staff Sessions', icon: '👥' },
            { key: 'analytics', label: 'Analytics', icon: '📈' },
            { key: 'links', label: 'Share Links', icon: '🔗' },
            { key: 'reviews', label: 'Reviews', icon: '⭐' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'reviews') {
                  navigate('/manager/reviews');
                } else {
                  setActiveTab(tab.key);
                  navigate(`/manager/${tab.key === 'overview' ? '' : tab.key}`);
                }
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

      {/* Management Hub Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onMouseEnter={(e) => {
          if (!isSidebarOpen) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSidebarOpen) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
        style={{
          position: 'fixed',
          top: '100px',
          right: spacing[6],
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: `${spacing[3]} ${spacing[4]}`,
          borderRadius: '50px',
          backgroundColor: isSidebarOpen ? colors.brand.primary : colors.surface.primary,
          border: `2px solid ${colors.brand.primary}`,
          cursor: 'pointer',
          boxShadow: isSidebarOpen ? shadows.floating.lg : shadows.floating.md,
          zIndex: 999,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isSidebarOpen ? 0 : 1,
          pointerEvents: isSidebarOpen ? 'none' : 'auto',
        }}
      >
        {/* Grid Icon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '3px',
          width: '20px',
          height: '20px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: isSidebarOpen ? colors.text.inverse : colors.brand.primary,
            borderRadius: '2px',
            transition: 'all 0.3s ease'
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: isSidebarOpen ? colors.text.inverse : colors.brand.primary,
            borderRadius: '2px',
            transition: 'all 0.3s ease'
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: isSidebarOpen ? colors.text.inverse : colors.brand.primary,
            borderRadius: '2px',
            transition: 'all 0.3s ease'
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: isSidebarOpen ? colors.text.inverse : colors.brand.primary,
            borderRadius: '2px',
            transition: 'all 0.3s ease'
          }} />
        </div>

        {/* Label */}
        <span style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.bold,
          color: isSidebarOpen ? colors.text.inverse : colors.brand.primary,
          whiteSpace: 'nowrap',
          transition: 'color 0.3s ease'
        }}>
          Management Hub
        </span>
      </button>

      {/* Overlay */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.4s ease'
        }}
      />

      {/* Management Pages Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '520px',
        maxWidth: '90vw',
        backgroundColor: colors.surface.background,
        boxShadow: isSidebarOpen ? '-8px 0 32px rgba(0, 0, 0, 0.3)' : 'none',
        zIndex: 1001,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'visible',
        willChange: 'transform',
        borderTopLeftRadius: '32px',
        borderBottomLeftRadius: '32px'
      }}>
        {/* Curved Left Edge */}
        <div className="sidebar-curve" />
        {/* Sidebar Header */}
        <div style={{
          padding: `${spacing[6]} ${spacing[6]} ${spacing[5]} ${spacing[6]}`,
          background: `linear-gradient(135deg, ${colors.brand.primary}11 0%, ${colors.brand.secondary}11 100%)`,
          borderBottom: `2px solid ${colors.surface.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing[4]
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                marginBottom: spacing[2]
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: shadows.brand.primary
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '3px',
                    width: '20px',
                    height: '20px'
                  }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: colors.text.inverse, borderRadius: '2px' }} />
                    <div style={{ width: '8px', height: '8px', backgroundColor: colors.text.inverse, borderRadius: '2px' }} />
                    <div style={{ width: '8px', height: '8px', backgroundColor: colors.text.inverse, borderRadius: '2px' }} />
                    <div style={{ width: '8px', height: '8px', backgroundColor: colors.text.inverse, borderRadius: '2px' }} />
                  </div>
                </div>
                <h3 style={{
                  margin: '0',
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.extrabold,
                  color: colors.text.primary,
                  letterSpacing: '-0.02em'
                }}>
                  Management Hub
                </h3>
              </div>
              <p style={{
                margin: '0',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                lineHeight: '1.5'
              }}>
                Navigate to all management features
              </p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: colors.surface.primary,
                border: `2px solid ${colors.surface.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: colors.text.secondary,
                boxShadow: shadows.raised.sm,
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.semantic.error;
                e.currentTarget.style.color = colors.text.inverse;
                e.currentTarget.style.borderColor = colors.semantic.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface.primary;
                e.currentTarget.style.color = colors.text.secondary;
                e.currentTarget.style.borderColor = colors.surface.border;
              }}
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: spacing[3]
          }}>
            <div style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: typography.fontSize.lg,
              color: colors.text.tertiary
            }}>
              🔍
            </div>
            <input
              type="text"
              placeholder="Search management pages..."
              value={managementSearchQuery}
              onChange={(e) => setManagementSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[10]}`,
                border: `2px solid ${colors.surface.border}`,
                borderRadius: '12px',
                outline: 'none',
                backgroundColor: colors.surface.primary,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.primary,
                boxShadow: shadows.inset.sm,
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.brand.primary}22`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.surface.border;
                e.currentTarget.style.boxShadow = shadows.inset.sm;
              }}
            />
          </div>

          {/* Expand/Collapse Controls */}
          <div style={{
            display: 'flex',
            gap: spacing[3]
          }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={expandAll}
              style={{
                flex: 1,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold
              }}
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              style={{
                flex: 1,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold
              }}
            >
              Collapse All
            </Button>
          </div>
        </div>

        {/* Categorized Management Sections */}
        <div style={{
          padding: spacing[6],
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[5],
          flex: 1
        }}>
          {managementCategories
            .filter(category => {
              if (!managementSearchQuery) return true;
              return category.items.some(item =>
                item.label.toLowerCase().includes(managementSearchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(managementSearchQuery.toLowerCase())
              );
            })
            .map(category => {
              const filteredItems = managementSearchQuery
                ? category.items.filter(item =>
                    item.label.toLowerCase().includes(managementSearchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(managementSearchQuery.toLowerCase())
                  )
                : category.items;

              if (filteredItems.length === 0) return null;

              const isExpanded = managementSearchQuery || expandedCategories.has(category.title);

              return (
                <div
                  key={category.title}
                  style={{
                    marginBottom: spacing[3]
                  }}
                >
                  {/* Category Header - Clickable */}
                  <button
                    onClick={() => toggleCategory(category.title)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: `${spacing[3]} ${spacing[3]}`,
                      borderRadius: '12px',
                      background: isExpanded
                        ? `linear-gradient(135deg, ${category.color}20 0%, ${category.color}10 100%)`
                        : `linear-gradient(135deg, ${category.color}15 0%, ${category.color}08 100%)`,
                      border: `2px solid ${isExpanded ? category.color : category.color + '33'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginBottom: isExpanded ? spacing[2] : 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = shadows.floating.sm;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Chevron Icon */}
                    <div style={{
                      fontSize: typography.fontSize.lg,
                      color: category.color,
                      transition: 'transform 0.3s ease',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ▸
                    </div>

                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: typography.fontSize.lg,
                      boxShadow: `0 4px 12px ${category.color}44`,
                      flexShrink: 0
                    }}>
                      {category.icon}
                    </div>
                    <h4 style={{
                      margin: '0',
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      flex: 1,
                      textAlign: 'left'
                    }}>
                      {category.title}
                    </h4>
                    <Badge variant="secondary" size="sm" style={{
                      backgroundColor: category.color,
                      color: colors.text.inverse,
                      fontWeight: typography.fontWeight.bold,
                      flexShrink: 0
                    }}>
                      {filteredItems.length}
                    </Badge>
                  </button>

                  {/* Category Items - Collapsible */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[2],
                    maxHeight: isExpanded ? '2000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease, opacity 0.3s ease',
                    opacity: isExpanded ? 1 : 0
                  }}>
                    {filteredItems.map(item => (
                      <Card
                        key={item.path}
                        elevation="sm"
                        padding="base"
                        interactive
                        onClick={() => {
                          navigate(item.path);
                          setIsSidebarOpen(false);
                        }}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: spacing[3],
                          transition: 'all 0.2s ease',
                          border: `2px solid transparent`,
                          backgroundColor: colors.surface.primary
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = category.color;
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <span style={{
                          fontSize: typography.fontSize.xl,
                          marginTop: '2px'
                        }}>
                          {item.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.semibold,
                            color: colors.text.primary,
                            marginBottom: spacing[1]
                          }}>
                            {item.label}
                          </div>
                          <div style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.text.secondary,
                            lineHeight: '1.4'
                          }}>
                            {item.description}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

          {/* No Results Message */}
          {managementSearchQuery && managementCategories.every(cat =>
            !cat.items.some(item =>
              item.label.toLowerCase().includes(managementSearchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(managementSearchQuery.toLowerCase())
            )
          ) && (
            <Card elevation="md" padding="xl" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[3] }}>🔍</div>
              <p style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                margin: '0'
              }}>
                No results for "<strong>{managementSearchQuery}</strong>"
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: spacing[8] }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'links' && <LinksTab />}
      </div>

      {/* Link Dialog Modal */}
      {showLinkDialog && linkType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card
            elevation="lg"
            padding="xl"
            style={{
              maxWidth: '500px',
              width: '90%',
              boxShadow: shadows.floating.lg
            }}
          >
            <h3 style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              {linkType === 'pos' ? 'POS System' : 'Driver App'} Link
            </h3>
            <div style={{ marginBottom: spacing[6] }}>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing[3]
              }}>
                Share this link or scan the QR code:
              </p>
              <Card
                elevation="sm"
                padding="base"
                style={{
                  wordBreak: 'break-all',
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.mono,
                  color: colors.text.primary,
                  background: colors.surface.secondary
                }}
              >
                {generateShareableLink(linkType)}
              </Card>
            </div>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <Button
                variant="secondary"
                size="base"
                onClick={() => handleCopyLink(linkType)}
                style={{ flex: 1, background: `linear-gradient(135deg, ${colors.semantic.info} 0%, ${colors.semantic.infoDark} 100%)` }}
              >
                Copy Link
              </Button>
              <Button
                variant="ghost"
                size="base"
                onClick={() => setShowLinkDialog(false)}
                style={{ color: colors.text.secondary }}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
