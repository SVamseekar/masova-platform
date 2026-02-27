import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import PurchaseOrdersPage from './PurchaseOrdersPage';

const mockPurchaseOrders = [
  { id: 'po-1', orderNumber: 'PO-001', supplierId: 'sup-1', status: 'PENDING_APPROVAL', totalAmount: 15000, orderDate: '2026-02-10T00:00:00Z', expectedDeliveryDate: '2026-02-17T00:00:00Z', items: [{ itemName: 'Flour', orderedQuantity: 100, unit: 'kg', unitPrice: 45 }] },
  { id: 'po-2', orderNumber: 'PO-002', supplierId: 'sup-2', status: 'SENT', totalAmount: 8500, orderDate: '2026-02-12T00:00:00Z', expectedDeliveryDate: '2026-02-19T00:00:00Z', items: [{ itemName: 'Cheese', orderedQuantity: 50, unit: 'kg', unitPrice: 170 }] },
];

vi.mock('@/store/api/inventoryApi', () => ({
  useGetAllPurchaseOrdersQuery: vi.fn().mockReturnValue({ data: mockPurchaseOrders, isLoading: false, refetch: vi.fn() }),
  useGetPendingApprovalPurchaseOrdersQuery: vi.fn().mockReturnValue({ data: [mockPurchaseOrders[0]], refetch: vi.fn() }),
  useApprovePurchaseOrderMutation: vi.fn().mockReturnValue([vi.fn()]),
  useRejectPurchaseOrderMutation: vi.fn().mockReturnValue([vi.fn()]),
  useSendPurchaseOrderMutation: vi.fn().mockReturnValue([vi.fn()]),
  useAutoGeneratePurchaseOrdersMutation: vi.fn().mockReturnValue([vi.fn(), { isLoading: false }]),
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

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-bg" />,
}));

vi.mock('@/components/inventory/CreatePurchaseOrderDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/inventory/ReceivePurchaseOrderDialog', () => ({
  default: () => null,
}));

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, fmt: string) => date.toLocaleDateString()),
}));

describe('PurchaseOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<PurchaseOrdersPage />);
    expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    renderAsManager(<PurchaseOrdersPage />);
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('Sent to Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
  });

  it('shows purchase order numbers', () => {
    renderAsManager(<PurchaseOrdersPage />);
    expect(screen.getByText('PO-001')).toBeInTheDocument();
    expect(screen.getByText('PO-002')).toBeInTheDocument();
  });

  it('shows create PO button', () => {
    renderAsManager(<PurchaseOrdersPage />);
    expect(screen.getByText('+ Create PO')).toBeInTheDocument();
  });

  it('shows auto-generate button', () => {
    renderAsManager(<PurchaseOrdersPage />);
    expect(screen.getByText(/Auto-Generate from Low Stock/)).toBeInTheDocument();
  });

  it('shows filter buttons', () => {
    renderAsManager(<PurchaseOrdersPage />);
    expect(screen.getByText('All Orders')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Received')).toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending orders', () => {
    renderAsManager(<PurchaseOrdersPage />);
    expect(screen.getByText(/Approve/)).toBeInTheDocument();
    expect(screen.getByText(/Reject/)).toBeInTheDocument();
  });
});
