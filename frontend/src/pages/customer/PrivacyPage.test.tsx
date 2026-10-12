import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderAsCustomer, screen, within } from '@/test/utils/testUtils';
import PrivacyPage from './PrivacyPage';

const mocks = vi.hoisted(() => ({ consents: vi.fn(), requests: vi.fn(), createRequest: vi.fn(), exportData: vi.fn() }));
vi.mock('@/store/api/gdprApi', async () => ({
  ...(await vi.importActual('@/store/api/gdprApi')),
  useGetConsentsQuery: () => mocks.consents(),
  useGetGdprRequestsQuery: () => mocks.requests(),
  useCreateGdprRequestMutation: () => [mocks.createRequest, { isLoading: false }],
  useLazyExportUserDataQuery: () => [mocks.exportData, { isFetching: false }],
}));
vi.mock('@/apps/PublicWebsite/components/BrowseShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('PrivacyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consents.mockReturnValue({ data: [{ consentType: 'ANALYTICS_TRACKING', status: 'GRANTED' }, { consentType: 'MARKETING_COMMUNICATIONS', status: 'REVOKED' }], isLoading: false, isError: false });
    mocks.requests.mockReturnValue({ data: [
      { id: 'r1', requestType: 'ERASURE', status: 'PENDING', createdAt: '2026-10-01T10:00:00' },
      { id: 'r2', requestType: 'DATA_PORTABILITY', status: 'COMPLETED', createdAt: '2026-10-10T10:00:00', completedAt: '2026-10-11T09:00:00' },
    ], isLoading: false, isError: false });
    mocks.createRequest.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows consent choices recorded on the server', () => {
    renderAsCustomer(<PrivacyPage />);
    const rows = within(screen.getByRole('region', { name: 'Consent status' })).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Always on');
    expect(rows[1]).toHaveTextContent('Analytics (optional)');
    expect(rows[1]).toHaveTextContent('Enabled');
    expect(rows[2]).toHaveTextContent('Not enabled');
  });

  it('lists requests newest first with status and completion date', () => {
    renderAsCustomer(<PrivacyPage />);
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Data export');
    expect(rows[1]).toHaveTextContent('Completed');
    expect(rows[1]).toHaveTextContent('Completed on 11 Oct 2026');
    expect(rows[2]).toHaveTextContent('Data erasure');
    expect(rows[2]).toHaveTextContent('Pending');
  });

  it('requires a description for rectification and sends the request for the signed-in user', async () => {
    const user = userEvent.setup();
    renderAsCustomer(<PrivacyPage />);
    await user.click(screen.getByRole('button', { name: /Rectify your data/ }));
    const dialog = screen.getByRole('dialog', { name: 'Rectify your data' });
    await user.click(within(dialog).getByRole('button', { name: 'Send request' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Describe what should be corrected.');
    expect(mocks.createRequest).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText('What should be corrected?'), 'My surname is spelled wrong');
    await user.click(within(dialog).getByRole('button', { name: 'Send request' }));
    expect(mocks.createRequest).toHaveBeenCalledWith({ userId: expect.any(String), requestType: 'RECTIFICATION', reason: 'My surname is spelled wrong' });
    expect(await screen.findByText('Your request was sent. We answer within 30 days.')).toBeInTheDocument();
  });

  it('asks before an erasure request and reports a request that was not sent', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.createRequest.mockReturnValue({ unwrap: () => Promise.reject({ data: { message: 'A request is already open.' } }) });
    renderAsCustomer(<PrivacyPage />);
    await user.click(screen.getByRole('button', { name: /Request erasure/ }));
    const dialog = screen.getByRole('dialog', { name: 'Request erasure' });
    expect(dialog).toHaveTextContent('This cannot be undone');
    await user.click(within(dialog).getByRole('button', { name: 'Request erasure' }));
    expect(mocks.createRequest).toHaveBeenCalledWith(expect.objectContaining({ requestType: 'ERASURE' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('A request is already open.');
  });

  it('warns when the export is incomplete instead of reporting success', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    mocks.exportData.mockReturnValue({ unwrap: () => Promise.resolve({ userId: 'u1', exportedAt: '', complete: false, errors: ['Order Service: down'] }) });
    renderAsCustomer(<PrivacyPage />);
    await user.click(screen.getByRole('button', { name: /Export your data/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('some data could not be read');
  });

  it('reports an export that failed', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.exportData.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) });
    renderAsCustomer(<PrivacyPage />);
    await user.click(screen.getByRole('button', { name: /Export your data/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your data could not be exported. Try again.');
  });

  it('reports consent choices and requests that could not be loaded', () => {
    mocks.consents.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    mocks.requests.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    renderAsCustomer(<PrivacyPage />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts[0]).toHaveTextContent('Your consent choices could not be loaded.');
    expect(alerts[1]).toHaveTextContent('Your requests could not be loaded.');
  });
});
