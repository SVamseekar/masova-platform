import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Button } from '../ui/neumorphic';
import { useUpdateSupplierMutation, Supplier } from '../../store/api/inventoryApi';
import { colors, spacing, typography } from '../../styles/design-tokens';

interface EditSupplierDialogProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier;
}

const EditSupplierDialog: React.FC<EditSupplierDialogProps> = ({ open, onClose, supplier }) => {
  const [updateSupplier, { isLoading }] = useUpdateSupplierMutation();

  const [formData, setFormData] = useState({
    supplierName: supplier.supplierName,
    contactPerson: supplier.contactPerson,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    city: supplier.city,
    state: supplier.state,
    pincode: supplier.pincode,
    paymentTerms: supplier.paymentTerms,
    leadTimeDays: supplier.leadTimeDays.toString(),
    minimumOrderValue: supplier.minimumOrderValue.toString(),
    deliveryCharges: supplier.deliveryCharges.toString(),
  });

  useEffect(() => {
    setFormData({
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      paymentTerms: supplier.paymentTerms,
      leadTimeDays: supplier.leadTimeDays.toString(),
      minimumOrderValue: supplier.minimumOrderValue.toString(),
      deliveryCharges: supplier.deliveryCharges.toString(),
    });
  }, [supplier]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await updateSupplier({
        id: supplier.id,
        supplier: {
          supplierName: formData.supplierName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          paymentTerms: formData.paymentTerms,
          leadTimeDays: parseInt(formData.leadTimeDays),
          minimumOrderValue: parseFloat(formData.minimumOrderValue),
          deliveryCharges: parseFloat(formData.deliveryCharges),
        },
      }).unwrap();

      onClose();
    } catch (error) {
      console.error('Failed to update supplier:', error);
      alert('Failed to update supplier. Please try again.');
    }
  };

  const dialogContentStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
  };

  const fieldStyles: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle style={{ fontFamily: typography.fontFamily.primary, fontWeight: typography.fontWeight.bold }}>
        Edit Supplier - {supplier.supplierCode}
      </DialogTitle>
      <DialogContent style={dialogContentStyles}>
        <div style={fieldStyles}>
          <TextField
            label="Supplier Name"
            value={formData.supplierName}
            onChange={(e) => handleChange('supplierName', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={fieldStyles}>
          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={fieldStyles}>
          <TextField
            label="Address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            label="City"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="State"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => handleChange('pincode', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            select
            label="Payment Terms"
            value={formData.paymentTerms}
            onChange={(e) => handleChange('paymentTerms', e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="COD">Cash on Delivery</MenuItem>
            <MenuItem value="NET_30">Net 30 Days</MenuItem>
            <MenuItem value="NET_60">Net 60 Days</MenuItem>
            <MenuItem value="ADVANCE">Advance Payment</MenuItem>
          </TextField>
          <TextField
            label="Lead Time (Days)"
            type="number"
            value={formData.leadTimeDays}
            onChange={(e) => handleChange('leadTimeDays', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            label="Minimum Order Value (INR)"
            type="number"
            value={formData.minimumOrderValue}
            onChange={(e) => handleChange('minimumOrderValue', e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Delivery Charges (INR)"
            type="number"
            value={formData.deliveryCharges}
            onChange={(e) => handleChange('deliveryCharges', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
      </DialogContent>
      <DialogActions style={{ padding: spacing[4] }}>
        <Button onClick={onClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Supplier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSupplierDialog;
