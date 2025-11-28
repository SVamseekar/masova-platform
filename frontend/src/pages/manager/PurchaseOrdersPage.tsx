import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import {
  useGetAllPurchaseOrdersQuery,
  useGetPendingApprovalPurchaseOrdersQuery,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useSendPurchaseOrderMutation,
  useAutoGeneratePurchaseOrdersMutation,
  PurchaseOrder,
} from '../../store/api/inventoryApi';
import { Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../../styles/neumorphic-utils';
import { format } from 'date-fns';
import CreatePurchaseOrderDialog from '../../components/inventory/CreatePurchaseOrderDialog';
import ReceivePurchaseOrderDialog from '../../components/inventory/ReceivePurchaseOrderDialog';

const PurchaseOrdersPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Fetch data
  const { data: allOrders = [], isLoading } = useGetAllPurchaseOrdersQuery(storeId, {
    pollingInterval: 60000,
  });
  const { data: pendingOrders = [] } = useGetPendingApprovalPurchaseOrdersQuery(storeId);

  const [approvePO] = useApprovePurchaseOrderMutation();
  const [rejectPO] = useRejectPurchaseOrderMutation();
  const [sendPO] = useSendPurchaseOrderMutation();
  const [autoGenerate, { isLoading: isGenerating }] = useAutoGeneratePurchaseOrdersMutation();

  // Filter by status
  const filteredOrders =
    selectedStatus === 'ALL' ? allOrders : allOrders.filter((po) => po.status === selectedStatus);

  const handleApprove = async (po: PurchaseOrder) => {
    if (window.confirm(`Approve purchase order ${po.orderNumber}?`)) {
      try {
        await approvePO({ id: po.id, approvedBy: currentUser?.id || 'unknown' }).unwrap();
      } catch (error) {
        console.error('Failed to approve PO:', error);
      }
    }
  };

  const handleReject = async (po: PurchaseOrder) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await rejectPO({ id: po.id, rejectedBy: currentUser?.id || 'unknown', reason }).unwrap();
      } catch (error) {
        console.error('Failed to reject PO:', error);
      }
    }
  };

  const handleSend = async (po: PurchaseOrder) => {
    if (window.confirm(`Send purchase order ${po.orderNumber} to supplier?`)) {
      try {
        await sendPO({ id: po.id, sentBy: currentUser?.id || 'unknown' }).unwrap();
      } catch (error) {
        console.error('Failed to send PO:', error);
      }
    }
  };

  const handleReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setReceiveDialogOpen(true);
  };

  const handleAutoGenerate = async () => {
    if (window.confirm('Auto-generate purchase orders for all low stock items?')) {
      try {
        await autoGenerate({ storeId, createdBy: currentUser?.id || 'unknown' }).unwrap();
        alert('Purchase orders generated successfully!');
      } catch (error) {
        console.error('Failed to auto-generate POs:', error);
        alert('Failed to generate purchase orders.');
      }
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: colors.surface.background,
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

  const filterButtonStyles = (isActive: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isActive ? 'pressed' : 'raised', 'sm', 'lg'),
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    color: isActive ? colors.brand.primary : colors.text.secondary,
    backgroundColor: isActive ? colors.surface.secondary : colors.surface.primary,
    transition: 'all 0.3s ease',
  });

  const poCardStyles: React.CSSProperties = {
    ...createCard('md', 'lg'),
    padding: spacing[5],
    marginBottom: spacing[4],
  };

  const poHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  };

  const poNumberStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  const statusBadgeStyles = (status: string): React.CSSProperties => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: colors.text.tertiary + '40', text: colors.text.tertiary },
      PENDING_APPROVAL: { bg: colors.semantic.warningLight + '40', text: colors.semantic.warning },
      APPROVED: { bg: colors.semantic.successLight + '40', text: colors.semantic.success },
      SENT: { bg: colors.semantic.infoLight + '40', text: colors.semantic.info },
      PARTIALLY_RECEIVED: { bg: colors.brand.primary + '20', text: colors.brand.primary },
      RECEIVED: { bg: colors.semantic.successLight + '40', text: colors.semantic.success },
      CANCELLED: { bg: colors.semantic.errorLight + '40', text: colors.semantic.error },
      REJECTED: { bg: colors.semantic.errorLight + '40', text: colors.semantic.error },
    };

    const statusColor = statusColors[status] || statusColors.DRAFT;

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

  const infoGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[4],
  };

  const infoItemStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const labelStyles: React.CSSProperties = {
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  };

  const valueStyles: React.CSSProperties = {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const actionButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    marginRight: spacing[2],
    transition: 'all 0.3s ease',
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <AnimatedBackground />
        <AppHeader title="Purchase Orders" showBackButton />
        <div style={{ textAlign: 'center', padding: spacing[10] }}>Loading purchase orders...</div>
      </div>
    );
  }

  const statusCounts = {
    total: allOrders.length,
    pending: allOrders.filter((po) => po.status === 'PENDING_APPROVAL').length,
    approved: allOrders.filter((po) => po.status === 'APPROVED').length,
    sent: allOrders.filter((po) => po.status === 'SENT').length,
  };

  const totalValue = allOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  return (
    <div style={containerStyles}>
      <AnimatedBackground />
      <AppHeader title="Purchase Orders" showBackButton />

      <h1 style={titleStyles}>Purchase Orders</h1>

      {/* Stats Cards */}
      <div style={statsGridStyles}>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Total Orders</div>
          <div style={statValueStyles}>{statusCounts.total}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Pending Approval</div>
          <div style={statValueStyles}>{statusCounts.pending}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Sent to Suppliers</div>
          <div style={statValueStyles}>{statusCounts.sent}</div>
        </div>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>Total Value</div>
          <div style={statValueStyles}>₹{totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyles}>
        <Button onClick={() => setCreateDialogOpen(true)}>+ Create PO</Button>
        <Button onClick={handleAutoGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : '⚡ Auto-Generate from Low Stock'}
        </Button>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[6], flexWrap: 'wrap' }}>
        <button style={filterButtonStyles(selectedStatus === 'ALL')} onClick={() => setSelectedStatus('ALL')}>
          All Orders
        </button>
        <button
          style={filterButtonStyles(selectedStatus === 'PENDING_APPROVAL')}
          onClick={() => setSelectedStatus('PENDING_APPROVAL')}
        >
          Pending Approval
        </button>
        <button style={filterButtonStyles(selectedStatus === 'APPROVED')} onClick={() => setSelectedStatus('APPROVED')}>
          Approved
        </button>
        <button style={filterButtonStyles(selectedStatus === 'SENT')} onClick={() => setSelectedStatus('SENT')}>
          Sent
        </button>
        <button style={filterButtonStyles(selectedStatus === 'RECEIVED')} onClick={() => setSelectedStatus('RECEIVED')}>
          Received
        </button>
      </div>

      {/* Purchase Order Cards */}
      {filteredOrders.map((po) => (
        <div key={po.id} style={poCardStyles}>
          <div style={poHeaderStyles}>
            <div>
              <div style={poNumberStyles}>{po.orderNumber}</div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginTop: spacing[1] }}>
                Supplier ID: {po.supplierId}
              </div>
            </div>
            <span style={statusBadgeStyles(po.status)}>{po.status.replace('_', ' ')}</span>
          </div>

          <div style={infoGridStyles}>
            <div style={infoItemStyles}>
              <div style={labelStyles}>Order Date</div>
              <div style={valueStyles}>{format(new Date(po.orderDate), 'MMM dd, yyyy')}</div>
            </div>
            <div style={infoItemStyles}>
              <div style={labelStyles}>Expected Delivery</div>
              <div style={valueStyles}>{format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy')}</div>
            </div>
            <div style={infoItemStyles}>
              <div style={labelStyles}>Items</div>
              <div style={valueStyles}>{po.items.length}</div>
            </div>
            <div style={infoItemStyles}>
              <div style={labelStyles}>Total Amount</div>
              <div style={valueStyles}>₹{po.totalAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Items Summary */}
          <div style={{ ...createNeumorphicSurface('inset', 'sm', 'lg'), padding: spacing[3], marginBottom: spacing[3] }}>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>
              Items:
            </div>
            {po.items.slice(0, 3).map((item, idx) => (
              <div key={idx} style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[1] }}>
                • {item.itemName} - {item.orderedQuantity} {item.unit} @ ₹{item.unitPrice}
              </div>
            ))}
            {po.items.length > 3 && (
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[1] }}>
                ... and {po.items.length - 3} more items
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ paddingTop: spacing[3], borderTop: `1px solid ${colors.surface.secondary}` }}>
            {po.status === 'PENDING_APPROVAL' && (
              <>
                <button style={{ ...actionButtonStyles, color: colors.semantic.success }} onClick={() => handleApprove(po)}>
                  ✓ Approve
                </button>
                <button style={{ ...actionButtonStyles, color: colors.semantic.error }} onClick={() => handleReject(po)}>
                  ✗ Reject
                </button>
              </>
            )}
            {po.status === 'APPROVED' && (
              <button style={{ ...actionButtonStyles, color: colors.semantic.info }} onClick={() => handleSend(po)}>
                📧 Send to Supplier
              </button>
            )}
            {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
              <button style={{ ...actionButtonStyles, color: colors.brand.primary }} onClick={() => handleReceive(po)}>
                📦 Receive Goods
              </button>
            )}
          </div>
        </div>
      ))}

      {filteredOrders.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: spacing[10],
            color: colors.text.tertiary,
            ...createNeumorphicSurface('raised', 'md', 'lg'),
          }}
        >
          No purchase orders found
        </div>
      )}

      {/* Dialogs */}
      <CreatePurchaseOrderDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} storeId={storeId} />
      {selectedPO && (
        <ReceivePurchaseOrderDialog
          open={receiveDialogOpen}
          onClose={() => {
            setReceiveDialogOpen(false);
            setSelectedPO(null);
          }}
          purchaseOrder={selectedPO}
        />
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
