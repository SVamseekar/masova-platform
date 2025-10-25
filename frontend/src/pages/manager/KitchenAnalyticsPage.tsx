import React, { useState } from 'react';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../../styles/neumorphic-utils';
import { useAppSelector } from '../../store/hooks';

// These would come from orderApi - for now using placeholder
interface PrepTimeByItem {
  [itemName: string]: number;
}

interface StaffPerformance {
  staffId: string;
  totalOrders: number;
  completedOrders: number;
  averagePreparationTime: number;
  failedQualityChecks: number;
  completionRate: number;
}

interface PrepTimeDistribution {
  min: number;
  max: number;
  average: number;
  median: number;
  p90: number;
  p95: number;
  totalOrders: number;
}

const KitchenAnalyticsPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const storeId = user?.storeId || 'default-store';
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data - in real app, these would use RTK Query hooks
  const prepTimeByItem: PrepTimeByItem = {
    'Margherita Pizza': 18,
    'Chicken Biryani': 25,
    'Masala Dosa': 12,
    'Paneer Butter Masala': 15,
    'Hakka Noodles': 10,
    'Filter Coffee': 3,
    'Gulab Jamun': 2,
  };

  const prepTimeDistribution: PrepTimeDistribution = {
    min: 5,
    max: 35,
    average: 16.5,
    median: 15,
    p90: 25,
    p95: 30,
    totalOrders: 45,
  };

  const staffPerformance: StaffPerformance[] = [
    {
      staffId: 'staff1',
      totalOrders: 25,
      completedOrders: 24,
      averagePreparationTime: 15.2,
      failedQualityChecks: 1,
      completionRate: 96.0,
    },
    {
      staffId: 'staff2',
      totalOrders: 20,
      completedOrders: 19,
      averagePreparationTime: 17.8,
      failedQualityChecks: 2,
      completionRate: 95.0,
    },
  ];

  const sortedPrepTimes = Object.entries(prepTimeByItem).sort((a, b) => b[1] - a[1]);

  // Styles
  const containerStyles: React.CSSProperties = {
    padding: spacing[6],
    backgroundColor: colors.surface.background,
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
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

  const dateInputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'md'),
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    border: 'none',
  };

  const statCardStyles = (bgColor: string): React.CSSProperties => ({
    ...createCard('base', 'base'),
    textAlign: 'center' as const,
    backgroundColor: bgColor + '15',
    padding: spacing[4],
  });

  const statValueStyles = (color: string): React.CSSProperties => ({
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: color,
    marginBottom: spacing[1],
  });

  const statLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const cardStyles: React.CSSProperties = {
    ...createCard('lg', 'base'),
  };

  const cardTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: typography.fontSize.sm,
  };

  const tableHeaderStyles: React.CSSProperties = {
    borderBottom: `2px solid ${colors.surface.tertiary}`,
  };

  const tableHeaderCellStyles = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: spacing[3],
    textAlign: align,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  });

  const tableCellStyles = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: spacing[3],
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

  const infoBoxStyles = (bgColor: string): React.CSSProperties => ({
    ...createNeumorphicSurface('inset', 'sm', 'md'),
    marginTop: spacing[4],
    padding: spacing[4],
    backgroundColor: bgColor + '20',
    borderRadius: borderRadius.md,
  });

  const recommendationBoxStyles = (bgColor: string): React.CSSProperties => ({
    ...createCard('base', 'base'),
    padding: spacing[4],
    backgroundColor: bgColor + '20',
    borderLeft: `4px solid ${bgColor}`,
  });

  const getChipColor = (time: number, average: number): string => {
    if (time > 20) return colors.semantic.error;
    if (time > 15) return colors.semantic.warning;
    return colors.semantic.success;
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h1 style={titleStyles}>Kitchen Analytics</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={dateInputStyles}
        />
      </div>

      {/* Prep Time Distribution Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
        <div style={statCardStyles(colors.brand.primary)}>
          <div style={statValueStyles(colors.brand.primary)}>
            {prepTimeDistribution.average.toFixed(1)}
          </div>
          <div style={statLabelStyles}>Avg Prep Time (min)</div>
        </div>
        <div style={statCardStyles(colors.semantic.warning)}>
          <div style={statValueStyles(colors.semantic.warning)}>
            {prepTimeDistribution.median}
          </div>
          <div style={statLabelStyles}>Median (min)</div>
        </div>
        <div style={statCardStyles(colors.brand.secondary)}>
          <div style={statValueStyles(colors.brand.secondary)}>
            {prepTimeDistribution.p90}
          </div>
          <div style={statLabelStyles}>90th Percentile</div>
        </div>
        <div style={statCardStyles(colors.semantic.error)}>
          <div style={statValueStyles(colors.semantic.error)}>
            {prepTimeDistribution.p95}
          </div>
          <div style={statLabelStyles}>95th Percentile</div>
        </div>
        <div style={statCardStyles(colors.semantic.success)}>
          <div style={statValueStyles(colors.semantic.success)}>
            {prepTimeDistribution.min}
          </div>
          <div style={statLabelStyles}>Fastest (min)</div>
        </div>
        <div style={statCardStyles(colors.brand.primaryLight)}>
          <div style={statValueStyles(colors.brand.primary)}>
            {prepTimeDistribution.max}
          </div>
          <div style={statLabelStyles}>Slowest (min)</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: spacing[6], marginBottom: spacing[6] }}>
        {/* Prep Time by Menu Item */}
        <div style={cardStyles}>
          <h2 style={cardTitleStyles}>Avg Prep Time by Menu Item</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles}>
              <thead style={tableHeaderStyles}>
                <tr>
                  <th style={tableHeaderCellStyles('left')}>Menu Item</th>
                  <th style={tableHeaderCellStyles('right')}>Avg Time (min)</th>
                  <th style={tableHeaderCellStyles('center')}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedPrepTimes.map(([itemName, time]) => (
                  <tr key={itemName}>
                    <td style={tableCellStyles('left')}>{itemName}</td>
                    <td style={{ ...tableCellStyles('right') }}>
                      <span style={chipStyles(getChipColor(time, prepTimeDistribution.average))}>
                        {time} min
                      </span>
                    </td>
                    <td style={{ ...tableCellStyles('center') }}>
                      {time > prepTimeDistribution.average ? (
                        <span style={{ color: colors.semantic.error, fontSize: typography.fontSize.lg }}>↗</span>
                      ) : (
                        <span style={{ color: colors.semantic.success, fontSize: typography.fontSize.lg }}>↘</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={infoBoxStyles(colors.semantic.warning)}>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              <strong style={{ color: colors.semantic.warning }}>Bottleneck Alert:</strong> Items taking &gt;20 minutes should be optimized.
              Chicken Biryani is the slowest item.
            </div>
          </div>
        </div>

        {/* Staff Performance */}
        <div style={cardStyles}>
          <h2 style={cardTitleStyles}>Kitchen Staff Performance</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles}>
              <thead style={tableHeaderStyles}>
                <tr>
                  <th style={tableHeaderCellStyles('left')}>Staff ID</th>
                  <th style={tableHeaderCellStyles('center')}>Orders</th>
                  <th style={tableHeaderCellStyles('center')}>Completion</th>
                  <th style={tableHeaderCellStyles('center')}>Avg Time</th>
                  <th style={tableHeaderCellStyles('center')}>Failed QC</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((staff) => (
                  <tr key={staff.staffId}>
                    <td style={tableCellStyles('left')}>{staff.staffId}</td>
                    <td style={tableCellStyles('center')}>
                      {staff.completedOrders}/{staff.totalOrders}
                    </td>
                    <td style={tableCellStyles('center')}>
                      <span style={chipStyles(staff.completionRate >= 95 ? colors.semantic.success : colors.semantic.warning)}>
                        {staff.completionRate.toFixed(0)}%
                      </span>
                    </td>
                    <td style={tableCellStyles('center')}>{staff.averagePreparationTime.toFixed(1)} min</td>
                    <td style={tableCellStyles('center')}>
                      {staff.failedQualityChecks > 0 ? (
                        <span style={chipStyles(colors.semantic.error)}>{staff.failedQualityChecks}</span>
                      ) : (
                        <span style={chipStyles(colors.semantic.success)}>0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={infoBoxStyles(colors.semantic.success)}>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              <strong style={{ color: colors.semantic.success }}>Performance Summary:</strong> Overall completion rate is excellent. Staff1 has
              the best metrics with lowest prep time and highest completion rate.
            </div>
          </div>
        </div>
      </div>

      {/* Bottleneck Analysis */}
      <div style={cardStyles}>
        <h2 style={cardTitleStyles}>Bottleneck Analysis & Recommendations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[4], marginBottom: spacing[4] }}>
          <div style={recommendationBoxStyles(colors.semantic.error)}>
            <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.semantic.error, marginBottom: spacing[2] }}>
              🔴 Critical Issues
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 1.6 }}>
              • Chicken Biryani takes 25 min (52% above average)
              <br />• 95th percentile at 30 min indicates inconsistency
            </div>
          </div>
          <div style={recommendationBoxStyles(colors.semantic.warning)}>
            <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.semantic.warning, marginBottom: spacing[2] }}>
              🟡 Optimization Opportunities
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 1.6 }}>
              • Margherita Pizza (18 min) can be reduced with prep optimization
              <br />• Consider parallel station workflow
            </div>
          </div>
          <div style={recommendationBoxStyles(colors.semantic.success)}>
            <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.semantic.success, marginBottom: spacing[2] }}>
              🟢 Best Practices
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 1.6 }}>
              • Coffee & Desserts have excellent prep times
              <br />• Staff1 demonstrates optimal workflow efficiency
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing[3] }}>
            Recommended Actions:
          </div>
          <ul style={{ margin: 0, paddingLeft: spacing[5], color: colors.text.secondary, fontSize: typography.fontSize.sm, lineHeight: 1.8 }}>
            <li>Review Chicken Biryani recipe for process simplification</li>
            <li>Implement make-table stations for high-volume items</li>
            <li>Cross-train staff using Staff1's efficient techniques</li>
            <li>Monitor quality checkpoints to maintain standards while reducing time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KitchenAnalyticsPage;
