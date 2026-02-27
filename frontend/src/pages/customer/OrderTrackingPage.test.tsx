import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, screen } from '@/test/utils/testUtils';
import { mockOrderList, mockCustomerUser } from '@/test/fixtures';
import OrderTrackingPage from './OrderTrackingPage';

// Mock the APIs
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

// Mock WebSocket hook
vi.mock('@/hooks/useCustomerOrdersWebSocket', () => ({
  useCustomerOrdersWebSocket: () => ({
    isConnected: false,
    recentUpdates: [],
  }),
}));

// Mock AnimatedBackground
vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

// Mock AppHeader
vi.mock('@/components/common/AppHeader', () => ({
  default: () => <div data-testid="app-header" />,
}));

// Mock StoreInfo
vi.mock('@/components/StoreInfo', () => ({
  default: () => <div data-testid="store-info" />,
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OrderTrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while data is fetching', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByText('Loading your orders...')).toBeInTheDocument();
  });

  it('shows welcome message when customer profile does not exist', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404, data: { message: 'Not found' } },
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByText('Please complete your first order to see your order history here.')).toBeInTheDocument();
  });

  it('shows Browse Menu button when no customer profile', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404, data: { message: 'Not found' } },
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });

  it('shows empty orders state when customer exists but has no orders', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Test Customer' },
      isLoading: false,
      error: null,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
    expect(screen.getByText('Start exploring our menu and place your first order!')).toBeInTheDocument();
  });

  it('renders My Orders heading when orders exist', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Test Customer' },
      isLoading: false,
      error: null,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: mockOrderList,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByText('My Orders')).toBeInTheDocument();
  });

  it('shows error state when orders fail to load', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Test Customer' },
      isLoading: false,
      error: null,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: { status: 500, data: { message: 'Server error' } },
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders date filter dropdown', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Test Customer' },
      isLoading: false,
      error: null,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: mockOrderList,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByDisplayValue('All Orders')).toBeInTheDocument();
  });

  it('shows connection status indicator', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Test Customer' },
      isLoading: false,
      error: null,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: mockOrderList,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<OrderTrackingPage />);
    expect(screen.getByText('Polling Mode')).toBeInTheDocument();
  });
});
