import { useEffect, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { CheckCircle2, Handshake, MessageSquareText, SlidersHorizontal } from 'lucide-react'
import { useSite } from '../SiteContext'
import { SITE_COUNTRIES } from '../content/shared'
import { SUPPORT_EMAIL } from '../constants'
import SupportEmailLink from './SupportEmailLink'

interface FormState {
  fullName: string
  email: string
  restaurant: string
  sites: string
  country: string
  role: string
  message: string
  consent: boolean
  /** Honeypot: hidden from people, filled by bots. */
  website: string
}

const INITIAL: FormState = {
  fullName: '', email: '', restaurant: '', sites: '', country: '', role: '', message: '', consent: false, website: '',
}

type FieldErrors = Partial<Record<'fullName' | 'email' | 'restaurant' | 'consent', string>>

const POINT_ICONS = [SlidersHorizontal, MessageSquareText, Handshake]

/** Formspree when VITE_FORMSPREE_FORM_ID is set, otherwise FormSubmit to the public hello@ address. */
function submitEndpoint(): string {
  const formspreeId = import.meta.env.VITE_FORMSPREE_FORM_ID as string | undefined
  return formspreeId ? `https://formspree.io/f/${formspreeId}` : `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`
}

export default function ContactSection() {
  const { copy, locale } = useSite()
  const c = copy.contact
  const f = c.form
  const [searchParams] = useSearchParams()
  // ?sites=<index> comes from the concierge: the visitor already said how many sites they run
  const [form, setForm] = useState<FormState>(() => {
    const raw = searchParams.get('sites')
    const sites = raw !== null && /^\d+$/.test(raw) ? f.sitesOptions[Number(raw)] : undefined
    return sites ? { ...INITIAL, sites } : INITIAL
  })
  // Arriving from the concierge: put the visitor straight into the form
  useEffect(() => {
    if (searchParams.has('sites')) document.getElementById('ms-f-fullName')?.focus({ preventScroll: true })
  }, [searchParams])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [sentTo, setSentTo] = useState('')

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!form.fullName.trim()) next.fullName = f.required
    if (!form.email.trim()) next.email = f.required
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = f.invalidEmail
    if (!form.restaurant.trim()) next.restaurant = f.required
    if (!form.consent) next.consent = f.required
    return next
  }

  const onSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (form.website) {
      setStatus('sent')
      return
    }
    const next = validate()
    setErrors(next)
    const firstInvalid = Object.keys(next)[0]
    if (firstInvalid) {
      document.getElementById(`ms-f-${firstInvalid}`)?.focus()
      return
    }

    setStatus('sending')
    const countryName = SITE_COUNTRIES.find((x) => x.code === form.country) ? copy.countries.list[form.country as keyof typeof copy.countries.list].name : form.country
    try {
      const res = await fetch(submitEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.fullName.trim(),
          email: form.email.trim(),
          restaurant: form.restaurant.trim(),
          sites: form.sites || 'Not given',
          country: countryName || 'Not given',
          role: form.role || 'Not given',
          message: form.message.trim() || '—',
          language: locale,
          _subject: `MaSoVa walkthrough: ${form.restaurant.trim()}`,
          _template: 'table',
          _captcha: 'false',
        }),
      })
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      // Both providers can answer 200 with a rejection in the body (FormSubmit: success "false" until activated).
      const data: { success?: boolean | string; ok?: boolean; errors?: unknown; message?: string } = await res.json().catch(() => ({}))
      if (data.success === false || data.success === 'false' || data.ok === false || data.errors) {
        throw new Error(`Form provider rejected the request: ${data.message ?? JSON.stringify(data.errors)}`)
      }
      setSentTo(form.email.trim())
      setForm(INITIAL)
      setStatus('sent')
    } catch (err) {
      console.error('Walkthrough request failed', err)
      setStatus('failed')
    }
  }

  const fieldProps = (key: keyof FieldErrors) => ({
    id: `ms-f-${key}`,
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `ms-f-${key}-error` : undefined,
  })

  const errorText = (key: keyof FieldErrors) =>
    errors[key] ? <span className="ms-field-error" id={`ms-f-${key}-error`}>{errors[key]}</span> : null

  return (
    <section className="ms-section" id="contact" aria-labelledby="ms-contact-title">
      <div className="ms-wrap ms-contact">
        <div>
          <h2 className="ms-sr" id="ms-contact-title">{copy.pages.contact.heading}</h2>
          <ul className="ms-contact-points">
            {c.points.map((point, i) => {
              const Icon = POINT_ICONS[i] ?? Handshake
              return (
                <li key={point.title}>
                  <Icon size={20} aria-hidden="true" />
                  <span><strong>{point.title}</strong><span>{point.text}</span></span>
                </li>
              )
            })}
          </ul>
          <p className="ms-contact-email">
            {c.emailLead} <SupportEmailLink />
          </p>
          <h3 className="ms-sub-title" style={{ marginTop: 28, marginBottom: 0 }}>{c.directoryTitle}</h3>
          <ul className="ms-directory">
            {c.directory.map((entry) => (
              <li key={entry.key}>
                <span><strong>{entry.label}</strong>{entry.text}</span>
                <SupportEmailLink to={entry.key} />
              </li>
            ))}
          </ul>
        </div>

        <div className="ms-form">
          {status === 'sent' ? (
            <div className="ms-form-success" role="status">
              <i><CheckCircle2 size={28} aria-hidden="true" /></i>
              <h3>{f.successTitle}</h3>
              {sentTo && <p>{f.successBody.replace('{email}', sentTo)}</p>}
              <button type="button" className="ms-btn ms-btn--outline ms-btn--sm" onClick={() => setStatus('idle')}>
                {f.again}
              </button>
            </div>
          ) : (
            <form id="contact-form" onSubmit={onSubmit} noValidate>
              <div className="ms-form-grid">
                <div className="ms-field">
                  <label htmlFor="ms-f-fullName">{f.fullName}</label>
                  <input {...fieldProps('fullName')} name="name" autoComplete="name" value={form.fullName} onChange={update('fullName')} required />
                  {errorText('fullName')}
                </div>
                <div className="ms-field">
                  <label htmlFor="ms-f-email">{f.email}</label>
                  <input {...fieldProps('email')} name="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} required />
                  {errorText('email')}
                </div>
                <div className="ms-field">
                  <label htmlFor="ms-f-restaurant">{f.restaurant}</label>
                  <input {...fieldProps('restaurant')} name="organization" autoComplete="organization" placeholder={f.restaurantHint} value={form.restaurant} onChange={update('restaurant')} required />
                  {errorText('restaurant')}
                </div>
                <div className="ms-field">
                  <label htmlFor="ms-f-sites">{f.sites} <small>({f.optional})</small></label>
                  <select id="ms-f-sites" name="sites" value={form.sites} onChange={update('sites')}>
                    <option value="">{f.selectPlaceholder}</option>
                    {f.sitesOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="ms-field">
                  <label htmlFor="ms-f-country">{f.country} <small>({f.optional})</small></label>
                  <select id="ms-f-country" name="country" value={form.country} onChange={update('country')}>
                    <option value="">{f.selectPlaceholder}</option>
                    {SITE_COUNTRIES.map((x) => <option key={x.code} value={x.code}>{copy.countries.list[x.code].name}</option>)}
                    <option value="Other">{f.countryOther}</option>
                  </select>
                </div>
                <div className="ms-field">
                  <label htmlFor="ms-f-role">{f.role} <small>({f.optional})</small></label>
                  <select id="ms-f-role" name="role" value={form.role} onChange={update('role')}>
                    <option value="">{f.selectPlaceholder}</option>
                    {f.roleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="ms-field ms-field--full">
                  <label htmlFor="ms-f-message">{f.message} <small>({f.optional})</small></label>
                  <textarea id="ms-f-message" name="message" placeholder={f.messageHint} value={form.message} onChange={update('message')} />
                </div>
                <div className="ms-field ms-field--full">
                  <label className="ms-consent" htmlFor="ms-f-consent" style={{ fontWeight: 400 }}>
                    <input {...fieldProps('consent')} type="checkbox" checked={form.consent} onChange={update('consent')} />
                    <span>
                      {f.consentLead} <Link to="/privacy">{f.consentLink}</Link> {f.consentTail}
                    </span>
                  </label>
                  {errorText('consent')}
                </div>
                <div className="ms-honeypot" aria-hidden="true">
                  <label htmlFor="ms-f-website">Website</label>
                  <input id="ms-f-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
                </div>
              </div>

              {status === 'failed' && (
                <p className="ms-form-alert" role="alert">
                  {f.error.split('{address}')[0]}
                  <SupportEmailLink className="ms-link" />
                  {f.error.split('{address}')[1] ?? ''}
                </p>
              )}

              <div className="ms-form-submit">
                <button type="submit" className="ms-btn ms-btn--primary" disabled={status === 'sending'} aria-busy={status === 'sending'}>
                  {status === 'sending' ? f.sending : f.submit}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
