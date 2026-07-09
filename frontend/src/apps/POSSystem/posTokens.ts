/**
 * POS / cashier tokens — staff/ops surface only.
 * Built on neumorphic design-tokens + Cashier role accent (#2196F3).
 * Do not import manager-tokens or customer --dp-* here.
 */
import type { CSSProperties } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/design-tokens';

/** Hard rule: Cashier role color — never change */
export const CASHIER_ROLE = '#2196F3';

export const pos = {
  role: CASHIER_ROLE,
  roleSoft: 'rgba(33, 150, 243, 0.12)',
  roleBorder: 'rgba(33, 150, 243, 0.45)',
  roleShadow: 'rgba(33, 150, 243, 0.35)',
  roleDark: '#1565C0',

  surface: colors.surface.primary,
  surfaceAlt: colors.surface.secondary,
  surfaceElevated: colors.surface.elevated,
  surfaceBg: colors.surface.background,
  border: colors.surface.border,
  ink: colors.text.primary,
  muted: colors.text.secondary,
  faint: colors.text.tertiary,
  inverse: colors.text.inverse,

  brand: colors.brand.primary,
  brandSecondary: colors.brand.secondary,

  success: colors.semantic.success,
  successDark: colors.semantic.successDark,
  successSoft: 'rgba(16, 185, 129, 0.12)',
  warning: colors.semantic.warning,
  warningDark: colors.semantic.warningDark,
  warningSoft: 'rgba(245, 158, 11, 0.15)',
  error: colors.semantic.error,
  errorDark: colors.semantic.errorDark,
  errorSoft: 'rgba(239, 68, 68, 0.12)',
  info: colors.semantic.info,
  infoDark: colors.semantic.infoDark,
  infoSoft: 'rgba(59, 130, 246, 0.12)',

  /** Dark header chrome for cashier floor readability */
  headerBg: '#1a2332',
  headerBgAlt: '#243044',
  headerMuted: '#94a3b8',

  font: typography.fontFamily.primary,
  mono: typography.fontFamily.mono,

  /** Minimum touch target for cashier floor (plan: ≥48px) */
  touchMin: 48,

  radius: {
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    xl: borderRadius.xl,
    full: borderRadius.full,
  },

  space: spacing,
  shadow: shadows,
  type: typography,
} as const;

export type PosTokens = typeof pos;

/** Shared dense panel chrome for menu / cart / pay columns */
export const posPanelShell: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: pos.radius.lg,
  backgroundColor: pos.surface,
  boxShadow: pos.shadow.raised.sm,
  border: `2px solid ${pos.border}`,
  boxSizing: 'border-box',
  minWidth: 0,
};

/** Touch-friendly button base for POS operators */
export const posTouchBtnBase: CSSProperties = {
  minHeight: pos.touchMin,
  minWidth: pos.touchMin,
  border: 'none',
  borderRadius: pos.radius.md,
  fontFamily: pos.font,
  fontWeight: pos.type.fontWeight.bold,
  fontSize: pos.type.fontSize.sm,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 16px',
  transition: 'transform 0.12s ease, opacity 0.12s ease, box-shadow 0.12s ease',
};
