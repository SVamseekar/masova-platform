// src/apps/POSSystem/POSDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedStoreId, selectSelectedStoreName, setSelectedStore } from '../../store/slices/cartSlice';
import MenuPanel from './components/MenuPanel';
import OrderPanel from './components/OrderPanel';
import CustomerPanel from './components/CustomerPanel';
import MetricsTiles from './components/MetricsTiles';
import ClockInModal from './components/ClockInModal';
import ClockOutModal from './components/ClockOutModal';
import { PINAuthModal } from './components/PINAuthModal';
import Button from '../../components/ui/neumorphic/Button';
import Badge from '../../components/ui/neumorphic/Badge';
import { colors, shadows, spacing, typography } from '../../styles/design-tokens';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { CURRENCY } from '../../config/business-config';
import {
  useGetTodaySalesMetricsQuery,
  useGetSalesTrendsQuery,
  useGetStaffLeaderboardQuery,
  useGetTopProductsQuery,
} from '../../store/api/analyticsApi';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';
import { useRecordCashPaymentMutation } from '../../store/api/paymentApi';
import {
  useGetActiveStoreSessionsQuery,
  useClockOutEmployeeMutation
} from '../../store/api/sessionApi';
import { useSnackbar } from 'notistack';

/**
 * Professional POS Dashboard - Industry Standard Design
 * Inspired by leading POS systems: Square, Toast, Clover
 *
 * Orders Tab: Fast order-taking with visual menu
 * Analytics Tab: Comprehensive business insights
 */
const POSDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const { enqueueSnackbar } = useSnackbar();

  // Get selected store from Redux (set by StoreSelector)
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const selectedStoreName = useAppSelector(selectSelectedStoreName);

  // User role and store info
  const isManager = user?.type === 'MANAGER';

  // Priority: URL param > Selected store > User's default store
  const urlStoreId = searchParams.get('storeId');
  // CRITICAL: Always prioritize URL storeId first to ensure correct store context
  const storeId = urlStoreId || selectedStoreId || user?.storeId;

  // Sync URL store ID with Redux state on mount
  useEffect(() => {
    if (urlStoreId && urlStoreId !== selectedStoreId) {
      // Update Redux state to match URL
      dispatch(setSelectedStore({ storeId: urlStoreId, storeName: 'Store ' + urlStoreId }));
    }
  }, [urlStoreId, selectedStoreId, dispatch]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics'>('orders');

  // Clock in/out modal state
  const [clockInModalOpen, setClockInModalOpen] = useState(false);
  const [clockOutModalOpen, setClockOutModalOpen] = useState(false);

  // PIN Authentication state - for public POS access
  const [showPINModal, setShowPINModal] = useState(false);
  const [orderUser, setOrderUser] = useState<{
    userId: string;
    name: string;
    type: string;
    role: string;
    storeId: string;
  } | null>(null);

  // Current order state
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [orderType, setOrderType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP'); // Removed DINE_IN
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  // Ref for triggering submit from keyboard shortcut
  const submitOrderRef = React.useRef<(() => void) | null>(null);

  // Payment mutation
  const [recordCashPayment] = useRecordCashPaymentMutation();

  // Fetch active sessions for clock out functionality
  const { data: activeSessions = [] } = useGetActiveStoreSessionsQuery(
    storeId || '',
    { skip: !storeId || !isManager }
  );

  // Fetch analytics data - only when analytics tab is active to avoid rate limiting
  const { data: todayData } = useGetTodaySalesMetricsQuery(undefined, {
    skip: activeTab !== 'analytics'
  });
  const { data: weekData } = useGetSalesTrendsQuery({ period: 'WEEKLY' }, {
    skip: activeTab !== 'analytics'
  });
  const { data: monthData } = useGetSalesTrendsQuery({ period: 'MONTHLY' }, {
    skip: activeTab !== 'analytics'
  });
  const { data: topProducts } = useGetTopProductsQuery({
    period: 'TODAY',
    sortBy: 'REVENUE'
  }, {
    skip: activeTab !== 'analytics'
  });
  const { data: staffData } = useGetStaffLeaderboardQuery({
    period: 'TODAY'
  }, {
    skip: activeTab !== 'analytics'
  });
  const { data: orders = [] } = useGetStoreOrdersQuery(
    undefined,
    { skip: !storeId || activeTab !== 'analytics' }
  );


  // Filter today's orders for history
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt).toDateString();
    return orderDate === today;
  });

  const filteredOrders = todayOrders.filter((order: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerPhone?.includes(searchTerm)
    );
  });

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'secondary' | 'primary' => {
    const statusColors: Record<string, 'success' | 'warning' | 'error' | 'secondary' | 'primary'> = {
      PENDING: 'warning',
      CONFIRMED: 'primary',
      PREPARING: 'primary',
      READY: 'success',
      OUT_FOR_DELIVERY: 'secondary',
      DELIVERED: 'success',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return statusColors[status] || 'secondary';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F1: Switch to Orders tab
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('orders');
      }
      // F2: Switch to Analytics tab
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('analytics');
      }
      // Escape: Clear order
      if (e.key === 'Escape' && activeTab === 'orders') {
        e.preventDefault();
        handleNewOrder();
      }
      // Ctrl+Enter: Submit order
      if (e.key === 'Enter' && e.ctrlKey && activeTab === 'orders') {
        e.preventDefault();
        if (submitOrderRef.current) {
          submitOrderRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab]);

  const handleAddItem = (item: any, quantity: number = 1) => {
    const existingIndex = orderItems.findIndex(
      (orderItem) => orderItem.menuItemId === item.id
    );

    if (existingIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingIndex].quantity += quantity;
      setOrderItems(updatedItems);
    } else {
      setOrderItems([
        ...orderItems,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.basePrice / 100, // Convert from paisa to rupees
          quantity,
          specialInstructions: '',
          image: item.image,
        },
      ]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter((item) => item.menuItemId !== menuItemId));
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId);
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleUpdateInstructions = (menuItemId: string, instructions: string) => {
    setOrderItems(
      orderItems.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, specialInstructions: instructions }
          : item
      )
    );
  };

  const handleNewOrder = () => {
    // Clear existing order
    setOrderItems([]);
    setCustomer(null);
    setSelectedTable(null);
    setOrderUser(null);

    // For public POS (no logged-in user), require PIN authentication
    // For logged-in users, use their credentials automatically
    if (!user) {
      setShowPINModal(true);
    } else {
      // Logged-in user - set them as order user
      setOrderUser({
        userId: user.id,
        name: user.name,
        type: user.type,
        role: user.role || 'Staff',
        storeId: user.storeId || storeId || ''
      });
      enqueueSnackbar(`Order started by ${user.name}`, { variant: 'success' });
    }
  };

  const handlePINAuthenticated = (userData: {
    userId: string;
    name: string;
    type: string;
    role: string;
    storeId: string;
  }) => {
    setOrderUser(userData);
    setShowPINModal(false);
    enqueueSnackbar(`Order started by ${userData.name}`, { variant: 'success' });
  };

  const handleOrderComplete = () => {
    // Clear order and user context
    setOrderItems([]);
    setCustomer(null);
    setSelectedTable(null);
    setOrderUser(null);
    enqueueSnackbar('Order completed successfully!', { variant: 'success' });
  };

  const handleMarkAsPaid = async (order: any) => {
    const confirmed = window.confirm(
      `Mark this order as PAID?\n\n` +
      `Order: #${order.orderNumber}\n` +
      `Amount: ${CURRENCY.format(order.total)}\n` +
      `Payment Method: ${order.paymentMethod}\n\n` +
      `This confirms that CASH payment has been received.`
    );

    if (!confirmed) return;

    try {
      await recordCashPayment({
        orderId: order.id,
        amount: order.total,
        customerId: order.customerId || 'walk-in',
        customerEmail: `${order.customerId || 'walkin'}@cash.local`,
        customerPhone: order.customerPhone || '0000000000',
        storeId: order.storeId,
        orderType: order.orderType,
        paymentMethod: 'CASH',
        notes: `Cash payment recorded for Order #${order.orderNumber}`,
      }).unwrap();

      enqueueSnackbar(`Order #${order.orderNumber} marked as PAID — Cash payment of ${CURRENCY.format(order.total)} recorded.`, { variant: 'success' });
    } catch (error: any) {
      console.error('Failed to record cash payment:', error);
      enqueueSnackbar(`Failed to mark order as paid. ${error?.data?.message || 'Please try again.'}`, { variant: 'error' });
    }
  };


  const totalSales = filteredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

  // Calculate order total - matching customer side logic
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% tax
  const deliveryFee = orderType === 'DELIVERY' && subtotal > 0 ? 40 : 0;
  const orderTotal = subtotal + tax + deliveryFee;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: colors.surface.background,
      fontFamily: typography.fontFamily.primary
    }}>
      {/* Professional Header Bar */}
      <div style={{
        height: '72px',
        backgroundColor: '#1a1a1a',
        borderBottom: `3px solid ${colors.brand.primary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${spacing[6]}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        flexShrink: 0
      }}>
        {/* Logo & Store Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
          <div style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.extrabold,
            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            MaSoVa POS
          </div>
          <div style={{
            height: '32px',
            width: '2px',
            backgroundColor: colors.surface.border
          }} />
          <div style={{
            fontSize: typography.fontSize.sm,
            color: '#999',
            fontWeight: typography.fontWeight.semibold
          }}>
            {selectedStoreName || storeId || 'Point of Sale'}
          </div>
        </div>

        {/* Tab Navigation - Only show if logged in user is manager */}
        {isManager && (
          <div style={{
            display: 'flex',
            gap: spacing[2],
            backgroundColor: '#2a2a2a',
            padding: spacing[1],
            borderRadius: '12px'
          }}>
            {[
              { key: 'orders', label: 'Orders' },
              { key: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: `${spacing[2]} ${spacing[5]}`,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.primary,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  ...(activeTab === tab.key ? {
                    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  } : {
                    background: 'transparent',
                    color: '#999'
                  })
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Quick Stats & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
          {/* Current Order User Indicator - Show when someone is authenticated */}
          {orderUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[4]}`,
              backgroundColor: '#2a2a2a',
              borderRadius: '10px',
              border: '2px solid #10b981'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                animation: 'pulse 2s infinite'
              }} />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[1]
              }}>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Taking Order
                </div>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  color: '#10b981',
                  fontWeight: typography.fontWeight.bold
                }}>
                  {orderUser.name}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && orderItems.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: `${spacing[2]} ${spacing[4]}`,
              backgroundColor: '#2a2a2a',
              borderRadius: '10px'
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Cart Total
              </div>
              <div style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.extrabold,
                background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successDark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {CURRENCY.format(orderTotal)}
              </div>
            </div>
          )}

          {/* Clock In/Out Buttons - Only for managers */}
          {isManager && (
            <div style={{ display: 'flex', gap: spacing[2] }}>
              {/* Clock In Button */}
              <button
                onClick={() => setClockInModalOpen(true)}
                style={{
                  padding: `${spacing[3]} ${spacing[5]}`,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.primary,
                  background: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Clock In
              </button>

              {/* Clock Out Button */}
              <button
                onClick={() => setClockOutModalOpen(true)}
                disabled={activeSessions.length === 0}
                style={{
                  padding: `${spacing[3]} ${spacing[5]}`,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: activeSessions.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.primary,
                  background: activeSessions.length === 0
                    ? '#6b7280'
                    : `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`,
                  color: '#FFFFFF',
                  boxShadow: activeSessions.length === 0
                    ? 'none'
                    : '0 4px 12px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  opacity: activeSessions.length === 0 ? 0.5 : 1,
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (activeSessions.length > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSessions.length > 0) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11V6l11-4v16.28" />
                  <path d="M12 19.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                  <circle cx="19" cy="19" r="2" />
                </svg>
                Clock Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'orders' ? (
        /* ORDERS TAB - Professional POS Layout */
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: spacing[3],
          backgroundColor: colors.surface.background
        }}>
          {/* Main POS Interface */}
          <div style={{
            display: 'flex',
            gap: spacing[3],
            minHeight: '600px'
          }}>
            {/* LEFT: Menu Panel - 40% */}
            <div style={{
              flex: '4',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `2px solid ${colors.surface.border}`,
              boxSizing: 'border-box'
            }}>
              <MenuPanel onAddItem={handleAddItem} />
            </div>

          {/* CENTER: Order Panel - 30% */}
          <div style={{
            flex: '3',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '16px',
            backgroundColor: colors.surface.primary,
            boxShadow: shadows.raised.sm,
            border: `2px solid ${colors.surface.border}`,
            boxSizing: 'border-box'
          }}>
            <OrderPanel
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onUpdateInstructions={handleUpdateInstructions}
              onNewOrder={handleNewOrder}
              orderType={orderType}
              onOrderTypeChange={setOrderType}
              selectedTable={selectedTable}
              onTableSelect={setSelectedTable}
            />
          </div>

          {/* RIGHT: Checkout Panel - 30% */}
          <div style={{
            flex: '3',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '16px',
            backgroundColor: colors.surface.primary,
            boxShadow: shadows.raised.sm,
            border: `2px solid ${colors.surface.border}`,
            boxSizing: 'border-box'
          }}>
            <CustomerPanel
              items={orderItems}
              customer={customer}
              onCustomerChange={setCustomer}
              orderType={orderType}
              selectedTable={selectedTable}
              onOrderComplete={handleOrderComplete}
              userId={user?.id || orderUser?.userId}
              storeId={storeId}
              submitOrderRef={submitOrderRef}
              orderCreatedBy={orderUser}
            />
          </div>
          </div>
        </div>
      ) : (
        /* ANALYTICS TAB - Professional Dashboard */
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: spacing[6],
          backgroundColor: colors.surface.background
        }}>
          {/* Quick Stats Cards Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: spacing[4],
            marginBottom: spacing[6]
          }}>
            {/* Today's Sales */}
            <div style={{
              padding: spacing[5],
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `1px solid ${colors.surface.border}`,
              borderLeft: `4px solid ${colors.semantic.success}`
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: spacing[2]
              }}>
                Today's Sales
              </div>
              <div style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: '#1a1a1a',
                marginBottom: spacing[2]
              }}>
                {CURRENCY.format(todayData?.todaySales || 0)}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: todayData?.percentChangeFromYesterday && todayData.percentChangeFromYesterday >= 0
                  ? colors.semantic.success
                  : colors.semantic.error,
                fontWeight: typography.fontWeight.semibold
              }}>
                {todayData?.percentChangeFromYesterday
                  ? `${todayData.percentChangeFromYesterday >= 0 ? '↑' : '↓'} ${Math.abs(todayData.percentChangeFromYesterday).toFixed(1)}% from yesterday`
                  : '—'}
              </div>
            </div>

            {/* This Week */}
            <div style={{
              padding: spacing[5],
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `1px solid ${colors.surface.border}`,
              borderLeft: `4px solid ${colors.brand.primary}`
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: spacing[2]
              }}>
                This Week
              </div>
              <div style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: '#1a1a1a',
                marginBottom: spacing[2]
              }}>
                {CURRENCY.format(weekData?.totalSales || 0)}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666'
              }}>
                {weekData?.totalOrders || 0} orders
              </div>
            </div>

            {/* This Month */}
            <div style={{
              padding: spacing[5],
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `1px solid ${colors.surface.border}`,
              borderLeft: `4px solid ${colors.semantic.warning}`
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: spacing[2]
              }}>
                This Month
              </div>
              <div style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: '#1a1a1a',
                marginBottom: spacing[2]
              }}>
                {CURRENCY.format(monthData?.totalSales || 0)}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666'
              }}>
                {monthData?.totalOrders || 0} orders
              </div>
            </div>

            {/* Today's Orders */}
            <div style={{
              padding: spacing[5],
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `1px solid ${colors.surface.border}`,
              borderLeft: `4px solid ${colors.semantic.info}`
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: spacing[2]
              }}>
                Today's Orders
              </div>
              <div style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: '#1a1a1a',
                marginBottom: spacing[2]
              }}>
                {todayOrders.length}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: '#666'
              }}>
                {CURRENCY.format(totalSales)} total
              </div>
            </div>
          </div>

          {/* Real-Time Metrics */}
          <div style={{ marginBottom: spacing[6] }}>
            <h2 style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: '#1a1a1a',
              letterSpacing: '-0.5px'
            }}>
              Real-Time Performance
            </h2>
            <MetricsTiles storeId={storeId} />
          </div>

          {/* Two Column Layout: Top Products & Recent Orders */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing[4],
            marginBottom: spacing[6]
          }}>
            {/* Top Selling Items */}
            <div style={{
              padding: spacing[5],
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `1px solid ${colors.surface.border}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[4]
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: '#1a1a1a'
                }}>
                  <LocalFireDepartmentIcon style={{ fontSize: '20px', color: colors.semantic.error, marginRight: '6px', verticalAlign: 'middle' }} />
                  Top Sellers Today
                </h3>
                {isManager && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/manager/product-analytics')}
                  >
                    View All →
                  </Button>
                )}
              </div>
              {topProducts && topProducts.topProducts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                  {topProducts.topProducts.slice(0, 5).map((item, index) => (
                    <div
                      key={item.itemId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing[3],
                        borderRadius: '12px',
                        backgroundColor: index === 0 ? '#FFF5E1' : colors.surface.elevated,
                        border: index === 0 ? `2px solid ${colors.semantic.warning}` : `1px solid ${colors.surface.border}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: index === 0 ? colors.semantic.warning : colors.brand.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: typography.fontWeight.bold,
                          fontSize: typography.fontSize.sm
                        }}>
                          {index === 0 ? <EmojiEventsIcon style={{ fontSize: '18px' }} /> : `#${index + 1}`}
                        </div>
                        <div>
                          <div style={{
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.bold,
                            color: '#1a1a1a',
                            marginBottom: spacing[1]
                          }}>
                            {item.itemName}
                          </div>
                          <div style={{
                            fontSize: typography.fontSize.xs,
                            color: '#666'
                          }}>
                            {item.quantitySold} sold
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.semantic.success
                      }}>
                        {CURRENCY.format(item.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: spacing[10],
                  textAlign: 'center',
                  color: '#999'
                }}>
                  No sales data yet
                </div>
              )}
            </div>

            {/* Recent Orders Preview */}
            <div style={{
              padding: spacing[5],
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `1px solid ${colors.surface.border}`
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#1a1a1a'
              }}>
                <ReceiptLongIcon style={{ fontSize: '20px', marginRight: '6px', verticalAlign: 'middle' }} />
                Recent Orders
              </h3>
              {filteredOrders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {filteredOrders.slice(0, 5).map((order: any) => (
                    <div
                      key={order.id}
                      style={{
                        padding: spacing[3],
                        borderRadius: '10px',
                        backgroundColor: colors.surface.elevated,
                        border: `1px solid ${colors.surface.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: '#1a1a1a',
                          marginBottom: spacing[1]
                        }}>
                          #{order.orderNumber}
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          color: '#666'
                        }}>
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' }}>
                        <Badge variant={getStatusColor(order.status)} size="sm">
                          {order.status.replace('_', ' ')}
                        </Badge>
                        {/* Payment Method Badge */}
                        {order.paymentMethod && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: order.paymentMethod === 'CASH' ? '#fef3c7' :
                                           order.paymentMethod === 'CARD' ? '#dbeafe' :
                                           order.paymentMethod === 'UPI' ? '#d1fae5' : '#e5e7eb',
                            color: order.paymentMethod === 'CASH' ? '#92400e' :
                                   order.paymentMethod === 'CARD' ? '#1e40af' :
                                   order.paymentMethod === 'UPI' ? '#065f46' : '#1f2937',
                          }}>
                            {order.paymentMethod}
                          </span>
                        )}
                        {/* Payment Status Badge */}
                        {order.paymentStatus === 'PENDING' && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                          }}>
                            UNPAID
                          </span>
                        )}
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.bold,
                          color: colors.brand.primary
                        }}>
                          {CURRENCY.format(order.total || 0)}
                        </div>

                        {/* Mark as Paid Button for PENDING CASH orders */}
                        {order.paymentStatus === 'PENDING' && order.paymentMethod === 'CASH' && (
                          <button
                            onClick={() => handleMarkAsPaid(order)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#10b981';
                            }}
                          >
                            <AttachMoneyIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: spacing[10],
                  textAlign: 'center',
                  color: '#999'
                }}>
                  No orders yet today
                </div>
              )}
            </div>
          </div>

          {/* Staff Performance (Manager Only) */}
          {isManager && staffData && staffData.rankings.length > 0 && (
            <div style={{
              padding: spacing[5],
              borderRadius: '16px',
              backgroundColor: colors.surface.primary,
              boxShadow: shadows.raised.sm,
              border: `1px solid ${colors.surface.border}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[4]
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: '#1a1a1a'
                }}>
                  <PeopleIcon style={{ fontSize: '20px', marginRight: '6px', verticalAlign: 'middle' }} />
                  Staff Leaderboard
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/manager/staff-leaderboard')}
                >
                  Full Leaderboard →
                </Button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[3]
              }}>
                {staffData.rankings.slice(0, 6).map((staff, index) => (
                  <div
                    key={staff.staffId}
                    style={{
                      padding: spacing[4],
                      borderRadius: '12px',
                      background: index === 0
                        ? `linear-gradient(135deg, ${colors.semantic.warningLight}22 0%, ${colors.semantic.warning}11 100%)`
                        : colors.surface.elevated,
                      border: index === 0 ? `2px solid ${colors.semantic.warning}` : `1px solid ${colors.surface.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? colors.semantic.warning : colors.brand.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: typography.fontWeight.bold
                      }}>
                        {index === 0 ? <WorkspacePremiumIcon style={{ fontSize: '20px' }} /> : `#${index + 1}`}
                      </div>
                      <div>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.bold,
                          color: '#1a1a1a',
                          marginBottom: spacing[1]
                        }}>
                          {staff.staffName}
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          color: '#666'
                        }}>
                          {staff.ordersProcessed} orders
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.semantic.success
                    }}>
                      {CURRENCY.format(staff.salesGenerated)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clock In Modal */}
      {storeId && (
        <ClockInModal
          isOpen={clockInModalOpen}
          onClose={() => setClockInModalOpen(false)}
          storeId={storeId}
        />
      )}

      {/* Clock Out Modal */}
      {storeId && (
        <ClockOutModal
          isOpen={clockOutModalOpen}
          onClose={() => setClockOutModalOpen(false)}
          storeId={storeId}
        />
      )}

      {/* PIN Authentication Modal - for public POS access */}
      <PINAuthModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onAuthenticated={handlePINAuthenticated}
      />
    </div>
  );
};

export default POSDashboard;
