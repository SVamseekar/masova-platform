import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { Button } from '../ui/neumorphic';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useCreateInventoryItemMutation } from '../../store/api/inventoryApi';
import { colors, spacing, typography } from '../../styles/design-tokens';

interface AddInventoryItemDialogProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
}

const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({ open, onClose, storeId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [createItem, { isLoading }] = useCreateInventoryItemMutation();

  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: '',
    category: 'RAW_MATERIAL',
    unit: 'kg',
    currentStock: '0',
    minimumStock: '0',
    maximumStock: '0',
    reorderQuantity: '0',
    unitCost: '0',
    isPerishable: false,
    shelfLifeDays: '',
    batchTracked: false,
    autoReorder: true,
    description: '',
    storageLocation: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.itemName || !formData.itemCode) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createItem({
        storeId,
        itemName: formData.itemName,
        itemCode: formData.itemCode,
        category: formData.category,
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock),
        reservedStock: 0,
        minimumStock: parseFloat(formData.minimumStock),
        maximumStock: parseFloat(formData.maximumStock),
        reorderQuantity: parseFloat(formData.reorderQuantity),
        unitCost: parseFloat(formData.unitCost),
        averageCost: parseFloat(formData.unitCost),
        lastPurchaseCost: parseFloat(formData.unitCost),
        primarySupplierId: '',
        alternativeSupplierIds: [],
        isPerishable: formData.isPerishable,
        shelfLifeDays: formData.shelfLifeDays ? parseInt(formData.shelfLifeDays) : undefined,
        batchTracked: formData.batchTracked,
        status: 'AVAILABLE',
        autoReorder: formData.autoReorder,
        description: formData.description,
        storageLocation: formData.storageLocation,
        lastUpdatedBy: currentUser?.id || 'unknown',
      } as any).unwrap();

      // Reset form
      setFormData({
        itemName: '',
        itemCode: '',
        category: 'RAW_MATERIAL',
        unit: 'kg',
        currentStock: '0',
        minimumStock: '0',
        maximumStock: '0',
        reorderQuantity: '0',
        unitCost: '0',
        isPerishable: false,
        shelfLifeDays: '',
        batchTracked: false,
        autoReorder: true,
        description: '',
        storageLocation: '',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Failed to create item. Please try again.');
    }
  };

  const dialogContentStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
  };

  const fieldStyles: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing[4],
    marginBottom: spacing[3],
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle style={{ fontFamily: typography.fontFamily.primary, fontWeight: typography.fontWeight.bold }}>
        Add New Inventory Item
      </DialogTitle>
      <DialogContent style={dialogContentStyles}>
        {/* Basic Information */}
        <div style={sectionTitleStyles}>Basic Information</div>
        <div style={fieldStyles}>
          <TextField
            label="Item Name *"
            value={formData.itemName}
            onChange={(e) => handleChange('itemName', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={fieldStyles}>
          <TextField
            label="Item Code / SKU *"
            value={formData.itemCode}
            onChange={(e) => handleChange('itemCode', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="RAW_MATERIAL">Raw Material</MenuItem>
            <MenuItem value="INGREDIENT">Ingredient</MenuItem>
            <MenuItem value="PACKAGING">Packaging</MenuItem>
            <MenuItem value="BEVERAGE">Beverage</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </TextField>
          <TextField
            select
            label="Unit"
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="kg">Kilograms (kg)</MenuItem>
            <MenuItem value="g">Grams (g)</MenuItem>
            <MenuItem value="liters">Liters</MenuItem>
            <MenuItem value="ml">Milliliters (ml)</MenuItem>
            <MenuItem value="pieces">Pieces</MenuItem>
            <MenuItem value="boxes">Boxes</MenuItem>
            <MenuItem value="packets">Packets</MenuItem>
            <MenuItem value="bottles">Bottles</MenuItem>
          </TextField>
        </div>

        {/* Stock Levels */}
        <div style={sectionTitleStyles}>Stock Levels</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            label="Current Stock"
            type="number"
            value={formData.currentStock}
            onChange={(e) => handleChange('currentStock', e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Minimum Stock"
            type="number"
            value={formData.minimumStock}
            onChange={(e) => handleChange('minimumStock', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            label="Maximum Stock"
            type="number"
            value={formData.maximumStock}
            onChange={(e) => handleChange('maximumStock', e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Reorder Quantity"
            type="number"
            value={formData.reorderQuantity}
            onChange={(e) => handleChange('reorderQuantity', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>

        {/* Pricing */}
        <div style={sectionTitleStyles}>Pricing</div>
        <div style={fieldStyles}>
          <TextField
            label="Unit Cost (INR)"
            type="number"
            value={formData.unitCost}
            onChange={(e) => handleChange('unitCost', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>

        {/* Additional Options */}
        <div style={sectionTitleStyles}>Additional Options</div>
        <div style={fieldStyles}>
          <FormControlLabel
            control={
              <Checkbox checked={formData.isPerishable} onChange={(e) => handleChange('isPerishable', e.target.checked)} />
            }
            label="Perishable Item"
          />
          {formData.isPerishable && (
            <TextField
              label="Shelf Life (Days)"
              type="number"
              value={formData.shelfLifeDays}
              onChange={(e) => handleChange('shelfLifeDays', e.target.value)}
              fullWidth
              variant="outlined"
              style={{ marginTop: spacing[2] }}
            />
          )}
        </div>
        <div style={fieldStyles}>
          <FormControlLabel
            control={
              <Checkbox checked={formData.batchTracked} onChange={(e) => handleChange('batchTracked', e.target.checked)} />
            }
            label="Enable Batch Tracking"
          />
        </div>
        <div style={fieldStyles}>
          <FormControlLabel
            control={
              <Checkbox checked={formData.autoReorder} onChange={(e) => handleChange('autoReorder', e.target.checked)} />
            }
            label="Enable Auto Reorder"
          />
        </div>

        {/* Notes */}
        <div style={fieldStyles}>
          <TextField
            label="Description"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={fieldStyles}>
          <TextField
            label="Storage Location"
            value={formData.storageLocation}
            onChange={(e) => handleChange('storageLocation', e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="e.g., Warehouse A, Shelf 3"
          />
        </div>
      </DialogContent>
      <DialogActions style={{ padding: spacing[4] }}>
        <Button onClick={onClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddInventoryItemDialog;
