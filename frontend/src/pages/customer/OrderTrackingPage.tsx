import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCustomerOrdersQuery,
  Order,
} from '../../store/api/orderApi';
import { useGetCustomerByUserIdQuery } from '../../store/api/customerApi';
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, PAYMENT_STATUS_CONFIG, ORDER_STATUS_FLOW } from '../../types/order';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

const OrderTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  // Get customer data first
  const { data: customer, isLoading: customerLoading } = useGetCustomerByUserIdQuery(currentUser?.id || '', {
    skip: !currentUser?.id,
  });

  // API hooks - use customer ID from customer data
  const { data: customerOrders = [], isLoading: ordersLoading, error, refetch } = useGetCustomerOrdersQuery(customer?.id || '', {
    skip: !customer?.id,
    pollingInterval: 10000, // Poll every 10 seconds for real-time updates
    refetchOnMountOrArgChange: true, // Refetch on mount to get latest orders
  });

  const isLoading = customerLoading || ordersLoading;

  // If customer doesn't exist, show message to create profile first
  const noCustomer = !customerLoading && !customer;

  // Filter and sort orders - MUST be before any returns to satisfy Rules of Hooks
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const filtered = customerOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      switch (dateFilter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return orderDate >= yearAgo;
        default:
          return true;
      }
    });

    // Sort by date (newest first)
    return filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [customerOrders, dateFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getStatusIndex = (status: string): number => {
    return ORDER_STATUS_FLOW.indexOf(status as any);
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const currentStepIndex = getStatusIndex(order.status);
    const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);

    return (
      <div
        style={{
          ...createNeumorphicSurface('raised', 'md', 'xl'),
          padding: spacing[6],
          marginBottom: spacing[6],
          backgroundColor: colors.surface.primary,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={() => navigate(`/tracking/${order.id}`)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Order Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing[4],
          paddingBottom: spacing[4],
          borderBottom: `2px solid ${colors.surface.tertiary}`,
        }}>
          <div>
            <div style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.brand.primary,
              marginBottom: spacing[1],
            }}>
              Order #{order.orderNumber}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}>
              Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </div>
          </div>
          <div style={{
            textAlign: 'right',
          }}>
            <div style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing[1],
            }}>
              {formatCurrency(order.total)}
            </div>
            <div style={{
              display: 'inline-block',
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: '20px',
              backgroundColor: ORDER_STATUS_CONFIG[order.status]?.color + '22' || colors.surface.tertiary,
              color: ORDER_STATUS_CONFIG[order.status]?.color || colors.text.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
            }}>
              {ORDER_STATUS_CONFIG[order.status]?.icon} {ORDER_STATUS_CONFIG[order.status]?.label}
            </div>
          </div>
        </div>

        {/* Order Progress - 6 Stages */}
        {isActive && (
          <div style={{ marginBottom: spacing[5] }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
              marginBottom: spacing[3],
            }}>
              {/* Progress Line */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '5%',
                right: '5%',
                height: '4px',
                backgroundColor: colors.surface.tertiary,
                borderRadius: '2px',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(currentStepIndex / (ORDER_STATUS_FLOW.length - 1)) * 100}%`,
                  backgroundColor: colors.brand.primary,
                  borderRadius: '2px',
                  transition: 'width 0.5s ease',
                }}></div>
              </div>

              {/* Status Steps */}
              {ORDER_STATUS_FLOW.map((status, idx) => {
                const statusConfig = ORDER_STATUS_CONFIG[status];
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={status}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? colors.brand.primary : colors.surface.tertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: typography.fontSize.base,
                      marginBottom: spacing[2],
                      border: isCurrent ? `3px solid ${colors.brand.primaryLight}` : 'none',
                      boxShadow: isCurrent ? `0 0 0 4px ${colors.brand.primaryLight}22` : 'none',
                      transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                    }}>
                      {isCompleted ? '✓' : statusConfig.icon}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: isCurrent ? typography.fontWeight.bold : typography.fontWeight.medium,
                      color: isCompleted ? colors.text.primary : colors.text.tertiary,
                      textAlign: 'center',
                      maxWidth: '80px',
                      lineHeight: 1.2,
                    }}>
                      {statusConfig.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing[4],
          marginBottom: spacing[4],
        }}>
          {/* Items Preview */}
          <div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              marginBottom: spacing[2],
            }}>
              Order Items ({order.items.length})
            </div>
            <div style={{
              ...createNeumorphicSurface('inset', 'sm', 'lg'),
              padding: spacing[3],
              backgroundColor: colors.surface.secondary,
              maxHeight: '120px',
              overflowY: 'auto',
            }}>
              {order.items.slice(0, 3).map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: spacing[2],
                  fontSize: typography.fontSize.sm,
                }}>
                  <span style={{ color: colors.text.primary }}>
                    {item.quantity}x {item.name}
                  </span>
                  <span style={{ color: colors.text.secondary, fontWeight: typography.fontWeight.semibold }}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[2] }}>
                  + {order.items.length - 3} more items
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              marginBottom: spacing[2],
            }}>
              Order Details
            </div>
            <div style={{
              ...createNeumorphicSurface('inset', 'sm', 'lg'),
              padding: spacing[3],
              backgroundColor: colors.surface.secondary,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: spacing[2],
                fontSize: typography.fontSize.sm,
              }}>
                <span style={{ color: colors.text.secondary }}>Type:</span>
                <span style={{
                  color: ORDER_TYPE_CONFIG[order.orderType]?.color || colors.text.primary,
                  fontWeight: typography.fontWeight.semibold,
                }}>
                  {ORDER_TYPE_CONFIG[order.orderType]?.icon} {ORDER_TYPE_CONFIG[order.orderType]?.label}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: spacing[2],
                fontSize: typography.fontSize.sm,
              }}>
                <span style={{ color: colors.text.secondary }}>Payment:</span>
                <span style={{
                  color: PAYMENT_STATUS_CONFIG[order.paymentStatus]?.color || colors.text.primary,
                  fontWeight: typography.fontWeight.semibold,
                }}>
                  {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.icon} {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label}
                  {order.paymentMethod && ` (${order.paymentMethod})`}
                </span>
              </div>
              {order.orderType === 'DELIVERY' && order.deliveryAddress && (
                <div style={{
                  marginTop: spacing[2],
                  paddingTop: spacing[2],
                  borderTop: `1px solid ${colors.surface.tertiary}`,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold, marginBottom: spacing[1] }}>
                    Delivery to:
                  </div>
                  {order.deliveryAddress.street}, {order.deliveryAddress.city}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: spacing[3],
          marginTop: spacing[4],
        }}>
          <button
            style={{
              ...createNeumorphicSurface('raised', 'sm', 'md'),
              flex: 1,
              padding: `${spacing[3]} ${spacing[4]}`,
              backgroundColor: colors.brand.primary,
              color: colors.text.inverse,
              border: 'none',
              borderRadius: '12px',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tracking/${order.id}`);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            View Full Details →
          </button>
          {isActive && (
            <button
              style={{
                ...createNeumorphicSurface('raised', 'sm', 'md'),
                padding: `${spacing[3]} ${spacing[4]}`,
                backgroundColor: colors.surface.primary,
                color: colors.text.primary,
                border: 'none',
                borderRadius: '12px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Add support/help functionality here
                alert('Support feature coming soon!');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Help
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleCartClick = () => {
    navigate('/menu');
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
    maxWidth: '1200px',
    margin: '0 auto',
    marginTop: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing[8],
  };

  const emptyStateStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: `${spacing[16]} ${spacing[6]}`,
    ...createNeumorphicSurface('inset', 'base', 'xl'),
    backgroundColor: colors.surface.secondary,
    borderRadius: '24px',
  };

  const emptyIconStyles: React.CSSProperties = {
    fontSize: '80px',
    marginBottom: spacing[4],
  };

  const emptyTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const emptySubtextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing[6],
  };

  if (isLoading) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={contentStyles}>
            <div style={{ textAlign: 'center', padding: spacing[16] }}>
              <div style={{ fontSize: '48px', marginBottom: spacing[4] }}>⏳</div>
              <div style={{ fontSize: typography.fontSize.xl, color: colors.text.secondary }}>
                Loading your orders...
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show helpful message if customer profile doesn't exist
  if (noCustomer) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={contentStyles}>
            <div style={emptyStateStyles}>
              <div style={emptyIconStyles}>👤</div>
              <div style={emptyTextStyles}>Welcome!</div>
              <div style={emptySubtextStyles}>
                Please complete your first order to see your order history here.
              </div>
              <button
                style={{
                  ...createNeumorphicSurface('raised', 'sm', 'md'),
                  padding: `${spacing[3]} ${spacing[6]}`,
                  backgroundColor: colors.brand.primary,
                  color: colors.text.inverse,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  marginTop: spacing[4],
                }}
                onClick={() => navigate('/menu')}
              >
                Browse Menu
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Don't show error if customer is not found yet - just show empty state instead
  if (error && customer) {
    console.error('Error loading orders:', error);
    const errorData = error as any;
    const errorMessage = errorData?.data?.message || errorData?.error || 'Unknown error occurred';

    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={contentStyles}>
            <div style={emptyStateStyles}>
              <div style={emptyIconStyles}>⚠️</div>
              <div style={emptyTextStyles}>Something went wrong</div>
              <div style={emptySubtextStyles}>
                We couldn't load your orders. Please try again later.
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginTop: spacing[2] }}>
                Customer ID: {customer?.id || 'Not found'}
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.semantic.error, marginTop: spacing[1], maxWidth: '600px', margin: `${spacing[2]} auto 0` }}>
                Error: {errorMessage}
              </div>
              <button
                style={{
                  ...createNeumorphicSurface('raised', 'sm', 'md'),
                  padding: `${spacing[3]} ${spacing[6]}`,
                  backgroundColor: colors.brand.primary,
                  color: colors.text.inverse,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  marginTop: spacing[4],
                }}
                onClick={() => refetch()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader
          showPublicNav={true}
          onCartClick={handleCartClick}
        />

        <div style={contentStyles}>
          {/* Page Header */}
          <div style={{ marginBottom: spacing[6] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[4] }}>
              <div>
                <h1 style={titleStyles}>My Orders</h1>
                <p style={subtitleStyles}>
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} • Track and manage your order history
                </p>
              </div>

              {/* Date Filter */}
              <div style={{ minWidth: '200px' }}>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  style={{
                    ...createNeumorphicSurface('inset', 'sm', 'md'),
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[4]}`,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    backgroundColor: colors.surface.primary,
                    border: 'none',
                    borderRadius: borderRadius.lg,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Orders</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div style={emptyStateStyles}>
              <div style={emptyIconStyles}>📦</div>
              <div style={emptyTextStyles}>No orders yet</div>
              <div style={emptySubtextStyles}>
                Start exploring our menu and place your first order!
              </div>
              <button
                style={{
                  ...createNeumorphicSurface('raised', 'sm', 'md'),
                  padding: `${spacing[3]} ${spacing[6]}`,
                  backgroundColor: colors.brand.primary,
                  color: colors.text.inverse,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/menu')}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div>
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderTrackingPage;
