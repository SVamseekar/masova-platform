import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockInventoryItem = {
  id: 'inv-1',
  storeId: '1',
  itemName: 'Tomatoes',
  itemCode: 'RAW-001',
  category: 'RAW_MATERIAL',
  unit: 'kg',
  currentStock: 50,
  reservedStock: 5,
  minimumStock: 10,
  maximumStock: 100,
  reorderQuantity: 30,
  unitCost: 40,
  averageCost: 38,
  lastPurchaseCost: 42,
  primarySupplierId: 'sup-1',
  alternativeSupplierIds: ['sup-2'],
  isPerishable: true,
  expiryDate: '2025-02-01T00:00:00Z',
  shelfLifeDays: 7,
  batchTracked: false,
  status: 'AVAILABLE',
  autoReorder: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
};

const mockLowStockItem = {
  ...mockInventoryItem,
  id: 'inv-2',
  itemName: 'Cheese',
  itemCode: 'RAW-002',
  currentStock: 3,
  status: 'LOW_STOCK',
};

export const inventoryHandlers = [
  http.post(apiUrl('/inventory'), () => HttpResponse.json(mockInventoryItem)),
  http.get(apiUrl('/inventory/value'), () =>
    HttpResponse.json({
      totalValue: 125000,
      totalItems: 45,
      categoryBreakdown: { RAW_MATERIAL: 80000, INGREDIENT: 30000, PACKAGING: 15000 },
    }),
  ),
  http.get(apiUrl('/inventory'), () => HttpResponse.json([mockInventoryItem, mockLowStockItem])),
  http.get(apiUrl('/inventory/:id'), ({ params }) => {
    if (params.id === 'value') {
      return HttpResponse.json({
        totalValue: 125000,
        totalItems: 45,
        categoryBreakdown: { RAW_MATERIAL: 80000, INGREDIENT: 30000, PACKAGING: 15000 },
      });
    }
    return HttpResponse.json(mockInventoryItem);
  }),
  http.patch(apiUrl('/inventory/:id'), () => HttpResponse.json(mockInventoryItem)),
  http.post(apiUrl('/inventory/:id/stock'), () => HttpResponse.json(mockInventoryItem)),
  http.delete(apiUrl('/inventory/:id'), () => new HttpResponse(null, { status: 204 })),

  http.post(apiUrl('/suppliers'), () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),
  http.get(apiUrl('/suppliers'), () =>
    HttpResponse.json([
      { id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE', qualityRating: 4.5 },
      { id: 'sup-2', supplierName: 'Veggie World', status: 'ACTIVE', qualityRating: 4.2 },
    ]),
  ),
  http.get(apiUrl('/suppliers/:id'), () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),
  http.patch(apiUrl('/suppliers/:id'), () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),

  http.get(apiUrl('/purchase-orders'), () =>
    HttpResponse.json([{ id: 'po-1', orderNumber: 'PO-001', status: 'PENDING_APPROVAL', totalAmount: 15000 }]),
  ),
  http.post(apiUrl('/purchase-orders'), () =>
    HttpResponse.json({ id: 'po-1', orderNumber: 'PO-001', status: 'DRAFT' }),
  ),
  http.get(apiUrl('/purchase-orders/:id'), () =>
    HttpResponse.json({ id: 'po-1', orderNumber: 'PO-001', status: 'PENDING_APPROVAL', totalAmount: 15000 }),
  ),
  http.patch(apiUrl('/purchase-orders/:id'), () =>
    HttpResponse.json({ id: 'po-1', orderNumber: 'PO-001', status: 'APPROVED' }),
  ),
  http.delete(apiUrl('/purchase-orders/:id'), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl('/purchase-orders/auto-generate'), () => HttpResponse.json([])),

  http.get(apiUrl('/waste'), () => HttpResponse.json([])),
  http.post(apiUrl('/waste'), () =>
    HttpResponse.json({ id: 'waste-1', itemName: 'Tomatoes', quantity: 2, wasteCost: 80 }),
  ),
  http.patch(apiUrl('/waste/:id'), () =>
    HttpResponse.json({ id: 'waste-1', itemName: 'Tomatoes', quantity: 2, wasteCost: 80 }),
  ),
  http.delete(apiUrl('/waste/:id'), () => new HttpResponse(null, { status: 204 })),
  http.get(apiUrl('/waste/analytics'), () =>
    HttpResponse.json([
      { month: '2025-01', totalWasteCost: 5000, recordCount: 12 },
      { month: '2024-12', totalWasteCost: 4500, recordCount: 10 },
    ]),
  ),
];