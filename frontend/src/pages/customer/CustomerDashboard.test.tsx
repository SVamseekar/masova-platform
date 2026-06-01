import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, screen } from '@/test/utils/testUtils';
import CustomerDashboard from './CustomerDashboard';

const mockUseGetCustomerByUserIdQuery = vi.fn();
const mockUseGetCustomerOrdersQuery = vi.fn();

vi.mock('@/store/api/customerApi', async () => {
  const actual = await vi.importActual('@/store/api/customerApi');
  return {
    ...actual,
    useGetCustomerByUserIdQuery: (...args: any[]) => mockUseGetCustomerByUserIdQuery(...args),
  };
});

vi.mock('@/store/api/orderApi', async () => {
  const actual = await vi.importActual('@/store/api/orderApi');
  return {
    ...actual,
    useGetCustomerOrdersQuery: (...args: any[]) => mockUseGetCustomerOrdersQuery(...args),
  };
});

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('@/components/common/AppHeader', () => ({
  default: () => <div data-testid="app-header" />,
}));

vi.mock('@/components/ui/neumorphic', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CustomerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome message', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
  });

  it('shows customer name in welcome message', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText(/Ravi/)).toBeInTheDocument();
  });

  it('displays Order Now button', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText('Order Now')).toBeInTheDocument();
  });

  it('displays quick action cards', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText('Order History')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Promotions')).toBeInTheDocument();
  });

  it('shows loyalty points when available', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: { totalPoints: 500 } },
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText(/500 loyalty points/)).toBeInTheDocument();
  });

  it('shows active order section when there is an active order', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'PREPARING',
          total: 250,
          items: [{ menuItemId: '1', name: 'Pizza', quantity: 1, price: 250 }],
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText('Active Order')).toBeInTheDocument();
    expect(screen.getByText('Track Order →')).toBeInTheDocument();
  });

  it('shows recent orders section', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [
        {
          id: 'order-2',
          orderNumber: 'ORD-002',
          status: 'DELIVERED',
          total: 150,
          items: [{ menuItemId: '1', name: 'Burger', quantity: 1, price: 150 }],
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
  });

  it('renders without customer data', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText(/Welcome Back/)).toBeInTheDocument();
  });
});
