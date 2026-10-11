import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Dialog, useMediaQuery } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Truck } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import AddressAutocomplete from '../../components/common/AddressAutocomplete';
import { useAppSelector } from '../../store/hooks';
import { useAddAddressMutation, useGetCustomerByUserIdQuery, useRemoveAddressMutation, useSetDefaultAddressMutation, type Customer } from '../../store/api/customerApi';
import { getDefaultDashboard } from '../../utils/security';
import { defaultAddressCountry, extractPostalFromAddressParts, isValidCustomerPhone, isValidCustomerPostal, normalizePhoneForApi, phoneErrorMessage, postalErrorMessage, postalFieldLabel, postalPlaceholder } from '../../utils/customerFormValidation';
import { revampCssVariables } from '../../styles/design-tokens';
import type { User } from '../../types/user';
import { getApiErrorMessage } from '../utils/apiError';
import CheckoutSummary from './components/CheckoutSummary';
import { useCheckoutStore, type CheckoutGuestInfo, type CheckoutHandoff, type CheckoutOrderType } from './components/checkoutContext';
import './components/Checkout.css';

interface FormData {
  firstName: string; lastName: string; email: string; phone: string;
  addressLine1: string; addressLine2: string; city: string; state: string; zipCode: string;
  specialInstructions: string; addressLabel: string;
}
interface FieldProps {
  label: string; name: keyof FormData; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string; error?: string; disabled?: boolean; placeholder?: string; autoComplete?: string;
}
// Defined outside the form: typing must preserve the input node and focus.
function Field({ label, name, value, onChange, type = 'text', error, disabled, placeholder, autoComplete }: FieldProps) {
  return <div className="checkout-field"><label htmlFor={`checkout-${name}`}>{label}</label><input id={`checkout-${name}`} name={name} type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} aria-describedby={error ? `checkout-${name}-error` : undefined} />{error && <p id={`checkout-${name}-error`} className="checkout-field-error">{error}</p>}</div>;
}

export default function GuestCheckoutPage() {
  const checkout = useCheckoutStore();
  const auth = useAppSelector(state => state.auth);
  const user = auth.isAuthenticated ? auth.user : null;
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.type !== 'CUSTOMER') navigate(getDefaultDashboard(user.type, user.role), { replace: true });
  }, [navigate, user]);
  return <BrowseShell><CheckoutDetails key={`${user?.id || 'guest'}:${checkout.storeId || 'no-store'}`} checkout={checkout} user={user} /></BrowseShell>;
}

function CheckoutDetails({ checkout, user }: { checkout: ReturnType<typeof useCheckoutStore>; user: User | null }) {
  const isCustomer = user?.type === 'CUSTOMER';
  const navigate = useNavigate();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const customerQuery = useGetCustomerByUserIdQuery(user?.id || '', { skip: !isCustomer });
  // Cached data from a previous account is never displayed or used for mutations.
  const currentProfile = isCustomer && customerQuery.currentData?.userId === user.id ? customerQuery.currentData : undefined;
  const [profileUpdate, setProfileUpdate] = useState<{ source: Customer | undefined; result: Customer } | null>(null);
  const profile = profileUpdate && profileUpdate.source === currentProfile ? profileUpdate.result : currentProfile;
  const addresses = profile?.addresses?.filter(address => address?.id && address.addressLine1) || [];
  const [addressChoice, setAddressChoice] = useState<string | null>(null);
  const defaultAddress = addresses.find(address => address.isDefault) || addresses[0];
  const selectedId = addressChoice === null ? defaultAddress?.id || 'new' : addresses.some(address => address.id === addressChoice) ? addressChoice : 'new';
  const savedAddress = addresses.find(address => address.id === selectedId);
  const [orderType, setOrderType] = useState<CheckoutOrderType>('DELIVERY');
  const [saveAddress, setSaveAddress] = useState(true);
  const [formData, setFormData] = useState<FormData>(() => ({ firstName: user?.name.split(' ')[0] || '', lastName: user?.name.split(' ').slice(1).join(' ') || '', email: user?.email || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', specialInstructions: '', addressLabel: 'HOME' }));
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>();
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const alive = useRef(true);
  const locked = useRef(false);
  const requestRef = useRef<{ abort?: () => void } | null>(null);
  const [addAddress] = useAddAddressMutation();
  const [removeAddress] = useRemoveAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; requestRef.current?.abort?.(); };
  }, []);
  const profilePending = isCustomer && (customerQuery.isLoading || customerQuery.isFetching);
  const disabled = !!busy || profilePending;
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
    if (['addressLine1', 'addressLine2', 'city', 'state', 'zipCode'].includes(name)) setCoordinates(undefined);
    setError('');
  };
  const updateProfile = (result: Customer) => {
    if (!currentProfile || result.id !== currentProfile.id || result.userId !== user?.id) throw new Error('Account details could not be confirmed. Reload and try again.');
    setProfileUpdate({ source: currentProfile, result });
  };
  const mutateAddress = async (kind: 'default' | 'delete', addressId: string) => {
    if (locked.current || !currentProfile || !addresses.some(address => address.id === addressId)) return;
    locked.current = true; setBusy(kind); setError('');
    const request = kind === 'default' ? setDefaultAddress({ customerId: currentProfile.id, addressId }) : removeAddress({ customerId: currentProfile.id, addressId });
    requestRef.current = request;
    try {
      const result = await request.unwrap();
      if (!alive.current) return;
      updateProfile(result);
      if (kind === 'delete') { if (selectedId === addressId) setAddressChoice('new'); setDeleteId(null); }
    } catch (failure: unknown) {
      if (alive.current) setError(getApiErrorMessage(failure, kind === 'delete' ? 'Address could not be deleted. Try again.' : 'Default address could not be updated. Try again.'));
    } finally {
      locked.current = false; requestRef.current = null;
      if (alive.current) setBusy(null);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current || !checkout.ready || !checkout.items.length || (user && !isCustomer)) return;
    const invalid: Partial<Record<keyof FormData, string>> = {};
    if (!isCustomer) {
      if (!formData.firstName.trim()) invalid.firstName = 'First name is required';
      if (!formData.lastName.trim()) invalid.lastName = 'Last name is required';
      if (!formData.email.trim()) invalid.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) invalid.email = 'Enter a valid email address';
    }
    if (!formData.phone.trim()) invalid.phone = 'Phone number is required';
    else if (!isValidCustomerPhone(formData.phone)) invalid.phone = phoneErrorMessage(checkout.market.countryCode);
    if (orderType === 'DELIVERY' && !savedAddress) {
      if (!formData.zipCode.trim()) invalid.zipCode = 'Postal code is required';
      else if (!isValidCustomerPostal(formData.zipCode, checkout.market.countryCode)) invalid.zipCode = postalErrorMessage(checkout.market.countryCode);
      if (!formData.city.trim()) invalid.city = 'City is required';
      if (!formData.addressLine1.trim()) invalid.addressLine1 = 'Address line 1 is required';
      if (!formData.state.trim()) invalid.state = 'State / region is required';
    }
    setErrors(invalid); setError('');
    const first = Object.keys(invalid)[0];
    if (first) { formRef.current?.querySelector<HTMLInputElement>(`#checkout-${first}`)?.focus(); return; }
    locked.current = true; setBusy('continue');
    try {
      if (isCustomer && orderType === 'DELIVERY' && !savedAddress && saveAddress) {
        if (!currentProfile) throw new Error('Your address book is unavailable. Retry, or turn off saving to continue with this address.');
        const request = addAddress({ customerId: currentProfile.id, data: { label: formData.addressLabel, addressLine1: formData.addressLine1.trim(), addressLine2: formData.addressLine2.trim() || undefined, city: formData.city.trim(), state: formData.state.trim(), postalCode: formData.zipCode.trim(), country: defaultAddressCountry(checkout.market.countryCode), isDefault: addresses.length === 0, ...coordinates } });
        requestRef.current = request;
        const result = await request.unwrap();
        if (!alive.current) return;
        updateProfile(result);
      }
      if (!alive.current) return;
      const delivery = orderType === 'DELIVERY';
      const guestInfo: CheckoutGuestInfo = { name: isCustomer ? user.name : `${formData.firstName.trim()} ${formData.lastName.trim()}`, email: isCustomer ? user.email || '' : formData.email.trim(), phone: normalizePhoneForApi(formData.phone), street: delivery ? savedAddress ? [savedAddress.addressLine1, savedAddress.addressLine2].filter(Boolean).join(', ') : [formData.addressLine1.trim(), formData.addressLine2.trim()].filter(Boolean).join(', ') : '', city: delivery ? savedAddress?.city || formData.city.trim() : '', state: delivery ? savedAddress?.state || formData.state.trim() : '', pincode: delivery ? savedAddress?.postalCode || formData.zipCode.trim() : '', ...(delivery ? savedAddress ? { latitude: savedAddress.latitude, longitude: savedAddress.longitude } : coordinates : {}), deliveryInstructions: delivery ? formData.specialInstructions.trim() || undefined : undefined };
      const handoff: CheckoutHandoff = { guestInfo, orderType, checkoutStoreId: checkout.storeId!, checkoutUserId: user?.id || null, cartConfiguration: checkout.configuration };
      navigate('/payment', { state: handoff });
    } catch (failure: unknown) {
      if (alive.current) setError(getApiErrorMessage(failure, 'Checkout details could not be saved. Try again.'));
    } finally {
      requestRef.current = null; locked.current = false;
      if (alive.current) setBusy(null);
    }
  };
  const field = (name: keyof FormData, label: string, type = 'text', autoComplete?: string, placeholder?: string) => <Field name={name} label={label} value={formData[name]} onChange={change} type={type} autoComplete={autoComplete} placeholder={placeholder} error={errors[name]} disabled={disabled} />;
  return <main className="checkout-page"><Link to={isCustomer ? '/menu' : '/checkout'}>Back to {isCustomer ? 'menu' : 'checkout'}</Link>
    <div className="checkout-heading"><h1>{orderType === 'DELIVERY' ? 'Delivery details' : 'Pickup details'}</h1><p>{isCustomer ? 'Choose a saved address or enter details for this order.' : 'Enter your contact details to continue as a guest.'}</p></div>
    <div className="checkout-columns"><section className="checkout-form" aria-label="Checkout details">
      {!checkout.items.length && <p role="status">Your cart is empty. <Link to="/menu">Browse menu</Link></p>}
      {checkout.stores.isLoading && <p role="status">Loading store details…</p>}
      {checkout.stores.isError && <div className="checkout-error" role="alert"><p>Store details could not be loaded.</p><button type="button" onClick={() => checkout.stores.refetch()}>Retry store</button></div>}
      {!checkout.ready && !checkout.stores.isLoading && !checkout.stores.isError && <p role="status">Choose an available store before continuing.</p>}
      {error && <div className="checkout-error" role="alert">{error}</div>}
      {profilePending && <p role="status">Loading saved addresses…</p>}
      {isCustomer && customerQuery.isError && <div className="checkout-error" role="alert"><p>Your saved addresses could not be loaded. Retry, or enter a new address without saving it.</p><button type="button" disabled={!!busy} onClick={() => customerQuery.refetch()}>Retry addresses</button></div>}
      <form ref={formRef} onSubmit={submit} noValidate>
        <fieldset disabled={disabled}><legend>Order type</legend><div className="checkout-radio-row"><label className="checkout-choice"><Truck size={24} aria-hidden="true" /><span><strong>Delivery</strong><small>To your address</small></span><input type="radio" name="orderType" value="DELIVERY" checked={orderType === 'DELIVERY'} onChange={() => setOrderType('DELIVERY')} /></label><label className="checkout-choice"><Store size={24} aria-hidden="true" /><span><strong>Pickup</strong><small>Collect at the selected store</small></span><input type="radio" name="orderType" value="TAKEAWAY" checked={orderType === 'TAKEAWAY'} onChange={() => setOrderType('TAKEAWAY')} /></label></div></fieldset>
        <fieldset><legend>Contact details</legend>{!isCustomer && <><div className="checkout-fields">{field('firstName', 'First name', 'text', 'given-name')}{field('lastName', 'Last name', 'text', 'family-name')}</div></>}<div className="checkout-fields">{!isCustomer && field('email', 'Email address', 'email', 'email')}{field('phone', 'Phone number', 'tel', 'tel', 'Include country code if needed')}</div></fieldset>
        {orderType === 'DELIVERY' && <>
          {isCustomer && !!addresses.length && <fieldset disabled={disabled}><legend>Saved addresses</legend>{addresses.map(address => <div key={address.id} className="checkout-address-row"><label className="checkout-choice"><span><strong>{address.label}{address.isDefault ? ' · Default' : ''}</strong><small>{[address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ')}</small></span><input type="radio" name="savedAddress" value={address.id} checked={selectedId === address.id} onChange={() => setAddressChoice(address.id)} /></label><div className="checkout-address-actions">{!address.isDefault && <button type="button" onClick={() => mutateAddress('default', address.id)} aria-label={`Set ${address.label} address as default`}>Set default</button>}<button type="button" onClick={() => setDeleteId(address.id)} aria-label={`Delete ${address.label} address`}>Delete</button></div></div>)}<label className="checkout-choice"><span><strong>Use a new address</strong></span><input type="radio" name="savedAddress" value="new" checked={selectedId === 'new'} onChange={() => setAddressChoice('new')} /></label></fieldset>}
          {!savedAddress && <fieldset><legend>Delivery address</legend><div className="checkout-fields checkout-fields-3"><div className="checkout-field"><label htmlFor="checkout-country">Country</label><input id="checkout-country" value={checkout.market.resolved ? defaultAddressCountry(checkout.market.countryCode) : 'Store country pending'} readOnly /></div>{field('zipCode', postalFieldLabel(checkout.market.countryCode), 'text', 'postal-code', postalPlaceholder(checkout.market.countryCode))}{field('city', 'City', 'text', 'address-level2')}</div>
            <div className="checkout-fields"><div className="checkout-field"><label htmlFor="checkout-addressLine1">Address line 1</label><AddressAutocomplete inputId="checkout-addressLine1" value={formData.addressLine1} initialValue={formData.addressLine1} disabled={disabled} invalid={!!errors.addressLine1} describedBy={errors.addressLine1 ? 'checkout-addressLine1-error' : undefined} onInputChange={value => { setFormData(previous => ({ ...previous, addressLine1: value })); setCoordinates(undefined); setErrors(previous => ({ ...previous, addressLine1: undefined })); }} onSelect={(address, latitude, longitude) => { const parts = address.split(',').map(part => part.trim()); setFormData(previous => ({ ...previous, addressLine1: parts[0] || address, zipCode: previous.zipCode || extractPostalFromAddressParts(parts) })); if (Number.isFinite(latitude) && Number.isFinite(longitude)) setCoordinates({ latitude, longitude }); setErrors(previous => ({ ...previous, addressLine1: undefined })); }} />{errors.addressLine1 && <p id="checkout-addressLine1-error" className="checkout-field-error">{errors.addressLine1}</p>}</div>{field('addressLine2', 'Address line 2 (optional)', 'text', 'address-line2')}</div>
            <div className="checkout-fields">{field('state', 'State / region', 'text', 'address-level1')}{isCustomer && <div className="checkout-field"><label htmlFor="checkout-addressLabel">Address label</label><select id="checkout-addressLabel" name="addressLabel" value={formData.addressLabel} onChange={change} disabled={disabled}><option value="HOME">Home</option><option value="WORK">Work</option><option value="OTHER">Other</option></select></div>}</div>
            {isCustomer && <label className="checkout-checkbox"><input type="checkbox" checked={saveAddress} disabled={disabled} onChange={event => setSaveAddress(event.target.checked)} /><span>Save this address for future orders</span></label>}
          </fieldset>}
          <div className="checkout-field"><label htmlFor="checkout-specialInstructions">Delivery instructions (optional)</label><textarea id="checkout-specialInstructions" name="specialInstructions" value={formData.specialInstructions} onChange={change} disabled={disabled} maxLength={500} rows={3} /></div><p className="checkout-note" role="status">Delivery availability and fees are pending confirmation by the store when your order is created.</p>
        </>}
        <button type="submit" className="browse-primary browse-full" disabled={disabled || !checkout.ready || !checkout.items.length || (!!user && !isCustomer)}>{busy === 'continue' ? 'Saving details…' : 'Continue to payment'}</button>
      </form>
    </section><CheckoutSummary checkout={checkout} orderType={orderType} /></div>
    <Dialog open={!!deleteId} onClose={() => !busy && setDeleteId(null)} transitionDuration={reducedMotion ? 0 : 180} aria-labelledby="checkout-delete-title" slotProps={{ paper: { className: 'customer-browse-dialog checkout-dialog', style: revampCssVariables } }}><div className="browse-dialog-content"><h2 id="checkout-delete-title">Delete saved address?</h2><p>This removes the address from your address book.</p>{error && <p role="alert" className="checkout-field-error">{error}</p>}<div className="checkout-dialog-actions"><button type="button" disabled={!!busy} onClick={() => setDeleteId(null)}>Keep address</button><button type="button" disabled={!!busy} className="browse-primary" onClick={() => deleteId && mutateAddress('delete', deleteId)}>{busy === 'delete' ? 'Deleting…' : 'Delete address'}</button></div></div></Dialog>
  </main>;
}
