import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { store } from './store/store';
import { MaSoVaTheme } from './styles/theme';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationSystem } from './components/common/NotificationSystem';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { TokenRefreshManager } from './components/auth/TokenRefreshManager';
import { ConnectionMonitorProvider } from './components/common/ConnectionMonitorProvider';

// Lazy load components
const HomePage = React.lazy(() => import('./apps/PublicWebsite/HomePage'));
const PromotionsPage = React.lazy(() => import('./apps/PublicWebsite/PromotionsPage'));
const PublicMenuPage = React.lazy(() => import('./apps/PublicWebsite/PublicMenuPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const CustomerLoginPage = React.lazy(() => import('./pages/auth/CustomerLoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const CheckoutPage = React.lazy(() => import('./pages/checkout/CheckoutPage'));
const GuestCheckoutPage = React.lazy(() => import('./pages/checkout/GuestCheckoutPage'));
const PaymentPage = React.lazy(() => import('./pages/customer/PaymentPage'));
const PaymentSuccessPage = React.lazy(() => import('./pages/customer/PaymentSuccessPage'));
const PaymentFailedPage = React.lazy(() => import('./pages/customer/PaymentFailedPage'));
const TrackingPage = React.lazy(() => import('./pages/customer/TrackingPage'));
const LiveTrackingPage = React.lazy(() => import('./pages/customer/LiveTrackingPage'));
const OrderTrackingPage = React.lazy(() => import('./pages/customer/OrderTrackingPage'));
const PublicRatingPage = React.lazy(() => import('./pages/PublicRatingPage'));
const CustomerDashboard = React.lazy(() => import('./pages/customer/CustomerDashboard'));
const ProfilePage = React.lazy(() => import('./pages/customer/ProfilePage'));
const NotificationSettingsPage = React.lazy(() => import('./pages/customer/NotificationSettingsPage'));
const PaymentDashboardPage = React.lazy(() => import('./pages/manager/PaymentDashboardPage'));
const RefundManagementPage = React.lazy(() => import('./pages/manager/RefundManagementPage'));
const RecipeManagementPage = React.lazy(() => import('./pages/manager/RecipeManagementPage'));
const StoreManagementPage = React.lazy(() => import('./pages/manager/StoreManagementPage'));
const InventoryDashboardPage = React.lazy(() => import('./pages/manager/InventoryDashboardPage'));
const SupplierManagementPage = React.lazy(() => import('./pages/manager/SupplierManagementPage'));
const PurchaseOrdersPage = React.lazy(() => import('./pages/manager/PurchaseOrdersPage'));
const WasteAnalysisPage = React.lazy(() => import('./pages/manager/WasteAnalysisPage'));
const CustomerManagementPage = React.lazy(() => import('./pages/manager/CustomerManagementPage'));
const StaffManagementPage = React.lazy(() => import('./pages/manager/StaffManagementPage'));
const StaffSchedulingPage = React.lazy(() => import('./pages/manager/StaffSchedulingPage'));
const StaffProfilePage = React.lazy(() => import('./pages/staff/StaffProfilePage'));
const DriverManagementPage = React.lazy(() => import('./pages/manager/DriverManagementPage'));
const DeliveryManagementPage = React.lazy(() => import('./pages/manager/DeliveryManagementPage'));
const CampaignManagementPage = React.lazy(() => import('./pages/manager/CampaignManagementPage'));
const ManagerDashboard = React.lazy(() => import('./pages/manager/DashboardPage'));
const ReviewManagementPage = React.lazy(() => import('./pages/manager/ReviewManagementPage'));
const OrderManagementPage = React.lazy(() => import('./pages/manager/OrderManagementPage'));
const KitchenDisplayPage = React.lazy(() => import('./pages/kitchen/KitchenDisplayPage'));
const DriverDashboard = React.lazy(() => import('./pages/driver/DriverDashboard'));
const POSSystem = React.lazy(() => import('./apps/POSSystem/POSSystem'));
const KioskManagementPage = React.lazy(() => import('./pages/manager/KioskManagementPage'));
const KioskSetupPage = React.lazy(() => import('./pages/kiosk/KioskSetupPage'));
const KitchenAnalyticsPage = React.lazy(() => import('./pages/manager/KitchenAnalyticsPage'));
const ProductAnalyticsPage = React.lazy(() => import('./pages/manager/ProductAnalyticsPage'));
const AdvancedReportsPage = React.lazy(() => import('./pages/manager/AdvancedReportsPage'));
const StaffLeaderboardPage = React.lazy(() => import('./pages/manager/StaffLeaderboardPage'));
const EquipmentMonitoringPage = React.lazy(() => import('./pages/manager/EquipmentMonitoringPage'));

// Kiosk mode hook
import { useKioskMode } from './hooks/useKioskMode';

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

// Kiosk Mode Initializer component
const KioskModeInitializer: React.FC = () => {
  const { isLoading } = useKioskMode();

  if (isLoading) {
    return <AppLoader />;
  }

  return null;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <TokenRefreshManager />
      <KioskModeInitializer />
      <ConnectionMonitorProvider>
        <ThemeProvider theme={MaSoVaTheme}>
          <CssBaseline />
          <SnackbarProvider
            maxSnack={4}
            autoHideDuration={3000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            preventDuplicate
            dense
          >
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
                  <Route path="/login" element={<Navigate to="/customer-login" replace />} />
                  <Route path="/customer-login" element={<CustomerLoginPage />} />
                  <Route path="/staff-login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/guest-checkout" element={<GuestCheckoutPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="/payment/failed" element={<PaymentFailedPage />} />
                  <Route path="/tracking/:orderId" element={<TrackingPage />} />
                  <Route path="/live-tracking/:orderId" element={<LiveTrackingPage />} />
                  <Route path="/rate/:orderId/:token" element={<PublicRatingPage />} />

                  {/* Customer Dashboard - Login required */}
                  <Route
                    path="/customer-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']} requireAuth={true}>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer/orders"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']} requireAuth={true}>
                        <OrderTrackingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer/profile"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']} requireAuth={true}>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer/notifications"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']} requireAuth={true}>
                        <NotificationSettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Kitchen Display - Public Access (No Login Required) */}
                  <Route path="/kitchen" element={<KitchenDisplayPage />} />
                  <Route path="/kitchen/:storeId" element={<KitchenDisplayPage />} />

                  {/* Staff Routes - Login Required */}
                  <Route
                    path="/manager"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <ManagerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/payments"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <PaymentDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/refunds"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <RefundManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/recipes"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <RecipeManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/stores"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <StoreManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/kiosk"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <KioskManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/inventory"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <InventoryDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/suppliers"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <SupplierManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/purchase-orders"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <PurchaseOrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/waste-analysis"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <WasteAnalysisPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/customers"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <CustomerManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/staff"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <StaffManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/staff-scheduling"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <StaffSchedulingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/staff/:staffId/profile"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <StaffProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff/profile"
                    element={
                      <ProtectedRoute allowedRoles={['STAFF', 'MANAGER', 'ASSISTANT_MANAGER']}>
                        <StaffProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/drivers"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <DriverManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/deliveries"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <DeliveryManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/campaigns"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <CampaignManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/reviews"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <ReviewManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/orders"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <OrderManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/kitchen-analytics"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <KitchenAnalyticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/product-analytics"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <ProductAnalyticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/advanced-reports"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <AdvancedReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/staff-leaderboard"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <StaffLeaderboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager/equipment-monitoring"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ASSISTANT_MANAGER']}>
                        <EquipmentMonitoringPage />
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
                  {/* POS System - Public Access (PIN authentication per order) */}
                  <Route path="/pos/*" element={<POSSystem />} />
                  {/* Kiosk Setup (Public) */}
                  <Route path="/kiosk-setup" element={<KioskSetupPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                <NotificationSystem />
              </div>
            </Router>
          </ErrorBoundary>
        </SnackbarProvider>
      </ThemeProvider>
      </ConnectionMonitorProvider>
    </Provider>
  );
};

export default App;