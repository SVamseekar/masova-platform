import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { CircleCheck, Eye, EyeOff } from 'lucide-react';
import { useRegisterMutation, useGoogleRegisterMutation } from '../../store/api/authApi';
import { getApiErrorMessage } from '../utils/apiError';
import { useCreateCustomerMutation } from '../../store/api/customerApi';
import { useAppSelector } from '../../store/hooks';
import { getSavedReturnUrl, clearReturnUrl, isValidReturnUrl } from '../../utils/security';
import { selectStoreCountryCode } from '../../store/slices/cartSlice';
import { isValidCustomerPhone, phoneErrorMessage, normalizePhoneForApi } from '../../utils/customerFormValidation';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import './CustomerAuth.css';

const DIAL_CODES: [string, string, string][] = [
  ['DE', '+49', 'Germany'], ['GB', '+44', 'United Kingdom'], ['NL', '+31', 'Netherlands'], ['FR', '+33', 'France'], ['IT', '+39', 'Italy'],
  ['ES', '+34', 'Spain'], ['AT', '+43', 'Austria'], ['BE', '+32', 'Belgium'], ['IE', '+353', 'Ireland'], ['HU', '+36', 'Hungary'], ['IN', '+91', 'India'],
];
const BENEFITS = ['Faster checkout', 'Save your favourite dishes', 'Track your orders', 'Exclusive offers'];
const STRENGTH = ['', 'Weak', 'Fair', 'Good'];

/** 0 none, 1 weak, 2 meets the rule, 3 longer or more varied. */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  const meetsRule = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  if (!meetsRule) return 1;
  return password.length >= 12 || /[^A-Za-z0-9]/.test(password) ? 3 : 2;
}

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'consent', string>>;

/** Board 07 panel 2. */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateFrom = (location.state as { from?: string } | null)?.from;
  // Same destination rules as sign-in: a saved return address first, then the page that sent the visitor here.
  const goNext = () => {
    const saved = getSavedReturnUrl();
    if (saved) clearReturnUrl();
    navigate(saved || (stateFrom && isValidReturnUrl(stateFrom) ? stateFrom : '/order'), { replace: true });
  };
  const storeCountryCode = useAppSelector(selectStoreCountryCode);
  const [register, { isLoading }] = useRegisterMutation();
  const [googleRegister, { isLoading: isGoogleLoading }] = useGoogleRegisterMutation();
  const [createCustomer] = useCreateCustomerMutation();
  const googleConfigured = !!import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [dialCode, setDialCode] = useState(() => DIAL_CODES.find(([country]) => country === storeCountryCode)?.[1] || (storeCountryCode ? '+49' : '+91'));
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const strength = passwordStrength(form.password);
  const fullPhone = `${dialCode}${form.phone.replace(/^0+/, '').replace(/[^\d]/g, '')}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setError('');
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Please enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Enter your phone number.';
    else if (!isValidCustomerPhone(fullPhone)) next.phone = phoneErrorMessage(storeCountryCode);
    if (strength < 2) next.password = 'Use at least 8 characters with a number and a letter.';
    if (!consent) next.consent = 'Agree to the Terms of Service and Privacy Policy to create an account.';
    setErrors(next);
    const first = (['name', 'email', 'phone', 'password', 'consent'] as const).find(key => next[key]);
    if (first) document.getElementById('register-' + first)?.focus();
    return !first;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    try {
      const cleanPhone = normalizePhoneForApi(fullPhone);
      const result = await register({ name: form.name.trim(), email: form.email.trim(), phone: cleanPhone, password: form.password, type: 'CUSTOMER', rememberMe: true }).unwrap();
      try {
        await createCustomer({ userId: result.user.id, name: result.user.name, email: result.user.email, phone: cleanPhone, marketingOptIn: false, smsOptIn: false }).unwrap();
      } catch (profileError) {
        // The account exists; the customer profile is created again on first checkout.
        console.error('Customer profile was not created at registration', profileError);
      }
      goNext();
    } catch (err: unknown) {
      let message = getApiErrorMessage(err, 'Your account was not created. Try again.');
      if (message.toLowerCase().includes('email already exists')) message = 'This email is already registered. Sign in instead.';
      else if (message.toLowerCase().includes('phone') && message.toLowerCase().includes('exists')) message = 'This phone number is already registered.';
      setError(message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google did not return a sign-up credential. Try again.');
      return;
    }
    if (!consent) {
      setErrors(prev => ({ ...prev, consent: 'Agree to the Terms of Service and Privacy Policy to create an account.' }));
      document.getElementById('register-consent')?.focus();
      return;
    }
    try {
      setError('');
      await googleRegister({ idToken: credentialResponse.credential }).unwrap();
      goNext();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Google sign-up failed. Try again.'));
    }
  };

  const invalid = (key: keyof Errors) => ({ 'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': errors[key] ? `register-${key}-error` : undefined } as const);
  const fieldError = (key: keyof Errors) => errors[key] && <span id={`register-${key}-error`} className="cauth-error">{errors[key]}</span>;

  return (
    <BrowseShell>
      <div className="cregister">
        <section className="cregister-art" aria-label="Why create an account">
          <img src="/images/brand/auth-register-v1.jpg" alt="" />
          <h1>Join MaSoVa</h1>
          <p>Create an account for faster ordering, save your favourites and track orders.</p>
          <ul>{BENEFITS.map(benefit => <li key={benefit}><CircleCheck size={20} aria-hidden="true" />{benefit}</li>)}</ul>
        </section>
        <main className="cregister-main">
          <div className="cregister-card">
            <h2>Create your account</h2>
            {error && <p className="cauth-alert" role="alert">{error}</p>}
            <form className="cauth-form" onSubmit={handleSubmit} noValidate>
              <div className="cauth-field">
                <label htmlFor="register-name">Full name</label>
                <input id="register-name" type="text" name="name" autoComplete="name" placeholder="Alex Carter" value={form.name} onChange={handleChange} disabled={isLoading} {...invalid('name')} />
                {fieldError('name')}
              </div>
              <div className="cauth-field">
                <label htmlFor="register-email">Email</label>
                <input id="register-email" type="email" name="email" autoComplete="email" placeholder="alex@example.com" value={form.email} onChange={handleChange} disabled={isLoading} {...invalid('email')} />
                {fieldError('email')}
              </div>
              <div className="cauth-field">
                <label htmlFor="register-phone">Phone number</label>
                <div className="cregister-phone">
                  <select aria-label="Country calling code" value={dialCode} onChange={event => setDialCode(event.target.value)} disabled={isLoading} autoComplete="tel-country-code">
                    {DIAL_CODES.map(([country, code, name]) => <option key={country} value={code} title={name}>{country} {code}</option>)}
                  </select>
                  <input id="register-phone" type="tel" name="phone" autoComplete="tel-national" placeholder="151 23456789" value={form.phone} onChange={handleChange} disabled={isLoading} {...invalid('phone')} />
                </div>
                {fieldError('phone')}
              </div>
              <div className="cauth-field">
                <label htmlFor="register-password">Password</label>
                <div className="cauth-password">
                  <input id="register-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" value={form.password} onChange={handleChange} disabled={isLoading}
                    aria-invalid={errors.password ? true : undefined} aria-describedby="register-password-hint" />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
                <span id="register-password-hint" className={errors.password ? 'cauth-error' : 'cauth-hint'}>Use at least 8 characters with a number and a letter.</span>
                <div className="cregister-meter" data-level={strength} role="status">
                  {[1, 2, 3].map(bar => <i key={bar} data-on={strength >= bar} aria-hidden="true" />)}
                  {strength > 0 && <span>{STRENGTH[strength]}<span className="sr-only"> password strength</span></span>}
                </div>
              </div>
              <div>
                <label className="cauth-check">
                  <input id="register-consent" type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setErrors(prev => ({ ...prev, consent: undefined })); }} {...invalid('consent')} />
                  <span>I agree to the <Link to="/terms" target="_blank" rel="noopener">Terms of Service</Link> and <Link to="/privacy" target="_blank" rel="noopener">Privacy Policy</Link></span>
                </label>
                {fieldError('consent')}
              </div>
              <button type="submit" className="cauth-submit" disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create account'}</button>
              {googleConfigured && <>
                <div className="cauth-or">or</div>
                <div className="cauth-google" style={{ opacity: isGoogleLoading ? 0.6 : 1 }}>
                  <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-up was cancelled or failed.')} text="signup_with" shape="rectangular" theme="outline" size="large" width="340" />
                </div>
              </>}
              <p className="cauth-alt">Already have an account? <Link to="/customer-login" state={{ from: stateFrom }}>Sign in</Link></p>
            </form>
          </div>
        </main>
      </div>
    </BrowseShell>
  );
};

export default RegisterPage;
