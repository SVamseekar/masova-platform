import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import StaffAccessLayout from '../../components/common/StaffAccessLayout';
import { useLoginMutation } from '../../store/api/authApi';
import { getApiErrorMessage } from '../utils/apiError';
import { useAppSelector } from '../../store/hooks';
import { clearReturnUrl, getDefaultDashboard, getSavedReturnUrl } from '../../utils/security';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const requestRef = useRef<ReturnType<typeof login> | null>(null);
  const mountedRef = useRef(true);
  const sessionExpired = new URLSearchParams(location.search).get('reason') === 'session-expired';
  const busy = submitting || isLoading;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; requestRef.current?.abort?.(); };
  }, []);

  // Redirect only after authenticated state arrives; the route guard owns authorization.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.type === 'CUSTOMER') {
      navigate('/customer-login', { replace: true });
      return;
    }
    const returnUrl = getSavedReturnUrl();
    clearReturnUrl();
    const destination = user.type === 'KIOSK' ? '/pos' : returnUrl || getDefaultDashboard(user.type, user.role);
    navigate(destination, { replace: true });
  }, [isAuthenticated, user, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || isLoading) return;
    const trimmedEmail = email.trim();
    const errors = {
      email: !trimmedEmail ? 'Enter your work email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) ? 'Enter a valid email address.' : '',
      password: !password ? 'Enter your password.' : password.length < 6 || password.length > 50 ? 'Use between 6 and 50 characters.' : '',
    };
    setFieldErrors(errors);
    setError('');
    if (errors.email || errors.password) {
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    pendingRef.current = true;
    setSubmitting(true);
    const request = login({ email: trimmedEmail, password, rememberMe });
    requestRef.current = request;
    try {
      await request.unwrap();
    } catch (err: unknown) {
      if (mountedRef.current) {
        const status = err && typeof err === 'object' && 'status' in err ? err.status : null;
        setError(status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR'
          ? 'Could not connect. Check your connection and try again.'
          : getApiErrorMessage(err, 'Sign-in failed. Check your details and try again.'));
      }
    } finally {
      requestRef.current = null;
      pendingRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }

  return <StaffAccessLayout compact={sessionExpired}>
    {sessionExpired ? <div className="staff-access__notice" role="status">
      <Clock size={24} aria-hidden="true" />
      <div><h1>Session expired</h1><p>Please sign in again to continue where you left off.</p></div>
    </div> : <><h1>Staff sign in</h1><p className="staff-access__intro">Access your store to manage orders, menu, and operations.</p></>}
    <form onSubmit={handleSubmit} noValidate aria-busy={busy}>
      <div className="staff-access__field">
        <label htmlFor="staff-email">Email</label>
        <div className="staff-access__input-wrap">
          <Mail className="staff-access__input-icon" size={18} aria-hidden="true" />
          <input id="staff-email" ref={emailRef} type="email" autoComplete="username" required
            placeholder="name@restaurant.example" value={email} disabled={busy}
            aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? 'staff-email-error' : undefined}
            onChange={event => { setEmail(event.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); setError(''); }} />
        </div>
        {fieldErrors.email && <p className="staff-access__field-error" id="staff-email-error">{fieldErrors.email}</p>}
      </div>
      <div className="staff-access__field">
        <label htmlFor="staff-password">Password</label>
        <div className="staff-access__input-wrap">
          <LockKeyhole className="staff-access__input-icon" size={18} aria-hidden="true" />
          <input id="staff-password" ref={passwordRef} type={showPassword ? 'text' : 'password'} autoComplete="current-password"
            required minLength={6} maxLength={50} placeholder="Your password" value={password} disabled={busy}
            aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? 'staff-password-error' : undefined}
            onChange={event => { setPassword(event.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); setError(''); }} />
          <button className="staff-access__password-toggle" type="button" disabled={busy}
            aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
            onClick={() => setShowPassword(value => !value)}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        {fieldErrors.password && <p className="staff-access__field-error" id="staff-password-error">{fieldErrors.password}</p>}
      </div>
      <div className="staff-access__options">
        <label className="staff-access__remember"><input type="checkbox" checked={rememberMe} disabled={busy}
          onChange={event => setRememberMe(event.target.checked)} />Remember me</label>
        <button className="staff-access__text-button" type="button" disabled={busy}
          aria-expanded={showRecovery} aria-controls="staff-recovery" onClick={() => setShowRecovery(value => !value)}>Forgot password?</button>
      </div>
      {error && <div className="staff-access__notice" role="alert"><AlertCircle size={20} aria-hidden="true" /><p>{error}</p></div>}
      <button className="staff-access__submit" type="submit" disabled={busy}><span>{busy ? 'Signing in…' : 'Sign in'}</span></button>
    </form>
    {showRecovery && <div id="staff-recovery" className="staff-access__recovery" role="status">
      Password recovery is not available here. Please contact your manager for help accessing your account.
    </div>}
  </StaffAccessLayout>;
}
