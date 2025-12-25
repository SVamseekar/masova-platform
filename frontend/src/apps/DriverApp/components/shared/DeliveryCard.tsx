/**
 * DeliveryCard Component
 * Clean order card with expandable details and swipeable actions
 */

import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton, Divider } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  Navigation as NavigationIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { colors, spacing, borderRadius, typography, animations, createCard } from '../../../../styles/driver-design-tokens';
import { ActionButton } from './ActionButton';

export interface DeliveryCardProps {
  orderNumber: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  address: string;
  items: Array<{ name: string; quantity: number }>;
  onNavigate?: () => void;
  onContact?: () => void;
  onComplete?: () => void;
  onMenuClick?: () => void;
  expanded?: boolean;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  orderNumber,
  amount,
  customerName,
  customerPhone,
  address,
  items,
  onNavigate,
  onContact,
  onComplete,
  onMenuClick,
  expanded: controlledExpanded,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleExpanded = () => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(!internalExpanded);
    }
  };

  const displayedItems = isExpanded ? items : items.slice(0, 2);
  const hasMoreItems = items.length > 2;

  return (
    <Box
      sx={{
        ...createCard(),
        transition: `all ${animations.duration.normal} ${animations.easing.standard}`,

        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      {/* Header: Order # and Amount */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Typography
          sx={{
            fontSize: typography.fontSize.h2,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          {orderNumber}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Typography
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.bold,
              color: colors.primary.green,
            }}
          >
            ₹{amount}
          </Typography>

          {onMenuClick && (
            <IconButton
              size="small"
              onClick={onMenuClick}
              sx={{ color: colors.text.secondary }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Customer Info */}
      <Box sx={{ marginBottom: spacing.md }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
          <Typography sx={{ fontSize: '16px' }}>👤</Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
            }}
          >
            {customerName}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
          <Typography sx={{ fontSize: '16px' }}>📞</Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.caption,
              color: colors.text.secondary,
            }}
          >
            {customerPhone}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
          <Typography sx={{ fontSize: '16px' }}>📍</Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.caption,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.normal,
            }}
          >
            {address}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ marginY: spacing.md }} />

      {/* Items List */}
      <Box sx={{ marginBottom: spacing.md }}>
        {displayedItems.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing.xs,
            }}
          >
            <Typography
              sx={{
                fontSize: typography.fontSize.caption,
                color: colors.text.secondary,
              }}
            >
              {item.name}
            </Typography>
            <Typography
              sx={{
                fontSize: typography.fontSize.caption,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
              }}
            >
              x{item.quantity}
            </Typography>
          </Box>
        ))}

        {/* Expand/Collapse items */}
        {hasMoreItems && (
          <Box
            onClick={toggleExpanded}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              cursor: 'pointer',
              marginTop: spacing.xs,
            }}
          >
            <Typography
              sx={{
                fontSize: typography.fontSize.small,
                color: colors.primary.green,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {isExpanded ? 'Show less' : `... +${items.length - 2} more item${items.length - 2 > 1 ? 's' : ''}`}
            </Typography>
            <ExpandMoreIcon
              sx={{
                fontSize: '16px',
                color: colors.primary.green,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${animations.duration.normal} ${animations.easing.standard}`,
              }}
            />
          </Box>
        )}

        <Collapse in={isExpanded && hasMoreItems}>
          {/* Additional items shown when expanded */}
        </Collapse>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: spacing.sm,
        }}
      >
        <ActionButton
          variant="secondary"
          size="small"
          startIcon={<NavigationIcon />}
          onClick={onNavigate}
        >
          Navigate
        </ActionButton>

        <ActionButton
          variant="secondary"
          size="small"
          startIcon={<PhoneIcon />}
          onClick={onContact}
        >
          Contact
        </ActionButton>

        <ActionButton
          variant="primary"
          size="small"
          startIcon={<CheckCircleIcon />}
          onClick={onComplete}
        >
          Complete
        </ActionButton>
      </Box>
    </Box>
  );
};

export default DeliveryCard;
