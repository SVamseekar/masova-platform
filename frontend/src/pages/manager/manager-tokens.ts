import React from 'react';

// Reztro-style design tokens for manager dashboard
export const t = {
  orange: '#FF6B35',
  orangeLight: '#FFF5F0',
  orangeDark: '#E55A2B',
  bgMain: '#FAF7F2',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: '#6B7280',
  grayLight: '#E5E7EB',
  grayMuted: '#9CA3AF',
  beige: '#F5E6D3',
  green: '#10B981',
  greenLight: '#D1FAE5',
  greenDark: '#065F46',
  red: '#EF4444',
  redLight: '#FEE2E2',
  blue: '#3B82F6',
  yellow: '#FBBF24',
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" as string,
  sidebarWidth: 240,
  rightSidebarWidth: 300,
  headerHeight: 68,
  radius: { sm: 6, md: 10, lg: 16, xl: 20 },
} as const;

export const cardStyle: React.CSSProperties = { background: t.white, borderRadius: t.radius.lg, padding: 20 };

export const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 20px', borderRadius: t.radius.md, border: 'none',
  background: active ? t.orange : 'transparent', color: active ? t.white : t.gray,
  fontWeight: active ? 600 : 500, fontSize: 13, cursor: 'pointer', fontFamily: t.font,
});

export const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 8px', fontSize: 12, fontWeight: 600, color: t.gray,
  borderBottom: `2px solid ${t.grayLight}`,
};

export const tableCellStyle: React.CSSProperties = {
  padding: '14px 8px', fontSize: 13, color: t.black, borderBottom: `1px solid ${t.grayLight}`,
};

export const sectionTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: t.black, margin: 0 };

export const selectStyle: React.CSSProperties = {
  padding: '4px 10px', border: `1px solid ${t.grayLight}`, borderRadius: t.radius.sm,
  fontSize: 12, color: t.gray, background: t.white, outline: 'none', fontFamily: t.font,
};

export const statusBadge = (status: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    DELIVERED: { bg: t.greenLight, color: t.greenDark },
    COMPLETED: { bg: t.greenLight, color: t.greenDark },
    CANCELLED: { bg: t.black, color: t.white },
    READY: { bg: t.orange, color: t.white },
    PREPARING: { bg: t.orangeLight, color: t.orange },
    PENDING: { bg: t.beige, color: t.black },
  };
  const s = map[status] || { bg: t.grayLight, color: t.gray };
  return { padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color };
};

// SVG Icons
const icon = (d: string, size = 20) => React.createElement('svg', {
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
}, React.createElement('path', { d }));

export const Icons = {
  Grid: () => icon('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'),
  File: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
    React.createElement('polyline', { points: '14 2 14 8 20 8' }),
    React.createElement('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
    React.createElement('line', { x1: 16, y1: 17, x2: 8, y2: 17 })),
  Box: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
    React.createElement('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
    React.createElement('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })),
  Settings: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 3 }),
    React.createElement('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' })),
  Users: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
    React.createElement('circle', { cx: 9, cy: 7, r: 4 }),
    React.createElement('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
    React.createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })),
  BarChart: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 12, y1: 20, x2: 12, y2: 10 }),
    React.createElement('line', { x1: 18, y1: 20, x2: 18, y2: 4 }),
    React.createElement('line', { x1: 6, y1: 20, x2: 6, y2: 16 })),
  Search: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 11, cy: 11, r: 8 }),
    React.createElement('path', { d: 'm21 21-4.35-4.35' })),
  Bell: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
    React.createElement('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' })),
  Down: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '6 9 12 15 18 9' })),
  Wallet: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M21 12V7H5a2 2 0 0 1 0-4h14v4' }),
    React.createElement('path', { d: 'M3 5v14a2 2 0 0 0 2 2h16v-5' }),
    React.createElement('path', { d: 'M18 12a2 2 0 0 0 0 4h4v-4Z' })),
  Pkg: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 16.5, y1: 9.4, x2: 7.5, y2: 4.21 }),
    React.createElement('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
    React.createElement('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
    React.createElement('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })),
  Logout: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }),
    React.createElement('polyline', { points: '16 17 21 12 16 7' }),
    React.createElement('line', { x1: 21, y1: 12, x2: 9, y2: 12 })),
  Menu: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 3, y1: 12, x2: 21, y2: 12 }),
    React.createElement('line', { x1: 3, y1: 6, x2: 21, y2: 6 }),
    React.createElement('line', { x1: 3, y1: 18, x2: 21, y2: 18 })),
  ChevronLeft: () => React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '15 18 9 12 15 6' })),
  Sparkle: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z' }),
    React.createElement('path', { d: 'M5 3v4' }),
    React.createElement('path', { d: 'M19 17v4' }),
    React.createElement('path', { d: 'M3 5h4' }),
    React.createElement('path', { d: 'M17 19h4' })),
  Shield: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' })),
};
