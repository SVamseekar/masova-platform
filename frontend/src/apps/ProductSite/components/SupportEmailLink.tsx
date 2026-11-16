import { CONTACT_EMAILS, type ContactEmailKey } from '../../../config/contact'

interface SupportEmailLinkProps {
  className?: string
  /** Which public address to link to. Defaults to the general hello@ address. */
  to?: ContactEmailKey
}

export default function SupportEmailLink({
  className = 'text-gray-400 hover:text-white transition-colors underline-offset-2 hover:underline',
  to = 'hello',
}: SupportEmailLinkProps) {
  const email = CONTACT_EMAILS[to]
  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  )
}
