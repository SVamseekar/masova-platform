import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import ProfilePage from './ProfilePage';

const mockUseGetCustomerByUserIdQuery = vi.fn();
const mockCreateCustomer = vi.fn();
const mockUpdateCustomer = vi.fn();

vi.mock('@/store/api/customerApi', async () => {
  const actual = await vi.importActual('@/store/api/customerApi');
  return {
    ...actual,
    useGetCustomerByUserIdQuery: (...args: unknown[]) => mockUseGetCustomerByUserIdQuery(...args),
    useCreateCustomerMutation: () => [mockCreateCustomer, { isLoading: false }],
    useUpdateCustomerMutation: () => [mockUpdateCustomer, { isLoading: false }],
    useAddAddressMutation: () => [vi.fn(), { isLoading: false }],
    useUpdateAddressMutation: () => [vi.fn(), { isLoading: false }],
    useRemoveAddressMutation: () => [vi.fn(), { isLoading: false }],
    useSetDefaultAddressMutation: () => [vi.fn(), { isLoading: false }],
    useUpdatePreferencesMutation: () => [vi.fn(), { isLoading: false }],
  };
});

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

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

const mockCustomer = {
  id: 'cust-1',
  userId: 'user-1',
  name: 'Test Customer',
  email: 'customer@test.com',
  phone: '9876543210',
  emailVerified: true,
  phoneVerified: false,
  dateOfBirth: '1990-01-15',
  gender: 'MALE',
  createdAt: '2026-01-01T00:00:00Z',
  addresses: [
    {
      id: 'addr-1',
      label: 'HOME',
      addressLine1: '123 Main Street',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
      country: 'India',
      isDefault: true,
    },
  ],
  preferences: {
    spiceLevel: 'MEDIUM',
    cuisinePreferences: ['Indian', 'Italian'],
    dietaryRestrictions: ['Vegetarian'],
    allergens: ['Peanuts'],
    preferredPaymentMethod: 'UPI',
    notifyOnOffers: true,
    notifyOnOrderStatus: true,
  },
  loyaltyInfo: {
    tier: 'SILVER',
    totalPoints: 1500,
  },
  orderStats: {
    totalOrders: 25,
    totalSpent: 5000,
    averageOrderValue: 200,
  },
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error state when customer profile cannot be loaded', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500, data: { message: 'Server error' } },
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Unable to Load Profile')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Back to Menu')).toBeInTheDocument();
  });

  it('renders profile page with customer data', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getAllByText('Test Customer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Silver.*Member/i)).toBeInTheDocument();
  });

  it('displays profile navigation sections', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Addresses')).toBeInTheDocument();
    expect(screen.getByText('Food Preferences')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays overview with loyalty balance by default', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Loyalty Balance')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows Edit button on Personal Info tab', async () => {
    const user = userEvent.setup();
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    await user.click(screen.getByText('Personal Info'));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('customer@test.com')).toBeInTheDocument();
  });

  it('shows email verified status on personal info', async () => {
    const user = userEvent.setup();
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    await user.click(screen.getByText('Personal Info'));
    const verifiedElements = screen.getAllByText(/Verified/i);
    expect(verifiedElements.length).toBeGreaterThan(0);
  });
});