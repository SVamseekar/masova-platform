import React, { useState } from 'react';
import { Dialog, useMediaQuery } from '@mui/material';
import { BarChart3, ChevronRight, CircleAlert, CircleCheck, Database, Download, Megaphone, Pencil, Trash2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useCreateGdprRequestMutation, useGetConsentsQuery, useGetGdprRequestsQuery, useLazyExportUserDataQuery, type ConsentType, type GdprRequestKind } from '../../store/api/gdprApi';
import { OPEN_COOKIE_PREFERENCES_EVENT } from '../../components/gdpr/CookieConsent';
import { revampCssVariables } from '../../styles/design-tokens';
import { getApiErrorMessage } from '../utils/apiError';
import AccountLayout from './AccountLayout';
import './Tracking.css';

type Tone = 'success' | 'warning' | 'error' | 'info';
type DialogKind = Extract<GdprRequestKind, 'RECTIFICATION' | 'ERASURE'>;
const REQUEST_LABEL: Record<string, string> = { ACCESS: 'Data access', DATA_PORTABILITY: 'Data export', RECTIFICATION: 'Data rectification', ERASURE: 'Data erasure', RESTRICT_PROCESSING: 'Restrict processing', OBJECT_TO_PROCESSING: 'Objection to processing', WITHDRAW_CONSENT: 'Consent withdrawal', COMPLAINT: 'Complaint' };
const STATUS: Record<string, { label: string; tone: Tone; details: string }> = {
  PENDING: { label: 'Pending', tone: 'warning', details: 'Waiting for review' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning', details: "We're reviewing your request" },
  COMPLETED: { label: 'Completed', tone: 'success', details: 'Request completed' },
  AWAITING_VERIFICATION: { label: 'Awaiting confirmation', tone: 'warning', details: 'Confirm the request to continue' },
  VERIFIED: { label: 'Verified', tone: 'info', details: 'Your identity is confirmed' },
  REJECTED: { label: 'Rejected', tone: 'error', details: 'Contact support for the reason' },
  CANCELLED: { label: 'Cancelled', tone: 'error', details: 'This request was cancelled' },
};
const DIALOG: Record<DialogKind, { title: string; text: string; label: string; submit: string }> = {
  RECTIFICATION: { title: 'Rectify your data', text: 'Tell us which information is inaccurate and what it should be. You can also edit your profile and addresses yourself.', label: 'What should be corrected?', submit: 'Send request' },
  ERASURE: { title: 'Request erasure', text: 'We will delete your personal data, except records the law requires us to keep, such as invoices. Your account will stop working. This cannot be undone once it is completed.', label: 'Reason (optional)', submit: 'Request erasure' },
};
const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Board 08 panel 3. */
const PrivacyPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const userId = user?.id || '';
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const consents = useGetConsentsQuery(userId, { skip: !userId });
  const requests = useGetGdprRequestsQuery(userId, { skip: !userId });
  const [createRequest, creating] = useCreateGdprRequestMutation();
  const [exportData, exporting] = useLazyExportUserDataQuery();
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [reason, setReason] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const granted = (type: ConsentType) => consents.data?.some(consent => consent.consentType === type && consent.status === 'GRANTED') ?? false;
  const rows = [
    { icon: Database, title: 'Essential data (required)', note: 'Needed for orders and account management', state: 'Always on', on: true },
    { icon: BarChart3, title: 'Analytics (optional)', note: 'Helps us improve your experience', state: granted('ANALYTICS_TRACKING') ? 'Enabled' : 'Not enabled', on: granted('ANALYTICS_TRACKING') },
    { icon: Megaphone, title: 'Marketing (optional)', note: 'Special offers and personalised recommendations', state: granted('MARKETING_COMMUNICATIONS') ? 'Enabled' : 'Not enabled', on: granted('MARKETING_COMMUNICATIONS') },
  ];

  const download = async () => {
    setNotice(null);
    try {
      const data = await exportData(userId).unwrap();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `masova-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      if (data.complete === false) {
        console.error('Data export is incomplete', data.errors);
        setNotice({ tone: 'error', text: 'Your export was downloaded, but some data could not be read and is missing from it. Try again later for a complete copy.' });
      } else setNotice({ tone: 'success', text: 'Your data export was downloaded.' });
    } catch (error) {
      console.error('Data export failed', error);
      setNotice({ tone: 'error', text: getApiErrorMessage(error, 'Your data could not be exported. Try again.') });
    }
  };

  const open = (type: DialogKind) => { setDialog(type); setReason(''); setDialogError(''); setNotice(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dialog) return;
    if (dialog === 'RECTIFICATION' && !reason.trim()) { setDialogError('Describe what should be corrected.'); return; }
    try {
      await createRequest({ userId, requestType: dialog, reason: reason.trim() || undefined }).unwrap();
      setDialog(null);
      setNotice({ tone: 'success', text: 'Your request was sent. We answer within 30 days.' });
    } catch (error) {
      console.error('Privacy request was not sent', error);
      setDialogError(getApiErrorMessage(error, 'Your request was not sent. Try again.'));
    }
  };

  const list = [...(requests.data ?? [])].sort((a, b) => new Date(b.requestedAt ?? b.createdAt).getTime() - new Date(a.requestedAt ?? a.createdAt).getTime());

  return <AccountLayout>
    <h1 className="account-title">Your data and privacy</h1>
    <p className="account-lead">We only use your data to provide and improve our services, in line with applicable data protection laws (e.g. GDPR). You can review your consent choices and submit requests for your personal data.</p>
    {notice && <p className="account-notice" data-tone={notice.tone} role={notice.tone === 'error' ? 'alert' : 'status'}>{notice.tone === 'success' ? <CircleCheck size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}{notice.text}</p>}

    <div className="account-columns account-privacy">
      <section className="account-card" aria-labelledby="privacy-consent">
        <div className="account-card-head"><h2 id="privacy-consent">Consent status</h2><button type="button" className="account-link" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}>Change</button></div>
        {consents.isError
          ? <p role="alert">Your consent choices could not be loaded. <button type="button" className="account-link" onClick={() => consents.refetch()}>Try again</button></p>
          : consents.isLoading ? <p role="status">Loading consent choices…</p>
          : <ul className="account-consents">{rows.map(({ icon: Icon, title, note, state, on }) => <li key={title}>
            <Icon size={20} aria-hidden="true" />
            <span><strong>{title}</strong>{note}</span>
            <span className="account-consent-state" data-on={on}>{on && <CircleCheck size={18} aria-hidden="true" />}{state}</span>
          </li>)}</ul>}
      </section>

      <section className="account-card" aria-labelledby="privacy-rights">
        <div className="account-card-head"><h2 id="privacy-rights">Your rights</h2></div>
        <ul className="account-rights">
          <li><button type="button" disabled={exporting.isFetching} onClick={download}><Download size={20} aria-hidden="true" /><span><strong>{exporting.isFetching ? 'Preparing export…' : 'Export your data'}</strong>Get a copy of your personal data</span><ChevronRight size={18} aria-hidden="true" /></button></li>
          <li><button type="button" onClick={() => open('RECTIFICATION')}><Pencil size={20} aria-hidden="true" /><span><strong>Rectify your data</strong>Update inaccurate information</span><ChevronRight size={18} aria-hidden="true" /></button></li>
          <li><button type="button" onClick={() => open('ERASURE')}><Trash2 size={20} aria-hidden="true" /><span><strong>Request erasure</strong>Ask for your data to be deleted</span><ChevronRight size={18} aria-hidden="true" /></button></li>
        </ul>
      </section>
    </div>

    <section className="account-card" aria-labelledby="privacy-requests">
      <div className="account-card-head"><h2 id="privacy-requests">Recent requests</h2></div>
      {requests.isError ? <p role="alert">Your requests could not be loaded. <button type="button" className="account-link" onClick={() => requests.refetch()}>Try again</button></p>
        : requests.isLoading ? <p role="status">Loading requests…</p>
        : list.length === 0 ? <p className="account-muted">You have not made any requests.</p>
        : <table className="account-table">
          <thead><tr><th scope="col">Request type</th><th scope="col">Requested on</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead>
          <tbody>{list.map(request => {
            const status = STATUS[(request.status || '').toUpperCase()] ?? { label: request.status, tone: 'info' as Tone, details: '' };
            return <tr key={request.id}>
              <td>{REQUEST_LABEL[(request.requestType || '').toUpperCase()] ?? request.requestType}</td>
              <td>{date(request.requestedAt ?? request.createdAt)}</td>
              <td><span className="track-chip" data-tone={status.tone}>{status.label}</span></td>
              <td>{request.completedAt ? `Completed on ${date(request.completedAt)}` : status.details}</td>
            </tr>;
          })}</tbody>
        </table>}
    </section>

    <Dialog open={!!dialog} onClose={() => setDialog(null)} transitionDuration={reducedMotion ? 0 : 180} aria-labelledby="privacy-dialog-title" slotProps={{ paper: { className: 'customer-browse-dialog', style: revampCssVariables } }}>
      {dialog && <form className="browse-dialog-content account-form account-form-dialog" onSubmit={submit} noValidate>
        <h2 id="privacy-dialog-title">{DIALOG[dialog].title}</h2>
        <p className="account-muted">{DIALOG[dialog].text}</p>
        <label htmlFor="privacy-reason">{DIALOG[dialog].label}<textarea id="privacy-reason" rows={4} maxLength={500} value={reason} onChange={event => { setReason(event.target.value); setDialogError(''); }} /></label>
        {dialogError && <p role="alert" className="account-notice" data-tone="error"><CircleAlert size={18} aria-hidden="true" />{dialogError}</p>}
        <div className="browse-actions"><button type="button" onClick={() => setDialog(null)}>Cancel</button><button type="submit" className="browse-primary" disabled={creating.isLoading}>{creating.isLoading ? 'Sending…' : DIALOG[dialog].submit}</button></div>
      </form>}
    </Dialog>
  </AccountLayout>;
};

export default PrivacyPage;
