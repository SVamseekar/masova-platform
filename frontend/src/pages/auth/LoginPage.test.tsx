import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  auth: { isAuthenticated: false, user: null as null | { type: string; role?: string } },
}));
vi.mock('../../store/hooks', () => ({ useAppSelector: () => mocks.auth }));
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({}) }));
vi.mock('../../store/api/authApi', () => ({ useLoginMutation: () => [mocks.login, { isLoading: false }] }));

function renderLogin(path = '/staff-login') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/staff-login" element={<LoginPage />} />
    <Route path="/pos" element={<p>POS destination</p>} />
    <Route path="/customer-login" element={<p>Customer destination</p>} />
  </Routes></MemoryRouter>);
}

describe('Staff sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { isAuthenticated: false, user: null };
    vi.mocked(sessionStorage.getItem).mockReturnValue(null);
  });

  it('explains password recovery without claiming a reset email was sent', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByText(/contact your manager/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: /send reset/i })).not.toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('routes an authenticated cashier to POS', async () => {
    mocks.auth = { isAuthenticated: true, user: { type: 'STAFF', role: 'CASHIER' } };
    renderLogin();
    expect(await screen.findByText('POS destination')).toBeInTheDocument();
  });

  it('routes a customer to customer sign-in without a delayed competing redirect', async () => {
    mocks.auth = { isAuthenticated: true, user: { type: 'CUSTOMER' } };
    renderLogin();
    expect(await screen.findByText('Customer destination')).toBeInTheDocument();
  });

  it('does not publish demo account credentials', () => {
    renderLogin();
    expect(screen.queryByText(/quick demo access/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /manager.*dashboard/i })).not.toBeInTheDocument();
  });

  it('shows associated field errors and focuses the first invalid field', async () => {
    renderLogin();
    fireEvent.submit(screen.getByRole('button', { name: /^sign in/i }).closest('form')!);
    expect(await screen.findByText('Enter your work email.')).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('preserves entered values after server failure and supports retry', async () => {
    mocks.login.mockReturnValueOnce({ unwrap: () => Promise.reject({ data: { message: 'Invalid email or password.' } }) })
      .mockReturnValueOnce({ unwrap: () => Promise.resolve({ user: { type: 'STAFF' } }) });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'staff@restaurant.example');
    await userEvent.type(screen.getByLabelText('Password', { exact: true }), 'Staff-test-123');
    await userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByLabelText('Email')).toHaveValue('staff@restaurant.example');
    await userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
    await waitFor(() => expect(mocks.login).toHaveBeenCalledTimes(2));
  });

  it('blocks duplicate submit events while a login request is pending', async () => {
    let finish!: (value: unknown) => void;
    mocks.login.mockReturnValue({ unwrap: () => new Promise(resolve => { finish = resolve; }) });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'staff@restaurant.example');
    await userEvent.type(screen.getByLabelText('Password', { exact: true }), 'Staff-test-123');
    const form = screen.getByRole('button', { name: /^sign in/i }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
    finish({ user: { type: 'STAFF' } });
    await waitFor(() => expect(screen.getByRole('button', { name: /^sign in$/i })).toBeEnabled());
  });

  it('shows session recovery without exposing a protected record URL', () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue('/manager?section=orders&order=private-record');
    renderLogin('/staff-login?reason=session-expired');
    expect(screen.getByText('Session expired')).toBeVisible();
    expect(screen.queryByText(/private-record/)).not.toBeInTheDocument();
  });
});
