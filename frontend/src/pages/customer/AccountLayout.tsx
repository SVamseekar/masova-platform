import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Heart, Home, MapPin, Settings } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { SUPPORT_EMAIL } from '../../apps/ProductSite/constants';
import './Account.css';

const LINKS = [
  { label: 'Overview', to: '/customer-dashboard', icon: Home },
  { label: 'Orders', to: '/customer/orders', icon: ClipboardList },
  { label: 'Favourites', to: '/customer/profile?section=preferences', icon: Heart },
  { label: 'Addresses', to: '/customer/profile?section=addresses', icon: MapPin },
  { label: 'Account settings', to: '/customer/profile?section=personal', icon: Settings },
];

/** Signed-in customer area: ordering header, account side navigation and the page content (board 07, panels 3 and 4). */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const here = location.pathname + location.search;
  return <BrowseShell>
    <div className="account">
      <aside className="account-side">
        <nav aria-label="Account">
          {LINKS.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={() => here === to ? 'active' : ''} aria-current={here === to ? 'page' : undefined}><Icon size={20} aria-hidden="true" />{label}</NavLink>)}
        </nav>
        <div className="account-help">
          <strong>Need help?</strong>
          <span>Write to us about an order or your account.</span>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
        </div>
      </aside>
      <main className="account-main">{children}</main>
    </div>
  </BrowseShell>;
}
