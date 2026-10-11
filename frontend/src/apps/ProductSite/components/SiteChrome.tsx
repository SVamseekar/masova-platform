import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Box, CalendarDays, ChevronRight, Menu, Smartphone, Sparkles, Tag, User, X } from 'lucide-react';
import MaSoVaBrand from '../../../components/common/MaSoVaBrand';
import { OPEN_COOKIE_PREFERENCES_EVENT } from '../../../components/gdpr/CookieConsent';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { revampCssVariables } from '../../../styles/design-tokens';
import { SUPPORT_EMAIL, openContactForm } from '../constants';
import '../site.css';

export const SITE_NAV = [
  { label: 'Product', href: '/#product', icon: Box },
  { label: 'AI assistants', href: '/#assistants', icon: Sparkles },
  { label: 'Mobile apps', href: '/#mobile', icon: Smartphone },
  { label: 'Pricing', href: '/#pricing', icon: Tag },
];
export const SIGN_IN_PATH = '/staff-login';

/** Root wrapper that applies the approved tokens to every product-site surface. */
export function SiteShell({ children }: { children: ReactNode }) {
  return <div id="product-site" className="msite" style={revampCssVariables}>{children}</div>;
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const book = () => {
    setOpen(false);
    openContactForm();
  };

  return <header className="msite-nav" data-scrolled={scrolled}>
    <div className="msite-wrap msite-nav-inner">
      <a href="/" aria-label="MaSoVa home"><MaSoVaBrand /></a>
      <nav className="msite-nav-links" aria-label="Main">
        {SITE_NAV.map(({ label, href }) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <div className="msite-nav-actions">
        <a className="msite-btn msite-btn-sm" href={SIGN_IN_PATH}>Sign in</a>
        <button type="button" className="msite-btn msite-btn-primary" onClick={book}>Book a walkthrough</button>
      </div>
      <button ref={toggleRef} type="button" className="msite-nav-toggle" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={22} aria-hidden="true" /></button>
    </div>
    {open && <div className="msite-menu" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panelRef} className="msite-menu-panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="msite-menu-top">
          <MaSoVaBrand />
          <button ref={closeRef} type="button" className="msite-btn msite-btn-sm" onClick={close}><X size={18} aria-hidden="true" />Close</button>
        </div>
        <ul className="msite-menu-links">
          {SITE_NAV.map(({ label, href, icon: Icon }) => <li key={href}><a href={href} onClick={() => setOpen(false)}><Icon size={22} aria-hidden="true" />{label}<ChevronRight size={20} aria-hidden="true" /></a></li>)}
          <li className="msite-menu-sep"><a href={SIGN_IN_PATH}><User size={22} aria-hidden="true" />Sign in</a></li>
        </ul>
        <button type="button" className="msite-btn msite-btn-primary" onClick={book}><CalendarDays size={18} aria-hidden="true" />Book a walkthrough<ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </div>}
  </header>;
}

export function SiteFooter() {
  return <footer className="msite-footer">
    <div className="msite-wrap msite-footer-inner">
      <a href="/" aria-label="MaSoVa home"><MaSoVaBrand /></a>
      <span className="msite-footer-tag">Smarter operations for happier restaurants.</span>
      <nav aria-label="Product">{SITE_NAV.map(({ label, href }) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="msite-footer-contact"><small>Contact us</small><a href={'mailto:' + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a></div>
      <nav aria-label="Legal">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/cookies">Cookies</a>
        <a href="/refunds">Refunds</a>
        <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}>Cookie preferences</button>
      </nav>
    </div>
  </footer>;
}

/** Scales a fixed-size illustrative artboard to the width of its container. */
export function FitPreview({ width, height, label, children }: { width: number; height: number; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / width || 1);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  return <div ref={ref} className="msite-fit" role="img" aria-label={label} style={{ aspectRatio: `${width} / ${height}` }}>
    <div className="msite-fit-inner" aria-hidden="true" style={{ width, height, transform: `scale(${scale})` }}>{children}</div>
  </div>;
}
