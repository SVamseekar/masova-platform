import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import SupplierManagementPage from './SupplierManagementPage';

const mockSuppliers = [
  { id: 'sup-1', name: 'Fresh Farms', contactPerson: 'John', email: 'john@freshfarms.com', phone: '555-1001', status: 'ACTIVE', isPreferred: true, rating: 4.5, categories: ['RAW_MATERIAL'] },
  { id: 'sup-2', name: 'Pack Solutions', contactPerson: 'Mary', email: 'mary@pack.com', phone: '555-1002', status: 'ACTIVE', isPreferred: false, rating: 3.8, categories: ['PACKAGING'] },
];

vi.mock('@/store/api/inventoryApi', () => ({
  useGetAllSuppliersQuery: vi.fn().mockReturnValue({ data: mockSuppliers, isLoading: false }),
  useGetActiveSuppliersQuery: vi.fn().mockReturnValue({ data: mockSuppliers }),
  useGetPreferredSuppliersQuery: vi.fn().mockReturnValue({ data: [mockSuppliers[0]] }),
  useUpdateSupplierStatusMutation: vi.fn().mockReturnValue([vi.fn()]),
  useMarkSupplierPreferredMutation: vi.fn().mockReturnValue([vi.fn()]),
}));

vi.mock('@/hooks/useSmartBackNavigation', () => ({
  useSmartBackNavigation: vi.fn().mockReturnValue({ handleBack: vi.fn() }),
}));

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-bg" />,
}));

vi.mock('@/components/inventory/AddSupplierDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/inventory/EditSupplierDialog', () => ({
  default: () => null,
}));

describe('SupplierManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<SupplierManagementPage />);
    expect(screen.getByText('Fresh Farms')).toBeInTheDocument();
  });

  it('displays supplier names', () => {
    renderAsManager(<SupplierManagementPage />);
    expect(screen.getByText('Fresh Farms')).toBeInTheDocument();
    expect(screen.getByText('Pack Solutions')).toBeInTheDocument();
  });

  it('shows add supplier button', () => {
    renderAsManager(<SupplierManagementPage />);
    expect(screen.getByText(/Add Supplier/)).toBeInTheDocument();
  });
});
