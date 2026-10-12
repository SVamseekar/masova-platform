import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ChefHat, Eye, EyeOff, Leaf, Truck } from 'lucide-react';
import { useLoginMutation, useGoogleLoginMutation } from '../../store/api/authApi';
import { getApiErrorMessage } from '../utils/apiError';
import { useAppSelector } from '../../store/hooks';
import { getSavedReturnUrl, clearReturnUrl, isValidReturnUrl } from '../../utils/security';
import MaSoVaBrand from '../../components/common/MaSoVaBrand';
import { revampCssVariables } from '../../styles/design-tokens';
import './CustomerAuth.css';

const POINTS = [
  { icon: Leaf, lines: ['Fresh ingredients', 'every day'] },
  { icon: ChefHat, lines: ['Authentic flavours', 'Indian and European'] },
  { icon: Truck, lines: ['Fast and reliable', 'delivery or collection'] },
];

/** Board 07 panel 1. Email and password, plus Google sign-in where it is configured. */
const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const locationState = location.state as { from?: string; email?: string; message?: string } | null;
  const prefillEmail = locationState?.email || '';
  const successMessage = locationState?.message || '';
  const from = locationState?.from && isValidReturnUrl(locationState.from) ? locationState.from : undefined;
  const googleConfigured = !!import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

  const [formData, setFormData] = useState({ email: prefillEmail, password: '' });

  useEffect(() => {
    if (isAuthenticated && user) {
      const returnUrl = getSavedReturnUrl();
      if (returnUrl) { clearReturnUrl(); navigate(returnUrl, { replace: true }); return; }
      navigate(from || '/order', { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) next.email = 'Enter a valid email address.';
    if (!formData.password) next.password = 'Enter your password.';
    setFieldErrors(next);
    if (next.email || next.password) {
      document.getElementById(next.email ? 'login-email' : 'login-password')?.focus();
      return;
    }
    try {
      setError('');
      await login({ email: formData.email.trim(), password: formData.password, rememberMe: false }).unwrap();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Sign in failed. Check your email and password.'));
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google did not return a sign-in credential. Try again.');
      return;
    }
    try {
      setError('');
      await googleLogin({ idToken: credentialResponse.credential }).unwrap();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Google sign-in failed. Try again.'));
    }
  };

  return (
    <div className="cauth" style={revampCssVariables}>
      <section className="cauth-art" aria-label="MaSoVa">
        <img src="/images/brand/auth-sign-in-v1.jpg" alt="" />
        <Link to="/order" aria-label="MaSoVa ordering home"><MaSoVaBrand /></Link>
        <h1>Great food brings people together</h1>
        <p>Authentic Indian and European dishes from your local MaSoVa kitchen.</p>
        <ul className="cauth-points">
          {POINTS.map(({ icon: Icon, lines }) => (
            <li key={lines[0]}><Icon size={26} strokeWidth={1.8} aria-hidden="true" /><span>{lines[0]}<br />{lines[1]}</span></li>
          ))}
        </ul>
      </section>

      <main className="cauth-main">
        <div className="cauth-card">
          <h2>Welcome back</h2>
          <p>Sign in to your MaSoVa account</p>

          {successMessage && <p className="cauth-note" role="status">{successMessage}</p>}
          {error && <p className="cauth-alert" role="alert">{error}</p>}

          <form className="cauth-form" onSubmit={handleSubmit} noValidate>
            <div className="cauth-field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" name="email" autoComplete="email" placeholder="alex@example.com" value={formData.email} onChange={handleInputChange} disabled={isLoading}
                aria-invalid={fieldErrors.email ? true : undefined} aria-describedby={fieldErrors.email ? 'login-email-error' : undefined} />
              {fieldErrors.email && <span id="login-email-error" className="cauth-error">{fieldErrors.email}</span>}
            </div>
            <div className="cauth-field">
              <label htmlFor="login-password">Password</label>
              <div className="cauth-password">
                <input id="login-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={formData.password} onChange={handleInputChange} disabled={isLoading}
                  aria-invalid={fieldErrors.password ? true : undefined} aria-describedby={fieldErrors.password ? 'login-password-error' : undefined} />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && <span id="login-password-error" className="cauth-error">{fieldErrors.password}</span>}
            </div>
            <label className="cauth-check">
              <input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />
              <span>Show password</span>
            </label>
            <button type="submit" className="cauth-submit" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in'}</button>

            {googleConfigured && <>
              <div className="cauth-or">or</div>
              <div className="cauth-google" style={{ opacity: isGoogleLoading ? 0.6 : 1 }}>
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-in was cancelled or failed.')} text="continue_with" shape="rectangular" theme="outline" size="large" width="340" />
              </div>
            </>}

            <p className="cauth-alt">New to MaSoVa? <Link to="/register" state={{ from: from || '/order' }}>Create an account</Link></p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CustomerLoginPage;
