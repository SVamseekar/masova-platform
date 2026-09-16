import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import { useRecordWasteMutation, useGetAllInventoryItemsQuery, type WasteRecord } from '../../store/api/inventoryApi';
import {
  t, modalOverlayStyle, modalBoxStyle, fieldLabelStyle, textInputStyle,
  primaryBtnStyle, secondaryBtnStyle, selectStyle,
} from '../../pages/manager/manager-tokens';

interface RecordWasteDialogProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
}

const RecordWasteDialog: React.FC<RecordWasteDialogProps> = ({ open, onClose, storeId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const [recordWaste, { isLoading }] = useRecordWasteMutation();
  const { data: inventoryItems = [] } = useGetAllInventoryItemsQuery(storeId, { skip: !storeId || !open });
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<{
    inventoryItemId: string;
    quantity: string;
    wasteType: WasteRecord['wasteType'];
    isPreventable: boolean;
    reason: string;
    notes: string;
  }>({
    inventoryItemId: '',
    quantity: '',
    wasteType: 'EXPIRED',
    isPreventable: false,
    reason: '',
    notes: '',
  });

  if (!open) return null;

  const selectedItem = inventoryItems.find((item) => item.id === formData.inventoryItemId);
  const estimatedCost = selectedItem && formData.quantity
    ? parseFloat(formData.quantity) * (selectedItem.unitCost || 0)
    : 0;

  const handleSubmit = async () => {
    if (!formData.inventoryItemId || !formData.quantity) {
      setError('Select an item and quantity');
      return;
    }
    if (!selectedItem) return;
    setError('');
    try {
      await recordWaste({
        storeId,
        inventoryItemId: formData.inventoryItemId,
        itemName: selectedItem.itemName,
        quantity: parseFloat(formData.quantity),
        unit: selectedItem.unit,
        wasteCost: estimatedCost,
        wasteType: formData.wasteType,
        isPreventable: formData.isPreventable,
        recordedBy: currentUser?.id || 'unknown',
        recordedAt: new Date().toISOString(),
        status: 'PENDING',
        reason: formData.reason,
        notes: formData.notes,
        // Backend WasteRecord fields
        wasteCategory: formData.wasteType,
        totalCost: estimatedCost,
        preventable: formData.isPreventable,
        reportedBy: currentUser?.id || 'unknown',
        wasteDate: new Date().toISOString().slice(0, 10),
      }).unwrap();
      setFormData({
        inventoryItemId: '', quantity: '', wasteType: 'EXPIRED',
        isPreventable: false, reason: '', notes: '',
      });
      onClose();
    } catch {
      setError('Failed to record waste. Please try again.');
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose} role="presentation">
      <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="record-waste-title">
        <h3 id="record-waste-title" style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: t.black, fontFamily: t.font }}>
          Record waste
        </h3>

        <label style={fieldLabelStyle}>Inventory item *</label>
        <select
          value={formData.inventoryItemId}
          onChange={(e) => setFormData((p) => ({ ...p, inventoryItemId: e.target.value }))}
          style={{ ...selectStyle, width: '100%', padding: '10px 12px', marginBottom: 12, color: t.black }}
        >
          <option value="">Select item…</option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>{item.itemName} ({item.unit})</option>
          ))}
        </select>

        <label style={fieldLabelStyle}>Quantity *</label>
        <input type="number" min="0" step="0.01" value={formData.quantity}
          onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
          style={{ ...textInputStyle, marginBottom: 12 }} />

        <label style={fieldLabelStyle}>Waste type</label>
        <select
          value={formData.wasteType}
          onChange={(e) => setFormData((p) => ({ ...p, wasteType: e.target.value as WasteRecord['wasteType'] }))}
          style={{ ...selectStyle, width: '100%', padding: '10px 12px', marginBottom: 12, color: t.black }}
        >
          <option value="EXPIRED">Expired</option>
          <option value="SPOILED">Spoiled</option>
          <option value="DAMAGED">Damaged</option>
          <option value="OVERPRODUCTION">Overproduction</option>
          <option value="PREPARATION_ERROR">Preparation error</option>
          <option value="OTHER">Other</option>
        </select>

        <label style={fieldLabelStyle}>Reason</label>
        <input value={formData.reason} onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
          style={{ ...textInputStyle, marginBottom: 12 }} />

        <label style={{ ...fieldLabelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={formData.isPreventable}
            onChange={(e) => setFormData((p) => ({ ...p, isPreventable: e.target.checked }))} />
          Preventable
        </label>

        {estimatedCost > 0 && (
          <p style={{ fontSize: 13, color: t.gray, margin: '8px 0 12px' }}>
            Estimated cost: <strong style={{ color: t.red }}>{formatMajorAmount(estimatedCost, currency, locale)}</strong>
          </p>
        )}
        {error && <p style={{ color: t.red, fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" style={secondaryBtnStyle} onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" style={primaryBtnStyle} onClick={() => void handleSubmit()} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Record waste'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordWasteDialog;
