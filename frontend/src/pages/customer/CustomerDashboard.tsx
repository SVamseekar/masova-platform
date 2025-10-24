import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

/**
 * CustomerDashboard - Main dashboard for authenticated customers
 * Shows order history, profile, and quick access to menu
 */
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();

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

  const quickActions = [
    {
      icon: '🍽️',
      title: 'Order Food',
      description: 'Browse our menu and place an order',
      action: () => navigate('/menu'),
    },
    {
      icon: '📦',
      title: 'Order History',
      description: 'View your past orders',
      action: () => alert('Order history coming soon!'),
    },
    {
      icon: '👤',
      title: 'Profile',
      description: 'Manage your account details',
      action: () => alert('Profile management coming soon!'),
    },
    {
      icon: '🎁',
      title: 'Promotions',
      description: 'Check out current offers',
      action: () => navigate('/promotions'),
    },
  ];

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader title="My Dashboard" hideStaffLogin={false} />

        <div style={contentStyles}>
          {/* Welcome Section */}
          <div style={welcomeCardStyles}>
            <div style={{ fontSize: '80px', marginBottom: spacing[4] }}>👋</div>
            <h1 style={titleStyles}>Welcome Back!</h1>
            <p style={descriptionStyles}>
              What would you like to do today?
            </p>
            <Button
              variant="primary"
              size="xl"
              onClick={() => navigate('/menu')}
            >
              Order Now
            </Button>
          </div>

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
