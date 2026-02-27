import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, renderAsCustomer, screen } from '@/test/utils/testUtils';
import PublicMenuPage from './PublicMenuPage';

// Mock MenuPage since it is tested separately
vi.mock('../../pages/customer/MenuPage', () => ({
  default: ({ hideStaffLogin, showPublicNav, onCartClick }: any) => (
    <div data-testid="menu-page" data-hide-staff-login={hideStaffLogin} data-show-public-nav={showPublicNav}>
      <button onClick={onCartClick} data-testid="open-cart-btn">Open Cart</button>
    </div>
  ),
}));

vi.mock('../../components/cart/CartDrawer', () => ({
  default: ({ open, onClose, onCheckout }: { open: boolean; onClose: () => void; onCheckout: () => void }) => (
    open ? (
      <div data-testid="cart-drawer">
        <button onClick={onClose}>Close</button>
        <button onClick={onCheckout}>Checkout</button>
      </div>
    ) : null
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('PublicMenuPage (PublicWebsite)', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.getByTestId('menu-page')).toBeInTheDocument();
  });

  it('passes hideStaffLogin=true to MenuPage', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.getByTestId('menu-page')).toHaveAttribute('data-hide-staff-login', 'true');
  });

  it('passes showPublicNav=true to MenuPage', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.getByTestId('menu-page')).toHaveAttribute('data-show-public-nav', 'true');
  });

  it('does not show cart drawer by default', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.queryByTestId('cart-drawer')).not.toBeInTheDocument();
  });

  it('opens cart drawer when cart click handler fires', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderUnauthenticated(<PublicMenuPage />);

    await user.click(screen.getByTestId('open-cart-btn'));
    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
  });

  it('closes cart drawer when close is triggered', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderUnauthenticated(<PublicMenuPage />);

    await user.click(screen.getByTestId('open-cart-btn'));
    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();

    await user.click(screen.getByText('Close'));
    expect(screen.queryByTestId('cart-drawer')).not.toBeInTheDocument();
  });

  it('navigates to /checkout on checkout', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderUnauthenticated(<PublicMenuPage />);

    await user.click(screen.getByTestId('open-cart-btn'));
    await user.click(screen.getByText('Checkout'));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.getByTestId('menu-page')).toBeInTheDocument();
  });

  it('renders for authenticated users too', () => {
    renderAsCustomer(<PublicMenuPage />);
    expect(screen.getByTestId('menu-page')).toBeInTheDocument();
  });
});
