import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { mockAuthState, mockKitchenStaffUser } from '@/test/fixtures';
import type { User } from '@/types/user';
import AppHeader from './AppHeader';
import CustomerPageHeader from './CustomerPageHeader';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => navigateMock,
}));

vi.mock('../StoreSelector', () => ({ default: () => <div /> }));
vi.mock('./ManagementHubSidebar', () => ({ default: () => null }));

const stateFor = (user: User) => ({ auth: { ...mockAuthState.auth, user } });
const cashier: User = { ...mockKitchenStaffUser, id: 'user-cashier', role: 'CASHIER' };

const headers = [
  ['AppHeader', () => <AppHeader showPublicNav />],
  ['CustomerPageHeader', () => <CustomerPageHeader onBack={() => undefined} breadcrumb="Checkout" />],
] as const;

describe.each(headers)('%s staff dashboard button', (_name, renderHeader) => {
  beforeEach(() => navigateMock.mockClear());

  it('sends kitchen staff to /kitchen, not the unrouted /staff', async () => {
    renderWithProviders(renderHeader(), { preloadedState: stateFor(mockKitchenStaffUser), useMemoryRouter: true });
    await userEvent.setup().click(screen.getByText(/Dashboard/));
    expect(navigateMock).toHaveBeenCalledWith('/kitchen');
    expect(navigateMock).not.toHaveBeenCalledWith('/staff');
  });

  it('sends cashiers to /pos', async () => {
    renderWithProviders(renderHeader(), { preloadedState: stateFor(cashier), useMemoryRouter: true });
    await userEvent.setup().click(screen.getByText(/Dashboard/));
    expect(navigateMock).toHaveBeenCalledWith('/pos');
  });

  it('sends managers to /manager', async () => {
    renderWithProviders(renderHeader(), { preloadedState: mockAuthState, useMemoryRouter: true });
    await userEvent.setup().click(screen.getByText(/Dashboard/));
    expect(navigateMock).toHaveBeenCalledWith('/manager');
  });
});
