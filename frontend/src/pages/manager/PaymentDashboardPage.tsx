import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import {
  useGetTransactionsByStoreIdQuery,
  useGetReconciliationReportQuery,
} from '../../store/api/paymentApi';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { format } from 'date-fns';

const PaymentDashboardPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';
  const { handleBack } = useSmartBackNavigation();

  const [selectedDate, setSelectedDate] = useState<string>('all');

  // Fetch today's transactions
  // Pass storeId to trigger refetch when store changes
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } =
    useGetTransactionsByStoreIdQuery(storeId, {
      skip: !storeId,
      pollingInterval: 30000, // Poll every 30 seconds
    });

  // Fetch all orders to include CASH payments
  const { data: allOrders = [], isLoading: ordersLoading, refetch: refetchOrders } =
    useGetStoreOrdersQuery(storeId, {
      skip: !storeId,
      pollingInterval: 30000, // Poll every 30 seconds
    });

  // Fetch reconciliation report - only if specific date is selected
  const { data: report, isLoading: reportLoading, refetch: refetchReport } =
    useGetReconciliationReportQuery(
      { date: selectedDate === 'all' ? format(new Date(), 'yyyy-MM-dd') : selectedDate },
      {
        skip: !storeId || selectedDate === 'all',
        pollingInterval: 60000 // Poll every minute
      }
    );

  // Filter orders - if "all" is selected, show last 30 days, otherwise filter by selected date
  const selectedDateOrders = selectedDate === 'all'
    ? allOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      })
    : allOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === selectedDate;
      });

  // Create payment records from ALL orders (not just CASH)
  // This allows tracking of all payment methods including CASH
  const orderPayments = selectedDateOrders
    .map((order: any) => ({
      id: order.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total || order.totalAmount,
      paymentMethod: order.paymentMethod || 'CASH',
      status: order.paymentStatus === 'PAID' ? 'SUCCESS' :
              order.paymentStatus === 'FAILED' ? 'FAILED' :
              'PENDING',
      createdAt: order.createdAt,
      customerName: order.customerName,
      isOrderPayment: true, // Flag to identify order-based payments
    }));

  // For now, just show order payments (which includes all payment methods)
  // In the future, we can deduplicate with actual payment service transactions
  const allPayments = orderPayments.sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Debug: Check payment statuses
  console.log('[PaymentDashboard] Payment statuses:', orderPayments.map((p: any) => ({
    orderNumber: p.orderNumber,
    status: p.status,
    amount: p.amount,
    paymentMethod: p.paymentMethod
  })));

  // Calculate custom metrics from order payments when "all" is selected
  // For revenue calculation: Include SUCCESS payments AND CASH/PENDING (since cash is collected on delivery)
  const isSuccessfulPayment = (p: any) =>
    p.status === 'SUCCESS' || (p.paymentMethod === 'CASH' && p.status === 'PENDING');

  const customReport = selectedDate === 'all' ? {
    totalTransactions: orderPayments.length,
    successfulTransactions: orderPayments.filter(isSuccessfulPayment).length,
    successfulAmount: orderPayments.filter(isSuccessfulPayment).reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
    failedTransactions: orderPayments.filter((p: any) => p.status === 'FAILED').length,
    refundedTransactions: 0,
    unreconciledCount: orderPayments.filter((p: any) => p.status === 'PENDING' && p.paymentMethod !== 'CASH').length,
    netAmount: orderPayments.filter(isSuccessfulPayment).reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
    paymentMethodBreakdown: orderPayments.reduce((acc: any, p: any) => {
      const method = p.paymentMethod || 'CASH';
      if (isSuccessfulPayment(p)) {
        acc[method] = (acc[method] || 0) + (p.amount || 0);
      }
      return acc;
    }, {})
  } : null;

  console.log('[PaymentDashboard] Custom report:', customReport);

  const displayReport = selectedDate === 'all' ? customReport : report;

  // Refetch data when store changes
  useEffect(() => {
    if (storeId) {
      refetchOrders();
      // Only refetch report if it's not skipped
      if (selectedDate !== 'all') {
        refetchReport();
      }
    }
  }, [storeId, selectedDate, refetchOrders, refetchReport]);

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: '#e8e8e8',
    zIndex: 1,
    paddingTop: '80px',
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

  if ((ordersLoading && !allOrders.length)) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <AppHeader title="Payment Dashboard" showBackButton onBack={handleBack} showManagerNav={true} />
          <h1 style={titleStyles}>Loading...</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="minimal" />
      <div style={containerStyles}>
        <AppHeader title="Payment Dashboard" showBackButton onBack={handleBack} showManagerNav={true} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
          <h1 style={titleStyles}>Payment Dashboard</h1>
          <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
            <select
              value={selectedDate === 'all' ? 'all' : 'date'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setSelectedDate('all');
                } else {
                  setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                }
              }}
              style={dateInputStyles}
            >
              <option value="all">All (Last 30 Days)</option>
              <option value="date">Specific Date</option>
            </select>
            {selectedDate !== 'all' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={dateInputStyles}
              />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {displayReport && (
          <>
            <div style={statsGridStyles}>
              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Total Revenue</div>
                <div style={statValueStyles}>₹{displayReport.successfulAmount.toFixed(2)}</div>
                <div style={statSubtextStyles}>{displayReport.successfulTransactions} successful payments</div>
              </Card>

              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Net Amount</div>
                <div style={statValueStyles}>₹{displayReport.netAmount.toFixed(2)}</div>
                <div style={statSubtextStyles}>After {displayReport.refundedTransactions} refunds</div>
              </Card>

              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Total Transactions</div>
                <div style={statValueStyles}>{displayReport.totalTransactions}</div>
                <div style={statSubtextStyles}>
                  {displayReport.failedTransactions} failed
                </div>
              </Card>

              <Card elevation="md" padding="lg" style={statCardStyles}>
                <div style={statLabelStyles}>Unreconciled</div>
                <div style={statValueStyles}>{displayReport.unreconciledCount}</div>
                <div style={statSubtextStyles}>Needs reconciliation</div>
              </Card>
            </div>

            {/* Payment Method Breakdown */}
            <Card elevation="md" padding="lg" style={{ marginBottom: spacing[6] }}>
              <h2 style={sectionTitleStyles}>Payment Method Breakdown</h2>
              <div style={chartContainerStyles}>
                {Object.entries(displayReport.paymentMethodBreakdown).map(([method, amount]) => (
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
                      ₹{typeof amount === 'number' ? amount.toFixed(2) : '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Recent Transactions */}
        <Card elevation="md" padding="lg">
          <h2 style={sectionTitleStyles}>
            Recent Transactions ({selectedDate === 'all' ? 'Last 30 Days' : selectedDate})
          </h2>

          {allPayments && allPayments.length > 0 ? (
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={tableHeaderStyles}>Transaction ID</th>
                  <th style={tableHeaderStyles}>Order Number</th>
                  <th style={tableHeaderStyles}>Customer</th>
                  <th style={tableHeaderStyles}>Amount</th>
                  <th style={tableHeaderStyles}>Method</th>
                  <th style={tableHeaderStyles}>Status</th>
                  <th style={tableHeaderStyles}>Date</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.slice(0, 50).map((txn: any, index: number) => (
                  <tr key={txn.transactionId || txn.id || index} style={tableRowStyles}>
                    <td style={tableCellStyles}>
                      {txn.isOrderPayment
                        ? `ORD-${txn.id?.substring(0, 8) || 'N/A'}`
                        : txn.transactionId?.substring(0, 8) + '...' || 'N/A'}
                    </td>
                    <td style={tableCellStyles}>{txn.orderNumber || txn.orderId || 'N/A'}</td>
                    <td style={tableCellStyles}>{txn.customerName || txn.customerEmail || 'Walk-in'}</td>
                    <td style={{ ...tableCellStyles, fontWeight: typography.fontWeight.semibold }}>
                      ₹{(txn.amount || 0).toFixed(2)}
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
              No transactions found for {selectedDate}
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default withPageStoreContext(PaymentDashboardPage, 'payments');
