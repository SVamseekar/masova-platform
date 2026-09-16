/**
 * Kitchen Display System tokens — staff/ops surface only.
 * Built on neumorphic design-tokens + Kitchen role accent (#FF6B35).
 * Do not import manager-tokens or customer --dp-* here.
 */
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/design-tokens';

/** Hard rule: Kitchen role color — never change */
export const KITCHEN_ROLE = '#FF6B35';

export const kds = {
  role: KITCHEN_ROLE,
  roleSoft: 'rgba(255, 107, 53, 0.14)',
  roleBorder: 'rgba(255, 107, 53, 0.35)',
  roleShadow: 'rgba(255, 107, 53, 0.22)',

  /** Cook-line board — industrial charcoal, not cream SaaS */
  surface: '#0B0B0C',
  surfaceAlt: '#121214',
  surfaceElevated: '#18181B',
  rail: '#1F1F23',
  ink: '#F5F2EB',
  muted: '#9A958C',
  faint: '#5C5A56',
  inverse: '#FFFFFF',
  hairline: 'rgba(255,255,255,0.06)',

  success: colors.semantic.success,
  successDark: colors.semantic.successDark,
  warning: colors.semantic.warning,
  warningDark: colors.semantic.warningDark,
  error: colors.semantic.error,
  errorDark: colors.semantic.errorDark,
  info: colors.semantic.info,
  infoDark: colors.semantic.infoDark,

  font: typography.fontFamily.primary,
  mono: typography.fontFamily.mono,

  /** Minimum touch target for kitchen floor (plan: ≥48px) */
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

export type KdsTokens = typeof kds;
