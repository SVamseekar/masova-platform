import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUp,
  Building2,
  ChartColumn,
  ChevronDown,
  CircleCheck,
  ShoppingCart,
  Sun,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { t, tableHeaderStyle, tableCellStyle } from './manager-tokens';
import { ManagerEmptyState, ManagerErrorState, ManagerLoadingBlock } from './components';
import { formatMajorAmount } from '../../utils/currency';
import type { Order } from '../../store/api/orderApi';

export interface HourlyRevenue {
  hour: number;
  sales: number;
}

interface Props {
  greetingName: string;
  storeName: string;
  currency: string;
  locale: string;
  revenueToday: number;
  revenueHint: string;
  hourlyRevenue: HourlyRevenue[];
  hourlyLoading: boolean;
  hourlyError: boolean;
  onRetryHourly: () => void;
  activeOrders: Order[];
  ordersLoading: boolean;
  ordersError: boolean;
  onRetryOrders: () => void;
  staffLoading: boolean;
  staffError: boolean;
  attentionLoading: boolean;
  attentionError: boolean;
  staffOnShift: number;
  staffRoster: number;
  driversClockedIn: number;
  needsAttention: number;
  needsAttentionHint: string;
  now?: Date;
}

const SOURCES: Record<string, { label: string; color: string }> = {
  MASOVA: { label: 'Direct', color: '#1F8A5B' },
  WOLT: { label: 'Wolt', color: '#0E9F6E' },
  DELIVEROO: { label: 'Deliveroo', color: '#2563EB' },
  JUST_EAT: { label: 'Just Eat', color: '#EA580C' },
  UBER_EATS: { label: 'Uber Eats', color: '#4F46E5' },
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Delivery',
  TAKEAWAY: 'Collection',
  DINE_IN: 'Dine in',
};

const STATUS_SEGMENTS: Array<{ key: string; label: string; statuses: string[]; color: string }> = [
  { key: 'received', label: 'Received', statuses: ['RECEIVED'], color: '#2E9E6E' },
  { key: 'preparing', label: 'Preparing', statuses: ['PREPARING'], color: '#E8501A' },
  { key: 'oven', label: 'In oven', statuses: ['OVEN'], color: '#F5A623' },
  { key: 'baked', label: 'Baked', statuses: ['BAKED'], color: '#6B7280' },
  { key: 'ready', label: 'Ready', statuses: ['READY'], color: '#1F6FEB' },
  { key: 'out', label: 'Out for delivery', statuses: ['DISPATCHED', 'OUT_FOR_DELIVERY'], color: '#38A9E8' },
];

const STATUS_BADGES: Record<string, { bg: string; color: string; icon: 'up' | 'check' | null }> = {
  PREPARING: { bg: '#FFE5DA', color: '#B8400A', icon: 'up' },
  OVEN: { bg: '#FFEFCC', color: '#8A5A0B', icon: 'up' },
  BAKED: { bg: '#ECECEA', color: '#55635A', icon: null },
  READY: { bg: '#DDF3E6', color: '#146342', icon: 'check' },
  RECEIVED: { bg: '#E8F1FC', color: '#17588B', icon: null },
  DISPATCHED: { bg: '#E8F1FC', color: '#17588B', icon: null },
  OUT_FOR_DELIVERY: { bg: '#E8F1FC', color: '#17588B', icon: null },
};

const STATUS_LABELS: Record<string, string> = {
  OVEN: 'In oven',
  OUT_FOR_DELIVERY: 'Out for delivery',
};

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function minutesUntil(iso: string | undefined, now: Date): string {
  if (!iso) return '—';
  const diff = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  if (!Number.isFinite(diff)) return '—';
  const span = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`);
  return diff > 0 ? span(diff) : `Overdue ${span(Math.abs(diff))}`;
}

function formatTime(iso: string | undefined): string {
  const date = iso ? new Date(iso) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—';
}

const timestamp = (iso: string | undefined): number => {
  const value = iso ? new Date(iso).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
};

/** "Priya Sharma" → "Priya S." */
const shortName = (name: string | undefined): string => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

const card: React.CSSProperties = {
  background: t.white,
  border: `1px solid ${t.grayLight}`,
  borderRadius: t.radius.lg,
  boxShadow: '0 1px 2px rgba(24,34,31,0.04)',
  minWidth: 0,
};

const cardTitle: React.CSSProperties = { margin: 0, fontSize: 17, fontWeight: 600, color: t.black };

const KpiTile: React.FC<{
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  hint: string;
  hintColor: string;
  loading?: boolean;
  error?: boolean;
}> = ({ icon, value, label, hint, hintColor, loading = false, error = false }) => (
  <div style={{ ...card, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
    <span
      aria-hidden
      style={{
        width: 56, height: 56, borderRadius: '50%', background: t.selection, color: t.black,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {icon}
    </span>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: t.black, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>
        {loading ? '…' : error ? '—' : value}
      </div>
      <div style={{ fontSize: 15, color: t.gray, marginTop: 2 }}>{label}</div>
      <div role={error ? 'alert' : undefined} style={{ fontSize: 14, color: error ? t.red : hintColor, marginTop: 2, fontWeight: 500 }}>
        {error ? 'Could not load' : hint}
      </div>
    </div>
  </div>
);

/** Step so that four intervals cover `value`, e.g. 920 → 250, giving ticks 0…1,000. */
const niceStep = (value: number): number => {
  if (value <= 0) return 25;
  const raw = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((m) => raw <= m * magnitude) ?? 10) * magnitude;
};

const RevenueChart: React.FC<{
  hours: HourlyRevenue[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  format: (v: number) => string;
  locale: string;
}> = ({ hours, loading, error, onRetry, format, locale }) => {
  if (loading) return <ManagerLoadingBlock rows={3} label="Loading revenue…" />;
  if (error) return <ManagerErrorState title="Could not load today's revenue" onRetry={onRetry} />;
  const axis = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  const byHour = new Map(hours.map((h) => [h.hour, h.sales]));
  const activeHours = hours.filter((h) => h.sales > 0).map((h) => h.hour);
  const first = Math.min(8, ...(activeHours.length ? activeHours : [8]));
  const last = Math.max(22, ...(activeHours.length ? activeHours : [22]));
  const range = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const step = niceStep(Math.max(0, ...range.map((h) => byHour.get(h) || 0)));
  const max = step * 4;
  const total = range.reduce((sum, h) => sum + (byHour.get(h) || 0), 0);
  const width = 640;
  const height = 230;
  const left = 48;
  const bottom = 28;
  const top = 8;
  const plotH = height - bottom - top;
  const slot = (width - left - 8) / range.length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`Revenue by hour today, total ${format(total)}`}
        style={{ display: 'block' }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const y = top + plotH - (plotH * i) / 4;
          return (
            <g key={i}>
              <line x1={left} x2={width - 8} y1={y} y2={y} stroke="#E7E8E3" strokeWidth={1} />
              <text x={left - 10} y={y + 4} textAnchor="end" fontSize={12} fill={t.gray}>
                {axis(step * i)}
              </text>
            </g>
          );
        })}
        {range.map((hour, index) => {
          const x = left + index * slot;
          const value = byHour.get(hour) || 0;
          const barH = (value / max) * plotH;
          return (
            <g key={hour}>
              <line x1={x} x2={x} y1={top} y2={top + plotH} stroke="#EEEFEA" strokeWidth={1} />
              {value > 0 && (
                <rect x={x + slot * 0.2} y={top + plotH - barH} width={slot * 0.6} height={barH} rx={2} fill="#2FA383">
                  <title>{`${String(hour).padStart(2, '0')}:00 · ${format(value)}`}</title>
                </rect>
              )}
              {index % 2 === 0 && (
                <text x={x} y={height - 6} textAnchor="middle" fontSize={12} fill={t.gray}>
                  {String(hour).padStart(2, '0')}:00
                </text>
              )}
            </g>
          );
        })}
        <line x1={left + range.length * slot} x2={left + range.length * slot} y1={top} y2={top + plotH} stroke="#EEEFEA" strokeWidth={1} />
      </svg>
      {total === 0 && <p style={{ margin: '4px 0 0', fontSize: 13, color: t.grayMuted }}>No completed sales yet today.</p>}
    </div>
  );
};

const StatusDonut: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const counts = STATUS_SEGMENTS.map((segment) => ({
    ...segment,
    count: orders.filter((o) => segment.statuses.includes(String(o.status).toUpperCase())).length,
  }));
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const radius = 72;
  const stroke = 26;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <svg width={200} height={200} viewBox="0 0 200 200" role="img" aria-label={`${total} active orders by status`}>
        <circle cx={100} cy={100} r={radius} fill="none" stroke={t.selection} strokeWidth={stroke} />
        {total > 0 &&
          counts
            .filter((c) => c.count > 0)
            .map((segment) => {
              const length = (segment.count / total) * circumference;
              const circle = (
                <circle
                  key={segment.key}
                  cx={100}
                  cy={100}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 100 100)"
                />
              );
              offset += length;
              return circle;
            })}
        <text x={100} y={104} textAnchor="middle" fontSize={34} fontWeight={700} fill={t.black}>
          {total}
        </text>
        <text x={100} y={126} textAnchor="middle" fontSize={14} fill={t.gray}>
          active orders
        </text>
      </svg>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14, minWidth: 190, flex: 1, maxWidth: 260 }}>
        {counts.map((segment) => (
          <li key={segment.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: t.black }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: segment.color }} />
            <span style={{ flex: 1 }}>{segment.label}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{segment.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SourceCell: React.FC<{ source: string | undefined }> = ({ source }) => {
  const info = SOURCES[source || 'MASOVA'] || { label: source || 'Direct', color: t.gray };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden
        style={{
          width: 18, height: 18, borderRadius: 5, background: info.color, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid #fff' }} />
      </span>
      {info.label}
    </span>
  );
};

const StatusCell: React.FC<{ status: string }> = ({ status }) => {
  const key = status.toUpperCase();
  const badge = STATUS_BADGES[key] || { bg: t.selection, color: t.gray, icon: null };
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 128, padding: '7px 12px', borderRadius: 8,
        background: badge.bg, color: badge.color, fontSize: 14, fontWeight: 500, boxSizing: 'border-box',
      }}
    >
      {badge.icon === 'up' && <ArrowUp size={15} strokeWidth={2} aria-hidden />}
      {badge.icon === 'check' && <CircleCheck size={15} strokeWidth={2} aria-hidden />}
      {STATUS_LABELS[key] || key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
    </span>
  );
};

const DashboardOverview: React.FC<Props> = ({
  greetingName,
  storeName,
  currency,
  locale,
  revenueToday,
  revenueHint,
  hourlyRevenue,
  hourlyLoading,
  hourlyError,
  onRetryHourly,
  activeOrders,
  ordersLoading,
  ordersError,
  onRetryOrders,
  staffLoading,
  staffError,
  attentionLoading,
  attentionError,
  staffOnShift,
  staffRoster,
  driversClockedIn,
  needsAttention,
  needsAttentionHint,
  now = new Date(),
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const format = (value: number) => formatMajorAmount(value, currency, locale);
  const preparing = activeOrders.filter((o) => String(o.status).toUpperCase() === 'PREPARING').length;
  const liveOrders = [...activeOrders]
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))
    .slice(0, 4);

  const openOrders = () => {
    const params = new URLSearchParams(searchParams);
    params.set('section', 'orders');
    params.set('tab', 'orders');
    setSearchParams(params);
  };

  return (
    <div style={{ display: 'grid', gap: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: t.black, lineHeight: 1.15 }}>
            {greetingFor(now)}, {greetingName}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 16, color: t.gray }}>
            Here&apos;s what&apos;s happening at {storeName || 'your store'} today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: t.gray }}>
            <Sun size={24} strokeWidth={1.5} aria-hidden />
            <div style={{ fontSize: 14, lineHeight: 1.35 }}>
              <div>Today</div>
              <div>{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
          <div style={{ ...card, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14, minWidth: 250 }}>
            <Building2 size={22} strokeWidth={1.5} color={t.black} aria-hidden />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {storeName || 'Select a store'}
              </div>
              <div style={{ fontSize: 13, color: t.gray }}>Restaurant · {currency}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        <KpiTile
          icon={<ChartColumn size={24} strokeWidth={1.75} />}
          value={format(revenueToday)}
          label="Revenue"
          hint={revenueHint}
          hintColor={t.greenDark}
        />
        <KpiTile
          icon={<ShoppingCart size={24} strokeWidth={1.75} />}
          value={activeOrders.length}
          label="Active orders"
          hint={`${preparing} preparing`}
          hintColor={t.gray}
          loading={ordersLoading}
          error={ordersError}
        />
        <KpiTile
          icon={<Users size={24} strokeWidth={1.75} />}
          value={`${staffOnShift}${staffRoster > 0 ? ` / ${staffRoster}` : ''}`}
          label="Staff on shift"
          hint={`${driversClockedIn} drivers clocked in`}
          hintColor={t.blue}
          loading={staffLoading}
          error={staffError}
        />
        <KpiTile
          icon={<TriangleAlert size={24} strokeWidth={1.75} />}
          value={needsAttention}
          label="Needs attention"
          hint={needsAttentionHint}
          hintColor={t.red}
          loading={attentionLoading}
          error={attentionError}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', gap: 16 }}>
        <section style={{ ...card, padding: 20 }} aria-labelledby="revenue-today-title">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h3 id="revenue-today-title" style={cardTitle}>Revenue today</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: t.black, fontVariantNumeric: 'tabular-nums' }}>{format(revenueToday)}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: t.greenDark }}>{revenueHint}</span>
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Payment method</span>
              <select
                defaultValue="all"
                style={{
                  appearance: 'none', height: 36, padding: '0 34px 0 12px', borderRadius: 8, border: `1px solid ${t.grayLight}`,
                  background: t.white, color: t.black, fontSize: 14, fontFamily: t.font,
                }}
              >
                <option value="all">All payment methods</option>
              </select>
              <ChevronDown size={14} aria-hidden style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: t.gray }} />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <RevenueChart
              hours={hourlyRevenue}
              loading={hourlyLoading}
              error={hourlyError}
              onRetry={onRetryHourly}
              format={format}
              locale={locale}
            />
          </div>
        </section>
        <section style={{ ...card, padding: 20 }} aria-labelledby="order-status-title">
          <h3 id="order-status-title" style={{ ...cardTitle, marginBottom: 16 }}>Order status</h3>
          {ordersError ? (
            <ManagerErrorState title="Could not load order status" onRetry={onRetryOrders} />
          ) : (
            <StatusDonut orders={activeOrders} />
          )}
        </section>
      </div>

      <section style={{ ...card, padding: 20 }} aria-labelledby="live-orders-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 id="live-orders-title" style={cardTitle}>Live orders</h3>
          <button
            type="button"
            onClick={openOrders}
            style={{
              border: 'none', background: 'transparent', color: '#D9381E', fontWeight: 500, fontSize: 15, cursor: 'pointer',
              fontFamily: t.font, display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            View all orders <ArrowRight size={16} aria-hidden />
          </button>
        </div>
        {ordersLoading ? (
          <ManagerLoadingBlock rows={3} label="Loading orders…" />
        ) : ordersError ? (
          <ManagerErrorState title="Failed to load orders" onRetry={onRetryOrders} />
        ) : liveOrders.length === 0 ? (
          <ManagerEmptyState compact title="No active orders" description="The queue is clear right now." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: '#F3F4F2' }}>
                  {['Time', '#', 'Customer', 'Source', 'Type', 'Total', 'Status', 'ETA'].map((heading) => (
                    <th key={heading} scope="col" style={{ ...tableHeaderStyle, borderBottom: 'none', padding: '10px 12px', fontWeight: 500, fontSize: 13 }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveOrders.map((order) => {
                  const cell = { ...tableCellStyle, padding: '8px 12px', height: 48, fontSize: 15, borderBottom: 'none' };
                  return (
                    <tr key={order.id}>
                      <td style={{ ...cell, fontVariantNumeric: 'tabular-nums' }}>{formatTime(order.createdAt)}</td>
                      <td style={cell}>{order.orderNumber ? `#${order.orderNumber}` : '—'}</td>
                      <td style={{ ...cell, color: '#1D5FD0' }}>{shortName(order.customerName)}</td>
                      <td style={cell}><SourceCell source={order.orderSource} /></td>
                      <td style={cell}>{TYPE_LABELS[order.orderType] || order.orderType}</td>
                      <td style={{ ...cell, fontVariantNumeric: 'tabular-nums' }}>{format(Number(order.totalAmount ?? order.total ?? 0))}</td>
                      <td style={cell}><StatusCell status={String(order.status)} /></td>
                      <td style={{ ...cell, fontVariantNumeric: 'tabular-nums' }}>{minutesUntil(order.estimatedDeliveryTime, now)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardOverview;
