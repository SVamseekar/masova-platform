import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { API_CONFIG } from '../../config/api.config';

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
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
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
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart?.selectedStoreId;

      // Add authorization token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Add user context headers
      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
        if (user.storeId) {
          headers.set('X-User-Store-Id', user.storeId);
        }
      }

      // Add selected store for managers/customers
      if (selectedStoreId) {
        headers.set('X-Selected-Store-Id', selectedStoreId);
      }

      return headers;
    },
  }),
  tagTypes: ['InventoryItem', 'Supplier', 'PurchaseOrder', 'WasteRecord', 'InventoryValue'],
  endpoints: (builder) => ({

    // ==================== INVENTORY ITEMS (18 endpoints) ====================

    // Create inventory item
    createInventoryItem: builder.mutation<InventoryItem, Partial<InventoryItem>>({
      query: (item) => ({
        url: '/api/inventory',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['InventoryItem', 'InventoryValue'],
    }),

    // Get all inventory items for a store
    getAllInventoryItems: builder.query<InventoryItem[], string | undefined>({
      query: (storeId) => `/api/inventory${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    // Get inventory item by ID
    getInventoryItemById: builder.query<InventoryItem, string>({
      query: (id) => `/api/inventory/${id}`,
      providesTags: (result, error, id) => [{ type: 'InventoryItem', id }],
    }),

    // Get items by category
    getItemsByCategory: builder.query<InventoryItem[], { category: string }>({
      query: ({ category }) => `/api/inventory?category=${category}`,
      providesTags: ['InventoryItem'],
    }),

    // Search inventory items
    searchInventoryItems: builder.query<InventoryItem[], { query: string }>({
      query: ({ query }) => `/api/inventory?search=${query}`,
      providesTags: ['InventoryItem'],
    }),

    // Update inventory item
    updateInventoryItem: builder.mutation<InventoryItem, { id: string; item: Partial<InventoryItem> }>({
      query: ({ id, item }) => ({
        url: `/api/inventory/${id}`,
        method: 'PATCH',
        body: item,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }, 'InventoryValue'],
    }),

    // Adjust stock
    adjustStock: builder.mutation<InventoryItem, { id: string; adjustment: StockAdjustmentRequest }>({
      query: ({ id, adjustment }) => ({
        url: `/api/inventory/${id}/stock`,
        method: 'PATCH',
        body: adjustment,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }, 'InventoryValue'],
    }),

    // Reserve stock
    reserveStock: builder.mutation<InventoryItem, { id: string; reservation: StockReserveRequest }>({
      query: ({ id, reservation }) => ({
        url: `/api/inventory/${id}/stock`,
        method: 'PATCH',
        body: reservation,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }],
    }),

    // Release reserved stock
    releaseReservedStock: builder.mutation<InventoryItem, { id: string; quantity: number; orderId: string }>({
      query: ({ id, quantity, orderId }) => ({
        url: `/api/inventory/${id}/stock`,
        method: 'PATCH',
        body: { quantity, orderId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }],
    }),

    // Consume reserved stock
    consumeReservedStock: builder.mutation<InventoryItem, { id: string; quantity: number; orderId: string }>({
      query: ({ id, quantity, orderId }) => ({
        url: `/api/inventory/${id}/stock`,
        method: 'PATCH',
        body: { quantity, orderId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }, 'InventoryValue'],
    }),

    // Get low stock items
    getLowStockItems: builder.query<InventoryItem[], string | undefined>({
      query: (storeId) => `/api/inventory?lowStock=true${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    // Get out of stock items
    getOutOfStockItems: builder.query<InventoryItem[], string | undefined>({
      query: (storeId) => `/api/inventory?outOfStock=true${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    // Get items expiring soon
    getExpiringItems: builder.query<InventoryItem[], { days: number }>({
      query: ({ days }) => `/api/inventory?expiringSoon=true&days=${days}`,
      providesTags: ['InventoryItem'],
    }),

    // Get low stock alerts
    getLowStockAlerts: builder.query<InventoryItem[], string | undefined>({
      query: (storeId) => `/api/inventory?alerts=lowStock${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'InventoryItem', id: storeId || 'DEFAULT' }],
    }),

    // Get total inventory value
    getTotalInventoryValue: builder.query<InventoryValueResponse, string | undefined>({
      query: (storeId) => `/api/inventory/value${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'InventoryValue', id: storeId || 'DEFAULT' }],
    }),

    // Get inventory value by category
    getInventoryValueByCategory: builder.query<InventoryValueResponse, string | undefined>({
      query: (storeId) => `/api/inventory/value?byCategory=true${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'InventoryValue', id: storeId || 'DEFAULT' }],
    }),

    // Delete inventory item
    deleteInventoryItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/inventory/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InventoryItem', 'InventoryValue'],
    }),

    // ==================== SUPPLIERS (15 endpoints) ====================

    // Create supplier
    createSupplier: builder.mutation<Supplier, Partial<Supplier>>({
      query: (supplier) => ({
        url: '/api/suppliers',
        method: 'POST',
        body: supplier,
      }),
      invalidatesTags: ['Supplier'],
    }),

    // Get all suppliers
    getAllSuppliers: builder.query<Supplier[], string | undefined>({
      query: (storeId) => `/api/suppliers${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    // Get supplier by ID
    getSupplierById: builder.query<Supplier, string>({
      query: (id) => `/api/suppliers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),

    // Get supplier by code
    getSupplierByCode: builder.query<Supplier, string>({
      query: (code) => `/api/suppliers?code=${code}`,
      providesTags: ['Supplier'],
    }),

    // Get active suppliers
    getActiveSuppliers: builder.query<Supplier[], string | undefined>({
      query: (storeId) => `/api/suppliers?active=true${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    // Get preferred suppliers
    getPreferredSuppliers: builder.query<Supplier[], string | undefined>({
      query: (storeId) => `/api/suppliers?preferred=true${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    // Get reliable suppliers
    getReliableSuppliers: builder.query<Supplier[], string | undefined>({
      query: (storeId) => `/api/suppliers?reliable=true${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Supplier', id: storeId || 'DEFAULT' }],
    }),

    // Get suppliers by category
    getSuppliersByCategory: builder.query<Supplier[], string>({
      query: (category) => `/api/suppliers?category=${category}`,
      providesTags: ['Supplier'],
    }),

    // Search suppliers
    searchSuppliers: builder.query<Supplier[], string>({
      query: (query) => `/api/suppliers?search=${query}`,
      providesTags: ['Supplier'],
    }),

    // Get suppliers by city
    getSuppliersByCity: builder.query<Supplier[], string>({
      query: (city) => `/api/suppliers?city=${city}`,
      providesTags: ['Supplier'],
    }),

    // Compare suppliers by category
    compareSuppliers: builder.query<SupplierComparison[], string>({
      query: (category) => `/api/suppliers/compare?category=${category}`,
      providesTags: ['Supplier'],
    }),

    // Update supplier
    updateSupplier: builder.mutation<Supplier, { id: string; supplier: Partial<Supplier> }>({
      query: ({ id, supplier }) => ({
        url: `/api/suppliers/${id}`,
        method: 'PATCH',
        body: supplier,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    // Update supplier status
    updateSupplierStatus: builder.mutation<Supplier, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/suppliers/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    // Mark supplier as preferred
    markSupplierPreferred: builder.mutation<Supplier, { id: string; preferred: boolean }>({
      query: ({ id, preferred }) => ({
        url: `/api/suppliers/${id}`,
        method: 'PATCH',
        body: { preferred },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    // Update supplier performance metrics
    updateSupplierPerformance: builder.mutation<Supplier, { id: string; metrics: Partial<Supplier> }>({
      query: ({ id, metrics }) => ({
        url: `/api/suppliers/${id}`,
        method: 'PATCH',
        body: metrics,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Supplier', id }],
    }),

    // ==================== PURCHASE ORDERS (17 endpoints) ====================

    // Create purchase order
    createPurchaseOrder: builder.mutation<PurchaseOrder, Partial<PurchaseOrder>>({
      query: (order) => ({
        url: '/api/purchase-orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Get all purchase orders
    getAllPurchaseOrders: builder.query<PurchaseOrder[], string | undefined>({
      query: (storeId) => `/api/purchase-orders${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'PurchaseOrder', id: storeId || 'DEFAULT' }],
    }),

    // Get purchase order by ID
    getPurchaseOrderById: builder.query<PurchaseOrder, string>({
      query: (id) => `/api/purchase-orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'PurchaseOrder', id }],
    }),

    // Get purchase order by number
    getPurchaseOrderByNumber: builder.query<PurchaseOrder, string>({
      query: (number) => `/api/purchase-orders?number=${number}`,
      providesTags: ['PurchaseOrder'],
    }),

    // Get purchase orders by status
    getPurchaseOrdersByStatus: builder.query<PurchaseOrder[], { status: string }>({
      query: ({ status }) => `/api/purchase-orders?status=${status}`,
      providesTags: ['PurchaseOrder'],
    }),

    // Get pending approval purchase orders
    getPendingApprovalPurchaseOrders: builder.query<PurchaseOrder[], string | undefined>({
      query: (storeId) => `/api/purchase-orders?status=PENDING_APPROVAL${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'PurchaseOrder', id: storeId || 'DEFAULT' }],
    }),

    // Get overdue purchase orders
    getOverduePurchaseOrders: builder.query<PurchaseOrder[], string | undefined>({
      query: (storeId) => `/api/purchase-orders?overdue=true${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'PurchaseOrder', id: storeId || 'DEFAULT' }],
    }),

    // Get purchase orders by date range
    getPurchaseOrdersByDateRange: builder.query<PurchaseOrder[], { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/api/purchase-orders?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['PurchaseOrder'],
    }),

    // Update purchase order
    updatePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; order: Partial<PurchaseOrder> }>({
      query: ({ id, order }) => ({
        url: `/api/purchase-orders/${id}`,
        method: 'PATCH',
        body: order,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    // Approve purchase order
    approvePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; approvedBy: string }>({
      query: ({ id, approvedBy }) => ({
        url: `/api/purchase-orders/${id}`,
        method: 'PATCH',
        body: { approvedBy },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    // Reject purchase order
    rejectPurchaseOrder: builder.mutation<PurchaseOrder, { id: string; rejectedBy: string; reason: string }>({
      query: ({ id, rejectedBy, reason }) => ({
        url: `/api/purchase-orders/${id}`,
        method: 'PATCH',
        body: { rejectedBy, reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    // Send purchase order
    sendPurchaseOrder: builder.mutation<PurchaseOrder, { id: string; sentBy: string }>({
      query: ({ id, sentBy }) => ({
        url: `/api/purchase-orders/${id}`,
        method: 'PATCH',
        body: { sentBy },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    // Receive purchase order
    receivePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; request: ReceivePurchaseOrderRequest }>({
      query: ({ id, request }) => ({
        url: `/api/purchase-orders/${id}`,
        method: 'PATCH',
        body: request,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseOrder', id },
        'InventoryItem',
        'InventoryValue',
      ],
    }),

    // Cancel purchase order
    cancelPurchaseOrder: builder.mutation<PurchaseOrder, { id: string; cancelledBy: string; reason: string }>({
      query: ({ id, cancelledBy, reason }) => ({
        url: `/api/purchase-orders/${id}`,
        method: 'PATCH',
        body: { cancelledBy, reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PurchaseOrder', id }],
    }),

    // Auto-generate purchase orders for low stock items
    autoGeneratePurchaseOrders: builder.mutation<PurchaseOrder[], { createdBy: string }>({
      query: ({ createdBy }) => ({
        url: '/api/purchase-orders/auto-generate',
        method: 'POST',
        body: { createdBy },
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // Delete purchase order
    deletePurchaseOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // ==================== WASTE ANALYSIS (11 endpoints) ====================

    // Record waste
    recordWaste: builder.mutation<WasteRecord, Partial<WasteRecord>>({
      query: (waste) => ({
        url: '/api/waste',
        method: 'POST',
        body: waste,
      }),
      invalidatesTags: ['WasteRecord', 'InventoryItem', 'InventoryValue'],
    }),

    // Get all waste records
    getAllWasteRecords: builder.query<WasteRecord[], string | undefined>({
      query: (storeId) => `/api/waste${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'WasteRecord', id: storeId || 'DEFAULT' }],
    }),

    // Get waste record by ID
    getWasteRecordById: builder.query<WasteRecord, string>({
      query: (id) => `/api/waste/${id}`,
      providesTags: (result, error, id) => [{ type: 'WasteRecord', id }],
    }),

    // Get waste records by date range
    getWasteRecordsByDateRange: builder.query<WasteRecord[], { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/api/waste?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    // Get waste records by category
    getWasteRecordsByCategory: builder.query<WasteRecord[], { category: string }>({
      query: ({ category }) => `/api/waste?category=${category}`,
      providesTags: ['WasteRecord'],
    }),

    // Update waste record
    updateWasteRecord: builder.mutation<WasteRecord, { id: string; waste: Partial<WasteRecord> }>({
      query: ({ id, waste }) => ({
        url: `/api/waste/${id}`,
        method: 'PATCH',
        body: waste,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WasteRecord', id }],
    }),

    // Approve waste record
    approveWasteRecord: builder.mutation<WasteRecord, { id: string; approvedBy: string }>({
      query: ({ id, approvedBy }) => ({
        url: `/api/waste/${id}`,
        method: 'PATCH',
        body: { approvedBy },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WasteRecord', id }],
    }),

    // Delete waste record
    deleteWasteRecord: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/waste/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WasteRecord'],
    }),

    // Get total waste cost
    getTotalWasteCost: builder.query<WasteSummary, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/api/waste/analytics?type=total-cost&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    // Get waste cost by category
    getWasteCostByCategory: builder.query<WasteSummary, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/api/waste/analytics?type=cost-by-category&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    // Get top wasted items
    getTopWastedItems: builder.query<any[], { startDate: string; endDate: string; limit: number }>({
      query: ({ startDate, endDate, limit }) =>
        `/api/waste/analytics?type=top-items&startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
      providesTags: ['WasteRecord'],
    }),

    // Get preventable waste analysis
    getPreventableWasteAnalysis: builder.query<WasteSummary, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) =>
        `/api/waste/analytics?type=preventable&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['WasteRecord'],
    }),

    // Get waste trend (monthly)
    getWasteTrend: builder.query<WasteTrend[], { months: number }>({
      query: ({ months }) => `/api/waste/analytics?months=${months}`,
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
