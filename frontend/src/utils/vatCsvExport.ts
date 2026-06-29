import type { Order } from '../store/api/orderApi';
import { exportToCSV } from './filterUtils';

export interface VatExportRow {
  orderNumber: string;
  orderDate: string;
  vatCountryCode: string;
  orderContext: string;
  itemName: string;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  orderTotalVat: number;
}

export function buildVatExportRows(orders: Order[]): VatExportRow[] {
  return orders.flatMap((order) => {
    const breakdown = order.vatBreakdown;
    if (!breakdown?.lines?.length) {
      return [];
    }

    const countryCode = order.vatCountryCode ?? breakdown.vatCountryCode ?? '';
    const orderTotalVat = order.totalVatAmount ?? breakdown.totalVatAmount ?? 0;

    return breakdown.lines.map((line) => ({
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      vatCountryCode: countryCode,
      orderContext: breakdown.orderContext,
      itemName: line.itemName,
      vatRate: line.vatRate,
      netAmount: line.netAmount,
      vatAmount: line.vatAmount,
      grossAmount: line.grossAmount,
      orderTotalVat,
    }));
  });
}

export function exportVatCsv(orders: Order[], filename = 'vat_report'): void {
  const rows = buildVatExportRows(orders);
  exportToCSV(rows, filename, [
    { label: 'Order Number', field: 'orderNumber' },
    { label: 'Order Date', field: 'orderDate' },
    { label: 'VAT Country', field: 'vatCountryCode' },
    { label: 'Order Context', field: 'orderContext' },
    { label: 'Item Name', field: 'itemName' },
    { label: 'VAT Rate %', field: 'vatRate' },
    { label: 'Net Amount', field: 'netAmount' },
    { label: 'VAT Amount', field: 'vatAmount' },
    { label: 'Gross Amount', field: 'grossAmount' },
    { label: 'Order Total VAT', field: 'orderTotalVat' },
  ]);
}