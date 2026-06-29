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
  http.post(apiUrl('/inventory/items'), () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.get(apiUrl('/inventory/items'), () =>
    HttpResponse.json([mockInventoryItem, mockLowStockItem]),
  ),

  http.get(apiUrl('/inventory/items/:id'), () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.get(apiUrl('/inventory/items/category/:category'), () =>
    HttpResponse.json([mockInventoryItem]),
  ),

  http.get(apiUrl('/inventory/items/search'), () =>
    HttpResponse.json([mockInventoryItem]),
  ),

  http.put(apiUrl('/inventory/items/:id'), () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.patch(apiUrl('/inventory/items/:id/adjust'), () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.patch(apiUrl('/inventory/items/:id/reserve'), () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.patch(apiUrl('/inventory/items/:id/release'), () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.patch(apiUrl('/inventory/items/:id/consume'), () =>
    HttpResponse.json(mockInventoryItem),
  ),

  http.get(apiUrl('/inventory/low-stock'), () =>
    HttpResponse.json([mockLowStockItem]),
  ),

  http.get(apiUrl('/inventory/out-of-stock'), () =>
    HttpResponse.json([]),
  ),

  http.get(apiUrl('/inventory/expiring-soon'), () =>
    HttpResponse.json([mockInventoryItem]),
  ),

  http.get(apiUrl('/inventory/alerts/low-stock'), () =>
    HttpResponse.json([mockLowStockItem]),
  ),

  http.get(apiUrl('/inventory/value'), () =>
    HttpResponse.json({
      totalValue: 125000,
      totalItems: 45,
      categoryBreakdown: { RAW_MATERIAL: 80000, INGREDIENT: 30000, PACKAGING: 15000 },
    }),
  ),

  http.get(apiUrl('/inventory/value/by-category'), () =>
    HttpResponse.json({
      totalValue: 125000,
      totalItems: 45,
      categoryBreakdown: { RAW_MATERIAL: 80000, INGREDIENT: 30000, PACKAGING: 15000 },
    }),
  ),

  http.delete(apiUrl('/inventory/items/:id'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Suppliers
  http.post(apiUrl('/inventory/suppliers'), () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),

  http.get(apiUrl('/inventory/suppliers'), () =>
    HttpResponse.json([
      { id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE', qualityRating: 4.5 },
      { id: 'sup-2', supplierName: 'Veggie World', status: 'ACTIVE', qualityRating: 4.2 },
    ]),
  ),

  http.get(apiUrl('/inventory/suppliers/:id'), () =>
    HttpResponse.json({ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }),
  ),

  http.get(apiUrl('/inventory/suppliers/active'), () =>
    HttpResponse.json([{ id: 'sup-1', supplierName: 'Fresh Farms', status: 'ACTIVE' }]),
  ),

  http.get(apiUrl('/inventory/suppliers/preferred'), () =>
    HttpResponse.json([{ id: 'sup-1', supplierName: 'Fresh Farms', isPreferred: true }]),
  ),

  http.get(apiUrl('/inventory/suppliers/reliable'), () =>
    HttpResponse.json([{ id: 'sup-1', supplierName: 'Fresh Farms', reliability: 'HIGH' }]),
  ),

  http.get(apiUrl('/inventory/suppliers/search'), () =>
    HttpResponse.json([{ id: 'sup-1', supplierName: 'Fresh Farms' }]),
  ),

  // Purchase Orders
  http.get(apiUrl('/inventory/purchase-orders'), () =>
    HttpResponse.json([]),
  ),

  http.post(apiUrl('/inventory/purchase-orders'), () =>
    HttpResponse.json({ id: 'po-1', orderNumber: 'PO-001', status: 'DRAFT' }),
  ),

  // Waste
  http.get(apiUrl('/inventory/waste'), () =>
    HttpResponse.json([]),
  ),

  http.post(apiUrl('/inventory/waste'), () =>
    HttpResponse.json({ id: 'waste-1', itemName: 'Tomatoes', quantity: 2, wasteCost: 80 }),
  ),

  http.get(apiUrl('/inventory/waste/trend'), () =>
    HttpResponse.json([
      { month: '2025-01', totalWasteCost: 5000, recordCount: 12 },
      { month: '2024-12', totalWasteCost: 4500, recordCount: 10 },
    ]),
  ),
];
