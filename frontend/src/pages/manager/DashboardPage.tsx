import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';

// TypeScript interfaces
interface SalesData {
  today: number;
  lastYear: number;
  percentageChange: number;
  yesterday: number;
  weeklyTotal: number;
}

interface WorkingSession {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  loginTime: string;
  currentDuration?: string;
  totalHours?: number;
  isActive: boolean;
  breakTime: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING_APPROVAL';
  logoutTime?: string;
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
  const [activeTab, setActiveTab] = useState('overview');
  const [currentDate] = useState(new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Mock data
  const salesData: SalesData = {
    today: 45000,
    lastYear: 38000,
    percentageChange: 18.4,
    yesterday: 42000,
    weeklyTotal: 280000
  };

  const workingSessions: WorkingSession[] = [
    {
      id: 'WS001',
      employeeId: 'EMP001',
      name: 'Rajesh Kumar',
      role: 'Chef',
      loginTime: '09:15 AM',
      currentDuration: '6h 45m',
      isActive: true,
      breakTime: 30,
      status: 'ACTIVE'
    },
    {
      id: 'WS002',
      employeeId: 'EMP002',
      name: 'Priya Sharma',
      role: 'Delivery Partner',
      loginTime: '10:30 AM',
      currentDuration: '5h 30m',
      isActive: true,
      breakTime: 15,
      status: 'ACTIVE'
    },
    {
      id: 'WS003',
      employeeId: 'EMP003',
      name: 'Amit Singh',
      role: 'Kitchen Staff',
      loginTime: '08:00 AM',
      logoutTime: '04:00 PM',
      totalHours: 7.5,
      isActive: false,
      breakTime: 45,
      status: 'COMPLETED'
    },
    {
      id: 'WS004',
      employeeId: 'EMP004',
      name: 'Sneha Patel',
      role: 'Manager',
      loginTime: '12:00 PM',
      logoutTime: '08:30 PM',
      totalHours: 8,
      isActive: false,
      breakTime: 60,
      status: 'PENDING_APPROVAL'
    }
  ];

  const orderQueue: Order[] = [
    { id: 'ORD001', status: 'PREPARING', items: 2, time: '15:30', customer: 'John Doe', priority: 'normal' },
    { id: 'ORD002', status: 'OVEN', items: 1, time: '15:25', customer: 'Sarah Wilson', priority: 'urgent' },
    { id: 'ORD003', status: 'BAKED', items: 3, time: '15:20', customer: 'Mike Johnson', priority: 'normal' },
    { id: 'ORD004', status: 'DISPATCHED', items: 1, time: '15:15', customer: 'Emily Davis', priority: 'normal' }
  ];

  const approveSession = (sessionId: string): void => {
    alert(`Session ${sessionId} approved successfully!`);
  };

  const rejectSession = (sessionId: string): void => {
    alert(`Session ${sessionId} rejected.`);
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
            ₹{salesData.today.toLocaleString('en-IN')}
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
            ₹{salesData.weeklyTotal.toLocaleString('en-IN')}
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
            {workingSessions.filter(s => s.isActive).length}
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
            {orderQueue.filter(o => o.status !== 'DISPATCHED').length}
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
              🔥 Live Order Queue
            </h3>
          </div>
          <div style={{ padding: '20px' }}>
            {orderQueue.map(order => (
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
            ))}
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
              👥 Active Staff Sessions
            </h3>
          </div>
          <div style={{ padding: '20px' }}>
            {workingSessions.filter(s => s.isActive).map(session => (
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
                    {session.role} • {session.currentDuration}
                  </div>
                </div>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981'
                }}></div>
              </div>
            ))}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {workingSessions.map(session => (
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
                      {session.loginTime}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                      {session.isActive ? 'DURATION' : 'LOGOUT TIME'}
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {session.isActive ? session.currentDuration : session.logoutTime}
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
                      {session.totalHours ? `${session.totalHours}h` : session.currentDuration}
                    </p>
                  </div>
                </div>

                {session.status === 'PENDING_APPROVAL' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => approveSession(session.id)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectSession(session.id)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
            📈 Sales Trend
          </h3>
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
            <p>Sales analytics charts would be displayed here</p>
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
            ⏰ Staff Performance
          </h3>
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
            <p>Staff performance metrics would be displayed here</p>
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
      <AppHeader title="Manager Dashboard" showBackButton={true} backRoute="/" />

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
              onClick={() => setActiveTab(tab.key)}
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
