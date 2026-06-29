import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderUnauthenticated, renderAsCustomer, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';

vi.mock('../../components/common/AppHeader', () => ({
  default: ({ showPublicNav }: { showPublicNav?: boolean }) => (
    <div data-testid="app-header" data-public-nav={showPublicNav} />
  ),
}));

vi.mock('../../components/cart/CartDrawer', () => ({
  default: ({ open, onClose, onCheckout }: { open: boolean; onClose: () => void; onCheckout: () => void }) =>
    open ? (
      <div data-testid="cart-drawer">
        <button onClick={onClose}>Close Cart</button>
        <button onClick={onCheckout}>Checkout</button>
      </div>
    ) : null,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('PublicWebsite HomePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('renders hero headline and CTAs', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/Your Go-To Spot/)).toBeInTheDocument();
    expect(screen.getByText(/Tasty Eats!/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Order Now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Deals/i })).toBeInTheDocument();
  });

  it('renders category and menu sections', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/What are you/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Our.*Popular.*Menu/i })).toBeInTheDocument();
    expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Quality Ingredients')).toBeInTheDocument();
    expect(screen.getByText('30-Min Delivery')).toBeInTheDocument();
    expect(screen.getByText('Live Order Tracking')).toBeInTheDocument();
    expect(screen.getByText('Easy Reordering')).toBeInTheDocument();
  });

  it('renders hot offer banner', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/Hot Offer/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Claim Offer/i })).toBeInTheDocument();
  });

  it('renders footer content', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('MaSoVa')).toBeInTheDocument();
    expect(screen.getByText(/© 2026 MaSoVa/)).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('navigates to /menu from Order Now', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByRole('button', { name: /Order Now/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('navigates to /promotions from View Deals', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByRole('button', { name: /View Deals/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/promotions');
  });

  it('navigates to /menu from View All', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByRole('button', { name: 'View All' }));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/Your Go-To Spot/)).toBeInTheDocument();
  });

  it('renders the same content for authenticated users', () => {
    renderAsCustomer(<HomePage />);
    expect(screen.getByText(/Your Go-To Spot/)).toBeInTheDocument();
  });

  it('passes showPublicNav to AppHeader', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('app-header')).toHaveAttribute('data-public-nav', 'true');
  });
});