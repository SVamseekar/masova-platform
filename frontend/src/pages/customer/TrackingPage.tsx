import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTrackOrderQuery } from '../../store/api/orderApi';
import { Button, Card } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, shadows } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';

type OrderStatus = 'RECEIVED' | 'PREPARING' | 'COOKING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED';

interface OrderStep {
  status: OrderStatus;
  label: string;
  icon: string;
  description: string;
}

const orderSteps: OrderStep[] = [
  { status: 'RECEIVED', label: 'Order Received', icon: '📋', description: 'Your order has been confirmed' },
  { status: 'PREPARING', label: 'Preparing', icon: '👨‍🍳', description: 'Kitchen is preparing your food' },
  { status: 'COOKING', label: 'Cooking', icon: '🔥', description: 'Your food is being cooked' },
  { status: 'READY', label: 'Ready', icon: '✅', description: 'Order is ready' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🚚', description: 'Driver is on the way' },
  { status: 'DELIVERED', label: 'Delivered', icon: '🎉', description: 'Order delivered successfully' },
];

const TrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Public tracking endpoint - no authentication required
  // Anyone with the order ID can track (used for email tracking links)
  const { data: order, isLoading, error, refetch } = useTrackOrderQuery(orderId || '', {
    skip: !orderId,
    pollingInterval: 10000, // Poll every 10 seconds for real-time updates
  });

  const [elapsedTime, setElapsedTime] = useState(0);

  // Clear cart when tracking page loads (user has successfully placed order)
  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  // Store active order ID in sessionStorage for tracking from other pages
  // Works for both guests and logged-in customers
  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem('activeOrderId', orderId);
    }
  }, [orderId]);

  // Clear active order from sessionStorage when delivered
  useEffect(() => {
    if (order?.status === 'DELIVERED') {
      // Clear after a delay to allow user to see the delivered status
      const timer = setTimeout(() => {
        sessionStorage.removeItem('activeOrderId');
      }, 60000); // Clear after 1 minute
      return () => clearTimeout(timer);
    }
  }, [order?.status]);

  // Calculate elapsed time since order placed
  useEffect(() => {
    if (!order?.createdAt) return;

    const updateElapsedTime = () => {
      const orderTime = new Date(order.createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - orderTime) / 1000 / 60); // minutes
      setElapsedTime(elapsed);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [order?.createdAt]);

  // Get current step index
  const getCurrentStepIndex = (status: OrderStatus): number => {
    return orderSteps.findIndex(step => step.status === status);
  };

  const currentStepIndex = order ? getCurrentStepIndex(order.status as OrderStatus) : 0;

  const handleCartClick = () => {
    navigate('/menu');
  };

  // Estimate remaining time (mock logic - would come from backend in production)
  const getEstimatedTime = (status: OrderStatus): string => {
    switch (status) {
      case 'RECEIVED':
        return '25-30 minutes';
      case 'PREPARING':
        return '20-25 minutes';
      case 'COOKING':
        return '10-15 minutes';
      case 'READY':
        return '5-10 minutes';
      case 'OUT_FOR_DELIVERY':
        return '5-10 minutes';
      default:
        return 'Delivered';
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    zIndex: 1,
  };

  const contentStyles: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    marginTop: spacing[6],
  };

  const successBannerStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'xl'),
    background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successLight} 100%)`,
    padding: spacing[6],
    marginBottom: spacing[8],
    textAlign: 'center',
    color: colors.text.inverse,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    marginBottom: spacing[2],
  };

  const orderNumberStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
  };

  const estimatedTimeStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    opacity: 0.95,
  };

  const progressContainerStyles: React.CSSProperties = {
    position: 'relative',
    marginBottom: spacing[8],
  };

  const stepContainerStyles: React.CSSProperties = {
    position: 'relative',
  };

  const getStepStyles = (index: number): React.CSSProperties => {
    const isCompleted = index <= currentStepIndex;
    const isActive = index === currentStepIndex;

    return {
      ...createNeumorphicSurface(isActive ? 'raised' : isCompleted ? 'flat' : 'inset', 'base', 'lg'),
      padding: spacing[5],
      marginBottom: spacing[4],
      display: 'flex',
      alignItems: 'center',
      gap: spacing[4],
      backgroundColor: isCompleted
        ? colors.brand.primaryLight + '20'
        : colors.surface.primary,
      border: isActive ? `2px solid ${colors.brand.primary}` : 'none',
      transition: 'all 0.3s ease',
      opacity: isCompleted ? 1 : 0.6,
    };
  };

  const stepIconStyles = (isCompleted: boolean, isActive: boolean): React.CSSProperties => ({
    fontSize: '48px',
    opacity: isCompleted ? 1 : 0.5,
    transform: isActive ? 'scale(1.2)' : 'scale(1)',
    transition: 'all 0.3s ease',
  });

  const stepLabelStyles: React.CSSProperties = {
    flex: 1,
  };

  const stepTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  };

  const stepDescriptionStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  const checkmarkStyles: React.CSSProperties = {
    fontSize: '32px',
    color: colors.semantic.success,
  };

  const orderDetailsStyles: React.CSSProperties = {
    marginTop: spacing[8],
  };

  const detailRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  const detailLabelStyles: React.CSSProperties = {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const itemStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
    padding: spacing[3],
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    backgroundColor: colors.surface.secondary,
  };

  const loadingStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: spacing[16],
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
  };

  const errorStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'base', 'lg'),
    padding: spacing[6],
    marginTop: spacing[6],
    backgroundColor: colors.semantic.errorLight + '40',
    color: colors.semantic.error,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  };

  if (!orderId) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={errorStyles}>
            ⚠️ No order ID provided. Please check your order confirmation.
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={loadingStyles}>Loading order details...</div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={errorStyles}>
            ⚠️ Unable to load order details. Please try again or contact support.
          </div>
          <div style={{ textAlign: 'center', marginTop: spacing[6] }}>
            <Button variant="primary" size="lg" onClick={() => navigate('/menu')}>
              Back to Menu
            </Button>
          </div>
        </div>
      </>
    );
  }

  const isDelivered = order.status === 'DELIVERED';

  return (
    <>
      <AnimatedBackground variant="minimal" />

      <div style={containerStyles}>
        <AppHeader
          showPublicNav={true}
          onCartClick={handleCartClick}
        />

        <div style={contentStyles}>
          {/* Success Banner */}
          <div style={successBannerStyles}>
            <div style={{ fontSize: '64px', marginBottom: spacing[3] }}>
              {isDelivered ? '🎉' : '✨'}
            </div>
            <h1 style={titleStyles}>
              {isDelivered ? 'Order Delivered!' : 'Order Confirmed!'}
            </h1>
            <p style={orderNumberStyles}>
              Order #{order.orderNumber || orderId}
            </p>
            {!isDelivered && (
              <p style={estimatedTimeStyles}>
                Estimated time: {getEstimatedTime(order.status as OrderStatus)}
              </p>
            )}
            <p style={{ fontSize: typography.fontSize.base, marginTop: spacing[2] }}>
              {elapsedTime > 0 ? `Placed ${elapsedTime} minutes ago` : 'Just placed'}
            </p>
          </div>

          {/* Order Progress */}
          <Card elevation="lg" padding="lg">
            <h2 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary,
              marginBottom: spacing[6],
            }}>
              Order Progress
            </h2>

            <div style={progressContainerStyles}>
              {orderSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;

                return (
                  <div key={step.status} style={stepContainerStyles}>
                    <div style={getStepStyles(index)}>
                      <div style={stepIconStyles(isCompleted, isActive)}>
                        {step.icon}
                      </div>
                      <div style={stepLabelStyles}>
                        <div style={stepTitleStyles}>{step.label}</div>
                        <div style={stepDescriptionStyles}>{step.description}</div>
                      </div>
                      {isCompleted && (
                        <div style={checkmarkStyles}>✓</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Order Details */}
          <Card elevation="md" padding="lg" style={orderDetailsStyles}>
            <h2 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary,
              marginBottom: spacing[6],
            }}>
              Order Details
            </h2>

            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Customer:</span>
              <span>{order.customerName}</span>
            </div>

            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Phone:</span>
              <span>{order.customerPhone}</span>
            </div>

            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Order Type:</span>
              <span>{order.orderType}</span>
            </div>

            {order.deliveryAddress && (
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Delivery Address:</span>
                <span style={{ textAlign: 'right', maxWidth: '60%' }}>
                  {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                </span>
              </div>
            )}

            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Payment Method:</span>
              <span>{order.paymentMethod}</span>
            </div>

            <div style={{ marginTop: spacing[6], marginBottom: spacing[4] }}>
              <h3 style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[3],
              }}>
                Items Ordered:
              </h3>
              {order.items?.map((item: any, index: number) => (
                <div key={index} style={itemStyles}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: typography.fontWeight.semibold }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              paddingTop: spacing[4],
              borderTop: `2px solid ${colors.surface.tertiary}`,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.extrabold,
            }}>
              <span>Total:</span>
              <span style={{
                background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                ₹{order.total.toFixed(2)}
              </span>
            </div>
          </Card>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing[4],
            marginTop: spacing[8],
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/menu')}
            >
              Browse Menu
            </Button>

            {isDelivered && currentUser && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/customer-dashboard')}
              >
                View Order History
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackingPage;
