import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectCurrentUser, logout } from '../../store/slices/authSlice';
import { usePageStore } from '../../hooks/usePageStore';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import { clearReturnUrl } from '../../utils/security';
import { Bell, CalendarDays, ChartLine, ChevronDown, CircleHelp, ClipboardCheck, FileText, Gem, House, Rows3, Settings, ShoppingBag, UserPlus } from 'lucide-react';
import { t } from './manager-tokens';
import { SUPPORT_EMAIL } from '../../apps/ProductSite/constants';
import { useGetActiveStoresQuery, type Store } from '../../store/api/storeApi';
import { setSelectedStore, setStoreCurrency, selectSelectedStoreId, selectSelectedStoreName } from '../../store/slices/cartSlice';
import { storeCurrencyPayload, resolveStoreMarket } from '../../utils/storeCurrency';
import { useGetVersionQuery } from '../../store/api/systemApi';
import { ManagerCopilotDrawer } from './ManagerCopilotDrawer';
import MaSoVaBrand from '../../components/common/MaSoVaBrand';

const DashboardSection = React.lazy(() => import('./DashboardSection'));
const OrdersSection = React.lazy(() => import('./OrdersSection'));
const InventorySection = React.lazy(() => import('./InventorySection'));
const OperationsSection = React.lazy(() => import('./OperationsSection'));
const PeopleSection = React.lazy(() => import('./PeopleSection'));
const AnalyticsSection = React.lazy(() => import('./AnalyticsSection'));
const AIAgentsSection = React.lazy(() => import('./AIAgentsSection'));
const FiscalCompliancePage = React.lazy(() => import('./FiscalCompliancePage'));

const FOCUS_RING_CSS = '.manager-shell *:focus-visible { outline: 2px solid #1D5F47 !important; outline-offset: 2px; }';

const keyboardActivate = (action: () => void) => ({
  onClick: action,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  },
  role: 'menuitem' as const,
  tabIndex: 0,
});

const NAV_ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true } as const;

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: House },
  { id: 'orders', label: 'Orders & Payments', icon: ClipboardCheck },
  { id: 'inventory', label: 'Inventory & Supply', icon: ShoppingBag },
  { id: 'operations', label: 'Operations', icon: Rows3 },
  { id: 'people', label: 'People & Marketing', icon: UserPlus },
  { id: 'analytics', label: 'Analytics & Reports', icon: ChartLine },
  { id: 'ai', label: 'AI Agents', icon: Gem },
  { id: 'compliance', label: 'Fiscal Compliance', icon: FileText },
];

const SIDEBAR_WIDTH = 240;

const navButton = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 14, width: '100%', border: 'none',
  padding: '11px 14px', borderRadius: 8, fontFamily: t.font, textAlign: 'left',
  background: active ? t.selection : 'transparent',
  color: t.black, fontWeight: active ? 600 : 400, fontSize: 15, cursor: 'pointer',
});

const headerControl: React.CSSProperties = {
  height: 40, borderRadius: 8, border: `1px solid ${t.grayLight}`, background: t.white,
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.black, cursor: 'pointer',
};

const menuSurface: React.CSSProperties = {
  position: 'absolute', background: t.white, borderRadius: 12, border: `1px solid ${t.grayLight}`,
  boxShadow: '0 8px 24px rgba(24,34,31,0.12)', zIndex: 100, overflow: 'hidden',
};

// eslint-disable-next-line react-refresh/only-export-components -- page component with HOC export
function ManagerShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId, setStore: setPageStore } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const activeSection = searchParams.get('section') || 'dashboard';
  const activeTab = searchParams.get('tab') || '';

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [storeDropOpen, setStoreDropOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);

  // Store selector
  const reduxStoreId = useAppSelector(selectSelectedStoreId);
  const reduxStoreName = useAppSelector(selectSelectedStoreName);
  const { data: stores = [], isLoading: storesLoading } = useGetActiveStoresQuery();
  const { data: versionInfo } = useGetVersionQuery();

  // Auto-select the manager's assigned store on first load
  useEffect(() => {
    if (storesLoading || stores.length === 0 || selectedStoreId) return;
    const userStoreId = currentUser?.storeId;
    if (!userStoreId) return;
    const match = stores.find((s: Store) => s.storeCode === userStoreId || s.id === userStoreId);
    if (match) {
      dispatch(setSelectedStore({ storeId: match.storeCode, storeName: match.name }));
      if (resolveStoreMarket(match).resolved) {
        dispatch(setStoreCurrency(storeCurrencyPayload(match)));
      }
      setPageStore(match.storeCode, match.name);
    }
  }, [stores, storesLoading, selectedStoreId, currentUser?.storeId, dispatch, setPageStore]);

  const setSection = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('section', id);
    params.delete('tab');
    setSearchParams(params);
  };

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreDropOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = currentUser?.name || 'Manager';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleStoreSelect = (code: string, name: string) => {
    dispatch(setSelectedStore({ storeId: code, storeName: name }));
    const store = stores.find((s: Store) => s.storeCode === code || s.id === code);
    if (store && resolveStoreMarket(store).resolved) {
      dispatch(setStoreCurrency(storeCurrencyPayload(store)));
    }
    setStoreDropOpen(false);
  };

  const handleLogout = () => {
    clearReturnUrl();
    dispatch(logout());
    navigate('/staff-login');
  };

  const menuItem: React.CSSProperties = {
    padding: '10px 16px', fontSize: 13, color: t.black, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
  };

  return (
    <div className="manager-shell" style={{
      display: 'flex', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0,
      fontFamily: t.font, background: t.bgMain,
    }}>
      <style>{FOCUS_RING_CSS}</style>

      {/* LEFT SIDEBAR */}
      <nav
        aria-label="Manager sections"
        style={{
          width: SIDEBAR_WIDTH, background: t.bgMain, borderRight: `1px solid ${t.grayLight}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '20px 14px', overflowY: 'auto',
        }}
      >
        <div style={{ padding: '0 6px', marginBottom: 28 }}>
          <MaSoVaBrand size={32} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                aria-current={isActive ? 'page' : undefined}
                style={navButton(isActive)}
              >
                <s.icon {...NAV_ICON} />
                <span style={{ whiteSpace: 'nowrap' }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 20 }}>
          <button type="button" onClick={() => setSearchParams({ section: 'operations', tab: 'stores' })} style={navButton(false)}>
            <Settings {...NAV_ICON} />
            <span>Settings</span>
          </button>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ ...navButton(false), textDecoration: 'none', boxSizing: 'border-box' }}>
            <CircleHelp {...NAV_ICON} />
            <span>Help &amp; Support</span>
          </a>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* HEADER */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
          padding: '14px 28px', background: t.bgMain, flexShrink: 0, height: t.headerHeight,
          borderBottom: `1px solid ${t.grayLight}`, position: 'relative', zIndex: 50,
        }}>
          {/* Store selector */}
          <div ref={storeRef} style={{ position: 'relative' }}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={storeDropOpen}
              aria-label="Select store"
              onClick={() => { setStoreDropOpen(!storeDropOpen); setProfileOpen(false); setNotifOpen(false); }}
              style={{
                ...headerControl, width: 250, padding: '0 14px', justifyContent: 'space-between',
                fontSize: 15, fontWeight: 400, fontFamily: t.font,
                borderColor: storeDropOpen ? t.focus : t.grayLight,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {storesLoading ? 'Loading...' : reduxStoreName || 'Select Store'}
              </span>
              <ChevronDown size={16} aria-hidden />
            </button>
            {storeDropOpen && (
              <div role="listbox" aria-label="Stores" style={{ ...menuSurface, top: 46, left: 0, minWidth: 280, maxHeight: 320, overflowY: 'auto' }}>
                {stores.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: t.grayMuted, fontSize: 13 }}>No stores available</div>
                ) : stores.map((store) => {
                  const isSel = reduxStoreId === store.storeCode;
                  return (
                    <div
                      key={store.id}
                      {...keyboardActivate(() => handleStoreSelect(store.storeCode, store.name))}
                      role="option"
                      aria-selected={isSel}
                      style={{
                        padding: '10px 16px', cursor: 'pointer',
                        background: isSel ? t.selection : 'transparent', borderBottom: `1px solid ${t.grayLight}`,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: isSel ? 600 : 500, color: t.black }}>{store.name}</div>
                      <div style={{ fontSize: 11, color: t.grayMuted }}>{store.address?.city}, {store.address?.state}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ManagerCopilotDrawer storeId={storeId} />
            <span style={{ fontSize: 14, color: t.black }}>Today</span>
            <span aria-hidden style={{ ...headerControl, width: 40, cursor: 'default' }}><CalendarDays size={18} strokeWidth={1.75} /></span>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                style={{ ...headerControl, width: 40, border: 'none', background: 'transparent' }}
              >
                <Bell size={20} strokeWidth={1.75} aria-hidden />
              </button>
              {notifOpen && (
                <div style={{ ...menuSurface, top: 46, right: 0, width: 300 }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.grayLight}`, fontWeight: 600, fontSize: 14, color: t.black }}>Notifications</div>
                  <div style={{ padding: 20, textAlign: 'center', color: t.grayMuted, fontSize: 13 }}>No new notifications</div>
                </div>
              )}
            </div>

            {/* Account */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label={`Account menu, ${userName}`}
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', background: t.selection,
                  color: t.black, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: t.font,
                }}
              >
                {initials}
              </button>
              {profileOpen && (
                <div role="menu" style={{ ...menuSurface, top: 48, right: 0, width: 230 }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.grayLight}` }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.black }}>{userName}</div>
                    <div style={{ fontSize: 12, color: t.grayMuted }}>{currentUser?.email || ''}</div>
                    <div style={{ fontSize: 11, color: t.grayMuted, marginTop: 2 }}>{currentUser?.type || 'Manager'}{versionInfo ? ` · v${versionInfo.version}` : ''}</div>
                  </div>
                  <div {...keyboardActivate(() => { setProfileOpen(false); navigate('/staff/profile'); })} style={menuItem}>My Profile</div>
                  <div {...keyboardActivate(() => { setProfileOpen(false); setSearchParams({ section: 'people', tab: 'staff' }); })} style={menuItem}>Staff Settings</div>
                  <div style={{ borderTop: `1px solid ${t.grayLight}` }}>
                    <div {...keyboardActivate(() => { setProfileOpen(false); handleLogout(); })} style={{ ...menuItem, color: t.red }}>Logout</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: t.gray }}>Loading...</div>}>
            {activeSection === 'dashboard' && <DashboardSection storeId={storeId} />}
            {activeSection === 'orders' && <OrdersSection storeId={storeId} activeTab={activeTab} onTabChange={setTab} />}
            {activeSection === 'inventory' && <InventorySection storeId={storeId} activeTab={activeTab} onTabChange={setTab} />}
            {activeSection === 'operations' && <OperationsSection storeId={storeId} activeTab={activeTab} onTabChange={setTab} />}
            {activeSection === 'people' && <PeopleSection storeId={storeId} activeTab={activeTab} onTabChange={setTab} />}
            {activeSection === 'analytics' && <AnalyticsSection storeId={storeId} activeTab={activeTab} onTabChange={setTab} />}
            {activeSection === 'ai' && <AIAgentsSection storeId={storeId} />}
            {activeSection === 'compliance' && <FiscalCompliancePage storeId={storeId} />}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}

export default withPageStoreContext(ManagerShell, 'manager-shell');
