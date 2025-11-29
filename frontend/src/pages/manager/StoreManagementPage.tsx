import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
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
        operatingConfig: myStore.operatingConfig,
      });
    }
  }, [myStore, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStore) return;

    try {
      await updateStore({ storeId: myStore.id, data: formData as CreateStoreRequest }).unwrap();
      alert('Store updated successfully!');
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      console.error('Error saving store:', error);
      alert(error?.data?.message || 'Failed to update store');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      storeCode: '',
      address: { street: '', city: '', state: '', pincode: '' },
      phoneNumber: '',
      regionId: '',
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
      operatingConfig: store.operatingConfig,
    });
    setShowCreateModal(true);
  };

  const containerStyles: React.CSSProperties = {
    padding: spacing[6],
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    fontFamily: typography.fontFamily.primary,
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
                  backgroundColor: store.status === 'OPEN' ? colors.semantic.successLight : colors.semantic.warningLight,
                  color: store.status === 'OPEN' ? colors.semantic.success : colors.semantic.warning,
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
                <span>📦 Max Orders: {store.operatingConfig.maxConcurrentOrders}</span>
                <span>🚚 Radius: {store.operatingConfig.deliveryRadiusKm}km</span>
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
                  value={formData.address.street}
                  onChange={handleInputChange}
                  required
                  placeholder="123 Main Street"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
                <Input
                  label="City"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="State"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Pincode"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[6] }}>
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                />
                <Input
                  label="Region ID (Optional)"
                  name="regionId"
                  value={formData.regionId || ''}
                  onChange={handleInputChange}
                  placeholder="south-region"
                />
              </div>

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
