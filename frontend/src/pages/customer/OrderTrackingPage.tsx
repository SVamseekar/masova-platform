import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import StoreInfo from '../../components/StoreInfo';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetCustomerOrdersQuery, Order } from '../../store/api/orderApi';
import { useGetCustomerByUserIdQuery } from '../../store/api/customerApi';
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, PAYMENT_STATUS_CONFIG, ORDER_STATUS_FLOW } from '../../types/order';
import { useCustomerOrdersWebSocket } from '../../hooks/useCustomerOrdersWebSocket';
import { OrderTrackingUpdate } from '../../services/websocketService';

const OrderTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  const { data: customer, isLoading: customerLoading, error: customerError } = useGetCustomerByUserIdQuery(
    currentUser?.id || '',
    { skip: !currentUser?.id }
  );

  React.useEffect(() => {
    console.log('OrderTrackingPage Debug:', { currentUser, customer, customerLoading, customerError, customerId: customer?.id });
  }, [currentUser, customer, customerLoading, customerError]);

  const handleWebSocketUpdate = useCallback((update: OrderTrackingUpdate) => {
    console.log('[OrderTrackingPage] WebSocket update:', update);
  }, []);

  const { isConnected: wsConnected, recentUpdates } = useCustomerOrdersWebSocket({
    customerId: customer?.id || '',
    onOrderUpdate: handleWebSocketUpdate,
    enabled: !!customer?.id,
  });

  const { data: customerOrders = [], isLoading: ordersLoading, error: ordersError, refetch } = useGetCustomerOrdersQuery(
    customer?.id || '',
    {
      skip: !customer?.id,
      pollingInterval: wsConnected ? 30000 : 10000,
      refetchOnMountOrArgChange: true,
    }
  );

  React.useEffect(() => {
    if (recentUpdates.length > 0) refetch();
  }, [recentUpdates, refetch]);

  React.useEffect(() => {
    console.log('Orders Query Debug:', { customerId: customer?.id, ordersLoading, ordersError, customerOrders, orderCount: customerOrders?.length });
  }, [customer?.id, ordersLoading, ordersError, customerOrders]);

  const isLoading = customerLoading || ordersLoading;
  const noCustomer = !customerLoading && !customer;

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const filtered = customerOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      switch (dateFilter) {
        case 'today': return orderDate.toDateString() === now.toDateString();
        case 'week': return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month': return orderDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'year': return orderDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default: return true;
      }
    });
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customerOrders, dateFilter]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const getStatusIndex = (status: string) => ORDER_STATUS_FLOW.indexOf(status as any);

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const currentStepIndex = getStatusIndex(order.status);
    const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);
    const statusCfg = ORDER_STATUS_CONFIG[order.status];

    return (
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          padding: '24px',
          marginBottom: '20px',
          cursor: 'pointer',
          transition: 'var(--transition)',
        }}
        onClick={() => navigate(`/tracking/${order.id}`)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>
              Order #{order.orderNumber}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '8px' }}>
              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </div>
            {order.storeId && (
              <div style={{ marginTop: '8px' }}>
                <StoreInfo storeId={order.storeId} variant="compact" />
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '6px' }}>
              ₹{order.total.toFixed(2)}
            </div>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              background: (statusCfg?.color || '#666') + '22',
              color: statusCfg?.color || 'var(--text-2)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {statusCfg?.icon} {statusCfg?.label}
            </span>
          </div>
        </div>

        {/* Progress bar — active orders */}
        {isActive && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '8px' }}>
              {/* Track line */}
              <div style={{ position: 'absolute', top: '14px', left: '5%', right: '5%', height: '3px', background: 'var(--surface-2)', borderRadius: '2px' }}>
                <div style={{
                  height: '100%',
                  width: `${(currentStepIndex / (ORDER_STATUS_FLOW.length - 1)) * 100}%`,
                  background: 'var(--gold)',
                  borderRadius: '2px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              {ORDER_STATUS_FLOW.map((status, idx) => {
                const cfg = ORDER_STATUS_CONFIG[status];
                const done = idx <= currentStepIndex;
                const current = idx === currentStepIndex;
                return (
                  <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: done ? 'var(--gold)' : 'var(--surface-2)',
                      border: current ? '2px solid var(--gold-light)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', marginBottom: '4px',
                      transform: current ? 'scale(1.2)' : 'scale(1)',
                      transition: 'var(--transition)',
                      color: done ? '#000' : 'var(--text-3)',
                    }}>
                      {done ? '✓' : cfg.icon}
                    </div>
                    <div style={{
                      fontSize: '0.6rem',
                      fontWeight: current ? 700 : 500,
                      color: done ? 'var(--text-2)' : 'var(--text-3)',
                      textAlign: 'center', maxWidth: '60px', lineHeight: 1.2,
                    }}>
                      {cfg.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-col summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Items ({order.items.length})
            </p>
            <div style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '10px 12px', maxHeight: '110px', overflowY: 'auto' }}>
              {order.items.slice(0, 3).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-1)' }}>{item.quantity}× {item.name}</span>
                  <span style={{ color: 'var(--text-3)' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>+ {order.items.length - 3} more</div>
              )}
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Details</p>
            <div style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-3)' }}>Type</span>
                <span style={{ color: ORDER_TYPE_CONFIG[order.orderType]?.color || 'var(--text-1)', fontWeight: 600 }}>
                  {ORDER_TYPE_CONFIG[order.orderType]?.icon} {ORDER_TYPE_CONFIG[order.orderType]?.label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-3)' }}>Payment</span>
                <span style={{ color: PAYMENT_STATUS_CONFIG[order.paymentStatus]?.color || 'var(--text-1)', fontWeight: 600 }}>
                  {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.icon} {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label}
                </span>
              </div>
              {order.orderType === 'DELIVERY' && order.deliveryAddress && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '2px' }}>
                  {order.deliveryAddress.street}, {order.deliveryAddress.city}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/tracking/${order.id}`); }}
            style={{
              flex: 1,
              background: 'var(--gold)',
              color: '#000',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'var(--transition)',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold-light)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; }}
          >
            View Details →
          </button>
          {isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); alert('Support feature coming soon!'); }}
              style={{
                padding: '10px 18px',
                background: 'var(--surface-2)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Help
            </button>
          )}
        </div>
      </div>
    );
  };

  const EmptyState = ({ icon, title, subtitle, showCta = true }: { icon: string; title: string; subtitle: string; showCta?: boolean }) => (
    <div style={{ textAlign: 'center', padding: '80px 32px', background: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.5 }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '24px' }}>{subtitle}</p>
      {showCta && (
        <button
          onClick={() => navigate('/menu')}
          style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', padding: '11px 28px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Browse Menu →
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-3)' }}>Loading your orders...</div>
      </div>
    );
  }

  if (noCustomer) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />
        <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 24px' }}>
          <EmptyState icon="👤" title="Welcome!" subtitle="Place your first order to see your order history here." />
        </div>
      </div>
    );
  }

  if (ordersError && customer) {
    const errorData = ordersError as any;
    const errorMessage = errorData?.data?.message || errorData?.error || 'Unknown error occurred';
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />
        <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', padding: '80px 32px', background: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>Something went wrong</h3>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: '8px' }}>{errorMessage}</p>
            <button onClick={() => refetch()} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', padding: '10px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer', marginTop: '16px' }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
      <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        {/* WS indicator */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: wsConnected ? '#4caf50' : 'var(--text-3)', display: 'inline-block' }} />
          <span style={{ fontSize: '0.72rem', color: wsConnected ? '#4caf50' : 'var(--text-3)' }}>
            {wsConnected ? 'Live Updates' : 'Polling Mode'}
          </span>
        </div>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-1)', margin: '0 0 4px 0' }}>
              My Orders
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0 }}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} — track and manage your history
            </p>
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
              color: 'var(--text-1)', padding: '9px 14px', fontSize: '0.875rem',
              cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-body)',
            }}
          >
            <option value="all">All Orders</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <EmptyState icon="📦" title="No orders yet" subtitle="Start exploring our menu and place your first order!" />
        ) : (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
