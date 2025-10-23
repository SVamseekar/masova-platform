import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  IconButton,
  Box
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import MessageIcon from '@mui/icons-material/Message';
import CloseIcon from '@mui/icons-material/Close';

interface CustomerContactProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
}

const CustomerContact: React.FC<CustomerContactProps> = ({
  open,
  onClose,
  customerName,
  customerPhone,
  orderNumber
}) => {
  const handleCall = () => {
    window.location.href = `tel:${customerPhone}`;
  };

  const handleSMS = () => {
    const message = encodeURIComponent(
      `Hi ${customerName}, this is your MaSoVa delivery driver. I'm on my way with your order #${orderNumber}.`
    );
    window.location.href = `sms:${customerPhone}?body=${message}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            Contact Customer
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {customerName}
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {customerPhone}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Order #{orderNumber}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PhoneIcon />}
            onClick={handleCall}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Call Customer
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<MessageIcon />}
            onClick={handleSMS}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Send SMS
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          Use these options to update the customer about delivery status
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerContact;
