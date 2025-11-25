import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card } from '../../components/ui/neumorphic';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

const PaymentFailedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('order_id');
  const errorMessage = searchParams.get('error') || 'Payment was not completed';

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  };

  const cardStyles: React.CSSProperties = {
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  };

  const iconStyles: React.CSSProperties = {
    fontSize: '120px',
    marginBottom: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.semantic.error,
    marginBottom: spacing[4],
  };

  const messageStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing[6],
    lineHeight: 1.6,
  };

  const errorBoxStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[6],
    backgroundColor: colors.semantic.errorLight + '20',
    border: `2px solid ${colors.semantic.error}`,
  };

  const errorTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.semantic.error,
    fontWeight: typography.fontWeight.semibold,
  };

  const reasonsListStyles: React.CSSProperties = {
    textAlign: 'left',
    margin: `${spacing[4]} auto`,
    maxWidth: '400px',
  };

  const reasonItemStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    paddingLeft: spacing[6],
    position: 'relative',
  };

  const bulletStyles: React.CSSProperties = {
    position: 'absolute',
    left: '0',
    color: colors.brand.primary,
    fontWeight: typography.fontWeight.bold,
  };

  return (
    <>
      <AnimatedBackground variant="minimal" />
      <div style={containerStyles}>
        <Card elevation="xl" padding="xl" style={cardStyles}>
          <div style={iconStyles}>❌</div>
          <h1 style={titleStyles}>Payment Failed</h1>
          <p style={messageStyles}>
            We couldn't process your payment. Don't worry, no money has been deducted
            from your account.
          </p>

          <div style={errorBoxStyles}>
            <div style={errorTextStyles}>{errorMessage}</div>
          </div>

          <div style={reasonsListStyles}>
            <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[3] }}>
              Common reasons for payment failure:
            </p>
            <div style={reasonItemStyles}>
              <span style={bulletStyles}>•</span>
              Insufficient balance in your account
            </div>
            <div style={reasonItemStyles}>
              <span style={bulletStyles}>•</span>
              Incorrect card details or expired card
            </div>
            <div style={reasonItemStyles}>
              <span style={bulletStyles}>•</span>
              Payment cancelled by user
            </div>
            <div style={reasonItemStyles}>
              <span style={bulletStyles}>•</span>
              Bank server issues or network connectivity
            </div>
            <div style={reasonItemStyles}>
              <span style={bulletStyles}>•</span>
              Daily transaction limit exceeded
            </div>
          </div>

          <p style={{ ...messageStyles, fontSize: typography.fontSize.base, marginTop: spacing[6] }}>
            Please try again or choose a different payment method. If the problem persists,
            contact your bank or our support team.
          </p>

          <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', marginTop: spacing[6] }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/checkout')}
            >
              Try Again
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/menu')}
            >
              Back to Menu
            </Button>
          </div>

          {orderId && (
            <p style={{ marginTop: spacing[6], fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
              Order ID: {orderId}
            </p>
          )}
        </Card>
      </div>
    </>
  );
};

export default PaymentFailedPage;
