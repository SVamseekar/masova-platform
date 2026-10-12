import React from 'react';
import { Check } from 'lucide-react';
import { t, surfaceCard, surfaceTitle, tableHeadBand, tableHeaderStyle, tableCellStyle } from './manager-tokens';
import { ManagerEmptyState, ManagerErrorState, ManagerLoadingBlock } from './components';
import { BarChart } from './DashboardCharts';
import type { Order } from '../../store/api/orderApi';
import type { WorkingSession } from '../../store/api/sessionApi';
import type { useGetExecutiveSummaryQuery } from '../../store/api/analyticsApi';
import type { StaffRankingItem, ProductRankingItem, ChurnPredictionItem, SalesForecastItem } from '../types/analytics';

type ExecutiveSummary = NonNullable<ReturnType<typeof useGetExecutiveSummaryQuery>['data']>;

export interface OrderTypeRow {
  orderType: string;
  label: string;
  count: number;
  sales: number;
}

export interface PeakRow {
  hour: number;
  label: string;
  orderCount: number;
  sales: number;
}

interface Section<T> {
  data: T;
  loading?: boolean;
  error?: boolean;
}

interface Props {
  formatCurrency: (value: number) => string;
  activeOrders: Order[];
  sessions: Section<WorkingSession[]>;
  pendingSessions: Section<WorkingSession[]>;
  nowMs: number;
  actionError: string | null;
  onDismissActionError: () => void;
  onApprove: (sessionId: string) => void;
  onReject: (sessionId: string) => void;
  actionBusy: boolean;
  orderTypes: Section<OrderTypeRow[]>;
  peakHours: Section<PeakRow[]>;
  topProducts: Section<Array<ProductRankingItem>>;
  executiveSummary: Section<ExecutiveSummary | undefined>;
  forecast: Section<{ items: SalesForecastItem[]; accuracy: number; period: string } | undefined>;
  leaderboard: Section<{ items: StaffRankingItem[]; period: string } | undefined>;
  churn: Section<{ items: ChurnPredictionItem[]; total: number; high: number; medium: number; low: number } | undefined>;
}

// Same hues as the order status donut: Received blue, kitchen orange, Ready green, out slate.
const FLOW_STAGES: Array<{ label: string; statuses: string[]; color: string }> = [
  { label: 'Received', statuses: ['RECEIVED'], color: '#2563EB' },
  { label: 'In kitchen', statuses: ['PREPARING', 'OVEN', 'BAKED'], color: '#E8501A' },
  { label: 'Ready', statuses: ['READY'], color: '#1F8A5B' },
  { label: 'Dispatched', statuses: ['DISPATCHED', 'OUT_FOR_DELIVERY'], color: '#475569' },
];

const TYPE_COLORS: Record<string, string> = { DELIVERY: '#2563EB', DINE_IN: '#E8501A', TAKEAWAY: '#203D32' };
const PEAK_COLOR = '#2563EB';
const FORECAST_COLOR = '#203D32';
const PRODUCT_COLOR = '#E8501A';

const BAR_TRACK = '#ECEEEB';

const initials = (name: string | undefined): string =>
  (name || '?').split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const duration = (loginTime: string, nowMs: number): string => {
  const diff = nowMs - new Date(loginTime).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '—';
  return `${Math.floor(diff / 3600000)} h ${Math.floor((diff % 3600000) / 60000)} min`;
};

const th: React.CSSProperties = { ...tableHeaderStyle, borderBottom: 'none', padding: '10px 12px', fontWeight: 500, fontSize: 13 };
const td: React.CSSProperties = { ...tableCellStyle, padding: '8px 12px', height: 60, fontSize: 15, borderBottom: `1px solid ${t.grayLight}` };

const primaryButton: React.CSSProperties = {
  height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: '#D94A22', color: t.white,
  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
};
const secondaryButton: React.CSSProperties = {
  height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${t.borderControl}`, background: t.white, color: t.black,
  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
};

const Card: React.FC<{ title: string; titleId: string; subtitle?: string; fill?: boolean; children: React.ReactNode }> = ({
  title,
  titleId,
  subtitle,
  fill = false,
  children,
}) => (
  <section style={fill ? { ...surfaceCard, flex: 1 } : surfaceCard} aria-labelledby={titleId}>
    <h3 id={titleId} style={surfaceTitle}>{title}</h3>
    {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: t.gray }}>{subtitle}</p>}
    <div style={{ marginTop: 14 }}>{children}</div>
  </section>
);

const Initials: React.FC<{ name: string | undefined }> = ({ name }) => (
  <span
    aria-hidden
    style={{
      width: 36, height: 36, borderRadius: '50%', background: t.selection, color: t.black, fontSize: 13, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}
  >
    {initials(name)}
  </span>
);

const Meter: React.FC<{ value: number; max: number; color: string; label: string }> = ({ value, max, color, label }) => (
  <div
    role="meter"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={value}
    style={{ height: 10, borderRadius: 5, background: BAR_TRACK, overflow: 'hidden', flex: 1 }}
  >
    <div style={{ height: '100%', width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%`, background: color, borderRadius: 5 }} />
  </div>
);

const SectionState: React.FC<{ section: Section<unknown>; loadingLabel: string; errorTitle: string; empty?: React.ReactNode }> = ({
  section,
  loadingLabel,
  errorTitle,
  empty,
}) => {
  if (section.loading) return <ManagerLoadingBlock rows={2} label={loadingLabel} />;
  if (section.error) return <ManagerErrorState title={errorTitle} />;
  return <>{empty}</>;
};

const DashboardInsights: React.FC<Props> = ({
  formatCurrency,
  activeOrders,
  sessions,
  pendingSessions,
  nowMs,
  actionError,
  onDismissActionError,
  onApprove,
  onReject,
  actionBusy,
  orderTypes,
  peakHours,
  topProducts,
  executiveSummary,
  forecast,
  leaderboard,
  churn,
}) => {
  const axisNumber = (value: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value);
  const active = sessions.data.filter((s) => s.isActive);
  const flow = FLOW_STAGES.map((stage) => ({
    ...stage,
    count: activeOrders.filter((o) => stage.statuses.includes(String(o.status).toUpperCase())).length,
  }));
  const flowTotal = flow.reduce((sum, stage) => sum + stage.count, 0);
  const typeMax = Math.max(0, ...orderTypes.data.map((row) => row.count));

  const peakSorted = [...peakHours.data].sort((a, b) => a.hour - b.hour);
  const busiest = peakSorted.reduce<PeakRow | null>((best, row) => (!best || row.orderCount > best.orderCount ? row : best), null);
  const quietest = peakSorted.reduce<PeakRow | null>((low, row) => (!low || row.orderCount < low.orderCount ? row : low), null);
  const peakRange = peakSorted.length
    ? Array.from({ length: peakSorted[peakSorted.length - 1].hour - peakSorted[0].hour + 1 }, (_, i) => peakSorted[0].hour + i)
    : [];
  const peakByHour = new Map(peakSorted.map((row) => [row.hour, row]));

  const products = topProducts.data.slice(0, 5);
  const productMax = Math.max(0, ...products.map((p) => p.revenue));
  const summary = executiveSummary.data;
  const changeText = (change: number | undefined) =>
    change === undefined || change === 0 ? null : `${change > 0 ? '+' : ''}${change}% vs previous period`;
  const fc = forecast.data;

  return (
    <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
      {actionError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px', background: t.redLight, borderRadius: t.radius.md, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', gap: 12,
          }}
        >
          <span style={{ fontSize: 14, color: t.red, fontWeight: 500 }}>{actionError}</span>
          <button type="button" onClick={onDismissActionError} style={{ ...secondaryButton, height: 30 }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', gap: 16 }}>
        <Card title="Active staff sessions" titleId="staff-sessions-title" subtitle={`${active.length} on shift`}>
          {sessions.loading || sessions.error ? (
            <SectionState section={sessions} loadingLabel="Loading sessions…" errorTitle="Could not load staff sessions" />
          ) : active.length === 0 ? (
            <ManagerEmptyState compact title="No active sessions" description="Nobody is clocked in right now." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                <thead>
                  <tr style={tableHeadBand}>
                    <th scope="col" style={th}>Staff</th>
                    <th scope="col" style={th}>Role</th>
                    <th scope="col" style={th}>On shift</th>
                    <th scope="col" style={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((session) => (
                    <tr key={session.id}>
                      <td style={td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                          <Initials name={session.employeeName} />
                          {session.employeeName || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ ...td, color: t.gray }}>{session.role}</td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{duration(session.loginTime, nowMs)}</td>
                      <td style={td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, color: t.black }}>
                          <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F8A5B' }} /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.grayLight}` }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: t.black }}>
              Pending session approvals ({pendingSessions.data.length})
            </h4>
            {pendingSessions.loading || pendingSessions.error ? (
              <SectionState section={pendingSessions} loadingLabel="Loading approvals…" errorTitle="Could not load pending sessions" />
            ) : pendingSessions.data.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: t.gray }}>No sessions awaiting approval.</p>
            ) : (
              pendingSessions.data.map((session) => (
                <div
                  key={session.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: `1px solid ${t.grayLight}` }}
                >
                  <Initials name={session.employeeName} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: t.black }}>{session.employeeName}</div>
                    <div style={{ fontSize: 13, color: t.gray }}>{session.role}</div>
                  </div>
                  <button type="button" style={secondaryButton} disabled={actionBusy} onClick={() => onReject(session.id)}>
                    Reject
                  </button>
                  <button type="button" style={primaryButton} disabled={actionBusy} onClick={() => onApprove(session.id)}>
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <Card title="Order types" titleId="order-types-title" subtitle="Orders and sales by type">
          {orderTypes.loading || orderTypes.error || orderTypes.data.length === 0 ? (
            <SectionState
              section={orderTypes}
              loadingLabel="Loading order types…"
              errorTitle="Could not load order types"
              empty={<ManagerEmptyState compact title="No order types yet" description="Breakdown needs completed orders." />}
            />
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
              {orderTypes.data.map((row) => (
                <li key={row.orderType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: t.black, marginBottom: 8 }}>
                    <span>{row.label}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <strong style={{ fontWeight: 600 }}>{row.count}</strong>
                      <span style={{ color: t.gray }}> · {formatCurrency(row.sales)}</span>
                    </span>
                  </div>
                  <Meter value={row.count} max={typeMax} color={TYPE_COLORS[row.orderType.toUpperCase()] || '#475569'} label={`${row.label} orders`} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Order flow" titleId="order-flow-title" subtitle="Share of active orders by stage">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
            {flow.map((stage) => (
              <li key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 92, fontSize: 15, color: t.black }}>{stage.label}</span>
                <Meter value={stage.count} max={flowTotal} color={stage.color} label={`${stage.label} orders`} />
                <span style={{ width: 28, textAlign: 'right', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {stage.count}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Executive summary" titleId="executive-summary-title" fill>
          {executiveSummary.loading || executiveSummary.error || !summary ? (
            <SectionState
              section={executiveSummary}
              loadingLabel="Loading summary…"
              errorTitle="Could not load executive summary"
              empty={<ManagerEmptyState compact title="No summary yet" description="Summary appears once analytics has data." />}
            />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                {[
                  { label: 'Revenue', value: formatCurrency(summary.revenue?.total ?? 0), hint: changeText(summary.revenue?.change) },
                  { label: 'Orders', value: String(summary.orders?.total ?? 0), hint: changeText(summary.orders?.change) },
                  { label: 'Customers at risk', value: String(summary.customers?.atRisk ?? 0), hint: null },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: t.black, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere', lineHeight: 1.2 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 13, color: t.gray, marginTop: 2 }}>{stat.label}</div>
                    {stat.hint && <div style={{ fontSize: 12, color: t.greenDark, marginTop: 2 }}>{stat.hint}</div>}
                  </div>
                ))}
              </div>
              {(summary.topInsights?.length ?? 0) > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.grayLight}` }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600, color: t.black }}>Key insights</h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
                    {summary.topInsights!.slice(0, 3).map((insight: string) => (
                      <li key={insight} style={{ display: 'flex', gap: 10, fontSize: 15, color: t.black }}>
                        <Check size={16} strokeWidth={2.25} color={t.black} aria-hidden style={{ marginTop: 3, flexShrink: 0 }} />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Card>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        <Card
          title="Peak hours"
          titleId="peak-hours-title"
          subtitle={
            busiest && quietest
              ? `Busiest ${String(busiest.hour).padStart(2, '0')}:00 (${busiest.orderCount} orders, ${formatCurrency(busiest.sales)}) · Quietest ${String(quietest.hour).padStart(2, '0')}:00`
              : undefined
          }
        >
          {peakHours.loading || peakHours.error || peakSorted.length === 0 ? (
            <SectionState
              section={peakHours}
              loadingLabel="Loading peak hours…"
              errorTitle="Could not load peak hours"
              empty={<ManagerEmptyState compact title="No peak-hour data" description="Hourly orders appear once orders are placed." />}
            />
          ) : (
            <BarChart
              ariaLabel="Orders by hour"
              formatAxis={axisNumber}
              labelEvery={2}
              color={PEAK_COLOR}
              width={560}
              height={340}
              data={peakRange.map((hour) => {
                const row = peakByHour.get(hour);
                return {
                  key: hour,
                  label: `${String(hour).padStart(2, '0')}:00`,
                  value: row?.orderCount ?? 0,
                  title: `${String(hour).padStart(2, '0')}:00 · ${row?.orderCount ?? 0} orders · ${formatCurrency(row?.sales ?? 0)}`,
                };
              })}
            />
          )}
        </Card>
        <Card title="Top selling products" titleId="top-products-title" subtitle="Ranked by revenue">
          {topProducts.loading || topProducts.error || products.length === 0 ? (
            <SectionState
              section={topProducts}
              loadingLabel="Loading products…"
              errorTitle="Could not load top products"
              empty={<ManagerEmptyState compact title="No sales yet" description="Top products appear after completed orders." />}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr style={tableHeadBand}>
                    <th scope="col" style={th}>#</th>
                    <th scope="col" style={th}>Product</th>
                    <th scope="col" style={{ ...th, textAlign: 'right' }}>Sold</th>
                    <th scope="col" style={{ ...th, textAlign: 'right' }}>Revenue</th>
                    <th scope="col" style={{ ...th, width: 150 }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.itemId}>
                      <td style={{ ...td, width: 44, color: t.gray, fontVariantNumeric: 'tabular-nums' }}>{product.rank}</td>
                      <td style={td}>{product.itemName}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{product.quantitySold}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(product.revenue)}</td>
                      <td style={td}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Meter value={product.revenue} max={productMax} color={PRODUCT_COLOR} label={`${product.itemName} revenue share`} />
                          <span style={{ width: 44, fontSize: 13, color: t.gray, fontVariantNumeric: 'tabular-nums' }}>
                            {(product.percentOfTotalRevenue ?? 0).toFixed(1)}%
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="7-day sales forecast"
        titleId="sales-forecast-title"
        subtitle={fc ? (fc.accuracy > 0 ? `Model accuracy ${Math.round(fc.accuracy)}% · ${fc.period.toLowerCase()}` : 'Estimate · model accuracy not measured yet') : undefined}
      >
        {forecast.loading || forecast.error || !fc || fc.items.length === 0 ? (
          <SectionState
            section={forecast}
            loadingLabel="Loading forecast…"
            errorTitle="Could not load sales forecast"
            empty={<ManagerEmptyState compact title="No forecast yet" description="The forecast is generated nightly." />}
          />
        ) : (
          <BarChart
            ariaLabel="Forecast sales for the next seven days"
            formatAxis={axisNumber}
            labelEvery={1}
            width={1120}
            height={260}
            color={FORECAST_COLOR}
            verticalGrid={false}
            valueLabel={(value) => formatCurrency(value)}
            data={fc.items.map((item) => ({
              key: item.date,
              label: new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
              value: item.forecastedSales,
              title: `${item.date} · ${formatCurrency(item.forecastedSales)}`,
            }))}
          />
        )}
      </Card>

      {(leaderboard.loading || leaderboard.error || (leaderboard.data && leaderboard.data.items.length > 0)) && (
        <Card title="Staff leaderboard" titleId="staff-leaderboard-title" subtitle={leaderboard.data?.period}>
          {leaderboard.loading || leaderboard.error || !leaderboard.data ? (
            <SectionState section={leaderboard} loadingLabel="Loading leaderboard…" errorTitle="Could not load staff leaderboard" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr style={tableHeadBand}>
                    <th scope="col" style={th}>#</th>
                    <th scope="col" style={th}>Staff</th>
                    <th scope="col" style={th}>Level</th>
                    <th scope="col" style={{ ...th, textAlign: 'right' }}>Orders</th>
                    <th scope="col" style={{ ...th, textAlign: 'right' }}>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.data.items.slice(0, 6).map((staff) => (
                    <tr key={staff.staffId}>
                      <td style={{ ...td, width: 44, color: t.gray }}>{staff.rank}</td>
                      <td style={td}>{staff.staffName}</td>
                      <td style={{ ...td, color: t.gray }}>{staff.performanceLevel}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{staff.ordersProcessed}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(staff.salesGenerated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {(churn.loading || churn.error || (churn.data && churn.data.items.length > 0)) && (
        <Card
          title="At-risk customers"
          titleId="at-risk-title"
          subtitle={churn.data ? `${churn.data.total} at risk · ${churn.data.high} high · ${churn.data.medium} medium · ${churn.data.low} low` : undefined}
        >
          {churn.loading || churn.error || !churn.data ? (
            <SectionState section={churn} loadingLabel="Loading customers…" errorTitle="Could not load churn prediction" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={tableHeadBand}>
                  <th scope="col" style={th}>Customer</th>
                  <th scope="col" style={th}>Last order</th>
                  <th scope="col" style={th}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {churn.data.items.slice(0, 5).map((customer) => {
                  const level = String(customer.riskLevel).toUpperCase();
                  const badge = level === 'HIGH' ? { bg: t.redLight, fg: t.red } : level === 'MEDIUM' ? { bg: t.warningLight, fg: t.warningDark } : { bg: t.blueLight, fg: t.blue };
                  return (
                    <tr key={customer.customerId}>
                      <td style={td}>{customer.customerName}</td>
                      <td style={{ ...td, color: t.gray }}>{customer.daysSinceLastOrder} days ago</td>
                      <td style={td}>
                        <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: badge.bg, color: badge.fg }}>
                          {level.charAt(0) + level.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
};

export default DashboardInsights;
