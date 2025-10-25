import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

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

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: 'RECEIVED' | 'PREPARING' | 'OVEN' | 'BAKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'WALLET';
  priority: 'NORMAL' | 'URGENT';
  preparationTime?: number;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  qualityCheckpoints?: QualityCheckpoint[];
  actualPreparationTime?: number;
  actualOvenTime?: number;
  assignedMakeTableStation?: string;
  assignedKitchenStaffId?: string;
  assignedKitchenStaffName?: string;
  assignedToKitchenAt?: string;
}

export interface CreateOrderRequest {
  storeId: string; // Required by backend
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: Array<{
    menuItemId: string;
    name: string; // Required by backend
    quantity: number;
    price: number; // Required by backend
    variant?: string;
    customizations?: string[];
  }>;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'WALLET';
  deliveryAddress?: {
    street: string;
    city: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  specialInstructions?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: 'RECEIVED' | 'PREPARING' | 'OVEN' | 'BAKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
}

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.ORDER_SERVICE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Order', 'Orders', 'KitchenQueue'],
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
        return queryString ? `/api/orders?${queryString}` : '/api/orders';
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Get order by ID
    getOrder: builder.query<Order, string>({
      query: (orderId) => `/api/orders/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    // Get kitchen queue (active orders for kitchen display)
    getKitchenQueue: builder.query<Order[], string>({
      query: (storeId) => `/api/orders/kitchen/${storeId}`,
      providesTags: ['KitchenQueue'],
    }),

    // Create new order
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (data) => ({
        url: '/api/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }, 'KitchenQueue'],
    }),

    // Update order status
    updateOrderStatus: builder.mutation<Order, UpdateOrderStatusRequest>({
      query: ({ orderId, status }) => ({
        url: `/api/orders/${orderId}/status`,
        method: 'PATCH',
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
          url: `/api/orders/${orderId}${queryString ? `?${queryString}` : ''}`,
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
      query: (customerId) => `/api/orders/customer/${customerId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Get order by order number
    getOrderByNumber: builder.query<Order, string>({
      query: (orderNumber) => `/api/orders/number/${orderNumber}`,
      providesTags: (result) => result ? [{ type: 'Order', id: result.id }] : [],
    }),

    // Get store orders
    getStoreOrders: builder.query<Order[], string>({
      query: (storeId) => `/api/orders/store/${storeId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Move order to next stage
    moveToNextStage: builder.mutation<Order, string>({
      query: (orderId) => ({
        url: `/api/orders/${orderId}/next-stage`,
        method: 'PATCH',
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
        url: `/api/orders/${orderId}/assign-driver`,
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
        url: `/api/orders/${orderId}/payment`,
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
        url: `/api/orders/${orderId}/items`,
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
        url: `/api/orders/${orderId}/priority`,
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
        return `/api/orders/search?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Orders', id: 'LIST' }]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Quality Checkpoint endpoints
    addQualityCheckpoint: builder.mutation<Order, { orderId: string; checkpoint: QualityCheckpoint }>({
      query: ({ orderId, checkpoint }) => ({
        url: `/api/orders/${orderId}/quality-checkpoint`,
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
        url: `/api/orders/${orderId}/quality-checkpoint/${encodeURIComponent(checkpointName)}`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'KitchenQueue',
      ],
    }),

    getQualityCheckpoints: builder.query<QualityCheckpoint[], string>({
      query: (orderId) => `/api/orders/${orderId}/quality-checkpoints`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    getOrdersWithFailedQualityChecks: builder.query<Order[], string>({
      query: (storeId) => `/api/orders/store/${storeId}/failed-quality-checks`,
      providesTags: ['Orders'],
    }),

    getAveragePreparationTime: builder.query<number, { storeId: string; date: string }>({
      query: ({ storeId, date }) => `/api/orders/store/${storeId}/avg-prep-time?date=${date}`,
    }),

    // Make-table workflow endpoints
    assignToMakeTable: builder.mutation<Order, { orderId: string; station: string; staffId: string; staffName: string }>({
      query: ({ orderId, station, staffId, staffName }) => ({
        url: `/api/orders/${orderId}/assign-make-table`,
        method: 'PATCH',
        body: { station, staffId, staffName },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'KitchenQueue',
      ],
    }),

    getOrdersByMakeTableStation: builder.query<Order[], { storeId: string; station: string }>({
      query: ({ storeId, station }) => `/api/orders/store/${storeId}/make-table/${station}`,
      providesTags: ['KitchenQueue'],
    }),

    // Kitchen analytics endpoints
    getAveragePreparationTimeByItem: builder.query<{ [itemName: string]: number }, { storeId: string; date: string }>({
      query: ({ storeId, date }) => `/api/orders/store/${storeId}/analytics/prep-time-by-item?date=${date}`,
    }),

    getKitchenStaffPerformance: builder.query<{
      staffId: string;
      totalOrders: number;
      completedOrders: number;
      averagePreparationTime: number;
      failedQualityChecks: number;
      completionRate: number;
    }, { staffId: string; date: string }>({
      query: ({ staffId, date }) => `/api/orders/analytics/kitchen-staff/${staffId}/performance?date=${date}`,
    }),

    getPreparationTimeDistribution: builder.query<{
      min: number;
      max: number;
      average: number;
      median: number;
      p90: number;
      p95: number;
      totalOrders: number;
    }, { storeId: string; date: string }>({
      query: ({ storeId, date }) => `/api/orders/store/${storeId}/analytics/prep-time-distribution?date=${date}`,
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetKitchenQueueQuery,
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
  useGetPreparationTimeDistributionQuery,
} = orderApi;