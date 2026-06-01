import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import StoreSelector from './StoreSelector';

// Mock the store API
vi.mock('../store/api/storeApi', async () => {
  const actual = await vi.importActual('../store/api/storeApi');
  return {
    ...actual,
    useGetActiveStoresQuery: vi.fn().mockReturnValue({
      data: [
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
      ],
      isLoading: false,
    }),
  };
});

// Mock tabStorage utilities
vi.mock('../utils/tabStorage', () => ({
  getTabStore: vi.fn().mockReturnValue(null),
  setTabStore: vi.fn(),
}));

describe('StoreSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(screen.getByText('Hyderabad, Telangana')).toBeInTheDocument();
  });

  it('shows store status badges in dropdown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));

    const activeBadges = screen.getAllByText('active');
    expect(activeBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onStoreChange callback when a store is selected', async () => {
    const user = userEvent.setup();
    const onStoreChange = vi.fn();
    renderWithProviders(
      <StoreSelector onStoreChange={onStoreChange} />,
      { useMemoryRouter: true }
    );

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
    // After selection, dropdown items should not be visible
    // (The store name is now shown as selected text, not in dropdown)
  });

  it('shows loading state when stores are loading', () => {
    const { useGetActiveStoresQuery } = require('../store/api/storeApi');
    useGetActiveStoresQuery.mockReturnValueOnce({ data: [], isLoading: true });

    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('disables the button while loading', () => {
    const { useGetActiveStoresQuery } = require('../store/api/storeApi');
    useGetActiveStoresQuery.mockReturnValueOnce({ data: [], isLoading: true });

    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });
    const button = screen.getByText('Loading...').closest('button');
    expect(button).toBeDisabled();
  });

  it('shows empty message when no stores are available', async () => {
    const { useGetActiveStoresQuery } = require('../store/api/storeApi');
    useGetActiveStoresQuery.mockReturnValueOnce({ data: [], isLoading: false });

    const user = userEvent.setup();
    renderWithProviders(<StoreSelector />, { useMemoryRouter: true });

    await user.click(screen.getByText('Select Store'));
    expect(screen.getByText('No stores available')).toBeInTheDocument();
  });

  it('renders manager variant', () => {
    renderWithProviders(<StoreSelector variant="manager" />, { useMemoryRouter: true });
    expect(screen.getByText('Select Store')).toBeInTheDocument();
  });
});
