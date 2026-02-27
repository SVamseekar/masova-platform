import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerContact from './CustomerContact';

// Mock the shared ActionButton to render a simple button
vi.mock('./shared', () => ({
  ActionButton: ({ children, onClick, startIcon, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('CustomerContact', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    customerName: 'John Doe',
    customerPhone: '555-1234',
    orderNumber: 'ORD-001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('Contact Customer')).toBeInTheDocument();
  });

  it('displays customer name', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays customer phone number', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('displays order number', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
  });

  it('displays customer initials in avatar', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders Call Customer button', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('Call Customer')).toBeInTheDocument();
  });

  it('renders Send SMS button', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('Send SMS')).toBeInTheDocument();
  });

  it('renders Get Directions button', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('Get Directions')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CustomerContact {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Get Directions is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CustomerContact {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText('Get Directions'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers tel: link when Call Customer is clicked', async () => {
    const user = userEvent.setup();

    // Mock window.location.href setter
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
      configurable: true,
    });

    render(<CustomerContact {...defaultProps} />);
    await user.click(screen.getByText('Call Customer'));

    expect(hrefSetter).toHaveBeenCalledWith('tel:555-1234');
  });

  it('handles single-word customer names for initials', () => {
    render(<CustomerContact {...defaultProps} customerName="Madonna" />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('shows info note about keeping customer updated', () => {
    render(<CustomerContact {...defaultProps} />);
    expect(
      screen.getByText(/Keep the customer updated about delivery status/)
    ).toBeInTheDocument();
  });
});
