import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import {
  useGetAllWasteRecordsQuery,
  useGetTotalWasteCostQuery,
  useGetWasteCostByCategoryQuery,
  useGetTopWastedItemsQuery,
  useGetPreventableWasteAnalysisQuery,
  useRecordWasteMutation,
} from '../../store/api/inventoryApi';
import { Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../../styles/neumorphic-utils';
import { format, subDays } from 'date-fns';
import RecordWasteDialog from '../../components/inventory/RecordWasteDialog';

const WasteAnalysisPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  // Fetch data
  const { data: wasteRecords = [], isLoading, refetch: refetchRecords } = useGetAllWasteRecordsQuery(undefined, {
    skip: !storeId,
    pollingInterval: 60000,
  });
  const { data: totalWaste, refetch: refetchTotal } = useGetTotalWasteCostQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }, { skip: !storeId });
  const { data: wasteByCategory, refetch: refetchCategory } = useGetWasteCostByCategoryQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }, { skip: !storeId });

  // Refetch data when store changes
  useEffect(() => {
    if (storeId) {
      refetchRecords();
      refetchTotal();
      refetchCategory();
    }
  }, [storeId, refetchRecords, refetchTotal, refetchCategory]);
  const { data: topWasted = [] } = useGetTopWastedItemsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: 10,
  });
  const { data: preventableWaste } = useGetPreventableWasteAnalysisQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: '#e8e8e8',
    zIndex: 1,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  };

  const statCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[5],
    textAlign: 'center',
  };

  const statLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const statValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const controlsStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    marginBottom: spacing[6],
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const dateInputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    border: 'none',
    outline: 'none',
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const chartContainerStyles: React.CSSProperties = {
    ...createCard('md', 'lg'),
    padding: spacing[5],
    marginBottom: spacing[6],
  };

  const categoryBarStyles = (percentage: number): React.CSSProperties => ({
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[3],
    marginBottom: spacing[3],
    position: 'relative',
    overflow: 'hidden',
  });

  const barFillStyles = (percentage: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${percentage}%`,
    background: `linear-gradient(135deg, ${colors.brand.primary}40, ${colors.brand.secondary}40)`,
    transition: 'width 0.5s ease',
  });

  const barContentStyles: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: `0 ${spacing[2]}`,
  };

  const tableHeaderStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textAlign: 'left',
    padding: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tableRowStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    backgroundColor: colors.surface.primary,
  };

  const tableCellStyles: React.CSSProperties = {
    padding: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const wasteTypeBadgeStyles = (type: string): React.CSSProperties => {
    const typeColors: Record<string, { bg: string; text: string }> = {
      EXPIRED: { bg: colors.semantic.errorLight + '40', text: colors.semantic.error },
      SPOILED: { bg: colors.semantic.errorLight + '40', text: colors.semantic.error },
      DAMAGED: { bg: colors.semantic.warningLight + '40', text: colors.semantic.warning },
      OVERPRODUCTION: { bg: colors.semantic.infoLight + '40', text: colors.semantic.info },
      PREPARATION_ERROR: { bg: colors.semantic.warningLight + '40', text: colors.semantic.warning },
      OTHER: { bg: colors.text.tertiary + '40', text: colors.text.tertiary },
    };

    const typeColor = typeColors[type] || typeColors.OTHER;

    return {
      display: 'inline-block',
      padding: `${spacing[1]} ${spacing[2]}`,
      borderRadius: borderRadius.full,
      backgroundColor: typeColor.bg,
      color: typeColor.text,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'uppercase',
    };
  };

  if (isLoading) {
    return (
      <>
        <AnimatedBackground />
        <div style={containerStyles}>
          <AppHeader title="Waste Analysis" showBackButton />
          <div style={{ textAlign: 'center', padding: spacing[10] }}>Loading waste data...</div>
        </div>
      </>
    );
  }

  const maxCategoryCost = wasteByCategory
    ? Math.max(...Object.values(wasteByCategory.categoryBreakdown || {}))
    : 1;

  return (
    <>
      <AnimatedBackground />
      <div style={containerStyles}>
        <AppHeader title="Waste Analysis" showBackButton />

      <h1 style={titleStyles}>Waste Analysis</h1>

      {/* Stats Cards */}
      <div style={statsGridStyles}>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Total Waste Cost</div>
          <div style={statValueStyles}>₹{totalWaste?.totalWasteCost.toLocaleString() || 0}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Total Records</div>
          <div style={statValueStyles}>{totalWaste?.totalRecords || 0}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Preventable Waste</div>
          <div style={statValueStyles}>₹{preventableWaste?.preventableWasteCost.toLocaleString() || 0}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Preventable %</div>
          <div style={statValueStyles}>{preventableWaste?.preventablePercentage.toFixed(1) || 0}%</div>
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyles}>
        <div>
          <label style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginRight: spacing[2] }}>From:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
            style={dateInputStyles}
          />
        </div>
        <div>
          <label style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginRight: spacing[2] }}>To:</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
            style={dateInputStyles}
          />
        </div>
        <Button onClick={() => setRecordDialogOpen(true)}>+ Record Waste</Button>
      </div>

      {/* Waste by Category */}
      <div style={chartContainerStyles}>
        <div style={sectionTitleStyles}>Waste Cost by Category</div>
        {wasteByCategory &&
          Object.entries(wasteByCategory.categoryBreakdown || {}).map(([category, cost]) => {
            const percentage = (cost / maxCategoryCost) * 100;
            return (
              <div key={category} style={categoryBarStyles(percentage)}>
                <div style={barFillStyles(percentage)} />
                <div style={barContentStyles}>
                  <span style={{ fontWeight: typography.fontWeight.semibold }}>{category}</span>
                  <span style={{ fontWeight: typography.fontWeight.bold, color: colors.brand.primary }}>
                    ₹{cost.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Top Wasted Items */}
      <div style={chartContainerStyles}>
        <div style={sectionTitleStyles}>Top 10 Wasted Items</div>
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={tableHeaderStyles}>Rank</th>
              <th style={tableHeaderStyles}>Item Name</th>
              <th style={tableHeaderStyles}>Total Quantity</th>
              <th style={tableHeaderStyles}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {topWasted.map((item, index) => (
              <tr key={index} style={tableRowStyles}>
                <td style={tableCellStyles}>#{index + 1}</td>
                <td style={tableCellStyles}>
                  <strong>{item.itemName}</strong>
                </td>
                <td style={tableCellStyles}>
                  {item.totalQuantity} {item.unit}
                </td>
                <td style={tableCellStyles}>₹{item.totalCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topWasted.length === 0 && (
          <div style={{ textAlign: 'center', padding: spacing[8], color: colors.text.tertiary }}>
            No waste data available for the selected period
          </div>
        )}
      </div>

      {/* Recent Waste Records */}
      <div style={chartContainerStyles}>
        <div style={sectionTitleStyles}>Recent Waste Records</div>
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={tableHeaderStyles}>Date</th>
              <th style={tableHeaderStyles}>Item</th>
              <th style={tableHeaderStyles}>Type</th>
              <th style={tableHeaderStyles}>Quantity</th>
              <th style={tableHeaderStyles}>Cost</th>
              <th style={tableHeaderStyles}>Preventable</th>
            </tr>
          </thead>
          <tbody>
            {wasteRecords.slice(0, 10).map((record) => (
              <tr key={record.id} style={tableRowStyles}>
                <td style={tableCellStyles}>{format(new Date(record.recordedAt), 'MMM dd, yyyy')}</td>
                <td style={tableCellStyles}>
                  <strong>{record.itemName}</strong>
                </td>
                <td style={tableCellStyles}>
                  <span style={wasteTypeBadgeStyles(record.wasteType)}>{record.wasteType.replace('_', ' ')}</span>
                </td>
                <td style={tableCellStyles}>
                  {record.quantity} {record.unit}
                </td>
                <td style={tableCellStyles}>₹{record.wasteCost.toFixed(2)}</td>
                <td style={tableCellStyles}>{record.isPreventable ? '⚠️ Yes' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <RecordWasteDialog open={recordDialogOpen} onClose={() => setRecordDialogOpen(false)} storeId={storeId} />
      </div>
    </>
  );
};

export default WasteAnalysisPage;
