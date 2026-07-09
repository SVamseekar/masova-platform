import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';
import type { DeliveryAddress, OrderStatus } from '../../types/order';

// Types
export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  customizations?: string[];
}

export interface QualityCheckpoint {
  checkpointName: string;
  type: 'INGREDIENT_QUALITY' | 'PORTION_SIZE' | 'TEMPERATURE' | 'PRESENTATION' | 'TASTE_TEST' | 'PACKAGING' | 'FINAL_INSPECTION';
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  checkedByStaffId?: string;
  checkedByStaffName?: string;
  checkedAt?: string;
  notes?: string;
}

export type { DeliveryAddress };

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  totalAmount?: number; // Alias for total (for backwards compatibility)
  status: OrderStatus;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'AGGREGATOR_COLLECTED';
  priority: 'NORMAL' | 'URGENT';
  orderSource?: 'MASOVA' | 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';
  aggregatorOrderId?: string;
  aggregatorCommission?: number;
  aggregatorNetPayout?: number;
  preparationTime?: number;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveredAt?: string;
  deliveryAddress?: DeliveryAddress;
  assignedDriverId?: string;
  driverId?: string; // Alias for assignedDriverId (for backwards compatibility)
  driverName?: string; // Driver name for display
  specialInstructions?: string;
  qualityCheckpoints?: QualityCheckpoint[];
  actualPreparationTime?: number;
  actualOvenTime?: number;
  assignedMakeTableStation?: string;
  assignedKitchenStaffId?: string;
  createdByStaffId?: string;
  createdByStaffName?: string;
  assignedKitchenStaffName?: string;
  assignedToKitchenAt?: string;
  cancellationRequested?: boolean;
  cancellationRequestReason?: string;
  cancellationRequestedBy?: string;
  cancellationRequestedAt?: string;
  currency?: string;
  vatCountryCode?: string;
  totalNetAmount?: number;
  totalVatAmount?: number;
  totalGrossAmount?: number;
  vatBreakdown?: {
    vatCountryCode: string;
    orderContext: string;
    totalNetAmount: number;
    totalVatAmount: number;
    totalGrossAmount: number;
    lines: Array<{
      menuItemId: string;
      itemName: string;
      vatRate: number;
      netAmount: number;
      vatAmount: number;
      grossAmount: number;
    }>;
  };
}

export interface CreateOrderRequest {
  storeId: string; // Required by backend
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: string;
  items: Array<{
    menuItemId: string;
    name: string; // Required by backend
    quantity: number;
    price: number; // Required by backend - in rupees (Double)
    variant?: string;
    customizations?: string[];
    category?: string;
  }>;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'AGGREGATOR_COLLECTED';
  deliveryAddress?: DeliveryAddress;
  specialInstructions?: string;
  // POS staff attribution - tracks which staff member created the order
  createdByStaffId?: string;
  createdByStaffName?: string;
  orderSource?: 'MASOVA' | 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';
  aggregatorOrderId?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
}

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.ORDER_SERVICE_URL,
    prepareHeaders: (headers, { getState, endpoint: _endpoint }) => {
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
      // Priority: cart selectedStoreId > user's storeId
      const storeIdToUse = selectedStoreId || user?.storeId;
      if (storeIdToUse) {
        headers.set('X-Selected-Store-Id', storeIdToUse);
      }

      return headers;
    },
  }),
  tagTypes: ['Order', 'Orders', 'KitchenQueue', 'Customer'],
  endpoints: (builder) => ({
    // Get all orders (with filters)
    getOrders: builder.query<Order[], { storeId?: string; status?: string; startDate?: string; endDate?: string }>({
      query: ({ storeId, status, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        if (status) params.append('status', status);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryString = params.toString();
        return queryString ? `/orders?${queryString}` : '/orders';
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Get order by ID (requires authentication)
    getOrder: builder.query<Order, string>({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    // Track order by ID (public endpoint, no authentication required)
    // Used for email tracking links
    trackOrder: builder.query<Order, string>({
      query: (orderId) => `/orders/track/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    // Get kitchen queue (active orders for kitchen display)
    // Takes storeId as parameter to ensure refetch when store changes
    getKitchenQueue: builder.query<Order[], string | undefined>({
      query: (storeId) => `/orders?kitchen=true${storeId ? `&storeId=${encodeURIComponent(storeId)}` : ''}`,
      providesTags: (result, error, storeId) => [
        { type: 'KitchenQueue', id: storeId || 'DEFAULT' }
      ],
    }),

    // Get orders by status
    getOrdersByStatus: builder.query<Order[], string>({
      query: (status) => `/orders/status/${status}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Create new order
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }, 'KitchenQueue', 'Customer'],
    }),

    // Update order status — canonical POST /api/orders/{id}/status (not PATCH)
    updateOrderStatus: builder.mutation<Order, UpdateOrderStatusRequest>({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
        'KitchenQueue',
      ],
    }),

    // Cancel order - Fixed to use DELETE method
    cancelOrder: builder.mutation<Order, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => {
        const params = new URLSearchParams();
        if (reason) params.append('reason', reason);
        const queryString = params.toString();
        return {
          url: `/orders/${orderId}${queryString ? `?${queryString}` : ''}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
        'KitchenQueue',
      ],
    }),

    // Get customer orders
    getCustomerOrders: builder.query<Order[], string>({
      query: (customerId) => `/orders/customer/${customerId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Get order by order number
    getOrderByNumber: builder.query<Order, string>({
      query: (orderNumber) => `/orders/number/${orderNumber}`,
      providesTags: (result) => result ? [{ type: 'Order', id: result.id }] : [],
    }),

    // Get store orders — MUST pass storeId as query param.
    // GET /orders/store is wrong (backend treats "store" as an order id → 400 empty list).
    getStoreOrders: builder.query<Order[], string | undefined>({
      query: (storeId) => {
        if (!storeId) return '/orders';
        return `/orders?storeId=${encodeURIComponent(storeId)}`;
      },
      transformResponse: (raw: unknown): Order[] => {
        if (Array.isArray(raw)) return raw as Order[];
        if (raw && typeof raw === 'object') {
          const o = raw as Record<string, unknown>;
          if (Array.isArray(o.content)) return o.content as Order[];
          if (Array.isArray(o.orders)) return o.orders as Order[];
          if (Array.isArray(o.data)) return o.data as Order[];
        }
        return [];
      },
      providesTags: (result, error, storeId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: storeId || 'DEFAULT' }]
          : [{ type: 'Orders', id: storeId || 'DEFAULT' }],
    }),

    // Move order to next stage — canonical POST /api/orders/{id}/next-stage
    moveToNextStage: builder.mutation<Order, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/next-stage`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
        'KitchenQueue',
      ],
    }),

    // Assign driver to order
    assignDriver: builder.mutation<Order, { orderId: string; driverId: string }>({
      query: ({ orderId, driverId }) => ({
        url: `/orders/${orderId}/assign-driver`,
        method: 'PATCH',
        body: { driverId },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    // Update payment status
    updatePaymentStatus: builder.mutation<Order, { orderId: string; status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'; transactionId?: string }>({
      query: ({ orderId, status, transactionId }) => ({
        url: `/orders/${orderId}/payment`,
        method: 'PATCH',
        body: { status, transactionId },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    // Update order items
    updateOrderItems: builder.mutation<Order, { orderId: string; items: OrderItem[] }>({
      query: ({ orderId, items }) => ({
        url: `/orders/${orderId}/items`,
        method: 'PATCH',
        body: { items },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
        'KitchenQueue',
      ],
    }),

    // Update order priority
    updateOrderPriority: builder.mutation<Order, { orderId: string; priority: 'NORMAL' | 'URGENT' }>({
      query: ({ orderId, priority }) => ({
        url: `/orders/${orderId}/priority`,
        method: 'PATCH',
        body: { priority },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
        'KitchenQueue',
      ],
    }),

    // Search orders
    searchOrders: builder.query<Order[], { storeId: string; query: string }>({
      query: ({ storeId, query }) => {
        const params = new URLSearchParams();
        params.append('storeId', storeId);
        params.append('query', query);
        return `/orders/search?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Quality Checkpoint endpoints
    addQualityCheckpoint: builder.mutation<Order, { orderId: string; checkpoint: QualityCheckpoint }>({
      query: ({ orderId, checkpoint }) => ({
        url: `/orders/${orderId}/quality-checkpoint`,
        method: 'POST',
        body: checkpoint,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'KitchenQueue',
      ],
    }),

    updateQualityCheckpoint: builder.mutation<Order, { orderId: string; checkpointName: string; status: QualityCheckpoint['status']; notes?: string }>({
      query: ({ orderId, checkpointName, status, notes }) => ({
        url: `/orders/${orderId}/quality-checkpoint/${encodeURIComponent(checkpointName)}`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'KitchenQueue',
      ],
    }),

    getQualityCheckpoints: builder.query<QualityCheckpoint[], string>({
      query: (orderId) => `/orders/${orderId}/quality-checkpoints`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    getOrdersWithFailedQualityChecks: builder.query<Order[], string | undefined>({
      query: (_storeId) => `/orders/analytics?type=failed-quality`,
      providesTags: (result, error, storeId) => [{ type: 'Orders', id: storeId || 'DEFAULT' }],
    }),

    getAveragePreparationTime: builder.query<number, { date: string }>({
      query: ({ date }) => `/orders/analytics?type=prep-time&date=${encodeURIComponent(date)}`,
    }),

    // Make-table workflow endpoints
    assignToMakeTable: builder.mutation<Order, { orderId: string; station: string; staffId: string; staffName: string }>({
      query: ({ orderId, station, staffId, staffName }) => ({
        url: `/orders/${orderId}`,
        method: 'PATCH',
        body: { makeTableStation: station, staffId, staffName },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'KitchenQueue',
      ],
    }),

    getOrdersByMakeTableStation: builder.query<Order[], { station: string }>({
      query: ({ station }) =>
        `/orders/analytics?type=make-table-station&station=${encodeURIComponent(station)}`,
      providesTags: ['KitchenQueue'],
    }),

    // Kitchen analytics endpoints
    getAveragePreparationTimeByItem: builder.query<{ [itemName: string]: number }, { date: string }>({
      query: ({ date }) =>
        `/orders/analytics?type=prep-time-by-item&date=${encodeURIComponent(date)}`,
    }),

    getKitchenStaffPerformance: builder.query<{
      staffId: string;
      totalOrders: number;
      completedOrders: number;
      averagePreparationTime: number;
      failedQualityChecks: number;
      completionRate: number;
    }, { staffId: string; date: string }>({
      query: ({ staffId, date }) =>
        `/orders/analytics?type=kitchen&staffId=${encodeURIComponent(staffId)}&date=${encodeURIComponent(date)}`,
    }),

    getPosStaffPerformance: builder.query<{
      staffId: string;
      staffName: string | null;
      totalOrders: number;
      totalRevenue: number;
      completedOrders: number;
      cancelledOrders: number;
      averageOrderValue: number;
    }, { staffId: string; startDate: string; endDate: string }>({
      query: ({ staffId, startDate, endDate }) =>
        `/orders/analytics?type=pos&staffId=${encodeURIComponent(staffId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
    }),

    getPreparationTimeDistribution: builder.query<{
      min: number;
      max: number;
      average: number;
      median: number;
      p90: number;
      p95: number;
      totalOrders: number;
    }, { date: string }>({
      query: ({ date }) =>
        `/orders/analytics?type=prep-time-distribution&date=${encodeURIComponent(date)}`,
    }),

    // Date-based order queries
    getOrdersByDate: builder.query<Order[], string>({
      query: (date) => `/orders/date/${date}`,
      providesTags: (result, error, date) => [{ type: 'Orders', id: `DATE_${date}` }],
    }),

    getOrdersByDateRange: builder.query<Order[], { startDate: string; endDate: string; storeId?: string }>({
      query: ({ startDate, endDate, storeId }) => {
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        if (storeId) params.append('storeId', storeId);
        return `/orders/range?${params.toString()}`;
      },
      providesTags: ['Orders'],
    }),

    getStaffOrdersByDate: builder.query<Order[], { staffId: string; date: string }>({
      query: ({ staffId, date }) =>
        `/orders/analytics?type=staff-date&staffId=${encodeURIComponent(staffId)}&date=${encodeURIComponent(date)}`,
      providesTags: (result, error, { staffId, date }) => [{ type: 'Orders', id: `STAFF_${staffId}_${date}` }],
    }),

    getActiveDeliveriesCount: builder.query<{ count: number }, string | undefined>({
      query: (storeId) =>
        `/orders/analytics?type=active-deliveries${storeId ? `&storeId=${encodeURIComponent(storeId)}` : ''}`,
      providesTags: ['Orders'],
    }),

    requestCancel: builder.mutation<Order, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => ({
        url: `/orders/${orderId}/cancel-request`,
        method: 'POST',
        body: reason ? { reason } : {},
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    approveCancelRequest: builder.mutation<Order, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/cancel-request/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
        'KitchenQueue',
      ],
    }),

    rejectCancelRequest: builder.mutation<Order, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => ({
        url: `/orders/${orderId}/cancel-request/reject`,
        method: 'POST',
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetKitchenQueueQuery,
  useGetOrdersByStatusQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useGetCustomerOrdersQuery,
  useGetOrderByNumberQuery,
  useGetStoreOrdersQuery,
  useMoveToNextStageMutation,
  useAssignDriverMutation,
  useUpdatePaymentStatusMutation,
  useUpdateOrderItemsMutation,
  useUpdateOrderPriorityMutation,
  useSearchOrdersQuery,
  useLazySearchOrdersQuery,
  useAddQualityCheckpointMutation,
  useUpdateQualityCheckpointMutation,
  useGetQualityCheckpointsQuery,
  useGetOrdersWithFailedQualityChecksQuery,
  useGetAveragePreparationTimeQuery,
  useAssignToMakeTableMutation,
  useGetOrdersByMakeTableStationQuery,
  useGetAveragePreparationTimeByItemQuery,
  useGetKitchenStaffPerformanceQuery,
  useGetPosStaffPerformanceQuery,
  useGetPreparationTimeDistributionQuery,
  useTrackOrderQuery,
  useGetOrdersByDateQuery,
  useGetOrdersByDateRangeQuery,
  useGetStaffOrdersByDateQuery,
  useGetActiveDeliveriesCountQuery,
  useRequestCancelMutation,
  useApproveCancelRequestMutation,
  useRejectCancelRequestMutation,
} = orderApi;