import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AppHeader from '../../components/common/AppHeader';
import RecipeViewer from '../../components/RecipeViewer';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId, setSelectedStore } from '../../store/slices/cartSlice';
import {
  useGetKitchenQueueQuery,
  useUpdateOrderStatusMutation,
  Order as ApiOrder
} from '../../store/api/orderApi';
import { useGetAllMenuItemsQuery, MenuItem } from '../../store/api/menuApi';
import { useKitchenWebSocket } from '../../hooks/useKitchenWebSocket';
import { KitchenOrder } from '../../services/websocketService';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import BuildIcon from '@mui/icons-material/Build';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

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
  status: 'RECEIVED' | 'PREPARING' | 'OVEN' | 'BAKED' | 'DISPATCHED' | 'COMPLETED' | 'SERVED';
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
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  color: string;
}

const KitchenDisplayPage: React.FC = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<MenuItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const prevOrderCountRef = useRef(0);
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreIdFromRedux = useAppSelector(selectSelectedStoreId);

  // Get storeId from URL parameters (highest priority)
  const { storeId: urlStoreId } = useParams<{ storeId?: string }>();

  // Sync URL storeId with Redux state on mount or when URL changes
  useEffect(() => {
    if (urlStoreId && urlStoreId !== selectedStoreIdFromRedux) {
      console.log(`[KitchenDisplay] Syncing store ID from URL (${urlStoreId}) to Redux`);
      dispatch(setSelectedStore({ storeId: urlStoreId, storeName: urlStoreId.toUpperCase() }));
    }
  }, [urlStoreId, selectedStoreIdFromRedux, dispatch]);

  // Prioritize: URL param > Redux state > User's assigned store
  const storeId = urlStoreId || selectedStoreIdFromRedux || currentUser?.storeId || '';

  // Log for debugging
  useEffect(() => {
    console.log('KDS - URL Store:', urlStoreId, 'Redux Store:', selectedStoreIdFromRedux, 'User Store:', currentUser?.storeId, 'Final:', storeId);
  }, [urlStoreId, selectedStoreIdFromRedux, currentUser?.storeId, storeId]);

  // Local state for orders (updated via WebSocket or polling)
  const [localOrders, setLocalOrders] = useState<ApiOrder[]>([]);

  // WebSocket integration for real-time updates (RT-001)
  const handleWebSocketOrderUpdate = useCallback((wsOrder: KitchenOrder) => {
    setLocalOrders(prevOrders => {
      // Find if order exists
      const existingIndex = prevOrders.findIndex(o => o.id === wsOrder.id);

      if (existingIndex >= 0) {
        // Update existing order
        const updated = [...prevOrders];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: wsOrder.status as ApiOrder['status'],
          orderNumber: wsOrder.orderNumber,
          items: wsOrder.items.map(item => ({
            menuItemId: item.menuItemId || '',
            name: item.name,
            quantity: item.quantity,
            variant: item.variant,
            customizations: item.customizations,
            price: 0  // Price not needed for KDS
          })),
        };
        return updated;
      } else {
        // Add new order
        const newOrder: ApiOrder = {
          id: wsOrder.id,
          orderNumber: wsOrder.orderNumber,
          status: wsOrder.status as ApiOrder['status'],
          items: wsOrder.items.map(item => ({
            menuItemId: item.menuItemId || '',
            name: item.name,
            quantity: item.quantity,
            variant: item.variant,
            customizations: item.customizations,
            price: 0
          })),
          customerName: wsOrder.customerName,
          orderType: wsOrder.orderType as ApiOrder['orderType'],
          priority: wsOrder.priority as ApiOrder['priority'],
          preparationTime: wsOrder.preparationTime,
          createdAt: wsOrder.createdAt,
          updatedAt: wsOrder.createdAt,
          storeId: wsOrder.storeId,
          subtotal: 0,
          deliveryFee: 0,
          tax: 0,
          total: 0,
          totalAmount: 0,
          paymentStatus: 'PENDING' as const,
        };
        return [...prevOrders, newOrder];
      }
    });
  }, []);

  const { isConnected: wsConnected, error: wsError } = useKitchenWebSocket({
    storeId,
    onOrderUpdate: handleWebSocketOrderUpdate,
    enabled: !!storeId,
  });

  // API Hooks - Poll as fallback (reduced frequency when WebSocket is connected)
  // Pass storeId as parameter to ensure proper filtering and refetch on store change
  const { data: apiOrders = [], isLoading, error, refetch } = useGetKitchenQueueQuery(storeId || undefined, {
    skip: !storeId,
    pollingInterval: wsConnected ? 30000 : 5000, // Reduced polling when WebSocket connected
    refetchOnMountOrArgChange: true,
  });

  // Sync API data to local state (initial load and fallback)
  useEffect(() => {
    if (apiOrders.length > 0) {
      setLocalOrders(apiOrders);
    }
  }, [apiOrders]);

  const { data: menuItems = [] } = useGetAllMenuItemsQuery(undefined);
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  // Sound alert via Web Audio API
  const playNewOrderChime = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, [isMuted]);

  // Trigger chime when new RECEIVED orders arrive (uses localOrders, declared above)
  useEffect(() => {
    const receivedCount = localOrders.filter(o => o.status === 'RECEIVED').length;
    if (receivedCount > prevOrderCountRef.current) {
      playNewOrderChime();
    }
    prevOrderCountRef.current = receivedCount;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localOrders.length, isMuted]);

  // Full-screen toggle
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false)).catch(() => {});
    }
  }, []);

  // F key listener for full-screen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullScreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFullScreen]);

  // Color urgency based on order age
  const getUrgencyStyle = (receivedAt: Date): React.CSSProperties => {
    const mins = Math.floor((currentTime.getTime() - new Date(receivedAt).getTime()) / 60000);
    if (mins >= 10) return { borderLeft: '4px solid #ef4444' };
    if (mins >= 5) return { borderLeft: '4px solid #f59e0b' };
    return { borderLeft: '4px solid #10b981' };
  };

  const findMenuItemByName = (itemName: string): MenuItem | null => {
    return menuItems.find(menuItem =>
      menuItem.name.toLowerCase() === itemName.toLowerCase()
    ) || null;
  };

  // Transform orders to local format (using localOrders which is updated via WebSocket or polling)
  const orders: Order[] = localOrders.map(order => ({
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
    // Kitchen flow varies by order type:
    // DELIVERY: RECEIVED -> PREPARING -> OVEN -> BAKED -> DISPATCHED -> DELIVERED
    // TAKEAWAY/COLLECTION: RECEIVED -> PREPARING -> OVEN -> BAKED (BAKED = Ready for Pickup, final stage)
    // DINE_IN: RECEIVED -> PREPARING -> OVEN -> BAKED -> SERVED (manual)
    const order = orders.find(o => o.id === orderId);
    const orderType = order?.orderType;

    // Define status flow based on order type
    const statusFlow: string[] = orderType === 'DELIVERY'
      ? ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'DISPATCHED']
      : ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED']; // TAKEAWAY & DINE_IN end at BAKED (Ready)

    const currentIndex = statusFlow.indexOf(currentStatus);
    const nextStatus = statusFlow[currentIndex + 1];

    if (!nextStatus) {
      // Already at final stage
      return;
    }

    try {
      await updateOrderStatus({ orderId, status: nextStatus as ApiOrder['status'] }).unwrap();
      // Trigger a refetch to update the order list and metrics
      refetch();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const markAsCompleted = async (orderId: string): Promise<void> => {
    try {
      // Determine the correct terminal status based on order type
      const order = orders.find(o => o.id === orderId);
      const orderType = order?.orderType;

      let terminalStatus: string;
      if (orderType === 'DELIVERY') {
        terminalStatus = 'DELIVERED';
      } else if (orderType === 'DINE_IN') {
        terminalStatus = 'SERVED';
      } else {
        // COLLECTION/TAKEAWAY
        terminalStatus = 'COMPLETED';
      }

      await updateOrderStatus({ orderId, status: terminalStatus as ApiOrder['status'] }).unwrap();
      // Trigger a refetch to update the order list and metrics
      refetch();
    } catch (error) {
      console.error('Failed to mark order as completed:', error);
      alert('Failed to mark order as completed. Please try again.');
    }
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <div
      className={`order-card status-${order.status.toLowerCase()} ${order.priority === 'URGENT' ? 'urgent' : ''}`}
      style={getUrgencyStyle(order.receivedAt)}
    >
      {/* Order Header */}
      <div className="order-header">
        <div className="order-number">#{order.orderNumber}</div>
        <div className="order-meta">
          <span className={`order-type ${order.orderType.toLowerCase()}`}>
            {order.orderType}
          </span>
          <span className="elapsed-time">{getElapsedTime(order.receivedAt)}</span>
        </div>
      </div>

      {/* Customer Section */}
      <div className="customer-section">
        <div className="customer-name">{order.customer}</div>
        {order.priority === 'URGENT' && (
          <div className="priority-badge">
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
                Recipe
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
        {/* Show Next Stage button based on order type and status */}
        {/* DELIVERY: show until DISPATCHED */}
        {/* DINE_IN: show until BAKED (then Mark Served button) */}
        {/* TAKEAWAY: show until BAKED (BAKED is final - Ready for Pickup) */}
        {!(
          order.status === 'DISPATCHED' ||
          (order.status === 'BAKED' && order.orderType !== 'DELIVERY')
        ) && (
          <button
            className="next-btn"
            onClick={() => moveOrderToNext(order.id, order.status)}
            disabled={isUpdating}
            style={{ minHeight: '48px', minWidth: '48px', padding: '12px 20px' }}
          >
            <span>{isUpdating ? 'Updating...' : 'Next Stage'}</span>
            <span className="next-icon">→</span>
          </button>
        )}
        {/* Show Mark as Delivered for DELIVERY orders at DISPATCHED */}
        {order.status === 'DISPATCHED' && order.orderType === 'DELIVERY' && (
          <button
            className="complete-btn"
            onClick={() => markAsCompleted(order.id)}
            disabled={isUpdating}
            title="Mark as delivered"
          >
            <span>✓</span>
            <span>{isUpdating ? 'Updating...' : 'Mark Delivered'}</span>
          </button>
        )}
        {/* Show Mark as Served for DINE_IN orders at BAKED */}
        {order.status === 'BAKED' && order.orderType === 'DINE_IN' && (
          <button
            className="complete-btn"
            onClick={() => markAsCompleted(order.id)}
            disabled={isUpdating}
            title="Mark as served"
          >
            <span>✓</span>
            <span>{isUpdating ? 'Updating...' : 'Mark Served'}</span>
          </button>
        )}
        {/* Show Mark Picked Up for TAKEAWAY/COLLECTION orders at BAKED */}
        {order.status === 'BAKED' && (order.orderType === 'COLLECTION' || order.orderType !== 'DELIVERY' && order.orderType !== 'DINE_IN') && (
          <button
            className="complete-btn"
            onClick={() => markAsCompleted(order.id)}
            disabled={isUpdating}
            title="Customer picked up the order"
          >
            <span>✓</span>
            <span>{isUpdating ? 'Updating...' : 'Mark Picked Up'}</span>
          </button>
        )}
      </div>
    </div>
  );

  const statusColumns: StatusColumn[] = [
    { status: 'RECEIVED', title: 'New Orders', Icon: FiberNewIcon, color: '#3b82f6' },
    { status: 'PREPARING', title: 'Preparing', Icon: BuildIcon, color: '#f59e0b' },
    { status: 'OVEN', title: 'In Oven', Icon: WhatshotIcon, color: '#e53e3e' },
    { status: 'BAKED', title: 'Ready', Icon: CheckCircleIcon, color: '#10b981' },
    { status: 'DISPATCHED', title: 'Dispatched', Icon: LocalShippingIcon, color: '#8b5cf6' }
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

        @keyframes pulse-red {
          0%, 100% { border-left-color: #ef4444; }
          50% { border-left-color: #fca5a5; }
        }

        /* Main Board */
        .kitchen-board {
          max-width: 1600px;
          margin: 0 auto;
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          height: calc(100vh - 160px);
          overflow-x: auto;
        }

        .status-column {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 20px;
          box-shadow:
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 0;
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
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(163, 163, 163, 0.3) transparent;
          min-height: 0;
        }

        .orders-list::-webkit-scrollbar {
          width: 6px;
        }

        .orders-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .orders-list::-webkit-scrollbar-thumb {
          background: rgba(163, 163, 163, 0.3);
          border-radius: 3px;
        }

        .orders-list::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 163, 163, 0.5);
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
          font-size: 24px;
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
          font-size: 15px;
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

        .complete-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          color: white;
          font-size: 13px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow:
            6px 6px 12px rgba(16, 185, 129, 0.4),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .complete-btn:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow:
            8px 8px 16px rgba(16, 185, 129, 0.5),
            -8px -8px 16px rgba(255, 255, 255, 0.9);
        }

        .complete-btn:active {
          transform: scale(0.97);
          box-shadow:
            inset 4px 4px 8px rgba(5, 150, 105, 0.5),
            inset -4px -4px 8px rgba(16, 185, 129, 0.3);
        }

        .complete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
        @media (max-width: 1200px) {
          .kitchen-board {
            grid-template-columns: repeat(4, 1fr);
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
            grid-template-columns: repeat(3, 1fr);
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

      <AppHeader title={`Kitchen Display - ${storeId.toUpperCase() || 'NO STORE'}`} hideStaffLogin={true} />

      {/* Summary Bar */}
      {(() => {
        const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED', 'SERVED', 'COMPLETED'].includes(o.status));
        const waitTimes = activeOrders.map(o => Math.floor((currentTime.getTime() - new Date(o.receivedAt).getTime()) / 60000));
        const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
        const maxWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
        return (
          <div style={{ display: 'flex', gap: '16px', padding: '10px 20px', background: '#1a1a1a', borderBottom: '1px solid #333', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '28px', flex: 1 }}>
              {[
                { label: 'Active', value: String(activeOrders.length), color: '#3b82f6' },
                { label: 'Avg Wait', value: `${avgWait}m`, color: avgWait > 10 ? '#ef4444' : avgWait > 5 ? '#f59e0b' : '#10b981' },
                { label: 'Longest', value: `${maxWait}m`, color: maxWait > 10 ? '#ef4444' : maxWait > 5 ? '#f59e0b' : '#10b981' },
              ].map(kpi => (
                <div key={kpi.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsMuted(m => !m)}
                style={{ background: isMuted ? '#374151' : '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', color: isMuted ? '#9ca3af' : '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
              >
                {isMuted ? 'MUTED' : 'SOUND ON'}
              </button>
              <button
                onClick={toggleFullScreen}
                style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                title="Toggle full screen (F)"
              >
                {isFullScreen ? 'EXIT FS' : 'FULL SCREEN'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Main Board */}
      <main className="kitchen-board">
        {isLoading ? (
          <div className="loading-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-text">Loading orders...</div>
          </div>
        ) : error ? (
          <div className="error-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-text">Error loading orders. Please check if Order Service is running.</div>
          </div>
        ) : (
          statusColumns.map(column => {
            const columnOrders = getOrdersByStatus(column.status);

            return (
              <div key={column.status} className="status-column">
                <div className="column-header">
                  <div className="column-title-section">
                    <column.Icon style={{ fontSize: '20px', color: column.color }} />
                    <h3 className="column-title">{column.title}</h3>
                  </div>
                  <div className="column-count">{columnOrders.length}</div>
                </div>

                <div className="orders-list">
                  {columnOrders.length === 0 ? (
                    <div className="empty-column">
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
