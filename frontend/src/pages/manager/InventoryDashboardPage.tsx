import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
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
import { FilterBar, type FilterConfig, type FilterValues, type SortConfig } from '../../components/common/FilterBar';
import { applyFilters, applySort, exportToCSV, commonFilters } from '../../utils/filterUtils';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../../styles/neumorphic-utils';
import StockAdjustmentDialog from '../../components/inventory/StockAdjustmentDialog';
import AddInventoryItemDialog from '../../components/inventory/AddInventoryItemDialog';

const InventoryDashboardPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const { handleBack } = useSmartBackNavigation();

  // Use selected store or fallback to user's store
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Filter and sort state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    category: '',
    stockStatus: '',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'itemName',
    direction: 'asc',
  });

  // Fetch data
  // Pass storeId to trigger refetch when store changes
  const { data: allItems = [], isLoading: itemsLoading, refetch: refetchAllItems } = useGetAllInventoryItemsQuery(storeId, {
    skip: !storeId,
    pollingInterval: 60000, // Poll every minute
  });
  // Pass storeId to trigger refetch when store changes
  const { data: lowStockItems = [], refetch: refetchLowStock } = useGetLowStockAlertsQuery(storeId, { skip: !storeId });
  // Pass storeId to trigger refetch when store changes
  const { data: outOfStockItems = [], refetch: refetchOutOfStock } = useGetOutOfStockItemsQuery(storeId, { skip: !storeId });
  const { data: expiringItems = [], refetch: refetchExpiring } = useGetExpiringItemsQuery({ days: 7 }, { skip: !storeId });
  // Pass storeId to trigger refetch when store changes
  const { data: inventoryValue, refetch: refetchValue } = useGetTotalInventoryValueQuery(storeId, { skip: !storeId });

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

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      type: 'search',
      label: 'Search',
      field: 'search',
      placeholder: 'Search by item name or code...',
    },
    {
      type: 'select',
      label: 'Category',
      field: 'category',
      options: [
        { label: 'Raw Material', value: 'RAW_MATERIAL' },
        { label: 'Ingredient', value: 'INGREDIENT' },
        { label: 'Packaging', value: 'PACKAGING' },
        { label: 'Beverage', value: 'BEVERAGE' },
        { label: 'Other', value: 'OTHER' },
      ],
    },
    {
      type: 'select',
      label: 'Stock Status',
      field: 'stockStatus',
      options: [
        { label: 'In Stock', value: 'inStock' },
        { label: 'Low Stock', value: 'lowStock' },
        { label: 'Out of Stock', value: 'outOfStock' },
      ],
    },
  ];

  const sortOptions = [
    { label: 'Item Name', field: 'itemName' },
    { label: 'Item Code', field: 'itemCode' },
    { label: 'Quantity', field: 'quantity' },
    { label: 'Unit Price', field: 'unitPrice' },
  ];

  // Apply filters and sorting
  const filteredAndSortedItems = useMemo(() => {
    const filtered = applyFilters(allItems, filterValues, {
      search: (item, value) =>
        commonFilters.searchText(item, value as string, ['itemName', 'itemCode']),
      category: (item, value) => item.category === value,
      stockStatus: (item, value) => {
        if (value === 'inStock') return (item.quantity ?? 0) > (item.reorderLevel ?? 0);
        if (value === 'lowStock')
          return (item.quantity ?? 0) > 0 && (item.quantity ?? 0) <= (item.reorderLevel ?? 0);
        if (value === 'outOfStock') return (item.quantity ?? 0) === 0;
        return true;
      },
    });

    return applySort(filtered, sortConfig);
  }, [allItems, filterValues, sortConfig]);

  const handleFilterChange = (field: string, value: string | string[] | { from?: string; to?: string }) => {
    setFilterValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      category: '',
      stockStatus: '',
    });
  };

  const handleSortChange = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    exportToCSV(
      filteredAndSortedItems,
      'inventory',
      [
        { label: 'Item Code', field: 'itemCode' },
        { label: 'Item Name', field: 'itemName' },
        { label: 'Category', field: 'category' },
        { label: 'Quantity', field: 'quantity' },
        { label: 'Unit', field: 'unit' },
        { label: 'Unit Price', field: 'unitPrice', format: (v) => `₹${v}` },
        { label: 'Reorder Level', field: 'reorderLevel' },
        {
          label: 'Total Value',
          field: 'quantity',
          format: (v: any) => {
            // Note: This is a simplified version. Full implementation would need item context
            return `₹${v}`;
          },
        },
      ]
    );
  };

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
    paddingTop: '80px',
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
        <AppHeader title="Inventory Dashboard" showBackButton onBack={handleBack} showManagerNav={true} />
        <div style={{ textAlign: 'center', padding: spacing[10] }}>Loading inventory...</div>
      </div>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div style={containerStyles}>
        <AppHeader title="Inventory Management" showBackButton onBack={handleBack} showManagerNav={true} />

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

      {/* Filter Bar */}
      <FilterBar
        filters={filterConfigs}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        onExport={handleExport}
        showExport={filteredAndSortedItems.length > 0}
      />

      {/* Controls */}
      <div style={{ ...controlsStyles, justifyContent: 'flex-end', marginTop: spacing[4] }}>
        <Button onClick={() => setAddDialogOpen(true)}>+ Add Item</Button>
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
            {filteredAndSortedItems.map((item) => (
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

        {filteredAndSortedItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: spacing[10], color: colors.text.tertiary }}>
            {allItems.length > 0 ? 'No items match the current filters' : 'No inventory items found'}
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

export default withPageStoreContext(InventoryDashboardPage, 'inventory');
