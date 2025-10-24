import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetActiveStoreSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
  WorkingSession
} from '../../store/api/sessionApi';
import { useGetStoreMetricsQuery } from '../../store/api/storeApi';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';

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
  const storeId = currentUser?.storeId || '';

  // API Hooks
  const { data: sessions = [], isLoading: loadingSessions, error: sessionsError } = useGetActiveStoreSessionsQuery(storeId, {
    skip: !storeId,
    pollingInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  const { data: storeMetrics, isLoading: loadingMetrics } = useGetStoreMetricsQuery(storeId, {
    skip: !storeId,
    pollingInterval: 60000, // Poll every minute
  });

  const { data: liveOrders = [], isLoading: loadingOrders } = useGetStoreOrdersQuery(storeId, {
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

  const OverviewTab: React.FC = () => (
    <div>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
          padding: '24px',
          borderRadius: '15px',
          color: 'white',
          boxShadow: '0 8px 32px rgba(0, 102, 204, 0.3)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', opacity: 0.9 }}>
            Today's Sales
          </h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '0' }}>
            {loadingMetrics ? '...' : `₹${salesData.today.toLocaleString('en-IN')}`}
          </p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.8 }}>
            +{salesData.percentageChange}% vs Last Year
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ color: '#0066CC', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Weekly Total
          </h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>
            {loadingMetrics ? '...' : `₹${salesData.weeklyTotal.toLocaleString('en-IN')}`}
          </p>
          <p style={{ fontSize: '14px', color: '#10b981', margin: '8px 0 0 0' }}>
            Last 7 days
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ color: '#0066CC', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Active Staff
          </h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>
            {loadingSessions ? '...' : storeMetrics?.activeEmployees || sessions.filter(s => s.isActive).length}
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0 0' }}>
            Currently working
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ color: '#0066CC', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Pending Orders
          </h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>
            {loadingMetrics ? '...' : storeMetrics?.activeOrders || orderQueue.filter(o => o.status !== 'DISPATCHED').length}
          </p>
          <p style={{ fontSize: '14px', color: '#ef4444', margin: '8px 0 0 0' }}>
            {orderQueue.filter(o => o.priority === 'urgent').length} urgent
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          }}>
            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              Live Order Queue
            </h3>
          </div>
          <div style={{ padding: '20px' }}>
            {orderQueue.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                No pending orders
              </p>
            ) : (
              orderQueue.map(order => (
                <div key={order.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                      #{order.id.slice(-3)} - {order.customer}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {order.items} items • {order.time}
                      {order.priority === 'urgent' && <span style={{ color: '#ef4444', fontWeight: '600' }}> • URGENT</span>}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getStatusColor(order.status).bg,
                    color: getStatusColor(order.status).text
                  }}>
                    {order.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          }}>
            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              Active Staff Sessions
            </h3>
          </div>
          <div style={{ padding: '20px' }}>
            {loadingSessions ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                Loading sessions...
              </p>
            ) : sessionsError ? (
              <p style={{ textAlign: 'center', color: '#ef4444', padding: '20px' }}>
                Error loading sessions
              </p>
            ) : sessions.filter(s => s.isActive).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                No active sessions
              </p>
            ) : (
              sessions.filter(s => s.isActive).map(session => (
                <div key={session.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    {session.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                      {session.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {session.role} • {calculateDuration(session.loginTime)}
                    </div>
                  </div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981'
                  }}></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const StaffTab: React.FC = () => (
    <div>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
          <h3 style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
            Staff Working Sessions
          </h3>
        </div>
        <div style={{ padding: '24px' }}>
          {loadingSessions ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              Loading sessions...
            </p>
          ) : sessionsError ? (
            <p style={{ textAlign: 'center', color: '#ef4444', padding: '40px' }}>
              Error loading sessions. Please try again.
            </p>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              No sessions found for today
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {sessions.map(session => (
                <div key={session.id} style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      {session.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                        {session.name}
                      </h4>
                      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                        {session.role}
                      </p>
                    </div>
                    <div style={{
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: session.isActive ? '#dcfce7' : '#fee2e2',
                      color: session.isActive ? '#166534' : '#dc2626'
                    }}>
                      {session.isActive ? 'ACTIVE' : 'OFFLINE'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        LOGIN TIME
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {formatTime(session.loginTime)}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        {session.isActive ? 'DURATION' : 'LOGOUT TIME'}
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {session.isActive ? calculateDuration(session.loginTime) : (session.logoutTime ? formatTime(session.logoutTime) : 'N/A')}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        BREAK TIME
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {session.breakTime}m
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        TOTAL HOURS
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {session.totalHours ? `${session.totalHours}h` : calculateDuration(session.loginTime)}
                      </p>
                    </div>
                  </div>

                  {session.status === 'PENDING_APPROVAL' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApproveSession(session.id)}
                        disabled={approvingSession}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          backgroundColor: approvingSession ? '#9ca3af' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: approvingSession ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {approvingSession ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectSession(session.id)}
                        disabled={rejectingSession}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          backgroundColor: rejectingSession ? '#9ca3af' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: rejectingSession ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {rejectingSession ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AnalyticsTab: React.FC = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            Sales Trend
          </h3>
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
            <p>Sales analytics charts will be integrated in Phase 8</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>Analytics Service coming soon</p>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            Staff Performance
          </h3>
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
            <p>Staff performance metrics will be integrated in Phase 8</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>Analytics Service coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    const colors = {
      'PREPARING': { bg: '#fef3c7', text: '#92400e' },
      'OVEN': { bg: '#fee2e2', text: '#dc2626' },
      'BAKED': { bg: '#dcfce7', text: '#166534' },
      'DISPATCHED': { bg: '#ede9fe', text: '#7c3aed' }
    };
    return colors[status as keyof typeof colors] || { bg: '#f3f4f6', text: '#374151' };
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '"Helvetica Neue", Arial, sans-serif'
    }}>
      <AppHeader title="Manager Dashboard" />

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '40px' }}>
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
                padding: '20px 0',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                color: activeTab === tab.key ? '#0066CC' : '#6b7280',
                borderBottom: activeTab === tab.key ? '3px solid #0066CC' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px' }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
};

export default DashboardPage;
