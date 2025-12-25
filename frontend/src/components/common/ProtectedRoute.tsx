// src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireAuth = true,
}) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const location = useLocation();

  // Check if kiosk mode is enabled
  const isKioskMode = localStorage.getItem('masova_kioskMode') === 'true';

  // Kiosk mode: Allow access if user is authenticated as KIOSK type
  if (isKioskMode && isAuthenticated && user?.type === 'KIOSK') {
    // Kiosk users can only access POS routes
    if (!location.pathname.startsWith('/pos')) {
      return <Navigate to="/pos" replace />;
    }
    return <>{children}</>;
  }

  if (requireAuth && !isAuthenticated) {
    // Save current URL for return after login
    const returnUrl = location.pathname + location.search;
    if (returnUrl !== '/staff-login' && returnUrl !== '/customer-login' && returnUrl !== '/login') {
      sessionStorage.setItem('returnUrl', returnUrl);
    }

    // Redirect to customer login for customer routes, staff login for others
    const isCustomerRoute = location.pathname.startsWith('/customer');
    const redirectTo = isCustomerRoute ? '/customer-login' : '/staff-login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.type)) {
    // Kiosk users are treated like staff for role checking
    if (user.type === 'KIOSK' && (allowedRoles.includes('STAFF') ||
        allowedRoles.includes('MANAGER') || allowedRoles.includes('ASSISTANT_MANAGER'))) {
      return <>{children}</>;
    }

    // Redirect based on required role
    const isCustomerRole = allowedRoles.includes('CUSTOMER');
    const redirectTo = isCustomerRole ? '/customer-login' : '/staff-login';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
