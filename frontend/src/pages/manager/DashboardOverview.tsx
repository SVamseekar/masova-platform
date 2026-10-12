import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { t, sectionTitleStyle, statusBadge, tableHeaderStyle, tableCellStyle } from './manager-tokens';
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

const SOURCE_LABELS: Record<string, string> = {
  MASOVA: 'Direct',
  WOLT: 'Wolt',
  DELIVEROO: 'Deliveroo',
  JUST_EAT: 'Just Eat',
  UBER_EATS: 'Uber Eats',
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Delivery',
  TAKEAWAY: 'Collection',
  DINE_IN: 'Dine in',
};

const STATUS_SEGMENTS: Array<{ key: string; label: string; statuses: string[]; color: string }> = [
  { key: 'received', label: 'Received', statuses: ['RECEIVED'], color: '#17588B' },
  { key: 'preparing', label: 'Preparing', statuses: ['PREPARING'], color: '#C63F19' },
  { key: 'oven', label: 'In oven', statuses: ['OVEN'], color: '#8A5A0B' },
  { key: 'baked', label: 'Baked', statuses: ['BAKED'], color: '#7E8980' },
  { key: 'out', label: 'Out for delivery', statuses: ['DISPATCHED', 'OUT_FOR_DELIVERY'], color: '#203D32' },
];

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

function formatTime(iso: string | undefined, locale: string): string {
  const date = iso ? new Date(iso) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : '—';
}

const timestamp = (iso: string | undefined): number => {
  const value = iso ? new Date(iso).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
};

const tile: React.CSSProperties = {
  background: t.white,
  border: `1px solid ${t.grayLight}`,
  borderRadius: t.radius.lg,
  padding: 16,
  minWidth: 0,
};

const KpiTile: React.FC<{
  value: React.ReactNode;
  label: string;
  hint: string;
  loading?: boolean;
  error?: boolean;
}> = ({ value, label, hint, loading = false, error = false }) => (
  <div style={tile}>
    <div style={{ fontSize: 26, fontWeight: 700, color: t.black, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>
      {loading ? '…' : error ? '—' : value}
    </div>
    <div style={{ fontSize: 13, color: t.gray, marginTop: 4 }}>{label}</div>
    <div role={error ? 'alert' : undefined} style={{ fontSize: 12, color: error ? t.red : t.grayMuted, marginTop: 2 }}>
      {error ? 'Could not load' : hint}
    </div>
  </div>
);

const niceMax = (value: number): number => {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => value <= m * magnitude) ?? 10;
  return step * magnitude;
};

const RevenueChart: React.FC<{
  currency: string;
  locale: string;
  hours: HourlyRevenue[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  format: (v: number) => string;
}> = ({ hours, loading, error, onRetry, format, currency, locale }) => {
  const formatAxis = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  if (loading) return <ManagerLoadingBlock rows={3} label="Loading revenue…" />;
  if (error) return <ManagerErrorState title="Could not load today's revenue" onRetry={onRetry} />;
  const byHour = new Map(hours.map((h) => [h.hour, h.sales]));
  const activeHours = hours.filter((h) => h.sales > 0).map((h) => h.hour);
  const first = Math.min(8, ...(activeHours.length ? activeHours : [8]));
  const last = Math.max(22, ...(activeHours.length ? activeHours : [22]));
  const range = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const max = niceMax(Math.max(0, ...range.map((h) => byHour.get(h) || 0)));
  const total = range.reduce((sum, h) => sum + (byHour.get(h) || 0), 0);
  const width = 560;
  const height = 190;
  const left = 44;
  const bottom = 24;
  const plotH = height - bottom - 8;
  const barW = (width - left) / range.length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`Revenue by hour today, total ${format(total)}`}
        style={{ display: 'block', maxHeight: 220 }}
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = 8 + plotH - plotH * fraction;
          return (
            <g key={fraction}>
              <line x1={left} x2={width} y1={y} y2={y} stroke={t.grayLight} strokeWidth={1} />
              <text x={left - 8} y={y + 4} textAnchor="end" fontSize={11} fill={t.grayMuted}>
                {formatAxis(Math.round(max * fraction))}
              </text>
            </g>
          );
        })}
        {range.map((hour, index) => {
          const value = byHour.get(hour) || 0;
          const barH = max > 0 ? (value / max) * plotH : 0;
          const x = left + index * barW;
          return (
            <g key={hour}>
              {value > 0 && (
                <rect x={x + barW * 0.18} y={8 + plotH - barH} width={barW * 0.64} height={barH} rx={2} fill={t.forest}>
                  <title>{`${String(hour).padStart(2, '0')}:00 · ${format(value)}`}</title>
                </rect>
              )}
              {index % 2 === 0 && (
                <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize={11} fill={t.grayMuted}>
                  {String(hour).padStart(2, '0')}:00
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {total === 0 && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: t.grayMuted }}>No completed sales yet today.</p>
      )}
    </div>
  );
};

const StatusDonut: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const counts = STATUS_SEGMENTS.map((segment) => ({
    ...segment,
    count: orders.filter((o) => segment.statuses.includes(String(o.status).toUpperCase())).length,
  }));
  const total = orders.length;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={150} height={150} viewBox="0 0 150 150" role="img" aria-label={`${total} active orders by status`}>
        <circle cx={75} cy={75} r={radius} fill="none" stroke={t.selection} strokeWidth={16} />
        {total > 0 &&
          counts
            .filter((c) => c.count > 0)
            .map((segment) => {
              const length = (segment.count / total) * circumference;
              const circle = (
                <circle
                  key={segment.key}
                  cx={75}
                  cy={75}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={16}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 75 75)"
                />
              );
              offset += length;
              return circle;
            })}
        <text x={75} y={78} textAnchor="middle" fontSize={28} fontWeight={700} fill={t.black}>
          {total}
        </text>
        <text x={75} y={96} textAnchor="middle" fontSize={11} fill={t.gray}>
          active orders
        </text>
      </svg>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8, minWidth: 150, flex: 1 }}>
        {counts.map((segment) => (
          <li key={segment.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.black }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: segment.color }} />
            <span style={{ flex: 1 }}>{segment.label}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{segment.count}</span>
          </li>
        ))}
      </ul>
    </div>
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
    .slice(0, 8);

  const openOrders = () => {
    const params = new URLSearchParams(searchParams);
    params.set('section', 'orders');
    params.set('tab', 'orders');
    setSearchParams(params);
  };

  return (
    <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: t.black, lineHeight: 1.15 }}>
            {greetingFor(now)}, {greetingName}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 15, color: t.gray }}>
            Here&apos;s what&apos;s happening at {storeName || 'your store'} today.
          </p>
        </div>
        <div style={{ ...tile, padding: '10px 16px', textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.black }}>{storeName || 'Select a store'}</div>
          <div style={{ fontSize: 12, color: t.gray }}>
            {now.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} · {currency}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <KpiTile value={format(revenueToday)} label="Revenue today" hint={revenueHint} />
        <KpiTile value={activeOrders.length} label="Active orders" hint={`${preparing} preparing`} loading={ordersLoading} error={ordersError} />
        <KpiTile
          value={`${staffOnShift}${staffRoster > 0 ? ` / ${staffRoster}` : ''}`}
          label="Staff on shift"
          hint={`${driversClockedIn} drivers clocked in`}
          loading={staffLoading}
          error={staffError}
        />
        <KpiTile value={needsAttention} label="Needs attention" hint={needsAttentionHint} loading={attentionLoading} error={attentionError} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <section style={tile} aria-labelledby="revenue-today-title">
          <h3 id="revenue-today-title" style={{ ...sectionTitleStyle, marginBottom: 12 }}>Revenue today</h3>
          <RevenueChart hours={hourlyRevenue} loading={hourlyLoading} error={hourlyError} onRetry={onRetryHourly} format={format} currency={currency} locale={locale} />
        </section>
        <section style={tile} aria-labelledby="order-status-title">
          <h3 id="order-status-title" style={{ ...sectionTitleStyle, marginBottom: 12 }}>Order status</h3>
          {ordersError ? (
            <ManagerErrorState title="Could not load order status" onRetry={onRetryOrders} />
          ) : (
            <StatusDonut orders={activeOrders} />
          )}
        </section>
      </div>

      <section style={tile} aria-labelledby="live-orders-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 id="live-orders-title" style={sectionTitleStyle}>Live orders</h3>
          <button
            type="button"
            onClick={openOrders}
            style={{ border: 'none', background: 'transparent', color: t.orange, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: t.font }}
          >
            View all orders
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  {['Time', 'Order', 'Customer', 'Source', 'Type', 'Total', 'Status', 'ETA'].map((heading) => (
                    <th key={heading} scope="col" style={tableHeaderStyle}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ ...tableCellStyle, fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(order.createdAt, locale)}
                    </td>
                    <td style={tableCellStyle}>{order.orderNumber ? `#${order.orderNumber}` : '—'}</td>
                    <td style={tableCellStyle}>{order.customerName || '—'}</td>
                    <td style={tableCellStyle}>{SOURCE_LABELS[order.orderSource || 'MASOVA'] || order.orderSource}</td>
                    <td style={tableCellStyle}>{TYPE_LABELS[order.orderType] || order.orderType}</td>
                    <td style={{ ...tableCellStyle, fontVariantNumeric: 'tabular-nums' }}>
                      {format(Number(order.totalAmount ?? order.total ?? 0))}
                    </td>
                    <td style={tableCellStyle}>
                      <span style={statusBadge(String(order.status))}>{String(order.status).replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ ...tableCellStyle, fontVariantNumeric: 'tabular-nums' }}>
                      {minutesUntil(order.estimatedDeliveryTime, now)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardOverview;
