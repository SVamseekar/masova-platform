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
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
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
  notes?: string;
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

    // Cancel order
    cancelOrder: builder.mutation<Order, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => ({
        url: `/api/orders/${orderId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
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
} = orderApi;