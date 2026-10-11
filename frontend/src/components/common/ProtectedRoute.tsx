// src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { getDefaultDashboard, saveReturnUrl } from '../../utils/security';
import StaffAccessLayout from './StaffAccessLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children, allowedRoles = [], requireAuth = true,
}) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const location = useLocation();

  // Kiosk users can only access POS routes, independently of editable browser flags.
  if (isAuthenticated && user?.type === 'KIOSK') {
    if (location.pathname !== '/pos' && !location.pathname.startsWith('/pos/')) {
      return <Navigate to="/pos" replace />;
    }
    return <>{children}</>;
  }

  if (requireAuth && (!isAuthenticated || !user)) {
    // Save current URL for return after login.
    saveReturnUrl(location.pathname + location.search + location.hash);
    const isCustomerRoute = location.pathname.startsWith('/customer');
    const redirectTo = isCustomerRoute ? '/customer-login' : '/staff-login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.type)) {
    // An authenticated but refused role needs a persistent explanation, not a login loop.
    return <StaffAccessLayout compact>
      <div className="staff-access__denied">
        <LockKeyhole size={24} aria-hidden="true" />
        <h1>Access not available</h1>
        <p>Your account does not have access to this area of MaSoVa. Please contact your manager if this looks wrong.</p>
        <Link className="staff-access__submit" to={getDefaultDashboard(user.type, user.role)}>Go to my workspace</Link>
      </div>
    </StaffAccessLayout>;
  }

  return <>{children}</>;
};
