import React, { useState } from 'react';
import CustomerApp from './pages/customer/CustomerApp';
import ManagerDashboard from './pages/manager/DashboardPage';
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';
import './App.css';

const App: React.FC = () => {
  const [currentApp, setCurrentApp] = useState<'customer' | 'manager' | 'kitchen'>('customer');

  return (
    <div className="App">
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setCurrentApp('customer')}
          style={{
            background: currentApp === 'customer' ? '#e74c3c' : 'white',
            color: currentApp === 'customer' ? 'white' : '#e74c3c',
            border: '2px solid #e74c3c',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          Customer
        </button>
        <button
          onClick={() => setCurrentApp('manager')}
          style={{
            background: currentApp === 'manager' ? '#e74c3c' : 'white',
            color: currentApp === 'manager' ? 'white' : '#e74c3c',
            border: '2px solid #e74c3c',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          Manager
        </button>
        <button
          onClick={() => setCurrentApp('kitchen')}
          style={{
            background: currentApp === 'kitchen' ? '#e74c3c' : 'white',
            color: currentApp === 'kitchen' ? 'white' : '#e74c3c',
            border: '2px solid #e74c3c',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          Kitchen
        </button>
      </div>

      {currentApp === 'customer' && <CustomerApp />}
      {currentApp === 'manager' && <ManagerDashboard />}
      {currentApp === 'kitchen' && <KitchenDisplayPage />}
    </div>
  );
};

export default App;
