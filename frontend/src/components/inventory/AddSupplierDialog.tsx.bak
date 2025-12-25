import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Button } from '../ui/neumorphic';
import { useCreateSupplierMutation } from '../../store/api/inventoryApi';
import { colors, spacing, typography } from '../../styles/design-tokens';

interface AddSupplierDialogProps {
  open: boolean;
  onClose: () => void;
}

const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({ open, onClose }) => {
  const [createSupplier, { isLoading }] = useCreateSupplierMutation();

  const [formData, setFormData] = useState({
    supplierName: '',
    supplierCode: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    paymentTerms: 'NET_30',
    leadTimeDays: '7',
    minimumOrderValue: '0',
    deliveryCharges: '0',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.supplierName || !formData.supplierCode || !formData.contactPerson) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createSupplier({
        ...formData,
        leadTimeDays: parseInt(formData.leadTimeDays),
        minimumOrderValue: parseFloat(formData.minimumOrderValue),
        deliveryCharges: parseFloat(formData.deliveryCharges),
        categoriesSupplied: [],
        status: 'ACTIVE',
        isPreferred: false,
        reliability: 'MEDIUM',
        qualityRating: 3,
        deliveryRating: 3,
        totalOrders: 0,
        onTimeDeliveries: 0,
      } as any).unwrap();

      setFormData({
        supplierName: '',
        supplierCode: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
        paymentTerms: 'NET_30',
        leadTimeDays: '7',
        minimumOrderValue: '0',
        deliveryCharges: '0',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create supplier:', error);
      alert('Failed to create supplier. Please try again.');
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
        Add New Supplier
      </DialogTitle>
      <DialogContent style={dialogContentStyles}>
        <div style={sectionTitleStyles}>Basic Information</div>
        <div style={fieldStyles}>
          <TextField
            label="Supplier Name *"
            value={formData.supplierName}
            onChange={(e) => handleChange('supplierName', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            label="Supplier Code *"
            value={formData.supplierCode}
            onChange={(e) => handleChange('supplierCode', e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Contact Person *"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
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

        <div style={sectionTitleStyles}>Address</div>
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

        <div style={sectionTitleStyles}>Business Terms</div>
        <div style={fieldStyles}>
          <TextField
            label="GSTIN (Optional)"
            value={formData.gstin}
            onChange={(e) => handleChange('gstin', e.target.value)}
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
          {isLoading ? 'Creating...' : 'Create Supplier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSupplierDialog;
