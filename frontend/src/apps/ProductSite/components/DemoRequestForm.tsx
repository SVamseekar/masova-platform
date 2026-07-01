import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, Loader2, Shield, CheckCircle } from 'lucide-react'
import { SUPPORT_EMAIL } from '../constants'
import SupportEmailLink from './SupportEmailLink'
import { colors, typography } from '../tokens'

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
  website: '',
}

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[#141414] border text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500/40 transition-all'

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 1rem center',
  backgroundSize: '1em',
}

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: colors.gold }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

function Field({
  label,
  name,
  required,
  error,
  children,
}: {
  label: string
  name: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="text-xs font-medium text-gray-400 mb-1.5">
        {label}
        {required && <span style={{ color: colors.red }}> *</span>}
      </label>
      {children}
      {error && <span className="text-xs mt-1" style={{ color: colors.error }}>{error}</span>}
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

  const border = (key: string) => ({
    borderColor: errors[key] ? colors.error : 'rgba(255,255,255,0.08)',
  })

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.fullName.trim()) next.fullName = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Valid work email required'
    if (!form.restaurantName.trim()) next.restaurantName = 'Required'
    if (!form.city.trim()) next.city = 'Required'
    if (!form.gdprConsent) next.gdprConsent = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.website) {
      setIsSuccess(true)
      return
    }
    if (!validate()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const payload = {
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
      _template: 'table',
      _captcha: 'false',
    }

    try {
      const formspreeId = import.meta.env.VITE_FORMSPREE_FORM_ID
      const endpoint = formspreeId
        ? `https://formspree.io/f/${formspreeId}`
        : `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('fail')

      setSubmittedEmail(form.email)
      setForm(INITIAL)
      setIsSuccess(true)
    } catch {
      setSubmitError('send_failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-6 space-y-4"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-white" style={{ fontFamily: typography.fontDisplay }}>
          We received your request
        </h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Sent to <SupportEmailLink className="text-white font-semibold hover:text-white" />.
          We will contact you at <strong className="text-white">{submittedEmail}</strong> within one business day.
        </p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="text-xs text-gray-500 hover:text-white underline cursor-pointer"
        >
          Submit another request
        </button>
      </motion.div>
    )
  }

  return (
    <form id="contact-form" onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div className="hidden" aria-hidden="true">
        <input type="text" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
      </div>

      <FormGroup title="About you">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Full name" name="fullName" required error={errors.fullName}>
            <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Marco de Vries" className={inputClass} style={border('fullName')} required />
          </Field>
          <Field label="Work email" name="email" required error={errors.email}>
            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="marco@bistrogroup.com" className={inputClass} style={border('email')} required />
          </Field>
          <Field label="Your role" name="role">
            <select id="role" name="role" value={form.role} onChange={handleChange} className={`${inputClass} appearance-none`} style={{ ...selectStyle, ...border('role') }}>
              <option value="owner">Owner / Founder</option>
              <option value="gm">General Manager</option>
              <option value="ops">Operations Manager</option>
              <option value="it">IT / Technical lead</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Phone" name="phone">
            <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+31 6 12345678" className={inputClass} style={border('phone')} />
          </Field>
        </div>
      </FormGroup>

      <FormGroup title="Your business">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Restaurant / brand name" name="restaurantName" required error={errors.restaurantName}>
            <input id="restaurantName" name="restaurantName" value={form.restaurantName} onChange={handleChange} placeholder="Bistro Group" className={inputClass} style={border('restaurantName')} required />
          </Field>
          <Field label="Number of locations" name="locations">
            <select id="locations" name="locations" value={form.locations} onChange={handleChange} className={`${inputClass} appearance-none`} style={selectStyle}>
              <option value="1">1 location</option>
              <option value="2-5">2–5 locations</option>
              <option value="6-10">6–10 locations</option>
              <option value="11+">11+ locations</option>
            </select>
          </Field>
          <Field label="Go-live timeline" name="timeline">
            <select id="timeline" name="timeline" value={form.timeline} onChange={handleChange} className={`${inputClass} appearance-none`} style={selectStyle}>
              <option value="asap">As soon as possible</option>
              <option value="1-3months">Within 1–3 months</option>
              <option value="3-6months">3–6 months</option>
              <option value="exploring">Just exploring</option>
            </select>
          </Field>
          <Field label="Biggest challenge today" name="currentSetup">
            <select id="currentSetup" name="currentSetup" value={form.currentSetup} onChange={handleChange} className={`${inputClass} appearance-none`} style={selectStyle}>
              <option value="manual">Manual orders (WhatsApp / spreadsheets)</option>
              <option value="integrations">Delivery apps not integrated</option>
              <option value="legacy-pos">Legacy POS — no live kitchen view</option>
              <option value="scaling">Centralising multi-location ops</option>
              <option value="other">Something else</option>
            </select>
          </Field>
        </div>
      </FormGroup>

      <FormGroup title="Location">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Country" name="country">
            <select id="country" name="country" value={form.country} onChange={handleChange} className={`${inputClass} appearance-none`} style={selectStyle}>
              {EU_COUNTRIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="City" name="city" required error={errors.city}>
            <input id="city" name="city" value={form.city} onChange={handleChange} placeholder="Amsterdam" className={inputClass} style={border('city')} required />
          </Field>
        </div>
      </FormGroup>

      <FormGroup title="Anything else?">
        <textarea
          id="message"
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          placeholder="Current POS, franchise structure, languages, integrations needed..."
          className={`${inputClass} resize-none`}
          style={border('message')}
        />
      </FormGroup>

      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="gdprConsent"
            name="gdprConsent"
            checked={form.gdprConsent}
            onChange={handleChange}
            className="mt-0.5 w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="gdprConsent" className="text-xs text-gray-400 leading-relaxed">
            I agree to the{' '}
            <Link to="/privacy" className="text-white underline hover:opacity-80">
              Privacy Policy
            </Link>{' '}
            and consent to MaSoVa processing my details to contact me. <span style={{ color: colors.red }}>*</span>
          </label>
        </div>
        {errors.gdprConsent && <span className="text-xs pl-7" style={{ color: colors.error }}>{errors.gdprConsent}</span>}
      </div>

      {submitError && (
        <p className="text-xs rounded-xl px-4 py-3" style={{ color: colors.error, background: colors.redMuted }}>
          Could not send right now. Email <SupportEmailLink className="text-red-300 hover:text-red-200" /> and we will reply within one business day.
        </p>
      )}

      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
        style={{ borderColor: colors.border }}
      >
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <Shield size={14} className="text-emerald-500" />
          Sent securely to <SupportEmailLink className="text-gray-400 hover:text-gray-300" />
        </span>
        <button
          type="submit"
          disabled={isSubmitting}
          className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          style={{ background: colors.red }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Sending...
            </>
          ) : (
            <>
              Submit walkthrough request
              <Send size={14} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}