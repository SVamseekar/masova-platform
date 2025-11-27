import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetCustomerByUserIdQuery } from '../../store/api/customerApi';
import { useGetCustomerOrdersQuery } from '../../store/api/orderApi';

/**
 * CustomerDashboard - Main dashboard for authenticated customers
 * Shows order history, profile, and quick access to menu
 */
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useGetCustomerByUserIdQuery(currentUser?.id || '', {
    skip: !currentUser?.id,
  });

  // Fetch recent orders
  const { data: orders = [], isLoading: ordersLoading } = useGetCustomerOrdersQuery(customer?.id || '', {
    skip: !customer?.id,
  });

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    zIndex: 1,
  };

  const contentStyles: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    marginTop: spacing[8],
  };

  const welcomeCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'lg', '2xl'),
    padding: spacing[8],
    textAlign: 'center',
    marginBottom: spacing[8],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing[6],
  };

  const quickActionsStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing[6],
    marginTop: spacing[8],
  };

  const actionCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'md', 'xl'),
    padding: spacing[6],
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const actionIconStyles: React.CSSProperties = {
    fontSize: '64px',
    marginBottom: spacing[4],
  };

  const actionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const actionDescriptionStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  // Get recent orders (last 3)
  const recentOrders = orders.slice(0, 3);
  const activeOrder = orders.find(order =>
    !['DELIVERED', 'CANCELLED'].includes(order.status)
  );

  const quickActions = [
    {
      icon: '📦',
      title: 'Order History',
      description: `View your ${orders.length} orders`,
      action: () => navigate('/customer/orders'),
    },
    {
      icon: '👤',
      title: 'Profile',
      description: 'Manage your account details',
      action: () => navigate('/customer/profile'),
    },
    {
      icon: '🎁',
      title: 'Promotions',
      description: 'Check out current offers',
      action: () => navigate('/promotions'),
    },
  ];

  const handleCartClick = () => {
    navigate('/menu');
  };

  const orderCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'md', 'xl'),
    padding: spacing[4],
    marginBottom: spacing[4],
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader
          showPublicNav={true}
          onCartClick={handleCartClick}
        />

        <div style={contentStyles}>
          {/* Welcome Section */}
          <div style={welcomeCardStyles}>
            <div style={{ fontSize: '80px', marginBottom: spacing[4] }}>👋</div>
            <h1 style={titleStyles}>Welcome Back{customer?.name ? `, ${customer.name}` : ''}!</h1>
            <p style={descriptionStyles}>
              {customer?.loyaltyInfo ? `You have ${customer.loyaltyInfo.totalPoints} loyalty points` : 'What would you like to do today?'}
            </p>
            <Button
              variant="primary"
              size="xl"
              onClick={() => navigate('/menu')}
            >
              Order Now
            </Button>
          </div>

          {/* Active Order Tracking */}
          {activeOrder && (
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{ ...titleStyles, fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
                Active Order
              </h2>
              <div
                style={orderCardStyles}
                onClick={() => navigate(`/tracking/${activeOrder.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
                  <div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                      Order #{activeOrder.orderNumber}
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                      {new Date(activeOrder.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: '20px',
                    backgroundColor: colors.brand.primaryLight,
                    color: colors.text.inverse,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold
                  }}>
                    {activeOrder.status}
                  </div>
                </div>
                <div style={{ fontSize: typography.fontSize.base, color: colors.text.secondary }}>
                  {activeOrder.items.length} items • ₹{activeOrder.total.toFixed(2)}
                </div>
                <div style={{ marginTop: spacing[2], color: colors.brand.primary, fontWeight: typography.fontWeight.semibold }}>
                  Track Order →
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{ ...titleStyles, fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
                Recent Orders
              </h2>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={orderCardStyles}
                  onClick={() => navigate(`/tracking/${order.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                    <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                      Order #{order.orderNumber}
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                      ₹{order.total.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {new Date(order.createdAt).toLocaleString()} • {order.status}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div style={quickActionsStyles}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                style={actionCardStyles}
                onClick={action.action}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={actionIconStyles}>{action.icon}</div>
                <div style={actionTitleStyles}>{action.title}</div>
                <div style={actionDescriptionStyles}>{action.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;
