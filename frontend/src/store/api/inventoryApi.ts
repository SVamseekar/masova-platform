import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

// ==================== TYPE DEFINITIONS ====================

export interface InventoryItem {
  id: string;
  storeId: string;
  itemName: string;
  itemCode: string;
  category: string; // RAW_MATERIAL, INGREDIENT, PACKAGING, BEVERAGE
  unit: string; // kg, liters, pieces, boxes

  // Stock levels
  currentStock: number;
  quantity?: number; // Alias for currentStock (for backwards compatibility)
  reservedStock: number;
  minimumStock: number;
  reorderLevel?: number; // Alias for minimumStock (for backwards compatibility)
  maximumStock: number;
  reorderQuantity: number;

  // Costing (INR)
  unitCost: number;
  averageCost: number;
  lastPurchaseCost: number;

  // Supplier information
  primarySupplierId: string;
  alternativeSupplierIds: string[];

  // Perishable tracking
  isPerishable: boolean;
  expiryDate?: string;
  shelfLifeDays?: number;

  // Batch tracking
  batchTracked: boolean;
  currentBatchNumber?: string;

  // Status
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  autoReorder: boolean;

  // Metadata
  description?: string;
  storageLocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy?: string;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  email: string;
  /** Canonical backend field */
  phoneNumber?: string;
  /** Legacy alias — prefer phoneNumber */
  phone?: string;
  address?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;

  // Categories supplied
  categoriesSupplied: string[];

  // Business terms
  paymentTerms: string; // COD, NET_30, NET_60, ADVANCE
  leadTimeDays: number;
  minimumOrderValue: number;
  deliveryCharges: number;

  // Performance metrics
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  isPreferred: boolean;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  qualityRating: number; // 1-5
  deliveryRating: number; // 1-5
  totalOrders: number;
  onTimeDeliveries: number;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  storeId: string;

  // Order items
  items: PurchaseOrderItem[];

  // Pricing
  subtotal: number;
  tax: number;
  deliveryCharges: number;
  discount: number;
  totalAmount: number;

  // Status
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | 'REJECTED';

  // Dates
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;

  // Workflow
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  receivedAt?: string;
  cancelledAt?: string;

  // Notes
  notes?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface WasteRecord {
  id: string;
  storeId: string;
  inventoryItemId: string;
  itemName: string;

  // Waste details
  quantity: number;
  unit: string;
  wasteCost: number;

  // Waste category
  wasteType: 'EXPIRED' | 'SPOILED' | 'DAMAGED' | 'OVERPRODUCTION' | 'PREPARATION_ERROR' | 'OTHER';
  isPreventable: boolean;

  // Tracking
  recordedBy: string;
  recordedAt: string;
  approvedBy?: string;
  approvedAt?: string;

  // Status
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  // Details
  reason?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustmentRequest {
  quantity: number;
  reason: string;
  adjustedBy: string;
  notes?: string;
}

export interface StockReserveRequest {
  quantity: number;
  orderId: string;
  reservedBy: string;
}

export interface InventoryValueResponse {
  totalValue: number;
  totalItems: number;
  categoryBreakdown: Record<string, number>;
}

export interface SupplierComparison {
  supplierId: string;
  supplierName: string;
  averagePrice: number;
  reliability: string;
  deliveryRating: number;
  leadTimeDays: number;
  isPreferred: boolean;
}

export interface WasteSummary {
  totalWasteCost: number;
  totalRecords: number;
  categoryBreakdown: Record<string, number>;
  preventableWasteCost: number;
  preventablePercentage: number;
}

export interface WasteTrend {
  month: string;
  totalWasteCost: number;
  recordCount: number;
}

export interface TopWastedItem {
  itemName: string;
  totalQuantity: number;
  unit: string;
  totalCost: number;
}

export interface ReceivePurchaseOrderRequest {
  items: {
    itemId: string;
    receivedQuantity: number;
  }[];
  receivedBy: string;
  notes?: string;
}

// ==================== API DEFINITION ====================

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['InventoryItem', 'Supplier', 'PurchaseOrder', 'WasteRecord', 'InventoryValue'],
  endpoints: (builder) => ({

    // ==================== INVENTORY ITEMS (18 endpoints) ====================

    // Create inventory item
    createInventoryItem: builder.mutation<InventoryItem, Partial<InventoryItem>>({
      query: (item) => ({
        url: '/inventory',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['InventoryItem', 'InventoryValue'],
    }),

    getAllInventoryItems: builder.query<InventoryItem[], string | undefined>({
      query: () => '/inventory',
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    getInventoryItemById: builder.query<InventoryItem, string>({
      query: (id) => `/inventory/${id}`,
      providesTags: (result, error, id) => [{ type: 'InventoryItem', id }],
    }),

    getItemsByCategory: builder.query<InventoryItem[], { category: string }>({
      query: ({ category }) => `/inventory?category=${encodeURIComponent(category)}`,
      providesTags: ['InventoryItem'],
    }),

    searchInventoryItems: builder.query<InventoryItem[], { query: string }>({
      query: ({ query }) => `/inventory?search=${encodeURIComponent(query)}`,
      providesTags: ['InventoryItem'],
    }),

    updateInventoryItem: builder.mutation<InventoryItem, { id: string; item: Partial<InventoryItem> }>({
      query: ({ id, item }) => ({
        url: `/inventory/${id}`,
        method: 'PATCH',
        body: item,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }, 'InventoryValue'],
    }),

    adjustStock: builder.mutation<InventoryItem, { id: string; adjustment: StockAdjustmentRequest }>({
      query: ({ id, adjustment }) => ({
        url: `/inventory/${id}/stock`,
        method: 'POST',
        body: {
          operation: 'ADJUST',
          quantityChange: adjustment.quantity,
          updatedBy: adjustment.adjustedBy,
          reason: adjustment.reason,
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }, 'InventoryValue'],
    }),

    reserveStock: builder.mutation<InventoryItem, { id: string; reservation: StockReserveRequest }>({
      query: ({ id, reservation }) => ({
        url: `/inventory/${id}/stock`,
        method: 'POST',
        body: {
          operation: 'RESERVE',
          quantity: reservation.quantity,
          orderId: reservation.orderId,
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }],
    }),

    releaseReservedStock: builder.mutation<InventoryItem, { id: string; quantity: number; orderId: string }>({
      query: ({ id, quantity, orderId }) => ({
        url: `/inventory/${id}/stock`,
        method: 'POST',
        body: { operation: 'RELEASE', quantity, orderId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }],
    }),

    consumeReservedStock: builder.mutation<InventoryItem, { id: string; quantity: number; orderId: string }>({
      query: ({ id, quantity, orderId }) => ({
        url: `/inventory/${id}/stock`,
        method: 'POST',
        body: { operation: 'CONSUME', quantity, orderId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }, 'InventoryValue'],
    }),

    getLowStockItems: builder.query<InventoryItem[], string | undefined>({
      query: () => '/inventory?lowStock=true',
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    getOutOfStockItems: builder.query<InventoryItem[], string | undefined>({
      query: () => '/inventory?outOfStock=true',
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    getExpiringItems: builder.query<InventoryItem[], { days: number }>({
      query: ({ days }) => `/inventory?expiringSoon=${days}`,
      providesTags: ['InventoryItem'],
    }),

    getLowStockAlerts: builder.query<InventoryItem[], string | undefined>({
      query: () => '/inventory?lowStock=true',
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    getTotalInventoryValue: builder.query<InventoryValueResponse, string | undefined>({
      query: () => '/inventory/value',
      providesTags: (result, error, storeId) => [{ type: 'InventoryValue', id: storeId || 'DEFAULT' }],
    }),

    getInventoryValueByCategory: builder.query<InventoryValueResponse, string | undefined>({
      query: () => '/inventory/value?byCategory=true',
      providesTags: (result, error, storeId) => [{ type: 'InventoryValue', id: storeId || 'DEFAULT' }],
    }),

    deleteInventoryItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InventoryItem', 'InventoryValue'],
    }),

    // ==================== SUPPLIERS (15 endpoints) ====================

    // Create supplier
    createSupplier: builder.mutation<Supplier, Partial<Supplier>>({
      query: (supplier) => ({
        url: '/suppliers',
        method: 'POST',
        body: supplier,
      }),
      invalidatesTags: ['Supplier'],
    }),

    getAllSuppliers: builder.query<Supplier[], string | undefined>({
      query: () => '/suppliers',
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    getSupplierById: builder.query<Supplier, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),

    getSupplierByCode: builder.query<Supplier, string>({
      query: (code) => `/suppliers?code=${encodeURIComponent(code)}`,
      providesTags: ['Supplier'],
    }),

    getActiveSuppliers: builder.query<Supplier[], string | undefined>({
      query: () => '/suppliers?status=ACTIVE',
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    getPreferredSuppliers: builder.query<Supplier[], string | undefined>({
      query: () => '/suppliers?preferred=true',
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    getReliableSuppliers: builder.query<Supplier[], string | undefined>({
      query: () => '/suppliers?reliable=true',
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    getSuppliersByCategory: builder.query<Supplier[], string>({
      query: (category) => `/suppliers?category=${encodeURIComponent(category)}`,
      providesTags: ['Supplier'],
    }),

    searchSuppliers: builder.query<Supplier[], string>({
      query: (query) => `/suppliers?search=${encodeURIComponent(query)}`,
      providesTags: ['Supplier'],
    }),

    getSuppliersByCity: builder.query<Supplier[], string>({
      query: (city) => `/suppliers?city=${encodeURIComponent(city)}`,
      providesTags: ['Supplier'],
    }),

    compareSuppliers: builder.query<SupplierComparison[], string>({
      query: (category) => `/suppliers/compare?category=${encodeURIComponent(category)}`,
      providesTags: ['Supplier'],
    }),

    updateSupplier: builder.mutation<Supplier, { id: string; supplier: Partial<Supplier> }>({
      query: ({ id, supplier }) => ({
        url: `/suppliers/${id}`,
        method: 'PATCH',
        body: supplier,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    updateSupplierStatus: builder.mutation<Supplier, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/suppliers/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    markSupplierPreferred: builder.mutation<Supplier, { id: string; preferred: boolean }>({
      query: ({ id, preferred }) => ({
        url: `/suppliers/${id}`,
        method: 'PATCH',
        body: { isPreferred: preferred },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    updateSupplierPerformance: builder.mutation<Supplier, { id: string; metrics: Partial<Supplier> }>({
      query: ({ id, metrics }) => ({
        url: `/suppliers/${id}`,
        method: 'PATCH',
        body: metrics,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    // ==================== PURCHASE ORDERS (17 endpoints) ====================

    // Create purchase order
    createPurchaseOrder: builder.mutation<PurchaseOrder, Partial<PurchaseOrder>>({
      query: (order) => ({
        url: '/purchase-orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    getAllPurchaseOrders: builder.query<PurchaseOrder[], string | undefined>({
      query: () => '/purchase-orders',
      providesTags: (result, error, storeId) => [{ type: 'PurchaseOrder', id: storeId || 'DEFAULT' }],
    }),

    getPurchaseOrderById: builder.query<PurchaseOrder, string>({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'PurchaseOrder', id }],
    }),

    getPurchaseOrderByNumber: builder.query<PurchaseOrder, string>({
      query: (number) => `/purchase-orders?number=${encodeURIComponent(number)}`,
      providesTags: ['PurchaseOrder'],
    }),

    getPurchaseOrdersByStatus: builder.query<PurchaseOrder[], { status: string }>({
      query: ({ status }) => `/purchase-orders?status=${encodeURIComponent(status)}`,
      providesTags: ['PurchaseOrder'],
    }),

    getPendingApprovalPurchaseOrders: builder.query<PurchaseOrder[], string | undefined>({
      query: () => '/purchase-orders?pending=true',
      providesTags: (result, error, storeId) => [{ type: 'PurchaseOrder', id: storeId || 'DEFAULT' }],
    }),

    getOverduePurchaseOrders: builder.query<PurchaseOrder[], string | undefined>({
      query: () => '/purchase-orders?overdue=true',
      providesTags: (result, error, storeId) => [{ type: 'PurchaseOrder', id: storeId || 'DEFAULT' }],
    }),

    getPurchaseOrdersByDateRange: builder.query<PurchaseOrder[], { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/purchase-orders?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['PurchaseOrder'],
    }),

    updatePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; order: Partial<PurchaseOrder> }>({
      query: ({ id, order }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PATCH',
        body: order,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    approvePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; approvedBy: string }>({
      query: ({ id, approvedBy }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PATCH',
        body: { action: 'APPROVE', approverId: approvedBy },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    rejectPurchaseOrder: builder.mutation<PurchaseOrder, { id: string; rejectedBy: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PATCH',
        body: { action: 'REJECT', reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    sendPurchaseOrder: builder.mutation<PurchaseOrder, { id: string; sentBy: string }>({
      query: ({ id }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PATCH',
        body: { action: 'SEND' },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    receivePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; request: ReceivePurchaseOrderRequest }>({
      query: ({ id, request }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PATCH',
        body: {
          action: 'RECEIVE',
          receivedBy: request.receivedBy,
          notes: request.notes,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseOrder', id },
        'InventoryItem',
        'InventoryValue',
      ],
    }),

    cancelPurchaseOrder: builder.mutation<PurchaseOrder, { id: string; cancelledBy: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PATCH',
        body: { action: 'CANCEL', reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    autoGeneratePurchaseOrders: builder.mutation<PurchaseOrder[], { createdBy: string }>({
      query: () => ({
        url: '/purchase-orders/auto-generate',
        method: 'POST',
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    deletePurchaseOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // ==================== WASTE ANALYSIS (11 endpoints) ====================

    // Record waste
    recordWaste: builder.mutation<WasteRecord, Partial<WasteRecord>>({
      query: (waste) => ({
        url: '/waste',
        method: 'POST',
        body: waste,
      }),
      invalidatesTags: ['WasteRecord', 'InventoryItem', 'InventoryValue'],
    }),

    getAllWasteRecords: builder.query<WasteRecord[], string | undefined>({
      query: () => '/waste',
      providesTags: (result, error, storeId) => [{ type: 'WasteRecord', id: storeId || 'DEFAULT' }],
    }),

    getWasteRecordById: builder.query<WasteRecord, string>({
      query: (id) => `/waste/${id}`,
      providesTags: (result, error, id) => [{ type: 'WasteRecord', id }],
    }),

    getWasteRecordsByDateRange: builder.query<WasteRecord[], { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/waste?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    getWasteRecordsByCategory: builder.query<WasteRecord[], { category: string }>({
      query: ({ category }) => `/waste?category=${encodeURIComponent(category)}`,
      providesTags: ['WasteRecord'],
    }),

    updateWasteRecord: builder.mutation<WasteRecord, { id: string; waste: Partial<WasteRecord> }>({
      query: ({ id, waste }) => ({
        url: `/waste/${id}`,
        method: 'PATCH',
        body: waste,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WasteRecord', id }],
    }),

    approveWasteRecord: builder.mutation<WasteRecord, { id: string; approvedBy: string }>({
      query: ({ id, approvedBy }) => ({
        url: `/waste/${id}`,
        method: 'PATCH',
        body: { approverId: approvedBy },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WasteRecord', id }],
    }),

    deleteWasteRecord: builder.mutation<void, string>({
      query: (id) => ({
        url: `/waste/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WasteRecord'],
    }),

    getTotalWasteCost: builder.query<WasteSummary, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/waste/analytics?type=total-cost&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    getWasteCostByCategory: builder.query<WasteSummary, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/waste/analytics?type=cost-by-category&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    getTopWastedItems: builder.query<TopWastedItem[], { startDate: string; endDate: string; limit: number }>({
      query: ({ startDate, endDate, limit }) =>
        `/waste/analytics?type=top-items&startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
      providesTags: ['WasteRecord'],
    }),

    getPreventableWasteAnalysis: builder.query<WasteSummary, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/waste/analytics?type=preventable&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    getWasteTrend: builder.query<WasteTrend[], { months: number }>({
      query: ({ months }) => `/waste/analytics?type=trend&months=${months}`,
      providesTags: ['WasteRecord'],
    }),
  }),
});

// Export hooks
export const {
  // Inventory Items
  useCreateInventoryItemMutation,
  useGetAllInventoryItemsQuery,
  useGetInventoryItemByIdQuery,
  useGetItemsByCategoryQuery,
  useSearchInventoryItemsQuery,
  useUpdateInventoryItemMutation,
  useAdjustStockMutation,
  useReserveStockMutation,
  useReleaseReservedStockMutation,
  useConsumeReservedStockMutation,
  useGetLowStockItemsQuery,
  useGetOutOfStockItemsQuery,
  useGetExpiringItemsQuery,
  useGetLowStockAlertsQuery,
  useGetTotalInventoryValueQuery,
  useGetInventoryValueByCategoryQuery,
  useDeleteInventoryItemMutation,

  // Suppliers
  useCreateSupplierMutation,
  useGetAllSuppliersQuery,
  useGetSupplierByIdQuery,
  useGetSupplierByCodeQuery,
  useGetActiveSuppliersQuery,
  useGetPreferredSuppliersQuery,
  useGetReliableSuppliersQuery,
  useGetSuppliersByCategoryQuery,
  useSearchSuppliersQuery,
  useGetSuppliersByCityQuery,
  useCompareSuppliersQuery,
  useUpdateSupplierMutation,
  useUpdateSupplierStatusMutation,
  useMarkSupplierPreferredMutation,
  useUpdateSupplierPerformanceMutation,

  // Purchase Orders
  useCreatePurchaseOrderMutation,
  useGetAllPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useGetPurchaseOrderByNumberQuery,
  useGetPurchaseOrdersByStatusQuery,
  useGetPendingApprovalPurchaseOrdersQuery,
  useGetOverduePurchaseOrdersQuery,
  useGetPurchaseOrdersByDateRangeQuery,
  useUpdatePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useSendPurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useAutoGeneratePurchaseOrdersMutation,
  useDeletePurchaseOrderMutation,

  // Waste Analysis
  useRecordWasteMutation,
  useGetAllWasteRecordsQuery,
  useGetWasteRecordByIdQuery,
  useGetWasteRecordsByDateRangeQuery,
  useGetWasteRecordsByCategoryQuery,
  useUpdateWasteRecordMutation,
  useApproveWasteRecordMutation,
  useDeleteWasteRecordMutation,
  useGetTotalWasteCostQuery,
  useGetWasteCostByCategoryQuery,
  useGetTopWastedItemsQuery,
  useGetPreventableWasteAnalysisQuery,
  useGetWasteTrendQuery,
} = inventoryApi;
