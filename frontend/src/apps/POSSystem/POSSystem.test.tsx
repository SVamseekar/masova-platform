import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders, createAuthState } from '@/test/utils/testUtils';
import POSSystem from './POSSystem';

// Mock the child component to isolate routing logic
vi.mock('./POSDashboard', () => ({
  default: () => <div data-testid="pos-dashboard">POSDashboard</div>,
}));

const managerUser = {
  id: '3',
  email: 'manager@example.com',
  name: 'Manager User',
  type: 'MANAGER' as const,
  role: 'MANAGER' as const,
  phone: '555-0789',
  storeId: '1',
};

const renderPosRoutes = (initialEntry: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/pos/*" element={<POSSystem />} />
    </Routes>,
    {
      useMemoryRouter: true,
      initialEntries: [initialEntry],
      preloadedState: createAuthState({ ...managerUser, isActive: true }, true),
    }
  );

describe('POSSystem (router)', () => {
  it('renders POSDashboard at the root route', () => {
    renderPosRoutes('/pos');
    expect(screen.getByTestId('pos-dashboard')).toBeInTheDocument();
  });

  it('redirects /history to the root dashboard', () => {
    renderPosRoutes('/pos/history');
    expect(screen.getByTestId('pos-dashboard')).toBeInTheDocument();
  });

  it('redirects /reports to the root dashboard', () => {
    renderPosRoutes('/pos/reports');
    expect(screen.getByTestId('pos-dashboard')).toBeInTheDocument();
  });

  it('redirects unknown routes to the root dashboard', () => {
    renderPosRoutes('/pos/unknown-route');
    expect(screen.getByTestId('pos-dashboard')).toBeInTheDocument();
  });
});
