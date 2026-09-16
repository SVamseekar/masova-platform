import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useCreateInventoryItemMutation } from '../../store/api/inventoryApi';
import {
  t, modalOverlayStyle, modalBoxStyle, fieldLabelStyle, textInputStyle,
  primaryBtnStyle, secondaryBtnStyle, selectStyle, sectionTitleStyle,
} from '../../pages/manager/manager-tokens';

interface AddInventoryItemDialogProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
}

const emptyForm = {
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
};

const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({ open, onClose, storeId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [createItem, { isLoading }] = useCreateInventoryItemMutation();
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.itemName || !formData.itemCode) {
      setError('Item name and SKU are required');
      return;
    }
    setError('');
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
        shelfLifeDays: formData.shelfLifeDays ? parseInt(formData.shelfLifeDays, 10) : undefined,
        batchTracked: formData.batchTracked,
        status: 'AVAILABLE',
        autoReorder: formData.autoReorder,
        description: formData.description,
        storageLocation: formData.storageLocation,
        lastUpdatedBy: currentUser?.id || 'unknown',
      }).unwrap();
      setFormData(emptyForm);
      onClose();
    } catch {
      setError('Failed to create item. Please try again.');
    }
  };

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={modalOverlayStyle} onClick={onClose} role="presentation">
      <div style={{ ...modalBoxStyle, maxWidth: 640 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="add-item-title">
        <h3 id="add-item-title" style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: t.black, fontFamily: t.font }}>
          Add inventory item
        </h3>

        <p style={{ ...sectionTitleStyle, fontSize: 13, marginBottom: 10 }}>Basic information</p>
        {field('Item name *', (
          <input value={formData.itemName} onChange={(e) => handleChange('itemName', e.target.value)} style={textInputStyle} />
        ))}
        {field('Item code / SKU *', (
          <input value={formData.itemCode} onChange={(e) => handleChange('itemCode', e.target.value)} style={textInputStyle} />
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Category', (
            <select value={formData.category} onChange={(e) => handleChange('category', e.target.value)} style={{ ...selectStyle, width: '100%', padding: '10px 12px', color: t.black }}>
              <option value="RAW_MATERIAL">Raw material</option>
              <option value="INGREDIENT">Ingredient</option>
              <option value="PACKAGING">Packaging</option>
              <option value="BEVERAGE">Beverage</option>
              <option value="OTHER">Other</option>
            </select>
          ))}
          {field('Unit', (
            <select value={formData.unit} onChange={(e) => handleChange('unit', e.target.value)} style={{ ...selectStyle, width: '100%', padding: '10px 12px', color: t.black }}>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="liters">Liters</option>
              <option value="ml">Milliliters</option>
              <option value="pieces">Pieces</option>
              <option value="boxes">Boxes</option>
              <option value="packets">Packets</option>
              <option value="bottles">Bottles</option>
            </select>
          ))}
        </div>

        <p style={{ ...sectionTitleStyle, fontSize: 13, margin: '8px 0 10px' }}>Stock levels</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Current stock', <input type="number" value={formData.currentStock} onChange={(e) => handleChange('currentStock', e.target.value)} style={textInputStyle} />)}
          {field('Minimum stock', <input type="number" value={formData.minimumStock} onChange={(e) => handleChange('minimumStock', e.target.value)} style={textInputStyle} />)}
          {field('Maximum stock', <input type="number" value={formData.maximumStock} onChange={(e) => handleChange('maximumStock', e.target.value)} style={textInputStyle} />)}
          {field('Reorder quantity', <input type="number" value={formData.reorderQuantity} onChange={(e) => handleChange('reorderQuantity', e.target.value)} style={textInputStyle} />)}
        </div>

        <p style={{ ...sectionTitleStyle, fontSize: 13, margin: '8px 0 10px' }}>Pricing</p>
        {field('Unit cost', <input type="number" step="0.01" value={formData.unitCost} onChange={(e) => handleChange('unitCost', e.target.value)} style={textInputStyle} />)}

        <label style={{ ...fieldLabelStyle, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <input type="checkbox" checked={formData.isPerishable} onChange={(e) => handleChange('isPerishable', e.target.checked)} />
          Perishable item
        </label>

        {error && <p style={{ color: t.red, fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={secondaryBtnStyle} onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" style={primaryBtnStyle} onClick={() => void handleSubmit()} disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInventoryItemDialog;
