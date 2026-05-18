import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import SupplierManagementPage from './SupplierManagementPage';

const mockSuppliers = [
  { id: 'sup-1', supplierName: 'Fresh Farms', supplierCode: 'SUP-001', contactPerson: 'John', email: 'john@freshfarms.com', phone: '555-1001', status: 'ACTIVE', isPreferred: true, rating: 4.5, categories: ['RAW_MATERIAL'] },
  { id: 'sup-2', supplierName: 'Pack Solutions', supplierCode: 'SUP-002', contactPerson: 'Mary', email: 'mary@pack.com', phone: '555-1002', status: 'ACTIVE', isPreferred: false, rating: 3.8, categories: ['PACKAGING'] },
];

vi.mock('@/store/api/inventoryApi', async () => {
  const actual = await vi.importActual('@/store/api/inventoryApi');
  return {
    ...actual,
  useGetAllSuppliersQuery: () => ({ data: mockSuppliers, isLoading: false }),
  useGetActiveSuppliersQuery: () => ({ data: mockSuppliers }),
  useGetPreferredSuppliersQuery: () => ({ data: [mockSuppliers[0]] }),
  useUpdateSupplierStatusMutation: () => ([vi.fn()]),
  useMarkSupplierPreferredMutation: () => ([vi.fn()]),
  };
});

vi.mock('@/hooks/useSmartBackNavigation', async () => {
  const actual = await vi.importActual('@/hooks/useSmartBackNavigation');
  return {
    ...actual,
  useSmartBackNavigation: () => ({ handleBack: vi.fn() }),
  };
});

vi.mock('@/components/backgrounds/AnimatedBackground', async () => {
  const actual = await vi.importActual('@/components/backgrounds/AnimatedBackground');
  return {
    ...actual,
  default: () => <div data-testid="animated-bg" />,
  };
});

vi.mock('@/components/inventory/AddSupplierDialog', async () => {
  const actual = await vi.importActual('@/components/inventory/AddSupplierDialog');
  return {
    ...actual,
  default: () => null,
  };
});

vi.mock('@/components/inventory/EditSupplierDialog', async () => {
  const actual = await vi.importActual('@/components/inventory/EditSupplierDialog');
  return {
    ...actual,
  default: () => null,
  };
});

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
