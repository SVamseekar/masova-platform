import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Button } from '../ui/neumorphic';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAdjustStockMutation, InventoryItem } from '../../store/api/inventoryApi';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem;
}

const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({ open, onClose, item }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [adjustStock, { isLoading }] = useAdjustStockMutation();

  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('STOCK_IN');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) === 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      await adjustStock({
        id: item.id,
        adjustment: {
          quantity: parseFloat(quantity),
          reason,
          adjustedBy: currentUser?.id || 'unknown',
          notes,
        },
      }).unwrap();

      // Reset form
      setQuantity('');
      setReason('STOCK_IN');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      alert('Failed to adjust stock. Please try again.');
    }
  };

  const dialogContentStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
  };

  const fieldStyles: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  const infoBoxStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.surface.secondary,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  };

  const valueStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ fontFamily: typography.fontFamily.primary, fontWeight: typography.fontWeight.bold }}>
        Adjust Stock - {item.itemName}
      </DialogTitle>
      <DialogContent style={dialogContentStyles}>
        {/* Current Stock Info */}
        <div style={infoBoxStyles}>
          <div style={labelStyles}>Current Stock</div>
          <div style={valueStyles}>
            {item.currentStock} {item.unit}
          </div>
          <div style={{ ...labelStyles, marginTop: spacing[2] }}>Available Stock</div>
          <div style={valueStyles}>
            {(item.currentStock - item.reservedStock).toFixed(2)} {item.unit}
          </div>
        </div>

        {/* Adjustment Type */}
        <div style={fieldStyles}>
          <TextField
            select
            label="Adjustment Type"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="STOCK_IN">Stock In (Add)</MenuItem>
            <MenuItem value="STOCK_OUT">Stock Out (Remove)</MenuItem>
            <MenuItem value="CORRECTION">Correction</MenuItem>
            <MenuItem value="DAMAGED">Damaged</MenuItem>
            <MenuItem value="EXPIRED">Expired</MenuItem>
            <MenuItem value="TRANSFER">Transfer</MenuItem>
          </TextField>
        </div>

        {/* Quantity */}
        <div style={fieldStyles}>
          <TextField
            label={`Quantity (${item.unit})`}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
            variant="outlined"
            helperText={
              reason === 'STOCK_OUT' || reason === 'DAMAGED' || reason === 'EXPIRED'
                ? 'Enter positive number to remove from stock'
                : 'Enter positive number to add to stock'
            }
          />
        </div>

        {/* Notes */}
        <div style={fieldStyles}>
          <TextField
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Add any additional notes about this adjustment..."
          />
        </div>

        {/* Preview */}
        {quantity && parseFloat(quantity) > 0 && (
          <div style={{ ...infoBoxStyles, backgroundColor: colors.semantic.infoLight + '20' }}>
            <div style={labelStyles}>New Stock After Adjustment</div>
            <div style={valueStyles}>
              {reason === 'STOCK_OUT' || reason === 'DAMAGED' || reason === 'EXPIRED'
                ? (item.currentStock - parseFloat(quantity)).toFixed(2)
                : (item.currentStock + parseFloat(quantity)).toFixed(2)}{' '}
              {item.unit}
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions style={{ padding: spacing[4] }}>
        <Button onClick={onClose} variant="ghost" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || !quantity}>
          {isLoading ? 'Adjusting...' : 'Adjust Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
