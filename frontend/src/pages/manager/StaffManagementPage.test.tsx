import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen, userEvent } from '@/test/utils/testUtils';
import StaffManagementPage from './StaffManagementPage';

const mockEmployees = [
  { id: 'e1', name: 'Alice Kitchen', email: 'alice@test.com', phone: '555-0001', type: 'STAFF', isActive: true, role: 'Chef', storeId: 'store-1' },
  { id: 'e2', name: 'Bob Driver', email: 'bob@test.com', phone: '555-0002', type: 'DRIVER', isActive: true, role: 'Delivery', storeId: 'store-1' },
  { id: 'e3', name: 'Carol Inactive', email: 'carol@test.com', phone: '555-0003', type: 'STAFF', isActive: false, role: 'Server', storeId: 'store-1' },
];

vi.mock('@/store/api/userApi', () => ({
  useGetStoreEmployeesQuery: vi.fn().mockReturnValue({ data: mockEmployees, isLoading: false }),
  useCreateUserMutation: vi.fn().mockReturnValue([vi.fn(), { isLoading: false }]),
  useUpdateUserMutation: vi.fn().mockReturnValue([vi.fn()]),
  useActivateUserMutation: vi.fn().mockReturnValue([vi.fn()]),
  useDeactivateUserMutation: vi.fn().mockReturnValue([vi.fn()]),
}));

vi.mock('@/store/api/sessionApi', () => ({
  useGetActiveStoreSessionsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useGetStoreSessionsQuery: vi.fn().mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() }),
  useGetEmployeeSessionReportQuery: vi.fn().mockReturnValue({ data: null }),
  useGetEmployeeSessionStatusQuery: vi.fn().mockReturnValue({ data: null }),
}));

vi.mock('@/contexts/PageStoreContext', () => ({
  usePageStore: vi.fn().mockReturnValue({ selectedStoreId: 'store-1', setSelectedStoreId: vi.fn() }),
}));

vi.mock('@/hoc/withPageStoreContext', () => ({
  withPageStoreContext: (Component: React.ComponentType) => Component,
}));

vi.mock('@/hooks/useSmartBackNavigation', () => ({
  useSmartBackNavigation: vi.fn().mockReturnValue({ handleBack: vi.fn() }),
}));

vi.mock('@/components/common/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar">FilterBar</div>,
}));

vi.mock('@/utils/filterUtils', () => ({
  applyFilters: vi.fn((data: any[]) => data),
  applySort: vi.fn((data: any[]) => data),
  exportToCSV: vi.fn(),
  commonFilters: { searchText: vi.fn() },
}));

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-bg" />,
}));

vi.mock('@/components/modals/PINDisplayModal', () => ({
  PINDisplayModal: () => null,
}));

vi.mock('./components/ExpandableEmployeeRow', () => ({
  ExpandableEmployeeRow: ({ employeeName }: { employeeName: string }) => (
    <div data-testid="employee-row">{employeeName}</div>
  ),
}));

describe('StaffManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<StaffManagementPage />);
    expect(screen.getByText('Total Employees')).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    renderAsManager(<StaffManagementPage />);
    expect(screen.getByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Staff Members')).toBeInTheDocument();
    expect(screen.getByText('Drivers')).toBeInTheDocument();
  });

  it('renders employee names in the table', () => {
    renderAsManager(<StaffManagementPage />);
    expect(screen.getByText('Alice Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Bob Driver')).toBeInTheDocument();
    expect(screen.getByText('Carol Inactive')).toBeInTheDocument();
  });

  it('shows add staff member button', () => {
    renderAsManager(<StaffManagementPage />);
    expect(screen.getByText('+ Add Staff Member')).toBeInTheDocument();
  });

  it('shows the filter bar', () => {
    renderAsManager(<StaffManagementPage />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  it('shows staff table headers', () => {
    renderAsManager(<StaffManagementPage />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('opens create dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    renderAsManager(<StaffManagementPage />);
    await user.click(screen.getByText('+ Add Staff Member'));
    expect(screen.getByText('Add New Staff Member')).toBeInTheDocument();
  });
});
