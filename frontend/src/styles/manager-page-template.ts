/**
 * Standard Manager Page Template - Neumorphic Design Philosophy
 * Use this as the foundation for all manager pages
 */

import { colors, spacing, typography, shadows, borderRadius } from './design-tokens';
import { createNeumorphicSurface, createCard } from './neumorphic-utils';

export const managerPageStyles = {
  // Main container for all manager pages
  container: {
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
  },

  // Page header section
  pageHeader: {
    marginBottom: spacing[8],
  },

  pageTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[2],
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  pageSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },

  // Stats grid for metrics
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing[6],
    marginBottom: spacing[8],
  },

  statCard: {
    ...createCard('lg', 'base', true),
    padding: spacing[6],
    textAlign: 'center' as const,
  },

  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing[2],
  },

  statValue: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.brand.primary,
    marginBottom: spacing[1],
  },

  statChange: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Main content card
  contentCard: {
    ...createCard('lg', 'lg', true),
    padding: spacing[8],
    marginBottom: spacing[6],
  },

  // Section within card
  section: {
    marginBottom: spacing[6],
  },

  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
    borderBottom: `2px solid ${colors.surface.tertiary}`,
    paddingBottom: spacing[3],
  },

  // Tables
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },

  tableHeader: {
    ...createNeumorphicSurface('inset', 'sm', 'none'),
    padding: spacing[4],
    backgroundColor: colors.surface.secondary,
    borderBottom: `2px solid ${colors.surface.tertiary}`,
  },

  tableHeaderCell: {
    padding: spacing[3],
    textAlign: 'left' as const,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: typography.letterSpacing.wide,
  },

  tableRow: {
    borderBottom: `1px solid ${colors.surface.tertiary}`,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },

  tableCell: {
    padding: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },

  // Buttons
  primaryButton: {
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    padding: `${spacing[3]} ${spacing[6]}`,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryLight})`,
    color: colors.text.inverse,
    border: 'none',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: typography.fontFamily.primary,
  },

  secondaryButton: {
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    padding: `${spacing[3]} ${spacing[6]}`,
    backgroundColor: colors.surface.primary,
    color: colors.text.primary,
    border: `2px solid ${colors.surface.tertiary}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: typography.fontFamily.primary,
  },

  // Form elements
  input: {
    ...createNeumorphicSurface('inset', 'base', 'md'),
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    border: 'none',
    fontFamily: typography.fontFamily.primary,
  },

  select: {
    ...createNeumorphicSurface('inset', 'base', 'md'),
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
  },

  // Status badges
  badge: (status: 'success' | 'warning' | 'error' | 'info') => {
    const colors_map = {
      success: { bg: colors.semantic.successLight, text: colors.semantic.successDark },
      warning: { bg: colors.semantic.warningLight, text: colors.semantic.warningDark },
      error: { bg: colors.semantic.errorLight, text: colors.semantic.errorDark },
      info: { bg: colors.brand.primaryLight + '40', text: colors.brand.primary },
    };
    const color = colors_map[status];

    return {
      display: 'inline-block',
      padding: `${spacing[1]} ${spacing[3]}`,
      backgroundColor: color.bg,
      color: color.text,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      textTransform: 'uppercase' as const,
      letterSpacing: typography.letterSpacing.wide,
      borderRadius: borderRadius.md,
    };
  },

  // Loading state
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[12],
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
  },

  // Empty state
  empty: {
    textAlign: 'center' as const,
    padding: spacing[12],
    color: colors.text.secondary,
  },

  emptyIcon: {
    fontSize: typography.fontSize['5xl'],
    marginBottom: spacing[4],
    opacity: 0.5,
  },

  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
  },

  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },
};

export default managerPageStyles;
