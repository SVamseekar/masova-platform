import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
  // Inventory
  http.get(`${API}/api/inventory`, () =>
    HttpResponse.json([mockInventoryItem, mockLowStockItem]),
  ),

  http.post(`${API}/api/inventory`, () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.get(`${API}/api/inventory/:id`, () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.patch(`${API}/api/inventory/:id`, () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.delete(`${API}/api/inventory/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/inventory/:id/stock`, () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.get(`${API}/api/inventory/value`, () =>
    HttpResponse.json({
      totalValue: 125000,
      totalItems: 45,
      categoryBreakdown: { RAW_MATERIAL: 80000, INGREDIENT: 30000, PACKAGING: 15000 },
    }),
  ),

  // Suppliers
  http.get(`${API}/api/suppliers`, () =>
    HttpResponse.json([
      { id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE', qualityRating: 4.5 },
      { id: 'sup-2', supplierName: 'Veggie World', status: 'ACTIVE', qualityRating: 4.2 },
    ]),
  ),

  http.post(`${API}/api/suppliers`, () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),

  http.get(`${API}/api/suppliers/:id`, () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),

  http.patch(`${API}/api/suppliers/:id`, () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),

  http.delete(`${API}/api/suppliers/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/api/suppliers/compare`, () =>
    HttpResponse.json([]),
  ),

  // Purchase Orders
  http.get(`${API}/api/purchase-orders`, () =>
    HttpResponse.json([]),
  ),

  http.post(`${API}/api/purchase-orders`, () =>
    HttpResponse.json({ id: 'po-1', orderNumber: 'PO-001', status: 'DRAFT' }),
  ),

  http.get(`${API}/api/purchase-orders/:id`, () =>
    HttpResponse.json({ id: 'po-1', orderNumber: 'PO-001', status: 'DRAFT' }),
  ),

  http.patch(`${API}/api/purchase-orders/:id`, () =>
    HttpResponse.json({ id: 'po-1', orderNumber: 'PO-001', status: 'APPROVED' }),
  ),

  http.delete(`${API}/api/purchase-orders/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/purchase-orders/auto-generate`, () =>
    HttpResponse.json([{ id: 'po-2', orderNumber: 'PO-002', status: 'DRAFT' }]),
  ),

  // Waste
  http.get(`${API}/api/waste`, () =>
    HttpResponse.json([]),
  ),

  http.post(`${API}/api/waste`, () =>
    HttpResponse.json({ id: 'waste-1', itemName: 'Tomatoes', quantity: 2, wasteCost: 80 }),
  ),

  http.get(`${API}/api/waste/:id`, () =>
    HttpResponse.json({ id: 'waste-1', itemName: 'Tomatoes', quantity: 2, wasteCost: 80 }),
  ),

  http.patch(`${API}/api/waste/:id`, () =>
    HttpResponse.json({ id: 'waste-1', itemName: 'Tomatoes', quantity: 2, wasteCost: 80 }),
  ),

  http.delete(`${API}/api/waste/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/api/waste/analytics`, () =>
    HttpResponse.json([
      { month: '2025-01', totalWasteCost: 5000, recordCount: 12 },
      { month: '2024-12', totalWasteCost: 4500, recordCount: 10 },
    ]),
  ),
];
