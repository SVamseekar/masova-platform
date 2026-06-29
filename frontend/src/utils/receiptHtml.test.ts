import { describe, it, expect } from 'vitest';
import { generateReceiptHTML, type ReceiptData } from './receiptHtml';

const baseReceipt: ReceiptData = {
  orderNumber: 'ORD-001',
  orderDate: '2026-06-22T12:00:00.000Z',
  items: [
    {
      itemName: 'Butter Chicken',
      quantity: 1,
      price: 12.5,
      specialInstructions: 'Extra spicy',
    },
  ],
  subtotal: 12.5,
  tax: 0.63,
  deliveryFee: 2,
  total: 15.13,
  paymentMethod: 'CARD',
  paymentStatus: 'PAID',
  orderType: 'DELIVERY',
};

const fmt = (value: number) => `₹${value.toFixed(2)}`;

describe('generateReceiptHTML', () => {
  it('escapes script tags in customer-supplied fields', () => {
    const maliciousName = '<script>alert(1)</script>';
    const html = generateReceiptHTML(
      {
        ...baseReceipt,
        customerName: maliciousName,
        customerPhone: '+91 99999 99999',
      },
      fmt
    );

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('escapes event-handler attributes in delivery address', () => {
    const maliciousAddress = '" onerror="alert(1)';
    const html = generateReceiptHTML(
      {
        ...baseReceipt,
        customerName: 'Test User',
        deliveryAddress: maliciousAddress,
      },
      fmt
    );

    expect(html).not.toContain('" onerror="alert(1)');
    expect(html).toContain('&quot; onerror=&quot;alert(1)');
  });

  it('escapes special instructions in item notes', () => {
    const maliciousNote = '<img src=x onerror=alert(1)>';
    const html = generateReceiptHTML(
      {
        ...baseReceipt,
        items: [
          {
            itemName: 'Naan',
            quantity: 2,
            price: 3,
            specialInstructions: maliciousNote,
          },
        ],
      },
      fmt
    );

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});