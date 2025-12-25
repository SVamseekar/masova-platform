import React, { useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../../styles/neumorphic-utils';
import {
  useGetEquipmentByStoreQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentStatusMutation,
  useToggleEquipmentPowerMutation,
  useUpdateTemperatureMutation,
  useDeleteEquipmentMutation,
  KitchenEquipment
} from '../../store/api/equipmentApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import { usePageStore } from '../../contexts/PageStoreContext';

const EquipmentMonitoringPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const { handleBack } = useSmartBackNavigation();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  // Pass storeId to trigger refetch when store changes
  const { data: equipment = [], isLoading } = useGetEquipmentByStoreQuery(storeId, {
    pollingInterval: 30000,
  });

  const [createEquipment] = useCreateEquipmentMutation();
  const [updateStatus] = useUpdateEquipmentStatusMutation();
  const [togglePower] = useToggleEquipmentPowerMutation();
  const [updateTemp] = useUpdateTemperatureMutation();
  const [deleteEquipment] = useDeleteEquipmentMutation();

  const [statusDialog, setStatusDialog] = useState<{ open: boolean; equipment: KitchenEquipment | null }>({
    open: false,
    equipment: null,
  });
  const [tempDialog, setTempDialog] = useState<{ open: boolean; equipment: KitchenEquipment | null }>({
    open: false,
    equipment: null,
  });
  const [createEditDialog, setCreateEditDialog] = useState<{ open: boolean; equipment: KitchenEquipment | null }>({
    open: false,
    equipment: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; equipment: KitchenEquipment | null }>({
    open: false,
    equipment: null,
  });

  const [newStatus, setNewStatus] = useState<KitchenEquipment['status']>('AVAILABLE');
  const [statusNotes, setStatusNotes] = useState('');
  const [temperature, setTemperature] = useState(0);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    equipmentName: '',
    type: 'OVEN' as KitchenEquipment['type'],
    status: 'AVAILABLE' as KitchenEquipment['status'],
    temperature: 0,
    isOn: false,
  });

  const getStatusColor = (status: KitchenEquipment['status']) => {
    switch (status) {
      case 'AVAILABLE': return colors.semantic.success;
      case 'IN_USE': return colors.brand.primary;
      case 'MAINTENANCE': return colors.semantic.warning;
      case 'BROKEN': return colors.semantic.error;
      case 'CLEANING': return colors.brand.secondary;
      default: return colors.text.tertiary;
    }
  };

  const getEquipmentIcon = (type: KitchenEquipment['type']) => {
    const iconMap = { OVEN: '🔥', STOVE: '🔥', GRILL: '🔥', FRYER: '🔥', REFRIGERATOR: '❄️', FREEZER: '❄️', MIXER: '🥣', DISHWASHER: '🧼', OTHER: '🔧' };
    return iconMap[type] || '🔧';
  };

  const handleTogglePower = async (equipmentId: string, isOn: boolean) => {
    try {
      await togglePower({ equipmentId, isOn, staffId: currentUser?.id || '' }).unwrap();
    } catch (error) {
      console.error('Failed to toggle power:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog.equipment) return;
    try {
      await updateStatus({ equipmentId: statusDialog.equipment.id, status: newStatus, staffId: currentUser?.id || '', notes: statusNotes }).unwrap();
      setStatusDialog({ open: false, equipment: null });
      setStatusNotes('');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUpdateTemperature = async () => {
    if (!tempDialog.equipment) return;
    try {
      await updateTemp({ equipmentId: tempDialog.equipment.id, temperature }).unwrap();
      setTempDialog({ open: false, equipment: null });
    } catch (error) {
      console.error('Failed to update temperature:', error);
    }
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      equipmentName: '',
      type: 'OVEN',
      status: 'AVAILABLE',
      temperature: 0,
      isOn: false,
    });
    setCreateEditDialog({ open: true, equipment: null });
  };

  const handleOpenEditDialog = (equipment: KitchenEquipment) => {
    setFormData({
      equipmentName: equipment.equipmentName,
      type: equipment.type,
      status: equipment.status,
      temperature: equipment.temperature || 0,
      isOn: equipment.isOn,
    });
    setCreateEditDialog({ open: true, equipment });
  };

  const handleSaveEquipment = async () => {
    try {
      if (createEditDialog.equipment) {
        // Edit existing - backend doesn't support full update, so we can only update individual fields
        alert('Full edit not supported. Use individual controls (Status, Power, Temperature) to update equipment.');
        setCreateEditDialog({ open: false, equipment: null });
      } else {
        // Create new
        await createEquipment({
          storeId: storeId,
          equipmentName: formData.equipmentName,
          type: formData.type,
          status: formData.status,
          temperature: formData.temperature,
          isOn: formData.isOn,
          usageCount: 0,
        }).unwrap();
        setCreateEditDialog({ open: false, equipment: null });
      }
    } catch (error) {
      console.error('Failed to save equipment:', error);
      alert('Failed to save equipment. Please try again.');
    }
  };

  const handleDeleteEquipment = async () => {
    if (!deleteDialog.equipment) return;
    try {
      await deleteEquipment(deleteDialog.equipment.id).unwrap();
      setDeleteDialog({ open: false, equipment: null });
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      alert('Failed to delete equipment. Please try again.');
    }
  };

  const brokenEquipment = equipment.filter(e => e.status === 'BROKEN');
  const maintenanceNeeded = equipment.filter(e => e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) < new Date());

  // Styles
  const containerStyles: React.CSSProperties = {
    padding: spacing[6],
    backgroundColor: colors.surface.background,
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    paddingTop: '80px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  };

  const alertStyles = (bgColor: string): React.CSSProperties => ({
    ...createCard('base', 'base'),
    backgroundColor: bgColor + '20',
    borderLeft: `4px solid ${bgColor}`,
    marginBottom: spacing[4],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  });

  const statCardStyles = (bgColor: string): React.CSSProperties => ({
    ...createCard('base', 'base'),
    textAlign: 'center' as const,
    backgroundColor: bgColor + '15',
  });

  const equipmentCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: `${spacing[1]} ${spacing[3]}`,
    backgroundColor: color,
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.full,
    boxShadow: `0 2px 8px ${color}40`,
  });

  const buttonStyles = (bgColor?: string): React.CSSProperties => ({
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    border: 'none',
    padding: `${spacing[2]} ${spacing[3]}`,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    background: bgColor || `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    transition: 'all 0.2s',
    marginRight: spacing[2],
  });

  if (isLoading) {
    return <div style={containerStyles}><div style={titleStyles}>Loading equipment...</div></div>;
  }

  return (
    <div style={containerStyles}>
      <AppHeader title="Equipment Monitoring" showBackButton={true} onBack={handleBack} showManagerNav={true} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <h1 style={titleStyles}>Kitchen Equipment Monitoring</h1>
        <button
          onClick={handleOpenCreateDialog}
          style={{
            ...buttonStyles(colors.brand.primary),
            marginRight: 0,
            padding: `${spacing[3]} ${spacing[5]}`,
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ➕ Create New Equipment
        </button>
      </div>

      {/* Alerts */}
      {brokenEquipment.length > 0 && (
        <div style={alertStyles(colors.semantic.error)}>
          <span style={{ fontSize: typography.fontSize['2xl'] }}>⚠️</span>
          <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.semantic.error }}>
            {brokenEquipment.length} equipment(s) marked as BROKEN
          </span>
        </div>
      )}
      {maintenanceNeeded.length > 0 && (
        <div style={alertStyles(colors.semantic.warning)}>
          <span style={{ fontSize: typography.fontSize['2xl'] }}>🔧</span>
          <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.semantic.warning }}>
            {maintenanceNeeded.length} equipment(s) need maintenance
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
        <div style={statCardStyles(colors.semantic.success)}>
          <div style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.semantic.success }}>
            {equipment.filter(e => e.status === 'AVAILABLE').length}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Available</div>
        </div>
        <div style={statCardStyles(colors.brand.primary)}>
          <div style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.brand.primary }}>
            {equipment.filter(e => e.status === 'IN_USE').length}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>In Use</div>
        </div>
        <div style={statCardStyles(colors.semantic.warning)}>
          <div style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.semantic.warning }}>
            {equipment.filter(e => e.status === 'MAINTENANCE').length}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Maintenance</div>
        </div>
        <div style={statCardStyles(colors.semantic.error)}>
          <div style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.semantic.error }}>
            {equipment.filter(e => e.status === 'BROKEN').length}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Broken</div>
        </div>
      </div>

      {/* Equipment Grid */}
      {equipment.length === 0 ? (
        <div style={{
          ...createCard('lg', 'lg'),
          textAlign: 'center',
          padding: spacing[8],
          marginTop: spacing[6],
        }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>🏭</div>
          <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[3] }}>
            No Equipment Found
          </h3>
          <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, marginBottom: spacing[6] }}>
            Get started by creating your first piece of kitchen equipment.
          </p>
          <button
            onClick={handleOpenCreateDialog}
            style={{
              ...buttonStyles(colors.brand.primary),
              marginRight: 0,
              padding: `${spacing[3]} ${spacing[6]}`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ➕ Create First Equipment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing[4] }}>
          {equipment.map((item) => (
          <div key={item.id} style={equipmentCardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <span style={{ fontSize: typography.fontSize['2xl'] }}>{getEquipmentIcon(item.type)}</span>
                <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                  {item.equipmentName}
                </div>
              </div>
              <span style={badgeStyles(getStatusColor(item.status))}>{item.status}</span>
            </div>

            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
              {item.type}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ marginBottom: spacing[3] }}>
                {item.isOn !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <span style={{ fontSize: typography.fontSize.sm, color: item.isOn ? colors.semantic.success : colors.text.tertiary }}>⚡</span>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                      {item.isOn ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )}
                {item.temperature !== null && item.temperature !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <span style={{ fontSize: typography.fontSize.sm }}>🌡️</span>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                      {item.temperature}°C
                    </span>
                  </div>
                )}
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  Used {item.usageCount} times today
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] }}>
                {(item.type === 'OVEN' || item.type === 'STOVE' || item.type === 'GRILL' || item.type === 'FRYER') && (
                  <button
                    style={buttonStyles(colors.semantic.warning)}
                    onClick={() => { setTemperature(item.temperature || 0); setTempDialog({ open: true, equipment: item }); }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    🌡️ Temp
                  </button>
                )}
                <button
                  style={buttonStyles(item.isOn ? colors.semantic.error : colors.semantic.success)}
                  onClick={() => handleTogglePower(item.id, !item.isOn)}
                  disabled={item.status === 'BROKEN' || item.status === 'MAINTENANCE'}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ⚡ {item.isOn ? 'Off' : 'On'}
                </button>
                <button
                  style={buttonStyles(colors.brand.secondary)}
                  onClick={() => { setNewStatus(item.status); setStatusDialog({ open: true, equipment: item }); }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  🔧 Status
                </button>
              </div>
              <div style={{ display: 'flex', gap: spacing[2], borderTop: `1px solid ${colors.surface.border}`, paddingTop: spacing[2] }}>
                <button
                  style={{ ...buttonStyles('#666'), flex: 1, marginRight: 0 }}
                  onClick={() => setDeleteDialog({ open: true, equipment: item })}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = colors.semantic.error; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#666'; }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Status Update Dialog */}
      {statusDialog.open && statusDialog.equipment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: spacing[4] }} onClick={() => setStatusDialog({ open: false, equipment: null })}>
          <div style={{ ...createCard('lg', 'lg'), maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>Update Equipment Status</h3>
            <div style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, marginBottom: spacing[4] }}>
              {statusDialog.equipment.equipmentName}
            </div>
            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as KitchenEquipment['status'])}
                style={{ ...createNeumorphicSurface('inset', 'sm', 'md'), width: '100%', padding: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.primary, color: colors.text.primary, border: 'none' }}
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="BROKEN">Broken</option>
                <option value="CLEANING">Cleaning</option>
              </select>
            </div>
            <div style={{ marginBottom: spacing[6] }}>
              <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>Notes</label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about the status change..."
                style={{ ...createNeumorphicSurface('inset', 'sm', 'md'), width: '100%', padding: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.primary, color: colors.text.primary, border: 'none', resize: 'vertical' as const, minHeight: '80px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
              <button style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.secondary }} onClick={() => setStatusDialog({ open: false, equipment: null })}>Cancel</button>
              <button style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.inverse, background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`, boxShadow: shadows.brand.primary }} onClick={handleUpdateStatus}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Temperature Update Dialog */}
      {tempDialog.open && tempDialog.equipment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: spacing[4] }} onClick={() => setTempDialog({ open: false, equipment: null })}>
          <div style={{ ...createCard('lg', 'lg'), maxWidth: '400px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>Update Temperature</h3>
            <div style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, marginBottom: spacing[4] }}>
              {tempDialog.equipment.equipmentName}
            </div>
            <div style={{ marginBottom: spacing[6] }}>
              <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>Temperature (°C)</label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value) || 0)}
                style={{ ...createNeumorphicSurface('inset', 'sm', 'md'), width: '100%', padding: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.primary, color: colors.text.primary, border: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
              <button style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.secondary }} onClick={() => setTempDialog({ open: false, equipment: null })}>Cancel</button>
              <button style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.inverse, background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`, boxShadow: shadows.brand.primary }} onClick={handleUpdateTemperature}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Equipment Dialog */}
      {createEditDialog.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: spacing[4] }} onClick={() => setCreateEditDialog({ open: false, equipment: null })}>
          <div style={{ ...createCard('lg', 'lg'), maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>
              {createEditDialog.equipment ? 'Edit Equipment' : 'Create New Equipment'}
            </h3>

            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>Equipment Name *</label>
              <input
                type="text"
                value={formData.equipmentName}
                onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                placeholder="e.g., Main Pizza Oven"
                style={{ ...createNeumorphicSurface('inset', 'sm', 'md'), width: '100%', padding: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.primary, color: colors.text.primary, border: 'none' }}
              />
            </div>

            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>Equipment Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as KitchenEquipment['type'] })}
                style={{ ...createNeumorphicSurface('inset', 'sm', 'md'), width: '100%', padding: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.primary, color: colors.text.primary, border: 'none' }}
              >
                <option value="OVEN">Oven</option>
                <option value="STOVE">Stove</option>
                <option value="GRILL">Grill</option>
                <option value="FRYER">Fryer</option>
                <option value="REFRIGERATOR">Refrigerator</option>
                <option value="FREEZER">Freezer</option>
                <option value="MIXER">Mixer</option>
                <option value="DISHWASHER">Dishwasher</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as KitchenEquipment['status'] })}
                style={{ ...createNeumorphicSurface('inset', 'sm', 'md'), width: '100%', padding: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.primary, color: colors.text.primary, border: 'none' }}
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="BROKEN">Broken</option>
                <option value="CLEANING">Cleaning</option>
              </select>
            </div>

            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>Initial Temperature (°C)</label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseInt(e.target.value) || 0 })}
                placeholder="0"
                style={{ ...createNeumorphicSurface('inset', 'sm', 'md'), width: '100%', padding: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.primary, color: colors.text.primary, border: 'none' }}
              />
            </div>

            <div style={{ marginBottom: spacing[6] }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing[2], cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isOn}
                  onChange={(e) => setFormData({ ...formData, isOn: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>Power On</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
              <button style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.secondary }} onClick={() => setCreateEditDialog({ open: false, equipment: null })}>Cancel</button>
              <button
                style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.inverse, background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`, boxShadow: shadows.brand.primary }}
                onClick={handleSaveEquipment}
                disabled={!formData.equipmentName.trim()}
              >
                {createEditDialog.equipment ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && deleteDialog.equipment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: spacing[4] }} onClick={() => setDeleteDialog({ open: false, equipment: null })}>
          <div style={{ ...createCard('lg', 'lg'), maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4], color: colors.semantic.error }}>
              ⚠️ Delete Equipment
            </h3>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, marginBottom: spacing[2] }}>
              Are you sure you want to delete <strong>{deleteDialog.equipment.equipmentName}</strong>?
            </p>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[6] }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
              <button style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.secondary }} onClick={() => setDeleteDialog({ open: false, equipment: null })}>Cancel</button>
              <button
                style={{ ...createNeumorphicSurface('raised', 'sm', 'md'), border: 'none', padding: `${spacing[2]} ${spacing[4]}`, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.inverse, background: `linear-gradient(135deg, ${colors.semantic.error} 0%, ${colors.semantic.errorDark} 100%)`, boxShadow: shadows.brand.primary }}
                onClick={handleDeleteEquipment}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withPageStoreContext(EquipmentMonitoringPage, 'equipment-monitoring');
