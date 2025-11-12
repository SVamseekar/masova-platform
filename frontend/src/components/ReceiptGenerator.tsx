import { Box, Button, Dialog, DialogContent, DialogTitle, Typography, Divider, IconButton } from '@mui/material';
import { Print as PrintIcon, Close as CloseIcon, Download as DownloadIcon } from '@mui/icons-material';
import { CURRENCY } from '../config/business-config';
import { format } from 'date-fns';

interface ReceiptItem {
  itemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface ReceiptData {
  orderNumber: string;
  orderDate: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  tableNumber?: string;
  orderType: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Create a simple HTML receipt for download
    const receiptHTML = generateReceiptHTML();
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

  const generateReceiptHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - Order #${orderNumber}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
    }
    .store-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .info-section {
      margin: 15px 0;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .items {
      margin: 15px 0;
    }
    .item {
      margin: 10px 0;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }
    .item-details {
      font-size: 12px;
      color: #666;
      margin-left: 20px;
    }
    .totals {
      margin-top: 15px;
      border-top: 2px solid #000;
      padding-top: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .grand-total {
      font-size: 18px;
      font-weight: bold;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #000;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px dashed #000;
      font-size: 12px;
    }
    @media print {
      body { margin: 0; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    <div>${storeAddress}</div>
    <div>Phone: ${storePhone}</div>
  </div>

  <div class="info-section">
    <div><strong>Order #:</strong> ${orderNumber}</div>
    <div><strong>Date:</strong> ${format(new Date(orderDate), 'dd/MM/yyyy hh:mm a')}</div>
    <div><strong>Type:</strong> ${orderType.replace('_', ' ')}</div>
    ${tableNumber ? `<div><strong>Table:</strong> #${tableNumber}</div>` : ''}
  </div>

  ${customerName || customerPhone ? `
  <div class="info-section">
    ${customerName ? `<div><strong>Customer:</strong> ${customerName}</div>` : ''}
    ${customerPhone ? `<div><strong>Phone:</strong> ${customerPhone}</div>` : ''}
    ${deliveryAddress ? `<div><strong>Address:</strong> ${deliveryAddress}</div>` : ''}
  </div>
  ` : ''}

  <div class="items">
    <div style="font-weight: bold; margin-bottom: 10px;">ITEMS:</div>
    ${items.map(item => `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity} × ${item.itemName}</span>
          <span>${CURRENCY.format(item.quantity * item.price)}</span>
        </div>
        <div class="item-details">@ ${CURRENCY.format(item.price)} each</div>
        ${item.specialInstructions ? `<div class="item-details">Note: ${item.specialInstructions}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${CURRENCY.format(subtotal)}</span>
    </div>
    <div class="total-row">
      <span>Tax (5%):</span>
      <span>${CURRENCY.format(tax)}</span>
    </div>
    ${deliveryFee > 0 ? `
    <div class="total-row">
      <span>Delivery Fee:</span>
      <span>${CURRENCY.format(deliveryFee)}</span>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>${CURRENCY.format(total)}</span>
    </div>
  </div>

  <div class="info-section">
    <div><strong>Payment Method:</strong> ${paymentMethod}</div>
    <div><strong>Payment Status:</strong> ${paymentStatus}</div>
  </div>

  <div class="footer">
    <div>Thank you for your order!</div>
    <div>Please visit us again</div>
    <div style="margin-top: 10px;">Generated on ${format(new Date(), 'dd/MM/yyyy hh:mm a')}</div>
  </div>
</body>
</html>
    `;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            fullWidth
          >
            Print Receipt
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            fullWidth
          >
            Download
          </Button>
        </Box>

        {/* Receipt Preview */}
        <Box
          id="receipt-content"
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 3,
            fontFamily: 'monospace',
            '@media print': {
              border: 'none',
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
                    {CURRENCY.format(item.quantity * item.price)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  @ {CURRENCY.format(item.price)} each
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
              <Typography variant="body2">{CURRENCY.format(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Tax (5%):</Typography>
              <Typography variant="body2">{CURRENCY.format(tax)}</Typography>
            </Box>
            {deliveryFee > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Delivery Fee:</Typography>
                <Typography variant="body2">{CURRENCY.format(deliveryFee)}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">
                TOTAL:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {CURRENCY.format(total)}
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
