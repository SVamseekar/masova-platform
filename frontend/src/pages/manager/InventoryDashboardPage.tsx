import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId, selectSelectedStoreName } from '../../store/slices/cartSlice';
import StoreSelector from '../../components/StoreSelector';
import {
  useGetAllInventoryItemsQuery,
  useGetLowStockAlertsQuery,
  useGetOutOfStockItemsQuery,
  useGetExpiringItemsQuery,
  useGetTotalInventoryValueQuery,
  useDeleteInventoryItemMutation,
  InventoryItem,
} from '../../store/api/inventoryApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../../styles/neumorphic-utils';
import StockAdjustmentDialog from '../../components/inventory/StockAdjustmentDialog';
import AddInventoryItemDialog from '../../components/inventory/AddInventoryItemDialog';

const InventoryDashboardPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const selectedStoreName = useAppSelector(selectSelectedStoreName);

  // Use selected store or fallback to user's store
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Fetch data
  const { data: allItems = [], isLoading: itemsLoading, refetch: refetchAllItems } = useGetAllInventoryItemsQuery(undefined, {
    skip: !storeId,
    pollingInterval: 60000, // Poll every minute
  });
  const { data: lowStockItems = [], refetch: refetchLowStock } = useGetLowStockAlertsQuery(undefined, { skip: !storeId });
  const { data: outOfStockItems = [], refetch: refetchOutOfStock } = useGetOutOfStockItemsQuery(undefined, { skip: !storeId });
  const { data: expiringItems = [], refetch: refetchExpiring } = useGetExpiringItemsQuery({ days: 7 }, { skip: !storeId });
  const { data: inventoryValue, refetch: refetchValue } = useGetTotalInventoryValueQuery(undefined, { skip: !storeId });

  const [deleteItem] = useDeleteInventoryItemMutation();

  // Refetch data when store changes
  useEffect(() => {
    if (storeId) {
      refetchAllItems();
      refetchLowStock();
      refetchOutOfStock();
      refetchExpiring();
      refetchValue();
    }
  }, [storeId, refetchAllItems, refetchLowStock, refetchOutOfStock, refetchExpiring, refetchValue]);

  // Categories
  const categories = ['ALL', 'RAW_MATERIAL', 'INGREDIENT', 'PACKAGING', 'BEVERAGE', 'OTHER'];

  // Filter items
  const filteredItems = allItems.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId).unwrap();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: '#e8e8e8',
    zIndex: 1,
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
    marginBottom: spacing[1],
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

  const categoryButtonStyles = (isActive: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isActive ? 'inset' : 'raised', 'sm', 'lg'),
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

  const tableContainerStyles: React.CSSProperties = {
    ...createCard('md', 'lg'),
    padding: spacing[5],
    overflowX: 'auto',
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: `0 ${spacing[2]}`,
  };

  const tableHeaderStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textAlign: 'left',
    padding: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tableRowStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    backgroundColor: colors.surface.primary,
  };

  const tableCellStyles: React.CSSProperties = {
    padding: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const statusBadgeStyles = (status: string): React.CSSProperties => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      AVAILABLE: { bg: colors.semantic.successLight + '40', text: colors.semantic.success },
      LOW_STOCK: { bg: colors.semantic.warningLight + '40', text: colors.semantic.warning },
      OUT_OF_STOCK: { bg: colors.semantic.errorLight + '40', text: colors.semantic.error },
      DISCONTINUED: { bg: colors.text.tertiary + '40', text: colors.text.tertiary },
    };

    const statusColor = statusColors[status] || statusColors.AVAILABLE;

    return {
      display: 'inline-block',
      padding: `${spacing[1]} ${spacing[3]}`,
      borderRadius: borderRadius.full,
      backgroundColor: statusColor.bg,
      color: statusColor.text,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'uppercase',
    };
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
    transition: 'all 0.3s ease',
  };

  const alertSectionStyles: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const alertCardStyles = (type: 'warning' | 'error' | 'info'): React.CSSProperties => {
    const alertColors = {
      warning: { bg: colors.semantic.warningLight + '20', border: colors.semantic.warning },
      error: { bg: colors.semantic.errorLight + '20', border: colors.semantic.error },
      info: { bg: colors.semantic.infoLight + '20', border: colors.semantic.info },
    };

    const alertColor = alertColors[type];

    return {
      ...createCard('md', 'base'),
      padding: spacing[4],
      backgroundColor: alertColor.bg,
      borderLeft: `4px solid ${alertColor.border}`,
      marginBottom: spacing[3],
    };
  };

  if (itemsLoading) {
    return (
      <div style={containerStyles}>
        <AnimatedBackground />
        <AppHeader title="Inventory Dashboard" showBackButton />
        <div style={{ textAlign: 'center', padding: spacing[10] }}>Loading inventory...</div>
      </div>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div style={containerStyles}>
        <AppHeader title="Inventory Management" showBackButton />

      {/* Store Selector */}
      <div style={{
        background: 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderRadius: '12px',
        marginBottom: spacing[6],
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StoreSelector variant="manager" />
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {storeId ? `Managing inventory for: ${selectedStoreName || storeId}` : 'Select a store'}
          </div>
        </div>
      </div>

      <h1 style={titleStyles}>Inventory Dashboard</h1>

      {/* Stats Cards */}
      <div style={statsGridStyles}>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Total Items</div>
          <div style={statValueStyles}>{allItems.length}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Total Value</div>
          <div style={statValueStyles}>₹{inventoryValue?.totalValue.toLocaleString() || 0}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Low Stock</div>
          <div style={statValueStyles}>{lowStockItems.length}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Out of Stock</div>
          <div style={statValueStyles}>{outOfStockItems.length}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Expiring Soon</div>
          <div style={statValueStyles}>{expiringItems.length}</div>
        </div>
      </div>

      {/* Alerts Section */}
      <div style={alertSectionStyles}>
        {lowStockItems.length > 0 && (
          <div style={alertCardStyles('warning')}>
            <strong>⚠️ Low Stock Alert:</strong> {lowStockItems.length} items are running low on stock
          </div>
        )}
        {outOfStockItems.length > 0 && (
          <div style={alertCardStyles('error')}>
            <strong>❌ Out of Stock:</strong> {outOfStockItems.length} items are out of stock
          </div>
        )}
        {expiringItems.length > 0 && (
          <div style={alertCardStyles('info')}>
            <strong>📅 Expiring Soon:</strong> {expiringItems.length} items expiring within 7 days
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={controlsStyles}>
        <input
          type="text"
          placeholder="Search by item name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyles}
        />
        <Button onClick={() => setAddDialogOpen(true)}>+ Add Item</Button>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[6], flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            style={categoryButtonStyles(selectedCategory === cat)}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div style={tableContainerStyles}>
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={tableHeaderStyles}>Item Code</th>
              <th style={tableHeaderStyles}>Item Name</th>
              <th style={tableHeaderStyles}>Category</th>
              <th style={tableHeaderStyles}>Current Stock</th>
              <th style={tableHeaderStyles}>Available</th>
              <th style={tableHeaderStyles}>Min Stock</th>
              <th style={tableHeaderStyles}>Unit Cost</th>
              <th style={tableHeaderStyles}>Status</th>
              <th style={tableHeaderStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} style={tableRowStyles}>
                <td style={tableCellStyles}>{item.itemCode}</td>
                <td style={tableCellStyles}>
                  <strong>{item.itemName}</strong>
                  {item.isPerishable && <span style={{ marginLeft: spacing[2] }}>🥬</span>}
                </td>
                <td style={tableCellStyles}>{item.category.replace('_', ' ')}</td>
                <td style={tableCellStyles}>
                  {item.currentStock} {item.unit}
                </td>
                <td style={tableCellStyles}>
                  {(item.currentStock - item.reservedStock).toFixed(2)} {item.unit}
                </td>
                <td style={tableCellStyles}>
                  {item.minimumStock} {item.unit}
                </td>
                <td style={tableCellStyles}>₹{item.unitCost.toFixed(2)}</td>
                <td style={tableCellStyles}>
                  <span style={statusBadgeStyles(item.status)}>{item.status.replace('_', ' ')}</span>
                </td>
                <td style={tableCellStyles}>
                  <button style={actionButtonStyles} onClick={() => handleAdjustStock(item)}>
                    Adjust
                  </button>
                  <button
                    style={{ ...actionButtonStyles, color: colors.semantic.error }}
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: spacing[10], color: colors.text.tertiary }}>
            No inventory items found
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedItem && (
        <StockAdjustmentDialog
          open={adjustmentDialogOpen}
          onClose={() => {
            setAdjustmentDialogOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
        />
      )}
      <AddInventoryItemDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} storeId={storeId} />
      </div>
    </>
  );
};

export default InventoryDashboardPage;
