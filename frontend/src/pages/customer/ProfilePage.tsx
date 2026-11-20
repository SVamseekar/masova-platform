import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, useMediaQuery } from '@mui/material';
import { Bell, Building2, CircleAlert, CircleCheck, ClipboardList, Flame, Home, Leaf, Mail, MapPin, MessageSquare, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectStoreCountryCode } from '../../store/slices/cartSlice';
import {
  useGetCustomerByUserIdQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useAddAddressMutation, useUpdateAddressMutation,
  useRemoveAddressMutation, useSetDefaultAddressMutation, useUpdatePreferencesMutation,
  type AddAddressRequest, type Customer, type CustomerAddress,
} from '../../store/api/customerApi';
import { useGetUserPreferencesQuery, useUpdateUserPreferencesMutation } from '../../store/api/notificationApi';
import { isValidCustomerPhone, normalizePhoneForApi, defaultAddressCountry, phoneErrorMessage, postalFieldLabel, postalPlaceholder } from '../../utils/customerFormValidation';
import { ALLERGEN_LABELS, ALL_ALLERGENS, type AllergenType } from '../../constants/allergens';
import { revampCssVariables } from '../../styles/design-tokens';
import { getApiErrorMessage } from '../utils/apiError';
import AccountLayout from './AccountLayout';
import './Tracking.css';

type Notice = { tone: 'success' | 'error'; text: string } | null;
const NoticeLine = ({ notice }: { notice: Notice }) => notice && <p className="account-notice" data-tone={notice.tone} role={notice.tone === 'error' ? 'alert' : 'status'}>{notice.tone === 'success' ? <CircleCheck size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}{notice.text}</p>;

const ADDRESS_LABELS: Record<string, string> = { HOME: 'Home', WORK: 'Office', OTHER: 'Other' };
const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
};

function ProfileDetails({ customer }: { customer: Customer }) {
  const storeCountryCode = useAppSelector(selectStoreCountryCode);
  const [updateCustomer, update] = useUpdateCustomerMutation();
  const [form, setForm] = useState(() => ({ ...splitName(customer.name), email: customer.email, phone: customer.phone }));
  const [errors, setErrors] = useState<{ first?: string; email?: string; phone?: string }>({});
  const [notice, setNotice] = useState<Notice>(null);
  const change = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: event.target.value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
    setNotice(null);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!form.first.trim()) next.first = 'Enter your first name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    // The server stores international numbers only.
    if (!isValidCustomerPhone(form.phone)) next.phone = phoneErrorMessage(storeCountryCode);
    else if (!/^\+?[1-9]\d{6,14}$/.test(normalizePhoneForApi(form.phone))) next.phone = 'Enter your number with its country code, for example +49 151 23456789.';
    setErrors(next);
    const firstError = (['first', 'email', 'phone'] as const).find(key => next[key]);
    if (firstError) { document.getElementById(`profile-${firstError}`)?.focus(); return; }
    try {
      await updateCustomer({ id: customer.id, data: { name: [form.first.trim(), form.last.trim()].filter(Boolean).join(' '), email: form.email.trim(), phone: normalizePhoneForApi(form.phone) } }).unwrap();
      setNotice({ tone: 'success', text: 'Your profile was saved.' });
    } catch (error) {
      console.error('Profile was not saved', error);
      setNotice({ tone: 'error', text: getApiErrorMessage(error, 'Your profile was not saved. Try again.') });
    }
  };
  const field = (key: 'first' | 'last' | 'email' | 'phone', label: string, type = 'text', autoComplete?: string) => {
    const error = key === 'last' ? undefined : errors[key];
    return <div className="account-field">
      <label htmlFor={`profile-${key}`}>{label}</label>
      <input id={`profile-${key}`} type={type} autoComplete={autoComplete} value={form[key]} onChange={change(key)} aria-invalid={error ? true : undefined} aria-describedby={error ? `profile-${key}-error` : undefined} />
      {error && <span id={`profile-${key}-error`} className="account-field-error">{error}</span>}
    </div>;
  };
  return <section className="account-card" aria-labelledby="profile-details">
    <h2 id="profile-details" className="account-section-title">Profile details</h2>
    <form className="account-form" onSubmit={save} noValidate>
      {field('first', 'First name', 'text', 'given-name')}
      {field('last', 'Last name', 'text', 'family-name')}
      {field('email', 'Email address', 'email', 'email')}
      {field('phone', 'Phone number', 'tel', 'tel')}
      <div className="account-form-actions"><NoticeLine notice={notice} /><button type="submit" className="browse-primary" disabled={update.isLoading}>{update.isLoading ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  </section>;
}

function Addresses({ customer }: { customer: Customer }) {
  const storeCountryCode = useAppSelector(selectStoreCountryCode);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const blank = (): AddAddressRequest => ({ label: 'HOME', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: defaultAddressCountry(storeCountryCode) });
  const [addAddress, adding] = useAddAddressMutation();
  const [updateAddress, updating] = useUpdateAddressMutation();
  const [removeAddress] = useRemoveAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();
  const [editing, setEditing] = useState<{ id: string | null; form: AddAddressRequest } | null>(null);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const addresses = customer.addresses ?? [];
  const isDefault = (address: CustomerAddress) => address.isDefault || address.id === customer.defaultAddressId;

  const run = async (action: () => Promise<unknown>, done: string, failed: string) => {
    try {
      await action();
      setNotice({ tone: 'success', text: done });
    } catch (error) {
      console.error(failed, error);
      setNotice({ tone: 'error', text: getApiErrorMessage(error, failed) });
    }
  };
  const set = (key: keyof AddAddressRequest) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditing(prev => prev && { ...prev, form: { ...prev.form, [key]: event.target.value } });
    setFormError('');
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const data = editing.form;
    if (!data.addressLine1.trim() || !data.city.trim() || !data.state.trim() || !data.postalCode.trim()) { setFormError('Enter the street, postal code, city and region.'); return; }
    try {
      if (editing.id) await updateAddress({ customerId: customer.id, addressId: editing.id, data }).unwrap();
      else await addAddress({ customerId: customer.id, data }).unwrap();
      setEditing(null);
      setNotice({ tone: 'success', text: 'Your address was saved.' });
    } catch (error) {
      console.error('Address was not saved', error);
      setFormError(getApiErrorMessage(error, 'Your address was not saved. Try again.'));
    }
  };

  return <section aria-labelledby="profile-addresses">
    <div className="account-section-head">
      <h2 id="profile-addresses" className="account-section-title">Delivery addresses</h2>
      <button type="button" className="browse-primary" onClick={() => { setEditing({ id: null, form: blank() }); setFormError(''); }}><Plus size={18} aria-hidden="true" />Add address</button>
    </div>
    <NoticeLine notice={notice} />
    {addresses.length === 0
      ? <p className="account-card account-muted">You have no saved addresses. Add one to check out faster.</p>
      : <ul className="account-addresses">{addresses.map(address => {
        const label = ADDRESS_LABELS[address.label] ?? address.label;
        return <li key={address.id} className="account-card">
          <div className="account-address-top">
            {isDefault(address) ? <span className="track-chip" data-tone="success">Default</span> : <span />}
            <button type="button" className="account-link" aria-label={`Edit ${label} address`} onClick={() => { setEditing({ id: address.id, form: { label: address.label, addressLine1: address.addressLine1, addressLine2: address.addressLine2 ?? '', city: address.city, state: address.state, postalCode: address.postalCode, country: address.country, landmark: address.landmark, latitude: address.latitude, longitude: address.longitude } }); setFormError(''); }}><Pencil size={16} aria-hidden="true" />Edit</button>
            {confirmDelete === address.id
              ? <button type="button" className="account-link" data-tone="error" onClick={() => { setConfirmDelete(null); void run(() => removeAddress({ customerId: customer.id, addressId: address.id }).unwrap(), 'The address was deleted.', 'The address was not deleted. Try again.'); }}><Trash2 size={16} aria-hidden="true" />Confirm delete</button>
              : <button type="button" className="account-link" data-tone="error" aria-label={`Delete ${label} address`} onClick={() => setConfirmDelete(address.id)}><Trash2 size={16} aria-hidden="true" />Delete</button>}
          </div>
          <div className="account-address-body">
            <span className="account-address-mark">{address.label === 'WORK' ? <Building2 size={22} aria-hidden="true" /> : address.label === 'HOME' ? <Home size={22} aria-hidden="true" /> : <MapPin size={22} aria-hidden="true" />}</span>
            <p><strong>{label}</strong>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />{address.postalCode} {address.city}<br />{address.country}</p>
          </div>
          {!isDefault(address) && <button type="button" className="account-secondary" onClick={() => void run(() => setDefaultAddress({ customerId: customer.id, addressId: address.id }).unwrap(), 'Your default address was changed.', 'The default address was not changed. Try again.')}>Set as default</button>}
        </li>;
      })}</ul>}

    <Dialog open={!!editing} onClose={() => setEditing(null)} transitionDuration={reducedMotion ? 0 : 180} aria-labelledby="address-dialog-title" slotProps={{ paper: { className: 'customer-browse-dialog', style: revampCssVariables } }}>
      {editing && <form className="browse-dialog-content account-form account-form-dialog" onSubmit={submit} noValidate>
        <h2 id="address-dialog-title">{editing.id ? 'Edit address' : 'Add address'}</h2>
        <label htmlFor="address-label">Address type<select id="address-label" value={editing.form.label} onChange={set('label')}>{Object.entries(ADDRESS_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
        <label htmlFor="address-line1">Street and house number<input id="address-line1" autoComplete="address-line1" value={editing.form.addressLine1} onChange={set('addressLine1')} /></label>
        <label htmlFor="address-line2">Apartment, floor (optional)<input id="address-line2" autoComplete="address-line2" value={editing.form.addressLine2 ?? ''} onChange={set('addressLine2')} /></label>
        <label htmlFor="address-postal">{postalFieldLabel(storeCountryCode)}<input id="address-postal" autoComplete="postal-code" placeholder={postalPlaceholder(storeCountryCode)} value={editing.form.postalCode} onChange={set('postalCode')} /></label>
        <label htmlFor="address-city">City<input id="address-city" autoComplete="address-level2" value={editing.form.city} onChange={set('city')} /></label>
        <label htmlFor="address-state">State or region<input id="address-state" autoComplete="address-level1" value={editing.form.state} onChange={set('state')} /></label>
        <label htmlFor="address-country">Country<input id="address-country" autoComplete="country-name" value={editing.form.country} onChange={set('country')} /></label>
        {formError && <p role="alert" className="account-notice" data-tone="error"><CircleAlert size={18} aria-hidden="true" />{formError}</p>}
        <div className="browse-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="browse-primary" disabled={adding.isLoading || updating.isLoading}>{adding.isLoading || updating.isLoading ? 'Saving…' : 'Save address'}</button></div>
      </form>}
    </Dialog>
  </section>;
}

const DIETS = [{ value: 'Vegetarian', icon: Leaf }, { value: 'Vegan', icon: Leaf }, { value: 'Halal', icon: CircleCheck }];
const SPICE = [{ value: 'MILD', label: 'Mild' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HOT', label: 'Hot' }];
const ALLERGENS_SHOWN = 5;

function Toggle({ id, icon: Icon, label, note, checked, onChange }: { id: string; icon: typeof Mail; label: string; note: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <li>
    <Icon size={20} aria-hidden="true" />
    <label htmlFor={id}>{label}</label>
    <span id={`${id}-note`} className="account-muted">{note}</span>
    <input id={id} type="checkbox" role="switch" className="account-switch" checked={checked} aria-describedby={`${id}-note`} onChange={event => onChange(event.target.checked)} />
  </li>;
}

function Preferences({ customer, userId, focusNotifications }: { customer: Customer; userId: string; focusNotifications: boolean }) {
  const channels = useGetUserPreferencesQuery(userId, { skip: !userId });
  const [updatePreferences, savingFood] = useUpdatePreferencesMutation();
  const [updateChannels, savingChannels] = useUpdateUserPreferencesMutation();
  const [food, setFood] = useState(() => ({
    dietaryRestrictions: customer.preferences?.dietaryRestrictions ?? [],
    spiceLevel: customer.preferences?.spiceLevel || 'MEDIUM',
    allergenAlerts: customer.preferences?.allergenAlerts ?? [],
    notifyOnOrderStatus: customer.preferences?.notifyOnOrderStatus !== false,
  }));
  const [edited, setEdited] = useState<Partial<Record<'emailEnabled' | 'smsEnabled' | 'pushEnabled' | 'promotionalEnabled', boolean>>>({});
  const [allAllergens, setAllAllergens] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  useEffect(() => {
    if (focusNotifications) document.getElementById('notifications')?.scrollIntoView?.({ block: 'start' });
  }, [focusNotifications]);
  const channel = (key: keyof typeof edited) => edited[key] ?? channels.data?.[key] ?? false;
  const touch = () => setNotice(null);
  const toggle = <T extends string>(list: T[], value: T) => list.includes(value) ? list.filter(item => item !== value) : [...list, value];
  const shownAllergens = allAllergens ? ALL_ALLERGENS : ALL_ALLERGENS.slice(0, ALLERGENS_SHOWN);

  const save = async () => {
    const loaded = channels.data;
    try {
      // The offers flag follows the channel switch, so it is only written when that switch was loaded.
      await updatePreferences({ customerId: customer.id, data: { ...food, ...(loaded ? { notifyOnOffers: channel('promotionalEnabled') } : {}) } }).unwrap();
    } catch (error) {
      console.error('Preferences were not saved', error);
      setNotice({ tone: 'error', text: getApiErrorMessage(error, 'Your preferences were not saved. Try again.') });
      return;
    }
    if (!loaded) {
      setNotice({ tone: 'error', text: 'Your food preferences and order updates were saved. Channel settings could not be loaded, so they were not changed.' });
      return;
    }
    try {
      // The server replaces the whole record, so every loaded field is sent back with the edits.
      await updateChannels({ userId, preferences: { ...loaded, emailEnabled: channel('emailEnabled'), smsEnabled: channel('smsEnabled'), pushEnabled: channel('pushEnabled'), promotionalEnabled: channel('promotionalEnabled') } }).unwrap();
      setNotice({ tone: 'success', text: 'Your preferences were saved.' });
    } catch (error) {
      console.error('Notification channels were not saved', error);
      setNotice({ tone: 'error', text: 'Your food preferences were saved, but your notification channels were not. Try again.' });
    }
  };

  return <>
    <section className="account-card" aria-labelledby="food-preferences">
      <h2 id="food-preferences" className="account-section-title">Food preferences</h2>
      <div className="account-pref-row" role="group" aria-labelledby="pref-diet">
        <span id="pref-diet">Dietary choices</span>
        <div>
          {DIETS.map(({ value, icon: Icon }) => <button type="button" key={value} className="account-choice" aria-pressed={food.dietaryRestrictions.includes(value)} onClick={() => { setFood(prev => ({ ...prev, dietaryRestrictions: toggle(prev.dietaryRestrictions, value) })); touch(); }}><Icon size={16} aria-hidden="true" />{value}</button>)}
          <button type="button" className="account-choice" aria-pressed={food.dietaryRestrictions.length === 0} onClick={() => { setFood(prev => ({ ...prev, dietaryRestrictions: [] })); touch(); }}>None</button>
        </div>
      </div>
      <div className="account-pref-row" role="radiogroup" aria-labelledby="pref-spice">
        <span id="pref-spice">Spice preference</span>
        <div>{SPICE.map(({ value, label }) => <label key={value} className="account-choice"><input type="radio" name="pref-spice" className="sr-only" value={value} checked={food.spiceLevel === value} onChange={() => { setFood(prev => ({ ...prev, spiceLevel: value })); touch(); }} /><Flame size={16} aria-hidden="true" />{label}</label>)}</div>
      </div>
      <div className="account-pref-row" role="group" aria-labelledby="pref-allergens">
        <span id="pref-allergens">Allergen avoidance<small>(we'll show suitable dishes)</small></span>
        <div>
          {shownAllergens.map((value: AllergenType) => <button type="button" key={value} className="account-choice" aria-pressed={food.allergenAlerts.includes(value)} onClick={() => { setFood(prev => ({ ...prev, allergenAlerts: toggle(prev.allergenAlerts, value) })); touch(); }}>{ALLERGEN_LABELS[value]}</button>)}
          <button type="button" className="account-choice" aria-expanded={allAllergens} onClick={() => setAllAllergens(value => !value)}>{allAllergens ? 'Show fewer' : `+${ALL_ALLERGENS.length - ALLERGENS_SHOWN} more`}</button>
        </div>
      </div>
    </section>

    <section className="account-card" aria-labelledby="notification-preferences" id="notifications">
      <h2 id="notification-preferences" className="account-section-title">Notifications</h2>
      {channels.isError && <p role="alert" className="account-notice" data-tone="error"><CircleAlert size={18} aria-hidden="true" />Your channel settings could not be loaded. <button type="button" className="account-link" onClick={() => channels.refetch()}>Try again</button></p>}
      <ul className="account-toggles">
        {channels.data && <>
          <Toggle id="notify-email" icon={Mail} label="Email notifications" note="Order updates, account activity and offers" checked={channel('emailEnabled')} onChange={value => { setEdited(prev => ({ ...prev, emailEnabled: value })); touch(); }} />
          <Toggle id="notify-sms" icon={MessageSquare} label="SMS notifications" note="Urgent order updates (e.g. delivery)" checked={channel('smsEnabled')} onChange={value => { setEdited(prev => ({ ...prev, smsEnabled: value })); touch(); }} />
          <Toggle id="notify-push" icon={Bell} label="Push notifications" note="Order status and special offers" checked={channel('pushEnabled')} onChange={value => { setEdited(prev => ({ ...prev, pushEnabled: value })); touch(); }} />
        </>}
        <Toggle id="notify-orders" icon={ClipboardList} label="Order updates" note="Received, preparing, out for delivery and more" checked={food.notifyOnOrderStatus} onChange={value => { setFood(prev => ({ ...prev, notifyOnOrderStatus: value })); touch(); }} />
        {channels.data && <Toggle id="notify-offers" icon={Tag} label="Promotions and offers" note="New dishes, exclusive deals and events" checked={channel('promotionalEnabled')} onChange={value => { setEdited(prev => ({ ...prev, promotionalEnabled: value })); touch(); }} />}
      </ul>
      <div className="account-form-actions"><NoticeLine notice={notice} /><button type="button" className="browse-primary" disabled={savingFood.isLoading || savingChannels.isLoading} onClick={save}>{savingFood.isLoading || savingChannels.isLoading ? 'Saving…' : 'Save preferences'}</button></div>
    </section>
  </>;
}

/** Board 08 panels 1 and 2. */
const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = useAppSelector(selectCurrentUser);
  const customer = useGetCustomerByUserIdQuery(user?.id || '', { skip: !user?.id });
  const [createCustomer, creating] = useCreateCustomerMutation();
  const [createError, setCreateError] = useState('');
  const section = searchParams.get('section');
  const preferences = section === 'preferences' || section === 'notifications';

  if (customer.isLoading) return <AccountLayout><p role="status">Loading your profile…</p></AccountLayout>;
  if (!customer.data) {
    const missing = (customer.error as { status?: number | string } | undefined)?.status === 404;
    const create = async () => {
      if (!user) return;
      setCreateError('');
      try {
        await createCustomer({ userId: user.id, name: user.name, email: user.email, phone: normalizePhoneForApi(user.phone || ''), marketingOptIn: false, smsOptIn: false }).unwrap();
      } catch (error) {
        console.error('Customer profile was not created', error);
        setCreateError(getApiErrorMessage(error, 'Your profile was not created. Try again.'));
      }
    };
    return <AccountLayout><div className="track-state" role="alert"><CircleAlert size={36} aria-hidden="true" />
      <h1>{missing ? 'Finish setting up your profile' : 'Your profile could not be loaded'}</h1>
      <p>{missing ? 'Your account has no customer profile yet. Create it to save addresses and preferences.' : 'Check your connection and try again.'}</p>
      {createError && <p>{createError}</p>}
      {missing ? <button type="button" className="browse-primary" disabled={creating.isLoading} onClick={create}>{creating.isLoading ? 'Creating…' : 'Create profile'}</button> : <button type="button" className="browse-primary" onClick={() => customer.refetch()}>Try again</button>}
    </div></AccountLayout>;
  }

  return <AccountLayout>
    <h1 className="sr-only">{preferences ? 'Preferences and notifications' : 'Profile and addresses'}</h1>
    {preferences
      ? <Preferences key={customer.data.id} customer={customer.data} userId={user?.id || ''} focusNotifications={section === 'notifications'} />
      : <><ProfileDetails key={customer.data.id} customer={customer.data} /><Addresses customer={customer.data} /></>}
  </AccountLayout>;
};

export default ProfilePage;
