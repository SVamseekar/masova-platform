import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsCustomer, renderWithProviders, createAuthState, mockManagerUser } from '@/test/utils/testUtils';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import { ManagerCopilotDrawer } from './ManagerCopilotDrawer';

const mockUseGetCustomerByUserIdQuery = vi.fn();
const mockUseGetCustomerOrdersQuery = vi.fn();

vi.mock('@/store/api/customerApi', async () => {
  const actual = await vi.importActual('@/store/api/customerApi');
  return {
    ...actual,
    useGetCustomerByUserIdQuery: (...args: unknown[]) => mockUseGetCustomerByUserIdQuery(...args),
  };
});

vi.mock('@/store/api/orderApi', async () => {
  const actual = await vi.importActual('@/store/api/orderApi');
  return {
    ...actual,
    useGetCustomerOrdersQuery: (...args: unknown[]) => mockUseGetCustomerOrdersQuery(...args),
  };
});

vi.mock('@/components/common/AppHeader', () => ({
  default: () => <div data-testid="app-header" />,
}));

const postManagerChat = vi.fn();
const resolveManagerProposal = vi.fn();

vi.mock('@/services/managerCopilotClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/managerCopilotClient')>();
  return {
    ...actual,
    postManagerChat: (...args: unknown[]) => postManagerChat(...args),
    resolveManagerProposal: (...args: unknown[]) => resolveManagerProposal(...args),
  };
});

describe('manager copilot drawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetCustomerByUserIdQuery.mockReturnValue({
      data: { id: 'cust-1', name: 'Ravi', loyaltyInfo: null },
      isLoading: false,
      isError: false,
    });
    mockUseGetCustomerOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  it('is absent on a customer route', () => {
    renderAsCustomer(<CustomerDashboard />, { initialEntries: ['/customer'] });
    expect(screen.queryByTestId('manager-copilot-toggle')).not.toBeInTheDocument();
  });

  it('is present for a manager and resolves a proposal through the gateway client', async () => {
    const user = userEvent.setup();
    postManagerChat.mockResolvedValue({
      reply: 'Reorder flour',
      session_id: 's1',
      proposal_id: 'prop-1',
      proposals: [{ proposal_id: 'prop-2' }],
    });
    resolveManagerProposal.mockResolvedValue({ ok: true });

    renderWithProviders(<ManagerCopilotDrawer storeId="store-1" />, {
      useMemoryRouter: true,
      initialEntries: ['/manager'],
      preloadedState: createAuthState(
        { ...mockManagerUser, type: 'MANAGER', isActive: true },
        true,
      ),
    });

    expect(screen.getByTestId('manager-copilot-toggle')).toBeInTheDocument();
    await user.click(screen.getByTestId('manager-copilot-toggle'));
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Check stock');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(postManagerChat).toHaveBeenCalledWith({
      message: 'Check stock',
      session_id: expect.any(String),
      store_id: 'store-1',
    });
    await user.click(await screen.findByRole('button', { name: 'Approve prop-1' }));
    expect(resolveManagerProposal).toHaveBeenCalledWith('prop-1', 'APPROVED');
    await user.click(screen.getByRole('button', { name: 'Reject prop-2' }));
    expect(resolveManagerProposal).toHaveBeenCalledWith('prop-2', 'REJECTED');
  });
});
