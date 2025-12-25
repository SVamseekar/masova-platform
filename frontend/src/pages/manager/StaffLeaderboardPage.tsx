import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetStaffLeaderboardQuery } from '../../store/api/analyticsApi';
import { createCard } from '../../styles/neumorphic-utils';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import AppHeader from '../../components/common/AppHeader';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import { usePageStore } from '../../contexts/PageStoreContext';

const StaffLeaderboardPage: React.FC = () => {
  const { handleBack } = useSmartBackNavigation();
  const [period, setPeriod] = useState('TODAY');

  // Get storeId from page-specific context
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const { data, isLoading, error } = useGetStaffLeaderboardQuery({ storeId, period }, { skip: !storeId });

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'EXCELLENT':
        return colors.semantic.success;
      case 'GOOD':
        return colors.brand.primary;
      case 'AVERAGE':
        return colors.semantic.warning;
      default:
        return colors.semantic.error;
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return 'transparent';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    padding: spacing[6],
    backgroundColor: colors.surface.background,
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    paddingTop: '80px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    margin: 0,
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing[2],
  };

  const periodButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing[2]} ${spacing[4]}`,
    border: 'none',
    borderRadius: borderRadius.md,
    backgroundColor: isActive ? colors.brand.primary : colors.surface.primary,
    color: isActive ? colors.text.inverse : colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.primary,
    cursor: 'pointer',
    boxShadow: isActive ? shadows.floating.md : shadows.inset.sm,
    transition: 'all 0.2s ease',
  });

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: typography.fontSize.sm,
  };

  const tableHeaderStyles: React.CSSProperties = {
    borderBottom: `2px solid ${colors.surface.tertiary}`,
  };

  const tableHeaderCellStyles = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: spacing[4],
    textAlign: align,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  });

  const tableCellStyles = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: spacing[4],
    textAlign: align,
    borderBottom: `1px solid ${colors.surface.secondary}`,
    color: colors.text.secondary,
  });

  const chipStyles = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: `${spacing[1]} ${spacing[3]}`,
    backgroundColor: color,
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.full,
    boxShadow: `0 2px 8px ${color}40`,
  });

  const medalStyles = (medalColor: string): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: medalColor,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
    boxShadow: `0 2px 8px ${medalColor}80`,
  });

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <AppHeader title="Staff Leaderboard" showBackButton={true} onBack={handleBack} showManagerNav={true} />
        <div style={{ textAlign: 'center', padding: spacing[10], color: colors.text.secondary }}>
          Loading leaderboard...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={containerStyles}>
        <AppHeader title="Staff Leaderboard" showBackButton={true} onBack={handleBack} showManagerNav={true} />
        <div style={{ textAlign: 'center', padding: spacing[10], color: colors.semantic.error }}>
          Failed to load leaderboard
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <AppHeader title="Staff Leaderboard" showBackButton={true} onBack={handleBack} showManagerNav={true} />

      <div style={headerStyles}>
        <div>
          <h1 style={titleStyles}>Staff Leaderboard</h1>
          <p style={subtitleStyles}>Top performers for {data.period.toLowerCase()}</p>
        </div>

        <div style={{ display: 'flex', gap: spacing[2] }}>
          <button
            onClick={() => setPeriod('TODAY')}
            style={periodButtonStyles(period === 'TODAY')}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('WEEK')}
            style={periodButtonStyles(period === 'WEEK')}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('MONTH')}
            style={periodButtonStyles(period === 'MONTH')}
          >
            This Month
          </button>
        </div>
      </div>

      <div style={{ ...createCard('lg', 'base'), overflowX: 'auto' }}>
        <table style={tableStyles}>
          <thead style={tableHeaderStyles}>
            <tr>
              <th style={tableHeaderCellStyles('left')}>Rank</th>
              <th style={tableHeaderCellStyles('left')}>Staff Member</th>
              <th style={tableHeaderCellStyles('right')}>Orders</th>
              <th style={tableHeaderCellStyles('right')}>Sales</th>
              <th style={tableHeaderCellStyles('right')}>Avg Order Value</th>
              <th style={tableHeaderCellStyles('right')}>% of Total</th>
              <th style={tableHeaderCellStyles('center')}>Performance</th>
            </tr>
          </thead>
          <tbody>
            {data.rankings.map((staff) => (
              <tr
                key={staff.staffId}
                style={{
                  backgroundColor: staff.rank <= 3 ? `${colors.brand.primary}11` : 'transparent',
                }}
              >
                <td style={tableCellStyles('left')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {staff.rank <= 3 && (
                      <span style={medalStyles(getMedalColor(staff.rank))}>
                        🏆
                      </span>
                    )}
                    <span style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                      {staff.rank}
                    </span>
                  </div>
                </td>
                <td style={tableCellStyles('left')}>
                  <div>
                    <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                      {staff.staffName}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                      ID: {staff.staffId}
                    </div>
                  </div>
                </td>
                <td style={tableCellStyles('right')}>
                  <span style={{ fontSize: typography.fontSize.base, color: colors.text.primary }}>
                    {staff.ordersProcessed}
                  </span>
                </td>
                <td style={tableCellStyles('right')}>
                  <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                    {formatCurrency(staff.salesGenerated)}
                  </span>
                </td>
                <td style={tableCellStyles('right')}>
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {formatCurrency(staff.averageOrderValue)}
                  </span>
                </td>
                <td style={tableCellStyles('right')}>
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {staff.percentOfTotalSales.toFixed(1)}%
                  </span>
                </td>
                <td style={tableCellStyles('center')}>
                  <span style={chipStyles(getPerformanceColor(staff.performanceLevel))}>
                    {staff.performanceLevel.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.rankings.length === 0 && (
        <div style={{ ...createCard('base', 'base'), padding: spacing[8], textAlign: 'center', marginTop: spacing[4] }}>
          <div style={{ fontSize: typography.fontSize.xl, color: colors.text.tertiary }}>
            No staff performance data available for this period
          </div>
        </div>
      )}
    </div>
  );
};

export default withPageStoreContext(StaffLeaderboardPage, 'staff-leaderboard');
