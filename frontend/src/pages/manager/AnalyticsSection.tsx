import React, { useState } from 'react';
const PlatformPnLPage = React.lazy(() => import('./PlatformPnLPage'));
import { t, cardStyle, tabStyle, sectionTitleStyle, statusBadge, tableHeaderStyle, tableCellStyle, selectStyle } from './manager-tokens';
import {
  useGetTopProductsQuery,
} from '../../store/api/analyticsApi';
import {
  useGetEquipmentByStoreQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentStatusMutation,
  useToggleEquipmentPowerMutation,
  useUpdateTemperatureMutation,
  useDeleteEquipmentMutation,
  KitchenEquipment,
} from '../../store/api/equipmentApi';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import RevenueBreakdownChart from '../../components/charts/RevenueBreakdownChart';
import PeakHoursHeatmap from '../../components/charts/PeakHoursHeatmap';

interface Props { storeId: string; activeTab: string; onTabChange: (tab: string) => void; }

const tabs = [
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'products', label: 'Products' },
  { id: 'reports', label: 'Reports' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'platform-pnl', label: 'Platform P&L' },
];

// Shared styles
const miniStat: React.CSSProperties = { ...cardStyle, padding: 16, textAlign: 'center' };
const statLabel: React.CSSProperties = { fontSize: 12, color: t.gray, margin: 0 };
const statValue = (color?: string): React.CSSProperties => ({ fontSize: 22, fontWeight: 700, color: color || t.black, margin: '4px 0 0 0' });
const btn = (bg: string): React.CSSProperties => ({ padding: '8px 16px', background: bg, color: t.white, border: 'none', borderRadius: t.radius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: t.font });
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const modalBox: React.CSSProperties = { ...cardStyle, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' };
const formGroup: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: t.gray, marginBottom: 4 };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${t.grayLight}`, borderRadius: t.radius.sm, fontSize: 14, fontFamily: t.font, boxSizing: 'border-box' };
const chipStyle = (color: string): React.CSSProperties => ({ display: 'inline-block', padding: '3px 10px', background: color, color: t.white, fontSize: 11, fontWeight: 600, borderRadius: 20 });
const alertBox = (color: string): React.CSSProperties => ({ padding: '12px 16px', background: color + '15', borderLeft: `4px solid ${color}`, borderRadius: t.radius.sm, marginBottom: 10, fontSize: 13, color: color, fontWeight: 500 });

// ============================================================
// KITCHEN TAB
// ============================================================
interface PrepTimeByItem { [itemName: string]: number; }
interface PrepTimeDistribution { min: number; max: number; average: number; median: number; p90: number; p95: number; totalOrders: number; }
interface StaffPerf { staffId: string; totalOrders: number; completedOrders: number; averagePreparationTime: number; failedQualityChecks: number; completionRate: number; }

const KitchenTab = ({ storeId }: { storeId: string }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data - backend kitchen analytics endpoints would replace these
  const prepTimeByItem: PrepTimeByItem = {
    'Margherita Pizza': 18, 'Chicken Biryani': 25, 'Masala Dosa': 12,
    'Paneer Butter Masala': 15, 'Hakka Noodles': 10, 'Filter Coffee': 3, 'Gulab Jamun': 2,
  };
  const prepTimeDistribution: PrepTimeDistribution = { min: 5, max: 35, average: 16.5, median: 15, p90: 25, p95: 30, totalOrders: 45 };
  const staffPerformance: StaffPerf[] = [
    { staffId: 'staff1', totalOrders: 25, completedOrders: 24, averagePreparationTime: 15.2, failedQualityChecks: 1, completionRate: 96.0 },
    { staffId: 'staff2', totalOrders: 20, completedOrders: 19, averagePreparationTime: 17.8, failedQualityChecks: 2, completionRate: 95.0 },
  ];

  const sortedPrepTimes = Object.entries(prepTimeByItem).sort((a, b) => b[1] - a[1]);
  const getChipColor = (time: number) => time > 20 ? t.red : time > 15 ? t.yellow : t.green;

  return (
    <>
      {/* Date selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ ...input, width: 'auto' }} />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={miniStat}><p style={statLabel}>Avg Prep Time</p><p style={statValue(t.orange)}>{prepTimeDistribution.average.toFixed(1)} min</p></div>
        <div style={miniStat}><p style={statLabel}>Median</p><p style={statValue(t.yellow)}>{prepTimeDistribution.median} min</p></div>
        <div style={miniStat}><p style={statLabel}>90th Percentile</p><p style={statValue(t.blue)}>{prepTimeDistribution.p90} min</p></div>
        <div style={miniStat}><p style={statLabel}>95th Percentile</p><p style={statValue(t.red)}>{prepTimeDistribution.p95} min</p></div>
        <div style={miniStat}><p style={statLabel}>Fastest</p><p style={statValue(t.green)}>{prepTimeDistribution.min} min</p></div>
        <div style={miniStat}><p style={statLabel}>Slowest</p><p style={statValue(t.red)}>{prepTimeDistribution.max} min</p></div>
      </div>

      {/* Two-column: prep time + staff performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Prep Time by Menu Item */}
        <div style={cardStyle}>
          <h4 style={sectionTitleStyle}>Avg Prep Time by Menu Item</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={tableHeaderStyle}>Menu Item</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Avg Time</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Trend</th>
              </tr></thead>
              <tbody>
                {sortedPrepTimes.map(([name, time]) => (
                  <tr key={name}>
                    <td style={tableCellStyle}>{name}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      <span style={chipStyle(getChipColor(time))}>{time} min</span>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center', fontSize: 16 }}>
                      {time > prepTimeDistribution.average
                        ? <span style={{ color: t.red }}>&#x2197;</span>
                        : <span style={{ color: t.green }}>&#x2198;</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ ...alertBox(t.yellow), marginTop: 12 }}>
            Bottleneck Alert: Items taking &gt;20 minutes should be optimized.
          </div>
        </div>

        {/* Staff Performance */}
        <div style={cardStyle}>
          <h4 style={sectionTitleStyle}>Kitchen Staff Performance</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={tableHeaderStyle}>Staff ID</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Orders</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Completion</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Avg Time</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Failed QC</th>
              </tr></thead>
              <tbody>
                {staffPerformance.map(s => (
                  <tr key={s.staffId}>
                    <td style={tableCellStyle}>{s.staffId}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>{s.completedOrders}/{s.totalOrders}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <span style={chipStyle(s.completionRate >= 95 ? t.green : t.yellow)}>{s.completionRate.toFixed(0)}%</span>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>{s.averagePreparationTime.toFixed(1)} min</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <span style={chipStyle(s.failedQualityChecks > 0 ? t.red : t.green)}>{s.failedQualityChecks}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ ...alertBox(t.green), marginTop: 12 }}>
            Performance Summary: Overall completion rate is excellent.
          </div>
        </div>
      </div>

      {/* Bottleneck Analysis */}
      <div style={cardStyle}>
        <h4 style={sectionTitleStyle}>Bottleneck Analysis & Recommendations</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={alertBox(t.red)}>
            <strong>Critical Issues</strong><br />
            Chicken Biryani takes 25 min (52% above average)<br />
            95th percentile at 30 min indicates inconsistency
          </div>
          <div style={alertBox(t.yellow)}>
            <strong>Optimization Opportunities</strong><br />
            Margherita Pizza (18 min) can be reduced with prep optimization<br />
            Consider parallel station workflow
          </div>
          <div style={alertBox(t.green)}>
            <strong>Best Practices</strong><br />
            Coffee & Desserts have excellent prep times<br />
            Staff1 demonstrates optimal workflow efficiency
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: t.black, marginBottom: 8 }}>Recommended Actions:</p>
          <ul style={{ margin: 0, paddingLeft: 20, color: t.gray, fontSize: 13, lineHeight: 1.8 }}>
            <li>Review Chicken Biryani recipe for process simplification</li>
            <li>Implement make-table stations for high-volume items</li>
            <li>Cross-train staff using Staff1's efficient techniques</li>
            <li>Monitor quality checkpoints to maintain standards while reducing time</li>
          </ul>
        </div>
      </div>
    </>
  );
};

// ============================================================
// PRODUCTS TAB
// ============================================================
const ProductsTab = ({ storeId }: { storeId: string }) => {
  const [period, setPeriod] = useState('TODAY');
  const [sortBy, setSortBy] = useState('QUANTITY');

  const { data, isLoading } = useGetTopProductsQuery({ storeId, period, sortBy }, { skip: !storeId });

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(v);

  if (isLoading) return <p style={{ color: t.gray, fontSize: 13 }}>Loading product analytics...</p>;
  if (!data) return <p style={{ color: t.red, fontSize: 13 }}>Failed to load product analytics</p>;

  const topProduct = data.topProducts[0];
  const totalRevenue = data.topProducts.reduce((sum, p) => sum + p.revenue, 0);
  const totalQuantity = data.topProducts.reduce((sum, p) => sum + p.quantitySold, 0);

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['TODAY', 'WEEKLY', 'MONTHLY'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ ...btn(period === p ? t.orange : t.grayLight), color: period === p ? t.white : t.gray }}>{p === 'TODAY' ? 'Today' : p === 'WEEKLY' ? 'This Week' : 'This Month'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['QUANTITY', 'REVENUE'].map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{ ...btn(sortBy === s ? t.blue : t.grayLight), color: sortBy === s ? t.white : t.gray }}>By {s === 'QUANTITY' ? 'Quantity' : 'Revenue'}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={miniStat}>
          <p style={statLabel}>Top Seller</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: t.black, margin: '4px 0 0 0' }}>{topProduct?.itemName || 'N/A'}</p>
          <p style={{ fontSize: 12, color: t.gray, margin: '2px 0 0 0' }}>{topProduct?.quantitySold} sold - {formatCurrency(topProduct?.revenue || 0)}</p>
        </div>
        <div style={miniStat}>
          <p style={statLabel}>Total Revenue (Top 20)</p>
          <p style={statValue(t.green)}>{formatCurrency(totalRevenue)}</p>
          <p style={{ fontSize: 12, color: t.gray, margin: '2px 0 0 0' }}>From {data.topProducts.length} products</p>
        </div>
        <div style={miniStat}>
          <p style={statLabel}>Total Items Sold (Top 20)</p>
          <p style={statValue(t.blue)}>{totalQuantity}</p>
          <p style={{ fontSize: 12, color: t.gray, margin: '2px 0 0 0' }}>Across all categories</p>
        </div>
      </div>

      {/* Products Table */}
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={tableHeaderStyle}>Rank</th>
              <th style={tableHeaderStyle}>Product</th>
              <th style={tableHeaderStyle}>Category</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Qty Sold</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Revenue</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Unit Price</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>% of Total</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Trend</th>
            </tr></thead>
            <tbody>
              {data.topProducts.map(product => (
                <tr key={product.itemId} style={{ background: product.rank <= 3 ? t.orangeLight : 'transparent' }}>
                  <td style={{ ...tableCellStyle, fontWeight: product.rank <= 3 ? 700 : 400, color: product.rank <= 3 ? t.orange : t.black }}>{product.rank}</td>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 500, color: t.black }}>{product.itemName}</div>
                    <div style={{ fontSize: 11, color: t.grayMuted }}>ID: {product.itemId}</div>
                  </td>
                  <td style={tableCellStyle}><span style={{ ...chipStyle(t.grayLight), color: t.gray }}>{product.category}</span></td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 600 }}>{product.quantitySold}</td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(product.revenue)}</td>
                  <td style={{ ...tableCellStyle, textAlign: 'right' }}>{formatCurrency(product.unitPrice)}</td>
                  <td style={{ ...tableCellStyle, textAlign: 'right' }}>{product.percentOfTotalRevenue.toFixed(1)}%</td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontSize: 16 }}>
                    {product.trend === 'UP' && <span style={{ color: t.green }}>&#x2197;</span>}
                    {product.trend === 'DOWN' && <span style={{ color: t.red }}>&#x2198;</span>}
                    {product.trend === 'NEW' && <span style={{ color: t.blue }}>NEW</span>}
                    {!['UP', 'DOWN', 'NEW'].includes(product.trend) && <span style={{ color: t.yellow }}>&#x2192;</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.topProducts.length === 0 && (
          <p style={{ textAlign: 'center', color: t.grayMuted, fontSize: 14, padding: 24 }}>No product sales data available for this period</p>
        )}
      </div>
    </>
  );
};

// ============================================================
// REPORTS TAB
// ============================================================
const ReportsTab = ({ storeId }: { storeId: string }) => {
  return (
    <>
      <p style={{ fontSize: 13, color: t.gray, marginBottom: 20 }}>Comprehensive analytics and insights for your restaurant</p>

      {/* Sales Trend - Full Width */}
      <div style={{ marginBottom: 20 }}>
        <SalesTrendChart storeId={storeId} />
      </div>

      {/* Revenue Breakdown and Peak Hours - Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        <RevenueBreakdownChart storeId={storeId} />
        <PeakHoursHeatmap storeId={storeId} />
      </div>
    </>
  );
};

// ============================================================
// EQUIPMENT TAB
// ============================================================
const EquipmentTab = ({ storeId, userId }: { storeId: string; userId: string }) => {
  const { data: equipment = [], isLoading } = useGetEquipmentByStoreQuery(storeId, { pollingInterval: 30000 });
  const [createEquipment] = useCreateEquipmentMutation();
  const [updateStatus] = useUpdateEquipmentStatusMutation();
  const [togglePower] = useToggleEquipmentPowerMutation();
  const [updateTemp] = useUpdateTemperatureMutation();
  const [deleteEquipment] = useDeleteEquipmentMutation();

  const [statusDialog, setStatusDialog] = useState<{ open: boolean; eq: KitchenEquipment | null }>({ open: false, eq: null });
  const [tempDialog, setTempDialog] = useState<{ open: boolean; eq: KitchenEquipment | null }>({ open: false, eq: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; eq: KitchenEquipment | null }>({ open: false, eq: null });

  const [newStatus, setNewStatus] = useState<KitchenEquipment['status']>('AVAILABLE');
  const [statusNotes, setStatusNotes] = useState('');
  const [temperature, setTemperature] = useState(0);
  const [formData, setFormData] = useState({ equipmentName: '', type: 'OVEN' as KitchenEquipment['type'], status: 'AVAILABLE' as KitchenEquipment['status'], temperature: 0, isOn: false });

  const getStatusColor = (status: KitchenEquipment['status']) => {
    const map: Record<string, string> = { AVAILABLE: t.green, IN_USE: t.blue, MAINTENANCE: t.yellow, BROKEN: t.red, CLEANING: t.orange };
    return map[status] || t.gray;
  };
  const getTypeLabel = (type: KitchenEquipment['type']) => type.charAt(0) + type.slice(1).toLowerCase();

  const handleTogglePower = async (id: string, isOn: boolean) => {
    try { await togglePower({ equipmentId: id, isOn, staffId: userId }).unwrap(); } catch (e) { console.error('Failed to toggle power:', e); }
  };
  const handleUpdateStatus = async () => {
    if (!statusDialog.eq) return;
    try { await updateStatus({ equipmentId: statusDialog.eq.id, status: newStatus, staffId: userId, notes: statusNotes }).unwrap(); setStatusDialog({ open: false, eq: null }); setStatusNotes(''); } catch (e) { console.error('Failed to update status:', e); }
  };
  const handleUpdateTemp = async () => {
    if (!tempDialog.eq) return;
    try { await updateTemp({ equipmentId: tempDialog.eq.id, temperature }).unwrap(); setTempDialog({ open: false, eq: null }); } catch (e) { console.error('Failed to update temperature:', e); }
  };
  const handleCreate = async () => {
    try { await createEquipment({ storeId, equipmentName: formData.equipmentName, type: formData.type, status: formData.status, temperature: formData.temperature, isOn: formData.isOn, usageCount: 0 }).unwrap(); setCreateDialog(false); } catch (e) { console.error('Failed to create equipment:', e); }
  };
  const handleDelete = async () => {
    if (!deleteDialog.eq) return;
    try { await deleteEquipment(deleteDialog.eq.id).unwrap(); setDeleteDialog({ open: false, eq: null }); } catch (e) { console.error('Failed to delete equipment:', e); }
  };

  const brokenCount = equipment.filter(e => e.status === 'BROKEN').length;
  const maintenanceNeeded = equipment.filter(e => e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) < new Date()).length;

  if (isLoading) return <p style={{ color: t.gray, fontSize: 13 }}>Loading equipment...</p>;

  return (
    <>
      {/* Header with add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setFormData({ equipmentName: '', type: 'OVEN', status: 'AVAILABLE', temperature: 0, isOn: false }); setCreateDialog(true); }} style={btn(t.orange)}>+ Add Equipment</button>
      </div>

      {/* Alerts */}
      {brokenCount > 0 && <div style={alertBox(t.red)}>{brokenCount} equipment(s) marked as BROKEN</div>}
      {maintenanceNeeded > 0 && <div style={alertBox(t.yellow)}>{maintenanceNeeded} equipment(s) need maintenance</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={miniStat}><p style={statLabel}>Available</p><p style={statValue(t.green)}>{equipment.filter(e => e.status === 'AVAILABLE').length}</p></div>
        <div style={miniStat}><p style={statLabel}>In Use</p><p style={statValue(t.blue)}>{equipment.filter(e => e.status === 'IN_USE').length}</p></div>
        <div style={miniStat}><p style={statLabel}>Maintenance</p><p style={statValue(t.yellow)}>{equipment.filter(e => e.status === 'MAINTENANCE').length}</p></div>
        <div style={miniStat}><p style={statLabel}>Broken</p><p style={statValue(t.red)}>{equipment.filter(e => e.status === 'BROKEN').length}</p></div>
      </div>

      {/* Equipment Grid */}
      {equipment.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: t.black, marginBottom: 8 }}>No Equipment Found</p>
          <p style={{ fontSize: 13, color: t.grayMuted, marginBottom: 16 }}>Get started by adding your first piece of kitchen equipment.</p>
          <button onClick={() => { setFormData({ equipmentName: '', type: 'OVEN', status: 'AVAILABLE', temperature: 0, isOn: false }); setCreateDialog(true); }} style={btn(t.orange)}>+ Add First Equipment</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {equipment.map(item => (
            <div key={item.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.black }}>{item.equipmentName}</div>
                <span style={statusBadge(getStatusColor(item.status))}>{item.status.replace('_', ' ')}</span>
              </div>
              <div style={{ fontSize: 12, color: t.grayMuted, marginBottom: 12 }}>{getTypeLabel(item.type)}</div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ marginBottom: 10, fontSize: 12, color: t.gray }}>
                  {item.isOn !== null && <div>Power: <span style={{ color: item.isOn ? t.green : t.grayMuted, fontWeight: 600 }}>{item.isOn ? 'ON' : 'OFF'}</span></div>}
                  {item.temperature !== null && item.temperature !== undefined && <div>Temp: {item.temperature}C</div>}
                  <div>Used {item.usageCount} times today</div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {['OVEN', 'STOVE', 'GRILL', 'FRYER'].includes(item.type) && (
                    <button style={btn(t.yellow)} onClick={() => { setTemperature(item.temperature || 0); setTempDialog({ open: true, eq: item }); }}>Temp</button>
                  )}
                  <button
                    style={btn(item.isOn ? t.red : t.green)}
                    onClick={() => handleTogglePower(item.id, !item.isOn)}
                    disabled={item.status === 'BROKEN' || item.status === 'MAINTENANCE'}
                  >{item.isOn ? 'Off' : 'On'}</button>
                  <button style={btn(t.blue)} onClick={() => { setNewStatus(item.status); setStatusDialog({ open: true, eq: item }); }}>Status</button>
                </div>
                <div style={{ borderTop: `1px solid ${t.grayLight}`, paddingTop: 8 }}>
                  <button style={{ ...btn(t.grayMuted), width: '100%' }} onClick={() => setDeleteDialog({ open: true, eq: item })}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {statusDialog.open && statusDialog.eq && (
        <div style={modalOverlay} onClick={() => setStatusDialog({ open: false, eq: null })}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.black, marginBottom: 4 }}>Update Equipment Status</h3>
            <p style={{ fontSize: 13, color: t.gray, marginBottom: 20 }}>{statusDialog.eq.equipmentName}</p>
            <div style={formGroup}>
              <label style={label}>Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as KitchenEquipment['status'])} style={selectStyle}>
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="BROKEN">Broken</option>
                <option value="CLEANING">Cleaning</option>
              </select>
            </div>
            <div style={formGroup}>
              <label style={label}>Notes</label>
              <textarea value={statusNotes} onChange={e => setStatusNotes(e.target.value)} placeholder="Add notes..." style={{ ...input, minHeight: 80, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btn(t.grayLight)} onClick={() => setStatusDialog({ open: false, eq: null })}><span style={{ color: t.gray }}>Cancel</span></button>
              <button style={btn(t.orange)} onClick={handleUpdateStatus}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Temperature Modal */}
      {tempDialog.open && tempDialog.eq && (
        <div style={modalOverlay} onClick={() => setTempDialog({ open: false, eq: null })}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.black, marginBottom: 4 }}>Update Temperature</h3>
            <p style={{ fontSize: 13, color: t.gray, marginBottom: 20 }}>{tempDialog.eq.equipmentName}</p>
            <div style={formGroup}>
              <label style={label}>Temperature (C)</label>
              <input type="number" value={temperature} onChange={e => setTemperature(parseInt(e.target.value) || 0)} style={input} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btn(t.grayLight)} onClick={() => setTempDialog({ open: false, eq: null })}><span style={{ color: t.gray }}>Cancel</span></button>
              <button style={btn(t.orange)} onClick={handleUpdateTemp}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Equipment Modal */}
      {createDialog && (
        <div style={modalOverlay} onClick={() => setCreateDialog(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.black, marginBottom: 20 }}>Create New Equipment</h3>
            <div style={formGroup}>
              <label style={label}>Equipment Name *</label>
              <input type="text" value={formData.equipmentName} onChange={e => setFormData({ ...formData, equipmentName: e.target.value })} placeholder="e.g., Main Pizza Oven" style={input} />
            </div>
            <div style={formGroup}>
              <label style={label}>Equipment Type *</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as KitchenEquipment['type'] })} style={selectStyle}>
                {['OVEN', 'STOVE', 'GRILL', 'FRYER', 'REFRIGERATOR', 'FREEZER', 'MIXER', 'DISHWASHER', 'OTHER'].map(t => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div style={formGroup}>
              <label style={label}>Initial Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as KitchenEquipment['status'] })} style={selectStyle}>
                {['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'CLEANING'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div style={formGroup}>
              <label style={label}>Initial Temperature (C)</label>
              <input type="number" value={formData.temperature} onChange={e => setFormData({ ...formData, temperature: parseInt(e.target.value) || 0 })} style={input} />
            </div>
            <div style={{ ...formGroup, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={formData.isOn} onChange={e => setFormData({ ...formData, isOn: e.target.checked })} />
              <label style={{ fontSize: 13, fontWeight: 600 }}>Power On</label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btn(t.grayLight)} onClick={() => setCreateDialog(false)}><span style={{ color: t.gray }}>Cancel</span></button>
              <button style={btn(t.orange)} onClick={handleCreate} disabled={!formData.equipmentName.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDialog.open && deleteDialog.eq && (
        <div style={modalOverlay} onClick={() => setDeleteDialog({ open: false, eq: null })}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.red, marginBottom: 12 }}>Delete Equipment</h3>
            <p style={{ fontSize: 14, color: t.gray, marginBottom: 4 }}>
              Are you sure you want to delete <strong>{deleteDialog.eq.equipmentName}</strong>?
            </p>
            <p style={{ fontSize: 12, color: t.grayMuted, marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btn(t.grayLight)} onClick={() => setDeleteDialog({ open: false, eq: null })}><span style={{ color: t.gray }}>Cancel</span></button>
              <button style={btn(t.red)} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================
// MAIN SECTION
// ============================================================
const AnalyticsSection: React.FC<Props> = ({ storeId, activeTab, onTabChange }) => {
  const currentTab = activeTab || tabs[0].id;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => onTabChange(tab.id)} style={tabStyle(currentTab === tab.id)}>
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      {currentTab === 'kitchen' && <KitchenTab storeId={storeId} />}
      {currentTab === 'products' && <ProductsTab storeId={storeId} />}
      {currentTab === 'reports' && <ReportsTab storeId={storeId} />}
      {currentTab === 'equipment' && <EquipmentTab storeId={storeId} userId="" />}
      {currentTab === 'platform-pnl' && (
        <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading...</div>}>
          <PlatformPnLPage />
        </React.Suspense>
      )}
    </div>
  );
};

export default AnalyticsSection;
