import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Loader2 } from 'lucide-react'
import { SUPPORT_EMAIL } from '../constants'
import SupportEmailLink from './SupportEmailLink'

const EU_COUNTRIES = [
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'IE', label: 'Ireland' },
  { value: 'AT', label: 'Austria' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PL', label: 'Poland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'DK', label: 'Denmark' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'OTHER', label: 'Other / Non-EU' },
] as const

const INITIAL = {
  fullName: '',
  email: '',
  phone: '',
  role: 'owner',
  restaurantName: '',
  locations: '1',
  country: 'DE',
  city: '',
  timeline: '1-3months',
  currentSetup: 'manual',
  message: '',
  gdprConsent: false,
  contactTrap: '',
}

function Field({ label, name, required, optional, error, wide, children }: {
  label: string
  name: string
  required?: boolean
  optional?: boolean
  error?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={'msite-field' + (wide ? ' msite-field-wide' : '')}>
      <label htmlFor={name}>
        {label}
        {required && <i aria-hidden="true"> *</i>}
        {optional && <small> (optional)</small>}
      </label>
      {children}
      {error && <span id={name + '-error'} className="msite-error" role="alert">{error}</span>}
    </div>
  )
}

export default function DemoRequestForm() {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm((prev) => ({ ...prev, [name]: val }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    setSubmitError(null)
  }

  const invalid = (key: string) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? key + '-error' : undefined,
  })

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your full name'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Enter a valid work email'
    if (!form.restaurantName.trim()) next.restaurantName = 'Enter your restaurant or brand name'
    if (!form.city.trim()) next.city = 'Enter your city'
    if (!form.gdprConsent) next.gdprConsent = 'Agree to the Privacy Policy to send your request'
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) document.getElementById(first)?.focus()
    return !first
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.contactTrap) {
      // Bots fill every field. Nothing is sent, and the trip is logged for diagnosis.
      console.warn('Walkthrough request dropped: the hidden anti-spam field was filled')
      setIsSuccess(true)
      return
    }
    if (!validate()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const details = {
      name: form.fullName,
      email: form.email,
      phone: form.phone || 'Not provided',
      role: form.role,
      restaurant: form.restaurantName,
      locations: form.locations,
      country: form.country,
      city: form.city,
      timeline: form.timeline,
      challenge: form.currentSetup,
      message: form.message || '—',
      _subject: `MaSoVa demo — ${form.restaurantName} (${form.country})`,
    }

    try {
      const formspreeId = import.meta.env.VITE_FORMSPREE_FORM_ID
      const endpoint = formspreeId
        ? `https://formspree.io/f/${formspreeId}`
        : `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`
      // The template and captcha fields belong to formsubmit.co only.
      const payload = formspreeId ? details : { ...details, _template: 'table', _captcha: 'false' }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => null) as { success?: string | boolean; errors?: unknown } | null
      // Both providers can answer 200 with a failure in the body.
      if (!res.ok || body?.success === 'false' || body?.success === false || body?.errors) {
        throw new Error(`Form provider answered ${res.status}: ${JSON.stringify(body)}`)
      }

      setSubmittedEmail(form.email)
      setForm(INITIAL)
      setIsSuccess(true)
    } catch (error) {
      console.error('Walkthrough request was not sent', error)
      setSubmitError(navigator.onLine ? 'send_failed' : 'offline')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Move focus to the confirmation, or back to the first field for another request.
  const doneRef = useRef<HTMLDivElement>(null)
  const wasSuccess = useRef(false)
  useEffect(() => {
    if (isSuccess) doneRef.current?.focus()
    else if (wasSuccess.current) document.getElementById('fullName')?.focus()
    wasSuccess.current = isSuccess
  }, [isSuccess])

  if (isSuccess) {
    return (
      <div ref={doneRef} className="msite-done" role="status" tabIndex={-1}>
        <CircleCheck size={40} aria-hidden="true" />
        <h3>We received your request</h3>
        <p>
          {submittedEmail
            ? <>We will contact you at <strong>{submittedEmail}</strong> within one business day.</>
            : 'We will contact you within one business day.'}
        </p>
        <button type="button" className="msite-btn msite-btn-sm" onClick={() => setIsSuccess(false)}>
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form id="contact-form" className="msite-form" onSubmit={handleSubmit} noValidate>
      <h3>Request a product walkthrough</h3>
      <div className="msite-hidden" aria-hidden="true">
        <input type="text" name="contactTrap" value={form.contactTrap} onChange={handleChange} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="msite-form-grid">
        <Field label="Full name" name="fullName" required error={errors.fullName}>
          <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your name" autoComplete="name" required {...invalid('fullName')} />
        </Field>
        <Field label="Work email" name="email" required error={errors.email}>
          <input id="email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@restaurant.com" autoComplete="email" required {...invalid('email')} />
        </Field>
        <Field label="Restaurant / brand name" name="restaurantName" required error={errors.restaurantName}>
          <input id="restaurantName" name="restaurantName" value={form.restaurantName} onChange={handleChange} placeholder="e.g. Riverside Kitchen" autoComplete="organization" required {...invalid('restaurantName')} />
        </Field>
        <Field label="Number of locations" name="locations">
          <select id="locations" name="locations" value={form.locations} onChange={handleChange}>
            <option value="1">1 location</option>
            <option value="2-5">2–5 locations</option>
            <option value="6-10">6–10 locations</option>
            <option value="11+">11+ locations</option>
          </select>
        </Field>
        <Field label="Your role" name="role">
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            <option value="owner">Owner / Founder</option>
            <option value="gm">General Manager</option>
            <option value="ops">Operations Manager</option>
            <option value="it">IT / Technical lead</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Phone" name="phone" optional>
          <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+49 123 456789" autoComplete="tel" />
        </Field>
        <Field label="Country" name="country">
          <select id="country" name="country" value={form.country} onChange={handleChange} autoComplete="country">
            {EU_COUNTRIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="City" name="city" required error={errors.city}>
          <input id="city" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Berlin" autoComplete="address-level2" required {...invalid('city')} />
        </Field>
        <Field label="Timeline" name="timeline">
          <select id="timeline" name="timeline" value={form.timeline} onChange={handleChange}>
            <option value="asap">As soon as possible</option>
            <option value="1-3months">Within 1–3 months</option>
            <option value="3-6months">3–6 months</option>
            <option value="exploring">Just exploring</option>
          </select>
        </Field>
        <Field label="Current setup" name="currentSetup">
          <select id="currentSetup" name="currentSetup" value={form.currentSetup} onChange={handleChange}>
            <option value="manual">Manual orders (WhatsApp / spreadsheets)</option>
            <option value="integrations">Delivery apps not integrated</option>
            <option value="legacy-pos">Legacy POS, no live kitchen view</option>
            <option value="scaling">Centralising multi-location operations</option>
            <option value="other">Something else</option>
          </select>
        </Field>
        <Field label="Message" name="message" optional wide>
          <textarea id="message" name="message" rows={3} value={form.message} onChange={handleChange} placeholder="Tell us a bit about your goals…" />
        </Field>
      </div>

      <div>
        <div className="msite-consent">
          <input type="checkbox" id="gdprConsent" name="gdprConsent" checked={form.gdprConsent} onChange={handleChange} required {...invalid('gdprConsent')} />
          <label htmlFor="gdprConsent">
            I agree to the <Link to="/privacy">Privacy Policy</Link> and consent to be contacted about MaSoVa.
          </label>
        </div>
        {errors.gdprConsent && <span id="gdprConsent-error" className="msite-error" role="alert">{errors.gdprConsent}</span>}
      </div>

      {submitError && (
        <p className="msite-alert" role="alert">
          {submitError === 'offline' ? 'You are offline, so your request was not sent. Reconnect and try again' : 'Your request was not sent. Try again'}, or email <SupportEmailLink />.
        </p>
      )}

      <div className="msite-form-end">
        <small>Fields marked * are required.</small>
        <button type="submit" className="msite-btn msite-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 size={18} aria-hidden="true" />Sending…</> : 'Submit request'}
        </button>
      </div>
    </form>
  )
}
