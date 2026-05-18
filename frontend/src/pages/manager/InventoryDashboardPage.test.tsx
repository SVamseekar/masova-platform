import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import InventoryDashboardPage from './InventoryDashboardPage';

const mockItems = [
  { id: 'inv-1', itemCode: 'RM-001', itemName: 'Flour', category: 'RAW_MATERIAL', currentStock: 50, reservedStock: 5, minimumStock: 10, unitCost: 45, unit: 'kg', status: 'AVAILABLE', isPerishable: false, quantity: 50, reorderLevel: 10 },
  { id: 'inv-2', itemCode: 'RM-002', itemName: 'Tomatoes', category: 'INGREDIENT', currentStock: 3, reservedStock: 0, minimumStock: 10, unitCost: 30, unit: 'kg', status: 'LOW_STOCK', isPerishable: true, quantity: 3, reorderLevel: 10 },
];

vi.mock('@/store/api/inventoryApi', async () => {
  const actual = await vi.importActual('@/store/api/inventoryApi');
  return {
    ...actual,
  useGetAllInventoryItemsQuery: () => ({ data: mockItems, isLoading: false, refetch: vi.fn() }),
  useGetLowStockAlertsQuery: () => ({ data: [mockItems[1]], refetch: vi.fn() }),
  useGetOutOfStockItemsQuery: () => ({ data: [], refetch: vi.fn() }),
  useGetExpiringItemsQuery: () => ({ data: [], refetch: vi.fn() }),
  useGetTotalInventoryValueQuery: () => ({ data: { totalValue: 125000 }, refetch: vi.fn() }),
  useDeleteInventoryItemMutation: () => ([vi.fn()]),
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

vi.mock('@/components/inventory/StockAdjustmentDialog', async () => {
  const actual = await vi.importActual('@/components/inventory/StockAdjustmentDialog');
  return {
    ...actual,
  default: () => null,
  };
});

vi.mock('@/components/inventory/AddInventoryItemDialog', async () => {
  const actual = await vi.importActual('@/components/inventory/AddInventoryItemDialog');
  return {
    ...actual,
  default: () => null,
  };
});

describe('InventoryDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<InventoryDashboardPage />);
    expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    renderAsManager(<InventoryDashboardPage />);
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
  });

  it('renders inventory items in table', () => {
    renderAsManager(<InventoryDashboardPage />);
    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
  });

  it('shows low stock alert when items are low', () => {
    renderAsManager(<InventoryDashboardPage />);
    expect(screen.getByText(/Low Stock Alert/)).toBeInTheDocument();
  });

  it('shows add item button', () => {
    renderAsManager(<InventoryDashboardPage />);
    expect(screen.getByText('+ Add Item')).toBeInTheDocument();
  });

  it('shows table column headers', () => {
    renderAsManager(<InventoryDashboardPage />);
    expect(screen.getByText('Item Code')).toBeInTheDocument();
    expect(screen.getByText('Item Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Current Stock')).toBeInTheDocument();
  });
});
