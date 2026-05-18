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
  default: ({ open, onClose, onCheckout }: { open: boolean; onClose: () => void; onCheckout: () => void }) => (
    open ? (
      <div data-testid="cart-drawer">
        <button onClick={onClose}>Close Cart</button>
        <button onClick={onCheckout}>Checkout</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
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

  it('renders the hero section with Order Now button', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Order Now')).toBeInTheDocument();
  });

  it('renders hero headline text', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Your Go-To Spot')).toBeInTheDocument();
    expect(screen.getByText('Tasty Eats!')).toBeInTheDocument();
  });

  it('renders the cuisine category section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('What are you')).toBeInTheDocument();
  });

  it('renders feature cards with correct titles', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Quality Ingredients')).toBeInTheDocument();
    expect(screen.getByText('30-Min Delivery')).toBeInTheDocument();
    expect(screen.getByText('Live Order Tracking')).toBeInTheDocument();
    expect(screen.getByText('Easy Reordering')).toBeInTheDocument();
  });

  it('renders the footer copyright text', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/2026 MaSoVa/)).toBeInTheDocument();
  });

  it('renders footer explore links', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getAllByText('Promotions').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Track Order')).toBeInTheDocument();
  });

  it('renders footer support links', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('FAQs')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders the MaSoVa brand in footer', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('MaSoVa')).toBeInTheDocument();
  });

  it('navigates to /menu when Order Now is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('Order Now'));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('navigates to /promotions when View Deals is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('View Deals'));
    expect(mockNavigate).toHaveBeenCalledWith('/promotions');
  });

  it('renders View All button to navigate to /menu', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('View All'));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByText('Order Now')).toBeInTheDocument();
  });

  it('renders the same content for authenticated users', () => {
    renderAsCustomer(<HomePage />);
    expect(screen.getByText('Order Now')).toBeInTheDocument();
  });

  it('renders the Weekend Special offer section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
    expect(screen.getByText('Claim Offer')).toBeInTheDocument();
  });

  it('navigates to /promotions when Claim Offer is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('Claim Offer'));
    expect(mockNavigate).toHaveBeenCalledWith('/promotions');
  });

  it('passes showPublicNav to AppHeader', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('app-header')).toHaveAttribute('data-public-nav', 'true');
  });
});
