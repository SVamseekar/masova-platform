import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryCard } from './DeliveryCard';

describe('DeliveryCard', () => {
  const defaultProps = {
    orderNumber: '#ORD-001',
    amount: 39.07,
    customerName: 'Test Customer',
    customerPhone: '555-1234',
    address: '42 Curry Lane, Hyderabad',
    items: [
      { name: 'Margherita Pizza', quantity: 2 },
      { name: 'Garlic Bread', quantity: 1 },
    ],
    onNavigate: vi.fn(),
    onContact: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
  });

  it('displays the order number', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
  });

  it('displays the order amount with currency symbol', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('₹39.07')).toBeInTheDocument();
  });

  it('displays the customer name', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
  });

  it('displays the customer phone', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('displays the delivery address', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('42 Curry Lane, Hyderabad')).toBeInTheDocument();
  });

  it('displays order items', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('x1')).toBeInTheDocument();
  });

  it('renders Navigate, Contact, and Complete action buttons', () => {
    render(<DeliveryCard {...defaultProps} />);
    expect(screen.getByText('Navigate')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('calls onNavigate when Navigate button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeliveryCard {...defaultProps} />);

    await user.click(screen.getByText('Navigate'));
    expect(defaultProps.onNavigate).toHaveBeenCalledTimes(1);
  });

  it('calls onContact when Contact button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeliveryCard {...defaultProps} />);

    await user.click(screen.getByText('Contact'));
    expect(defaultProps.onContact).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Complete button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeliveryCard {...defaultProps} />);

    await user.click(screen.getByText('Complete'));
    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows only first 2 items when collapsed with more than 2 items', () => {
    const manyItems = [
      { name: 'Pizza', quantity: 1 },
      { name: 'Burger', quantity: 2 },
      { name: 'Salad', quantity: 1 },
      { name: 'Fries', quantity: 3 },
    ];

    render(<DeliveryCard {...defaultProps} items={manyItems} />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    // The extra items text should show
    expect(screen.getByText(/\+2 more items/)).toBeInTheDocument();
  });

  it('expands to show all items when "more items" is clicked', async () => {
    const user = userEvent.setup();
    const manyItems = [
      { name: 'Pizza', quantity: 1 },
      { name: 'Burger', quantity: 2 },
      { name: 'Salad', quantity: 1 },
    ];

    render(<DeliveryCard {...defaultProps} items={manyItems} />);

    // Click to expand
    await user.click(screen.getByText(/\+1 more item/));

    // After expansion, all items and "Show less" should be visible
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
  });

  it('does not show expand toggle when 2 or fewer items', () => {
    const fewItems = [
      { name: 'Pizza', quantity: 1 },
      { name: 'Burger', quantity: 2 },
    ];

    render(<DeliveryCard {...defaultProps} items={fewItems} />);
    expect(screen.queryByText(/more item/)).not.toBeInTheDocument();
  });

  it('supports controlled expanded prop', () => {
    const manyItems = [
      { name: 'Pizza', quantity: 1 },
      { name: 'Burger', quantity: 2 },
      { name: 'Salad', quantity: 1 },
    ];

    render(<DeliveryCard {...defaultProps} items={manyItems} expanded={true} />);
    expect(screen.getByText('Salad')).toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });
});
