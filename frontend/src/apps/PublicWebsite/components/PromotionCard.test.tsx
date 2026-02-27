import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import PromotionCard from './PromotionCard';

vi.mock('../../../components/ui/neumorphic', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

const mockPromotion = {
  id: 1,
  title: 'Weekend Special',
  description: 'Get 20% OFF on all pizzas this weekend!',
  discount: '20% OFF',
  validUntil: 'Valid till Sunday',
  image: '/images/pizza-promo.jpg',
  category: 'Pizza',
};

describe('PromotionCard', () => {
  const mockOnOrderNow = vi.fn();

  function renderCard(promotion = mockPromotion) {
    return renderUnauthenticated(
      <PromotionCard promotion={promotion} onOrderNow={mockOnOrderNow} />
    );
  }

  it('renders without crashing', () => {
    renderCard();
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
  });

  it('displays the promotion title', () => {
    renderCard();
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
  });

  it('displays the promotion description', () => {
    renderCard();
    expect(screen.getByText('Get 20% OFF on all pizzas this weekend!')).toBeInTheDocument();
  });

  it('displays the discount badge', () => {
    renderCard();
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
  });

  it('displays the category chip', () => {
    renderCard();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
  });

  it('displays the validity period', () => {
    renderCard();
    expect(screen.getByText('Valid till Sunday')).toBeInTheDocument();
  });

  it('renders the "Order Now" button', () => {
    renderCard();
    expect(screen.getByText('Order Now')).toBeInTheDocument();
  });

  it('calls onOrderNow when button is clicked', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByText('Order Now'));
    expect(mockOnOrderNow).toHaveBeenCalledTimes(1);
  });

  it('renders with a different category', () => {
    const comboPromo = { ...mockPromotion, id: 2, category: 'Combo', title: 'Family Combo' };
    renderCard(comboPromo);
    expect(screen.getByText('Family Combo')).toBeInTheDocument();
    expect(screen.getByText('Combo')).toBeInTheDocument();
  });

  it('renders with a delivery category', () => {
    const deliveryPromo = { ...mockPromotion, id: 3, category: 'Delivery', title: 'Free Delivery', discount: 'Free Delivery' };
    renderCard(deliveryPromo);
    expect(screen.getByText('Free Delivery')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
  });
});
