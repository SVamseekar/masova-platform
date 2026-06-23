import { Box, Button, Dialog, DialogContent, DialogTitle, Typography, Divider, IconButton } from '@mui/material';
import { Print as PrintIcon, Close as CloseIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useAppSelector } from '../store/hooks';
import { selectCartCurrency, selectCartLocale } from '../store/slices/cartSlice';
import { formatMoney } from '../utils/currency';
import { format } from 'date-fns';
import { createCard, createButtonVariant } from '../styles/neumorphic-utils';
import { colors } from '../styles/design-tokens';
import { generateReceiptHTML, type ReceiptData } from '../utils/receiptHtml';

interface ReceiptGeneratorProps {
  open: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
}

export default function ReceiptGenerator({ open, onClose, receiptData }: ReceiptGeneratorProps) {
  const {
    orderNumber,
    orderDate,
    items,
    subtotal,
    tax,
    deliveryFee,
    total,
    paymentMethod,
    paymentStatus,
    customerName,
    customerPhone,
    deliveryAddress,
    tableNumber,
    orderType,
    storeName = 'MaSoVa Restaurant',
    storeAddress = 'Bangalore, Karnataka, India',
    storePhone = '+91 99999 99999',
  } = receiptData;
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const fmt = (v: number) => formatMoney(Math.round(v * 100), currency, locale);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const receiptHTML = generateReceiptHTML(receiptData, fmt);
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${orderNumber}_${format(new Date(), 'yyyyMMdd_HHmmss')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          ...createCard('lg', 'xl'),
          backgroundColor: colors.surface.background,
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Receipt - Order #{orderNumber}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            fullWidth
            sx={createButtonVariant('primary', 'base')}
          >
            Print Receipt
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            fullWidth
            sx={createButtonVariant('ghost', 'base')}
          >
            Download
          </Button>
        </Box>

        {/* Receipt Preview */}
        <Box
          id="receipt-content"
          sx={{
            ...createCard('base', 'lg'),
            fontFamily: 'monospace',
            '@media print': {
              border: 'none',
              boxShadow: 'none',
              p: 0,
            },
          }}
        >
          {/* Store Header */}
          <Box sx={{ textAlign: 'center', mb: 2, pb: 2, borderBottom: '2px dashed #000' }}>
            <Typography variant="h5" fontWeight="bold">
              {storeName}
            </Typography>
            <Typography variant="body2">{storeAddress}</Typography>
            <Typography variant="body2">Phone: {storePhone}</Typography>
          </Box>

          {/* Order Info */}
          <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2">
              <strong>Order #:</strong> {orderNumber}
            </Typography>
            <Typography variant="body2">
              <strong>Date:</strong> {format(new Date(orderDate), 'dd/MM/yyyy hh:mm a')}
            </Typography>
            <Typography variant="body2">
              <strong>Type:</strong> {orderType.replace('_', ' ')}
            </Typography>
            {tableNumber && (
              <Typography variant="body2">
                <strong>Table:</strong> #{tableNumber}
              </Typography>
            )}
          </Box>

          {/* Customer Info */}
          {(customerName || customerPhone) && (
            <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
              {customerName && (
                <Typography variant="body2">
                  <strong>Customer:</strong> {customerName}
                </Typography>
              )}
              {customerPhone && (
                <Typography variant="body2">
                  <strong>Phone:</strong> {customerPhone}
                </Typography>
              )}
              {deliveryAddress && (
                <Typography variant="body2">
                  <strong>Address:</strong> {deliveryAddress}
                </Typography>
              )}
            </Box>
          )}

          {/* Items */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              ITEMS:
            </Typography>
            {items.map((item, index) => (
              <Box key={index} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {item.quantity} × {item.itemName}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {fmt(item.quantity * item.price)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  @ {fmt(item.price)} each
                </Typography>
                {item.specialInstructions && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'block' }}>
                    Note: {item.specialInstructions}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          {/* Totals */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">{fmt(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Tax (5%):</Typography>
              <Typography variant="body2">{fmt(tax)}</Typography>
            </Box>
            {deliveryFee > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Delivery Fee:</Typography>
                <Typography variant="body2">{fmt(deliveryFee)}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">
                TOTAL:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {fmt(total)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Info */}
          <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2">
              <strong>Payment Method:</strong> {paymentMethod}
            </Typography>
            <Typography variant="body2">
              <strong>Payment Status:</strong> {paymentStatus}
            </Typography>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '2px dashed #000' }}>
            <Typography variant="body2">Thank you for your order!</Typography>
            <Typography variant="body2">Please visit us again</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Generated on {format(new Date(), 'dd/MM/yyyy hh:mm a')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
