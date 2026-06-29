import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderUnauthenticated, renderAsCustomer, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import PromotionsPage from './PromotionsPage';

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

describe('PromotionsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('displays the page header', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Live Offers')).toBeInTheDocument();
    expect(screen.getByText(/Exclusive/)).toBeInTheDocument();
    expect(screen.getByText(/Deals/)).toBeInTheDocument();
    expect(screen.getByText(/Handpicked offers/)).toBeInTheDocument();
  });

  it('renders the hero deal banner', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
    expect(screen.getByText('Any 2 Large Pizzas')).toBeInTheDocument();
    expect(screen.getByText(/\+ 2 Drinks \+ Free Garlic Bread/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grab This Deal/i })).toBeInTheDocument();
    expect(screen.getByText('Ends in')).toBeInTheDocument();
  });

  it('renders all category filter buttons', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByRole('button', { name: 'All Offers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Biryani' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Combos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desserts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delivery' })).toBeInTheDocument();
  });

  it('renders all promotion cards when "All Offers" is selected', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
    expect(screen.getByText('Family Combo')).toBeInTheDocument();
    expect(screen.getByText('Free Delivery')).toBeInTheDocument();
    expect(screen.getByText('Biryani Bonanza')).toBeInTheDocument();
    expect(screen.getByText('Power Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dessert Delight')).toBeInTheDocument();
    expect(screen.getByText('First Order Bonus')).toBeInTheDocument();
    expect(screen.getByText('Pizza Party Pack')).toBeInTheDocument();
  });

  it('filters promotions when Pizza category is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByRole('button', { name: 'Pizza' }));
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
    expect(screen.getByText('Pizza Party Pack')).toBeInTheDocument();
    expect(screen.queryByText('Family Combo')).not.toBeInTheDocument();
  });

  it('filters to Biryani category', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByRole('button', { name: 'Biryani' }));
    expect(screen.getByText('Biryani Bonanza')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Special')).not.toBeInTheDocument();
  });

  it('filters to Combo category', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByRole('button', { name: 'Combos' }));
    expect(screen.getByText('Family Combo')).toBeInTheDocument();
    expect(screen.getByText('Power Lunch')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Special')).not.toBeInTheDocument();
  });

  it('filters to Delivery category', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByRole('button', { name: 'Delivery' }));
    expect(screen.getByText('Free Delivery')).toBeInTheDocument();
    expect(screen.getByText('First Order Bonus')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Special')).not.toBeInTheDocument();
  });

  it('returns to all offers when "All Offers" filter is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByRole('button', { name: 'Pizza' }));
    expect(screen.queryByText('Family Combo')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All Offers' }));
    expect(screen.getByText('Family Combo')).toBeInTheDocument();
  });

  it('navigates to /menu from hero Grab This Deal', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);
    await user.click(screen.getByRole('button', { name: /Grab This Deal/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('navigates to /menu from Claim Deal on a promotion card', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);
    const claimButtons = screen.getAllByRole('button', { name: /Claim Deal/i });
    await user.click(claimButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Live Offers')).toBeInTheDocument();
  });

  it('renders the same content for authenticated users', () => {
    renderAsCustomer(<PromotionsPage />);
    expect(screen.getByText('Live Offers')).toBeInTheDocument();
  });

  it('passes showPublicNav to AppHeader', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByTestId('app-header')).toHaveAttribute('data-public-nav', 'true');
  });
});