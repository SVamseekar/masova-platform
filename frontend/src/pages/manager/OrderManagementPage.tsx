import React, { useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import StoreSelector from '../../components/StoreSelector';
import OrderForm from '../../components/forms/OrderForm';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId, selectSelectedStoreName } from '../../store/slices/cartSlice';
import {
  useGetStoreOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderPriorityMutation,
  useCancelOrderMutation,
  useAssignDriverMutation,
  Order,
} from '../../store/api/orderApi';
import { useGetUsersQuery } from '../../store/api/userApi';
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, PAYMENT_STATUS_CONFIG } from '../../types/order';
import type { OrderStatus, OrderPriority } from '../../types/order';

const OrderManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const selectedStoreName = useAppSelector(selectSelectedStoreName);

  // Use selected store or fallback to user's store
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  // API hooks
  const { data: orders = [], isLoading, refetch } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId,
    pollingInterval: 10000, // Poll every 10 seconds
  });

  const { data: users = [] } = useGetUsersQuery({});
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateOrderPriority] = useUpdateOrderPriorityMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [assignDriver] = useAssignDriverMutation();

  // Get drivers
  const drivers = users.filter(user => user.type === 'DRIVER');

  // Filter orders by status
  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(order => order.status === statusFilter);

  // Sort orders: urgent first, then by creation time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    active: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    revenue: orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.total, 0),
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
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
      <div>
        <AppHeader title="Create New Order" />
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
    <div className="order-management" style={{ background: '#f0f0f0', minHeight: '100vh' }}>
      <AppHeader title="Order Management" />

      {/* Store Selector */}
      <div style={{
        background: 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '1400px', margin: '0 auto' }}>
          <StoreSelector variant="manager" />
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {storeId ? `Managing orders for: ${selectedStoreName || storeId}` : 'Select a store to manage orders'}
          </div>
        </div>
      </div>

      <style>{`
        .order-management {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .stat-card {
          background: #f0f0f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow:
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }

        .stat-label {
          font-size: 13px;
          font-weight: 600;
          color: #666;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #e53e3e;
        }

        .controls-section {
          padding: 0 24px 24px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 12px;
          background: #f0f0f0;
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          transition: all 0.2s ease;
        }

        .filter-btn.active {
          color: #e53e3e;
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .filter-btn:hover {
          transform: translateY(-1px);
        }

        .create-order-btn {
          margin-left: auto;
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          background: #e53e3e;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .create-order-btn:hover {
          background: #dc2626;
        }

        .orders-section {
          padding: 0 24px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-card {
          background: #f0f0f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow:
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
          border-left: 4px solid transparent;
        }

        .order-card.urgent {
          border-left-color: #ef4444;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .order-number {
          font-size: 22px;
          font-weight: 800;
          color: #e53e3e;
        }

        .order-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-status {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }

        .badge-type {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .badge-payment {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .badge-priority {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .order-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .order-items {
          background: #f0f0f0;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.2),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }

        .order-item {
          padding: 8px 0;
          border-bottom: 1px solid rgba(163, 163, 163, 0.1);
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
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .item-qty {
          background: #e53e3e;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-right: 8px;
        }

        .item-price {
          font-size: 13px;
          font-weight: 700;
          color: #e53e3e;
        }

        .order-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          background: #f0f0f0;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .action-btn:active {
          transform: scale(0.98);
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.3),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }

        .action-btn.primary {
          color: #10b981;
        }

        .action-btn.danger {
          color: #ef4444;
        }

        .action-btn.warning {
          color: #f59e0b;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
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

      <AppHeader title="Order Management" />

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

      {/* Controls */}
      <div className="controls-section">
        <div className="filter-group">
          <button
            className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Orders
          </button>
          <button
            className={`filter-btn ${statusFilter === 'RECEIVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('RECEIVED')}
          >
            Received
          </button>
          <button
            className={`filter-btn ${statusFilter === 'PREPARING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PREPARING')}
          >
            Preparing
          </button>
          <button
            className={`filter-btn ${statusFilter === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('DELIVERED')}
          >
            Delivered
          </button>
          <button
            className={`filter-btn ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('CANCELLED')}
          >
            Cancelled
          </button>
        </div>
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
        ) : sortedOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div>No orders found</div>
          </div>
        ) : (
          <div className="orders-list">
            {sortedOrders.map((order) => (
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
                          = Assign Driver
                        </button>
                      )}

                      <button className="action-btn danger" onClick={() => handleCancelOrder(order.id)}>
                        L Cancel Order
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

export default OrderManagementPage;
