import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAdjustStockMutation, InventoryItem } from '../../store/api/inventoryApi';
import {
  t, modalOverlayStyle, modalBoxStyle, fieldLabelStyle, textInputStyle,
  primaryBtnStyle, secondaryBtnStyle, selectStyle,
} from '../../pages/manager/manager-tokens';

interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem;
}

const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({ open, onClose, item }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [adjustStock, { isLoading }] = useAdjustStockMutation();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('STOCK_IN');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const qty = parseFloat(quantity) || 0;
  const removing = reason === 'STOCK_OUT' || reason === 'DAMAGED' || reason === 'EXPIRED';
  const nextStock = removing ? item.currentStock - qty : item.currentStock + qty;
  const available = item.currentStock - (item.reservedStock || 0);

  const handleSubmit = async () => {
    if (!quantity || qty === 0) {
      setError('Enter a valid quantity');
      return;
    }
    setError('');
    try {
      await adjustStock({
        id: item.id,
        adjustment: {
          quantity: qty,
          reason,
          adjustedBy: currentUser?.id || 'unknown',
          notes,
        },
      }).unwrap();
      setQuantity('');
      setReason('STOCK_IN');
      setNotes('');
      onClose();
    } catch {
      setError('Failed to adjust stock. Please try again.');
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose} role="presentation">
      <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="adjust-stock-title">
        <h3 id="adjust-stock-title" style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: t.black, fontFamily: t.font }}>
          Adjust stock
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: t.gray }}>{item.itemName}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, background: t.bgMain, borderRadius: 10, padding: 14 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: t.gray }}>On hand</p>
            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: t.black }}>{item.currentStock} {item.unit}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: t.gray }}>Available</p>
            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: t.black }}>{available.toFixed(2)} {item.unit}</p>
          </div>
        </div>

        <label style={fieldLabelStyle}>Adjustment type</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...selectStyle, width: '100%', padding: '10px 12px', marginBottom: 14, color: t.black }}>
          <option value="STOCK_IN">Stock in (add)</option>
          <option value="STOCK_OUT">Stock out (remove)</option>
          <option value="CORRECTION">Correction</option>
          <option value="DAMAGED">Damaged</option>
          <option value="EXPIRED">Expired</option>
          <option value="TRANSFER">Transfer</option>
        </select>

        <label style={fieldLabelStyle}>Quantity ({item.unit})</label>
        <input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)}
          style={{ ...textInputStyle, marginBottom: 14 }} placeholder="0" />

        <label style={fieldLabelStyle}>Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          style={{ ...textInputStyle, resize: 'vertical', marginBottom: 14 }} placeholder="Reason for this adjustment" />

        {qty > 0 && (
          <p style={{ fontSize: 13, color: t.gray, margin: '0 0 12px' }}>
            New on-hand: <strong style={{ color: t.black }}>{nextStock.toFixed(2)} {item.unit}</strong>
          </p>
        )}
        {error && <p style={{ color: t.red, fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={secondaryBtnStyle} onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" style={primaryBtnStyle} onClick={() => void handleSubmit()} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Adjust stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentDialog;
