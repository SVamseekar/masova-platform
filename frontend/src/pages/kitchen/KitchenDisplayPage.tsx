import React, { useState, useEffect } from 'react';
import AppHeader from '../../components/common/AppHeader';
import RecipeViewer from '../../components/RecipeViewer';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetKitchenQueueQuery,
  useUpdateOrderStatusMutation,
  Order as ApiOrder
} from '../../store/api/orderApi';
import { useGetAllMenuItemsQuery, MenuItem } from '../../store/api/menuApi';

// TypeScript interfaces
interface OrderItem {
  name: string;
  size: string | null;
  toppings: string[];
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'RECEIVED' | 'PREPARING' | 'OVEN' | 'BAKED' | 'DISPATCHED';
  items: OrderItem[];
  receivedAt: Date;
  estimatedPrepTime: number;
  customer: string;
  orderType: 'DELIVERY' | 'COLLECTION' | 'DINE_IN';
  priority: 'NORMAL' | 'URGENT';
  ovenStartTime?: Date;
  ovenEndTime?: Date;
}

interface StatusColumn {
  status: string;
  title: string;
  icon: string;
  color: string;
}

const KitchenDisplayPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<MenuItem | null>(null);
  const currentUser = useAppSelector(selectCurrentUser);

  // Store selection - allow selecting which store to display
  // If user has storeId (manager/staff), use that as default, otherwise use store-1
  const [selectedStoreId, setSelectedStoreId] = useState<string>(currentUser?.storeId || 'store-1');

  // Update selected store when user changes
  React.useEffect(() => {
    if (currentUser?.storeId && selectedStoreId !== currentUser.storeId) {
      setSelectedStoreId(currentUser.storeId);
    }
  }, [currentUser?.storeId, selectedStoreId]);

  // API Hooks - Poll every 5 seconds for real-time updates
  const { data: apiOrders = [], isLoading, error } = useGetKitchenQueueQuery(selectedStoreId, {
    pollingInterval: 5000, // Poll every 5 seconds
    refetchOnMountOrArgChange: true,
  });

  const { data: menuItems = [] } = useGetAllMenuItemsQuery();
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const findMenuItemByName = (itemName: string): MenuItem | null => {
    return menuItems.find(menuItem =>
      menuItem.name.toLowerCase() === itemName.toLowerCase()
    ) || null;
  };

  // Transform API orders to local format
  const orders: Order[] = apiOrders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as Order['status'],
    items: order.items.map(item => ({
      name: item.name,
      size: item.variant || null,
      toppings: item.customizations || [],
      quantity: item.quantity
    })),
    receivedAt: new Date(order.createdAt),
    estimatedPrepTime: order.preparationTime || 15,
    customer: order.customerName,
    orderType: order.orderType === 'TAKEAWAY' ? 'COLLECTION' : (order.orderType === 'DINE_IN' ? 'DINE_IN' : 'DELIVERY'),
    priority: order.priority,
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper functions with proper types
  const getElapsedTime = (startTime: Date): string => {
    const diff = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000 / 60);
    return `${diff}m`;
  };

  const getOvenTimer = (ovenStartTime: Date): string => {
    const diff = Math.floor((currentTime.getTime() - ovenStartTime.getTime()) / 1000 / 60);
    const remaining = 7 - diff; // 7 minutes total oven time
    return remaining > 0 ? `${remaining}m left` : 'Ready!';
  };

  const moveOrderToNext = async (orderId: string, currentStatus: Order['status']): Promise<void> => {
    const statusFlow: Order['status'][] = ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'DISPATCHED'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const nextStatus = statusFlow[currentIndex + 1];

    if (!nextStatus) return;

    try {
      await updateOrderStatus({ orderId, status: nextStatus }).unwrap();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <div className={`order-card status-${order.status.toLowerCase()} ${order.priority === 'URGENT' ? 'urgent' : ''}`}>
      {/* Order Header */}
      <div className="order-header">
        <div className="order-number">#{order.orderNumber}</div>
        <div className="order-meta">
          <span className={`order-type ${order.orderType.toLowerCase()}`}>
            {order.orderType === 'DELIVERY' ? '🚚' : order.orderType === 'COLLECTION' ? '🏪' : '🍽️'} {order.orderType}
          </span>
          <span className="elapsed-time">{getElapsedTime(order.receivedAt)}</span>
        </div>
      </div>

      {/* Customer Section */}
      <div className="customer-section">
        <div className="customer-name">{order.customer}</div>
        {order.priority === 'URGENT' && (
          <div className="priority-badge">
            <span className="priority-icon">⚡</span>
            URGENT
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="order-items">
        {order.items.map((item: OrderItem, index: number) => (
          <div key={index} className="order-item">
            <div className="item-main">
              <span className="item-quantity">{item.quantity}x</span>
              <span className="item-name">{item.name}</span>
              {item.size && <span className="item-size">{item.size}</span>}
              <button
                className="recipe-btn"
                onClick={() => {
                  const menuItem = findMenuItemByName(item.name);
                  if (menuItem) setSelectedRecipeItem(menuItem);
                }}
                title="View Recipe"
              >
                👨‍🍳
              </button>
            </div>
            {item.toppings.length > 0 && (
              <div className="item-toppings">{item.toppings.join(', ')}</div>
            )}
          </div>
        ))}
      </div>

      {/* Oven Timer */}
      {order.status === 'OVEN' && order.ovenStartTime && (
        <div className="oven-timer">
          <div className="timer-icon">🔥</div>
          <div className="timer-text">
            <span className="timer-label">Oven Timer</span>
            <span className="timer-value">{getOvenTimer(order.ovenStartTime)}</span>
          </div>
        </div>
      )}

      {/* Order Footer */}
      <div className="order-footer">
        <div className={`status-indicator status-${order.status.toLowerCase()}`}>
          <div className="status-dot"></div>
          <span>{order.status.replace('_', ' ')}</span>
        </div>
        {order.status !== 'DISPATCHED' && (
          <button
            className="next-btn"
            onClick={() => moveOrderToNext(order.id, order.status)}
            disabled={isUpdating}
          >
            <span>{isUpdating ? 'Updating...' : 'Next Stage'}</span>
            <span className="next-icon">→</span>
          </button>
        )}
      </div>
    </div>
  );

  const statusColumns: StatusColumn[] = [
    { status: 'RECEIVED', title: 'New Orders', icon: '📋', color: '#3b82f6' },
    { status: 'PREPARING', title: 'Preparing', icon: '👨‍🍳', color: '#f59e0b' },
    { status: 'OVEN', title: 'In Oven', icon: '🔥', color: '#e53e3e' },
    { status: 'BAKED', title: 'Ready', icon: '✅', color: '#10b981' },
    { status: 'DISPATCHED', title: 'Dispatched', icon: '🚚', color: '#8b5cf6' }
  ];

  const getOrdersByStatus = (status: string): Order[] => {
    return orders.filter(order => order.status === status)
      .sort((a, b) => {
        // Sort urgent orders first, then by time
        if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
        if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
        return a.receivedAt.getTime() - b.receivedAt.getTime();
      });
  };

  return (
    <div className="kitchen-display" style={{
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      WebkitTapHighlightColor: 'transparent'
    }}>
      <style>{`
        .kitchen-display {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f0f0f0;
          min-height: 100vh;
          padding: 0;
        }

        /* Header */
        .kitchen-header {
          background: #f0f0f0;
          padding: 20px 24px;
          box-shadow:
            inset 8px 8px 16px rgba(163, 163, 163, 0.2),
            inset -8px -8px 16px rgba(255, 255, 255, 0.8);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .kitchen-title {
          font-size: 32px;
          font-weight: 800;
          color: #e53e3e;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          text-align: center;
          background: #f0f0f0;
          padding: 12px 16px;
          border-radius: 16px;
          box-shadow:
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }

        .stat-number {
          font-size: 24px;
          font-weight: 800;
          color: #e53e3e;
          display: block;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
          margin-top: 2px;
        }

        .kitchen-time {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          background: #f0f0f0;
          padding: 16px 24px;
          border-radius: 20px;
          box-shadow:
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        /* Main Board */
        .kitchen-board {
          max-width: 1600px;
          margin: 0 auto;
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          min-height: calc(100vh - 120px);
        }

        .status-column {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 20px;
          box-shadow:
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
          position: relative;
        }

        .column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(163, 163, 163, 0.1);
        }

        .column-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .column-icon {
          font-size: 24px;
        }

        .column-title {
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }

        .column-count {
          background: #e53e3e;
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(229, 62, 62, 0.3);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(100vh - 240px);
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .orders-list::-webkit-scrollbar {
          display: none;
        }

        /* Order Cards */
        .order-card {
          background: #f0f0f0;
          border-radius: 16px;
          padding: 16px;
          transition: all 0.3s ease;
          box-shadow:
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
          border-left: 4px solid transparent;
        }

        .order-card:hover {
          transform: translateY(-2px);
        }

        .order-card.urgent {
          border-left-color: #ef4444;
          animation: urgentPulse 3s ease-in-out infinite;
        }

        @keyframes urgentPulse {
          0%, 100% {
            box-shadow:
              8px 8px 16px rgba(163, 163, 163, 0.3),
              -8px -8px 16px rgba(255, 255, 255, 0.8);
          }
          50% {
            box-shadow:
              8px 8px 16px rgba(163, 163, 163, 0.3),
              -8px -8px 16px rgba(255, 255, 255, 0.8),
              0 0 20px rgba(239, 68, 68, 0.4);
          }
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .order-number {
          font-size: 22px;
          font-weight: 800;
          color: #e53e3e;
        }

        .order-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
        }

        .order-type {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .order-type.delivery {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }

        .order-type.collection, .order-type.dine_in {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .elapsed-time {
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }

        .customer-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .customer-name {
          font-weight: 700;
          color: #333;
          font-size: 16px;
        }

        .priority-badge {
          background: #ef4444;
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          animation: priorityBlink 2s infinite;
        }

        @keyframes priorityBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.7; }
        }

        .priority-icon {
          font-size: 12px;
        }

        .order-items {
          margin-bottom: 16px;
        }

        .order-item {
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(163, 163, 163, 0.1);
        }

        .order-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .item-main {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .item-quantity {
          background: #e53e3e;
          color: white;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }

        .item-name {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .item-size {
          background: rgba(229, 62, 62, 0.1);
          color: #e53e3e;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
        }

        .item-toppings {
          color: #666;
          font-size: 12px;
          font-style: italic;
          margin-left: 32px;
        }

        .recipe-btn {
          margin-left: auto;
          background: #f0f0f0;
          border: none;
          padding: 6px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .recipe-btn:hover {
          transform: translateY(-2px);
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.4),
            -6px -6px 12px rgba(255, 255, 255, 0.9);
        }

        .recipe-btn:active {
          transform: translateY(0);
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.3),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }

        .oven-timer {
          background: linear-gradient(135deg, #e53e3e, #ff6b6b);
          color: white;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 8px rgba(229, 62, 62, 0.3);
          animation: ovenPulse 1.5s ease-in-out infinite;
        }

        @keyframes ovenPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .timer-icon {
          font-size: 20px;
        }

        .timer-text {
          display: flex;
          flex-direction: column;
        }

        .timer-label {
          font-size: 11px;
          opacity: 0.9;
          font-weight: 500;
        }

        .timer-value {
          font-size: 16px;
          font-weight: 700;
        }

        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .status-indicator.status-received .status-dot {
          background: #3b82f6;
        }

        .status-indicator.status-preparing .status-dot {
          background: #f59e0b;
        }

        .status-indicator.status-oven .status-dot {
          background: #e53e3e;
          animation: pulse 2s infinite;
        }

        .status-indicator.status-baked .status-dot {
          background: #10b981;
        }

        .status-indicator.status-dispatched .status-dot {
          background: #8b5cf6;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        .next-btn {
          background: #f0f0f0;
          border: none;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          color: #10b981;
          font-size: 12px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .next-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .next-btn:active:not(:disabled) {
          transform: scale(0.95);
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.3),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }

        .next-icon {
          font-size: 14px;
          font-weight: 700;
        }

        /* Empty State */
        .empty-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #666;
          font-style: italic;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 14px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #ef4444;
        }

        /* Responsive Design */
        @media (max-width: 1400px) {
          .kitchen-board {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .header-stats {
            gap: 16px;
          }

          .stat-item {
            padding: 10px 12px;
          }

          .stat-number {
            font-size: 20px;
          }
        }

        @media (max-width: 900px) {
          .kitchen-board {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            padding: 16px;
          }

          .kitchen-header {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .header-stats {
            justify-content: center;
            flex-wrap: wrap;
            gap: 12px;
          }

          .kitchen-title {
            font-size: 28px;
          }

          .kitchen-time {
            font-size: 24px;
            padding: 12px 20px;
          }
        }

        @media (max-width: 600px) {
          .kitchen-board {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 12px;
          }

          .kitchen-header {
            padding: 12px;
          }

          .status-column {
            padding: 16px;
          }

          .order-card {
            padding: 12px;
          }

          .order-header {
            flex-direction: column;
            gap: 8px;
          }

          .order-meta {
            align-items: flex-start;
            width: 100%;
          }

          .customer-section {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .order-footer {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }

          .next-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <AppHeader title={`Kitchen Display - ${selectedStoreId.toUpperCase()}`} hideStaffLogin={true} />

      {/* Main Board */}
      <main className="kitchen-board">
        {isLoading ? (
          <div className="loading-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Loading orders...</div>
          </div>
        ) : error ? (
          <div className="error-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">⚠️</div>
            <div className="empty-text">Error loading orders. Please check if Order Service is running.</div>
          </div>
        ) : (
          statusColumns.map(column => {
            const columnOrders = getOrdersByStatus(column.status);

            return (
              <div key={column.status} className="status-column">
                <div className="column-header">
                  <div className="column-title-section">
                    <span className="column-icon">{column.icon}</span>
                    <h3 className="column-title">{column.title}</h3>
                  </div>
                  <div className="column-count">{columnOrders.length}</div>
                </div>

                <div className="orders-list">
                  {columnOrders.length === 0 ? (
                    <div className="empty-column">
                      <div className="empty-icon">📭</div>
                      <div className="empty-text">No orders</div>
                    </div>
                  ) : (
                    columnOrders.map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Recipe Viewer Modal */}
      {selectedRecipeItem && (
        <RecipeViewer
          menuItem={selectedRecipeItem}
          onClose={() => setSelectedRecipeItem(null)}
        />
      )}
    </div>
  );
};

export default KitchenDisplayPage;
