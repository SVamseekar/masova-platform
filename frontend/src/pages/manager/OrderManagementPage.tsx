import React, { useState, useMemo, useEffect } from 'react';
import AppHeader from '../../components/common/AppHeader';
import OrderForm from '../../components/forms/OrderForm';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { setSelectedStore, selectSelectedStoreId } from '../../store/slices/cartSlice';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import {
  useGetStoreOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderPriorityMutation,
  useCancelOrderMutation,
  useAssignDriverMutation,
  useUpdatePaymentStatusMutation,
  Order,
} from '../../store/api/orderApi';
import { useGetUsersQuery } from '../../store/api/userApi';
import { useGetTodaySalesMetricsQuery } from '../../store/api/analyticsApi';
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, PAYMENT_STATUS_CONFIG } from '../../types/order';
import type { OrderStatus, OrderPriority } from '../../types/order';
import { FilterBar, type FilterConfig, type FilterValues, type SortConfig } from '../../components/common/FilterBar';
import { applyFilters, applySort, exportToCSV, commonFilters } from '../../utils/filterUtils';
import { colors, spacing, typography, shadows } from '../../styles/design-tokens';

const OrderManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const reduxSelectedStoreId = useAppSelector(selectSelectedStoreId);
  const { selectedStoreId } = usePageStore();
  const { handleBack } = useSmartBackNavigation();
  const [isStoreInitialized, setIsStoreInitialized] = useState(false);

  // Initialize Redux store selection IMMEDIATELY if not set (for API headers)
  // This must happen BEFORE any API calls are made
  useEffect(() => {
    if (!reduxSelectedStoreId && currentUser?.storeId) {
      // Set user's assigned store as default in Redux for API headers
      dispatch(setSelectedStore({
        storeId: currentUser.storeId,
        storeName: currentUser.storeId // Use storeId as storeName for now
      }));
      setIsStoreInitialized(true);
    } else if (reduxSelectedStoreId) {
      // Redux store already has a selected store
      setIsStoreInitialized(true);
    } else if (currentUser && !currentUser.storeId) {
      console.error('[OrderManagementPage] ERROR: User has no storeId! User:', currentUser);
      // User doesn't have a storeId - they MUST select one via StoreSelector
      // Mark as initialized so component can render, but skip will prevent API call
      setIsStoreInitialized(true);
    }
  }, [reduxSelectedStoreId, currentUser, dispatch]);

  // Use selected store or fallback to user's store
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter and sort state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: '',
    orderType: '',
    paymentStatus: '',
    dateRange: {},
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc',
  });

  // API hooks - WAIT for store initialization before making API calls
  const { data: orders = [], isLoading, refetch } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId || !isStoreInitialized, // Skip until store is initialized
    pollingInterval: 10000, // Poll every 10 seconds
  });

  const { data: users = [] } = useGetUsersQuery();

  // Fetch real-time analytics for the stats cards
  const { data: todaySalesMetrics, refetch: refetchAnalytics } = useGetTodaySalesMetricsQuery(storeId, {
    skip: !storeId || !isStoreInitialized,
    pollingInterval: 60000, // Refresh every minute
  });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateOrderPriority] = useUpdateOrderPriorityMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [assignDriver] = useAssignDriverMutation();

  // Get drivers
  const drivers = users.filter(user => user.type === 'DRIVER');

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      type: 'search',
      label: 'Search',
      field: 'search',
      placeholder: 'Search by order ID or customer...',
    },
    {
      type: 'select',
      label: 'Status',
      field: 'status',
      options: Object.keys(ORDER_STATUS_CONFIG).map(status => ({
        label: ORDER_STATUS_CONFIG[status as OrderStatus].label,
        value: status,
      })),
    },
    {
      type: 'select',
      label: 'Order Type',
      field: 'orderType',
      options: Object.keys(ORDER_TYPE_CONFIG).map(type => ({
        label: ORDER_TYPE_CONFIG[type as keyof typeof ORDER_TYPE_CONFIG].label,
        value: type,
      })),
    },
    {
      type: 'select',
      label: 'Payment Status',
      field: 'paymentStatus',
      options: Object.keys(PAYMENT_STATUS_CONFIG).map(status => ({
        label: PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG].label,
        value: status,
      })),
    },
    {
      type: 'dateRange',
      label: 'Order Date',
      field: 'dateRange',
    },
  ];

  const sortOptions = [
    { label: 'Order Date', field: 'createdAt' },
    { label: 'Total Amount', field: 'total' },
    { label: 'Status', field: 'status' },
    { label: 'Priority', field: 'priority' },
  ];

  // Apply filters and sorting
  const filteredAndSortedOrders = useMemo(() => {
    const filtered = applyFilters(orders, filterValues, {
      search: (order, value) =>
        commonFilters.searchText(order, value as string, ['id', 'customer.name', 'customer.phone']),
      status: (order, value) => order.status === value,
      orderType: (order, value) => order.orderType === value,
      paymentStatus: (order, value) => order.paymentStatus === value,
      dateRange: (order, value) =>
        commonFilters.dateRange(order, value as { from?: string; to?: string }, 'createdAt'),
    });

    // Sort with priority consideration (urgent orders first)
    return filtered.sort((a, b) => {
      // First, sort by priority (URGENT comes first)
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;

      // Then apply the selected sort config
      const aValue = a[sortConfig.field as keyof Order];
      const bValue = b[sortConfig.field as keyof Order];

      if (sortConfig.field === 'createdAt') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (sortConfig.field === 'total') {
        return sortConfig.direction === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }

      // String comparison for other fields
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [orders, filterValues, sortConfig]);

  const handleFilterChange = (field: string, value: string | string[] | { from?: string; to?: string }) => {
    setFilterValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      status: '',
      orderType: '',
      paymentStatus: '',
      dateRange: {},
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
      filteredAndSortedOrders,
      'orders',
      [
        { label: 'Order ID', field: 'id' },
        { label: 'Customer Name', field: 'customer.name' },
        { label: 'Customer Phone', field: 'customer.phone' },
        {
          label: 'Order Type',
          field: 'orderType',
          format: (value) => ORDER_TYPE_CONFIG[value as keyof typeof ORDER_TYPE_CONFIG]?.label || value,
        },
        {
          label: 'Status',
          field: 'status',
          format: (value) => ORDER_STATUS_CONFIG[value as OrderStatus]?.label || value,
        },
        {
          label: 'Total Amount',
          field: 'total',
          format: (value) => `₹${value}`,
        },
        {
          label: 'Payment Status',
          field: 'paymentStatus',
          format: (value) => PAYMENT_STATUS_CONFIG[value as keyof typeof PAYMENT_STATUS_CONFIG]?.label || value,
        },
        {
          label: 'Created At',
          field: 'createdAt',
          format: (value) => new Date(value).toLocaleString(),
        },
      ]
    );
  };

  // Calculate statistics - use real-time analytics when available, fallback to local calculation
  const stats = {
    total: todaySalesMetrics?.todayOrderCount ?? filteredAndSortedOrders.length,
    active: filteredAndSortedOrders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
    delivered: filteredAndSortedOrders.filter(o => o.status === 'DELIVERED').length,
    cancelled: filteredAndSortedOrders.filter(o => o.status === 'CANCELLED').length,
    revenue: todaySalesMetrics?.todaySales ?? filteredAndSortedOrders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.total, 0),
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
      // Refetch both orders and analytics to update stats cards immediately
      refetch();
      refetchAnalytics();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    }
  };

  const handleMarkAsCompleted = async (orderId: string) => {
    try {
      await updateOrderStatus({ orderId, status: 'DELIVERED' }).unwrap();
      // Refetch both orders and analytics to update stats cards immediately
      refetch();
      refetchAnalytics();
    } catch (error) {
      console.error('Failed to mark order as completed:', error);
      alert('Failed to mark order as completed');
    }
  };

  const handlePriorityChange = async (orderId: string, priority: OrderPriority) => {
    try {
      await updateOrderPriority({ orderId, priority }).unwrap();
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Failed to update priority');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      await cancelOrder({ orderId, reason }).unwrap();
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order');
    }
  };

  const handleAssignDriver = async (orderId: string) => {
    if (drivers.length === 0) {
      alert('No drivers available');
      return;
    }

    const driverList = drivers.map((d, i) => `${i + 1}. ${d.name} (${d.id})`).join('\n');
    const selection = prompt(`Select driver:\n${driverList}\n\nEnter driver number:`);

    if (!selection) return;

    const driverIndex = parseInt(selection) - 1;
    if (driverIndex < 0 || driverIndex >= drivers.length) {
      alert('Invalid selection');
      return;
    }

    try {
      await assignDriver({ orderId, driverId: drivers[driverIndex].id }).unwrap();
      alert('Driver assigned successfully');
    } catch (error) {
      console.error('Failed to assign driver:', error);
      alert('Failed to assign driver');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}`;
  };

  if (showOrderForm) {
    return (
      <div style={{ paddingTop: '80px' }}>
        <AppHeader title="Create New Order" showManagerNav={true} />
        <OrderForm
          onSuccess={(orderId) => {
            setShowOrderForm(false);
            refetch();
          }}
          onCancel={() => setShowOrderForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="order-management" style={{ background: colors.surface.background, minHeight: '100vh' }}>
      <AppHeader title="Order Management" showBackButton={true} onBack={handleBack} showManagerNav={true} />

      <style>{`
        .order-management {
          font-family: ${typography.fontFamily.primary};
          padding: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: ${spacing[5]};
          padding: ${spacing[6]};
          max-width: 1400px;
          margin: 0 auto;
        }

        .stat-card {
          background: ${colors.surface.primary};
          border-radius: 16px;
          padding: ${spacing[5]};
          border: 2px solid ${colors.surface.border};
          box-shadow: 8px 8px 16px rgba(163, 163, 163, 0.25),
                      -8px -8px 16px rgba(255, 255, 255, 0.9);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 10px 10px 20px rgba(163, 163, 163, 0.3),
                      -10px -10px 20px rgba(255, 255, 255, 1);
          border-color: ${colors.brand.primary}44;
        }

        .stat-label {
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.secondary};
          margin-bottom: ${spacing[2]};
        }

        .stat-value {
          font-size: ${typography.fontSize['3xl']};
          font-weight: ${typography.fontWeight.extrabold};
          color: ${colors.brand.primary};
        }

        .controls-section {
          padding: 0 ${spacing[6]} ${spacing[6]};
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: ${spacing[4]};
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          gap: ${spacing[2]};
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: ${spacing[3]} ${spacing[5]};
          border: 2px solid ${colors.surface.border};
          border-radius: 12px;
          background: ${colors.surface.primary};
          box-shadow: 6px 6px 12px rgba(163, 163, 163, 0.25),
                      -6px -6px 12px rgba(255, 255, 255, 0.9);
          cursor: pointer;
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.bold};
          color: ${colors.text.primary};
          transition: all 0.2s ease;
        }

        .filter-btn.active {
          color: ${colors.brand.primary};
          border-color: ${colors.brand.primary};
          box-shadow: inset 4px 4px 8px rgba(163, 163, 163, 0.25),
                      inset -4px -4px 8px rgba(255, 255, 255, 0.9);
          background: ${colors.brand.primaryLight}11;
        }

        .filter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 8px 8px 16px rgba(163, 163, 163, 0.3),
                      -8px -8px 16px rgba(255, 255, 255, 1);
          border-color: ${colors.brand.primary}88;
        }

        .create-order-btn {
          margin-left: auto;
          padding: ${spacing[3]} ${spacing[6]};
          border: 2px solid ${colors.brand.primary};
          border-radius: 12px;
          background: linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryDark} 100%);
          color: ${colors.text.inverse};
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.bold};
          cursor: pointer;
          box-shadow: 6px 6px 16px ${colors.brand.primary}44,
                      -2px -2px 8px rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .create-order-btn:hover {
          transform: translateY(-2px);
          box-shadow: 8px 8px 20px ${colors.brand.primary}66,
                      -3px -3px 10px rgba(255, 255, 255, 0.4);
          background: linear-gradient(135deg, ${colors.brand.primaryDark} 0%, ${colors.brand.primary} 100%);
        }

        .create-order-btn:active {
          transform: scale(0.98);
          box-shadow: inset 4px 4px 8px ${colors.brand.primaryDark}88,
                      inset -2px -2px 6px ${colors.brand.primary}44;
        }

        .orders-section {
          padding: 0 ${spacing[6]} ${spacing[6]};
          max-width: 1400px;
          margin: 0 auto;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: ${spacing[4]};
        }

        .order-card {
          background: ${colors.surface.primary};
          border-radius: 16px;
          padding: ${spacing[5]};
          border: 2px solid ${colors.surface.border};
          border-left: 4px solid transparent;
          box-shadow: 8px 8px 16px rgba(163, 163, 163, 0.25),
                      -8px -8px 16px rgba(255, 255, 255, 0.9);
          transition: all 0.3s ease;
        }

        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 10px 10px 20px rgba(163, 163, 163, 0.3),
                      -10px -10px 20px rgba(255, 255, 255, 1);
        }

        .order-card.urgent {
          border-left-color: ${colors.semantic.error};
          border-left-width: 6px;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: ${spacing[4]};
          flex-wrap: wrap;
          gap: ${spacing[3]};
        }

        .order-number {
          font-size: ${typography.fontSize['2xl']};
          font-weight: ${typography.fontWeight.extrabold};
          color: ${colors.brand.primary};
        }

        .order-badges {
          display: flex;
          gap: ${spacing[2]};
          flex-wrap: wrap;
        }

        .badge {
          padding: ${spacing[1]} ${spacing[3]};
          border-radius: 8px;
          font-size: ${typography.fontSize.xs};
          font-weight: ${typography.fontWeight.bold};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-status {
          background: ${colors.semantic.infoLight}22;
          color: ${colors.semantic.info};
        }

        .badge-type {
          background: ${colors.semantic.successLight}22;
          color: ${colors.semantic.success};
        }

        .badge-payment {
          background: ${colors.semantic.warningLight}22;
          color: ${colors.semantic.warning};
        }

        .badge-priority {
          background: ${colors.semantic.errorLight}22;
          color: ${colors.semantic.error};
        }

        .order-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: ${spacing[4]};
          margin-bottom: ${spacing[4]};
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: ${typography.fontSize.xs};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.secondary};
          margin-bottom: ${spacing[1]};
        }

        .info-value {
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
        }

        .order-items {
          background: ${colors.surface.primary};
          border-radius: 12px;
          padding: ${spacing[3]};
          margin-bottom: ${spacing[4]};
          box-shadow: ${shadows.inset.sm};
        }

        .order-item {
          padding: ${spacing[2]} 0;
          border-bottom: 1px solid ${colors.surface.border};
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-name {
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
        }

        .item-qty {
          background: ${colors.brand.primary};
          color: ${colors.text.inverse};
          padding: ${spacing[1]} ${spacing[2]};
          border-radius: 4px;
          font-size: ${typography.fontSize.xs};
          font-weight: ${typography.fontWeight.bold};
          margin-right: ${spacing[2]};
        }

        .item-price {
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.bold};
          color: ${colors.brand.primary};
        }

        .order-actions {
          display: flex;
          gap: ${spacing[2]};
          flex-wrap: wrap;
        }

        .action-btn {
          padding: ${spacing[2]} ${spacing[4]};
          border: 2px solid ${colors.surface.border};
          border-radius: 10px;
          background: ${colors.surface.primary};
          box-shadow: 6px 6px 12px rgba(163, 163, 163, 0.25),
                      -6px -6px 12px rgba(255, 255, 255, 0.9);
          cursor: pointer;
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.bold};
          color: ${colors.text.primary};
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 8px 8px 16px rgba(163, 163, 163, 0.3),
                      -8px -8px 16px rgba(255, 255, 255, 1);
          border-color: ${colors.brand.primary};
        }

        .action-btn:active {
          transform: scale(0.98);
          box-shadow: inset 4px 4px 8px rgba(163, 163, 163, 0.25),
                      inset -4px -4px 8px rgba(255, 255, 255, 0.9);
        }

        .action-btn.primary {
          color: ${colors.semantic.success};
          border-color: ${colors.semantic.success}44;
        }

        .action-btn.primary:hover {
          border-color: ${colors.semantic.success};
          background: ${colors.semantic.successLight}11;
        }

        .action-btn.danger {
          color: ${colors.semantic.error};
          border-color: ${colors.semantic.error}44;
        }

        .action-btn.danger:hover {
          border-color: ${colors.semantic.error};
          background: ${colors.semantic.errorLight}11;
        }

        .action-btn.warning {
          color: ${colors.semantic.warning};
          border-color: ${colors.semantic.warning}44;
        }

        .action-btn.warning:hover {
          border-color: ${colors.semantic.warning};
          background: ${colors.semantic.warningLight}11;
        }

        .action-btn.success {
          color: ${colors.text.inverse};
          background: linear-gradient(135deg, ${colors.semantic.success} 0%, #059669 100%);
          border-color: ${colors.semantic.success};
          font-weight: ${typography.fontWeight.extrabold};
          box-shadow: 6px 6px 12px ${colors.semantic.success}44,
                      -6px -6px 12px rgba(255, 255, 255, 0.9);
        }

        .action-btn.success:hover {
          background: linear-gradient(135deg, #059669 0%, ${colors.semantic.success} 100%);
          box-shadow: 8px 8px 16px ${colors.semantic.success}66,
                      -8px -8px 16px rgba(255, 255, 255, 1);
          transform: translateY(-3px);
        }

        .action-btn.success:active {
          transform: scale(0.97);
          box-shadow: inset 4px 4px 8px rgba(5, 150, 105, 0.5),
                      inset -4px -4px 8px rgba(16, 185, 129, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: ${spacing[10]} ${spacing[5]};
          color: ${colors.text.tertiary};
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        select.status-select {
          padding: 6px 10px;
          border: none;
          border-radius: 8px;
          background: #f0f0f0;
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.2),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
          font-size: 12px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .order-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Orders</div>
          <div className="stat-value">{stats.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered</div>
          <div className="stat-value">{stats.delivered}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelled</div>
          <div className="stat-value">{stats.cancelled}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatCurrency(stats.revenue)}</div>
        </div>
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
        showExport={filteredAndSortedOrders.length > 0}
      />

      {/* Controls */}
      <div className="controls-section" style={{ justifyContent: 'flex-end', marginTop: spacing[4] }}>
        <button className="create-order-btn" onClick={() => setShowOrderForm(true)}>
          + Create Order
        </button>
      </div>

      {/* Orders List */}
      <div className="orders-section">
        {isLoading ? (
          <div className="loading-state">
            <div className="empty-icon"></div>
            <div>Loading orders...</div>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div>
              {orders.length > 0 ? 'No orders match the current filters' : 'No orders found'}
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {filteredAndSortedOrders.map((order) => (
              <div key={order.id} className={`order-card ${order.priority === 'URGENT' ? 'urgent' : ''}`}>
                {/* Header */}
                <div className="order-header">
                  <div className="order-number">#{order.orderNumber}</div>
                  <div className="order-badges">
                    <span className="badge badge-status" style={{ color: ORDER_STATUS_CONFIG[order.status].color }}>
                      {ORDER_STATUS_CONFIG[order.status].icon} {ORDER_STATUS_CONFIG[order.status].label}
                    </span>
                    <span className="badge badge-type" style={{ color: ORDER_TYPE_CONFIG[order.orderType].color }}>
                      {ORDER_TYPE_CONFIG[order.orderType].icon} {ORDER_TYPE_CONFIG[order.orderType].label}
                    </span>
                    <span className="badge badge-payment" style={{ color: PAYMENT_STATUS_CONFIG[order.paymentStatus].color }}>
                      {PAYMENT_STATUS_CONFIG[order.paymentStatus].icon} {PAYMENT_STATUS_CONFIG[order.paymentStatus].label}
                    </span>
                    {/* Payment Method Badge */}
                    {order.paymentMethod && (
                      <span
                        className="badge badge-payment-method"
                        style={{
                          backgroundColor: order.paymentMethod === 'CASH' ? '#fef3c7' :
                                         order.paymentMethod === 'CARD' ? '#dbeafe' :
                                         order.paymentMethod === 'UPI' ? '#d1fae5' : '#e5e7eb',
                          color: order.paymentMethod === 'CASH' ? '#92400e' :
                                 order.paymentMethod === 'CARD' ? '#1e40af' :
                                 order.paymentMethod === 'UPI' ? '#065f46' : '#1f2937',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {order.paymentMethod === 'CASH' ? '💵' :
                         order.paymentMethod === 'CARD' ? '💳' :
                         order.paymentMethod === 'UPI' ? '📱' : '💰'} {order.paymentMethod}
                      </span>
                    )}
                    {order.priority === 'URGENT' && (
                      <span className="badge badge-priority"> URGENT</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="order-info">
                  <div className="info-item">
                    <div className="info-label">Customer</div>
                    <div className="info-value">{order.customerName}</div>
                  </div>
                  {order.customerPhone && (
                    <div className="info-item">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{order.customerPhone}</div>
                    </div>
                  )}
                  <div className="info-item">
                    <div className="info-label">Created At</div>
                    <div className="info-value">{formatDate(order.createdAt)}</div>
                  </div>
                  {order.createdByStaffName && (
                    <div className="info-item">
                      <div className="info-label">👤 Taken By</div>
                      <div className="info-value" style={{ fontWeight: 600, color: '#2563eb' }}>
                        {order.createdByStaffName}
                      </div>
                    </div>
                  )}
                  <div className="info-item">
                    <div className="info-label">Total</div>
                    <div className="info-value" style={{ color: '#e53e3e', fontSize: '16px' }}>
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="item-row">
                        <div>
                          <span className="item-qty">{item.quantity}x</span>
                          <span className="item-name">{item.name}</span>
                          {item.variant && <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>({item.variant})</span>}
                        </div>
                        <div className="item-price">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', marginLeft: '32px' }}>
                          {item.customizations.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="order-actions">
                  {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                    <>
                      {/* Show prominent "Mark as Completed" button for DISPATCHED orders */}
                      {order.status === 'DISPATCHED' && (
                        <button
                          className="action-btn success"
                          onClick={() => handleMarkAsCompleted(order.id)}
                          title="Mark order as completed and delivered to update metrics"
                        >
                          ✓ Mark as Completed
                        </button>
                      )}

                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      >
                        <option value="RECEIVED">Received</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="OVEN">In Oven</option>
                        <option value="BAKED">Baked</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>

                      <button
                        className="action-btn warning"
                        onClick={() => handlePriorityChange(order.id, order.priority === 'URGENT' ? 'NORMAL' : 'URGENT')}
                      >
                        {order.priority === 'URGENT' ? ' Normal' : ' Mark Urgent'}
                      </button>

                      {order.orderType === 'DELIVERY' && !order.assignedDriverId && (
                        <button className="action-btn primary" onClick={() => handleAssignDriver(order.id)}>
                          🚚 Assign Driver
                        </button>
                      )}

                      <button className="action-btn danger" onClick={() => handleCancelOrder(order.id)}>
                        ❌ Cancel Order
                      </button>
                    </>
                  )}

                  <button className="action-btn" onClick={() => setSelectedOrder(order)}>
                    =A View Details
                  </button>
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', fontSize: '12px' }}>
                    <strong>Special Instructions:</strong> {order.specialInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default withPageStoreContext(OrderManagementPage, 'orders');
