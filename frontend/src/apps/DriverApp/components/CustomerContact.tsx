import React from 'react';
import { colors, spacing, typography, borderRadius } from '../../../styles/design-tokens';
import { createCard, createNeumorphicSurface } from '../../../styles/neumorphic-utils';

interface CustomerContactProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
}

const CustomerContact: React.FC<CustomerContactProps> = ({
  open,
  onClose,
  customerName,
  customerPhone,
  orderNumber
}) => {
  if (!open) return null;

  const handleCall = () => {
    window.location.href = `tel:${customerPhone}`;
  };

  const handleSMS = () => {
    const message = encodeURIComponent(
      `Hi ${customerName}, this is your MaSoVa delivery driver. I'm on my way with your order #${orderNumber}.`
    );
    window.location.href = `sms:${customerPhone}?body=${message}`;
  };

  // Styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing[4],
  };

  const dialogStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    backgroundColor: colors.surface.background,
    maxWidth: '400px',
    width: '100%',
    padding: spacing[6],
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  const closeButtonStyles: React.CSSProperties = {
    padding: spacing[2],
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: borderRadius.full,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'sm', 'full'),
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing[4],
  };

  const customerNameStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const phoneStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand.primary,
    marginBottom: spacing[1],
  };

  const orderStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  };

  const dividerStyles: React.CSSProperties = {
    height: '1px',
    backgroundColor: colors.surface.tertiary,
    margin: `${spacing[4]} 0`,
  };

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
    marginBottom: spacing[4],
  };

  const callButtonStyles: React.CSSProperties = {
    padding: spacing[4],
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successLight} 100%)`,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    transition: 'all 0.2s',
  };

  const smsButtonStyles: React.CSSProperties = {
    padding: spacing[4],
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    border: `2px solid ${colors.semantic.info}`,
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    transition: 'all 0.2s',
  };

  const iconStyles: React.CSSProperties = {
    fontSize: '1.5rem',
  };

  const noteStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[3],
    backgroundColor: colors.surface.secondary,
    textAlign: 'center',
  };

  const noteTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  };

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: spacing[4],
  };

  const cancelButtonStyles: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[6]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    transition: 'all 0.2s',
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={dialogStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <span style={titleStyles}>Contact Customer</span>
          <button onClick={onClose} style={closeButtonStyles}>
            ✕
          </button>
        </div>

        {/* Customer Info */}
        <div style={contentStyles}>
          <div style={customerNameStyles}>{customerName}</div>
          <div style={phoneStyles}>{customerPhone}</div>
          <div style={orderStyles}>Order #{orderNumber}</div>
        </div>

        <div style={dividerStyles} />

        {/* Action Buttons */}
        <div style={buttonContainerStyles}>
          <button onClick={handleCall} style={callButtonStyles}>
            <span style={iconStyles}>📞</span>
            <span>Call Customer</span>
          </button>

          <button onClick={handleSMS} style={smsButtonStyles}>
            <span style={iconStyles}>💬</span>
            <span>Send SMS</span>
          </button>
        </div>

        {/* Note */}
        <div style={noteStyles}>
          <p style={noteTextStyles}>
            Use these options to update the customer about delivery status
          </p>
        </div>

        {/* Footer */}
        <div style={footerStyles}>
          <button onClick={onClose} style={cancelButtonStyles}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerContact;
