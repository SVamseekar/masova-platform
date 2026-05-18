import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen, userEvent } from '@/test/utils/testUtils';
import StaffManagementPage from './StaffManagementPage';

const mockEmployees = [
  { id: 'e1', name: 'Alice Kitchen', email: 'alice@test.com', phone: '555-0001', type: 'STAFF', isActive: true, role: 'Chef', storeId: 'store-1' },
  { id: 'e2', name: 'Bob Driver', email: 'bob@test.com', phone: '555-0002', type: 'DRIVER', isActive: true, role: 'Delivery', storeId: 'store-1' },
  { id: 'e3', name: 'Carol Inactive', email: 'carol@test.com', phone: '555-0003', type: 'STAFF', isActive: false, role: 'Server', storeId: 'store-1' },
];

vi.mock('@/store/api/userApi', async () => {
  const actual = await vi.importActual('@/store/api/userApi');
  return {
    ...actual,
  useGetStoreEmployeesQuery: () => ({ data: mockEmployees, isLoading: false }),
  useCreateUserMutation: () => ([vi.fn(), { isLoading: false }]),
  useUpdateUserMutation: () => ([vi.fn()]),
  useActivateUserMutation: () => ([vi.fn()]),
  useDeactivateUserMutation: () => ([vi.fn()]),
  };
});

vi.mock('@/store/api/sessionApi', async () => {
  const actual = await vi.importActual('@/store/api/sessionApi');
  return {
    ...actual,
  useGetActiveStoreSessionsQuery: () => ({ data: [], isLoading: false }),
  useGetStoreSessionsQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useGetEmployeeSessionReportQuery: () => ({ data: null }),
  useGetEmployeeSessionStatusQuery: () => ({ data: null }),
  };
});

vi.mock('@/contexts/PageStoreContext', async () => {
  const actual = await vi.importActual('@/contexts/PageStoreContext');
  return {
    ...actual,
  usePageStore: () => ({ selectedStoreId: 'store-1', setSelectedStoreId: vi.fn() }),
  };
});

vi.mock('@/hoc/withPageStoreContext', async () => {
  const actual = await vi.importActual('@/hoc/withPageStoreContext');
  return {
    ...actual,
  withPageStoreContext: (Component: React.ComponentType) => Component,
  };
});

vi.mock('@/hooks/useSmartBackNavigation', async () => {
  const actual = await vi.importActual('@/hooks/useSmartBackNavigation');
  return {
    ...actual,
  useSmartBackNavigation: () => ({ handleBack: vi.fn() }),
  };
});

vi.mock('@/components/common/FilterBar', async () => {
  const actual = await vi.importActual('@/components/common/FilterBar');
  return {
    ...actual,
  FilterBar: () => <div data-testid="filter-bar">FilterBar</div>,
  };
});

vi.mock('@/utils/filterUtils', async () => {
  const actual = await vi.importActual('@/utils/filterUtils');
  return {
    ...actual,
  applyFilters: vi.fn((data: any[]) => data),
  applySort: vi.fn((data: any[]) => data),
  exportToCSV: vi.fn(),
  commonFilters: { searchText: vi.fn() },
  };
});

vi.mock('@/components/backgrounds/AnimatedBackground', async () => {
  const actual = await vi.importActual('@/components/backgrounds/AnimatedBackground');
  return {
    ...actual,
  default: () => <div data-testid="animated-bg" />,
  };
});

vi.mock('@/components/modals/PINDisplayModal', async () => {
  const actual = await vi.importActual('@/components/modals/PINDisplayModal');
  return {
    ...actual,
  PINDisplayModal: () => null,
  };
});

vi.mock('./components/ExpandableEmployeeRow', async () => {
  const actual = await vi.importActual('./components/ExpandableEmployeeRow');
  return {
    ...actual,
  ExpandableEmployeeRow: ({ employeeName }: { employeeName: string }) => (
    <div data-testid="employee-row">{employeeName}</div>
  ),
  };
});

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
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Staff Members')).toBeInTheDocument();
    expect(screen.getAllByText('Drivers').length).toBeGreaterThanOrEqual(1);
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
