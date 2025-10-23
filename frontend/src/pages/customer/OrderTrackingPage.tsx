import React, { useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCustomerOrdersQuery,
  Order,
} from '../../store/api/orderApi';
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, PAYMENT_STATUS_CONFIG, ORDER_STATUS_FLOW } from '../../types/order';

const OrderTrackingPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const customerId = currentUser?.id || '';

  const [orderNumberSearch, setOrderNumberSearch] = useState('');

  // API hooks
  const { data: customerOrders = [], isLoading, error } = useGetCustomerOrdersQuery(customerId, {
    skip: !customerId,
    pollingInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `¹${amount.toFixed(2)}`;
  };

  const getStatusProgress = (status: string): number => {
    const index = ORDER_STATUS_FLOW.indexOf(status as any);
    if (index === -1) return 0;
    return ((index + 1) / ORDER_STATUS_FLOW.length) * 100;
  };

  const getEstimatedTime = (order: Order): string => {
    if (order.status === 'DELIVERED') return 'Delivered';
    if (order.status === 'CANCELLED') return 'Cancelled';

    if (order.estimatedDeliveryTime) {
      return new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Calculate estimated time based on preparation time
    const prepTime = order.preparationTime || 30;
    const estimatedDate = new Date(new Date(order.createdAt).getTime() + prepTime * 60000);
    return estimatedDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const statusProgress = getStatusProgress(order.status);
    const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);

    return (
      <div className={`order-track-card ${isActive ? 'active' : ''}`}>
        {/* Header */}
        <div className="track-header">
          <div>
            <div className="track-order-number">#{order.orderNumber}</div>
            <div className="track-date">{formatDate(order.createdAt)}</div>
          </div>
          <div className="track-total">{formatCurrency(order.total)}</div>
        </div>

        {/* Status Progress Bar */}
        {isActive && (
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${statusProgress}%` }}></div>
            </div>
            <div className="progress-labels">
              {ORDER_STATUS_FLOW.map((status, idx) => {
                const statusConfig = ORDER_STATUS_CONFIG[status];
                const isCompleted = ORDER_STATUS_FLOW.indexOf(order.status) >= idx;
                const isCurrent = order.status === status;

                return (
                  <div
                    key={status}
                    className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="step-icon">{statusConfig.icon}</div>
                    <div className="step-label">{statusConfig.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="status-badge-section">
          <div className="status-badge" style={{ background: `${ORDER_STATUS_CONFIG[order.status].color}22`, color: ORDER_STATUS_CONFIG[order.status].color }}>
            {ORDER_STATUS_CONFIG[order.status].icon} {ORDER_STATUS_CONFIG[order.status].label}
          </div>
          <div className="type-badge" style={{ background: `${ORDER_TYPE_CONFIG[order.orderType].color}22`, color: ORDER_TYPE_CONFIG[order.orderType].color }}>
            {ORDER_TYPE_CONFIG[order.orderType].icon} {ORDER_TYPE_CONFIG[order.orderType].label}
          </div>
        </div>

        {/* Estimated Time */}
        {isActive && (
          <div className="estimated-time">
            <span className="time-label">Estimated {order.orderType === 'DELIVERY' ? 'Delivery' : 'Ready'} Time:</span>
            <span className="time-value">{getEstimatedTime(order)}</span>
          </div>
        )}

        {/* Order Items */}
        <div className="track-items">
          <div className="items-title">Items Ordered:</div>
          {order.items.map((item, idx) => (
            <div key={idx} className="track-item">
              <div className="track-item-main">
                <span className="track-item-qty">{item.quantity}x</span>
                <span className="track-item-name">{item.name}</span>
                {item.variant && <span className="track-item-variant">({item.variant})</span>}
              </div>
              <div className="track-item-price">{formatCurrency(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="payment-info">
          <div className="payment-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="payment-row">
            <span>Tax:</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="payment-row">
              <span>Delivery Fee:</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="payment-row total">
            <span>Total:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          <div className="payment-status">
            Payment: <span style={{ color: PAYMENT_STATUS_CONFIG[order.paymentStatus].color }}>
              {PAYMENT_STATUS_CONFIG[order.paymentStatus].icon} {PAYMENT_STATUS_CONFIG[order.paymentStatus].label}
            </span>
          </div>
        </div>

        {/* Delivery Address */}
        {order.orderType === 'DELIVERY' && order.deliveryAddress && (
          <div className="delivery-address">
            <div className="address-title">Delivery Address:</div>
            <div className="address-text">
              {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="special-instructions">
            <strong>Special Instructions:</strong> {order.specialInstructions}
          </div>
        )}

        {/* Cancellation Info */}
        {order.status === 'CANCELLED' && order.cancellationReason && (
          <div className="cancellation-info">
            <strong>Cancellation Reason:</strong> {order.cancellationReason}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="order-tracking" style={{ background: '#f0f0f0', minHeight: '100vh' }}>
      <style>{`
        .order-tracking {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 0;
        }

        .tracking-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
        }

        .search-section {
          background: #f0f0f0;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow:
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }

        .search-title {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin-bottom: 12px;
        }

        .search-form {
          display: flex;
          gap: 12px;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          background: #f0f0f0;
          border: none;
          border-radius: 12px;
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
          font-size: 14px;
          color: #333;
        }

        .search-btn {
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

        .search-btn:hover {
          background: #dc2626;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .order-track-card {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow:
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }

        .order-track-card.active {
          border-left: 4px solid #e53e3e;
        }

        .track-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .track-order-number {
          font-size: 24px;
          font-weight: 800;
          color: #e53e3e;
        }

        .track-date {
          font-size: 13px;
          color: #666;
          margin-top: 4px;
        }

        .track-total {
          font-size: 24px;
          font-weight: 800;
          color: #333;
        }

        .progress-section {
          margin-bottom: 24px;
        }

        .progress-bar {
          height: 6px;
          background: #f0f0f0;
          border-radius: 3px;
          margin-bottom: 16px;
          box-shadow:
            inset 2px 2px 4px rgba(163, 163, 163, 0.3),
            inset -2px -2px 4px rgba(255, 255, 255, 0.8);
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #e53e3e, #ff6b6b);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          opacity: 0.4;
          transition: all 0.3s ease;
        }

        .progress-step.completed,
        .progress-step.current {
          opacity: 1;
        }

        .progress-step.current .step-icon {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .step-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .step-label {
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          color: #333;
        }

        .status-badge-section {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .status-badge,
        .type-badge {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
        }

        .estimated-time {
          background: rgba(229, 62, 62, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .time-label {
          font-size: 13px;
          font-weight: 600;
          color: #666;
        }

        .time-value {
          font-size: 18px;
          font-weight: 800;
          color: #e53e3e;
        }

        .track-items {
          background: #f0f0f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.2),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .items-title {
          font-size: 14px;
          font-weight: 700;
          color: #333;
          margin-bottom: 12px;
        }

        .track-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(163, 163, 163, 0.1);
        }

        .track-item:last-child {
          border-bottom: none;
        }

        .track-item-main {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .track-item-qty {
          background: #e53e3e;
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
        }

        .track-item-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .track-item-variant {
          font-size: 12px;
          color: #666;
        }

        .track-item-price {
          font-size: 14px;
          font-weight: 700;
          color: #e53e3e;
        }

        .payment-info {
          background: #f0f0f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.2),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          color: #666;
        }

        .payment-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          border-top: 2px solid rgba(163, 163, 163, 0.2);
          padding-top: 12px;
          margin-top: 8px;
        }

        .payment-status {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(163, 163, 163, 0.2);
          font-size: 13px;
          font-weight: 600;
          color: #666;
        }

        .delivery-address {
          background: rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 12px;
        }

        .address-title {
          font-size: 12px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }

        .address-text {
          font-size: 13px;
          color: #666;
        }

        .special-instructions {
          background: rgba(245, 158, 11, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
        }

        .cancellation-info {
          background: rgba(239, 68, 68, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: #dc2626;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 18px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        @media (max-width: 768px) {
          .progress-labels {
            flex-wrap: wrap;
          }

          .progress-step {
            min-width: 33%;
          }

          .step-label {
            font-size: 10px;
          }
        }
      `}</style>

      <AppHeader title="Track Your Orders" />

      <div className="tracking-container">
        {/* Search by Order Number */}
        <div className="search-section">
          <div className="search-title">Track by Order Number</div>
          <div className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Enter order number (e.g., ORD-20241023-001)"
              value={orderNumberSearch}
              onChange={(e) => setOrderNumberSearch(e.target.value)}
            />
            <button className="search-btn">
              = Track
            </button>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="loading-state">
            <div className="empty-icon">ó</div>
            <div>Loading your orders...</div>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon"> </div>
            <div className="empty-text">Failed to load orders</div>
          </div>
        ) : customerOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">=í</div>
            <div className="empty-text">You haven't placed any orders yet</div>
          </div>
        ) : (
          <div className="orders-list">
            {customerOrders
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
