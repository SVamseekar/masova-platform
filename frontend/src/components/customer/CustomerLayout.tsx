import { Box } from '@mui/material';
import { ReactNode } from 'react';

/**
 * Wrapper for all customer-facing pages.
 * Applies dark background color so customer pages render on the dark theme
 * established by CSS custom properties in index.css (:root).
 */
export const CustomerLayout = ({ children }: { children: ReactNode }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'var(--bg)', color: 'var(--text-1)' }}>
    {children}
  </Box>
);
