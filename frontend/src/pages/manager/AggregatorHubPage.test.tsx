import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AggregatorHubPage from './AggregatorHubPage';

vi.mock('../../store/api/aggregatorApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/api/aggregatorApi')>();
  return {
    ...actual,
    useGetConnectionsQuery: vi.fn(() => ({
      data: [
        { id: '1', storeId: 'store1', platform: 'WOLT', commissionPercent: 28, active: true },
      ],
      isLoading: false,
      error: null,
    })),
    useUpsertConnectionMutation: vi.fn(() => [vi.fn().mockResolvedValue({ data: {} }), { isLoading: false }]),
  };
});

vi.mock('../../store/hooks', () => ({
  useAppSelector: (selector: (s: unknown) => unknown) => {
    const fakeState = {
      auth: { token: 'tok', user: { storeId: 'store1', type: 'MANAGER' } },
      cart: { selectedStoreId: 'store1' },
    };
    return selector(fakeState);
  },
  useAppDispatch: () => vi.fn(),
}));

describe('AggregatorHubPage', () => {
  it('renders all four platform cards', () => {
    render(<AggregatorHubPage />);
    expect(screen.getByText('Wolt')).toBeDefined();
    expect(screen.getByText('Deliveroo')).toBeDefined();
    expect(screen.getByText('Just Eat')).toBeDefined();
    expect(screen.getByText('Uber Eats')).toBeDefined();
  });

  it('shows configured commission for Wolt', () => {
    render(<AggregatorHubPage />);
    expect(screen.getByText('28%')).toBeDefined();
  });

  it('shows "Not configured" for unconfigured platforms', () => {
    render(<AggregatorHubPage />);
    const notConfigured = screen.getAllByText('Not configured');
    expect(notConfigured.length).toBe(3); // Deliveroo, Just Eat, Uber Eats
  });

  it('shows commission input on Edit click', async () => {
    render(<AggregatorHubPage />);
    const editBtn = screen.getByRole('button', { name: 'Edit' });
    await userEvent.click(editBtn);
    expect(screen.getByRole('spinbutton')).toBeDefined(); // number input
  });
});
