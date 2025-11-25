import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Button } from '../ui/neumorphic';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useCreatePurchaseOrderMutation, useGetAllSuppliersQuery, useGetLowStockItemsQuery } from '../../store/api/inventoryApi';
import { colors, spacing, typography } from '../../styles/design-tokens';

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
}

const CreatePurchaseOrderDialog: React.FC<CreatePurchaseOrderDialogProps> = ({ open, onClose, storeId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [createPO, { isLoading }] = useCreatePurchaseOrderMutation();
  const { data: suppliers = [] } = useGetAllSuppliersQuery();
  const { data: lowStockItems = [] } = useGetLowStockItemsQuery(storeId);

  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }

    // For simplicity, create PO with low stock items
    const items = lowStockItems.slice(0, 5).map((item) => ({
      itemId: item.id,
      itemName: item.itemName,
      itemCode: item.itemCode,
      unit: item.unit,
      orderedQuantity: item.reorderQuantity,
      receivedQuantity: 0,
      unitPrice: item.unitCost,
      totalPrice: item.reorderQuantity * item.unitCost,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    try {
      await createPO({
        supplierId,
        storeId,
        items,
        subtotal,
        tax: subtotal * 0.05,
        deliveryCharges: 0,
        discount: 0,
        totalAmount: subtotal * 1.05,
        status: 'DRAFT',
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: expectedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: currentUser?.id || 'unknown',
        notes,
      } as any).unwrap();

      setSupplierId('');
      setExpectedDeliveryDate('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to create PO:', error);
      alert('Failed to create purchase order. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ fontFamily: typography.fontFamily.primary, fontWeight: typography.fontWeight.bold }}>
        Create Purchase Order
      </DialogTitle>
      <DialogContent style={{ fontFamily: typography.fontFamily.primary, padding: spacing[6] }}>
        <div style={{ marginBottom: spacing[4] }}>
          <TextField
            select
            label="Supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            fullWidth
            variant="outlined"
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.supplierName} ({supplier.supplierCode})
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div style={{ marginBottom: spacing[4] }}>
          <TextField
            label="Expected Delivery Date"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
        </div>
        <div style={{ marginBottom: spacing[4] }}>
          <TextField
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
          This will create a draft PO with low stock items. You can edit items before approval.
        </div>
      </DialogContent>
      <DialogActions style={{ padding: spacing[4] }}>
        <Button onClick={onClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Draft PO'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePurchaseOrderDialog;
