import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  renderAsCustomer,
  renderAsManager,
  renderUnauthenticated,
} from '@/test/utils/testUtils';
import { mockCustomerAuthState, mockAuthState, mockUnauthenticatedState } from '@/test/fixtures';
import AppHeader from './AppHeader';

// Mock StoreSelector to avoid API calls
vi.mock('../StoreSelector', () => ({
  default: ({ variant }: { variant?: string }) => (
    <div data-testid="store-selector">StoreSelector ({variant})</div>
  ),
}));

// Mock ManagementHubSidebar
vi.mock('./ManagementHubSidebar', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="management-sidebar">Sidebar <button onClick={onClose}>Close</button></div> : null
  ),
}));

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders MaSoVa logo', () => {
    renderUnauthenticated(<AppHeader />);
    expect(screen.getByText('MaSoVa')).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    renderUnauthenticated(<AppHeader title="Order Management" />);
    expect(screen.getByText('Order Management')).toBeInTheDocument();
  });

  it('renders back button when showBackButton is true', () => {
    renderUnauthenticated(<AppHeader showBackButton />);
    expect(screen.getByText(/Back/)).toBeInTheDocument();
  });

  it('does not render back button by default', () => {
    renderUnauthenticated(<AppHeader />);
    expect(screen.queryByText(/Back/)).not.toBeInTheDocument();
  });

  it('calls custom onBack handler when back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderUnauthenticated(<AppHeader showBackButton onBack={onBack} />);

    await user.click(screen.getByText(/Back/));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe('unauthenticated state', () => {
    it('shows Staff Login button when not hideStaffLogin', () => {
      renderUnauthenticated(<AppHeader />);
      expect(screen.getByText(/Staff Login/)).toBeInTheDocument();
    });

    it('hides Staff Login button when hideStaffLogin is true', () => {
      renderUnauthenticated(<AppHeader hideStaffLogin />);
      expect(screen.queryByText(/Staff Login/)).not.toBeInTheDocument();
    });
  });

  describe('authenticated customer on public nav', () => {
    it('shows Home, Offers, Cart, and user name', () => {
      renderWithProviders(
        <AppHeader showPublicNav />,
        {
          preloadedState: mockCustomerAuthState,
          useMemoryRouter: true,
        }
      );

      expect(screen.getByText(/Home/)).toBeInTheDocument();
      expect(screen.getByText(/Offers/)).toBeInTheDocument();
      expect(screen.getByText(/Cart/)).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });

    it('calls onCartClick when cart button is clicked', async () => {
      const user = userEvent.setup();
      const onCartClick = vi.fn();
      renderWithProviders(
        <AppHeader showPublicNav onCartClick={onCartClick} />,
        {
          preloadedState: mockCustomerAuthState,
          useMemoryRouter: true,
        }
      );

      await user.click(screen.getByText(/Cart/));
      expect(onCartClick).toHaveBeenCalledTimes(1);
    });

    it('shows Login button when showPublicNav but no user', () => {
      renderWithProviders(
        <AppHeader showPublicNav />,
        {
          preloadedState: mockUnauthenticatedState,
          useMemoryRouter: true,
        }
      );

      expect(screen.getByText(/Login/)).toBeInTheDocument();
    });
  });

  describe('authenticated staff on public nav', () => {
    it('shows Go to Dashboard button for staff users', () => {
      renderWithProviders(
        <AppHeader showPublicNav />,
        {
          preloadedState: mockAuthState,
          useMemoryRouter: true,
        }
      );

      expect(screen.getByText(/Go to Dashboard/)).toBeInTheDocument();
    });

    it('does not show Cart button for staff users on public pages', () => {
      renderWithProviders(
        <AppHeader showPublicNav />,
        {
          preloadedState: mockAuthState,
          useMemoryRouter: true,
        }
      );

      expect(screen.queryByText(/Cart/)).not.toBeInTheDocument();
    });
  });

  describe('manager navigation', () => {
    it('renders StoreSelector and Management button when showManagerNav is true', () => {
      renderAsManager(<AppHeader showManagerNav />);
      expect(screen.getByTestId('store-selector')).toBeInTheDocument();
      expect(screen.getByText('Management')).toBeInTheDocument();
    });

    it('opens management sidebar when Management button is clicked', async () => {
      const user = userEvent.setup();
      renderAsManager(<AppHeader showManagerNav />);

      await user.click(screen.getByText('Management'));
      expect(screen.getByTestId('management-sidebar')).toBeInTheDocument();
    });
  });

  describe('logged-in user info (default header mode)', () => {
    it('shows user name and type', () => {
      renderWithProviders(<AppHeader />, {
        preloadedState: mockAuthState,
        useMemoryRouter: true,
      });

      expect(screen.getByText('Test Manager')).toBeInTheDocument();
      expect(screen.getByText('MANAGER')).toBeInTheDocument();
    });

    it('shows Logout button for authenticated users', () => {
      renderWithProviders(<AppHeader />, {
        preloadedState: mockAuthState,
        useMemoryRouter: true,
      });

      expect(screen.getByText(/Logout/)).toBeInTheDocument();
    });
  });
});
