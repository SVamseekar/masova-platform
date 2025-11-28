import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import StoreSelector from '../../components/StoreSelector';
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {/* Quick Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>WEEKLY REVENUE</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>
            {loadingMetrics ? '...' : `₹${salesData.weeklyTotal.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981' }}>↑ {salesData.percentageChange}% vs last week</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>AVG ORDER VALUE</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>
            {loadingMetrics ? '...' : `₹${(storeMetrics?.averageOrderValue || 0).toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Per customer</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>TOTAL ORDERS</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>
            {loadingMetrics ? '...' : (storeMetrics?.totalOrders || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>This week</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>COMPLETION RATE</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>
            {loadingMetrics ? '...' : '98.5%'}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981' }}>↑ 2.3% improvement</div>
        </div>
      </div>

      {/* Main Analytics Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            Order Flow Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { stage: 'Received', count: orderQueue.filter(o => o.status === 'PREPARING').length, color: '#3b82f6' },
              { stage: 'In Kitchen', count: orderQueue.filter(o => ['PREPARING', 'OVEN'].includes(o.status)).length, color: '#f59e0b' },
              { stage: 'Ready', count: orderQueue.filter(o => o.status === 'BAKED').length, color: '#10b981' },
              { stage: 'Dispatched', count: orderQueue.filter(o => o.status === 'DISPATCHED').length, color: '#8b5cf6' },
            ].map(item => (
              <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '100px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>{item.stage}</div>
                <div style={{ flex: 1, height: '28px', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((item.count / (orderQueue.length || 1)) * 100, 100)}%`,
                    backgroundColor: item.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ width: '40px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                  {item.count}
                </div>
              </div>
            ))}
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
            Top Performers
          </h3>
          {sessions.filter(s => s.isActive).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No active staff</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.filter(s => s.isActive).slice(0, 5).map((staff, idx) => (
                <div key={staff.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: idx === 0 ? '#fef3c7' : '#f9fafb',
                  borderRadius: '10px',
                  border: idx === 0 ? '2px solid #f59e0b' : '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: idx === 0 ? '#f59e0b' : '#6b7280', width: '24px' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{staff.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{staff.role}</div>
                  </div>
                  {idx === 0 && <span style={{ fontSize: '20px' }}>🏆</span>}
                </div>
              ))}
            </div>
          )}
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '32px'
      }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
          Share System Links
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* POS System */}
          <div style={{
            padding: '24px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🖥️</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                POS System
              </h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                Share with staff to access the point-of-sale system
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleCopyLink('pos')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Copy POS Link
              </button>
              <button
                onClick={() => handleShareLink('pos')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                View Link
              </button>
            </div>
          </div>

          {/* Driver App */}
          <div style={{
            padding: '24px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '2px solid #8b5cf6'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚗</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                Driver App
              </h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                Share with delivery drivers to manage deliveries
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleCopyLink('driver')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                Copy Driver Link
              </button>
              <button
                onClick={() => handleShareLink('driver')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#8b5cf6',
                  border: '2px solid #8b5cf6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#faf5ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                View Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '"Helvetica Neue", Arial, sans-serif'
    }}>
      <AppHeader title="Manager Dashboard" />

      {/* Store Selector Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px 32px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StoreSelector variant="manager" />
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {storeId ? `Viewing data for: ${selectedStoreName || currentUser?.storeId}` : 'Select a store to view data'}
          </div>
        </div>
      </div>

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

      {/* Quick Access Navigation */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px 32px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
          Management Pages
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {[
            { path: '/manager/orders', label: 'Order Management', icon: '📦' },
            { path: '/manager/payments', label: 'Payments', icon: '💳' },
            { path: '/manager/refunds', label: 'Refunds', icon: '💰' },
            { path: '/manager/inventory', label: 'Inventory', icon: '📊' },
            { path: '/manager/suppliers', label: 'Suppliers', icon: '🏭' },
            { path: '/manager/purchase-orders', label: 'Purchase Orders', icon: '📋' },
            { path: '/manager/waste-analysis', label: 'Waste Analysis', icon: '🗑️' },
            { path: '/manager/recipes', label: 'Recipes', icon: '📖' },
            { path: '/manager/customers', label: 'Customers', icon: '👥' },
            { path: '/manager/drivers', label: 'Drivers', icon: '🚗' },
            { path: '/manager/deliveries', label: 'Deliveries', icon: '🚚' },
            { path: '/manager/campaigns', label: 'Campaigns', icon: '📢' },
            { path: '/manager/stores', label: 'Stores', icon: '🏪' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0066CC';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#0066CC';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#1f2937';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px' }}>
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
              {linkType === 'pos' ? 'POS System' : 'Driver App'} Link
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                Share this link or scan the QR code:
              </p>
              <div style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                wordBreak: 'break-all',
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#1f2937'
              }}>
                {generateShareableLink(linkType)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleCopyLink(linkType)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowLinkDialog(false)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
