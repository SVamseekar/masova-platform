import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MaSoVaBrand from './MaSoVaBrand';
import { revampCssVariables } from '../../styles/design-tokens';
import './StaffAccess.css';

export default function StaffAccessLayout({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <main className={`staff-access${compact ? ' staff-access--compact' : ''}`} style={revampCssVariables}>
    <div className="staff-access__shell">
      <section className="staff-access__panel" aria-label="Staff account access">
        <Link className="staff-access__brand" to="/" aria-label="MaSoVa home"><MaSoVaBrand /></Link>
        {children}
        <footer className="staff-access__footer"><span>Customer?</span>
          <Link to="/customer-login">Sign in to your customer account <ArrowRight size={16} aria-hidden="true" /></Link>
        </footer>
      </section>
      {!compact && <aside className="staff-access__photo" aria-hidden="true">
        <img src="/images/brand/staff-sign-in-v1.jpg" alt="" width="1024" height="1536" fetchPriority="high" />
        <div className="staff-access__caption"><h2>Great food<br />brings people<br />together.</h2>
          <p>Simple tools for happier<br />teams and fuller tables.</p>
        </div>
      </aside>}
    </div>
  </main>;
}
