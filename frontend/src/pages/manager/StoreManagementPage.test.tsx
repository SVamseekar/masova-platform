import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen, userEvent } from '@/test/utils/testUtils';
import StoreManagementPage from './StoreManagementPage';

const mockStores = [
  { id: 'store-1', name: 'Downtown Branch', storeCode: 'DT-001', address: { street: '123 Main St', city: 'Hyderabad', state: 'Telangana', pincode: '500001' }, phoneNumber: '555-0100', status: 'ACTIVE', operatingConfig: { maxConcurrentOrders: 50, deliveryRadiusKm: 10, weeklySchedule: {} } },
  { id: 'store-2', name: 'HITEC City Branch', storeCode: 'HC-002', address: { street: '456 Tech Park', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }, phoneNumber: '555-0200', status: 'ACTIVE', operatingConfig: { maxConcurrentOrders: 75, deliveryRadiusKm: 8, weeklySchedule: {} } },
];

vi.mock('@/store/api/storeApi', () => ({
  useGetStoreQuery: vi.fn().mockReturnValue({ data: mockStores[0], isLoading: false, refetch: vi.fn() }),
  useGetActiveStoresQuery: vi.fn().mockReturnValue({ data: mockStores, isLoading: false }),
  useCreateStoreMutation: vi.fn().mockReturnValue([vi.fn(), { isLoading: false }]),
  useUpdateStoreMutation: vi.fn().mockReturnValue([vi.fn(), { isLoading: false }]),
}));

vi.mock('@/hooks/useSmartBackNavigation', () => ({
  useSmartBackNavigation: vi.fn().mockReturnValue({ handleBack: vi.fn() }),
}));

describe('StoreManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<StoreManagementPage />);
    expect(screen.getByText('Store Management')).toBeInTheDocument();
  });

  it('displays store cards', () => {
    renderAsManager(<StoreManagementPage />);
    expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    expect(screen.getByText('HITEC City Branch')).toBeInTheDocument();
  });

  it('shows store codes', () => {
    renderAsManager(<StoreManagementPage />);
    expect(screen.getByText('DT-001')).toBeInTheDocument();
    expect(screen.getByText('HC-002')).toBeInTheDocument();
  });

  it('shows create new store button', () => {
    renderAsManager(<StoreManagementPage />);
    expect(screen.getByText(/Create New Store/)).toBeInTheDocument();
  });

  it('displays store status badges', () => {
    renderAsManager(<StoreManagementPage />);
    const activeStatuses = screen.getAllByText('ACTIVE');
    expect(activeStatuses.length).toBeGreaterThanOrEqual(2);
  });

  it('shows loading state', () => {
    const { useGetActiveStoresQuery } = vi.mocked(
      await import('@/store/api/storeApi')
    );
    (useGetActiveStoresQuery as any).mockReturnValueOnce({ data: [], isLoading: true });
    renderAsManager(<StoreManagementPage />);
    expect(screen.getByText('Loading stores...')).toBeInTheDocument();
  });
});
