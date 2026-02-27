import React, { useState, useMemo } from 'react';
import { t, cardStyle, tabStyle, tableHeaderStyle, tableCellStyle, sectionTitleStyle, statusBadge, selectStyle } from './manager-tokens';
import {
  useGetAllInventoryItemsQuery,
  useGetLowStockAlertsQuery,
  useGetOutOfStockItemsQuery,
  useGetExpiringItemsQuery,
  useGetTotalInventoryValueQuery,
  useDeleteInventoryItemMutation,
  useGetAllSuppliersQuery,
  useGetActiveSuppliersQuery,
  useGetPreferredSuppliersQuery,
  useUpdateSupplierStatusMutation,
  useMarkSupplierPreferredMutation,
  useGetAllPurchaseOrdersQuery,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useSendPurchaseOrderMutation,
  useAutoGeneratePurchaseOrdersMutation,
  useGetAllWasteRecordsQuery,
  useGetTotalWasteCostQuery,
  useGetWasteCostByCategoryQuery,
  useGetTopWastedItemsQuery,
  useGetPreventableWasteAnalysisQuery,
} from '../../store/api/inventoryApi';
import type { InventoryItem, Supplier, PurchaseOrder } from '../../store/api/inventoryApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import StockAdjustmentDialog from '../../components/inventory/StockAdjustmentDialog';
import AddInventoryItemDialog from '../../components/inventory/AddInventoryItemDialog';
import AddSupplierDialog from '../../components/inventory/AddSupplierDialog';
import EditSupplierDialog from '../../components/inventory/EditSupplierDialog';
import CreatePurchaseOrderDialog from '../../components/inventory/CreatePurchaseOrderDialog';
import ReceivePurchaseOrderDialog from '../../components/inventory/ReceivePurchaseOrderDialog';
import RecordWasteDialog from '../../components/inventory/RecordWasteDialog';
import { format, subDays } from 'date-fns';

interface Props { storeId: string; activeTab: string; onTabChange: (tab: string) => void; }

const tabs = [
  { id: 'stock', label: 'Stock' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'purchase-orders', label: 'Purchase Orders' },
  { id: 'waste', label: 'Waste' },
];

const miniStat: React.CSSProperties = { ...cardStyle, padding: 14, textAlign: 'center' as const };
const statLabel: React.CSSProperties = { fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase' as const };
const statValue = (c?: string): React.CSSProperties => ({ fontSize: 22, fontWeight: 700, color: c || t.black, margin: '4px 0 0 0' });
const btn = (primary = false): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: t.radius.sm, border: primary ? 'none' : `1px solid ${t.grayLight}`,
  background: primary ? t.orange : t.white, color: primary ? t.white : t.black,
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
});
const alertBox = (color: string, bg: string): React.CSSProperties => ({
  padding: '10px 14px', background: bg, borderLeft: `4px solid ${color}`, borderRadius: t.radius.sm,
  fontSize: 12, color, marginBottom: 8, lineHeight: 1.5,
});

// ======================== STOCK TAB ========================
const StockTab = ({ storeId }: { storeId: string }) => {
  const { data: allItems = [], isLoading } = useGetAllInventoryItemsQuery(storeId, { skip: !storeId, pollingInterval: 60000 });
  const { data: lowStockItems = [] } = useGetLowStockAlertsQuery(storeId, { skip: !storeId });
  const { data: outOfStockItems = [] } = useGetOutOfStockItemsQuery(storeId, { skip: !storeId });
  const { data: expiringItems = [] } = useGetExpiringItemsQuery({ days: 7 }, { skip: !storeId });
  const { data: inventoryValue } = useGetTotalInventoryValueQuery(storeId, { skip: !storeId });
  const [deleteItem] = useDeleteInventoryItemMutation();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    let items = allItems;
    if (search) items = items.filter(i => i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase()));
    if (category) items = items.filter(i => i.category === category);
    if (stockFilter === 'inStock') items = items.filter(i => (i.quantity ?? i.currentStock ?? 0) > (i.reorderLevel ?? i.minimumStock ?? 0));
    if (stockFilter === 'lowStock') items = items.filter(i => { const q = i.quantity ?? i.currentStock ?? 0; const r = i.reorderLevel ?? i.minimumStock ?? 0; return q > 0 && q <= r; });
    if (stockFilter === 'outOfStock') items = items.filter(i => (i.quantity ?? i.currentStock ?? 0) === 0);
    return items;
  }, [allItems, search, category, stockFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this inventory item?')) {
      try { await deleteItem(id).unwrap(); } catch (e) { console.error('Delete failed:', e); }
    }
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading inventory...</div>;

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={miniStat}><p style={statLabel}>Total Items</p><p style={statValue()}>{allItems.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Total Value</p><p style={statValue(t.green)}>&#8377;{inventoryValue?.totalValue?.toLocaleString() || 0}</p></div>
        <div style={miniStat}><p style={statLabel}>Low Stock</p><p style={statValue(t.yellow)}>{lowStockItems.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Out of Stock</p><p style={statValue(t.red)}>{outOfStockItems.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Expiring Soon</p><p style={statValue(t.orange)}>{expiringItems.length}</p></div>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && <div style={alertBox(t.orangeDark, t.orangeLight)}><strong>Low Stock:</strong> {lowStockItems.length} items running low</div>}
      {outOfStockItems.length > 0 && <div style={alertBox(t.red, t.redLight)}><strong>Out of Stock:</strong> {outOfStockItems.length} items unavailable</div>}
      {expiringItems.length > 0 && <div style={alertBox(t.blue, '#EFF6FF')}><strong>Expiring Soon:</strong> {expiringItems.length} items expiring within 7 days</div>}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 1, minWidth: 200, padding: '8px 12px' }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
          <option value="">All Categories</option>
          <option value="RAW_MATERIAL">Raw Material</option>
          <option value="INGREDIENT">Ingredient</option>
          <option value="PACKAGING">Packaging</option>
          <option value="BEVERAGE">Beverage</option>
          <option value="OTHER">Other</option>
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} style={selectStyle}>
          <option value="">All Status</option>
          <option value="inStock">In Stock</option>
          <option value="lowStock">Low Stock</option>
          <option value="outOfStock">Out of Stock</option>
        </select>
        <button style={btn(true)} onClick={() => setAddOpen(true)}>+ Add Item</button>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Code', 'Name', 'Category', 'Stock', 'Available', 'Min Stock', 'Unit Cost', 'Status', 'Actions'].map(h =>
                <th key={h} style={tableHeaderStyle}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const qty = item.currentStock ?? item.quantity ?? 0;
              const minQty = item.minimumStock ?? item.reorderLevel ?? 0;
              const avail = qty - (item.reservedStock ?? 0);
              const st = qty === 0 ? 'OUT_OF_STOCK' : qty <= minQty ? 'LOW_STOCK' : 'AVAILABLE';
              return (
                <tr key={item.id}>
                  <td style={tableCellStyle}>{item.itemCode}</td>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{item.itemName}</td>
                  <td style={tableCellStyle}>{(item.category || '').replace('_', ' ')}</td>
                  <td style={tableCellStyle}>{qty} {item.unit}</td>
                  <td style={tableCellStyle}>{avail.toFixed(2)} {item.unit}</td>
                  <td style={tableCellStyle}>{minQty} {item.unit}</td>
                  <td style={tableCellStyle}>&#8377;{(item.unitCost ?? 0).toFixed(2)}</td>
                  <td style={tableCellStyle}>
                    <span style={statusBadge(st === 'AVAILABLE' ? 'COMPLETED' : st === 'LOW_STOCK' ? 'PREPARING' : 'CANCELLED')}>
                      {st.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <button style={btn()} onClick={() => { setSelectedItem(item); setAdjustOpen(true); }}>Adjust</button>{' '}
                    <button style={{ ...btn(), color: t.red, borderColor: t.red }} onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: t.grayMuted }}>{allItems.length > 0 ? 'No items match filters' : 'No inventory items found'}</p>}
      </div>

      {/* Dialogs */}
      {selectedItem && <StockAdjustmentDialog open={adjustOpen} onClose={() => { setAdjustOpen(false); setSelectedItem(null); }} item={selectedItem} />}
      <AddInventoryItemDialog open={addOpen} onClose={() => setAddOpen(false)} storeId={storeId} />
    </>
  );
};

// ======================== SUPPLIERS TAB ========================
const SuppliersTab = ({ storeId }: { storeId: string }) => {
  const { data: allSuppliers = [], isLoading: allLoading } = useGetAllSuppliersQuery('', { pollingInterval: 60000 });
  const { data: activeSuppliers = [] } = useGetActiveSuppliersQuery('');
  const { data: preferredSuppliers = [] } = useGetPreferredSuppliersQuery('');
  const [updateStatus] = useUpdateSupplierStatusMutation();
  const [markPreferred] = useMarkSupplierPreferredMutation();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PREFERRED'>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const suppliers = filter === 'ACTIVE' ? activeSuppliers : filter === 'PREFERRED' ? preferredSuppliers : allSuppliers;
  const filtered = suppliers.filter(s =>
    s.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    s.supplierCode.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = allSuppliers.filter(s => s.status === 'ACTIVE').length;
  const preferredCount = allSuppliers.filter(s => s.isPreferred).length;
  const avgRating = allSuppliers.length > 0 ? (allSuppliers.reduce((sum, s) => sum + s.qualityRating, 0) / allSuppliers.length).toFixed(1) : '0.0';

  if (allLoading) return <div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading suppliers...</div>;

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={miniStat}><p style={statLabel}>Total</p><p style={statValue()}>{allSuppliers.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Active</p><p style={statValue(t.green)}>{activeCount}</p></div>
        <div style={miniStat}><p style={statLabel}>Preferred</p><p style={statValue(t.orange)}>{preferredCount}</p></div>
        <div style={miniStat}><p style={statLabel}>Avg Rating</p><p style={statValue(t.blue)}>{avgRating}/5</p></div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 1, minWidth: 200, padding: '8px 12px' }} />
        {(['ALL', 'ACTIVE', 'PREFERRED'] as const).map(f => (
          <button key={f} style={filter === f ? { ...btn(true) } : btn()} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : 'Preferred'}
          </button>
        ))}
        <button style={btn(true)} onClick={() => setAddOpen(true)}>+ Add Supplier</button>
      </div>

      {/* Supplier Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {filtered.map(supplier => (
          <div key={supplier.id} style={{ ...cardStyle, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.black }}>{supplier.supplierName}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: t.grayMuted }}>{supplier.supplierCode}</p>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {supplier.status === 'ACTIVE' && <span style={statusBadge('COMPLETED')}>Active</span>}
                {supplier.isPreferred && <span style={statusBadge('READY')}>Preferred</span>}
              </div>
            </div>
            {[
              ['Contact', supplier.contactPerson],
              ['Phone', supplier.phone],
              ['Email', supplier.email],
              ['City', supplier.city],
              ['Payment', supplier.paymentTerms],
              ['Lead Time', `${supplier.leadTimeDays} days`],
              ['Quality', `${supplier.qualityRating}/5`],
              ['Delivery', `${supplier.deliveryRating}/5`],
              ['Orders', supplier.totalOrders],
            ].map(([label, val]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: t.gray }}>
                <span>{label}</span><strong style={{ color: t.black }}>{val}</strong>
              </div>
            ))}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${t.grayLight}`, display: 'flex', gap: 6 }}>
              <button style={btn()} onClick={() => { setSelectedSupplier(supplier); setEditOpen(true); }}>Edit</button>
              <button style={{ ...btn(), color: supplier.status === 'ACTIVE' ? t.orange : t.green }}
                onClick={async () => { try { await updateStatus({ id: supplier.id, status: supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }).unwrap(); } catch (e) { console.error(e); } }}>
                {supplier.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>
              <button style={{ ...btn(), color: supplier.isPreferred ? t.grayMuted : t.orange }}
                onClick={async () => { try { await markPreferred({ id: supplier.id, preferred: !supplier.isPreferred }).unwrap(); } catch (e) { console.error(e); } }}>
                {supplier.isPreferred ? 'Unmark' : 'Prefer'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: t.grayMuted }}>No suppliers found</p>}

      <AddSupplierDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {selectedSupplier && <EditSupplierDialog open={editOpen} onClose={() => { setEditOpen(false); setSelectedSupplier(null); }} supplier={selectedSupplier} />}
    </>
  );
};

// ======================== PURCHASE ORDERS TAB ========================
const PurchaseOrdersTab = ({ storeId }: { storeId: string }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: allOrders = [], isLoading } = useGetAllPurchaseOrdersQuery(storeId, { skip: !storeId, pollingInterval: 60000 });
  const [approvePO] = useApprovePurchaseOrderMutation();
  const [rejectPO] = useRejectPurchaseOrderMutation();
  const [sendPO] = useSendPurchaseOrderMutation();
  const [autoGenerate, { isLoading: generating }] = useAutoGeneratePurchaseOrdersMutation();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const filtered = statusFilter === 'ALL' ? allOrders : allOrders.filter(po => po.status === statusFilter);

  const pending = allOrders.filter(po => po.status === 'PENDING_APPROVAL').length;
  const sent = allOrders.filter(po => po.status === 'SENT').length;
  const totalVal = allOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  const handleApprove = async (po: PurchaseOrder) => {
    if (window.confirm(`Approve ${po.orderNumber}?`)) {
      try { await approvePO({ id: po.id, approvedBy: currentUser?.id || '' }).unwrap(); } catch (e) { console.error(e); }
    }
  };
  const handleReject = async (po: PurchaseOrder) => {
    const reason = prompt('Rejection reason:');
    if (reason) { try { await rejectPO({ id: po.id, rejectedBy: currentUser?.id || '', reason }).unwrap(); } catch (e) { console.error(e); } }
  };
  const handleSend = async (po: PurchaseOrder) => {
    if (window.confirm(`Send ${po.orderNumber} to supplier?`)) {
      try { await sendPO({ id: po.id, sentBy: currentUser?.id || '' }).unwrap(); } catch (e) { console.error(e); }
    }
  };
  const handleAutoGen = async () => {
    if (window.confirm('Auto-generate POs for all low stock items?')) {
      try { await autoGenerate({ createdBy: currentUser?.id || '' }).unwrap(); } catch (e) { console.error(e); }
    }
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading purchase orders...</div>;

  const poBadge = (status: string): React.CSSProperties => {
    const map: Record<string, string> = { DRAFT: 'PENDING', PENDING_APPROVAL: 'PREPARING', APPROVED: 'COMPLETED', SENT: 'READY', RECEIVED: 'COMPLETED', CANCELLED: 'CANCELLED', REJECTED: 'CANCELLED' };
    return statusBadge(map[status] || 'PENDING');
  };

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={miniStat}><p style={statLabel}>Total POs</p><p style={statValue()}>{allOrders.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Pending</p><p style={statValue(t.yellow)}>{pending}</p></div>
        <div style={miniStat}><p style={statLabel}>Sent</p><p style={statValue(t.blue)}>{sent}</p></div>
        <div style={miniStat}><p style={statLabel}>Total Value</p><p style={statValue(t.green)}>&#8377;{totalVal.toLocaleString()}</p></div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={btn(true)} onClick={() => setCreateOpen(true)}>+ Create PO</button>
        <button style={btn()} onClick={handleAutoGen} disabled={generating}>{generating ? 'Generating...' : 'Auto-Generate from Low Stock'}</button>
        <div style={{ flex: 1 }} />
        {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'RECEIVED'].map(s => (
          <button key={s} style={statusFilter === s ? btn(true) : btn()} onClick={() => setStatusFilter(s)}>
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* PO Cards */}
      {filtered.map(po => (
        <div key={po.id} style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.black }}>{po.orderNumber}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: t.grayMuted }}>Supplier: {po.supplierId}</p>
            </div>
            <span style={poBadge(po.status)}>{po.status.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            {[
              ['Order Date', format(new Date(po.orderDate), 'MMM dd, yyyy')],
              ['Expected', format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy')],
              ['Items', po.items.length],
              ['Total', `₹${po.totalAmount.toLocaleString()}`],
            ].map(([l, v]) => (
              <div key={l as string}><p style={{ margin: 0, fontSize: 11, color: t.grayMuted }}>{l}</p><p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: t.black }}>{v}</p></div>
            ))}
          </div>
          {/* Items preview */}
          <div style={{ background: t.bgMain, borderRadius: t.radius.sm, padding: 10, marginBottom: 10, fontSize: 12, color: t.gray }}>
            {po.items.slice(0, 3).map((item, i) => (
              <div key={i}>- {item.itemName} - {item.orderedQuantity} {item.unit} @ &#8377;{item.unitPrice}</div>
            ))}
            {po.items.length > 3 && <div style={{ color: t.grayMuted, marginTop: 4 }}>...and {po.items.length - 3} more</div>}
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            {po.status === 'PENDING_APPROVAL' && <>
              <button style={{ ...btn(), color: t.green }} onClick={() => handleApprove(po)}>Approve</button>
              <button style={{ ...btn(), color: t.red }} onClick={() => handleReject(po)}>Reject</button>
            </>}
            {po.status === 'APPROVED' && <button style={{ ...btn(), color: t.blue }} onClick={() => handleSend(po)}>Send to Supplier</button>}
            {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
              <button style={{ ...btn(), color: t.orange }} onClick={() => { setSelectedPO(po); setReceiveOpen(true); }}>Receive Goods</button>
            )}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: t.grayMuted }}>No purchase orders found</p>}

      <CreatePurchaseOrderDialog open={createOpen} onClose={() => setCreateOpen(false)} storeId={storeId} />
      {selectedPO && <ReceivePurchaseOrderDialog open={receiveOpen} onClose={() => { setReceiveOpen(false); setSelectedPO(null); }} purchaseOrder={selectedPO} />}
    </>
  );
};

// ======================== WASTE TAB ========================
const WasteTab = ({ storeId }: { storeId: string }) => {
  const [dateRange, setDateRange] = useState({ startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') });
  const [recordOpen, setRecordOpen] = useState(false);

  const { data: wasteRecords = [], isLoading } = useGetAllWasteRecordsQuery(storeId, { skip: !storeId, pollingInterval: 60000 });
  const { data: totalWaste } = useGetTotalWasteCostQuery({ startDate: dateRange.startDate, endDate: dateRange.endDate }, { skip: !storeId });
  const { data: wasteByCategory } = useGetWasteCostByCategoryQuery({ startDate: dateRange.startDate, endDate: dateRange.endDate }, { skip: !storeId });
  const { data: topWasted = [] } = useGetTopWastedItemsQuery({ startDate: dateRange.startDate, endDate: dateRange.endDate, limit: 10 });
  const { data: preventableWaste } = useGetPreventableWasteAnalysisQuery({ startDate: dateRange.startDate, endDate: dateRange.endDate });

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading waste data...</div>;

  const maxCat = wasteByCategory ? Math.max(...Object.values(wasteByCategory.categoryBreakdown || {}), 1) : 1;

  const wasteBadge = (type: string): React.CSSProperties => {
    const map: Record<string, string> = { EXPIRED: 'CANCELLED', SPOILED: 'CANCELLED', DAMAGED: 'PREPARING', OVERPRODUCTION: 'READY', PREPARATION_ERROR: 'PREPARING' };
    return statusBadge(map[type] || 'PENDING');
  };

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={miniStat}><p style={statLabel}>Total Cost</p><p style={statValue(t.red)}>&#8377;{totalWaste?.totalWasteCost?.toLocaleString() || 0}</p></div>
        <div style={miniStat}><p style={statLabel}>Records</p><p style={statValue()}>{totalWaste?.totalRecords || 0}</p></div>
        <div style={miniStat}><p style={statLabel}>Preventable Cost</p><p style={statValue(t.orange)}>&#8377;{preventableWaste?.preventableWasteCost?.toLocaleString() || 0}</p></div>
        <div style={miniStat}><p style={statLabel}>Preventable %</p><p style={statValue(t.yellow)}>{preventableWaste?.preventablePercentage?.toFixed(1) || 0}%</p></div>
      </div>

      {/* Date controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: t.gray }}>From:</span>
        <input type="date" value={dateRange.startDate} onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} style={{ ...selectStyle, padding: '6px 10px' }} />
        <span style={{ fontSize: 12, color: t.gray }}>To:</span>
        <input type="date" value={dateRange.endDate} onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} style={{ ...selectStyle, padding: '6px 10px' }} />
        <button style={btn(true)} onClick={() => setRecordOpen(true)}>+ Record Waste</button>
      </div>

      {/* Waste by Category */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
        <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Waste Cost by Category</h4>
        {wasteByCategory && Object.entries(wasteByCategory.categoryBreakdown || {}).map(([cat, cost]) => {
          const pct = (cost / maxCat) * 100;
          return (
            <div key={cat} style={{ position: 'relative', background: t.bgMain, borderRadius: t.radius.sm, padding: '10px 12px', marginBottom: 6, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: `${t.orange}20` }} />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{cat}</span>
                <span style={{ fontWeight: 700, color: t.orange }}>&#8377;{cost.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        {(!wasteByCategory || Object.keys(wasteByCategory.categoryBreakdown || {}).length === 0) &&
          <p style={{ fontSize: 12, color: t.grayMuted, textAlign: 'center', padding: 16 }}>No category data</p>}
      </div>

      {/* Top Wasted Items */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
        <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Top 10 Wasted Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Rank', 'Item', 'Total Qty', 'Total Cost'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {topWasted.map((item, i) => (
              <tr key={i}>
                <td style={tableCellStyle}>#{i + 1}</td>
                <td style={{ ...tableCellStyle, fontWeight: 600 }}>{item.itemName}</td>
                <td style={tableCellStyle}>{item.totalQuantity} {item.unit}</td>
                <td style={tableCellStyle}>&#8377;{item.totalCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topWasted.length === 0 && <p style={{ textAlign: 'center', padding: 20, color: t.grayMuted }}>No waste data for selected period</p>}
      </div>

      {/* Recent Records */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Recent Waste Records</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Date', 'Item', 'Type', 'Qty', 'Cost', 'Preventable'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {wasteRecords.slice(0, 10).map(rec => (
              <tr key={rec.id}>
                <td style={tableCellStyle}>{format(new Date(rec.recordedAt), 'MMM dd, yyyy')}</td>
                <td style={{ ...tableCellStyle, fontWeight: 600 }}>{rec.itemName}</td>
                <td style={tableCellStyle}><span style={wasteBadge(rec.wasteType)}>{rec.wasteType.replace('_', ' ')}</span></td>
                <td style={tableCellStyle}>{rec.quantity} {rec.unit}</td>
                <td style={tableCellStyle}>&#8377;{rec.wasteCost.toFixed(2)}</td>
                <td style={tableCellStyle}>{rec.isPreventable ? 'Yes' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RecordWasteDialog open={recordOpen} onClose={() => setRecordOpen(false)} storeId={storeId} />
    </>
  );
};

// ======================== MAIN SECTION ========================
const InventorySection: React.FC<Props> = ({ storeId, activeTab, onTabChange }) => {
  const currentTab = activeTab || 'stock';

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.id} style={tabStyle(currentTab === tab.id)} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {currentTab === 'stock' && <StockTab storeId={storeId} />}
      {currentTab === 'suppliers' && <SuppliersTab storeId={storeId} />}
      {currentTab === 'purchase-orders' && <PurchaseOrdersTab storeId={storeId} />}
      {currentTab === 'waste' && <WasteTab storeId={storeId} />}
    </div>
  );
};

export default InventorySection;
