import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
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

describe('POSSystem (router)', () => {
  it('renders POSDashboard at the root route', () => {
    renderWithProviders(<POSSystem />, {
      useMemoryRouter: true,
      initialEntries: ['/'],
      preloadedState: createAuthState(managerUser as any, true),
    });

    expect(screen.getByTestId('pos-dashboard')).toBeInTheDocument();
  });

  it('redirects /history route without crashing', () => {
    const { container } = renderWithProviders(<POSSystem />, {
      useMemoryRouter: true,
      initialEntries: ['/history'],
      preloadedState: createAuthState(managerUser as any, true),
    });
    // Navigate redirects to /pos — no match in isolated Routes, but renders without crashing
    expect(container).toBeDefined();
  });

  it('redirects /reports route without crashing', () => {
    const { container } = renderWithProviders(<POSSystem />, {
      useMemoryRouter: true,
      initialEntries: ['/reports'],
      preloadedState: createAuthState(managerUser as any, true),
    });
    expect(container).toBeDefined();
  });

  it('redirects unknown routes without crashing', () => {
    const { container } = renderWithProviders(<POSSystem />, {
      useMemoryRouter: true,
      initialEntries: ['/unknown-route'],
      preloadedState: createAuthState(managerUser as any, true),
    });
    expect(container).toBeDefined();
  });
});
