import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import {
  useGetTransactionsByStoreIdQuery,
  useInitiateRefundMutation,
  useGetRefundsByTransactionIdQuery,
} from '../../store/api/paymentApi';
import { Card, Button, Input } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { format } from 'date-fns';

const RefundManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [showRefundForm, setShowRefundForm] = useState(false);

  const { data: transactions, isLoading } = useGetTransactionsByStoreIdQuery(storeId);
  const [initiateRefund, { isLoading: refundLoading }] = useInitiateRefundMutation();

  // Filter only successful transactions that can be refunded
  const refundableTransactions = transactions?.filter(
    (txn: any) => txn.status === 'SUCCESS' || txn.status === 'PARTIAL_REFUND'
  );

  const handleInitiateRefund = async () => {
    if (!selectedTransaction || !refundAmount || !refundReason) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await initiateRefund({
        transactionId: selectedTransaction.transactionId,
        amount: parseFloat(refundAmount),
        type: refundType,
        reason: refundReason,
        initiatedBy: currentUser?.userId || 'unknown',
        speed: 'normal',
      }).unwrap();

      alert('Refund initiated successfully!');
      setShowRefundForm(false);
      setSelectedTransaction(null);
      setRefundAmount('');
      setRefundReason('');
    } catch (error) {
      console.error('Failed to initiate refund:', error);
      alert('Failed to initiate refund. Please try again.');
    }
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showRefundForm ? '1fr 400px' : '1fr',
    gap: spacing[6],
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

  const tableRowStyles = (isSelected: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    backgroundColor: isSelected ? colors.brand.primaryLight + '20' : colors.surface.primary,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  });

  const tableCellStyles: React.CSSProperties = {
    padding: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const statusBadgeStyles = (status: string): React.CSSProperties => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      SUCCESS: { bg: colors.semantic.successLight + '40', text: colors.semantic.success },
      PARTIAL_REFUND: { bg: colors.semantic.warningLight + '40', text: colors.semantic.warning },
      REFUNDED: { bg: colors.semantic.infoLight + '40', text: colors.semantic.info },
    };

    const statusColor = statusColors[status] || statusColors.SUCCESS;

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

  const formGroupStyles: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const radioGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
    marginBottom: spacing[4],
  };

  const radioOptionStyles = (isSelected: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isSelected ? 'inset' : 'raised', 'sm', 'lg'),
    padding: spacing[3],
    flex: 1,
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isSelected ? colors.brand.primaryLight + '20' : colors.surface.primary,
    border: isSelected ? `2px solid ${colors.brand.primary}` : 'none',
    transition: 'all 0.3s ease',
  });

  const transactionDetailStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[3],
    marginBottom: spacing[4],
    backgroundColor: colors.surface.secondary,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  if (isLoading) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <AppHeader title="Refund Management" showBackButton />
          <h1 style={titleStyles}>Loading...</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="minimal" />
      <div style={containerStyles}>
        <AppHeader title="Refund Management" showBackButton />

        <h1 style={titleStyles}>Refund Management</h1>

        <div style={gridStyles}>
          {/* Left: Transactions List */}
          <Card elevation="md" padding="lg">
            <h2 style={sectionTitleStyles}>Refundable Transactions</h2>

            {refundableTransactions && refundableTransactions.length > 0 ? (
              <table style={tableStyles}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyles}>Order ID</th>
                    <th style={tableHeaderStyles}>Customer</th>
                    <th style={tableHeaderStyles}>Amount</th>
                    <th style={tableHeaderStyles}>Status</th>
                    <th style={tableHeaderStyles}>Date</th>
                    <th style={tableHeaderStyles}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {refundableTransactions.map((txn: any) => (
                    <tr
                      key={txn.transactionId}
                      style={tableRowStyles(selectedTransaction?.transactionId === txn.transactionId)}
                      onClick={() => {
                        setSelectedTransaction(txn);
                        setShowRefundForm(true);
                        setRefundAmount(txn.amount.toString());
                        setRefundType('FULL');
                      }}
                    >
                      <td style={tableCellStyles}>{txn.orderId}</td>
                      <td style={tableCellStyles}>{txn.customerEmail || 'N/A'}</td>
                      <td style={{ ...tableCellStyles, fontWeight: typography.fontWeight.semibold }}>
                        ₹{txn.amount.toFixed(2)}
                      </td>
                      <td style={tableCellStyles}>
                        <span style={statusBadgeStyles(txn.status)}>{txn.status}</span>
                      </td>
                      <td style={tableCellStyles}>
                        {format(new Date(txn.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td style={tableCellStyles}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(txn);
                            setShowRefundForm(true);
                            setRefundAmount(txn.amount.toString());
                            setRefundType('FULL');
                          }}
                        >
                          Refund
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[8], color: colors.text.tertiary }}>
                No refundable transactions found
              </div>
            )}
          </Card>

          {/* Right: Refund Form */}
          {showRefundForm && selectedTransaction && (
            <Card elevation="lg" padding="lg" style={{ position: 'sticky', top: spacing[6], height: 'fit-content' }}>
              <h2 style={sectionTitleStyles}>Initiate Refund</h2>

              <div style={transactionDetailStyles}>
                <div style={{ marginBottom: spacing[2] }}>
                  <strong>Order ID:</strong> {selectedTransaction.orderId}
                </div>
                <div style={{ marginBottom: spacing[2] }}>
                  <strong>Transaction ID:</strong> {selectedTransaction.transactionId.substring(0, 12)}...
                </div>
                <div style={{ marginBottom: spacing[2] }}>
                  <strong>Customer:</strong> {selectedTransaction.customerEmail || 'N/A'}
                </div>
                <div style={{ marginBottom: spacing[2] }}>
                  <strong>Original Amount:</strong> ₹{selectedTransaction.amount.toFixed(2)}
                </div>
                <div>
                  <strong>Payment Method:</strong> {selectedTransaction.paymentMethod || 'N/A'}
                </div>
              </div>

              {/* Refund Type */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Refund Type</label>
                <div style={radioGroupStyles}>
                  <div
                    style={radioOptionStyles(refundType === 'FULL')}
                    onClick={() => {
                      setRefundType('FULL');
                      setRefundAmount(selectedTransaction.amount.toString());
                    }}
                  >
                    <div style={{ fontWeight: typography.fontWeight.semibold }}>Full Refund</div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                      ₹{selectedTransaction.amount.toFixed(2)}
                    </div>
                  </div>
                  <div
                    style={radioOptionStyles(refundType === 'PARTIAL')}
                    onClick={() => {
                      setRefundType('PARTIAL');
                      setRefundAmount('');
                    }}
                  >
                    <div style={{ fontWeight: typography.fontWeight.semibold }}>Partial Refund</div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                      Custom amount
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Amount */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Refund Amount (INR)</label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                  disabled={refundType === 'FULL'}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Refund Reason */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Reason for Refund *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund (required)"
                  rows={4}
                  style={{
                    ...createNeumorphicSurface('inset', 'sm', 'lg'),
                    width: '100%',
                    padding: spacing[3],
                    fontSize: typography.fontSize.base,
                    border: 'none',
                    outline: 'none',
                    fontFamily: typography.fontFamily.primary,
                    color: colors.text.primary,
                    backgroundColor: colors.surface.secondary,
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: spacing[3] }}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleInitiateRefund}
                  disabled={refundLoading || !refundAmount || !refundReason}
                >
                  {refundLoading ? 'Processing...' : `Refund ₹${refundAmount}`}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setShowRefundForm(false);
                    setSelectedTransaction(null);
                    setRefundAmount('');
                    setRefundReason('');
                  }}
                  disabled={refundLoading}
                >
                  Cancel
                </Button>
              </div>

              <div style={{ marginTop: spacing[4], fontSize: typography.fontSize.xs, color: colors.text.tertiary, textAlign: 'center' }}>
                Refunds typically take 5-7 business days to process
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default RefundManagementPage;
