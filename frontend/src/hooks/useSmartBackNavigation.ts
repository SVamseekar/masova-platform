import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom hook for smart back navigation in manager pages
 *
 * Navigation logic:
 * 1. If on a sub-page/tab of a management page → navigate to management page root
 * 2. If on a management page root → navigate to manager dashboard
 * 3. Manager dashboard → stay on dashboard (no back action)
 */
export const useSmartBackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    const currentPath = location.pathname;

    // If we're on the main manager dashboard, do nothing
    if (currentPath === '/manager' || currentPath === '/manager/') {
      return;
    }

    // For all manager sub-pages, always go back to /manager
    if (currentPath.startsWith('/manager/')) {
      navigate('/manager');
      return;
    }

    // Default fallback: go to manager dashboard
    navigate('/manager');
  }, [navigate, location]);

  return { handleBack };
};
