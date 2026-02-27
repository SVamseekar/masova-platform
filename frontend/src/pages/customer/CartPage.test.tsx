import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, createCartState, createAuthState, mockUser } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import CartPage from './CartPage';

describe('CartPage', () => {
  const mockOnContinueShopping = vi.fn();
  const mockOnProceedToPayment = vi.fn();

  const defaultProps = {
    onContinueShopping: mockOnContinueShopping,
    onProceedToPayment: mockOnProceedToPayment,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart state when cart is empty', () => {
    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState([]),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
    expect(screen.getByText("Looks like you haven't added anything to your cart yet")).toBeInTheDocument();
  });

  it('shows Browse Menu button in empty state', () => {
    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState([]),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });

  it('calls onContinueShopping when Browse Menu is clicked in empty state', async () => {
    const user = userEvent.setup();

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState([]),
      },
      useMemoryRouter: true,
    });

    await user.click(screen.getByText('Browse Menu'));
    expect(mockOnContinueShopping).toHaveBeenCalledTimes(1);
  });

  it('renders cart items when cart has items', () => {
    const cartItems = [
      { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 2, imageUrl: '/pizza.jpg', category: 'PIZZA' },
    ];

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState(cartItems),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('Your Cart')).toBeInTheDocument();
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
  });

  it('displays correct item count', () => {
    const cartItems = [
      { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 2, imageUrl: '/pizza.jpg', category: 'PIZZA' },
      { id: 'item-2', name: 'Garlic Bread', price: 4.99, quantity: 1, imageUrl: '/bread.jpg', category: 'SIDES' },
    ];

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState(cartItems),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('2 items in your cart')).toBeInTheDocument();
  });

  it('displays order summary section', () => {
    const cartItems = [
      { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 1, imageUrl: '/pizza.jpg', category: 'PIZZA' },
    ];

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState(cartItems),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Delivery Fee')).toBeInTheDocument();
    expect(screen.getByText('Tax (5%)')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows Proceed to Payment button', () => {
    const cartItems = [
      { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 1, imageUrl: '/pizza.jpg', category: 'PIZZA' },
    ];

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState(cartItems),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('Proceed to Payment')).toBeInTheDocument();
  });

  it('shows Continue Shopping button', () => {
    const cartItems = [
      { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 1, imageUrl: '/pizza.jpg', category: 'PIZZA' },
    ];

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState(cartItems),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('calls onProceedToPayment when Proceed to Payment is clicked', async () => {
    const user = userEvent.setup();
    const cartItems = [
      { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 1, imageUrl: '/pizza.jpg', category: 'PIZZA' },
    ];

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState(cartItems),
      },
      useMemoryRouter: true,
    });

    await user.click(screen.getByText('Proceed to Payment'));
    expect(mockOnProceedToPayment).toHaveBeenCalledTimes(1);
  });

  it('displays single item text for one item', () => {
    const cartItems = [
      { id: 'item-1', name: 'Margherita Pizza', price: 12.99, quantity: 1, imageUrl: '/pizza.jpg', category: 'PIZZA' },
    ];

    renderWithProviders(<CartPage {...defaultProps} />, {
      preloadedState: {
        ...createAuthState(mockUser, true),
        ...createCartState(cartItems),
      },
      useMemoryRouter: true,
    });

    expect(screen.getByText('1 item in your cart')).toBeInTheDocument();
  });
});
