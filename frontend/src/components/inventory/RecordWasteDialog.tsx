import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { Button } from '../ui/neumorphic';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useRecordWasteMutation, useGetAllInventoryItemsQuery } from '../../store/api/inventoryApi';
import { colors, spacing, typography } from '../../styles/design-tokens';

interface RecordWasteDialogProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
}

const RecordWasteDialog: React.FC<RecordWasteDialogProps> = ({ open, onClose, storeId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [recordWaste, { isLoading }] = useRecordWasteMutation();
  const { data: inventoryItems = [] } = useGetAllInventoryItemsQuery(undefined);

  const [formData, setFormData] = useState({
    inventoryItemId: '',
    quantity: '',
    wasteType: 'EXPIRED',
    isPreventable: false,
    reason: '',
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.inventoryItemId || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedItem = inventoryItems.find((item) => item.id === formData.inventoryItemId);
    if (!selectedItem) return;

    try {
      await recordWaste({
        storeId,
        inventoryItemId: formData.inventoryItemId,
        itemName: selectedItem.itemName,
        quantity: parseFloat(formData.quantity),
        unit: selectedItem.unit,
        wasteCost: parseFloat(formData.quantity) * selectedItem.unitCost,
        wasteType: formData.wasteType,
        isPreventable: formData.isPreventable,
        recordedBy: currentUser?.id || 'unknown',
        recordedAt: new Date().toISOString(),
        status: 'PENDING',
        reason: formData.reason,
        notes: formData.notes,
      } as any).unwrap();

      setFormData({
        inventoryItemId: '',
        quantity: '',
        wasteType: 'EXPIRED',
        isPreventable: false,
        reason: '',
        notes: '',
      });
      onClose();
    } catch (error) {
      console.error('Failed to record waste:', error);
      alert('Failed to record waste. Please try again.');
    }
  };

  const selectedItem = inventoryItems.find((item) => item.id === formData.inventoryItemId);
  const estimatedCost = selectedItem && formData.quantity
    ? (parseFloat(formData.quantity) * selectedItem.unitCost).toFixed(2)
    : '0.00';

  const dialogContentStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
  };

  const fieldStyles: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ fontFamily: typography.fontFamily.primary, fontWeight: typography.fontWeight.bold }}>
        Record Waste
      </DialogTitle>
      <DialogContent style={dialogContentStyles}>
        <div style={fieldStyles}>
          <TextField
            select
            label="Inventory Item *"
            value={formData.inventoryItemId}
            onChange={(e) => handleChange('inventoryItemId', e.target.value)}
            fullWidth
            variant="outlined"
          >
            {inventoryItems.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.itemName} ({item.unit})
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div style={fieldStyles}>
          <TextField
            label={`Quantity ${selectedItem ? `(${selectedItem.unit})` : ''} *`}
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={fieldStyles}>
          <TextField
            select
            label="Waste Type *"
            value={formData.wasteType}
            onChange={(e) => handleChange('wasteType', e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="EXPIRED">Expired</MenuItem>
            <MenuItem value="SPOILED">Spoiled</MenuItem>
            <MenuItem value="DAMAGED">Damaged</MenuItem>
            <MenuItem value="OVERPRODUCTION">Overproduction</MenuItem>
            <MenuItem value="PREPARATION_ERROR">Preparation Error</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </TextField>
        </div>
        <div style={fieldStyles}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isPreventable}
                onChange={(e) => handleChange('isPreventable', e.target.checked)}
              />
            }
            label="This waste was preventable"
          />
        </div>
        <div style={fieldStyles}>
          <TextField
            label="Reason"
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Brief reason for the waste..."
          />
        </div>
        <div style={fieldStyles}>
          <TextField
            label="Additional Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Any additional details..."
          />
        </div>
        {selectedItem && formData.quantity && (
          <div
            style={{
              padding: spacing[3],
              backgroundColor: colors.semantic.warningLight + '20',
              borderRadius: '8px',
              fontSize: typography.fontSize.sm,
            }}
          >
            <strong>Estimated Waste Cost:</strong> ₹{estimatedCost}
          </div>
        )}
      </DialogContent>
      <DialogActions style={{ padding: spacing[4] }}>
        <Button onClick={onClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Waste'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordWasteDialog;
