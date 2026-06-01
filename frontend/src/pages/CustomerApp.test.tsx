import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import CustomerApp from './CustomerApp';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('CustomerApp', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getByText('Our Delicious Menu')).toBeInTheDocument();
  });

  it('displays the header with restaurant name', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getByText("Domino's")).toBeInTheDocument();
    expect(screen.getByText('Hot & Fresh Pizzas')).toBeInTheDocument();
  });

  it('renders navigation tabs', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('Tracking')).toBeInTheDocument();
  });

  it('shows menu section by default', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getByText('Our Delicious Menu')).toBeInTheDocument();
    expect(screen.getByText('Handcrafted with love, delivered fresh')).toBeInTheDocument();
  });

  it('displays menu items', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('Pepperoni Pizza')).toBeInTheDocument();
    expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('Coke 600ml')).toBeInTheDocument();
  });

  it('displays menu item prices', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getByText(/₹299/)).toBeInTheDocument();
    expect(screen.getByText(/₹399/)).toBeInTheDocument();
    expect(screen.getByText(/₹149/)).toBeInTheDocument();
    expect(screen.getByText(/₹60/)).toBeInTheDocument();
  });

  it('renders "Add to Cart" buttons for available items', () => {
    renderUnauthenticated(<CustomerApp />);
    const addButtons = screen.getAllByText('Add to Cart');
    expect(addButtons.length).toBe(4);
  });

  it('switches to cart section', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<CustomerApp />);

    await user.click(screen.getByText('Cart'));
    expect(screen.getByText('Your Cart')).toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('switches to tracking section when no active orders', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<CustomerApp />);

    await user.click(screen.getByText('Tracking'));
    expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    expect(screen.getByText('No active orders')).toBeInTheDocument();
  });

  it('adds item to cart and shows in cart badge', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<CustomerApp />);

    const addButtons = screen.getAllByText('Add to Cart');
    await user.click(addButtons[0]); // Add Margherita Pizza

    // Cart badge should show 1
    expect(screen.getByText('Cart (1)')).toBeInTheDocument();
  });

  it('shows cart items when switching to cart section', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<CustomerApp />);

    const addButtons = screen.getAllByText('Add to Cart');
    await user.click(addButtons[0]); // Add Margherita Pizza

    await user.click(screen.getByText('Cart'));
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
  });

  it('displays promotional banners', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getAllByText(/Hot & Fresh Pizzas/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FLAT 40% OFF/).length).toBeGreaterThan(0);
  });

  it('renders the Logout button', () => {
    renderUnauthenticated(<CustomerApp />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('navigates to /login on logout', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<CustomerApp />);
    await user.click(screen.getByText('Logout'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows "Browse Menu" button in empty cart', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<CustomerApp />);

    await user.click(screen.getByText('Cart'));
    // There should be a Browse Menu button inside the empty cart view
    const browseMenuBtn = screen.getAllByText('Browse Menu');
    expect(browseMenuBtn.length).toBeGreaterThan(0);
  });
});
