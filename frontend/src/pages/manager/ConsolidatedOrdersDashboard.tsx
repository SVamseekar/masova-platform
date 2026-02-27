import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import {
  useGetStoreOrdersQuery,
} from '../../store/api/orderApi';
import {
  useGetTodaySalesMetricsQuery,
  useGetOrderTypeBreakdownQuery,
  useGetPeakHoursQuery,
  useGetTopProductsQuery,
} from '../../store/api/analyticsApi';

const c = {
  orange: '#FF6B35',
  orangeLight: '#FFF5F0',
  beige: '#F5E6D3',
  bgMain: '#FAF7F2',
  black: '#1A1A1A',
  gray: '#6B7280',
  grayLight: '#E5E7EB',
  white: '#FFFFFF',
  green: '#10B981',
  red: '#EF4444',
};

// Inline SVG icons
const I = {
  Grid: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  File: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Cal: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Box: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Star: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Pkg: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Wallet: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  Fork: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
  Bag: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Down: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
};

const ConsolidatedOrdersDashboard: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const { data: orders = [] } = useGetStoreOrdersQuery(storeId, { skip: !storeId, pollingInterval: 10000 });
  const { data: todaySales } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });
  const { data: topProducts } = useGetTopProductsQuery({ storeId, period: 'TODAY', sortBy: 'REVENUE' }, { skip: !storeId });

  const totalOrders = todaySales?.todayOrderCount || orders.length;
  const totalCustomers = new Set(orders.map(o => o.customerId)).size;
  const revenue = todaySales?.todaySales || 0;
  const pctChange = todaySales?.percentChangeFromYesterday || 0;
  const userName = currentUser?.name || 'Orlando Laperdon';
  const initials = userName.split(' ').map(n => n[0]).join('');

  const weeklyBars = [
    { d: 'Mon', v: 120 }, { d: 'Tue', v: 90 }, { d: 'Wed', v: 150 },
    { d: 'Thu', v: 200 }, { d: 'Fri', v: 110 }, { d: 'Sat', v: 170 }, { d: 'Sun', v: 130 },
  ];

  const nav = [
    { icon: I.Grid, label: 'Dashboard', active: true },
    { icon: I.File, label: 'Orders' },
    { icon: I.Chat, label: 'Messages', badge: 3 },
    { icon: I.Cal, label: 'Calendar' },
    { icon: I.Menu, label: 'Menu' },
    { icon: I.Box, label: 'Inventory' },
    { icon: I.Star, label: 'Reviews' },
  ];

  const trendingMenus = (topProducts?.topProducts || [
    { itemId: '1', itemName: 'Grilled Chicken Delight', category: 'Chicken', quantitySold: 350, revenue: 6300 },
    { itemId: '2', itemName: 'Sunny Citrus Cake', category: 'Dessert', quantitySold: 400, revenue: 3400 },
    { itemId: '3', itemName: 'Fiery Shrimp Salad', category: 'Seafood', quantitySold: 270, revenue: 3240 },
  ]).slice(0, 3);

  const recentActivity = [
    { name: 'Spreader Smith', role: 'Receptionist: Marked Table #5 as reserved', time: '12:45 PM' },
    { name: 'Punya Kings', role: 'Kitchen Admin: Created new menu #ORD1028', time: '11:00 AM' },
    { name: 'Maria Kings', role: 'Kitchen Admin: Inventory low alert on chicken', time: '10:30 AM' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, fontFamily: "'Inter', -apple-system, sans-serif", background: c.bgMain }}>

      {/* ========== LEFT SIDEBAR ========== */}
      <div style={{ width: 240, background: c.white, borderRight: `1px solid ${c.grayLight}`, display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '28px 16px', overflowY: 'auto' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, paddingLeft: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: c.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white, fontWeight: 800, fontSize: 18 }}>R</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: c.black }}>Reztro</span>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nav.map(n => (
            <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: n.active ? c.orangeLight : 'transparent', color: n.active ? c.orange : c.gray, fontWeight: n.active ? 600 : 500, fontSize: 14, cursor: 'pointer' }}>
              <n.icon />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && <span style={{ background: c.orange, color: c.white, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{n.badge}</span>}
            </div>
          ))}
        </div>

        {/* Upgrade */}
        <div style={{ marginTop: 'auto', background: c.orangeLight, borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: c.black, lineHeight: 1.5, margin: '0 0 16px 0' }}>Stronger restaurant management with real-time insights</p>
          <button style={{ width: '100%', padding: 10, background: c.orange, color: c.white, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Upgrade Now</button>
        </div>
      </div>

      {/* ========== MIDDLE + RIGHT ========== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header (spans middle + right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: c.white, borderBottom: `1px solid ${c.grayLight}`, flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: c.black, margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: c.gray, margin: 0, fontWeight: 500 }}>Hello {userName.split(' ')[0]}, welcome back!</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.gray }}><I.Search /></div>
              <input placeholder="Search anything" style={{ padding: '10px 16px 10px 36px', border: `1px solid ${c.grayLight}`, borderRadius: 10, fontSize: 14, width: 240, background: c.white, outline: 'none' }} />
            </div>
            {/* Bell */}
            <div style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${c.grayLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.gray }}><I.Bell /></div>
            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px', border: `1px solid ${c.grayLight}`, borderRadius: 10, cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: c.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white, fontWeight: 700, fontSize: 12 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.black, lineHeight: 1.2 }}>{userName}</div>
                <div style={{ fontSize: 11, color: c.gray, fontWeight: 500, lineHeight: 1.2 }}>{currentUser?.type || 'Manager'}</div>
              </div>
              <I.Down />
            </div>
          </div>
        </div>

        {/* Content row: Middle + Right */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ========== MIDDLE CONTENT ========== */}
          <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
              {[
                { icon: I.Pkg, label: 'Total Orders', value: totalOrders.toLocaleString(), pct: pctChange, up: pctChange >= 0 },
                { icon: I.Users, label: 'Total Customer', value: totalCustomers.toLocaleString(), pct: -0.42, up: false },
                { icon: I.Wallet, label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, pct: 2.38, up: true },
              ].map(s => (
                <div key={s.label} style={{ background: c.white, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: c.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white }}><s.icon /></div>
                    <span style={{ fontSize: 13, color: c.gray, fontWeight: 500 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.black, marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.up ? c.green : c.red }}>
                    {s.up ? '↑' : '↓'} {Math.abs(s.pct).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue + Top Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Revenue Chart */}
              <div style={{ background: c.white, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, margin: 0 }}>Total Revenue</h3>
                  <select style={{ padding: '4px 10px', border: `1px solid ${c.grayLight}`, borderRadius: 6, fontSize: 12, color: c.gray, background: c.white, outline: 'none' }}><option>Last 6 Months</option></select>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.black, marginBottom: 16 }}>${(revenue * 6).toLocaleString()}</div>
                <div style={{ height: 180, position: 'relative', background: c.bgMain, borderRadius: 10, marginBottom: 12 }}>
                  <svg width="100%" height="180" style={{ position: 'absolute' }}>
                    <line x1="30" y1="30" x2="95%" y2="30" stroke={c.grayLight} strokeWidth="1" />
                    <line x1="30" y1="60" x2="95%" y2="60" stroke={c.grayLight} strokeWidth="1" />
                    <line x1="30" y1="90" x2="95%" y2="90" stroke={c.grayLight} strokeWidth="1" />
                    <line x1="30" y1="120" x2="95%" y2="120" stroke={c.grayLight} strokeWidth="1" />
                    <line x1="30" y1="150" x2="95%" y2="150" stroke={c.grayLight} strokeWidth="1" />
                    <path d="M 40 130 Q 100 100, 160 110 T 280 80 T 400 75 T 500 60" stroke={c.orange} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 40 145 Q 100 138, 160 140 T 280 130 T 400 135 T 500 125" stroke={c.black} strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="6 4" />
                  </svg>
                  <div style={{ position: 'absolute', bottom: 6, left: 40, right: 20, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.gray }}>
                    {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(m => <span key={m}>{m}</span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: c.orange }} /><span style={{ color: c.gray }}>Income</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: c.black }} /><span style={{ color: c.gray }}>Expense</span></div>
                </div>
              </div>

              {/* Top Categories */}
              <div style={{ background: c.white, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, margin: 0 }}>Top Categories</h3>
                  <select style={{ padding: '4px 10px', border: `1px solid ${c.grayLight}`, borderRadius: 6, fontSize: 12, color: c.gray, background: c.white, outline: 'none' }}><option>This Month</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <svg width="160" height="160">
                    <circle cx="80" cy="80" r="60" fill="none" stroke={c.orange} strokeWidth="32" strokeDasharray="188 377" transform="rotate(-90 80 80)" />
                    <circle cx="80" cy="80" r="60" fill="none" stroke="#FFA559" strokeWidth="32" strokeDasharray="94 377" strokeDashoffset="-188" transform="rotate(-90 80 80)" />
                    <circle cx="80" cy="80" r="60" fill="none" stroke="#FFD9A0" strokeWidth="32" strokeDasharray="56 377" strokeDashoffset="-282" transform="rotate(-90 80 80)" />
                    <circle cx="80" cy="80" r="60" fill="none" stroke={c.grayLight} strokeWidth="32" strokeDasharray="39 377" strokeDashoffset="-338" transform="rotate(-90 80 80)" />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { color: c.orange, label: 'Seafood', pct: '50%' },
                    { color: '#FFA559', label: 'Beverages', pct: '25%' },
                    { color: '#FFD9A0', label: 'Dessert', pct: '15%' },
                    { color: c.grayLight, label: 'Pasta', pct: '10%' },
                  ].map(i => (
                    <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: i.color }} />
                      <span style={{ flex: 1, color: c.black, fontWeight: 500 }}>{i.label}</span>
                      <span style={{ fontWeight: 600, color: c.gray }}>{i.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Overview + Order Types */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ background: c.white, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, margin: 0 }}>Orders Overview</h3>
                  <select style={{ padding: '4px 10px', border: `1px solid ${c.grayLight}`, borderRadius: 6, fontSize: 12, color: c.gray, background: c.white, outline: 'none' }}><option>This Week</option></select>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 10, padding: '0 8px 24px' }}>
                  {weeklyBars.map((b, i) => (
                    <div key={b.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: '100%', height: `${(b.v / 220) * 100}%`, background: i === 3 ? c.orange : c.beige, borderRadius: '6px 6px 0 0', minHeight: 16 }} />
                      <span style={{ fontSize: 11, color: c.gray, fontWeight: 500 }}>{b.d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: c.white, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, margin: 0 }}>Order Types</h3>
                  <select style={{ padding: '4px 10px', border: `1px solid ${c.grayLight}`, borderRadius: 6, fontSize: 12, color: c.gray, background: c.white, outline: 'none' }}><option>This Month</option></select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: I.Fork, label: 'Dine-In', pct: '45%', n: 900 },
                    { icon: I.Bag, label: 'Takeaway', pct: '30%', n: 600 },
                    { icon: I.Bag, label: 'Online', pct: '25%', n: 500 },
                  ].map(t => (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: c.bgMain, borderRadius: 10 }}>
                      <div style={{ color: c.orange }}><t.icon /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c.black }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: c.gray }}>{t.pct}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: c.black }}>{t.n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div style={{ background: c.white, borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, margin: 0 }}>Recent Orders</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.gray }}><I.Search /></div>
                    <input placeholder="Search placeholder" style={{ padding: '7px 10px 7px 32px', border: `1px solid ${c.grayLight}`, borderRadius: 8, fontSize: 12, width: 160, outline: 'none' }} />
                  </div>
                  <select style={{ padding: '7px 10px', border: `1px solid ${c.grayLight}`, borderRadius: 8, fontSize: 12, color: c.gray, background: c.white, outline: 'none' }}><option>This Week</option></select>
                  <a href="#" style={{ fontSize: 12, color: c.orange, fontWeight: 600, textDecoration: 'none' }}>See All Orders</a>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${c.grayLight}` }}>
                    {['Order ID', 'Photo', 'Menu', 'Qty', 'Amount', 'Customer', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 8px', fontSize: 12, fontWeight: 600, color: c.gray }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(orders.length > 0 ? orders.slice(0, 3) : [
                    { id: '1', orderNumber: '#ORD1025', items: [{ name: 'Salmon Sushi Roll' }], total: 15, customerName: 'Dina White', status: 'READY' },
                    { id: '2', orderNumber: '#ORD1024', items: [{ name: 'Spaghetti Carbonara' }], total: 12, customerName: 'Earl Carter', status: 'DELIVERED' },
                    { id: '3', orderNumber: '#ORD1023', items: [{ name: 'Classic Cheeseburger' }], total: 8, customerName: 'Chelsea Brown', status: 'CANCELLED' },
                  ] as any[]).map((order: any) => (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${c.grayLight}` }}>
                      <td style={{ padding: '14px 8px', fontSize: 13, color: c.black, fontWeight: 500 }}>{order.orderNumber}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: c.beige }} />
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: c.black }}>{order.items?.[0]?.name || 'Menu Item'}</div>
                      </td>
                      <td style={{ padding: '14px 8px', fontSize: 13, color: c.black }}>{order.items?.length || 1}</td>
                      <td style={{ padding: '14px 8px', fontSize: 13, fontWeight: 600, color: c.orange }}>${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}</td>
                      <td style={{ padding: '14px 8px', fontSize: 13, color: c.black }}>{order.customerName}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{
                          padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: order.status === 'DELIVERED' ? '#D1FAE5' : order.status === 'CANCELLED' ? c.black : c.orange,
                          color: order.status === 'DELIVERED' ? '#065F46' : c.white,
                        }}>
                          {order.status === 'DELIVERED' ? 'Completed' : order.status === 'CANCELLED' ? 'Canceled' : 'On Process'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Customer Reviews */}
            <div style={{ background: c.white, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, margin: 0 }}>Customer Reviews</h3>
                <a href="#" style={{ fontSize: 12, color: c.orange, fontWeight: 600, textDecoration: 'none' }}>See More Reviews</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { name: 'Classic Italian Penne', author: 'Sarah M.', date: 'Oct 15, 2024', rating: 5, text: 'This sauce recipe is prominent, creating a rich, savory, umami taste. Highly recommended!' },
                  { name: 'Smokey Supreme Pizza', author: 'Michael B.', date: 'Oct 15, 2024', rating: 4, text: 'Crispy, generous toppings and the perfect balance of spice. A classic pizza done right!' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, background: c.bgMain, borderRadius: 14, padding: 16 }}>
                    <div style={{ width: 100, height: 100, borderRadius: 10, background: c.beige, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: c.black, margin: '0 0 6px 0' }}>{r.name}</h4>
                      <p style={{ fontSize: 12, color: c.gray, lineHeight: 1.5, margin: '0 0 10px 0' }}>{r.text}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: c.black }}>{r.author}</div>
                          <div style={{ fontSize: 11, color: c.gray }}>{r.date}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <span key={j} style={{ color: j < r.rating ? '#FBBF24' : c.grayLight, fontSize: 13 }}>&#9733;</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========== RIGHT SIDEBAR ========== */}
          <div style={{ width: 300, background: c.white, borderLeft: `1px solid ${c.grayLight}`, padding: '28px 20px', overflowY: 'auto', flexShrink: 0 }}>

            {/* Trending Menus */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, margin: 0 }}>Trending Menus</h3>
              <select style={{ padding: '4px 8px', border: `1px solid ${c.grayLight}`, borderRadius: 6, fontSize: 11, color: c.gray, background: c.white, outline: 'none' }}><option>This Week</option></select>
            </div>

            {trendingMenus.map((p: any) => (
              <div key={p.itemId} style={{ marginBottom: 16, borderRadius: 14, overflow: 'hidden', background: c.bgMain }}>
                <div style={{ width: '100%', height: 130, background: c.beige }} />
                <div style={{ padding: 14 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: c.black, margin: '0 0 4px 0' }}>{p.itemName}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.gray }}>
                      <span style={{ color: '#FBBF24' }}>&#9733;</span>
                      <span style={{ fontWeight: 600, color: c.black }}>4.9</span>
                      <span>({p.quantitySold})</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c.orange }}>${(p.revenue / p.quantitySold).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Recent Activity */}
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: c.black, marginBottom: 16 }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recentActivity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.orange, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {a.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: c.black, fontWeight: 500, lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 700 }}>{a.name}</span> {a.role}
                      </div>
                      <div style={{ fontSize: 11, color: c.gray, marginTop: 2 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withPageStoreContext(ConsolidatedOrdersDashboard, 'consolidated-orders');
