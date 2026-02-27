import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, renderAsCustomer, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';

// Mock child components to isolate the page under test
vi.mock('./components/HeroSection', () => ({
  default: ({ onOrderNow, onBrowseMenu }: { onOrderNow: () => void; onBrowseMenu: () => void }) => (
    <div data-testid="hero-section">
      <button onClick={onOrderNow}>Order Now</button>
      <button onClick={onBrowseMenu}>Browse Menu</button>
    </div>
  ),
}));

vi.mock('./components/PromotionCard', () => ({
  default: ({ promotion, onOrderNow }: { promotion: { title: string }; onOrderNow: () => void }) => (
    <div data-testid="promotion-card">
      <span>{promotion.title}</span>
      <button onClick={onOrderNow}>Order Now</button>
    </div>
  ),
}));

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

vi.mock('../../components/ui/neumorphic', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Card: ({ children, ...props }: any) => <div data-testid="neumorphic-card" {...props}>{children}</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('PublicWebsite HomePage', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('renders the hero section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('renders featured promotions section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText("Today's Special Offers")).toBeInTheDocument();
    expect(screen.getByText("Don't miss out on our amazing deals!")).toBeInTheDocument();
  });

  it('renders three promotion cards', () => {
    renderUnauthenticated(<HomePage />);
    const cards = screen.getAllByTestId('promotion-card');
    expect(cards).toHaveLength(3);
  });

  it('renders the "Why Choose MaSoVa?" section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Why Choose MaSoVa?')).toBeInTheDocument();
    expect(screen.getByText("We're committed to serving you the best food experience")).toBeInTheDocument();
  });

  it('renders feature cards with titles', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Multi-Cuisine Menu')).toBeInTheDocument();
    expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
    expect(screen.getByText('Great Offers')).toBeInTheDocument();
    expect(screen.getByText('Dine-In & Takeaway')).toBeInTheDocument();
  });

  it('renders the call-to-action section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText("Hungry? Let's Order!")).toBeInTheDocument();
    expect(screen.getByText('Browse our menu and get your favorite food delivered in minutes')).toBeInTheDocument();
  });

  it('renders the footer with contact information', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('MaSoVa Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Phone: +91 9876543210')).toBeInTheDocument();
    expect(screen.getByText('Email: info@masova.com')).toBeInTheDocument();
    expect(screen.getByText('Address: Hyderabad, India')).toBeInTheDocument();
  });

  it('renders the footer copyright text', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/2025 MaSoVa Restaurant Management System/)).toBeInTheDocument();
  });

  it('renders "View All Offers" button', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('View All Offers')).toBeInTheDocument();
  });

  it('navigates to /promotions when "View All Offers" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('View All Offers'));
    expect(mockNavigate).toHaveBeenCalledWith('/promotions');
  });

  it('navigates to /checkout from hero "Order Now" button', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    // Hero section has an Order Now button
    const orderButtons = screen.getAllByText('Order Now');
    await user.click(orderButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('navigates to /menu from hero "Browse Menu" button', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    const browseButtons = screen.getAllByText('Browse Menu');
    await user.click(browseButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('renders footer quick links', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Promotions')).toBeInTheDocument();
    expect(screen.getByText('Staff Login')).toBeInTheDocument();
  });

  it('navigates to /login from footer "Staff Login" link', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('Staff Login'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByText("Today's Special Offers")).toBeInTheDocument();
  });

  it('renders the same content for authenticated users', () => {
    renderAsCustomer(<HomePage />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByText("Today's Special Offers")).toBeInTheDocument();
  });

  it('shows the animated background', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('animated-background')).toBeInTheDocument();
  });

  it('passes showPublicNav to AppHeader', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('app-header')).toHaveAttribute('data-public-nav', 'true');
  });
});
