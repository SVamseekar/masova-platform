import { Box } from '@mui/material';
import { ReactNode } from 'react';

/**
 * Wrapper for all customer-facing pages.
 * Applies .dark-premium-theme class which activates the dark CSS custom
 * properties defined in index.css. Staff pages must NOT use this wrapper.
 */
export const CustomerLayout = ({ children }: { children: ReactNode }) => (
  <Box className="dark-premium-theme" sx={{ minHeight: '100vh' }}>
    {children}
  </Box>
);
