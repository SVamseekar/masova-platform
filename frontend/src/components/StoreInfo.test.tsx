import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StoreInfo from './StoreInfo';
import { mockStore } from '@/test/fixtures';

// Mock the store API
vi.mock('../store/api/storeApi', async () => {
  const actual = await vi.importActual('../store/api/storeApi');
  return {
    ...actual,
    useGetStoreQuery: vi.fn(),
  };
});

const { useGetStoreQuery } = require('../store/api/storeApi');

describe('StoreInfo', () => {
  it('shows loading state', () => {
    useGetStoreQuery.mockReturnValue({ data: undefined, isLoading: true });

    render(<StoreInfo storeId="store-1" />);
    expect(screen.getByText('Loading store information...')).toBeInTheDocument();
  });

  it('returns null when no store data and not loading', () => {
    useGetStoreQuery.mockReturnValue({ data: undefined, isLoading: false });

    const { container } = render(<StoreInfo storeId="store-1" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders compact variant by default', () => {
    useGetStoreQuery.mockReturnValue({ data: mockStore, isLoading: false });

    render(<StoreInfo storeId="store-1" />);
    expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    expect(screen.getByText(/123 Main Street/)).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders detailed variant with extra information', () => {
    useGetStoreQuery.mockReturnValue({ data: mockStore, isLoading: false });

    render(<StoreInfo storeId="store-1" variant="detailed" />);
    expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    expect(screen.getByText(/DT-001/)).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  });

  it('renders operating config info in detailed variant', () => {
    useGetStoreQuery.mockReturnValue({ data: mockStore, isLoading: false });

    render(<StoreInfo storeId="store-1" variant="detailed" />);
    expect(screen.getByText(/Delivery Radius/)).toBeInTheDocument();
    expect(screen.getByText(/10km/)).toBeInTheDocument();
    expect(screen.getByText(/Min Order/)).toBeInTheDocument();
    expect(screen.getByText(/Prep Time/)).toBeInTheDocument();
  });

  it('shows phone number in detailed variant', () => {
    useGetStoreQuery.mockReturnValue({ data: mockStore, isLoading: false });

    render(<StoreInfo storeId="store-1" variant="detailed" />);
    expect(screen.getByText('555-0100')).toBeInTheDocument();
  });

  it('shows "No phone number" when phone is missing', () => {
    const storeWithoutPhone = { ...mockStore, phoneNumber: undefined };
    useGetStoreQuery.mockReturnValue({ data: storeWithoutPhone, isLoading: false });

    render(<StoreInfo storeId="store-1" variant="detailed" />);
    expect(screen.getByText('No phone number')).toBeInTheDocument();
  });

  it('skips query when storeId is empty', () => {
    useGetStoreQuery.mockReturnValue({ data: undefined, isLoading: false });

    render(<StoreInfo storeId="" />);
    expect(useGetStoreQuery).toHaveBeenCalledWith('', { skip: true });
  });
});
