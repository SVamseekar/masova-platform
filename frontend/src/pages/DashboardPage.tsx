import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [currentDate] = useState(new Date().toLocaleDateString('en-IN'));

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // Mock data matching your backend structure
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
      role: 'Staff',
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
      role: 'Driver',
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
      role: 'Staff',
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
      role: 'Staff',
      loginTime: '07:30 AM',
      logoutTime: '03:45 PM',
      totalHours: 7.8,
      isActive: false,
      breakTime: 35,
      status: 'PENDING_APPROVAL'
    }
  ];

  const orderQueue: Order[] = [
    { id: 'ORD001', status: 'PREPARING', items: 2, time: '15:30', customer: 'John Doe', priority: 'normal' },
    { id: 'ORD002', status: 'OVEN', items: 1, time: '15:25', customer: 'Sarah Wilson', priority: 'urgent' },
    { id: 'ORD003', status: 'BAKED', items: 3, time: '15:20', customer: 'Mike Johnson', priority: 'normal' },
    { id: 'ORD004', status: 'DISPATCHED', items: 1, time: '15:15', customer: 'Lisa Brown', priority: 'normal' }
  ];

  const approveSession = (sessionId: string): void => {
    // Simulate API call
    alert(`Session ${sessionId} approved successfully!`);
  };

  const rejectSession = (sessionId: string): void => {
    // Simulate API call
    alert(`Session ${sessionId} rejected. Reason will be collected.`);
  };

  const OverviewTab: React.FC = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-3xl font-bold text-gray-900">₹{salesData.today.toLocaleString('en-IN')}</p>
              <p className="text-sm text-green-600 font-medium">+{salesData.percentageChange}% vs Last Year</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Yesterday's Sales</p>
              <p className="text-3xl font-bold text-gray-900">₹{salesData.yesterday.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500">Previous day performance</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Total</p>
              <p className="text-3xl font-bold text-gray-900">₹{salesData.weeklyTotal.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-3xl font-bold text-gray-900">{workingSessions.filter(s => s.isActive).length}</p>
              <p className="text-sm text-gray-500">Currently working</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Order Queue */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Live Order Queue</h3>
            <div className="text-2xl">🍕</div>
          </div>
          <div className="space-y-4">
            {orderQueue.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-gray-900">#{order.id.slice(-3)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'OVEN' ? 'bg-red-100 text-red-800' :
                      order.status === 'BAKED' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.items} items</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">{order.time}</p>
                  {order.priority === 'urgent' && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                      URGENT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Staff Sessions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Active Staff Sessions</h3>
            <div className="text-2xl">👨‍💼</div>
          </div>
          <div className="space-y-4">
            {workingSessions.filter(s => s.isActive).map(session => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {session.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{session.name}</p>
                        <p className="text-sm text-gray-600">{session.role}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600">Started</p>
                        <p className="font-medium">{session.loginTime}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">Duration</span>
                        <span className="ml-2 font-medium">{session.currentDuration}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Break</span>
                        <span className="ml-2 font-medium">{session.breakTime}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const StaffTab: React.FC = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Staff Working Hours</h3>
            <p className="text-sm text-gray-600">{currentDate}</p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Generate Report
          </button>
        </div>
        
        <div className="space-y-4">
          {workingSessions.map(session => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {session.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-bold text-gray-900">{session.name}</p>
                        <p className="text-sm text-gray-600">{session.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{session.role}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          session.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Login Time</p>
                    <p className="font-medium">{session.loginTime}</p>
                  </div>
                  
                  {session.isActive ? (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">{session.currentDuration}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total Hours</p>
                      <p className="font-medium">{session.totalHours}h</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Break Time</p>
                    <p className="font-medium">{session.breakTime}m</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {session.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => approveSession(session.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectSession(session.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {session.isActive && (
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                        End Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AnalyticsTab: React.FC = () => (
    <div className="space-y-8">
      {/* Weekly Sales Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Sales Performance (INR)</h3>
        <div className="flex items-end justify-between h-64 space-x-2">
          {[
            { day: 'Mon', value: 60, amount: '28K' },
            { day: 'Tue', value: 80, amount: '35K' },
            { day: 'Wed', value: 45, amount: '22K' },
            { day: 'Thu', value: 90, amount: '42K' },
            { day: 'Fri', value: 75, amount: '38K' },
            { day: 'Sat', value: 95, amount: '45K' },
            { day: 'Sun', value: 70, amount: '33K' }
          ].map(item => (
            <div key={item.day} className="flex-1 flex flex-col items-center">
              <div className="text-sm font-medium text-gray-900 mb-2">₹{item.amount}</div>
              <div 
                className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t"
                style={{ height: `${item.value}%` }}
              ></div>
              <div className="text-sm text-gray-600 mt-2">{item.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Average Order Value', value: '₹485', change: '+12%', positive: true },
            { label: 'Orders Today', value: '127', change: '+8%', positive: true },
            { label: 'Avg Prep Time', value: '18 mins', change: '-2 mins', positive: true },
            { label: 'Kitchen Efficiency', value: '94%', change: '+3%', positive: true },
            { label: 'Staff Productivity', value: '8.2 orders/hr', change: '+0.5%', positive: true },
            { label: 'Customer Rating', value: '4.8/5', change: '+0.2%', positive: true }
          ].map((kpi, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 my-2">{kpi.value}</p>
                <span className={`text-sm font-medium ${
                  kpi.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                🍕
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Domino's Manager</h1>
                <p className="text-sm text-gray-600">Restaurant Management Dashboard</p>
              </div>
            </div>

            {/* Header Info */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">{currentDate}</p>
                <p className="font-medium text-gray-900">Manager Dashboard</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'staff', label: 'Staff Sessions', icon: '👥' },
              { key: 'analytics', label: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-4 px-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>
    </div>
  );
};

export default DashboardPage;