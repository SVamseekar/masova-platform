import { format } from 'date-fns';
import { escapeHTML } from './security';

export interface ReceiptItem {
  itemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface ReceiptData {
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

export function generateReceiptHTML(
  data: ReceiptData,
  fmt: (value: number) => string
): string {
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
  } = data;

  const esc = escapeHTML;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - Order #${esc(orderNumber)}</title>
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
    <div class="store-name">${esc(storeName)}</div>
    <div>${esc(storeAddress)}</div>
    <div>Phone: ${esc(storePhone)}</div>
  </div>

  <div class="info-section">
    <div><strong>Order #:</strong> ${esc(orderNumber)}</div>
    <div><strong>Date:</strong> ${esc(format(new Date(orderDate), 'dd/MM/yyyy hh:mm a'))}</div>
    <div><strong>Type:</strong> ${esc(orderType.replace('_', ' '))}</div>
    ${tableNumber ? `<div><strong>Table:</strong> #${esc(tableNumber)}</div>` : ''}
  </div>

  ${customerName || customerPhone ? `
  <div class="info-section">
    ${customerName ? `<div><strong>Customer:</strong> ${esc(customerName)}</div>` : ''}
    ${customerPhone ? `<div><strong>Phone:</strong> ${esc(customerPhone)}</div>` : ''}
    ${deliveryAddress ? `<div><strong>Address:</strong> ${esc(deliveryAddress)}</div>` : ''}
  </div>
  ` : ''}

  <div class="items">
    <div style="font-weight: bold; margin-bottom: 10px;">ITEMS:</div>
    ${items.map(item => `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity} × ${esc(item.itemName)}</span>
          <span>${fmt(item.quantity * item.price)}</span>
        </div>
        <div class="item-details">@ ${fmt(item.price)} each</div>
        ${item.specialInstructions ? `<div class="item-details">Note: ${esc(item.specialInstructions)}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${fmt(subtotal)}</span>
    </div>
    <div class="total-row">
      <span>Tax (5%):</span>
      <span>${fmt(tax)}</span>
    </div>
    ${deliveryFee > 0 ? `
    <div class="total-row">
      <span>Delivery Fee:</span>
      <span>${fmt(deliveryFee)}</span>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>${fmt(total)}</span>
    </div>
  </div>

  <div class="info-section">
    <div><strong>Payment Method:</strong> ${esc(paymentMethod)}</div>
    <div><strong>Payment Status:</strong> ${esc(paymentStatus)}</div>
  </div>

  <div class="footer">
    <div>Thank you for your order!</div>
    <div>Please visit us again</div>
    <div style="margin-top: 10px;">Generated on ${esc(format(new Date(), 'dd/MM/yyyy hh:mm a'))}</div>
  </div>
</body>
</html>
    `;
}