import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import CartDrawer from './CartDrawer';

function createCartState(items: any[] = []) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return {
    cart: {
      items,
      total,
      itemCount,
      deliveryFee: 29,
      isLoading: false,
      selectedStoreId: 'store-1',
      selectedStoreName: 'Downtown Branch',
    },
  };
}

const mockCartItems = [
  { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 2, category: 'PIZZA' },
  { id: 'item-2', name: 'Garlic Bread', price: 4.99, quantity: 1 },
];

describe('CartDrawer', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onCheckout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when not open', () => {
    const { container } = renderWithProviders(
      <CartDrawer open={false} onClose={vi.fn()} onCheckout={vi.fn()} />,
      { preloadedState: createCartState(), useMemoryRouter: true }
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders empty cart message when no items', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(), useMemoryRouter: true }
    );

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText(/Add some delicious items/)).toBeInTheDocument();
  });

  it('renders Browse Menu button in empty state', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(), useMemoryRouter: true }
    );

    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });

  it('renders cart items when items exist', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
  });

  it('shows the correct item quantities', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    // Margherita Pizza has quantity 2
    expect(screen.getByText('2')).toBeInTheDocument();
    // Garlic Bread has quantity 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays item count in header', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('renders Your Cart heading', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    expect(screen.getByText('Your Cart')).toBeInTheDocument();
  });

  it('renders bill details section when items exist', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    expect(screen.getByText('Bill Details')).toBeInTheDocument();
    expect(screen.getByText(/Subtotal/)).toBeInTheDocument();
    expect(screen.getByText(/Delivery Fee/)).toBeInTheDocument();
    expect(screen.getByText(/Tax/)).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
  });

  it('renders Proceed to Checkout button', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    expect(screen.getByText(/Proceed to Checkout/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <CartDrawer open onClose={onClose} onCheckout={vi.fn()} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    await user.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <CartDrawer open onClose={onClose} onCheckout={vi.fn()} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    // The overlay is the first element with backgroundColor rgba(0, 0, 0, 0.5)
    const overlay = container.querySelector('div[style*="background-color: rgba(0, 0, 0, 0.5)"]');
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('calls onCheckout and onClose when Proceed to Checkout is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCheckout = vi.fn();
    renderWithProviders(
      <CartDrawer open onClose={onClose} onCheckout={onCheckout} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    await user.click(screen.getByText(/Proceed to Checkout/));
    expect(onCheckout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders category badge for items that have a category', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    expect(screen.getByText('PIZZA')).toBeInTheDocument();
  });

  it('shows per-item price', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    // Should show "12.99 each" for pizza
    expect(screen.getByText(/12\.99 each/)).toBeInTheDocument();
  });

  it('shows reservation timer message', () => {
    renderWithProviders(
      <CartDrawer {...defaultProps} />,
      { preloadedState: createCartState(mockCartItems), useMemoryRouter: true }
    );

    expect(screen.getByText(/reserved for 15 minutes/)).toBeInTheDocument();
  });
});
