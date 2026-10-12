import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerLoginPage from './CustomerLoginPage';
import RegisterPage, { passwordStrength } from './RegisterPage';

const mocks = vi.hoisted(() => ({
  login: vi.fn(), register: vi.fn(), createCustomer: vi.fn(),
  auth: { isAuthenticated: false, user: null as null | { id: string } },
}));
const unwrap = (value: unknown) => ({ unwrap: () => value instanceof Error ? Promise.reject(value) : Promise.resolve(value) });

vi.mock('../../store/api/authApi', () => ({
  useLoginMutation: () => [mocks.login, { isLoading: false }],
  useGoogleLoginMutation: () => [vi.fn(), { isLoading: false }],
  useRegisterMutation: () => [mocks.register, { isLoading: false }],
  useGoogleRegisterMutation: () => [vi.fn(), { isLoading: false }],
}));
vi.mock('../../store/api/customerApi', () => ({ useCreateCustomerMutation: () => [mocks.createCustomer] }));
vi.mock('../../store/hooks', () => ({ useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth: mocks.auth, cart: { storeCountryCode: 'DE' } }) }));
vi.mock('../../apps/PublicWebsite/components/BrowseShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@react-oauth/google', () => ({ GoogleLogin: () => <button type="button">Continue with Google</button> }));

const Where = () => <p data-testid="where">{useLocation().pathname}</p>;
const renderAt = (path: string, state?: unknown) => render(
  <MemoryRouter initialEntries={[{ pathname: path, state }]}>
    <Routes>
      <Route path="/customer-login" element={<CustomerLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
);

describe('Customer sign in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { isAuthenticated: false, user: null };
    mocks.login.mockReturnValue(unwrap({}));
  });

  it('explains missing details next to each field and does not call the server', async () => {
    const user = userEvent.setup();
    renderAt('/customer-login');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('shows and hides the password and signs in with trimmed email', async () => {
    const user = userEvent.setup();
    renderAt('/customer-login');
    const password = screen.getByLabelText('Password');
    await user.type(screen.getByLabelText('Email'), ' alex@example.com ');
    await user.type(password, 'secret-pass');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('checkbox', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.login).toHaveBeenCalledWith({ email: 'alex@example.com', password: 'secret-pass', rememberMe: false });
  });

  it('reports a rejected sign in', async () => {
    const user = userEvent.setup();
    mocks.login.mockReturnValue(unwrap(Object.assign(new Error('x'), { data: { message: 'Invalid credentials' } })));
    renderAt('/customer-login');
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('returns a signed-in customer to where they came from, or to ordering', () => {
    mocks.auth = { isAuthenticated: true, user: { id: 'user-1' } };
    renderAt('/customer-login', { from: '/checkout' });
    expect(screen.getByTestId('where')).toHaveTextContent('/checkout');
  });

  it('hides Google sign-in when it is not configured', () => {
    renderAt('/customer-login');
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
  });
});

describe('Create account', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { isAuthenticated: false, user: null };
    mocks.register.mockReturnValue(unwrap({ user: { id: 'user-1', name: 'Alex Carter', email: 'alex@example.com' } }));
    mocks.createCustomer.mockReturnValue(unwrap({}));
  });

  const fill = async (user: ReturnType<typeof userEvent.setup>, email = 'alex@example.com', password = 'Sample123') => {
    await user.type(screen.getByLabelText('Full name'), 'Alex Carter');
    await user.type(screen.getByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Phone number'), '0151 23456789');
    await user.type(screen.getByLabelText('Password'), password);
  };

  it('rates password strength against the stated rule', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('short1')).toBe(1);
    expect(passwordStrength('lettersonly')).toBe(1);
    expect(passwordStrength('Sample123')).toBe(2);
    expect(passwordStrength('Sample123!')).toBe(3);
  });

  it('requires a valid email, a strong enough password and consent', async () => {
    const user = userEvent.setup();
    renderAt('/register');
    await fill(user, 'alex@', 'short1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Agree to the Terms of Service and Privacy Policy to create an account.')).toBeInTheDocument();
    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('registers with the calling code applied and continues to the origin page', async () => {
    const user = userEvent.setup();
    renderAt('/register', { from: '/checkout' });
    await fill(user);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(mocks.register).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alex Carter', email: 'alex@example.com', type: 'CUSTOMER', password: 'Sample123' }));
    expect(mocks.register.mock.calls[0][0].phone.replace(/\D/g, '')).toBe('4915123456789');
    expect(await screen.findByTestId('where')).toHaveTextContent('/checkout');
    expect(mocks.createCustomer).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });

  it('keeps the form and explains when the email is already registered', async () => {
    const user = userEvent.setup();
    mocks.register.mockReturnValue(unwrap(Object.assign(new Error('x'), { data: { message: 'Email already exists' } })));
    renderAt('/register');
    await fill(user);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This email is already registered. Sign in instead.');
    expect(screen.getByLabelText('Full name')).toHaveValue('Alex Carter');
  });
});
