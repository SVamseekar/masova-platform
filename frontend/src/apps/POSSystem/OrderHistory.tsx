// src/apps/POSSystem/OrderHistory.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';
import { useRecordCashPaymentMutation } from '../../store/api/paymentApi';
import { useAppSelector } from '../../store/hooks';
import { CURRENCY } from '../../config/business-config';
import AppHeader from '../../components/common/AppHeader';
import Card from '../../components/ui/neumorphic/Card';
import Badge from '../../components/ui/neumorphic/Badge';
import Button from '../../components/ui/neumorphic/Button';
import { colors, shadows, spacing, typography } from '../../styles/design-tokens';

/**
 * Order History Page
 * Shows all orders for today with search and filter capabilities
 */
const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const storeId = user?.storeId;

  const [searchTerm, setSearchTerm] = useState('');
  const [recordCashPayment] = useRecordCashPaymentMutation();

  const { data: orders = [], isLoading, error } = useGetStoreOrdersQuery(
    undefined,
    { skip: !storeId }
  );

  // Handler for marking cash orders as paid
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

      alert(`Order #${order.orderNumber} marked as PAID!\n\nCash payment of ${CURRENCY.format(order.total)} recorded.`);
    } catch (error: any) {
      console.error('Failed to record cash payment:', error);
      alert(`Failed to mark order as paid.\n\n${error?.data?.message || 'Please try again.'}`);
    }
  };

  // Filter today's orders
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt).toDateString();
    return orderDate === today;
  });

  // Search filter
  const filteredOrders = todayOrders.filter((order: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerPhone?.includes(searchTerm)
    );
  });

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'secondary' | 'primary' => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'secondary' | 'primary'> = {
      PENDING: 'warning',
      CONFIRMED: 'primary',
      PREPARING: 'primary',
      READY: 'success',
      OUT_FOR_DELIVERY: 'secondary',
      DELIVERED: 'success',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return colors[status] || 'secondary';
  };

  const handlePrintOrder = (orderId: string) => {
    alert(`Print functionality for order ${orderId} coming soon!`);
  };

  const totalSales = filteredOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: colors.surface.background,
      fontFamily: typography.fontFamily.primary
    }}>
      {/* App Header */}
      <AppHeader title={`Order History - ${user?.name || 'Staff'}`} />

      {/* Action Bar */}
      <div style={{
        padding: `${spacing[2]} ${spacing[6]}`,
        backgroundColor: colors.surface.primary,
        borderBottom: `1px solid ${colors.surface.border}`,
        display: 'flex',
        gap: spacing[3],
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pos')}
        >
          ← Back to POS
        </Button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: spacing[3], alignItems: 'center' }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
            fontWeight: typography.fontWeight.semibold
          }}>
            {filteredOrders.length} orders
          </div>
          <div style={{
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successDark} 100%)`,
            color: colors.text.inverse,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold
          }}>
            {CURRENCY.format(totalSales)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: spacing[6]
      }}>
        {/* Search Bar */}
        <Card
          elevation="md"
          padding="base"
          style={{
            marginBottom: spacing[4],
            backgroundColor: colors.surface.primary
          }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.tertiary,
              display: 'flex',
              alignItems: 'center'
            }}>
              <SearchIcon style={{ fontSize: '18px' }} />
            </div>
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[10]}`,
                border: `2px solid ${colors.surface.border}`,
                borderRadius: '12px',
                outline: 'none',
                backgroundColor: colors.surface.secondary,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.primary,
                boxShadow: shadows.inset.sm,
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.brand.primary}22`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.surface.border;
                e.currentTarget.style.boxShadow = shadows.inset.sm;
              }}
            />
          </div>
        </Card>

        {/* Orders List */}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing[10],
            color: colors.text.secondary
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `4px solid ${colors.surface.border}`,
              borderTopColor: colors.brand.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {error && (
          <Card
            elevation="sm"
            padding="lg"
            style={{
              background: `linear-gradient(135deg, ${colors.semantic.errorLight}22 0%, ${colors.semantic.error}11 100%)`,
              border: `2px solid ${colors.semantic.error}`,
              color: colors.text.primary,
              textAlign: 'center'
            }}
          >
            <ErrorOutlineIcon style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
            Failed to load orders. Please try again.
          </Card>
        )}

        {!isLoading && !error && filteredOrders.length === 0 && (
          <Card
            elevation="sm"
            padding="lg"
            style={{
              background: `linear-gradient(135deg, ${colors.semantic.infoLight}22 0%, ${colors.semantic.info}11 100%)`,
              border: `2px solid ${colors.semantic.info}`,
              color: colors.text.primary,
              textAlign: 'center'
            }}
          >
            <InfoOutlinedIcon style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
            {searchTerm ? 'No orders found matching your search' : 'No orders today yet'}
          </Card>
        )}

        {!isLoading && !error && filteredOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {filteredOrders.map((order: any) => (
              <Card
                key={order.id}
                elevation="md"
                padding="base"
                interactive
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[3],
                  transition: 'all 0.2s ease',
                  border: `2px solid transparent`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Order Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      marginBottom: spacing[1]
                    }}>
                      Order #{order.orderNumber}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary
                    }}>
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.brand.primary
                  }}>
                    {CURRENCY.format(order.total || 0)}
                  </div>
                </div>

                {/* Order Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                  <Badge variant={getStatusColor(order.status)} size="sm">
                    {order.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {order.orderType.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {order.items?.length || 0} items
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {order.paymentMethod}
                  </Badge>
                  {order.paymentStatus === 'PAID' ? (
                    <Badge variant="success" size="sm">
                      <CheckCircleOutlineIcon style={{ fontSize: '12px', marginRight: '3px', verticalAlign: 'middle' }} />
                      Paid
                    </Badge>
                  ) : order.paymentStatus === 'PENDING' ? (
                    <Badge variant="warning" size="sm">
                      <MoneyOffIcon style={{ fontSize: '12px', marginRight: '3px', verticalAlign: 'middle' }} />
                      Unpaid
                    </Badge>
                  ) : null}
                </div>

                {/* Customer Info */}
                {(order.customerName || order.customerPhone) && (
                  <div style={{
                    padding: spacing[2],
                    borderRadius: '8px',
                    backgroundColor: colors.surface.secondary,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary
                  }}>
                    <strong style={{ color: colors.text.primary }}>{order.customerName || 'Walk-in'}</strong>
                    {order.customerPhone && <> • {order.customerPhone}</>}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                  {/* Mark as Paid button for PENDING cash orders */}
                  {order.paymentStatus === 'PENDING' && order.paymentMethod === 'CASH' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleMarkAsPaid(order)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      <AttachMoneyIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                      Mark as Paid
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePrintOrder(order.id)}
                  >
                    <PrintIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/manager/orders/${order.id}`)}
                  >
                    <VisibilityIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
