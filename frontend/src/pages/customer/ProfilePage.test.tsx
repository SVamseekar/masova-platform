import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, screen } from '@/test/utils/testUtils';
import ProfilePage from './ProfilePage';

// Mock customer API hooks
const mockUseGetCustomerByUserIdQuery = vi.fn();
const mockCreateCustomer = vi.fn();
const mockUpdateCustomer = vi.fn();

vi.mock('@/store/api/customerApi', async () => {
  const actual = await vi.importActual('@/store/api/customerApi');
  return {
    ...actual,
    useGetCustomerByUserIdQuery: (...args: any[]) => mockUseGetCustomerByUserIdQuery(...args),
    useCreateCustomerMutation: () => [mockCreateCustomer, { isLoading: false }],
    useUpdateCustomerMutation: () => [mockUpdateCustomer, { isLoading: false }],
    useAddAddressMutation: () => [vi.fn(), { isLoading: false }],
    useUpdateAddressMutation: () => [vi.fn(), { isLoading: false }],
    useRemoveAddressMutation: () => [vi.fn(), { isLoading: false }],
    useSetDefaultAddressMutation: () => [vi.fn(), { isLoading: false }],
    useUpdatePreferencesMutation: () => [vi.fn(), { isLoading: false }],
  };
});

// Mock AnimatedBackground
vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

// Mock AppHeader
vi.mock('@/components/common/AppHeader', () => ({
  default: () => <div data-testid="app-header" />,
}));

// Mock neumorphic components
vi.mock('@/components/ui/neumorphic', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Checkbox: ({ label, checked, onChange }: any) => (
    <label>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
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
    expect(screen.getByText('Loading...')).toBeInTheDocument();
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
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
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
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('displays profile tabs', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Addresses')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('displays personal information by default', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('customer@test.com')).toBeInTheDocument();
  });

  it('displays loyalty card when loyalty info exists', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Loyalty Points')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('SILVER')).toBeInTheDocument();
  });

  it('displays order stats', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
  });

  it('shows Edit button on Personal Info tab', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows email verified status', () => {
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<ProfilePage />);
    // The verified checkmark
    const verifiedElements = screen.getAllByText(/Verified/i);
    expect(verifiedElements.length).toBeGreaterThan(0);
  });
});
