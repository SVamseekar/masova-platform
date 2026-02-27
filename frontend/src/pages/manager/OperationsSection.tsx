import React, { useState, useMemo } from 'react';
import { t, cardStyle, tabStyle, tableHeaderStyle, tableCellStyle, sectionTitleStyle, statusBadge, selectStyle } from './manager-tokens';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetAllMenuItemsQuery,
  useUpdateMenuItemMutation,
} from '../../store/api/menuApi';
import type { MenuItem, Cuisine } from '../../store/api/menuApi';
import {
  useGetAllDriversQuery,
  useGetDriverStatsQuery,
  useGetDriverPerformanceQuery,
  useActivateDriverMutation,
  useDeactivateDriverMutation,
} from '../../store/api/driverApi';
import type { Driver } from '../../store/api/driverApi';
import {
  useGetActiveStoresQuery,
  useGetStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
} from '../../store/api/storeApi';
import type { Store, CreateStoreRequest } from '../../store/api/storeApi';
import { useGetActiveStoresProtectedQuery } from '../../store/api/storeApi';
import {
  useCreateKioskMutation,
  useListKioskAccountsQuery,
  useDeactivateKioskMutation,
} from '../../store/api/kioskApi';
import type { CreateKioskResponse } from '../../store/api/kioskApi';
import { ManagerDriverTrackingMap } from '../../components/delivery/ManagerDriverTrackingMap';

interface Props { storeId: string; activeTab: string; onTabChange: (tab: string) => void; }

const tabs = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'stores', label: 'Stores' },
  { id: 'kiosks', label: 'Kiosks' },
];

const miniStat: React.CSSProperties = { ...cardStyle, padding: 14, textAlign: 'center' as const };
const statLabel: React.CSSProperties = { fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase' as const };
const statValue = (c?: string): React.CSSProperties => ({ fontSize: 22, fontWeight: 700, color: c || t.black, margin: '4px 0 0 0' });
const btn = (primary = false): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: t.radius.sm, border: primary ? 'none' : `1px solid ${t.grayLight}`,
  background: primary ? t.orange : t.white, color: primary ? t.white : t.black,
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
});
const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalBox: React.CSSProperties = {
  background: t.white, borderRadius: t.radius.lg, padding: 24, maxWidth: 700, width: '90%', maxHeight: '85vh', overflowY: 'auto',
};
const inputStyle: React.CSSProperties = {
  ...selectStyle, padding: '8px 12px', width: '100%', boxSizing: 'border-box' as const,
};

// ======================== RECIPES TAB ========================
const RecipesTab = ({ storeId }: { storeId: string }) => {
  const { data: menuItems = [], isLoading } = useGetAllMenuItemsQuery(storeId, { skip: !storeId });
  const [updateMenuItem] = useUpdateMenuItemMutation();

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingIngredients, setEditingIngredients] = useState<string[]>([]);
  const [editingInstructions, setEditingInstructions] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [search, setSearch] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const filtered = menuItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (item: MenuItem) => {
    setSelectedItem(item);
    setEditingIngredients(item.ingredients || []);
    setEditingInstructions(item.preparationInstructions || []);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    try {
      await updateMenuItem({
        id: selectedItem.id,
        data: {
          name: selectedItem.name, description: selectedItem.description, cuisine: selectedItem.cuisine,
          category: selectedItem.category, basePrice: selectedItem.basePrice, isAvailable: selectedItem.isAvailable,
          preparationTime: selectedItem.preparationTime, servingSize: selectedItem.servingSize,
          ingredients: editingIngredients, preparationInstructions: editingInstructions,
          allergens: selectedItem.allergens, dietaryInfo: selectedItem.dietaryInfo, spiceLevel: selectedItem.spiceLevel,
          imageUrl: selectedItem.imageUrl, tags: selectedItem.tags, isRecommended: selectedItem.isRecommended,
          displayOrder: selectedItem.displayOrder,
        },
      }).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { console.error('Save failed:', e); }
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading menu items...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Sidebar - menu items */}
      <div style={{ ...cardStyle, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', padding: 14 }}>
        <input placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 10 }} />
        {filtered.map(item => (
          <div key={item.id} onClick={() => handleSelect(item)} style={{
            padding: '10px 12px', borderRadius: t.radius.sm, marginBottom: 4, cursor: 'pointer',
            background: selectedItem?.id === item.id ? t.orangeLight : 'transparent',
            color: selectedItem?.id === item.id ? t.orange : t.black,
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{item.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: t.grayMuted }}>
              {(item.cuisine || '').replace(/_/g, ' ')} - {(item.category || '').replace(/_/g, ' ')}
            </p>
            <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
              {item.ingredients?.length ? <span style={statusBadge('COMPLETED')}>{item.ingredients.length} ingredients</span> : null}
              {item.preparationInstructions?.length ? <span style={statusBadge('READY')}>{item.preparationInstructions.length} steps</span> : null}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 20, color: t.grayMuted, fontSize: 13 }}>No items found</p>}
      </div>

      {/* Editor */}
      <div style={{ ...cardStyle, padding: 20 }}>
        {!selectedItem ? (
          <p style={{ textAlign: 'center', padding: 40, color: t.grayMuted }}>Select a menu item to manage its recipe</p>
        ) : (
          <>
            <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 4 }}>{selectedItem.name}</h3>
            <p style={{ fontSize: 12, color: t.grayMuted, margin: '0 0 16px 0' }}>{selectedItem.description || 'No description'}</p>

            {/* Ingredients */}
            <h4 style={{ ...sectionTitleStyle, marginBottom: 10 }}>Ingredients</h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input placeholder="e.g. 2 cups rice" value={newIngredient} onChange={e => setNewIngredient(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newIngredient.trim()) { setEditingIngredients([...editingIngredients, newIngredient.trim()]); setNewIngredient(''); }}}
                style={{ ...inputStyle, flex: 1 }} />
              <button style={btn(true)} onClick={() => { if (newIngredient.trim()) { setEditingIngredients([...editingIngredients, newIngredient.trim()]); setNewIngredient(''); }}}>Add</button>
            </div>
            {editingIngredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: t.bgMain, borderRadius: t.radius.sm, marginBottom: 4, fontSize: 13 }}>
                <span>{ing}</span>
                <button style={{ ...btn(), color: t.red, padding: '4px 10px', fontSize: 12 }} onClick={() => setEditingIngredients(editingIngredients.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
            {editingIngredients.length === 0 && <p style={{ fontSize: 12, color: t.grayMuted, padding: '10px 0' }}>No ingredients added yet</p>}

            {/* Instructions */}
            <h4 style={{ ...sectionTitleStyle, marginTop: 20, marginBottom: 10 }}>Preparation Steps</h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <textarea placeholder="Enter step..." value={newInstruction} onChange={e => setNewInstruction(e.target.value)}
                style={{ ...inputStyle, flex: 1, minHeight: 60, resize: 'vertical' }} />
              <button style={btn(true)} onClick={() => { if (newInstruction.trim()) { setEditingInstructions([...editingInstructions, newInstruction.trim()]); setNewInstruction(''); }}}>Add</button>
            </div>
            {editingInstructions.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: t.bgMain, borderRadius: t.radius.sm, marginBottom: 4, fontSize: 13 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.orange, color: t.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{step}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {i > 0 && <button style={{ ...btn(), padding: '2px 8px', fontSize: 12 }} onClick={() => { const a = [...editingInstructions]; [a[i-1], a[i]] = [a[i], a[i-1]]; setEditingInstructions(a); }}>Up</button>}
                  {i < editingInstructions.length - 1 && <button style={{ ...btn(), padding: '2px 8px', fontSize: 12 }} onClick={() => { const a = [...editingInstructions]; [a[i], a[i+1]] = [a[i+1], a[i]]; setEditingInstructions(a); }}>Dn</button>}
                  <button style={{ ...btn(), color: t.red, padding: '2px 8px', fontSize: 12 }} onClick={() => setEditingInstructions(editingInstructions.filter((_, idx) => idx !== i))}>X</button>
                </div>
              </div>
            ))}

            <button style={{ ...btn(true), width: '100%', marginTop: 20, padding: '12px 0', background: saveSuccess ? t.green : t.orange }}
              onClick={handleSave}>
              {saveSuccess ? 'Recipe Saved!' : 'Save Recipe'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ======================== DRIVERS TAB ========================
const DriversTab = ({ storeId }: { storeId: string }) => {
  const { data: allDrivers = [], isLoading } = useGetAllDriversQuery(storeId, { skip: !storeId, pollingInterval: 10000 });
  const { data: stats } = useGetDriverStatsQuery(storeId, { skip: !storeId, pollingInterval: 15000 });
  const [activateDriver] = useActivateDriverMutation();
  const [deactivateDriver] = useDeactivateDriverMutation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [trackingDriver, setTrackingDriver] = useState<Driver | null>(null);

  const { data: driverPerformance } = useGetDriverPerformanceQuery(
    { driverId: selectedDriver?.id || '' },
    { skip: !selectedDriver?.id }
  );

  const filtered = useMemo(() => {
    let drivers = allDrivers;
    if (search) drivers = drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter === 'online') drivers = drivers.filter(d => d.isOnline && !d.activeDeliveryId);
    if (statusFilter === 'offline') drivers = drivers.filter(d => !d.isOnline);
    if (statusFilter === 'busy') drivers = drivers.filter(d => d.isOnline && !!d.activeDeliveryId);
    return drivers;
  }, [allDrivers, search, statusFilter]);

  const getStatus = (d: Driver) => {
    if (!d.isActive) return { text: 'Inactive', color: t.grayMuted };
    if (d.isOnline && d.activeDeliveryId) return { text: 'Busy', color: t.orange };
    if (d.isOnline) return { text: 'Online', color: t.green };
    return { text: 'Offline', color: t.gray };
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading drivers...</div>;

  return (
    <>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={miniStat}><p style={statLabel}>Total</p><p style={statValue()}>{stats.totalDrivers}</p></div>
          <div style={miniStat}><p style={statLabel}>Online</p><p style={statValue(t.green)}>{stats.onlineDrivers}</p></div>
          <div style={miniStat}><p style={statLabel}>Available</p><p style={statValue(t.blue)}>{stats.availableDrivers}</p></div>
          <div style={miniStat}><p style={statLabel}>Busy</p><p style={statValue(t.orange)}>{stats.busyDrivers}</p></div>
          <div style={miniStat}><p style={statLabel}>Today</p><p style={statValue()}>{stats.totalDeliveriesToday}</p></div>
          <div style={miniStat}><p style={statLabel}>Avg Time</p><p style={statValue()}>{stats.averageDeliveryTime}m</p></div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 1, minWidth: 200, padding: '8px 12px' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="busy">Busy</option>
        </select>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Driver', 'Contact', 'Vehicle', 'Status', 'Stats', 'Rating', 'Actions'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(driver => {
              const st = getStatus(driver);
              return (
                <tr key={driver.id}>
                  <td style={tableCellStyle}>
                    <p style={{ margin: 0, fontWeight: 600, cursor: driver.isOnline ? 'pointer' : 'default', color: driver.isOnline ? t.orange : t.black }}
                      onClick={() => driver.isOnline && setTrackingDriver(driver)}>
                      {driver.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: t.grayMuted }}>ID: {driver.id.slice(-8).toUpperCase()}</p>
                  </td>
                  <td style={tableCellStyle}><p style={{ margin: 0 }}>{driver.email}</p><p style={{ margin: 0, fontSize: 11, color: t.grayMuted }}>{driver.phone}</p></td>
                  <td style={tableCellStyle}>{driver.vehicleType ? <><p style={{ margin: 0 }}>{driver.vehicleType}</p><p style={{ margin: 0, fontSize: 11, color: t.grayMuted }}>{driver.vehicleNumber}</p></> : <span style={{ color: t.grayMuted }}>Not set</span>}</td>
                  <td style={tableCellStyle}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.color, color: t.white }}>{st.text}</span></td>
                  <td style={tableCellStyle}><p style={{ margin: 0 }}>{driver.completedDeliveries || 0} completed</p><p style={{ margin: 0, fontSize: 11, color: t.grayMuted }}>{driver.totalDeliveries || 0} total</p></td>
                  <td style={tableCellStyle}>{driver.rating ? driver.rating.toFixed(1) : 'N/A'}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {driver.isOnline && <button style={{ ...btn(), color: t.blue, fontSize: 12, padding: '4px 10px' }} onClick={() => setTrackingDriver(driver)}>Track</button>}
                      <button style={{ ...btn(), fontSize: 12, padding: '4px 10px' }} onClick={() => { setSelectedDriver(driver); setDetailsOpen(true); }}>Details</button>
                      <button style={{ ...btn(), color: driver.isActive ? t.red : t.green, fontSize: 12, padding: '4px 10px' }}
                        onClick={async () => { try { driver.isActive ? await deactivateDriver(driver.id).unwrap() : await activateDriver(driver.id).unwrap(); } catch (e) { console.error(e); }}}>
                        {driver.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: t.grayMuted }}>{allDrivers.length > 0 ? 'No drivers match filters' : 'No drivers found'}</p>}
      </div>

      {/* Tracking Map */}
      {trackingDriver && <ManagerDriverTrackingMap driver={trackingDriver} onClose={() => setTrackingDriver(null)} />}

      {/* Details Modal */}
      {detailsOpen && selectedDriver && (
        <div style={modalOverlay} onClick={() => setDetailsOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 16 }}>Driver: {selectedDriver.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[['Email', selectedDriver.email], ['Phone', selectedDriver.phone], ['Vehicle', selectedDriver.vehicleType || 'N/A'],
                ['Vehicle #', selectedDriver.vehicleNumber || 'N/A'], ['License', selectedDriver.licenseNumber || 'N/A'],
                ['Status', getStatus(selectedDriver).text]].map(([l, v]) => (
                <div key={l as string}><p style={{ margin: 0, fontSize: 11, color: t.grayMuted }}>{l}</p><p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600 }}>{v}</p></div>
              ))}
            </div>
            {driverPerformance && <>
              <h4 style={{ ...sectionTitleStyle, marginBottom: 10 }}>Performance</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[['Total', driverPerformance.totalDeliveries || 0], ['Completed', driverPerformance.completedDeliveries || 0],
                  ['On-Time', `${(driverPerformance.onTimeDeliveryPercentage || 0).toFixed(1)}%`], ['Avg Time', `${driverPerformance.averageDeliveryTime || 0}m`],
                  ['Distance', `${(driverPerformance.totalDistanceCovered || 0).toFixed(1)}km`], ['Rating', (driverPerformance.averageRating || 0).toFixed(1)],
                  ['Earnings', `₹${(driverPerformance.totalEarnings || 0).toFixed(0)}`], ['Today', driverPerformance.todayDeliveries || 0],
                ].map(([l, v]) => (
                  <div key={l as string} style={miniStat}><p style={statLabel}>{l}</p><p style={statValue()}>{v}</p></div>
                ))}
              </div>
            </>}
            <div style={{ textAlign: 'right', marginTop: 16 }}><button style={btn()} onClick={() => setDetailsOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
    </>
  );
};

// ======================== STORES TAB ========================
const StoresTab = ({ storeId }: { storeId: string }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: stores = [], isLoading } = useGetActiveStoresQuery();
  const [updateStore, { isLoading: updating }] = useUpdateStoreMutation();
  const [createStore, { isLoading: creating }] = useCreateStoreMutation();
  const { refetch } = useGetStoreQuery(storeId, { skip: !storeId });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const defaultForm = {
    name: '', storeCode: '', address: { street: '', city: '', state: '', pincode: '' } as any,
    phoneNumber: '', regionId: '', areaManagerId: '', openingDate: '',
    operatingConfig: {
      weeklySchedule: Object.fromEntries(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map(d => [d, { startTime: '09:00', endTime: '22:00', isOpen: true }])),
      deliveryRadiusKm: 10, maxConcurrentOrders: 50, estimatedPrepTimeMinutes: 30, acceptsOnlineOrders: true, minimumOrderValueINR: 100,
    },
  };
  const [form, setForm] = useState<any>(defaultForm);

  const openEdit = (store: Store) => {
    setSelectedStore(store);
    setForm({ name: store.name, storeCode: store.storeCode, address: store.address, phoneNumber: store.phoneNumber || '', regionId: store.regionId || '', areaManagerId: store.areaManagerId || '', openingDate: store.openingDate || '', operatingConfig: store.operatingConfig });
    setModalOpen(true);
  };

  const openCreate = () => { setSelectedStore(null); setForm(defaultForm); setModalOpen(true); };

  const handleSubmit = async () => {
    try {
      const data = { ...form, openingDate: form.openingDate ? `${form.openingDate}T00:00:00` : undefined };
      if (selectedStore) { await updateStore({ storeId: selectedStore.id, data }).unwrap(); }
      else { await createStore(data).unwrap(); }
      setModalOpen(false); refetch();
    } catch (e: any) { alert(e?.data?.message || 'Failed to save store'); }
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: t.gray }}>Loading stores...</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button style={btn(true)} onClick={openCreate}>+ Create Store</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {stores.map(store => (
          <div key={store.id} style={{ ...cardStyle, padding: 16, cursor: 'pointer' }} onClick={() => openEdit(store)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.black }}>{store.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: t.grayMuted, fontFamily: 'monospace' }}>{store.storeCode}</p>
              </div>
              <span style={statusBadge(store.status === 'ACTIVE' ? 'COMPLETED' : 'PENDING')}>{store.status}</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: t.gray }}>{store.address.street}, {store.address.city}, {store.address.state} - {store.address.pincode}</p>
            {store.phoneNumber && <p style={{ margin: 0, fontSize: 12, color: t.gray }}>Phone: {store.phoneNumber}</p>}
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: t.grayMuted, marginTop: 8 }}>
              <span>Max Orders: {store.operatingConfig?.maxConcurrentOrders ?? 'N/A'}</span>
              <span>Radius: {store.operatingConfig?.deliveryRadiusKm ?? 'N/A'}km</span>
            </div>
          </div>
        ))}
      </div>
      {stores.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: t.grayMuted }}>No stores found. Create your first store.</p>}

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div style={modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={{ ...modalBox, maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 16 }}>{selectedStore ? 'Edit Store' : 'Create Store'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: t.gray }}>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} required /></div>
              <div><label style={{ fontSize: 11, color: t.gray }}>Store Code</label><input value={form.storeCode} onChange={e => setForm({ ...form, storeCode: e.target.value })} style={inputStyle} placeholder="DOM001" required /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: t.gray }}>Street</label><input value={form.address?.street || ''} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value }})} style={inputStyle} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: t.gray }}>City</label><input value={form.address?.city || ''} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value }})} style={inputStyle} required /></div>
              <div><label style={{ fontSize: 11, color: t.gray }}>State</label><input value={form.address?.state || ''} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value }})} style={inputStyle} required /></div>
              <div><label style={{ fontSize: 11, color: t.gray }}>Pincode</label><input value={form.address?.pincode || ''} onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value }})} style={inputStyle} required /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: t.gray }}>Phone</label><input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: t.gray }}>Opening Date</label><input type="date" value={form.openingDate} onChange={e => setForm({ ...form, openingDate: e.target.value })} style={inputStyle} /></div>
            </div>
            <h4 style={{ ...sectionTitleStyle, margin: '16px 0 10px' }}>Configuration</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: t.gray }}>Delivery Radius (km)</label><input type="number" value={form.operatingConfig?.deliveryRadiusKm || 10} onChange={e => setForm({ ...form, operatingConfig: { ...form.operatingConfig, deliveryRadiusKm: parseFloat(e.target.value) }})} style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: t.gray }}>Max Orders</label><input type="number" value={form.operatingConfig?.maxConcurrentOrders || 50} onChange={e => setForm({ ...form, operatingConfig: { ...form.operatingConfig, maxConcurrentOrders: parseInt(e.target.value) }})} style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: t.gray }}>Prep Time (min)</label><input type="number" value={form.operatingConfig?.estimatedPrepTimeMinutes || 30} onChange={e => setForm({ ...form, operatingConfig: { ...form.operatingConfig, estimatedPrepTimeMinutes: parseInt(e.target.value) }})} style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: t.gray }}>Min Order (₹)</label><input type="number" value={form.operatingConfig?.minimumOrderValueINR || 100} onChange={e => setForm({ ...form, operatingConfig: { ...form.operatingConfig, minimumOrderValueINR: parseFloat(e.target.value) }})} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button style={btn()} onClick={() => setModalOpen(false)}>Cancel</button>
              <button style={btn(true)} onClick={handleSubmit} disabled={creating || updating}>{creating || updating ? 'Saving...' : selectedStore ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ======================== KIOSKS TAB ========================
const KiosksTab = ({ storeId }: { storeId: string }) => {
  const { user } = useAppSelector(state => state.auth);
  const [selectedStoreId, setSelectedStoreId] = useState(storeId || user?.storeId || '');
  const [terminalId, setTerminalId] = useState('');
  const [showTokens, setShowTokens] = useState(false);
  const [tokens, setTokens] = useState<CreateKioskResponse | null>(null);

  const { data: stores = [] } = useGetActiveStoresProtectedQuery();
  const { data: kiosks = [], refetch } = useListKioskAccountsQuery(selectedStoreId, { skip: !selectedStoreId });
  const [createKiosk, { isLoading: creating }] = useCreateKioskMutation();
  const [deactivateKiosk] = useDeactivateKioskMutation();

  const handleCreate = async () => {
    if (!selectedStoreId || !terminalId) { alert('Select a store and enter terminal ID'); return; }
    try {
      const result = await createKiosk({ storeId: selectedStoreId, terminalId }).unwrap();
      setTokens(result); setShowTokens(true); setTerminalId(''); refetch();
    } catch (e: any) { alert('Failed: ' + (e?.data?.error || e.message)); }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this kiosk?')) return;
    try { await deactivateKiosk(id).unwrap(); refetch(); } catch (e: any) { alert('Failed: ' + (e?.data?.error || e.message)); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); alert('Copied!'); };

  return (
    <>
      {/* Create form */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
        <h4 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Create Kiosk Account</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: t.gray, display: 'block', marginBottom: 4 }}>Store</label>
            <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)} style={{ ...selectStyle, width: '100%', padding: '8px 10px' }}>
              <option value="">Select store...</option>
              {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.id.slice(-6)})</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: t.gray, display: 'block', marginBottom: 4 }}>Terminal ID</label>
            <input value={terminalId} onChange={e => setTerminalId(e.target.value)} placeholder="POS-01" style={inputStyle} />
          </div>
          <button style={btn(true)} onClick={handleCreate} disabled={creating || !selectedStoreId || !terminalId}>{creating ? 'Creating...' : 'Create'}</button>
        </div>
      </div>

      {/* Kiosk list */}
      {selectedStoreId && (
        <div style={cardStyle}>
          <h4 style={{ ...sectionTitleStyle, padding: '16px 16px 0', marginBottom: 0 }}>Existing Kiosks</h4>
          {kiosks.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', color: t.grayMuted, fontSize: 13 }}>No kiosks for this store</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Terminal ID', 'Status', 'Last Access', 'Actions'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {kiosks.map((k: any) => (
                  <tr key={k.id}>
                    <td style={{ ...tableCellStyle, fontWeight: 600 }}>{k.employeeDetails?.terminalId || 'N/A'}</td>
                    <td style={tableCellStyle}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: k.isActive ? t.green : t.red, color: t.white }}>
                        {k.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{k.employeeDetails?.lastKioskAccess ? new Date(k.employeeDetails.lastKioskAccess).toLocaleString() : 'Never'}</td>
                    <td style={tableCellStyle}>
                      <button style={{ ...btn(), color: t.red, fontSize: 12, padding: '4px 10px' }} onClick={() => handleDeactivate(k.id)} disabled={!k.isActive}>Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Token modal */}
      {showTokens && tokens && (
        <div style={modalOverlay} onClick={() => setShowTokens(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, fontSize: 18, marginBottom: 12 }}>Kiosk Created</h3>
            <p style={{ fontSize: 12, color: t.gray, marginBottom: 16 }}>Copy these tokens now. They won't be shown again.</p>

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Setup URL (recommended):</p>
              <div style={{ background: t.bgMain, padding: 10, borderRadius: t.radius.sm, fontSize: 12, wordBreak: 'break-all', marginBottom: 4 }}>
                {`${window.location.origin}/kiosk-setup?kiosk=true&setup=true&token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&terminalId=${tokens.terminalId}`}
              </div>
              <button style={{ ...btn(), fontSize: 12 }} onClick={() => copy(`${window.location.origin}/kiosk-setup?kiosk=true&setup=true&token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&terminalId=${tokens.terminalId}`)}>Copy URL</button>
            </div>

            {[['Terminal ID', tokens.terminalId], ['Access Token', tokens.accessToken], ['Refresh Token', tokens.refreshToken]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}:</p>
                <div style={{ background: t.bgMain, padding: 8, borderRadius: t.radius.sm, fontSize: 11, wordBreak: 'break-all', maxHeight: 60, overflow: 'auto' }}>{val}</div>
                <button style={{ ...btn(), fontSize: 11, marginTop: 4 }} onClick={() => copy(val)}>Copy</button>
              </div>
            ))}

            <div style={{ background: t.orangeLight, border: `1px solid ${t.orange}`, borderRadius: t.radius.sm, padding: 10, fontSize: 12, color: t.orangeDark, marginTop: 12 }}>
              Expires in: {tokens.expiresIn}
            </div>
            <div style={{ textAlign: 'right', marginTop: 12 }}><button style={btn(true)} onClick={() => setShowTokens(false)}>Close</button></div>
          </div>
        </div>
      )}
    </>
  );
};

// ======================== MAIN SECTION ========================
const OperationsSection: React.FC<Props> = ({ storeId, activeTab, onTabChange }) => {
  const currentTab = activeTab || 'recipes';

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.id} style={tabStyle(currentTab === tab.id)} onClick={() => onTabChange(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {currentTab === 'recipes' && <RecipesTab storeId={storeId} />}
      {currentTab === 'drivers' && <DriversTab storeId={storeId} />}
      {currentTab === 'stores' && <StoresTab storeId={storeId} />}
      {currentTab === 'kiosks' && <KiosksTab storeId={storeId} />}
    </div>
  );
};

export default OperationsSection;
