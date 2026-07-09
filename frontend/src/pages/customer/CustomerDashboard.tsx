import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import { formatOrderAmount } from '../../utils/orderMoney';
import { useGetCustomerByUserIdQuery } from '../../store/api/customerApi';
import { useGetCustomerOrdersQuery } from '../../store/api/orderApi';

/**
 * CustomerDashboard — authenticated customer home (dark-premium tokens only).
 * States: loading · error · empty (no orders) · data.
 */
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);

  const {
    data: customer,
    isLoading: customerLoading,
    isError: customerError,
    refetch: refetchCustomer,
  } = useGetCustomerByUserIdQuery(currentUser?.id || '', {
    skip: !currentUser?.id,
  });

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useGetCustomerOrdersQuery(customer?.id || '', {
    skip: !customer?.id,
  });

  const isLoading = customerLoading || (!!customer?.id && ordersLoading);
  const recentOrders = orders.slice(0, 3);
  const activeOrder = orders.find(
    (order) => !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(order.status)
  );

  const handleCartClick = () => {
    navigate('/menu');
  };

  const shell = (children: React.ReactNode) => (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-1)',
      }}
    >
      <AppHeader showPublicNav onCartClick={handleCartClick} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px' }}>{children}</div>
    </div>
  );

  if (!currentUser?.id) {
    return shell(
      <StateCard
        icon="🔐"
        title="Sign in required"
        subtitle="Log in to see your dashboard, orders, and loyalty."
        actionLabel="Customer Login"
        onAction={() => navigate('/customer-login')}
      />
    );
  }

  if (isLoading) {
    return shell(
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-3)' }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--gold)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        Loading your dashboard…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (customerError) {
    return shell(
      <StateCard
        icon="⚠️"
        title="Couldn’t load profile"
        subtitle="We couldn’t reach your customer profile. Check your connection and try again."
        actionLabel="Retry"
        onAction={() => refetchCustomer()}
      />
    );
  }

  const quickActions = [
    {
      icon: '📦',
      title: 'Order History',
      description:
        orders.length === 0
          ? 'No orders yet — start with the menu'
          : `View your ${orders.length} order${orders.length === 1 ? '' : 's'}`,
      action: () => navigate('/customer/orders'),
    },
    {
      icon: '👤',
      title: 'Profile',
      description: 'Addresses, preferences & notifications',
      action: () => navigate('/customer/profile'),
    },
    {
      icon: '🎁',
      title: 'Promotions',
      description: 'Current offers at your store',
      action: () => navigate('/promotions'),
    },
  ];

  return shell(
    <>
      {/* Welcome */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '36px 32px',
          textAlign: 'center',
          marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-1)',
            margin: '0 0 10px',
          }}
        >
          Welcome back{customer?.name ? `, ${customer.name}` : ''}!
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '1rem', margin: '0 0 24px' }}>
          {customer?.loyaltyInfo
            ? `You have ${customer.loyaltyInfo.totalPoints} loyalty points`
            : 'What would you like to order today?'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/menu')}
          style={{
            background: 'var(--red)',
            color: 'var(--text-1)',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            padding: '12px 28px',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Order Now
        </button>
      </div>

      {/* Active order */}
      {activeOrder && (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-1)',
              margin: '0 0 14px',
            }}
          >
            Active Order
          </h2>
          <OrderRow
            orderNumber={activeOrder.orderNumber}
            createdAt={activeOrder.createdAt}
            status={activeOrder.status}
            itemCount={activeOrder.items.length}
            totalLabel={formatOrderAmount(activeOrder.total, activeOrder, currency, locale)}
            onClick={() => navigate(`/tracking/${activeOrder.id}`)}
            highlight
          />
        </section>
      )}

      {/* Recent orders */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-1)',
              margin: 0,
            }}
          >
            Recent Orders
          </h2>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/customer/orders')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              View all
            </button>
          )}
        </div>

        {ordersError ? (
          <StateCard
            icon="⚠️"
            title="Couldn’t load orders"
            subtitle="Your profile loaded, but order history failed. Try again."
            actionLabel="Retry"
            onAction={() => refetchOrders()}
            compact
          />
        ) : recentOrders.length === 0 ? (
          <StateCard
            icon="📦"
            title="No orders yet"
            subtitle="Browse the menu and place your first order — it’ll show up here."
            actionLabel="Browse Menu"
            onAction={() => navigate('/menu')}
            compact
          />
        ) : (
          recentOrders.map((order) => (
            <OrderRow
              key={order.id}
              orderNumber={order.orderNumber}
              createdAt={order.createdAt}
              status={order.status}
              itemCount={order.items.length}
              totalLabel={formatOrderAmount(order.total, order, currency, locale)}
              onClick={() => navigate(`/tracking/${order.id}`)}
            />
          ))
        )}
      </section>

      {/* Quick actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {quickActions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={action.action}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'inherit',
              fontFamily: 'var(--font-body)',
              transition: 'var(--transition)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>{action.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)', marginBottom: 6 }}>
              {action.title}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{action.description}</div>
          </button>
        ))}
      </div>
    </>
  );
};

function OrderRow({
  orderNumber,
  createdAt,
  status,
  itemCount,
  totalLabel,
  onClick,
  highlight,
}: {
  orderNumber: string;
  createdAt: string;
  status: string;
  itemCount: number;
  totalLabel: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: highlight ? 'rgba(212,168,67,0.06)' : 'var(--surface)',
        border: `1px solid ${highlight ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 10,
        cursor: 'pointer',
        color: 'inherit',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>Order #{orderNumber}</div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(212,168,67,0.12)',
            color: 'var(--gold)',
            border: '1px solid var(--border)',
          }}
        >
          {status}
        </span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
        {new Date(createdAt).toLocaleString()} · {itemCount} item{itemCount === 1 ? '' : 's'} · {totalLabel}
      </div>
      {highlight && (
        <div style={{ marginTop: 8, color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem' }}>
          Track order →
        </div>
      )}
    </button>
  );
}

function StateCard({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  compact,
}: {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: compact ? '40px 24px' : '64px 28px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div style={{ fontSize: compact ? '2.5rem' : '3rem', marginBottom: 12, opacity: 0.7 }}>{icon}</div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-1)',
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>
      <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: '0 0 20px' }}>{subtitle}</p>
      <button
        type="button"
        onClick={onAction}
        style={{
          background: 'var(--red)',
          color: 'var(--text-1)',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '10px 22px',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default CustomerDashboard;
