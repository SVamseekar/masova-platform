import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetTodaySalesMetricsQuery,
  useGetSalesTrendsQuery,
  useGetStaffLeaderboardQuery,
  useGetTopProductsQuery,
} from '../../store/api/analyticsApi';
import { useGetRecentStoreOrdersQuery, useGetStoreOrderSummaryQuery, type Order } from '../../store/api/orderApi';
import { derivedFromSummary } from '../../pages/manager/storeOrderMetrics';
import { useGetActiveStoreSessionsQuery } from '../../store/api/sessionApi';
import {
  useGetAllInventoryItemsQuery,
  useGetLowStockItemsQuery,
} from '../../store/api/inventoryApi';
import { pos, posTouchBtnBase } from './posTokens';
import {
  formatPosTime,
  sumOrderTotals,
  isSameBusinessDay,
  ordersInLastMs,
  deriveTopSellers,
  derivePaymentMix,
  paymentMethodBadgeStyle,
} from './posHelpers';
import { useRecordCashPaymentMutation } from '../../store/api/paymentApi';
import { getRtkErrorMessage } from '../shared/rtkError';
import { useSnackbar } from 'notistack';

interface PosReportsPanelProps {
  storeId?: string;
  isManager?: boolean;
  marketReady: boolean;
  locale?: string | null;
  storeCountryCode?: string | null;
  fmt: (n: number) => string;
  fmtOrder: (n: number, order: Order) => string;
  onClockIn?: () => void;
}

const panel: React.CSSProperties = {
  background: pos.surface,
  border: `1px solid ${pos.border}`,
  borderRadius: 10,
  padding: 16,
};

const PosReportsPanel: React.FC<PosReportsPanelProps> = ({
  storeId,
  isManager,
  marketReady,
  locale,
  storeCountryCode,
  fmt,
  fmtOrder,
  onClockIn,
}) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [recordCashPayment] = useRecordCashPaymentMutation();

  const {
    data: todayData,
    isLoading: todayLoading,
    isError: todayError,
    refetch: refetchToday,
  } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });
  const { data: weekData, isLoading: weekLoading, isError: weekError } = useGetSalesTrendsQuery(
    { period: 'WEEKLY', storeId },
    { skip: !storeId }
  );
  const { data: monthData, isLoading: monthLoading, isError: monthError } = useGetSalesTrendsQuery(
    { period: 'MONTHLY', storeId },
    { skip: !storeId }
  );
  const { data: topProducts, isLoading: topLoading } = useGetTopProductsQuery(
    { period: 'TODAY', sortBy: 'REVENUE', storeId },
    { skip: !storeId }
  );
  const { data: staffData, isLoading: staffLoading } = useGetStaffLeaderboardQuery(
    { period: 'TODAY', storeId },
    { skip: !storeId || !isManager }
  );
  const {
    data: storeSummary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useGetStoreOrderSummaryQuery({ storeId, days: 30 }, { skip: !storeId });
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useGetRecentStoreOrdersQuery({ storeId, days: 2, page: 0, size: 100 }, { skip: !storeId });
  const { data: sessions = [] } = useGetActiveStoreSessionsQuery(storeId || '', {
    skip: !storeId,
  });
  const { data: inventory = [], isError: inventoryError } = useGetAllInventoryItemsQuery(storeId, {
    skip: !storeId,
  });
  const { data: lowStock = [] } = useGetLowStockItemsQuery(storeId, { skip: !storeId });

  const todayOrders = useMemo(
    () => orders.filter((o) => isSameBusinessDay(o.createdAt, storeCountryCode)),
    [orders, storeCountryCode]
  );
  const weekOrders = useMemo(() => ordersInLastMs(orders, 7 * 86400000), [orders]);
  const monthOrders = useMemo(() => ordersInLastMs(orders, 30 * 86400000), [orders]);
  const reportOrders = todayOrders.length > 0 ? todayOrders : orders;

  const rolled = derivedFromSummary(storeSummary);
  const todaySales = (todayData?.todaySales || 0) > 0 ? todayData!.todaySales : (rolled.todaySales || sumOrderTotals(todayOrders.length ? todayOrders : reportOrders));
  const weekSales = (weekData?.totalSales || 0) > 0 ? weekData!.totalSales : (rolled.weekSales || sumOrderTotals(weekOrders));
  const monthSales = (monthData?.totalSales || 0) > 0 ? monthData!.totalSales : (rolled.monthSales || sumOrderTotals(monthOrders));
  const ticketCount = rolled.todayOrderCount || todayOrders.length || reportOrders.length;
  const aov = ticketCount > 0 ? todaySales / ticketCount : 0;
  const ordersLoadingCombined = ordersLoading || summaryLoading;
  const ordersErrorCombined = ordersError && summaryError;
  const refetchOrdersCombined = () => { void refetchOrders(); void refetchSummary(); };

  const derivedTop = useMemo(() => {
    if (rolled.topProducts.length) {
      return rolled.topProducts.map((p) => ({ name: p.itemName, qty: p.quantitySold, revenue: p.revenue }));
    }
    return deriveTopSellers(reportOrders);
  }, [rolled.topProducts, reportOrders]);
  const apiTop =
    topProducts?.topProducts?.map((p) => ({
      name: p.itemName,
      qty: p.quantitySold,
      revenue: p.revenue,
    })) ?? [];
  const topRows = apiTop.length > 0 ? apiTop : derivedTop;
  const mix = useMemo(() => derivePaymentMix(reportOrders), [reportOrders]);
  const mixTotal = mix.reduce((s, m) => s + m.total, 0);

  const handleMarkAsPaid = async (order: Order) => {
    const confirmed = window.confirm(
      `Mark this order as PAID?\n\nOrder: #${order.orderNumber}\nAmount: ${fmtOrder(order.total, order)}`
    );
    if (!confirmed) return;
    try {
      await recordCashPayment({
        orderId: order.id,
        amount: order.total,
        customerId: order.customerId || 'walk-in',
        customerEmail: order.customerEmail || undefined,
        customerPhone: order.customerPhone || '0000000000',
        storeId: order.storeId,
        orderType: order.orderType,
        paymentMethod: 'CASH',
        notes: `Cash payment recorded for Order #${order.orderNumber}`,
      }).unwrap();
      enqueueSnackbar(`Order #${order.orderNumber} marked as PAID`, { variant: 'success' });
    } catch (err: unknown) {
      enqueueSnackbar(getRtkErrorMessage(err, 'Failed to mark paid'), { variant: 'error' });
    }
  };

  if (!storeId) {
    return (
      <div
        data-testid="pos-reports-no-store"
        style={{
          padding: 40,
          textAlign: 'center',
          color: pos.muted,
          border: `1px dashed ${pos.border}`,
          borderRadius: 10,
        }}
      >
        Select a store to load reports.
      </div>
    );
  }

  const kpis = [
    {
      title: "Today's Sales",
      value: fmt(todaySales),
      sub: `${todayOrders.length || reportOrders.length} tickets`,
      loading: todayLoading && ordersLoading,
      error: todayError && ordersError,
    },
    {
      title: "Today's tickets",
      value: String(todayOrders.length || reportOrders.length),
      sub: todayOrders.length ? 'Business day' : 'All store tickets',
      loading: ordersLoading,
      error: ordersError,
    },
    {
      title: 'Avg ticket',
      value: fmt(aov),
      sub: 'Net of listed tickets',
      loading: ordersLoading,
    },
    {
      title: 'This Week',
      value: fmt(weekSales),
      sub: `${weekData?.totalOrders || weekOrders.length} orders`,
      loading: weekLoading && ordersLoading,
      error: weekError && ordersError,
    },
    {
      title: 'This Month',
      value: fmt(monthSales),
      sub: `${monthData?.totalOrders || monthOrders.length} orders`,
      loading: monthLoading && ordersLoading,
      error: monthError && ordersError,
    },
  ];

  return (
    <div data-testid="pos-reports-board" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!marketReady && (
        <div
          data-testid="pos-reports-market-loading"
          style={{
            padding: 12,
            borderRadius: 8,
            background: pos.infoSoft,
            border: `1px solid ${pos.info}`,
            color: pos.ink,
            fontSize: 13,
          }}
        >
          Loading store market (currency / country)…
        </div>
      )}

      {(todayError || ordersError) && (
        <div
          data-testid="pos-reports-error"
          style={{
            padding: 12,
            borderRadius: 8,
            background: pos.warningSoft,
            border: `1px solid ${pos.warning}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: pos.ink,
          }}
        >
          <span style={{ flex: 1 }}>Could not load one of the report sources. Store tickets still shown when available.</span>
          <button
            type="button"
            onClick={() => {
              void refetchToday();
              void refetchOrders();
            }}
            style={{ ...posTouchBtnBase, background: pos.role, color: '#fff' }}
          >
            Retry
          </button>
        </div>
      )}

      <div
        data-testid="metrics-tiles"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 10,
        }}
      >
        {kpis.map((k) => (
          <div
            key={k.title}
            data-testid={`pos-kpi-${k.title.toLowerCase().replace(/\s+/g, '-')}`}
            style={{
              ...panel,
              padding: '14px 16px',
              minHeight: 88,
            }}
          >
            <div style={{ fontSize: 11, color: pos.muted, marginBottom: 6 }}>{k.title}</div>
            {k.error ? (
              <div style={{ color: pos.error, fontSize: 13 }}>Unavailable</div>
            ) : k.loading ? (
              <div style={{ width: 72, height: 24, background: pos.border, borderRadius: 4 }} />
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 700, color: pos.ink, letterSpacing: '-0.03em' }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 11, color: pos.faint, marginTop: 4 }}>{k.sub}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        <section style={panel}>
          <header style={sectionHead}>
            <h3 style={h3}>Top sellers</h3>
            <button type="button" style={linkBtn} onClick={() => navigate('/manager?section=analytics&tab=products')}>
              Analytics
            </button>
          </header>
          {topLoading && topRows.length === 0 ? (
            <div data-testid="pos-top-sellers-loading" style={{ color: pos.muted }}>
              Loading…
            </div>
          ) : topRows.length === 0 ? (
            <div data-testid="pos-top-sellers-empty" style={emptyBox}>
              No item sales on these tickets yet.
            </div>
          ) : (
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topRows.slice(0, 6).map((item, i) => (
                <li key={item.name} style={row}>
                  <span style={{ color: pos.faint, width: 18, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 650, color: pos.ink }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: pos.muted }}>{item.qty} sold</div>
                  </span>
                  <span style={{ fontWeight: 650, color: pos.ink }}>{fmt(item.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section style={panel} data-testid="pos-payment-mix">
          <header style={sectionHead}>
            <h3 style={h3}>Payment mix</h3>
          </header>
          {mix.length === 0 ? (
            <div style={emptyBox}>No payments on these tickets yet.</div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mix.map((m) => {
                const pct = mixTotal > 0 ? Math.round((m.total / mixTotal) * 100) : 0;
                const chip = paymentMethodBadgeStyle(m.method);
                return (
                  <li key={m.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span
                        style={{
                          ...chip,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {m.method}
                      </span>
                      <span style={{ color: pos.ink }}>
                        {fmt(m.total)} · {m.count} · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: pos.surfaceAlt, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pos.role }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section style={panel}>
        <header style={sectionHead}>
          <h3 style={h3}>Recent tickets</h3>
          <button type="button" style={linkBtn} onClick={() => void refetchOrders()}>
            Refresh
          </button>
        </header>
        {ordersLoading ? (
          <div data-testid="pos-recent-orders-loading" style={{ color: pos.muted }}>
            Loading…
          </div>
        ) : ordersError ? (
          <div data-testid="pos-recent-orders-error" style={{ color: pos.error }}>
            Could not load orders.
          </div>
        ) : reportOrders.length === 0 ? (
          <div data-testid="pos-recent-orders-empty" style={emptyBox}>
            No orders for this store.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportOrders.slice(0, 8).map((order) => {
              const payStyle = paymentMethodBadgeStyle(order.paymentMethod);
              return (
                <div key={order.id} style={{ ...row, padding: '10px 0', borderBottom: `1px solid ${pos.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: pos.ink }}>#{order.orderNumber}</div>
                    <div style={{ fontSize: 12, color: pos.muted }}>
                      {formatPosTime(order.createdAt, locale)}
                      {order.customerName ? ` · ${order.customerName}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: pos.muted }}>{order.status.replace(/_/g, ' ')}</span>
                  <span
                    style={{
                      ...payStyle,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {order.paymentMethod || '—'}
                  </span>
                  <span style={{ fontWeight: 700, color: pos.ink, minWidth: 72, textAlign: 'right' }}>
                    {fmtOrder(order.total || 0, order)}
                  </span>
                  {order.paymentStatus === 'PENDING' && order.paymentMethod === 'CASH' && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAsPaid(order)}
                      style={{ ...posTouchBtnBase, minHeight: 36, background: pos.success, color: '#fff', fontSize: 12 }}
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        <section style={panel} data-testid="pos-staff-shift">
          <header style={sectionHead}>
            <h3 style={h3}>Staff on shift</h3>
            {isManager && (
              <button type="button" style={linkBtn} onClick={() => navigate('/manager?section=people&tab=staff')}>
                People
              </button>
            )}
          </header>
          {sessions.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((s) => (
                <li key={s.id} style={row}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: pos.success,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, color: pos.ink, fontWeight: 650 }}>{s.employeeName}</span>
                  <span style={{ fontSize: 12, color: pos.muted }}>{s.role || 'Staff'}</span>
                </li>
              ))}
            </ul>
          ) : staffLoading ? (
            <div style={{ color: pos.muted }}>Loading…</div>
          ) : staffData?.rankings?.length ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staffData.rankings.slice(0, 6).map((staff, i) => (
                <li key={staff.staffId} style={row}>
                  <span style={{ color: pos.faint, width: 18 }}>{i + 1}</span>
                  <span style={{ flex: 1, color: pos.ink, fontWeight: 650 }}>{staff.staffName}</span>
                  <span style={{ fontSize: 12, color: pos.muted }}>{staff.ordersProcessed} orders</span>
                  <span style={{ fontWeight: 650 }}>{fmt(staff.salesGenerated)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={emptyBox}>
              No one is clocked in.
              {onClockIn && isManager && (
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={onClockIn}
                    style={{ ...posTouchBtnBase, background: pos.successSoft, color: pos.successDark, border: `1px solid ${pos.success}` }}
                  >
                    Clock In
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section style={panel} data-testid="pos-inventory-pulse">
          <header style={sectionHead}>
            <h3 style={h3}>Stock</h3>
            <button type="button" style={linkBtn} onClick={() => navigate('/manager/inventory')}>
              Open stock
            </button>
          </header>
          {inventoryError ? (
            <div style={{ color: pos.error, fontSize: 13 }}>Inventory service unavailable.</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <Stat label="Items" value={String(inventory.length)} />
                <Stat label="Low stock" value={String(lowStock.length)} warn={lowStock.length > 0} />
              </div>
              {lowStock.length === 0 ? (
                <div style={{ fontSize: 13, color: pos.muted }}>No low-stock alerts.</div>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {lowStock.slice(0, 6).map((item) => (
                    <li key={item.id} style={row}>
                      <span style={{ flex: 1, color: pos.ink }}>{item.itemName}</span>
                      <span style={{ fontSize: 12, color: pos.warningDark }}>
                        {item.currentStock} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const sectionHead: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  gap: 8,
};

const h3: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: pos.ink,
  letterSpacing: '-0.01em',
};

const linkBtn: React.CSSProperties = {
  ...posTouchBtnBase,
  minHeight: 32,
  minWidth: 0,
  padding: '4px 10px',
  fontSize: 12,
  background: 'transparent',
  color: pos.muted,
  border: `1px solid ${pos.border}`,
};

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const emptyBox: React.CSSProperties = {
  padding: 20,
  textAlign: 'center',
  color: pos.muted,
  fontSize: 13,
};

const Stat: React.FC<{ label: string; value: string; warn?: boolean }> = ({ label, value, warn }) => (
  <div>
    <div style={{ fontSize: 11, color: pos.muted }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: warn ? pos.warningDark : pos.ink }}>{value}</div>
  </div>
);

export default PosReportsPanel;
