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
const HomePage = React.lazy(() => import('./apps/PublicWebsite/HomePage'));
const PromotionsPage = React.lazy(() => import('./apps/PublicWebsite/PromotionsPage'));
const PublicMenuPage = React.lazy(() => import('./apps/PublicWebsite/PublicMenuPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const CheckoutPage = React.lazy(() => import('./pages/checkout/CheckoutPage'));
const GuestCheckoutPage = React.lazy(() => import('./pages/checkout/GuestCheckoutPage'));
const CustomerDashboard = React.lazy(() => import('./pages/customer/CustomerDashboard'));
const ManagerDashboard = React.lazy(() => import('./pages/manager/DashboardPage'));
const KitchenDisplayPage = React.lazy(() => import('./pages/kitchen/KitchenDisplayPage'));
const DriverDashboard = React.lazy(() => import('./pages/driver/DriverDashboard'));
const POSSystem = React.lazy(() => import('./apps/POSSystem/POSSystem'));

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
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<PublicMenuPage />} />
                  <Route path="/promotions" element={<PromotionsPage />} />

                  {/* Authentication & Checkout Routes - Public */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/guest-checkout" element={<GuestCheckoutPage />} />

                  {/* Customer Routes - Login required for ordering */}
                  <Route
                    path="/customer/*"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']} requireAuth={true}>
                        <CustomerDashboard />
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
                      <ProtectedRoute allowedRoles={['STAFF', 'MANAGER', 'ASSISTANT_MANAGER']}>
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