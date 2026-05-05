import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import {
  useGetStoreQuery,
  useGetActiveStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  Store,
  CreateStoreRequest,
} from '../../store/api/storeApi';
import { Button, Card, Input } from '../../components/ui/neumorphic';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import AppHeader from '../../components/common/AppHeader';

const StoreManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const { handleBack } = useSmartBackNavigation();
  const storeId = currentUser?.storeId || '';

  // Get manager's own store
  const { data: myStore, isLoading: loadingMyStore, refetch } = useGetStoreQuery(storeId, { skip: !storeId });
  const { data: stores = [], isLoading } = useGetActiveStoresQuery();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();
  const [createStore, { isLoading: isCreating }] = useCreateStoreMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<Partial<CreateStoreRequest>>({
    name: '',
    storeCode: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    phoneNumber: '',
    regionId: '',
    areaManagerId: '',
    openingDate: '',
    operatingConfig: {
      weeklySchedule: {
        MONDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
        TUESDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
        WEDNESDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
        THURSDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
        FRIDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
        SATURDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
        SUNDAY: { startTime: '10:00', endTime: '21:00', isOpen: true },
      },
      deliveryRadiusKm: 10,
      maxConcurrentOrders: 50,
      estimatedPrepTimeMinutes: 30,
      acceptsOnlineOrders: true,
      minimumOrderValueINR: 100,
    },
  });

  // Global-5: Fiscal device configuration — separate state as these aren't in CreateStoreRequest
  const [fiscalCountryCode, setFiscalCountryCode] = React.useState('');
  const [fiscalDeviceIp, setFiscalDeviceIp] = React.useState('');
  const [ntcaApiCredentials, setNtcaApiCredentials] = React.useState('');
  const [mtdVatNumber, setMtdVatNumber] = React.useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...(prev.address || {}), [addressField]: value } as any,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Load store data when available
  useEffect(() => {
    if (myStore && !isEditing) {
      setFormData({
        name: myStore.name,
        storeCode: myStore.storeCode,
        address: myStore.address,
        phoneNumber: myStore.phoneNumber || '',
        regionId: myStore.regionId || '',
        areaManagerId: myStore.areaManagerId || '',
        openingDate: myStore.openingDate || '',
        operatingConfig: myStore.operatingConfig,
      });
    }
  }, [myStore, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert date to LocalDateTime format (YYYY-MM-DDTHH:MM:SS)
      // Ensure all time strings are in HH:mm format for LocalTime parsing
      const submissionData = {
        ...formData,
        openingDate: formData.openingDate
          ? `${formData.openingDate}T00:00:00`
          : undefined,
        operatingConfig: formData.operatingConfig ? {
          ...formData.operatingConfig,
          weeklySchedule: Object.entries(formData.operatingConfig.weeklySchedule).reduce((acc, [day, schedule]) => {
            acc[day] = {
              startTime: schedule.startTime || '09:00',
              endTime: schedule.endTime || '22:00',
              isOpen: schedule.isOpen !== undefined ? schedule.isOpen : true
            };
            return acc;
          }, {} as any)
        } : undefined
      };

      if (selectedStore) {
        // Update existing store
        await updateStore({
          storeId: selectedStore.id,
          data: submissionData as CreateStoreRequest
        }).unwrap();
        alert('Store updated successfully!');
      } else {
        // Create new store
        await createStore(submissionData as CreateStoreRequest).unwrap();
        alert('Store created successfully!');
      }

      setShowCreateModal(false);
      setSelectedStore(null);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error('Error saving store:', error);
      alert(error?.data?.message || 'Failed to save store');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      storeCode: '',
      address: { street: '', city: '', state: '', pincode: '' },
      phoneNumber: '',
      regionId: '',
      areaManagerId: '',
      openingDate: '',
      operatingConfig: {
        weeklySchedule: {
          MONDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
          TUESDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
          WEDNESDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
          THURSDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
          FRIDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
          SATURDAY: { startTime: '09:00', endTime: '22:00', isOpen: true },
          SUNDAY: { startTime: '10:00', endTime: '21:00', isOpen: true },
        },
        deliveryRadiusKm: 10,
        maxConcurrentOrders: 50,
        estimatedPrepTimeMinutes: 30,
        acceptsOnlineOrders: true,
        minimumOrderValueINR: 100,
      },
    });
  };

  const openEditModal = (store: Store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      storeCode: store.storeCode,
      address: store.address,
      phoneNumber: store.phoneNumber || '',
      regionId: store.regionId || '',
      areaManagerId: store.areaManagerId || '',
      openingDate: store.openingDate || '',
      operatingConfig: store.operatingConfig,
    });
    setShowCreateModal(true);
  };

  const containerStyles: React.CSSProperties = {
    padding: spacing[6],
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    fontFamily: typography.fontFamily.primary,
    paddingTop: '80px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: spacing[6],
  };

  const storeCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'md', 'xl'),
    padding: spacing[5],
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
  };

  const modalOverlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalContentStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'xl', '2xl'),
    backgroundColor: colors.surface.primary,
    padding: spacing[8],
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  return (
    <div style={containerStyles}>
      <AppHeader title="Store Management" showBackButton={true} onBack={handleBack} showManagerNav={true} />
      <div style={headerStyles}>
        <h1 style={titleStyles}>🏪 Store Management</h1>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            resetForm();
            setSelectedStore(null);
            setShowCreateModal(true);
          }}
        >
          ➕ Create New Store
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: spacing[10] }}>
          <p style={{ color: colors.text.secondary }}>Loading stores...</p>
        </div>
      ) : stores.length === 0 ? (
        <Card elevation="md" padding="xl">
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            <p style={{ fontSize: typography.fontSize.xl, color: colors.text.secondary }}>
              No stores found. Create your first store to get started!
            </p>
          </div>
        </Card>
      ) : (
        <div style={gridStyles}>
          {stores.map((store) => (
            <div
              key={store.id}
              style={storeCardStyles}
              onClick={() => openEditModal(store)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing[3] }}>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text.primary,
                    marginBottom: spacing[1],
                  }}>
                    {store.name}
                  </h3>
                  <span style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                    fontFamily: 'monospace',
                  }}>
                    {store.storeCode}
                  </span>
                </div>
                <span style={{
                  padding: `${spacing[1]} ${spacing[3]}`,
                  borderRadius: borderRadius.full,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  backgroundColor: store.status === 'ACTIVE' ? colors.semantic.successLight : colors.semantic.warningLight,
                  color: store.status === 'ACTIVE' ? colors.semantic.success : colors.semantic.warning,
                }}>
                  {store.status}
                </span>
              </div>

              <div style={{ marginBottom: spacing[3] }}>
                <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[1] }}>
                  📍 {store.address.street}, {store.address.city}, {store.address.state} - {store.address.pincode}
                </p>
                {store.phoneNumber && (
                  <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    📞 {store.phoneNumber}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: spacing[4], fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                <span>📦 Max Orders: {store.operatingConfig?.maxConcurrentOrders ?? 'N/A'}</span>
                <span>🚚 Radius: {store.operatingConfig?.deliveryRadiusKm ?? 'N/A'}km</span>
              </div>

              <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[2] }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/kitchen/${store.storeCode}`);
                  }}
                >
                  View KDS
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div style={modalOverlayStyles} onClick={() => {
          setShowCreateModal(false);
          setSelectedStore(null);
        }}>
          <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing[6],
              color: colors.text.primary,
            }}>
              {selectedStore ? 'Edit Store' : 'Create New Store'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
                <Input
                  label="Store Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Main Branch"
                />
                <Input
                  label="Store Code (Format: DOM###)"
                  name="storeCode"
                  value={formData.storeCode}
                  onChange={handleInputChange}
                  required
                  placeholder="DOM001"
                  helperText="Use format: DOM followed by 3 digits (e.g., DOM001, DOM002)"
                />
              </div>

              <div style={{ marginBottom: spacing[4] }}>
                <Input
                  label="Street Address"
                  name="address.street"
                  value={formData.address?.street || ''}
                  onChange={handleInputChange}
                  required
                  placeholder="123 Main Street"
                />
              </div>

              <div style={{ marginBottom: spacing[4] }}>
                <Input
                  label="Landmark (Optional)"
                  name="address.landmark"
                  value={formData.address?.landmark || ''}
                  onChange={handleInputChange}
                  placeholder="Near City Mall"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
                <Input
                  label="City"
                  name="address.city"
                  value={formData.address?.city || ''}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="State"
                  name="address.state"
                  value={formData.address?.state || ''}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Pincode"
                  name="address.pincode"
                  value={formData.address?.pincode || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
                <Input
                  label="Phone Number (Required)"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  required
                  helperText="10 digits, no country code or spaces"
                />
                <Input
                  label="Region ID (Optional)"
                  name="regionId"
                  value={formData.regionId || ''}
                  onChange={handleInputChange}
                  placeholder="south-region"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
                <Input
                  label="Area Manager ID (Optional)"
                  name="areaManagerId"
                  value={formData.areaManagerId || ''}
                  onChange={handleInputChange}
                  placeholder="manager-123"
                />
                <Input
                  label="Opening Date (Optional)"
                  name="openingDate"
                  type="date"
                  value={formData.openingDate || ''}
                  onChange={handleInputChange}
                />
              </div>

              {/* Global-5: Fiscal Device Configuration */}
              <div style={{ marginBottom: spacing[4] }}>
                <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: spacing[3], color: colors.text.primary }}>
                  Fiscal Compliance
                </h3>
                <Input
                  label="Country Code (e.g. DE, FR, GB — leave blank for India)"
                  name="fiscalCountryCode"
                  value={fiscalCountryCode}
                  onChange={(e) => setFiscalCountryCode(e.target.value.toUpperCase())}
                  placeholder="IN"
                />
                {['DE', 'IT', 'BE'].includes(fiscalCountryCode) && (
                  <div style={{ marginTop: spacing[3] }}>
                    <Input
                      label="Fiscal Device IP Address (TSE / RT / FDM)"
                      name="fiscalDeviceIp"
                      value={fiscalDeviceIp}
                      onChange={(e) => setFiscalDeviceIp(e.target.value)}
                      placeholder="192.168.1.100"
                    />
                    <button
                      type="button"
                      style={{ marginTop: spacing[2], padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer', fontSize: 13 }}
                      onClick={() => alert('Device connection test — Phase 2 feature')}
                    >
                      Test Connection
                    </button>
                  </div>
                )}
                {fiscalCountryCode === 'HU' && (
                  <div style={{ marginTop: spacing[3] }}>
                    <Input
                      label="NTCA API Credentials"
                      name="ntcaApiCredentials"
                      value={ntcaApiCredentials}
                      onChange={(e) => setNtcaApiCredentials(e.target.value)}
                      placeholder="Technical ID:Exchange Key"
                    />
                  </div>
                )}
                {fiscalCountryCode === 'GB' && (
                  <div style={{ marginTop: spacing[3] }}>
                    <Input
                      label="HMRC VAT Registration Number"
                      name="mtdVatNumber"
                      value={mtdVatNumber}
                      onChange={(e) => setMtdVatNumber(e.target.value)}
                      placeholder="GB123456789"
                    />
                  </div>
                )}
                {fiscalCountryCode === 'FR' && (
                  <div style={{ marginTop: spacing[3], padding: spacing[3], background: 'rgba(255,193,7,0.1)', borderRadius: 6 }}>
                    <strong>NF525 Notice:</strong> Once an order is fiscally signed, it is immutable.
                    Corrections must be submitted as new credit note orders.
                  </div>
                )}
              </div>

              {/* Store Configuration Section */}
              <div style={{ marginBottom: spacing[4] }}>
                <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: spacing[3], color: colors.text.primary }}>
                  Store Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
                  <Input
                    label="Delivery Radius (km)"
                    name="deliveryRadiusKm"
                    type="number"
                    value={formData.operatingConfig?.deliveryRadiusKm || 10}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      operatingConfig: { ...prev.operatingConfig!, deliveryRadiusKm: parseFloat(e.target.value) }
                    }))}
                  />
                  <Input
                    label="Max Concurrent Orders"
                    name="maxConcurrentOrders"
                    type="number"
                    value={formData.operatingConfig?.maxConcurrentOrders || 50}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      operatingConfig: { ...prev.operatingConfig!, maxConcurrentOrders: parseInt(e.target.value) }
                    }))}
                  />
                  <Input
                    label="Estimated Prep Time (min)"
                    name="estimatedPrepTimeMinutes"
                    type="number"
                    value={formData.operatingConfig?.estimatedPrepTimeMinutes || 30}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      operatingConfig: { ...prev.operatingConfig!, estimatedPrepTimeMinutes: parseInt(e.target.value) }
                    }))}
                  />
                  <Input
                    label="Minimum Order Value (₹)"
                    name="minimumOrderValueINR"
                    type="number"
                    value={formData.operatingConfig?.minimumOrderValueINR || 100}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      operatingConfig: { ...prev.operatingConfig!, minimumOrderValueINR: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              {/* Operating Hours Section */}
              <div style={{ marginBottom: spacing[6] }}>
                <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: spacing[3], color: colors.text.primary }}>
                  Operating Hours
                </h3>
                <div style={{ display: 'grid', gap: spacing[3] }}>
                  {Object.entries(formData.operatingConfig?.weeklySchedule || {}).map(([day, schedule]) => (
                    <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px', gap: spacing[3], alignItems: 'center' }}>
                      <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                        {day}
                      </span>
                      <Input
                        label="Start Time"
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          operatingConfig: {
                            ...prev.operatingConfig!,
                            weeklySchedule: {
                              ...prev.operatingConfig!.weeklySchedule,
                              [day]: { ...schedule, startTime: e.target.value }
                            }
                          }
                        }))}
                      />
                      <Input
                        label="End Time"
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          operatingConfig: {
                            ...prev.operatingConfig!,
                            weeklySchedule: {
                              ...prev.operatingConfig!.weeklySchedule,
                              [day]: { ...schedule, endTime: e.target.value }
                            }
                          }
                        }))}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: typography.fontSize.sm }}>
                        <input
                          type="checkbox"
                          checked={schedule.isOpen}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            operatingConfig: {
                              ...prev.operatingConfig!,
                              weeklySchedule: {
                                ...prev.operatingConfig!.weeklySchedule,
                                [day]: { ...schedule, isOpen: e.target.checked }
                              }
                            }
                          }))}
                        />
                        Open
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Read-only fields for existing stores */}
              {selectedStore && (
                <div style={{ marginBottom: spacing[6], padding: spacing[4], backgroundColor: colors.surface.secondary, borderRadius: borderRadius.lg }}>
                  <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: spacing[3], color: colors.text.primary }}>
                    Store Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
                    <div>
                      <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>Status</p>
                      <p style={{ fontSize: typography.fontSize.sm, color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>{selectedStore.status}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>Created At</p>
                      <p style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>{selectedStore.createdAt ? new Date(selectedStore.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>Last Modified</p>
                      <p style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>{selectedStore.lastModified ? new Date(selectedStore.lastModified).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedStore(null);
                  }}
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isCreating || isUpdating}
                  disabled={isCreating || isUpdating}
                >
                  {selectedStore ? 'Update Store' : 'Create Store'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagementPage;
