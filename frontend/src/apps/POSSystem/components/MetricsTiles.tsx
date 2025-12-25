// src/apps/POSSystem/components/MetricsTiles.tsx
import React from 'react';
import { CURRENCY } from '../../../config/business-config';
import {
  useGetTodaySalesMetricsQuery,
  useGetAverageOrderValueQuery,
  useGetDriverStatusQuery,
} from '../../../store/api/analyticsApi';
import Card from '../../../components/ui/neumorphic/Card';
import { colors, shadows, spacing, typography } from '../../../styles/design-tokens';

interface MetricsTilesProps {
  storeId?: string;
}

/**
 * Real-time metrics display for POS dashboard
 * Shows today's sales, comparisons, and operational stats
 */
const MetricsTiles: React.FC<MetricsTilesProps> = ({ storeId }) => {
  // Fetch real-time metrics from analytics service
  const {
    data: salesMetrics,
    isLoading: salesLoading,
    error: salesError,
  } = useGetTodaySalesMetricsQuery(storeId, {
    pollingInterval: 60000, // Refresh every minute
    skip: !storeId, // Skip if no storeId
  });

  const {
    data: avgOrderValue,
    isLoading: avgLoading,
  } = useGetAverageOrderValueQuery(storeId, {
    pollingInterval: 60000,
    skip: !storeId,
  });

  const {
    data: driverStatus,
    isLoading: driverLoading,
  } = useGetDriverStatusQuery(storeId, {
    pollingInterval: 30000, // Refresh every 30 seconds
    skip: !storeId,
  });

  const isLoading = salesLoading || avgLoading || driverLoading;

  // Show error state if sales data fails to load
  if (salesError) {
    return (
      <Card
        elevation="sm"
        padding="base"
        style={{
          background: `linear-gradient(135deg, ${colors.semantic.warningLight}22 0%, ${colors.semantic.warning}11 100%)`,
          border: `2px solid ${colors.semantic.warning}`,
          textAlign: 'center'
        }}
      >
        ⚠️ Unable to load metrics. Using offline mode.
      </Card>
    );
  }

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    bgColor = colors.brand.primary
  }: any) => (
    <Card
      elevation="md"
      padding="lg"
      interactive
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[4],
        transition: 'all 0.3s ease',
        border: `2px solid transparent`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = bgColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text.inverse,
        fontSize: typography.fontSize['2xl'],
        boxShadow: `0 8px 16px ${bgColor}44`,
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </p>
        <h4 style={{
          margin: `${spacing[1]} 0`,
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.extrabold,
          color: colors.text.primary,
          lineHeight: '1.2'
        }}>
          {isLoading ? (
            <div style={{
              width: '80px',
              height: '20px',
              borderRadius: '4px',
              background: colors.surface.border,
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          ) : value}
        </h4>
        {subtitle && (
          <p style={{
            margin: 0,
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary
          }}>
            {subtitle}
          </p>
        )}
        {trend && trendValue !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
            marginTop: spacing[2]
          }}>
            <span style={{
              fontSize: typography.fontSize.base,
              color: trendValue >= 0 ? colors.semantic.success : colors.semantic.error
            }}>
              {trendValue >= 0 ? '📈' : '📉'}
            </span>
            <span style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
              color: trendValue >= 0 ? colors.semantic.success : colors.semantic.error
            }}>
              {trendValue >= 0 ? '+' : ''}{trendValue.toFixed(1)}%
            </span>
            <span style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary
            }}>
              {trend}
            </span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Card>
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: spacing[4]
    }}>
      {/* Today's Sales */}
      <MetricCard
        title="Today's Sales"
        value={salesMetrics ? CURRENCY.format(salesMetrics.todaySales) : '-'}
        subtitle={salesMetrics ? `${salesMetrics.todayOrderCount} orders` : 'Loading...'}
        icon="💰"
        trend="vs yesterday"
        trendValue={salesMetrics?.percentChangeFromYesterday}
        bgColor={colors.semantic.success}
      />

      {/* Average Order Value */}
      <MetricCard
        title="Avg Order Value"
        value={avgOrderValue ? CURRENCY.format(avgOrderValue.averageOrderValue) : '-'}
        subtitle={avgOrderValue ? `${avgOrderValue.totalOrders} orders` : 'Loading...'}
        icon="🛒"
        trend={avgOrderValue ? 'vs yesterday' : undefined}
        trendValue={avgOrderValue?.percentChange}
        bgColor={colors.semantic.info}
      />

      {/* Year-over-Year Comparison */}
      <MetricCard
        title="Last Year (Same Day)"
        value={salesMetrics ? CURRENCY.format(salesMetrics.lastYearSameDaySales) : '-'}
        trend="YoY growth"
        trendValue={salesMetrics?.percentChangeFromLastYear}
        icon="📊"
        bgColor={colors.semantic.warning}
      />

      {/* Active Deliveries */}
      <MetricCard
        title="Active Deliveries"
        value={driverStatus?.activeDeliveries ?? '-'}
        subtitle={driverStatus ? `${driverStatus.availableDrivers}/${driverStatus.totalDrivers} drivers available` : 'Loading...'}
        icon="🚚"
        bgColor={colors.brand.secondary}
      />
    </div>
  );
};

export default MetricsTiles;
