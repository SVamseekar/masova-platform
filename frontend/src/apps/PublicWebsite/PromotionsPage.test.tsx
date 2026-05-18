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
  default: ({ open }: { open: boolean }) => (
    open ? <div data-testid="cart-drawer" /> : null
  ),
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

  it('displays the Exclusive Deals heading', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Exclusive')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
  });

  it('renders the hero deal banner', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Any 2 Large Pizzas')).toBeInTheDocument();
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
    expect(screen.getByText('Grab This Deal →')).toBeInTheDocument();
  });

  it('renders all category filter buttons', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('All Offers')).toBeInTheDocument();
    expect(screen.getAllByText('Pizza').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Biryani').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Combos')).toBeInTheDocument();
    expect(screen.getAllByText('Desserts').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Delivery').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 8 promotion cards by default', () => {
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

  it('filters promotions when Pizza is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    const pizzaButtons = screen.getAllByText('Pizza');
    await user.click(pizzaButtons[0]);
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

    await user.click(screen.getByText('Combos'));
    expect(screen.getByText('Family Combo')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Special')).not.toBeInTheDocument();
  });

  it('filters to Delivery category', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    await user.click(screen.getByRole('button', { name: 'Delivery' }));
    expect(screen.getByText('Free Delivery')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Special')).not.toBeInTheDocument();
  });

  it('returns to all offers when All Offers filter is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);

    const pizzaButtons = screen.getAllByText('Pizza');
    await user.click(pizzaButtons[0]);
    expect(screen.queryByText('Family Combo')).not.toBeInTheDocument();

    await user.click(screen.getByText('All Offers'));
    expect(screen.getByText('Family Combo')).toBeInTheDocument();
  });

  it('renders Claim Deal buttons for each promo card', () => {
    renderUnauthenticated(<PromotionsPage />);
    const claimButtons = screen.getAllByText('Claim Deal');
    expect(claimButtons.length).toBe(8);
  });

  it('navigates to /menu when Claim Deal is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);
    const claimButtons = screen.getAllByText('Claim Deal');
    await user.click(claimButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('navigates to /menu when Grab This Deal is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PromotionsPage />);
    await user.click(screen.getByText('Grab This Deal →'));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('renders the same content for authenticated users', () => {
    renderAsCustomer(<PromotionsPage />);
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
  });

  it('shows countdown timer section', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Ends in')).toBeInTheDocument();
    expect(screen.getByText('hrs')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('sec')).toBeInTheDocument();
  });

  it('shows Live Offers badge', () => {
    renderUnauthenticated(<PromotionsPage />);
    expect(screen.getByText('Live Offers')).toBeInTheDocument();
  });
});
