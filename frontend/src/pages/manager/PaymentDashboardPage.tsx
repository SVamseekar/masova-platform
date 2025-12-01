import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import {
  useGetTransactionsByStoreIdQuery,
  useGetReconciliationReportQuery,
} from '../../store/api/paymentApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { format } from 'date-fns';

const PaymentDashboardPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  // Fetch today's transactions
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } =
    useGetTransactionsByStoreIdQuery(undefined, {
      skip: !storeId,
      pollingInterval: 30000, // Poll every 30 seconds
    });

  // Fetch reconciliation report
  const { data: report, isLoading: reportLoading, refetch: refetchReport } =
    useGetReconciliationReportQuery(
      { date: selectedDate },
      {
        skip: !storeId,
        pollingInterval: 60000 // Poll every minute
      }
    );

  // Refetch data when store changes
  useEffect(() => {
    if (storeId) {
      refetchTransactions();
      refetchReport();
    }
  }, [storeId, refetchTransactions, refetchReport]);

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: '#e8e8e8',
    zIndex: 1,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  };

  const statCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'md', 'lg'),
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
    marginBottom: spacing[1],
  };

  const statSubtextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
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

  const statusBadgeStyles = (status: string): React.CSSProperties => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      SUCCESS: { bg: colors.semantic.successLight + '40', text: colors.semantic.success },
      FAILED: { bg: colors.semantic.errorLight + '40', text: colors.semantic.error },
      PENDING: { bg: colors.semantic.warningLight + '40', text: colors.semantic.warning },
      REFUNDED: { bg: colors.semantic.infoLight + '40', text: colors.semantic.info },
    };

    const statusColor = statusColors[status] || statusColors.PENDING;

    return {
      display: 'inline-block',
      padding: `${spacing[1]} ${spacing[3]}`,
      borderRadius: borderRadius.full,
      backgroundColor: statusColor.bg,
      color: statusColor.text,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'uppercase',
    };
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

  const chartContainerStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: spacing[3],
    marginTop: spacing[4],
  };

  const methodCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: spacing[4],
    textAlign: 'center',
  };

  if (transactionsLoading || reportLoading) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <AppHeader title="Payment Dashboard" showBackButton />
          <h1 style={titleStyles}>Loading...</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="minimal" />
      <div style={containerStyles}>
        <AppHeader title="Payment Dashboard" showBackButton />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
          <h1 style={titleStyles}>Payment Dashboard</h1>
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={dateInputStyles}
            />
          </div>
        </div>

        {/* Stats Cards */}
        {report && (
          <>
            <div style={statsGridStyles}>
              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Total Revenue</div>
                <div style={statValueStyles}>₹{report.successfulAmount.toFixed(2)}</div>
                <div style={statSubtextStyles}>{report.successfulTransactions} successful payments</div>
              </Card>

              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Net Amount</div>
                <div style={statValueStyles}>₹{report.netAmount.toFixed(2)}</div>
                <div style={statSubtextStyles}>After {report.refundedTransactions} refunds</div>
              </Card>

              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Total Transactions</div>
                <div style={statValueStyles}>{report.totalTransactions}</div>
                <div style={statSubtextStyles}>
                  {report.failedTransactions} failed
                </div>
              </Card>

              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Unreconciled</div>
                <div style={statValueStyles}>{report.unreconciledCount}</div>
                <div style={statSubtextStyles}>Needs reconciliation</div>
              </Card>
            </div>

            {/* Payment Method Breakdown */}
            <Card elevation="md" padding="lg" style={{ marginBottom: spacing[6] }}>
              <h2 style={sectionTitleStyles}>Payment Method Breakdown</h2>
              <div style={chartContainerStyles}>
                {Object.entries(report.paymentMethodBreakdown).map(([method, amount]) => (
                  <div key={method} style={methodCardStyles}>
                    <div style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[2] }}>
                      {method === 'CASH' && '💵'}
                      {method === 'CARD' && '💳'}
                      {method === 'UPI' && '📱'}
                      {method === 'NETBANKING' && '🏦'}
                      {method === 'WALLET' && '👛'}
                      {method === 'OTHER' && '💰'}
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                      {method}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.brand.primary }}>
                      ₹{amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Recent Transactions */}
        <Card elevation="md" padding="lg">
          <h2 style={sectionTitleStyles}>Recent Transactions</h2>

          {transactions && transactions.length > 0 ? (
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={tableHeaderStyles}>Transaction ID</th>
                  <th style={tableHeaderStyles}>Order ID</th>
                  <th style={tableHeaderStyles}>Customer</th>
                  <th style={tableHeaderStyles}>Amount</th>
                  <th style={tableHeaderStyles}>Method</th>
                  <th style={tableHeaderStyles}>Status</th>
                  <th style={tableHeaderStyles}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((txn: any) => (
                  <tr key={txn.transactionId} style={tableRowStyles}>
                    <td style={tableCellStyles}>{txn.transactionId.substring(0, 8)}...</td>
                    <td style={tableCellStyles}>{txn.orderId}</td>
                    <td style={tableCellStyles}>{txn.customerEmail || 'N/A'}</td>
                    <td style={{ ...tableCellStyles, fontWeight: typography.fontWeight.semibold }}>
                      ₹{txn.amount.toFixed(2)}
                    </td>
                    <td style={tableCellStyles}>{txn.paymentMethod || 'N/A'}</td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(txn.status)}>{txn.status}</span>
                    </td>
                    <td style={tableCellStyles}>
                      {format(new Date(txn.createdAt), 'MMM dd, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: spacing[8], color: colors.text.tertiary }}>
              No transactions found for today
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default PaymentDashboardPage;
