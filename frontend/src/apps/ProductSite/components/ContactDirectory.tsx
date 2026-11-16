import { CONTACT_DIRECTORY, CONTACT_EMAILS } from '../../../config/contact'
import { colors } from '../tokens'

/** Public MaSoVa contact addresses by team, shown under the contact form. */
export default function ContactDirectory() {
  return (
    <div className="mt-12">
      <h3
        id="contact-directory-heading"
        className="text-white text-xs font-semibold mb-4 uppercase tracking-wide text-center"
      >
        Or email the right team directly
      </h3>
      <ul aria-labelledby="contact-directory-heading" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CONTACT_DIRECTORY.map(({ key, label, description }) => {
          const email = CONTACT_EMAILS[key]
          return (
            <li
              key={key}
              className="rounded-xl p-4"
              style={{ background: colors.bgElevated, border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h4 className="text-white text-sm font-semibold">{label}</h4>
              <p className="text-gray-500 text-xs leading-relaxed mt-1 mb-2">{description}</p>
              <a
                href={`mailto:${email}`}
                className="text-xs transition-colors underline-offset-2 hover:underline break-all"
                style={{ color: colors.gold }}
              >
                {email}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
