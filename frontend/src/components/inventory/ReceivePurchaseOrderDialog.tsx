import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Button } from '../ui/neumorphic';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useReceivePurchaseOrderMutation, PurchaseOrder } from '../../store/api/inventoryApi';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface ReceivePurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
}

const ReceivePurchaseOrderDialog: React.FC<ReceivePurchaseOrderDialogProps> = ({ open, onClose, purchaseOrder }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [receivePO, { isLoading }] = useReceivePurchaseOrderMutation();

  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>(
    purchaseOrder.items.reduce((acc, item) => ({ ...acc, [item.itemId]: item.orderedQuantity }), {})
  );
  const [notes, setNotes] = useState('');

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setReceivedQuantities((prev) => ({ ...prev, [itemId]: quantity }));
  };

  const handleSubmit = async () => {
    try {
      await receivePO({
        id: purchaseOrder.id,
        request: {
          items: purchaseOrder.items.map((item) => ({
            itemId: item.itemId,
            receivedQuantity: receivedQuantities[item.itemId] || 0,
          })),
          receivedBy: currentUser?.id || 'unknown',
          notes,
        },
      }).unwrap();

      onClose();
    } catch (error) {
      console.error('Failed to receive PO:', error);
      alert('Failed to receive purchase order. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle style={{ fontFamily: typography.fontFamily.primary, fontWeight: typography.fontWeight.bold }}>
        Receive Purchase Order - {purchaseOrder.orderNumber}
      </DialogTitle>
      <DialogContent style={{ fontFamily: typography.fontFamily.primary, padding: spacing[6] }}>
        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[4] }}>
          Enter the actual quantities received for each item:
        </div>

        {purchaseOrder.items.map((item) => (
          <div
            key={item.itemId}
            style={{
              ...createNeumorphicSurface('raised', 'sm', 'lg'),
              padding: spacing[4],
              marginBottom: spacing[3],
            }}
          >
            <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>
              {item.itemName}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <div>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>Ordered</div>
                <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>
                  {item.orderedQuantity} {item.unit}
                </div>
              </div>
              <TextField
                label={`Received (${item.unit})`}
                type="number"
                value={receivedQuantities[item.itemId]}
                onChange={(e) => handleQuantityChange(item.itemId, parseFloat(e.target.value))}
                fullWidth
                variant="outlined"
                size="small"
              />
            </div>
          </div>
        ))}

        <div style={{ marginTop: spacing[4] }}>
          <TextField
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Add any notes about the delivery..."
          />
        </div>
      </DialogContent>
      <DialogActions style={{ padding: spacing[4] }}>
        <Button onClick={onClose} variant="ghost" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Receiving...' : 'Receive Goods'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceivePurchaseOrderDialog;
