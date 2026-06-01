import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import CustomerPanel from './CustomerPanel';

// ---------------------------------------------------------------------------
// Mock RTK Query hooks
// ---------------------------------------------------------------------------

const mockCreateOrder = vi.fn().mockReturnValue({
  unwrap: () => Promise.resolve({ id: 'order-1', orderNumber: 'ORD-001' }),
});

vi.mock('../../../store/api/orderApi', () => ({
  useCreateOrderMutation: () => [mockCreateOrder, { isLoading: false }],
}));

vi.mock('../../../store/api/paymentApi', () => ({
  useInitiatePaymentMutation: () => [vi.fn(), { isLoading: false }],
  useVerifyPaymentMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock('../../../store/api/customerApi', () => ({
  useGetOrCreateCustomerMutation: () => [
    vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'cust-1' }),
    }),
    { isLoading: false },
  ],
}));

vi.mock('../../../hooks/useGeocoding', () => ({
  useGeocoding: () => ({
    geocode: vi.fn().mockResolvedValue({ latitude: 17.385, longitude: 78.487 }),
    loading: false,
    error: null,
  }),
  buildAddressString: vi.fn(
    (street: string, city: string, _: any, pincode: string) =>
      `${street}, ${city}, ${pincode}`
  ),
}));

vi.mock('./PINAuthModal', () => ({
  PINAuthModal: ({ isOpen, onAuthenticated }: any) =>
    isOpen ? (
      <div data-testid="pin-auth-modal">
        <button
          data-testid="pin-auth-submit"
          onClick={() =>
            onAuthenticated({
              userId: 'staff-1',
              name: 'Test Staff',
              type: 'STAFF',
              role: 'Staff',
              storeId: 'store-1',
            })
          }
        >
          Authenticate
        </button>
      </div>
    ) : null,
}));

const mockItems = [
  {
    menuItemId: 'item-1',
    name: 'Margherita Pizza',
    price: 12.99,
    quantity: 2,
    specialInstructions: '',
  },
];

describe('CustomerPanel', () => {
  const defaultProps = {
    items: mockItems,
    customer: null,
    onCustomerChange: vi.fn(),
    orderType: 'PICKUP' as const,
    selectedTable: null,
    onOrderComplete: vi.fn(),
    userId: 'user-1',
    storeId: 'store-1',
    submitOrderRef: { current: null } as any,
    orderCreatedBy: null,
  };

  beforeEach(() => {
    defaultProps.onCustomerChange.mockClear();
    defaultProps.onOrderComplete.mockClear();
    mockCreateOrder.mockClear();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(screen.getByText('Customer & Payment')).toBeInTheDocument();
    });

    it('displays customer information section', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(screen.getByText(/Customer Information/i)).toBeInTheDocument();
    });

    it('shows customer name input', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByPlaceholderText(/Customer Name/i)
      ).toBeInTheDocument();
    });

    it('shows phone number input', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByPlaceholderText(/Phone Number/i)
      ).toBeInTheDocument();
    });

    it('shows email input', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    });
  });

  describe('payment method selection', () => {
    it('renders payment method section', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(screen.getByText(/Payment Method/i)).toBeInTheDocument();
    });

    it('shows CASH, CARD, UPI, WALLET options for PICKUP', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(screen.getByText('CASH')).toBeInTheDocument();
      expect(screen.getByText('CARD')).toBeInTheDocument();
      expect(screen.getByText('UPI')).toBeInTheDocument();
      expect(screen.getByText('WALLET')).toBeInTheDocument();
    });

    it('hides CASH option for DELIVERY orders', () => {
      renderWithProviders(
        <CustomerPanel {...defaultProps} orderType="DELIVERY" />,
        { useMemoryRouter: true }
      );

      expect(screen.queryByText('CASH')).not.toBeInTheDocument();
      expect(screen.getByText('CARD')).toBeInTheDocument();
    });

    it('shows cash info message when CASH is selected', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByText(/Cash payment - collect at delivery\/pickup/i)
      ).toBeInTheDocument();
    });

    it('allows switching payment method', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      await user.click(screen.getByText('CARD'));

      // Cash info should disappear
      expect(
        screen.queryByText(/Cash payment - collect at delivery\/pickup/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('delivery address fields', () => {
    it('shows address fields for DELIVERY orders', () => {
      renderWithProviders(
        <CustomerPanel {...defaultProps} orderType="DELIVERY" />,
        { useMemoryRouter: true }
      );

      expect(
        screen.getByPlaceholderText(/Street Address/i)
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/City/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Pincode/i)).toBeInTheDocument();
    });

    it('does not show address fields for PICKUP orders', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.queryByPlaceholderText(/Street Address/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('order summary', () => {
    it('displays order summary when items exist', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(screen.getByText(/Order Summary/i)).toBeInTheDocument();
      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      expect(screen.getByText('Tax (5%):')).toBeInTheDocument();
      expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    });

    it('shows warning when no items', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} items={[]} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByText(/Please add items to create an order/i)
      ).toBeInTheDocument();
    });

    it('shows delivery fee for DELIVERY orders', () => {
      renderWithProviders(
        <CustomerPanel {...defaultProps} orderType="DELIVERY" />,
        { useMemoryRouter: true }
      );

      expect(screen.getByText('Delivery Fee:')).toBeInTheDocument();
    });
  });

  describe('place order button', () => {
    it('renders the place order button', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const button = screen.getByRole('button', { name: /Place Order/i });
      expect(button).toBeInTheDocument();
    });

    it('disables button when no items are present', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} items={[]} />, {
        useMemoryRouter: true,
      });

      const button = screen.getByRole('button', { name: /Place Order/i });
      expect(button).toBeDisabled();
    });

    it('enables button when items exist', () => {
      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const button = screen.getByRole('button', { name: /Place Order/i });
      expect(button).not.toBeDisabled();
    });

    it('opens PIN auth modal when place order is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      await user.click(screen.getByRole('button', { name: /Place Order/i }));
      expect(screen.getByTestId('pin-auth-modal')).toBeInTheDocument();
    });
  });

  describe('phone validation', () => {
    it('shows error for invalid phone number', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const phoneInput = screen.getByPlaceholderText(/Phone Number/i);
      await user.type(phoneInput, '123');

      expect(
        screen.getByText(/Please enter a valid 10-digit phone number/i)
      ).toBeInTheDocument();
    });

    it('clears error when valid phone number is entered', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CustomerPanel {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const phoneInput = screen.getByPlaceholderText(/Phone Number/i);
      await user.type(phoneInput, '9876543210');

      expect(
        screen.queryByText(/Please enter a valid 10-digit phone number/i)
      ).not.toBeInTheDocument();
    });
  });
});
