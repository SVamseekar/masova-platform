/**
 * CustomerContact Component - Redesigned (Bottom Sheet)
 * Modern bottom sheet dialog with smooth slide-up animation
 */

import React from 'react';
import { Box, Drawer, Avatar, Divider, IconButton } from '@mui/material';
import {
  Phone as PhoneIcon,
  Sms as SmsIcon,
  Navigation as NavigationIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { colors, spacing, typography, borderRadius, shadows, animations } from '../../../styles/driver-design-tokens';
import { ActionButton } from './shared';

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
  const handleCall = () => {
    window.location.href = `tel:${customerPhone}`;
  };

  const handleSMS = () => {
    const message = encodeURIComponent(
      `Hi ${customerName}, this is your MaSoVa delivery driver. I'm on my way with your order #${orderNumber}.`
    );
    window.location.href = `sms:${customerPhone}?body=${message}`;
  };

  const getInitials = (name: string): string => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: borderRadius.lg,
          borderTopRightRadius: borderRadius.lg,
          background: colors.surface.background,
          boxShadow: shadows.elevated,
          maxHeight: '90vh',
        },
      }}
    >
      <Box
        sx={{
          padding: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        {/* Drag Handle */}
        <Box
          sx={{
            width: '40px',
            height: '4px',
            borderRadius: borderRadius.full,
            backgroundColor: colors.surface.border,
            margin: '0 auto',
            marginBottom: spacing.lg,
          }}
        />

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
          }}
        >
          <Box
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Contact Customer
          </Box>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: colors.text.secondary,
              '&:hover': {
                backgroundColor: colors.surface.backgroundAlt,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Customer Info Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: spacing.lg,
            padding: spacing.base,
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: '80px',
              height: '80px',
              backgroundColor: colors.primary.green,
              color: colors.text.inverse,
              fontSize: typography.fontSize.h1,
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing.base,
            }}
          >
            {getInitials(customerName)}
          </Avatar>

          {/* Customer Name */}
          <Box
            sx={{
              fontSize: typography.fontSize.h1,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing.xs,
            }}
          >
            {customerName}
          </Box>

          {/* Phone Number */}
          <Box
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.medium,
              color: colors.primary.green,
              marginBottom: spacing.xs,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {customerPhone}
          </Box>

          {/* Order Number */}
          <Box
            sx={{
              fontSize: typography.fontSize.caption,
              color: colors.text.secondary,
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: colors.surface.backgroundAlt,
              borderRadius: borderRadius.full,
            }}
          >
            Order #{orderNumber}
          </Box>
        </Box>

        <Divider sx={{ marginY: spacing.lg }} />

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <ActionButton
            variant="primary"
            size="large"
            fullWidth
            startIcon={<PhoneIcon />}
            onClick={handleCall}
          >
            Call Customer
          </ActionButton>

          <ActionButton
            variant="secondary"
            size="large"
            fullWidth
            startIcon={<SmsIcon />}
            onClick={handleSMS}
          >
            Send SMS
          </ActionButton>

          <ActionButton
            variant="secondary"
            size="large"
            fullWidth
            startIcon={<NavigationIcon />}
            onClick={onClose}
          >
            Get Directions
          </ActionButton>
        </Box>

        {/* Info Note */}
        <Box
          sx={{
            padding: spacing.base,
            backgroundColor: colors.primary.greenLight,
            borderRadius: borderRadius.sm,
            border: `1px solid ${colors.primary.green}20`,
          }}
        >
          <Box
            sx={{
              fontSize: typography.fontSize.small,
              color: colors.text.secondary,
              textAlign: 'center',
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            💡 Keep the customer updated about delivery status for better experience
          </Box>
        </Box>

        {/* Cancel Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: spacing.lg,
          }}
        >
          <ActionButton
            variant="text"
            onClick={onClose}
          >
            Cancel
          </ActionButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CustomerContact;
