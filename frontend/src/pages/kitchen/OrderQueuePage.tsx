import React from 'react';
import AppHeader from '../../components/common/AppHeader';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetKitchenQueueQuery,
  useMoveToNextStageMutation,
  Order,
} from '../../store/api/orderApi';
import { ORDER_STATUS_CONFIG } from '../../types/order';

/**
 * OrderQueuePage - Simplified kitchen queue view
 * Alternative to KitchenDisplayPage with a more compact list-based layout
 */
const OrderQueuePage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const storeId = currentUser?.storeId || '';

  // API hooks
  const { data: orders = [], isLoading, error } = useGetKitchenQueueQuery(storeId, {
    skip: !storeId,
    pollingInterval: 5000, // Poll every 5 seconds
  });

  const [moveToNextStage, { isLoading: isMoving }] = useMoveToNextStageMutation();

  // Sort orders: urgent first, then by creation time
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const handleMoveToNextStage = async (orderId: string) => {
    try {
      await moveToNextStage(orderId).unwrap();
    } catch (error) {
      console.error('Failed to move order:', error);
      alert('Failed to update order status');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getElapsedMinutes = (dateStr: string): number => {
    const created = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.floor((now - created) / 60000);
  };

  return (
    <div className="order-queue" style={{ background: '#f0f0f0', minHeight: '100vh' }}>
      <style>{`
        .order-queue {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 0;
        }

        .queue-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .queue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: #f0f0f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow:
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }

        .queue-stats {
          display: flex;
          gap: 24px;
        }

        .stat-box {
          text-align: center;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #e53e3e;
        }

        .queue-table {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow:
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .table-header {
          display: grid;
          grid-template-columns: 80px 1fr 120px 120px 100px 150px;
          gap: 16px;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid rgba(163, 163, 163, 0.2);
          margin-bottom: 12px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 80px 1fr 120px 120px 100px 150px;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: #f0f0f0;
          border-radius: 12px;
          margin-bottom: 12px;
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }

        .table-row.urgent {
          border-left: 4px solid #ef4444;
        }

        .table-row:hover {
          transform: translateX(4px);
        }

        .order-num {
          font-size: 16px;
          font-weight: 800;
          color: #e53e3e;
        }

        .order-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .customer-name {
          font-size: 14px;
          font-weight: 700;
          color: #333;
        }

        .order-items-text {
          font-size: 12px;
          color: #666;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
        }

        .order-type-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }

        .time-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          background: #f0f0f0;
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.2),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }

        .time-badge.warning {
          color: #f59e0b;
        }

        .time-badge.danger {
          color: #ef4444;
        }

        .next-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 10px;
          background: #10b981;
          color: white;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .next-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .next-btn:active {
          transform: scale(0.95);
        }

        .next-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .error-state {
          text-align: center;
          padding: 60px 20px;
          color: #ef4444;
        }

        @media (max-width: 1024px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-header {
            display: none;
          }

          .table-row {
            padding: 12px;
          }

          .queue-stats {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>

      <AppHeader title="Order Queue" />

      <div className="queue-container">
        {/* Header with Stats */}
        <div className="queue-header">
          <div className="queue-stats">
            <div className="stat-box">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{orders.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Urgent</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>
                {orders.filter(o => o.priority === 'URGENT').length}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Preparing</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {orders.filter(o => o.status === 'PREPARING').length}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">In Oven</div>
              <div className="stat-value" style={{ color: '#e53e3e' }}>
                {orders.filter(o => o.status === 'OVEN').length}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="queue-table">
          {isLoading ? (
            <div className="loading-state">
              <div className="empty-icon">ó</div>
              <div>Loading orders...</div>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="empty-icon"> </div>
              <div>Error loading orders. Check if Order Service is running.</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">=í</div>
              <div>No active orders in queue</div>
            </div>
          ) : (
            <>
              <div className="table-header">
                <div>Order #</div>
                <div>Details</div>
                <div>Status</div>
                <div>Type</div>
                <div>Time</div>
                <div>Action</div>
              </div>
              {sortedOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.createdAt);
                const timeClass = elapsed > 30 ? 'danger' : elapsed > 20 ? 'warning' : '';

                return (
                  <div key={order.id} className={`table-row ${order.priority === 'URGENT' ? 'urgent' : ''}`}>
                    <div className="order-num">
                      #{order.orderNumber.split('-').pop()}
                      {order.priority === 'URGENT' && <div style={{ fontSize: '10px', color: '#ef4444' }}>¡URGENT</div>}
                    </div>
                    <div className="order-details">
                      <div className="customer-name">{order.customerName}</div>
                      <div className="order-items-text">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}: {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 50)}...
                      </div>
                    </div>
                    <div>
                      <div
                        className="status-badge"
                        style={{
                          background: `${ORDER_STATUS_CONFIG[order.status].color}22`,
                          color: ORDER_STATUS_CONFIG[order.status].color
                        }}
                      >
                        {ORDER_STATUS_CONFIG[order.status].icon} {ORDER_STATUS_CONFIG[order.status].label}
                      </div>
                    </div>
                    <div>
                      <div className="order-type-badge">
                        {order.orderType === 'DELIVERY' ? '=š' : order.orderType === 'TAKEAWAY' ? '<ê' : '<}'} {order.orderType}
                      </div>
                    </div>
                    <div>
                      <div className={`time-badge ${timeClass}`}>
                        {elapsed}m ago
                      </div>
                    </div>
                    <div>
                      {order.status !== 'DISPATCHED' && (
                        <button
                          className="next-btn"
                          onClick={() => handleMoveToNextStage(order.id)}
                          disabled={isMoving}
                        >
                          {isMoving ? 'Moving...' : '’ Next Stage'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderQueuePage;
