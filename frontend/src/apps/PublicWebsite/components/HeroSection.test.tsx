import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import HeroSection from './HeroSection';

vi.mock('../../../components/ui/neumorphic', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe('HeroSection', () => {
  const mockOnOrderNow = vi.fn();
  const mockOnBrowseMenu = vi.fn();

  function renderHero() {
    return renderUnauthenticated(
      <HeroSection onOrderNow={mockOnOrderNow} onBrowseMenu={mockOnBrowseMenu} />
    );
  }

  it('renders without crashing', () => {
    renderHero();
    expect(screen.getByText('Delicious Food, Delivered Fast')).toBeInTheDocument();
  });

  it('displays the main headline', () => {
    renderHero();
    expect(screen.getByText('Delicious Food, Delivered Fast')).toBeInTheDocument();
  });

  it('displays the subtitle', () => {
    renderHero();
    expect(screen.getByText('Multi-cuisine restaurant with pizzas, biryani, Chinese & more')).toBeInTheDocument();
  });

  it('displays the description text', () => {
    renderHero();
    expect(screen.getByText(/Order your favorite food from our extensive menu/)).toBeInTheDocument();
  });

  it('renders the "Order Now" button', () => {
    renderHero();
    expect(screen.getByText('Order Now')).toBeInTheDocument();
  });

  it('renders the "Browse Menu" button', () => {
    renderHero();
    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });

  it('calls onOrderNow when "Order Now" is clicked', async () => {
    const user = userEvent.setup();
    renderHero();
    await user.click(screen.getByText('Order Now'));
    expect(mockOnOrderNow).toHaveBeenCalledTimes(1);
  });

  it('calls onBrowseMenu when "Browse Menu" is clicked', async () => {
    const user = userEvent.setup();
    renderHero();
    await user.click(screen.getByText('Browse Menu'));
    expect(mockOnBrowseMenu).toHaveBeenCalledTimes(1);
  });

  it('displays quick stats', () => {
    renderHero();
    expect(screen.getByText('100+')).toBeInTheDocument();
    expect(screen.getByText('Menu Items')).toBeInTheDocument();
    expect(screen.getByText('30min')).toBeInTheDocument();
    expect(screen.getByText('Delivery Time')).toBeInTheDocument();
    expect(screen.getByText('10K+')).toBeInTheDocument();
    expect(screen.getByText('Happy Customers')).toBeInTheDocument();
  });
});
