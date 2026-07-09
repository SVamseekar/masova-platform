import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, screen } from '@/test/utils/testUtils';
import CustomerDashboard from './CustomerDashboard';

const mockUseGetCustomerByUserIdQuery = vi.fn();
const mockUseGetCustomerOrdersQuery = vi.fn();

vi.mock('@/store/api/customerApi', async () => {
  const actual = await vi.importActual('@/store/api/customerApi');
  return {
    ...actual,
    useGetCustomerByUserIdQuery: (...args: unknown[]) => mockUseGetCustomerByUserIdQuery(...args),
  };
});

vi.mock('@/store/api/orderApi', async () => {
  const actual = await vi.importActual('@/store/api/orderApi');
  return {
    ...actual,
    useGetCustomerOrdersQuery: (...args: unknown[]) => mockUseGetCustomerOrdersQuery(...args),
  };
});

vi.mock('@/components/common/AppHeader', () => ({
  default: () => <div data-testid="app-header" />,
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
      isError: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('shows customer name in welcome message', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
      isError: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText(/Ravi/)).toBeInTheDocument();
  });

  it('displays Order Now button', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
      isError: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByRole('button', { name: /Order Now/i })).toBeInTheDocument();
  });

  it('shows empty orders state when no history', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Anna', loyaltyInfo: null },
      isLoading: false,
      isError: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByRole('heading', { name: /No orders yet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Browse Menu/i })).toBeInTheDocument();
  });

  it('shows error UI with retry when profile fails', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByText(/Couldn.t load profile/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
