import React, { useState } from 'react';
import type { WorkingSession } from '../../services/api/types';

const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentDate] = useState(new Date().toLocaleDateString('en-IN'));

  const salesData = {
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
      role: 'Staff',
      date: '2025-09-24',
      loginTime: '09:15 AM',
      currentWorkingDuration: '6h 45m',
      isActive: true,
      breakDurationMinutes: 30,
      status: 'ACTIVE',
      storeId: 'ST001'
    },
    {
      id: 'WS002',
      employeeId: 'EMP002',
      name: 'Priya Sharma',
      role: 'Driver',
      date: '2025-09-24',
      loginTime: '10:30 AM',
      currentWorkingDuration: '5h 30m',
      isActive: true,
      breakDurationMinutes: 15,
      status: 'ACTIVE',
      storeId: 'ST001'
    },
    {
      id: 'WS003',
      employeeId: 'EMP003',
      name: 'Amit Singh',
      role: 'Staff',
      date: '2025-09-24',
      loginTime: '08:00 AM',
      logoutTime: '04:00 PM',
      totalHours: 7.5,
      isActive: false,
      breakDurationMinutes: 45,
      status: 'COMPLETED',
      storeId: 'ST001'
    },
    {
      id: 'WS004',
      employeeId: 'EMP004',
      name: 'Sneha Patel',
      role: 'Staff',
      date: '2025-09-24',
      loginTime: '07:30 AM',
      logoutTime: '03:45 PM',
      totalHours: 7.8,
      isActive: false,
      breakDurationMinutes: 35,
      status: 'PENDING_APPROVAL',
      storeId: 'ST001'
    }
  ];

  const orderQueue = [
    { id: 'ORD001', status: 'PREPARING', items: 'Margherita Large, Garlic Bread', time: '15 mins', customer: 'John Doe', priority: 'normal' },
    { id: 'ORD002', status: 'OVEN', items: 'Pepperoni Medium, Coke', time: '8 mins', customer: 'Sarah Wilson', priority: 'urgent' },
    { id: 'ORD003', status: 'READY', items: 'Veggie Supreme Large', time: 'Ready', customer: 'Mike Johnson', priority: 'normal' }
  ];

  const handleApproveSession = (sessionId: string) => {
    console.log(`Approving session: ${sessionId}`);
  };

  const handleRejectSession = (sessionId: string) => {
    console.log(`Rejecting session: ${sessionId}`);
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ color: '#e74c3c', fontSize: '2.5rem', marginBottom: '10px', textAlign: 'center' }}>
          Manager Dashboard
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
          Store Operations Control Center - {currentDate}
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['overview', 'staff', 'orders', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#e74c3c' : 'white',
                color: activeTab === tab ? 'white' : '#333',
                border: '2px solid #e74c3c',
                padding: '12px 30px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '1.3rem' }}>Today's Sales</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#27ae60', marginBottom: '10px' }}>
                  ₹{salesData.today.toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: salesData.percentageChange > 0 ? '#27ae60' : '#e74c3c', fontSize: '1.1rem', fontWeight: '600' }}>
                    {salesData.percentageChange > 0 ? '↑' : '↓'} {Math.abs(salesData.percentageChange)}%
                  </span>
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>vs last year same day</span>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '1.3rem' }}>Yesterday's Sales</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db', marginBottom: '10px' }}>
                  ₹{salesData.yesterday.toLocaleString()}
                </div>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Previous day performance</p>
              </div>

              <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '1.3rem' }}>Weekly Total</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6', marginBottom: '10px' }}>
                  ₹{salesData.weeklyTotal.toLocaleString()}
                </div>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Last 7 days combined</p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#e74c3c', marginBottom: '20px', fontSize: '1.3rem' }}>Active Staff ({workingSessions.filter(s => s.isActive).length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {workingSessions.filter(session => session.isActive).map(session => (
                  <div key={session.id} style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>{session.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>{session.role}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Working: {session.currentWorkingDuration} | Break: {session.breakDurationMinutes}m
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '25px', fontSize: '1.5rem' }}>Staff Working Sessions</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>Employee</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>Role</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>Login Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>Duration</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>Break (mins)</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workingSessions.map(session => (
                    <tr key={session.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{session.name}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{session.role}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{session.loginTime}</td>
                      <td style={{ padding: '12px', color: '#666' }}>
                        {session.isActive ? session.currentWorkingDuration : `${session.totalHours}h`}
                      </td>
                      <td style={{ padding: '12px', color: '#666' }}>{session.breakDurationMinutes}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: session.status === 'ACTIVE' ? '#d4edda' :
                                    session.status === 'COMPLETED' ? '#cce5ff' : '#fff3cd',
                          color: session.status === 'ACTIVE' ? '#155724' :
                                session.status === 'COMPLETED' ? '#004085' : '#856404',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {session.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {session.status === 'PENDING_APPROVAL' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveSession(session.id)}
                              style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '15px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectSession(session.id)}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '15px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '25px', fontSize: '1.5rem' }}>Order Management</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {orderQueue.map(order => (
                <div key={order.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #dee2e6'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{order.id}</h4>
                    <div style={{ color: '#666', marginBottom: '5px' }}>Customer: {order.customer}</div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{order.items}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div>
                      <div style={{
                        background: order.status === 'READY' ? '#28a745' :
                                  order.status === 'OVEN' ? '#fd7e14' : '#007bff',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '5px'
                      }}>
                        {order.status}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>{order.time}</div>
                    </div>
                    {order.priority === 'urgent' && (
                      <div style={{
                        background: '#dc3545',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        URGENT
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#e74c3c', marginBottom: '20px', fontSize: '1.5rem' }}>Performance Analytics</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                  <div style={{ fontSize: '2rem', color: '#e74c3c', marginBottom: '10px' }}>85%</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Kitchen Efficiency</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                  <div style={{ fontSize: '2rem', color: '#28a745', marginBottom: '10px' }}>12 min</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Avg. Preparation Time</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                  <div style={{ fontSize: '2rem', color: '#007bff', marginBottom: '10px' }}>4.7★</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Customer Rating</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                  <div style={{ fontSize: '2rem', color: '#fd7e14', marginBottom: '10px' }}>₹524</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Avg. Order Value</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
