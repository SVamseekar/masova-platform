import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, EllipsisVertical, Search, X } from 'lucide-react';
import AssignDriverModal from '../../components/modals/AssignDriverModal';
import {
  useGetRecentStoreOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderPriorityMutation,
  useCancelOrderMutation,
  useApproveCancelRequestMutation,
  useRejectCancelRequestMutation,
  type Order,
} from '../../store/api/orderApi';
import { ORDER_STATUS_CONFIG } from '../../types/order';
import type { OrderStatus, OrderPriority } from '../../types/order';
import { getApiErrorMessage } from '../utils/apiError';
import { useAppSelector } from '../../store/hooks';
import { selectCartCurrency } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import { t, surfaceCard, surfaceTitle, tableHeadBand, tableHeaderStyle, tableCellStyle } from './manager-tokens';
import { ManagerEmptyState, ManagerErrorState, ManagerLoadingBlock } from './components';
import { SOURCES, TYPE_LABELS, SourceCell, StatusCell, statusLabel } from './OrderUi';

interface Props {
  storeId: string;
  /** Section tab bar, rendered directly under the page title. */
  tabs: React.ReactNode;
}

const FINAL_STATUSES = ['CANCELLED', 'DELIVERED', 'SERVED', 'COMPLETED'];
const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
];
const PAGE_SIZE = 100;
const MAX_SIZE = 500;

const TIMELINES: Record<string, string[]> = {
  DELIVERY: ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  DINE_IN: ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY', 'SERVED'],
  TAKEAWAY: ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY', 'COMPLETED'],
};

const control: React.CSSProperties = {
  height: 40, borderRadius: 8, border: `1px solid ${t.grayLight}`, background: t.white, color: t.black,
  fontSize: 14, fontFamily: t.font, padding: '0 12px',
};

const primaryButton: React.CSSProperties = {
  height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#D94A22', color: t.white,
  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
};
const secondaryButton: React.CSSProperties = {
  height: 36, padding: '0 14px', borderRadius: 8, border: `1px solid ${t.borderControl}`, background: t.white,
  color: t.black, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
};

const th: React.CSSProperties = { ...tableHeaderStyle, borderBottom: 'none', padding: '10px 12px', fontWeight: 500, fontSize: 13 };
const td: React.CSSProperties = { ...tableCellStyle, padding: '8px 12px', height: 52, fontSize: 14, borderBottom: `1px solid ${t.grayLight}` };

const timeOf = (iso: string | undefined): string => {
  const d = iso ? new Date(iso) : null;
  return d && Number.isFinite(d.getTime()) ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
};

const dateTimeOf = (iso: string | undefined): string => {
  const d = iso ? new Date(iso) : null;
  return d && Number.isFinite(d.getTime())
    ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
};

const etaOf = (iso: string | undefined, nowMs: number): string => {
  if (!iso) return '—';
  const diff = Math.round((new Date(iso).getTime() - nowMs) / 60000);
  if (!Number.isFinite(diff)) return '—';
  return diff > 0 ? `${diff} min` : 'Overdue';
};

const itemCount = (order: Order): number => (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(24,34,31,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ ...surfaceCard, width: 'min(440px, 92vw)', borderRadius: 16, padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ ...surfaceTitle, marginBottom: 12 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
};

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  minWidth?: number;
}> = ({ label, value, onChange, options, minWidth = 130 }) => (
  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...control, appearance: 'none', paddingRight: 34, minWidth }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={14} aria-hidden style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: t.gray }} />
  </label>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', gap: 12, fontSize: 14, padding: '5px 0' }}>
    <span style={{ color: t.gray }}>{label}</span>
    <span style={{ color: t.black, overflowWrap: 'anywhere' }}>{value}</span>
  </div>
);

const Timeline: React.FC<{ order: Order }> = ({ order }) => {
  const stages = TIMELINES[order.orderType] || TIMELINES.DELIVERY;
  const cancelled = order.status === 'CANCELLED';
  const list = cancelled ? [...stages.slice(0, 1), 'CANCELLED'] : stages;
  const current = Math.max(0, list.indexOf(order.status));
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Order timeline">
      {list.map((stage, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={stage} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', alignItems: 'center', columnGap: 12, minHeight: 28 }}>
            <span style={{ position: 'relative', display: 'flex', justifyContent: 'center', height: '100%' }}>
              {index > 0 && <span aria-hidden style={{ position: 'absolute', top: 0, height: '50%', width: 1, background: t.grayLight }} />}
              {index < list.length - 1 && <span aria-hidden style={{ position: 'absolute', bottom: 0, height: '50%', width: 1, background: t.grayLight }} />}
              <span
                aria-hidden
                style={{
                  alignSelf: 'center', width: active ? 12 : 9, height: active ? 12 : 9, borderRadius: '50%', zIndex: 1,
                  background: active ? '#D94A22' : done ? t.gray : '#C9CCC5',
                }}
              />
            </span>
            <span style={{ fontSize: 14, color: active ? '#D94A22' : t.black, fontWeight: active ? 600 : 400 }}>
              {statusLabel(stage)}
              {active && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}> (current)</span>}
            </span>
            <span style={{ fontSize: 13, color: t.gray, fontVariantNumeric: 'tabular-nums' }}>
              {index === 0 ? timeOf(order.createdAt) : ''}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const OrdersTab: React.FC<Props> = ({ storeId, tabs }) => {
  const [searchParams] = useSearchParams();
  const [days, setDays] = useState(1);
  const [size, setSize] = useState(PAGE_SIZE);
  const { data: orders = [], isLoading, isError, error, refetch } = useGetRecentStoreOrdersQuery(
    { storeId, days, page: 0, size },
    { skip: !storeId, pollingInterval: 30000 },
  );
  const currency = useAppSelector(selectCartCurrency);
  const fmt = (value: number) => formatMajorAmount(value, currency);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateOrderPriority] = useUpdateOrderPriorityMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [approveCancelRequest, { isLoading: approvingCancel }] = useApproveCancelRequestMutation();
  const [rejectCancelRequest, { isLoading: rejectingCancel }] = useRejectCancelRequestMutation();

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rejectCancelOrderId, setRejectCancelOrderId] = useState<string | null>(null);
  const [rejectCancelReason, setRejectCancelReason] = useState('');
  const [assignDriver, setAssignDriver] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!menuId) return undefined;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuId(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuId]);

  const pendingCancelRequests = useMemo(
    () => orders.filter((o) => o.cancellationRequested && o.status !== 'CANCELLED'),
    [orders],
  );

  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (typeFilter) list = list.filter((o) => o.orderType === typeFilter);
    if (sourceFilter) list = list.filter((o) => (o.orderSource || 'MASOVA') === sourceFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        o.orderNumber?.toLowerCase().includes(q)
        || o.customerName?.toLowerCase().includes(q)
        || o.customerPhone?.toLowerCase().includes(q)
        || o.customerEmail?.toLowerCase().includes(q)
        || o.id?.toLowerCase().includes(q)
        || (o.items || []).some((item) => item.name?.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => {
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, statusFilter, typeFilter, sourceFilter, search]);

  const detail = detailId ? orders.find((o) => o.id === detailId) || null : null;
  const hasFilters = !!(statusFilter || typeFilter || sourceFilter || search);
  const rangeLabel = RANGES.find((r) => r.days === days)?.label || 'Today';
  const allChecked = filtered.length > 0 && filtered.every((o) => checked.has(o.id));
  const checkedOrders = filtered.filter((o) => checked.has(o.id));

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSourceFilter('');
    setSearch('');
  };

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(getApiErrorMessage(err, failure));
    }
  };

  const changeStatus = (order: Order, status: OrderStatus) =>
    run(() => updateOrderStatus({ orderId: order.id, status }).unwrap(), 'Could not update the order status.');
  const changePriority = (order: Order, priority: OrderPriority) =>
    run(() => updateOrderPriority({ orderId: order.id, priority }).unwrap(), 'Could not update the order priority.');

  const markCheckedUrgent = () =>
    run(
      () => Promise.all(checkedOrders
        .filter((o) => !FINAL_STATUSES.includes(o.status) && o.priority !== 'URGENT')
        .map((o) => updateOrderPriority({ orderId: o.id, priority: 'URGENT' }).unwrap())),
      'Could not mark the selected orders urgent.',
    );

  const confirmCancel = async () => {
    if (!cancelOrderId || !cancelReason.trim()) return;
    await run(async () => {
      await cancelOrder({ orderId: cancelOrderId, reason: cancelReason }).unwrap();
      setCancelOrderId(null);
      setCancelReason('');
    }, 'Could not cancel the order.');
  };

  const confirmRejectCancel = async () => {
    if (!rejectCancelOrderId) return;
    await run(async () => {
      await rejectCancelRequest({ orderId: rejectCancelOrderId, reason: rejectCancelReason || undefined }).unwrap();
      setRejectCancelOrderId(null);
      setRejectCancelReason('');
    }, 'Could not reject the cancellation request.');
  };

  const menuActions = (order: Order): Array<{ label: string; run: () => void; danger?: boolean }> => {
    if (FINAL_STATUSES.includes(order.status)) return [];
    const actions: Array<{ label: string; run: () => void; danger?: boolean }> = [];
    if (order.status === 'DISPATCHED' && order.orderType === 'DELIVERY') actions.push({ label: 'Mark delivered', run: () => void changeStatus(order, 'DELIVERED') });
    if (order.status === 'READY' && order.orderType === 'DINE_IN') actions.push({ label: 'Mark served', run: () => void changeStatus(order, 'SERVED') });
    if (order.status === 'READY' && order.orderType === 'TAKEAWAY') actions.push({ label: 'Mark picked up', run: () => void changeStatus(order, 'COMPLETED') });
    const flow = TIMELINES[order.orderType] || TIMELINES.DELIVERY;
    const next = flow[flow.indexOf(order.status) + 1];
    if (next && !['DELIVERED', 'SERVED', 'COMPLETED'].includes(next) && next !== 'OUT_FOR_DELIVERY') {
      actions.push({ label: `Move to ${statusLabel(next)}`, run: () => void changeStatus(order, next as OrderStatus) });
    }
    actions.push({
      label: order.priority === 'URGENT' ? 'Mark normal priority' : 'Mark urgent',
      run: () => void changePriority(order, order.priority === 'URGENT' ? 'NORMAL' : 'URGENT'),
    });
    if (order.orderType === 'DELIVERY' && !order.assignedDriverId) {
      actions.push({ label: 'Assign driver', run: () => setAssignDriver({ open: true, orderId: order.id }) });
    }
    actions.push({ label: 'Cancel order', danger: true, run: () => { setCancelOrderId(order.id); setCancelReason(''); } });
    return actions;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: t.black, lineHeight: 1.15 }}>Orders</h2>
          <p style={{ margin: '6px 0 0', fontSize: 16, color: t.gray }}>Manage and track orders from all channels.</p>
        </div>
        <div style={{ textAlign: 'right' }} aria-live="polite">
          <div style={{ fontSize: 28, fontWeight: 600, color: t.black, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
            {`${filtered.length} ${filtered.length === 1 ? 'order' : 'orders'}`}
          </div>
          <div style={{ fontSize: 14, color: t.gray, marginTop: 4 }}>
            {statusFilter ? `Status: ${statusLabel(statusFilter)}` : rangeLabel}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>{tabs}</div>

      {actionError && (
        <div role="alert" style={{ marginBottom: 12, padding: '12px 16px', background: t.redLight, borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 14, color: t.red, fontWeight: 500 }}>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} style={{ ...secondaryButton, height: 30 }}>Dismiss</button>
        </div>
      )}

      {pendingCancelRequests.length > 0 && (
        <section style={{ ...surfaceCard, marginBottom: 16, padding: 16 }} aria-label="Cancellation requests">
          <h3 style={{ ...surfaceTitle, fontSize: 15, marginBottom: 8 }}>Cancellation requests ({pendingCancelRequests.length})</h3>
          {pendingCancelRequests.map((order) => (
            <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${t.grayLight}`, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>#{order.orderNumber} · {order.customerName}</div>
                <div style={{ fontSize: 13, color: t.gray }}>
                  {order.cancellationRequestReason || 'No reason provided'}
                  {order.cancellationRequestedAt && ` · ${dateTimeOf(order.cancellationRequestedAt)}`}
                </div>
              </div>
              <button type="button" style={secondaryButton} disabled={approvingCancel || rejectingCancel} onClick={() => { setRejectCancelOrderId(order.id); setRejectCancelReason(''); }}>
                Reject
              </button>
              <button
                type="button"
                style={primaryButton}
                disabled={approvingCancel || rejectingCancel}
                onClick={() => void run(() => approveCancelRequest(order.id).unwrap(), 'Could not approve the cancellation.')}
              >
                Approve
              </button>
            </div>
          ))}
        </section>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <label style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380, display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search orders</span>
          <Search size={16} aria-hidden style={{ position: 'absolute', left: 12, color: t.gray }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order no., customer or item…"
            style={{ ...control, width: '100%', paddingLeft: 36, boxSizing: 'border-box' }}
          />
        </label>
        <Select
          label="Source"
          value={sourceFilter}
          onChange={setSourceFilter}
          options={[{ value: '', label: 'All sources' }, ...Object.entries(SOURCES).map(([value, info]) => ({ value, label: info.label }))]}
        />
        <Select
          label="Order type"
          value={typeFilter}
          onChange={setTypeFilter}
          minWidth={120}
          options={[{ value: '', label: 'All types' }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        {statusFilter ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 8, background: '#FFE5DA', color: '#B8400A', fontSize: 14, fontWeight: 500 }}>
            {statusLabel(statusFilter)}
            <button
              type="button"
              aria-label={`Remove status filter ${statusLabel(statusFilter)}`}
              onClick={() => setStatusFilter('')}
              style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'inline-flex', padding: 0 }}
            >
              <X size={14} aria-hidden />
            </button>
          </span>
        ) : (
          <Select
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: '', label: 'All statuses' }, ...Object.keys(ORDER_STATUS_CONFIG).map((s) => ({ value: s, label: statusLabel(s) }))]}
          />
        )}
        {hasFilters && (
          <button type="button" onClick={clearFilters} style={{ border: 'none', background: 'transparent', color: '#D9381E', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: t.font }}>
            Clear all
          </button>
        )}
        <span style={{ marginLeft: 'auto' }}>
          <Select
            label="Date range"
            value={String(days)}
            onChange={(v) => { setDays(Number(v)); setSize(PAGE_SIZE); setChecked(new Set()); }}
            minWidth={150}
            options={RANGES.map((r) => ({ value: String(r.days), label: r.label }))}
          />
        </span>
      </div>

      {checkedOrders.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 14, color: t.black }}>
          <strong>{checkedOrders.length} selected</strong>
          <button type="button" style={secondaryButton} onClick={() => void markCheckedUrgent()}>Mark urgent</button>
          <button type="button" style={{ border: 'none', background: 'transparent', color: t.gray, cursor: 'pointer', fontSize: 14, fontFamily: t.font }} onClick={() => setChecked(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {isError ? (
        <div style={surfaceCard}>
          <ManagerErrorState title="Failed to load orders for this store" onRetry={() => void refetch()} />
          <p style={{ fontSize: 12, color: t.grayMuted, margin: '8px 0 0' }}>{getApiErrorMessage(error, '')}</p>
        </div>
      ) : isLoading ? (
        <div style={surfaceCard}><ManagerLoadingBlock rows={4} label="Loading orders…" /></div>
      ) : filtered.length === 0 ? (
        <div style={surfaceCard}>
          <ManagerEmptyState
            title={orders.length === 0 ? `No orders ${days === 1 ? 'today' : 'in this period'}` : 'No orders match these filters'}
            description={orders.length === 0 ? 'Orders appear here as soon as they are placed.' : 'Try a different search or clear the filters.'}
            action={hasFilters ? <button type="button" style={secondaryButton} onClick={clearFilters}>Clear all</button> : undefined}
          />
        </div>
      ) : (
        <section style={{ ...surfaceCard, padding: 12 }} aria-label="Orders">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr style={tableHeadBand}>
                  <th scope="col" style={{ ...th, width: 40 }}>
                    <input
                      type="checkbox"
                      aria-label="Select all orders"
                      checked={allChecked}
                      onChange={() => setChecked(allChecked ? new Set() : new Set(filtered.map((o) => o.id)))}
                    />
                  </th>
                  {['Time', 'Order #', 'Customer', 'Source', 'Type', 'Items', 'Total', 'Status', 'ETA', 'Actions'].map((h) => (
                    <th key={h} scope="col" style={h === 'Actions' ? { ...th, textAlign: 'right' } : th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const selected = checked.has(order.id) || detailId === order.id;
                  const actions = menuId === order.id ? menuActions(order) : [];
                  return (
                    <tr key={order.id} style={{ background: selected ? t.selection : 'transparent' }}>
                      <td style={td}>
                        <input
                          type="checkbox"
                          aria-label={`Select order ${order.orderNumber}`}
                          checked={checked.has(order.id)}
                          onChange={() => {
                            const next = new Set(checked);
                            if (next.has(order.id)) next.delete(order.id); else next.add(order.id);
                            setChecked(next);
                          }}
                        />
                      </td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{timeOf(order.createdAt)}</td>
                      <td style={td}>
                        {order.orderNumber ? `#${order.orderNumber}` : '—'}
                        {order.priority === 'URGENT' && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: t.red }}>Urgent</span>}
                      </td>
                      <td style={td}>{order.customerName || '—'}</td>
                      <td style={td}><SourceCell source={order.orderSource} /></td>
                      <td style={td}>{TYPE_LABELS[order.orderType] || order.orderType}</td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{itemCount(order)}</td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(order.total) || 0)}</td>
                      <td style={td}><StatusCell status={String(order.status)} /></td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{FINAL_STATUSES.includes(order.status) ? '—' : etaOf(order.estimatedDeliveryTime, nowMs)}</td>
                      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setDetailId(detailId === order.id ? null : order.id)}
                          style={{ border: 'none', background: 'transparent', color: '#D9381E', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: t.font }}
                        >
                          View
                        </button>
                        {!FINAL_STATUSES.includes(order.status) && (
                          <span ref={menuId === order.id ? menuRef : undefined} style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              type="button"
                              aria-label={`More actions for order ${order.orderNumber}`}
                              aria-haspopup="menu"
                              aria-expanded={menuId === order.id}
                              onClick={() => setMenuId(menuId === order.id ? null : order.id)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: t.black, padding: 4, display: 'inline-flex' }}
                            >
                              <EllipsisVertical size={18} aria-hidden style={{ transform: 'rotate(90deg)' }} />
                            </button>
                            {menuId === order.id && (
                              <div
                                role="menu"
                                style={{
                                  position: 'absolute', right: 0, top: 30, minWidth: 190, zIndex: 20, textAlign: 'left',
                                  background: t.white, border: `1px solid ${t.grayLight}`, borderRadius: 12,
                                  boxShadow: '0 8px 24px rgba(24,34,31,0.12)', overflow: 'hidden',
                                }}
                              >
                                {actions.map((action) => (
                                  <button
                                    key={action.label}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => { setMenuId(null); action.run(); }}
                                    style={{
                                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                                      background: 'transparent', cursor: 'pointer', fontSize: 14, fontFamily: t.font,
                                      color: action.danger ? t.red : t.black,
                                    }}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </span>
                        )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {orders.length >= size && size < MAX_SIZE && (
            <div style={{ textAlign: 'center', paddingTop: 12 }}>
              <button type="button" style={secondaryButton} onClick={() => setSize(Math.min(size + PAGE_SIZE, MAX_SIZE))}>
                Load more orders
              </button>
            </div>
          )}
        </section>
      )}

      {detail && (
        <section style={{ ...surfaceCard, marginTop: 16 }} aria-label={`Order ${detail.orderNumber}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <h3 style={{ ...surfaceTitle, fontSize: 20 }}>#{detail.orderNumber} · {detail.customerName}</h3>
            <span style={{ padding: '6px 12px', borderRadius: 8, background: t.selection, fontSize: 14 }}><SourceCell source={detail.orderSource} /></span>
            <span style={{ padding: '6px 12px', borderRadius: 8, background: t.selection, fontSize: 14 }}>{TYPE_LABELS[detail.orderType] || detail.orderType}</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <StatusCell status={String(detail.status)} minWidth={0} />
              {!FINAL_STATUSES.includes(detail.status) && (
                <span style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.grayLight}`, fontSize: 14 }}>
                  ETA <strong style={{ fontWeight: 600 }}>{etaOf(detail.estimatedDeliveryTime, nowMs)}</strong>
                </span>
              )}
              <button
                type="button"
                aria-label="Close order details"
                onClick={() => setDetailId(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: t.black, display: 'inline-flex', padding: 4 }}
              >
                <X size={20} aria-hidden />
              </button>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24, paddingTop: 16, borderTop: `1px solid ${t.grayLight}` }}>
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>Items</h4>
              {(detail.items || []).map((item, i) => (
                <div key={`${item.menuItemId}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.grayLight}`, fontSize: 14 }}>
                  <span>
                    {item.quantity} × {item.name}
                    {item.variant && <span style={{ color: t.gray }}> ({item.variant})</span>}
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
              {detail.specialInstructions && (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: t.gray }}><strong style={{ color: t.black }}>Note: </strong>{detail.specialInstructions}</p>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>Order details</h4>
              <DetailRow label="Order no." value={detail.orderNumber ? `#${detail.orderNumber}` : '—'} />
              <DetailRow label="Customer" value={detail.customerName || '—'} />
              {detail.customerPhone && <DetailRow label="Phone" value={detail.customerPhone} />}
              {detail.deliveryAddress && (
                <DetailRow
                  label="Address"
                  value={[detail.deliveryAddress.street, [detail.deliveryAddress.pincode, detail.deliveryAddress.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                />
              )}
              <DetailRow label="Source" value={SOURCES[detail.orderSource || 'MASOVA']?.label || detail.orderSource} />
              <DetailRow label="Type" value={TYPE_LABELS[detail.orderType] || detail.orderType} />
              <DetailRow label="Payment" value={`${detail.paymentStatus.charAt(0) + detail.paymentStatus.slice(1).toLowerCase()}${detail.paymentMethod ? ` · ${detail.paymentMethod.replace(/_/g, ' ').toLowerCase()}` : ''}`} />
              <DetailRow label="Placed" value={dateTimeOf(detail.createdAt)} />
              {detail.createdByStaffName && <DetailRow label="Taken by" value={detail.createdByStaffName} />}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600, paddingBottom: 8, borderBottom: `1px solid ${t.grayLight}` }}>
                <span>Total</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(detail.total) || 0)}</span>
              </div>
              {[
                { label: 'Items', value: detail.subtotal },
                { label: 'Delivery fee', value: detail.deliveryFee },
                { label: Math.abs((Number(detail.subtotal) || 0) + (Number(detail.deliveryFee) || 0) - (Number(detail.total) || 0)) < 0.01 ? 'VAT (included)' : 'VAT', value: detail.tax },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: t.gray, padding: '8px 0', borderBottom: `1px solid ${t.grayLight}` }}>
                  <span>{row.label}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(row.value) || 0)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, paddingTop: 8 }}>
                <span>Total</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(detail.total) || 0)}</span>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>Order timeline</h4>
              <Timeline order={detail} />
            </div>
          </div>
        </section>
      )}

      {cancelOrderId && (
        <Modal title="Cancel order" onClose={() => { setCancelOrderId(null); setCancelReason(''); }}>
          <p style={{ fontSize: 14, color: t.gray, margin: '0 0 12px' }}>This action cannot be undone.</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation…"
            aria-label="Reason for cancellation"
            rows={3}
            style={{ ...control, height: 'auto', width: '100%', boxSizing: 'border-box', padding: 10, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" style={secondaryButton} onClick={() => { setCancelOrderId(null); setCancelReason(''); }}>Back</button>
            <button type="button" style={{ ...primaryButton, opacity: cancelReason.trim() ? 1 : 0.5 }} onClick={() => void confirmCancel()} disabled={!cancelReason.trim()}>
              Confirm cancel
            </button>
          </div>
        </Modal>
      )}

      {rejectCancelOrderId && (
        <Modal title="Reject cancellation request" onClose={() => { setRejectCancelOrderId(null); setRejectCancelReason(''); }}>
          <textarea
            value={rejectCancelReason}
            onChange={(e) => setRejectCancelReason(e.target.value)}
            placeholder="Optional reason…"
            aria-label="Reason for rejecting"
            rows={3}
            style={{ ...control, height: 'auto', width: '100%', boxSizing: 'border-box', padding: 10, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" style={secondaryButton} onClick={() => { setRejectCancelOrderId(null); setRejectCancelReason(''); }}>Back</button>
            <button type="button" style={primaryButton} onClick={() => void confirmRejectCancel()} disabled={rejectingCancel}>
              {rejectingCancel ? 'Rejecting…' : 'Confirm reject'}
            </button>
          </div>
        </Modal>
      )}

      <AssignDriverModal
        open={assignDriver.open}
        orderId={assignDriver.orderId}
        onClose={() => setAssignDriver({ open: false, orderId: '' })}
        onAssigned={() => { void refetch(); setAssignDriver({ open: false, orderId: '' }); }}
      />
    </div>
  );
};

export default OrdersTab;
