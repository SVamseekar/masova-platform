import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { MaSoVaTheme } from './styles/theme';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationSystem } from './components/common/NotificationSystem';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Lazy load components
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const PublicMenuPage = React.lazy(() => import('./pages/PublicMenuPage'));
const CustomerApp = React.lazy(() => import('./pages/customer/CustomerApp'));
const ManagerDashboard = React.lazy(() => import('./pages/manager/DashboardPage'));
const KitchenDisplayPage = React.lazy(() => import('./pages/kitchen/KitchenDisplayPage'));
const DriverDashboard = React.lazy(() => import('./pages/driver/DriverDashboard'));
const POSSystem = React.lazy(() => import('./pages/pos/POSSystem'));

// Loading component
const AppLoader = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    bgcolor="background.default"
  >
    <CircularProgress color="primary" size={60} />
  </Box>
);

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={MaSoVaTheme}>
        <CssBaseline />
        <ErrorBoundary>
          <Router>
            <div className="App">
              <Suspense fallback={<AppLoader />}>
                <Routes>
                  {/* Public Routes - No Login Required */}
                  <Route path="/" element={<PublicMenuPage />} />
                  <Route path="/about" element={<HomePage />} />

                  {/* Staff Login */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Customer Routes - Login required only for checkout/orders */}
                  <Route
                    path="/customer/*"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CustomerApp />
                      </ProtectedRoute>
                    }
                  />

                  {/* Staff Routes - Login Required */}
                  <Route
                    path="/manager/*"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <ManagerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/kitchen/*"
                    element={
                      <ProtectedRoute allowedRoles={['STAFF', 'MANAGER', 'ASSISTANT_MANAGER']}>
                        <KitchenDisplayPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/driver/*"
                    element={
                      <ProtectedRoute allowedRoles={['DRIVER']}>
                        <DriverDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pos/*"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <POSSystem />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <NotificationSystem />
            </div>
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
};

export default App;