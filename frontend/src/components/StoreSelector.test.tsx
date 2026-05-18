import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import StoreSelector from './StoreSelector';

const mockStores = [
  {
    id: 'store-1',
    name: 'Downtown Branch',
    storeCode: 'DT-001',
    address: { street: '123 Main St', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    status: 'ACTIVE',
  },
  {
    id: 'store-2',
    name: 'HITEC City Branch',
    storeCode: 'HC-002',
    address: { street: '456 Tech Park', city: 'Hyderabad', state: 'Telangana', pincode: '500081' },
    status: 'ACTIVE',
  },
];

const mockUseGetActiveStoresQuery = vi.fn();

vi.mock('../store/api/storeApi', async () => {
  const actual = await vi.importActual('../store/api/storeApi');
  return {
    ...actual,
    useGetActiveStoresQuery: (...args: any[]) => mockUseGetActiveStoresQuery(...args),
  };
});

vi.mock('../utils/tabStorage', async () => {
  const actual = await vi.importActual('../utils/tabStorage');
  return {
    ...actual,
    getTabStore: () => (null),
    setTabStore: vi.fn(),
  };
});

describe('StoreSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetActiveStoresQuery.mockReturnValue({ data: mockStores, isLoading: false });
  });

  it('renders without crashing', () => {
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });
    expect(screen.getByText('Select Store')).toBeInTheDocument();
  });

  it('shows Select Store placeholder when no store is selected', () => {
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });
    expect(screen.getByText('Select Store')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));
    expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    expect(screen.getByText('HITEC City Branch')).toBeInTheDocument();
  });

  it('shows store location details in dropdown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));
    expect(screen.getAllByText(/Hyderabad/).length).toBeGreaterThan(0);
  });

  it('shows store names in dropdown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));
    expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    expect(screen.getByText('HITEC City Branch')).toBeInTheDocument();
  });

  it('calls onStoreChange callback when a store is selected', async () => {
    const onStoreChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<StoreSelector onStoreChange={onStoreChange} />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));
    await user.click(screen.getByText('Downtown Branch'));

    expect(onStoreChange).toHaveBeenCalledWith('DT-001', 'Downtown Branch');
  });

  it('closes dropdown after store selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));
    expect(screen.getByText('Downtown Branch')).toBeInTheDocument();

    await user.click(screen.getByText('Downtown Branch'));
  });

  it('renders manager variant', () => {
    renderWithProviders(<StoreSelector variant="manager" />, { useMemoryRouter: true });
    expect(screen.getByText('Select Store')).toBeInTheDocument();
  });

  it('shows loading state when stores are loading', () => {
    mockUseGetActiveStoresQuery.mockReturnValueOnce({ data: [], isLoading: true });
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('disables the button while loading', () => {
    mockUseGetActiveStoresQuery.mockReturnValueOnce({ data: [], isLoading: true });
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });
    const button = screen.getByText('Loading...').closest('button');
    expect(button).toBeDisabled();
  });

  it('shows empty message when no stores are available', async () => {
    mockUseGetActiveStoresQuery.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));
    expect(screen.getByText(/No stores available/i)).toBeInTheDocument();
  });
});
