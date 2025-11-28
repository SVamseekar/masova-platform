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

  if (requireAuth && !isAuthenticated) {
    // Redirect to customer login for customer routes, staff login for others
    const isCustomerRoute = location.pathname.startsWith('/customer');
    const redirectTo = isCustomerRoute ? '/customer-login' : '/staff-login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.type)) {
    // Redirect based on required role
    const isCustomerRole = allowedRoles.includes('CUSTOMER');
    const redirectTo = isCustomerRole ? '/customer-login' : '/staff-login';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
