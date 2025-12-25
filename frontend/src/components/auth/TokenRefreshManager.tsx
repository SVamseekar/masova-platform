import { useEffect } from 'react';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';

/**
 * TokenRefreshManager component
 *
 * Manages automatic token refresh throughout the application lifecycle.
 * This component should be placed at the root level of the app (inside Redux Provider).
 *
 * Features:
 * - Proactive token refresh before expiration
 * - Handles tab visibility changes
 * - Automatic cleanup on unmount
 */
export const TokenRefreshManager: React.FC = () => {
  // Use the token refresh hook
  useTokenRefresh();

  // Component initialization (logging disabled)
  useEffect(() => {
    // Silent initialization
  }, []);

  // This component doesn't render anything
  return null;
};
