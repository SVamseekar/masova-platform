/**
 * CustomerPageHeader
 *
 * Dark glassmorphic header for customer flow pages (checkout, payment, tracking, etc.)
 * that are NOT the main public site. These pages have a back button + breadcrumb on
 * the left, and the full profile dropdown on the right — identical to AppHeader's
 * showPublicNav branch but without the centre navigation links.
 *
 * Props:
 *   onBack       – callback for the back button (required)
 *   breadcrumb   – label shown after "MaSoVa /" (e.g. "Checkout", "Track Order")
 *   backLabel    – optional override for back button text (default "Back")
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartItemCount } from '../../store/slices/cartSlice';

interface CustomerPageHeaderProps {
  onBack: () => void;
  breadcrumb: string;
  backLabel?: string;
}

const CustomerPageHeader: React.FC<CustomerPageHeaderProps> = ({
  onBack,
  breadcrumb,
  backLabel = 'Back',
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const activeOrderId = sessionStorage.getItem('activeOrderId');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCustomer = currentUser?.type === 'CUSTOMER';
  const isStaff = currentUser && !isCustomer;

  const handleLogout = () => {
    sessionStorage.removeItem('activeOrderId');
    setIsDropdownOpen(false);
    dispatch(logout());
    navigate(isCustomer ? '/' : '/staff-login');
  };

  const go = (path: string) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1200,
      background: 'rgba(10,9,8,0.92)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)',
      height: '64px', display: 'flex', alignItems: 'center',
      padding: '0 48px', gap: '0',
    }}>
      {/* LEFT — back + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.875rem', padding: '6px 0', transition: 'color 0.2s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
        <span
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => navigate('/')}
        >
          MaSoVa
        </span>
        <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>/ {breadcrumb}</span>
      </div>

      {/* RIGHT — cart + profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Cart — only for non-staff */}
        {!isStaff && (
          <button
            onClick={() => navigate('/menu')}
            title="Back to menu"
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px', transition: 'color 0.2s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: 'var(--red)', color: '#fff', borderRadius: '999px',
                fontSize: '0.65rem', fontWeight: 700, minWidth: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>
                {cartItemCount}
              </span>
            )}
          </button>
        )}

        {/* Staff on customer pages → dashboard shortcut */}
        {isStaff ? (
          <button
            style={{
              background: 'rgba(212,168,67,0.12)', border: '1px solid var(--border-strong)',
              color: 'var(--gold)', fontFamily: 'var(--font-body)',
              fontWeight: 600, fontSize: '0.85rem', padding: '8px 18px',
              borderRadius: '999px', cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onClick={() => {
              const t = currentUser?.type;
              if (t === 'MANAGER' || t === 'ASSISTANT_MANAGER') navigate('/manager');
              else if (t === 'DRIVER') navigate('/driver');
              else navigate('/staff');
            }}
          >
            {currentUser?.name} → Dashboard
          </button>

        ) : currentUser ? (
          /* ── Customer profile dropdown ── */
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text-1)', fontFamily: 'var(--font-body)',
                fontWeight: 500, fontSize: '0.875rem', padding: '7px 14px',
                borderRadius: '999px', cursor: 'pointer', transition: 'border-color 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              {/* Avatar circle */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </span>
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Dropdown panel */}
            {isDropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: '210px',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                overflow: 'hidden', zIndex: 1400,
              }}>
                {/* Header */}
                <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '2px', letterSpacing: '0.04em' }}>Signed in as</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)' }}>{currentUser.name}</div>
                  {currentUser.email && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '1px' }}>{currentUser.email}</div>
                  )}
                </div>

                {/* Menu items */}
                {[
                  {
                    label: 'My Orders',
                    path: '/customer/orders',
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
                  },
                  ...(activeOrderId ? [{
                    label: 'Track Order',
                    path: `/tracking/${activeOrderId}`,
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                  }] : []),
                  {
                    label: 'My Profile',
                    path: '/customer/profile',
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                  },
                  {
                    label: 'Dashboard',
                    path: '/customer-dashboard',
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
                  },
                ].map(item => (
                  <DropdownItem key={item.label} icon={item.icon} label={item.label} onClick={() => go(item.path)} />
                ))}

                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                {/* Sign out */}
                <div
                  onClick={handleLogout}
                  style={{
                    padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '10px',
                    color: '#f87171', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </div>
              </div>
            )}
          </div>

        ) : (
          /* Not logged in */
          <button
            onClick={() => navigate('/customer-login')}
            style={{
              background: 'transparent', border: '1px solid var(--border-strong)',
              color: 'var(--text-1)', fontFamily: 'var(--font-body)',
              fontWeight: 500, fontSize: '0.875rem', padding: '8px 20px',
              borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
              (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
              (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

const DropdownItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '10px',
      color: 'var(--text-2)', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)';
      (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.background = 'transparent';
      (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);

export default CustomerPageHeader;
