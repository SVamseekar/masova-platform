import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, renderAsCustomer, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import PromotionsPage from './PromotionsPage';

vi.mock('./components/PromotionCard', () => ({
  default: ({ promotion, onOrderNow }: { promotion: { id: number; title: string; discount: string }; onOrderNow: () => void }) => (
    <div data-testid={`promotion-card-${promotion.id}`}>
      <span>{promotion.title}</span>
      <span>{promotion.discount}</span>
      <button onClick={onOrderNow}>Order Now</button>
    </div>
  ),
}));

vi.mock('../../components/common/AppHeader', () => ({
  default: ({ title }: { title?: string }) => (
    <div data-testid="app-header">{title}</div>
  ),
}));

vi.mock('../../components/cart/CartDrawer', () => ({
  default: ({ open }: { open: boolean }) => (
    open ? <div data-testid="cart-drawer" /> : null
  ),
}));

vi.mock('../../components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('../../components/ui/neumorphic', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('PromotionsPage', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('displays the page title', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Special Offers & Promotions')).toBeInTheDocument();
  });

  it('renders the hero banner text', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Amazing Deals Just for You!')).toBeInTheDocument();
    expect(screen.getByText('Check out our latest offers and save big on your favorite food')).toBeInTheDocument();
  });

  it('renders all category filter buttons', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('All Offers')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Biryani')).toBeInTheDocument();
    expect(screen.getByText('Combos')).toBeInTheDocument();
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
  });

  it('shows all 8 promotions by default', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('All Offers (8)')).toBeInTheDocument();
  });

  it('renders all promotion cards when "All" is selected', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
    expect(screen.getByText('Family Combo')).toBeInTheDocument();
    expect(screen.getByText('Free Delivery')).toBeInTheDocument();
    expect(screen.getByText('Biryani Bonanza')).toBeInTheDocument();
    expect(screen.getByText('Lunch Special')).toBeInTheDocument();
    expect(screen.getByText('Dessert Delight')).toBeInTheDocument();
    expect(screen.getByText('First Order Bonus')).toBeInTheDocument();
    expect(screen.getByText('Pizza Party Pack')).toBeInTheDocument();
  });

  it('filters promotions when a category is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByText('Pizza'));
    expect(screen.getByText('Pizza Offers (2)')).toBeInTheDocument();
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
    expect(screen.getByText('Pizza Party Pack')).toBeInTheDocument();
    expect(screen.queryByText('Family Combo')).not.toBeInTheDocument();
  });

  it('filters to Biryani category', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByText('Biryani'));
    expect(screen.getByText('Biryani Offers (1)')).toBeInTheDocument();
    expect(screen.getByText('Biryani Bonanza')).toBeInTheDocument();
  });

  it('filters to Combo category', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByText('Combos'));
    expect(screen.getByText('Combo Offers (2)')).toBeInTheDocument();
  });

  it('filters to Delivery category', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByText('Delivery'));
    expect(screen.getByText('Delivery Offers (2)')).toBeInTheDocument();
  });

  it('returns to all offers when "All Offers" filter is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByText('Pizza'));
    expect(screen.getByText('Pizza Offers (2)')).toBeInTheDocument();

    await user.click(screen.getByText('All Offers'));
    expect(screen.getByText('All Offers (8)')).toBeInTheDocument();
  });

  it('renders the "Ready to Order?" call-to-action section', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Ready to Order?')).toBeInTheDocument();
    expect(screen.getByText('Browse our complete menu and place your order now!')).toBeInTheDocument();
  });

  it('renders "View Full Menu" button', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('View Full Menu')).toBeInTheDocument();
  });

  it('navigates to /menu when "View Full Menu" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);
    await user.click(screen.getByText('View Full Menu'));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Amazing Deals Just for You!')).toBeInTheDocument();
  });

  it('renders the same content for authenticated users', () => {
    renderAsCustomer(<PromotionsPage />);
    expect(screen.getByText('Amazing Deals Just for You!')).toBeInTheDocument();
  });

  it('shows the animated background', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByTestId('animated-background')).toBeInTheDocument();
  });
});
