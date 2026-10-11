import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wrapper for all customer-facing pages.
 * Browse routes use their scoped approved theme. Remaining customer workflows
 * retain the existing theme until their own complete slices migrate.
 * Staff pages must NOT use this wrapper.
 */
export const CustomerLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const browse = ['/order', '/menu', '/promotions'].includes(pathname);
  return <Box className={browse ? 'customer-browse-layout' : 'dark-premium-theme'} sx={{ minHeight: '100vh' }}>{children}</Box>;
};
