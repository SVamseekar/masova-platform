import React, { useState, useMemo } from 'react';
import { t, cardStyle, tabStyle, tableHeaderStyle, tableCellStyle, sectionTitleStyle, statusBadge, selectStyle } from './manager-tokens';
import {
  useGetStoreOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderPriorityMutation,
  useCancelOrderMutation,
  useAssignDriverMutation,
  useGetActiveDeliveriesCountQuery,
  Order,
} from '../../store/api/orderApi';
import {
  useGetTransactionsByStoreIdQuery,
  useGetReconciliationReportQuery,
  useInitiateRefundMutation,
} from '../../store/api/paymentApi';
import {
  useGetTodayMetricsQuery,
  useAutoDispatchMutation,
  useTrackOrderQuery,
  useGetAvailableDriversQuery,
} from '../../store/api/deliveryApi';
import { useGetUsersQuery } from '../../store/api/userApi';
import { useGetTodaySalesMetricsQuery } from '../../store/api/analyticsApi';
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, PAYMENT_STATUS_CONFIG } from '../../types/order';
import type { OrderStatus, OrderPriority } from '../../types/order';
import { format } from 'date-fns';

interface Props { storeId: string; activeTab: string; onTabChange: (tab: string) => void; }

const tabs = [
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'deliveries', label: 'Deliveries' },
];

// Shared styles
const miniStat: React.CSSProperties = { ...cardStyle, padding: 16, textAlign: 'center' as const };
const statLabel: React.CSSProperties = { fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
const statValue = (c?: string): React.CSSProperties => ({ fontSize: 22, fontWeight: 700, color: c || t.black, margin: '4px 0 0' });
const btn = (variant: 'primary' | 'danger' | 'secondary' | 'success'): React.CSSProperties => {
  const map = { primary: t.orange, danger: t.red, secondary: t.gray, success: t.green };
  return {
    padding: '6px 14px', borderRadius: t.radius.sm, border: `1px solid ${map[variant]}`,
    background: variant === 'primary' || variant === 'success' ? map[variant] : t.white,
    color: variant === 'primary' || variant === 'success' ? t.white : map[variant],
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
  };
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalBox: React.CSSProperties = {
  ...cardStyle, maxWidth: 600, width: '95%', maxHeight: '90vh', overflowY: 'auto' as const,
};

// ─── ORDERS TAB ───
const OrdersTab = ({ storeId }: { storeId: string }) => {
  const { data: orders = [], isLoading, refetch } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId, pollingInterval: 10000,
  });
  const { data: todaySalesMetrics, refetch: refetchAnalytics } = useGetTodaySalesMetricsQuery(storeId, { skip: !storeId });
  const { data: activeDeliveriesCount } = useGetActiveDeliveriesCountQuery(storeId, { skip: !storeId });
  const { data: users = [] } = useGetUsersQuery();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateOrderPriority] = useUpdateOrderPriorityMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [assignDriver] = useAssignDriverMutation();

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const drivers = users.filter(u => u.type === 'DRIVER');

  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter) list = list.filter(o => o.status === statusFilter);
    if (typeFilter) list = list.filter(o => o.orderType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q)
      );
    }
    // Urgent first, then newest
    return list.sort((a, b) => {
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, statusFilter, typeFilter, search]);

  const stats = {
    total: todaySalesMetrics?.todayOrderCount ?? orders.length,
    active: orders.filter(o => !['DELIVERED', 'SERVED', 'COMPLETED', 'CANCELLED'].includes(o.status)).length,
    delivered: orders.filter(o => ['DELIVERED', 'SERVED', 'COMPLETED'].includes(o.status)).length,
    revenue: todaySalesMetrics?.todaySales ?? orders.filter(o => ['DELIVERED', 'SERVED', 'COMPLETED'].includes(o.status)).reduce((s, o) => s + o.total, 0),
    activeDeliveries: activeDeliveriesCount?.count ?? 0,
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try { await updateOrderStatus({ orderId, status }).unwrap(); refetch(); refetchAnalytics(); }
    catch { alert('Failed to update status'); }
  };

  const handlePriorityChange = async (orderId: string, priority: OrderPriority) => {
    try { await updateOrderPriority({ orderId, priority }).unwrap(); }
    catch { alert('Failed to update priority'); }
  };

  const confirmCancel = async () => {
    if (!cancelOrderId || !cancelReason.trim()) return;
    try { await cancelOrder({ orderId: cancelOrderId, reason: cancelReason }).unwrap(); setCancelOrderId(null); setCancelReason(''); refetch(); refetchAnalytics(); }
    catch { alert('Failed to cancel order'); }
  };

  const handleAssignDriver = async (orderId: string) => {
    if (drivers.length === 0) { alert('No drivers available'); return; }
    const list = drivers.map((d, i) => `${i + 1}. ${d.name}`).join('\n');
    const sel = prompt(`Select driver:\n${list}\n\nEnter number:`);
    if (!sel) return;
    const idx = parseInt(sel) - 1;
    if (idx < 0 || idx >= drivers.length) { alert('Invalid selection'); return; }
    try { await assignDriver({ orderId, driverId: drivers[idx].id }).unwrap(); alert('Driver assigned'); }
    catch { alert('Failed to assign driver'); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fmtCurrency = (n: number) => `${n.toFixed(2)}`;

  return (
    <>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={miniStat}><p style={statLabel}>Total Orders</p><p style={statValue()}>{stats.total}</p></div>
        <div style={miniStat}><p style={statLabel}>Active</p><p style={statValue(t.orange)}>{stats.active}</p></div>
        <div style={miniStat}><p style={statLabel}>Delivered</p><p style={statValue(t.green)}>{stats.delivered}</p></div>
        <div style={miniStat}><p style={statLabel}>Revenue</p><p style={statValue(t.green)}>{fmtCurrency(stats.revenue)}</p></div>
        <div style={miniStat}><p style={statLabel}>Deliveries</p><p style={statValue(t.blue)}>{stats.activeDeliveries}</p></div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search orders..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, padding: '8px 12px', width: 220 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          {Object.keys(ORDER_STATUS_CONFIG).map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s as OrderStatus].label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All Types</option>
          {Object.keys(ORDER_TYPE_CONFIG).map(t => <option key={t} value={t}>{ORDER_TYPE_CONFIG[t as keyof typeof ORDER_TYPE_CONFIG].label}</option>)}
        </select>
        {(statusFilter || typeFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setTypeFilter(''); setSearch(''); }} style={{ ...btn('secondary'), padding: '4px 10px' }}>Clear</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: t.grayMuted }}>{filtered.length} orders</span>
      </div>

      {/* Table */}
      {isLoading ? <p style={{ color: t.gray, textAlign: 'center', padding: 40 }}>Loading orders...</p> : filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}><p style={{ color: t.grayMuted }}>No orders found</p></div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order', 'Customer', 'Type', 'Status', 'Payment', 'Total', 'Date', 'Actions'].map(h => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} style={{ background: order.priority === 'URGENT' ? t.redLight : 'transparent' }}>
                  <td style={tableCellStyle}>
                    <span style={{ fontWeight: 700, color: t.orange }}>#{order.orderNumber}</span>
                    {order.priority === 'URGENT' && <span style={{ marginLeft: 6, fontSize: 10, color: t.red, fontWeight: 700 }}>URGENT</span>}
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                    {order.customerPhone && <div style={{ fontSize: 11, color: t.grayMuted }}>{order.customerPhone}</div>}
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ ...statusBadge(order.orderType), background: t.orangeLight, color: t.orange }}>
                      {ORDER_TYPE_CONFIG[order.orderType]?.label || order.orderType}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {!['CANCELLED', 'DELIVERED', 'SERVED', 'COMPLETED'].includes(order.status) ? (
                      <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)} style={selectStyle}>
                        {['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY', 'DISPATCHED', 'DELIVERED', 'SERVED', 'COMPLETED'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span style={statusBadge(order.status)}>{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span>
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    <span style={statusBadge(order.paymentStatus)}>{PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}</span>
                    {order.paymentMethod && <div style={{ fontSize: 10, color: t.grayMuted, marginTop: 2 }}>{order.paymentMethod}</div>}
                  </td>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{fmtCurrency(order.total)}</td>
                  <td style={{ ...tableCellStyle, fontSize: 11 }}>{fmtDate(order.createdAt)}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button style={btn('primary')} onClick={() => setSelectedOrder(order)}>View</button>
                      {!['CANCELLED', 'DELIVERED', 'SERVED', 'COMPLETED'].includes(order.status) && (
                        <>
                          {order.status === 'DISPATCHED' && order.orderType === 'DELIVERY' && (
                            <button style={btn('success')} onClick={() => handleStatusChange(order.id, 'DELIVERED')}>Complete</button>
                          )}
                          {order.status === 'READY' && order.orderType === 'DINE_IN' && (
                            <button style={btn('success')} onClick={() => handleStatusChange(order.id, 'SERVED')}>Mark Served</button>
                          )}
                          {order.status === 'READY' && order.orderType === 'TAKEAWAY' && (
                            <button style={btn('success')} onClick={() => handleStatusChange(order.id, 'COMPLETED')}>Picked Up</button>
                          )}
                          <button style={btn('secondary')} onClick={() => handlePriorityChange(order.id, order.priority === 'URGENT' ? 'NORMAL' : 'URGENT')}>
                            {order.priority === 'URGENT' ? 'Normal' : 'Urgent'}
                          </button>
                          {order.orderType === 'DELIVERY' && !order.assignedDriverId && (
                            <button style={btn('primary')} onClick={() => handleAssignDriver(order.id)}>Assign</button>
                          )}
                          <button style={btn('danger')} onClick={() => { setCancelOrderId(order.id); setCancelReason(''); }}>Cancel</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: 18, color: t.orange }}>Order #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: t.gray }}>x</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
              <div><span style={{ color: t.gray }}>Customer: </span><strong>{selectedOrder.customerName}</strong></div>
              {selectedOrder.customerPhone && <div><span style={{ color: t.gray }}>Phone: </span>{selectedOrder.customerPhone}</div>}
              {(selectedOrder as any).customerEmail && <div><span style={{ color: t.gray }}>Email: </span>{(selectedOrder as any).customerEmail}</div>}
              <div><span style={{ color: t.gray }}>Status: </span><span style={statusBadge(selectedOrder.status)}>{ORDER_STATUS_CONFIG[selectedOrder.status]?.label}</span></div>
              <div><span style={{ color: t.gray }}>Type: </span>{ORDER_TYPE_CONFIG[selectedOrder.orderType]?.label}</div>
              <div><span style={{ color: t.gray }}>Payment: </span><span style={statusBadge(selectedOrder.paymentStatus)}>{PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.label}</span></div>
              <div><span style={{ color: t.gray }}>Method: </span>{selectedOrder.paymentMethod || 'N/A'}</div>
              <div><span style={{ color: t.gray }}>Created: </span>{fmtDate(selectedOrder.createdAt)}</div>
              {selectedOrder.createdByStaffName && <div><span style={{ color: t.gray }}>Taken By: </span>{selectedOrder.createdByStaffName}</div>}
            </div>
            {/* Items */}
            <h4 style={{ ...sectionTitleStyle, marginBottom: 8 }}>Items</h4>
            <div style={{ background: t.bgMain, borderRadius: t.radius.md, padding: 12, marginBottom: 12 }}>
              {selectedOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < selectedOrder.items.length - 1 ? `1px solid ${t.grayLight}` : 'none', fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 600, marginRight: 6 }}>{item.quantity}x</span>
                    <span>{item.name}</span>
                    {item.variant && <span style={{ fontSize: 11, color: t.grayMuted, marginLeft: 6 }}>({item.variant})</span>}
                  </div>
                  <span style={{ fontWeight: 600, color: t.orange }}>{fmtCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div style={{ borderTop: `2px solid ${t.grayLight}`, paddingTop: 12 }}>
              {selectedOrder.deliveryFee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ color: t.gray }}>Delivery Fee</span><span>{fmtCurrency(selectedOrder.deliveryFee)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}><span>Total</span><span style={{ color: t.orange }}>{fmtCurrency(selectedOrder.total)}</span></div>
            </div>
            {/* Delivery Address */}
            {selectedOrder.deliveryAddress && (
              <div style={{ marginTop: 12, padding: 10, background: t.bgMain, borderRadius: t.radius.sm, fontSize: 12 }}>
                <strong>Delivery: </strong>
                {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}
                {selectedOrder.deliveryAddress.pincode && ` ${selectedOrder.deliveryAddress.pincode}`}
              </div>
            )}
            {selectedOrder.specialInstructions && (
              <div style={{ marginTop: 8, padding: 10, background: t.orangeLight, borderRadius: t.radius.sm, fontSize: 12, color: t.orangeDark }}>
                <strong>Instructions: </strong>{selectedOrder.specialInstructions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelOrderId && (
        <div style={modalOverlay} onClick={() => { setCancelOrderId(null); setCancelReason(''); }}>
          <div style={{ ...modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, fontSize: 16, color: t.red, marginBottom: 12 }}>Cancel Order</h3>
            <p style={{ fontSize: 13, color: t.gray, marginBottom: 12 }}>This action cannot be undone.</p>
            <textarea
              value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              style={{ ...selectStyle, width: '100%', padding: 10, fontSize: 13, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button style={btn('secondary')} onClick={() => { setCancelOrderId(null); setCancelReason(''); }}>Back</button>
              <button style={{ ...btn('danger'), opacity: cancelReason.trim() ? 1 : 0.5 }} onClick={confirmCancel} disabled={!cancelReason.trim()}>Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── PAYMENTS TAB ───
const PaymentsTab = ({ storeId }: { storeId: string }) => {
  const [dateMode, setDateMode] = useState<'all' | 'date'>('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: allOrders = [], isLoading } = useGetStoreOrdersQuery(storeId, { skip: !storeId, pollingInterval: 30000 });
  const { data: report } = useGetReconciliationReportQuery(
    { date: selectedDate },
    { skip: !storeId || dateMode === 'all' }
  );

  const dateOrders = dateMode === 'all'
    ? allOrders.filter((o: any) => { const d = new Date(o.createdAt); const ago = new Date(); ago.setDate(ago.getDate() - 30); return d >= ago; })
    : allOrders.filter((o: any) => new Date(o.createdAt).toISOString().split('T')[0] === selectedDate);

  const orderPayments = dateOrders.map((o: any) => ({
    id: o.id, orderNumber: o.orderNumber, amount: o.total || 0,
    paymentMethod: o.paymentMethod || 'CASH',
    status: o.paymentStatus === 'PAID' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
    createdAt: o.createdAt, customerName: o.customerName,
  })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isSuccess = (p: any) => p.status === 'SUCCESS' || (p.paymentMethod === 'CASH' && p.status === 'PENDING');

  const customReport = dateMode === 'all' ? {
    totalTransactions: orderPayments.length,
    successfulTransactions: orderPayments.filter(isSuccess).length,
    successfulAmount: orderPayments.filter(isSuccess).reduce((s: number, p: any) => s + p.amount, 0),
    failedTransactions: orderPayments.filter((p: any) => p.status === 'FAILED').length,
    unreconciledCount: orderPayments.filter((p: any) => p.status === 'PENDING' && p.paymentMethod !== 'CASH').length,
    netAmount: orderPayments.filter(isSuccess).reduce((s: number, p: any) => s + p.amount, 0),
    paymentMethodBreakdown: orderPayments.reduce((acc: any, p: any) => {
      if (isSuccess(p)) acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>),
  } : null;

  const displayReport = dateMode === 'all' ? customReport : report;

  const paymentBadge = (status: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string }> = {
      SUCCESS: { bg: t.greenLight, color: t.greenDark },
      FAILED: { bg: t.redLight, color: t.red },
      PENDING: { bg: t.orangeLight, color: t.orange },
    };
    const s = map[status] || map.PENDING;
    return { padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color };
  };

  return (
    <>
      {/* Date filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
        <select value={dateMode} onChange={e => setDateMode(e.target.value as any)} style={selectStyle}>
          <option value="all">All (Last 30 Days)</option>
          <option value="date">Specific Date</option>
        </select>
        {dateMode === 'date' && (
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ ...selectStyle, padding: '6px 10px' }} />
        )}
      </div>

      {/* Stats */}
      {displayReport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={miniStat}><p style={statLabel}>Total Revenue</p><p style={statValue(t.green)}>{displayReport.successfulAmount.toFixed(2)}</p></div>
          <div style={miniStat}><p style={statLabel}>Net Amount</p><p style={statValue()}>{displayReport.netAmount.toFixed(2)}</p></div>
          <div style={miniStat}><p style={statLabel}>Transactions</p><p style={statValue()}>{displayReport.totalTransactions}</p></div>
          <div style={miniStat}><p style={statLabel}>Failed</p><p style={statValue(t.red)}>{displayReport.failedTransactions}</p></div>
        </div>
      )}

      {/* Payment Method Breakdown */}
      {displayReport?.paymentMethodBreakdown && Object.keys(displayReport.paymentMethodBreakdown).length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Payment Methods</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {Object.entries(displayReport.paymentMethodBreakdown).map(([method, amount]) => (
              <div key={method} style={{ textAlign: 'center', padding: 12, background: t.bgMain, borderRadius: t.radius.md }}>
                <div style={{ fontSize: 12, color: t.grayMuted, marginBottom: 4 }}>{method}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.orange }}>{typeof amount === 'number' ? amount.toFixed(2) : '0.00'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div style={cardStyle}>
        <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Recent Transactions</h4>
        {isLoading ? <p style={{ color: t.gray, textAlign: 'center', padding: 20 }}>Loading...</p> : orderPayments.length === 0 ? (
          <p style={{ color: t.grayMuted, textAlign: 'center', padding: 20 }}>No transactions found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Order', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {orderPayments.slice(0, 50).map((txn: any) => (
                <tr key={txn.id}>
                  <td style={tableCellStyle}>{txn.orderNumber || txn.id?.substring(0, 8)}</td>
                  <td style={tableCellStyle}>{txn.customerName || 'Walk-in'}</td>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{txn.amount.toFixed(2)}</td>
                  <td style={tableCellStyle}>{txn.paymentMethod}</td>
                  <td style={tableCellStyle}><span style={paymentBadge(txn.status)}>{txn.status}</span></td>
                  <td style={{ ...tableCellStyle, fontSize: 11 }}>{format(new Date(txn.createdAt), 'MMM dd, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

// ─── REFUNDS TAB ───
const RefundsTab = ({ storeId }: { storeId: string }) => {
  const { data: transactions = [], isLoading } = useGetTransactionsByStoreIdQuery(storeId, { skip: !storeId });
  const [initiateRefund, { isLoading: refundLoading }] = useInitiateRefundMutation();

  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');

  const refundable = transactions.filter((t: any) => t.status === 'SUCCESS' || t.status === 'PARTIAL_REFUND');

  const handleRefund = async () => {
    if (!selectedTxn || !refundAmount || !refundReason) { alert('Fill all fields'); return; }
    try {
      await initiateRefund({
        transactionId: selectedTxn.transactionId, amount: parseFloat(refundAmount),
        type: refundType, reason: refundReason, initiatedBy: 'manager', speed: 'normal',
      }).unwrap();
      alert('Refund initiated');
      setSelectedTxn(null); setRefundAmount(''); setRefundReason('');
    } catch { alert('Failed to initiate refund'); }
  };

  const refundBadge = (status: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string }> = {
      SUCCESS: { bg: t.greenLight, color: t.greenDark },
      PARTIAL_REFUND: { bg: t.orangeLight, color: t.orange },
      REFUNDED: { bg: '#DBEAFE', color: t.blue },
    };
    const s = map[status] || { bg: t.grayLight, color: t.gray };
    return { padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedTxn ? '1fr 360px' : '1fr', gap: 20 }}>
      {/* Transactions list */}
      <div style={cardStyle}>
        <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Refundable Transactions</h4>
        {isLoading ? <p style={{ color: t.gray, textAlign: 'center', padding: 20 }}>Loading...</p> : refundable.length === 0 ? (
          <p style={{ color: t.grayMuted, textAlign: 'center', padding: 20 }}>No refundable transactions</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Order', 'Customer', 'Amount', 'Status', 'Date', ''].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {refundable.map((txn: any) => (
                <tr key={txn.transactionId} style={{ background: selectedTxn?.transactionId === txn.transactionId ? t.orangeLight : 'transparent', cursor: 'pointer' }}
                  onClick={() => { setSelectedTxn(txn); setRefundAmount(txn.amount.toString()); setRefundType('FULL'); }}>
                  <td style={tableCellStyle}>{txn.orderId}</td>
                  <td style={tableCellStyle}>{txn.customerEmail || 'N/A'}</td>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{txn.amount.toFixed(2)}</td>
                  <td style={tableCellStyle}><span style={refundBadge(txn.status)}>{txn.status}</span></td>
                  <td style={{ ...tableCellStyle, fontSize: 11 }}>{format(new Date(txn.createdAt), 'MMM dd, yyyy')}</td>
                  <td style={tableCellStyle}><button style={btn('danger')} onClick={e => { e.stopPropagation(); setSelectedTxn(txn); setRefundAmount(txn.amount.toString()); setRefundType('FULL'); }}>Refund</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Refund form */}
      {selectedTxn && (
        <div style={{ ...cardStyle, height: 'fit-content', position: 'sticky', top: 0 }}>
          <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Initiate Refund</h4>
          <div style={{ background: t.bgMain, borderRadius: t.radius.sm, padding: 10, marginBottom: 12, fontSize: 12, color: t.gray }}>
            <div><strong>Order:</strong> {selectedTxn.orderId}</div>
            <div><strong>Amount:</strong> {selectedTxn.amount.toFixed(2)}</div>
            <div><strong>Method:</strong> {selectedTxn.paymentMethod || 'N/A'}</div>
          </div>
          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['FULL', 'PARTIAL'] as const).map(rt => (
              <button key={rt} style={{ flex: 1, ...btn(refundType === rt ? 'primary' : 'secondary') }}
                onClick={() => { setRefundType(rt); if (rt === 'FULL') setRefundAmount(selectedTxn.amount.toString()); else setRefundAmount(''); }}>
                {rt === 'FULL' ? 'Full Refund' : 'Partial'}
              </button>
            ))}
          </div>
          {/* Amount */}
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.black, marginBottom: 4 }}>Amount</label>
          <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} disabled={refundType === 'FULL'}
            style={{ ...selectStyle, width: '100%', padding: '8px 10px', marginBottom: 12 }} />
          {/* Reason */}
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.black, marginBottom: 4 }}>Reason *</label>
          <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Reason for refund..." rows={3}
            style={{ ...selectStyle, width: '100%', padding: '8px 10px', resize: 'vertical', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, ...btn('primary'), opacity: refundLoading || !refundAmount || !refundReason ? 0.5 : 1 }}
              onClick={handleRefund} disabled={refundLoading || !refundAmount || !refundReason}>
              {refundLoading ? 'Processing...' : `Refund ${refundAmount}`}
            </button>
            <button style={btn('secondary')} onClick={() => { setSelectedTxn(null); setRefundAmount(''); setRefundReason(''); }}>Cancel</button>
          </div>
          <p style={{ fontSize: 11, color: t.grayMuted, textAlign: 'center', marginTop: 8 }}>Refunds take 5-7 business days</p>
        </div>
      )}
    </div>
  );
};

// ─── DELIVERIES TAB ───
const DeliveriesTab = ({ storeId }: { storeId: string }) => {
  const { data: allOrders = [], isLoading } = useGetStoreOrdersQuery(storeId, { skip: !storeId, pollingInterval: 30000 });
  const { data: todayMetrics } = useGetTodayMetricsQuery(storeId, { skip: !storeId });
  const { data: availableDrivers = [] } = useGetAvailableDriversQuery(storeId, { skip: !storeId, pollingInterval: 30000 });
  const [autoDispatch, { isLoading: dispatching }] = useAutoDispatchMutation();
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const { data: trackingData, isError: trackingError } = useTrackOrderQuery(trackingOrderId, { skip: !trackingOrderId, pollingInterval: 10000 });

  const deliveryOrders = allOrders.filter((o: any) => o.orderType === 'DELIVERY');
  const readyOrders = deliveryOrders.filter((o: any) => o.status === 'BAKED');
  const outOrders = deliveryOrders.filter((o: any) => o.status === 'DISPATCHED');
  const today = new Date().toDateString();
  const completedToday = deliveryOrders.filter((o: any) => ['DELIVERED', 'SERVED', 'COMPLETED'].includes(o.status) && new Date(o.createdAt).toDateString() === today).length;

  const handleDispatch = async (orderId: string) => {
    try {
      await autoDispatch({ orderId, storeId, priorityLevel: 'MEDIUM' }).unwrap();
      alert('Driver dispatched');
    } catch (err: any) {
      alert(`Failed: ${err?.data?.message || 'Unknown error'}`);
    }
  };

  const orderRow: React.CSSProperties = { ...cardStyle, padding: 14, marginBottom: 10 };

  return (
    <>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={miniStat}><p style={statLabel}>Active Deliveries</p><p style={statValue(t.orange)}>{outOrders.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Completed Today</p><p style={statValue(t.green)}>{completedToday}</p></div>
        <div style={miniStat}><p style={statLabel}>Ready to Dispatch</p><p style={statValue(t.blue)}>{readyOrders.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Drivers Available</p><p style={statValue()}>{availableDrivers.length}</p></div>
      </div>

      {/* Ready for Dispatch */}
      <h4 style={{ ...sectionTitleStyle, marginBottom: 10 }}>Ready for Dispatch ({readyOrders.length})</h4>
      {isLoading ? <p style={{ color: t.gray, textAlign: 'center', padding: 20 }}>Loading...</p> : readyOrders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 20, marginBottom: 20 }}><p style={{ color: t.grayMuted }}>No orders ready</p></div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {readyOrders.map((order: any) => (
            <div key={order.id} style={orderRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, color: t.orange, fontSize: 14 }}>#{order.orderNumber}</span>
                  <span style={{ marginLeft: 10, fontSize: 13, color: t.black }}>{order.customerName}</span>
                  <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, color: t.orange }}>{order.total?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={statusBadge('READY')}>READY</span>
                  <button style={btn('primary')} onClick={() => handleDispatch(order.id)} disabled={dispatching}>
                    {dispatching ? 'Dispatching...' : 'Auto-Dispatch'}
                  </button>
                </div>
              </div>
              {order.deliveryAddress && (
                <div style={{ fontSize: 12, color: t.grayMuted, marginTop: 6 }}>
                  {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.pincode].filter(Boolean).join(', ')}
                </div>
              )}
              {order.customerPhone && <div style={{ fontSize: 11, color: t.grayMuted, marginTop: 2 }}>Phone: {order.customerPhone}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Out for Delivery */}
      <h4 style={{ ...sectionTitleStyle, marginBottom: 10 }}>Out for Delivery ({outOrders.length})</h4>
      {outOrders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 20 }}><p style={{ color: t.grayMuted }}>No orders out for delivery</p></div>
      ) : (
        <div>
          {outOrders.map((order: any) => (
            <div key={order.id} style={orderRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, color: t.orange, fontSize: 14 }}>#{order.orderNumber}</span>
                  <span style={{ marginLeft: 10, fontSize: 13, color: t.black }}>{order.customerName}</span>
                  <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, color: t.orange }}>{order.total?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ ...statusBadge('PENDING'), background: '#DBEAFE', color: t.blue }}>DISPATCHED</span>
                  <button style={btn('secondary')} onClick={() => setTrackingOrderId(order.id)}>Track</button>
                </div>
              </div>
              {order.deliveryAddress && (
                <div style={{ fontSize: 12, color: t.grayMuted, marginTop: 6 }}>
                  {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.pincode].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrderId && (
        <div style={modalOverlay} onClick={() => setTrackingOrderId('')}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: 16 }}>Order Tracking</h3>
              <button onClick={() => setTrackingOrderId('')} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: t.gray }}>x</button>
            </div>
            {trackingError ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ color: t.red, fontWeight: 600, marginBottom: 8 }}>Unable to track this order</p>
                <p style={{ fontSize: 12, color: t.grayMuted }}>The driver may not have started sharing location yet.</p>
              </div>
            ) : !trackingData ? (
              <p style={{ color: t.gray, textAlign: 'center', padding: 20 }}>Loading tracking data...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: t.gray }}>Driver: </span><strong>{(trackingData as any).driver?.driverName || trackingData.driverName || 'N/A'}</strong></div>
                <div><span style={{ color: t.gray }}>Phone: </span>{(trackingData as any).driver?.driverPhone || trackingData.driverPhone || 'N/A'}</div>
                <div><span style={{ color: t.gray }}>Status: </span><span style={statusBadge((trackingData as any).orderStatus || 'DISPATCHED')}>{(trackingData as any).orderStatus || trackingData.status || 'N/A'}</span></div>
                <div><span style={{ color: t.gray }}>ETA: </span>{
                  (trackingData as any).estimatedArrivalMinutes != null
                    ? new Date(Date.now() + (trackingData as any).estimatedArrivalMinutes * 60000).toLocaleTimeString()
                    : trackingData.estimatedArrival ? new Date(trackingData.estimatedArrival).toLocaleTimeString() : 'Calculating...'
                }</div>
                <div><span style={{ color: t.gray }}>Distance: </span>{
                  (trackingData as any).distanceRemainingKm != null
                    ? Number((trackingData as any).distanceRemainingKm).toFixed(2) + ' km'
                    : trackingData.distanceRemaining ? (trackingData.distanceRemaining / 1000).toFixed(2) + ' km' : 'N/A'
                }</div>
                <div><span style={{ color: t.gray }}>Updated: </span>{trackingData.lastUpdated ? new Date(trackingData.lastUpdated).toLocaleTimeString() : 'N/A'}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ─── MAIN SECTION ───
const OrdersSection: React.FC<Props> = ({ storeId, activeTab, onTabChange }) => {
  const currentTab = activeTab || 'orders';

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: t.bgMain, padding: 6, borderRadius: t.radius.md, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} style={tabStyle(currentTab === tab.id)} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {currentTab === 'orders' && <OrdersTab storeId={storeId} />}
      {currentTab === 'payments' && <PaymentsTab storeId={storeId} />}
      {currentTab === 'refunds' && <RefundsTab storeId={storeId} />}
      {currentTab === 'deliveries' && <DeliveriesTab storeId={storeId} />}
    </div>
  );
};

export default OrdersSection;
