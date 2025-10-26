import React, { useState } from 'react';
import {
  useGetAllSuppliersQuery,
  useGetActiveSuppliersQuery,
  useGetPreferredSuppliersQuery,
  useDeleteSupplierMutation,
  useUpdateSupplierStatusMutation,
  useMarkSupplierPreferredMutation,
  Supplier,
} from '../../store/api/inventoryApi';
import { Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../../styles/neumorphic-utils';
import AddSupplierDialog from '../../components/inventory/AddSupplierDialog';
import EditSupplierDialog from '../../components/inventory/EditSupplierDialog';

const SupplierManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PREFERRED'>('ALL');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Fetch data based on filter
  const { data: allSuppliers = [], isLoading: allLoading } = useGetAllSuppliersQuery(undefined, {
    skip: filterStatus !== 'ALL',
    pollingInterval: 60000,
  });
  const { data: activeSuppliers = [], isLoading: activeLoading } = useGetActiveSuppliersQuery(undefined, {
    skip: filterStatus !== 'ACTIVE',
  });
  const { data: preferredSuppliers = [], isLoading: preferredLoading } = useGetPreferredSuppliersQuery(undefined, {
    skip: filterStatus !== 'PREFERRED',
  });

  const [updateStatus] = useUpdateSupplierStatusMutation();
  const [markPreferred] = useMarkSupplierPreferredMutation();

  const isLoading = allLoading || activeLoading || preferredLoading;

  // Get the right supplier list based on filter
  const suppliers =
    filterStatus === 'ACTIVE'
      ? activeSuppliers
      : filterStatus === 'PREFERRED'
      ? preferredSuppliers
      : allSuppliers;

  // Filter by search
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.supplierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateStatus({ id: supplier.id, status: newStatus }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleTogglePreferred = async (supplier: Supplier) => {
    try {
      await markPreferred({ id: supplier.id, preferred: !supplier.isPreferred }).unwrap();
    } catch (error) {
      console.error('Failed to update preferred status:', error);
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: colors.surface.background,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  };

  const statCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[5],
    textAlign: 'center',
  };

  const statLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const statValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const controlsStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    marginBottom: spacing[6],
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const searchInputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    border: 'none',
    outline: 'none',
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
    minWidth: '300px',
    flex: 1,
  };

  const filterButtonStyles = (isActive: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isActive ? 'pressed' : 'raised', 'sm', 'lg'),
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    color: isActive ? colors.brand.primary : colors.text.secondary,
    backgroundColor: isActive ? colors.surface.secondary : colors.surface.primary,
    transition: 'all 0.3s ease',
  });

  const supplierGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: spacing[4],
  };

  const supplierCardStyles: React.CSSProperties = {
    ...createCard('md', 'base', true),
    padding: spacing[5],
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const supplierHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  };

  const supplierNameStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  };

  const supplierCodeStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  };

  const badgeStyles = (type: 'status' | 'preferred' | 'reliability'): React.CSSProperties => {
    const badgeColors = {
      status: { bg: colors.semantic.successLight + '40', text: colors.semantic.success },
      preferred: { bg: colors.brand.primary + '20', text: colors.brand.primary },
      reliability: { bg: colors.semantic.infoLight + '40', text: colors.semantic.info },
    };

    const color = badgeColors[type];

    return {
      display: 'inline-block',
      padding: `${spacing[1]} ${spacing[2]}`,
      borderRadius: borderRadius.full,
      backgroundColor: color.bg,
      color: color.text,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'uppercase',
      marginRight: spacing[1],
    };
  };

  const infoRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const actionButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    marginRight: spacing[2],
    marginTop: spacing[3],
    transition: 'all 0.3s ease',
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <AnimatedBackground />
        <AppHeader title="Supplier Management" showBackButton />
        <div style={{ textAlign: 'center', padding: spacing[10] }}>Loading suppliers...</div>
      </div>
    );
  }

  const activeCount = allSuppliers.filter((s) => s.status === 'ACTIVE').length;
  const preferredCount = allSuppliers.filter((s) => s.isPreferred).length;
  const avgRating =
    allSuppliers.length > 0
      ? (allSuppliers.reduce((sum, s) => sum + s.qualityRating, 0) / allSuppliers.length).toFixed(1)
      : '0.0';

  return (
    <div style={containerStyles}>
      <AnimatedBackground />
      <AppHeader title="Supplier Management" showBackButton />

      <h1 style={titleStyles}>Supplier Management</h1>

      {/* Stats Cards */}
      <div style={statsGridStyles}>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Total Suppliers</div>
          <div style={statValueStyles}>{allSuppliers.length}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Active Suppliers</div>
          <div style={statValueStyles}>{activeCount}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Preferred Suppliers</div>
          <div style={statValueStyles}>{preferredCount}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Avg Quality Rating</div>
          <div style={statValueStyles}>{avgRating} ⭐</div>
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyles}>
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyles}
        />
        <Button onClick={() => setAddDialogOpen(true)}>+ Add Supplier</Button>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[6], flexWrap: 'wrap' }}>
        <button style={filterButtonStyles(filterStatus === 'ALL')} onClick={() => setFilterStatus('ALL')}>
          All Suppliers
        </button>
        <button style={filterButtonStyles(filterStatus === 'ACTIVE')} onClick={() => setFilterStatus('ACTIVE')}>
          Active Only
        </button>
        <button style={filterButtonStyles(filterStatus === 'PREFERRED')} onClick={() => setFilterStatus('PREFERRED')}>
          Preferred Only
        </button>
      </div>

      {/* Supplier Cards */}
      <div style={supplierGridStyles}>
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} style={supplierCardStyles}>
            <div style={supplierHeaderStyles}>
              <div>
                <div style={supplierNameStyles}>{supplier.supplierName}</div>
                <div style={supplierCodeStyles}>{supplier.supplierCode}</div>
              </div>
              <div>
                {supplier.status === 'ACTIVE' && <span style={badgeStyles('status')}>Active</span>}
                {supplier.isPreferred && <span style={badgeStyles('preferred')}>⭐ Preferred</span>}
              </div>
            </div>

            <div style={infoRowStyles}>
              <span>Contact Person:</span>
              <strong>{supplier.contactPerson}</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Phone:</span>
              <strong>{supplier.phone}</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Email:</span>
              <strong>{supplier.email}</strong>
            </div>
            <div style={infoRowStyles}>
              <span>City:</span>
              <strong>{supplier.city}</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Payment Terms:</span>
              <strong>{supplier.paymentTerms}</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Lead Time:</span>
              <strong>{supplier.leadTimeDays} days</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Quality Rating:</span>
              <strong>{supplier.qualityRating} / 5 ⭐</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Delivery Rating:</span>
              <strong>{supplier.deliveryRating} / 5 ⭐</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Reliability:</span>
              <strong>{supplier.reliability}</strong>
            </div>
            <div style={infoRowStyles}>
              <span>Total Orders:</span>
              <strong>{supplier.totalOrders}</strong>
            </div>

            <div style={{ marginTop: spacing[4], paddingTop: spacing[3], borderTop: `1px solid ${colors.surface.secondary}` }}>
              <button style={actionButtonStyles} onClick={() => handleEditSupplier(supplier)}>
                Edit
              </button>
              <button
                style={{
                  ...actionButtonStyles,
                  color: supplier.status === 'ACTIVE' ? colors.semantic.warning : colors.semantic.success,
                }}
                onClick={() => handleToggleStatus(supplier)}
              >
                {supplier.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                style={{
                  ...actionButtonStyles,
                  color: supplier.isPreferred ? colors.text.tertiary : colors.brand.primary,
                }}
                onClick={() => handleTogglePreferred(supplier)}
              >
                {supplier.isPreferred ? 'Unmark Preferred' : 'Mark Preferred'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: spacing[10],
            color: colors.text.tertiary,
            ...createNeumorphicSurface('raised', 'md', 'lg'),
          }}
        >
          No suppliers found
        </div>
      )}

      {/* Dialogs */}
      <AddSupplierDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
      {selectedSupplier && (
        <EditSupplierDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedSupplier(null);
          }}
          supplier={selectedSupplier}
        />
      )}
    </div>
  );
};

export default SupplierManagementPage;
