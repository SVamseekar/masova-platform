import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';
import { AllergenType } from '../../constants/allergens';

// Types
export interface CustomerAddress {
  id: string;
  label: string; // HOME, WORK, OTHER
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PointTransaction {
  id: string;
  points: number;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
  description: string;
  orderId?: string;
  timestamp: string;
}

export interface LoyaltyInfo {
  totalPoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierExpiryDate?: string;
  lastPointsUpdate?: string;
  pointHistory: PointTransaction[];
}

export interface CustomerPreferences {
  favoriteMenuItems: string[];
  cuisinePreferences: string[];
  dietaryRestrictions: string[];
  allergenAlerts: AllergenType[];
  preferredPaymentMethod?: string;
  spiceLevel: string;
  notifyOnOffers: boolean;
  notifyOnOrderStatus: boolean;
}

export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteOrderType?: string;
  firstOrderDate?: string;
  lastOrderDate?: string;
}

export interface CustomerNote {
  id: string;
  note: string;
  addedBy: string;
  createdAt: string;
  category: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  loyaltyInfo: LoyaltyInfo;
  preferences: CustomerPreferences;
  orderStats: OrderStats;
  active: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  tags: string[];
  notes: CustomerNote[];
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string;
  lastLoginDate?: string;
  storeIds?: string[]; // Multi-store support: All stores this customer has ordered from
}

export interface CreateCustomerRequest {
  userId: string;
  storeId?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
  preferences?: UpdatePreferencesRequest;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  note?: AddCustomerNoteRequest;
  orderStats?: UpdateOrderStatsRequest;
}

export interface AddAddressRequest {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // Required - defaults to 'India'
  latitude?: number;
  longitude?: number;
  landmark?: string;
  isDefault?: boolean;
}

export interface UpdatePreferencesRequest {
  favoriteMenuItems?: string[];
  cuisinePreferences?: string[];
  dietaryRestrictions?: string[];
  allergenAlerts?: AllergenType[];
  preferredPaymentMethod?: string;
  spiceLevel?: string;
  notifyOnOffers?: boolean;
  notifyOnOrderStatus?: boolean;
}

export interface AddLoyaltyPointsRequest {
  points: number;
  type: 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED';
  description: string;
  orderId?: string;
}

export interface AddCustomerNoteRequest {
  note: string;
  addedBy: string;
  category: 'GENERAL' | 'COMPLAINT' | 'PREFERENCE' | 'OTHER';
}

export interface UpdateOrderStatsRequest {
  orderId: string;
  orderTotal: number;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: 'COMPLETED' | 'CANCELLED';
}

export interface CustomerStatsResponse {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  verifiedEmails: number;
  verifiedPhones: number;
  customersByTier: Record<string, number>;
  highValueCustomers: number;
  averageLifetimeValue: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({
    // Direct to customer-service (port 8091) or via gateway (port 8080)
    baseUrl: `${API_CONFIG.CUSTOMER_SERVICE_URL}/customers`,
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
  tagTypes: ['Customer', 'Customers', 'CustomerStats'],
  endpoints: (builder) => ({
    // CREATE
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'Customers',
        'CustomerStats',
        { type: 'Customers', id: `USER_${arg.userId}` },
      ],
    }),

    getOrCreateCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (data) => ({
        url: '/get-or-create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'Customers',
        'CustomerStats',
        { type: 'Customers', id: `USER_${arg.userId}` },
      ],
    }),

    // READ
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),

    getCustomerByUserId: builder.query<Customer, string>({
      query: (userId) => `?userId=${encodeURIComponent(userId)}`,
      transformResponse: (response: Customer[]) => response[0],
      providesTags: (result, error, userId) => (result
        ? [{ type: 'Customer', id: result.id }, { type: 'Customers', id: `USER_${userId}` }]
        : [{ type: 'Customers', id: `USER_${userId}` }]),
    }),

    getCustomerByEmail: builder.query<Customer, string>({
      query: (email) => `?email=${encodeURIComponent(email)}`,
      transformResponse: (response: Customer[]) => response[0],
      providesTags: (result) => (result ? [{ type: 'Customer', id: result.id }] : []),
    }),

    getCustomerByPhone: builder.query<Customer, string>({
      query: (phone) => `?phone=${encodeURIComponent(phone)}`,
      transformResponse: (response: Customer[]) => response[0],
      providesTags: (result) => (result ? [{ type: 'Customer', id: result.id }] : []),
    }),

    getAllCustomers: builder.query<Customer[], string | undefined>({
      query: () => '',
      providesTags: (result, error, storeId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), { type: 'Customers', id: storeId || 'DEFAULT' }]
          : [{ type: 'Customers', id: storeId || 'DEFAULT' }],
    }),

    getActiveCustomers: builder.query<Customer[], string | undefined>({
      query: () => '',
      transformResponse: (response: Customer[]) => response.filter((c) => c.active),
      providesTags: (result, error, storeId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), { type: 'Customers', id: storeId || 'DEFAULT' }]
          : [{ type: 'Customers', id: storeId || 'DEFAULT' }],
    }),

    searchCustomers: builder.query<PageResponse<Customer>, { query: string; page?: number; size?: number }>({
      query: ({ query }) => `?search=${encodeURIComponent(query)}`,
      transformResponse: (response: Customer[], _meta, { page = 0, size = 20 }) => ({
        content: response,
        totalElements: response.length,
        totalPages: Math.max(1, Math.ceil(response.length / size)),
        size,
        number: page,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({ type: 'Customer' as const, id })),
              { type: 'Customers', id: 'SEARCH' },
            ]
          : [{ type: 'Customers', id: 'SEARCH' }],
    }),

    // UPDATE
    updateCustomer: builder.mutation<Customer, { id: string; data: UpdateCustomerRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, 'Customers'],
    }),

    deactivateCustomer: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, 'Customers', 'CustomerStats'],
    }),

    activateCustomer: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, 'Customers', 'CustomerStats'],
    }),

    // ADDRESS MANAGEMENT
    addAddress: builder.mutation<Customer, { customerId: string; data: AddAddressRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}/addresses`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    updateAddress: builder.mutation<Customer, { customerId: string; addressId: string; data: AddAddressRequest }>({
      query: ({ customerId, addressId, data }) => ({
        url: `/${customerId}/addresses/${addressId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: 'Customer', id: result?.id },
        'Customer',
        'Customers',
      ],
    }),

    removeAddress: builder.mutation<Customer, { customerId: string; addressId: string }>({
      query: ({ customerId, addressId }) => ({
        url: `/${customerId}/addresses/${addressId}`,
        method: 'DELETE',
      }),
      // Invalidate all customer-related tags to ensure fresh data everywhere
      invalidatesTags: (result) => [
        { type: 'Customer', id: result?.id },
        'Customer',
        'Customers',
      ],
    }),

    setDefaultAddress: builder.mutation<Customer, { customerId: string; addressId: string }>({
      query: ({ customerId, addressId }) => ({
        url: `/${customerId}/addresses/${addressId}`,
        method: 'PATCH',
        body: { isDefault: true },
      }),
      invalidatesTags: (result) => [
        { type: 'Customer', id: result?.id },
        'Customer',
        'Customers',
      ],
    }),

    // LOYALTY MANAGEMENT
    addLoyaltyPoints: builder.mutation<Customer, { customerId: string; data: AddLoyaltyPointsRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}/loyalty`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    redeemLoyaltyPoints: builder.mutation<
      { customer: Customer; pointsRedeemed: number; discountAmount: number },
      { customerId: string; points: number; orderId: string }
    >({
      query: ({ customerId, points, orderId }) => ({
        url: `/${customerId}/loyalty`,
        method: 'POST',
        body: {
          type: 'REDEEMED',
          points,
          orderId,
          description: `Redeemed ${points} points for order ${orderId}`,
        },
      }),
      transformResponse: (customer: Customer, _meta, { points }) => ({
        customer,
        pointsRedeemed: points,
        discountAmount: Math.floor(points / 2),
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    getMaxRedeemablePoints: builder.query<
      { maxRedeemablePoints: number; maxDiscountAmount: number; redemptionRate: string },
      { customerId: string; orderTotal: number }
    >({
      query: ({ customerId }) => `/${customerId}`,
      transformResponse: (customer: Customer, _meta, { orderTotal }) => {
        const maxRedeemablePoints = Math.min(
          customer.loyaltyInfo.totalPoints,
          Math.floor(orderTotal * 0.5 * 2),
        );
        return {
          maxRedeemablePoints,
          maxDiscountAmount: Math.floor(maxRedeemablePoints / 2),
          redemptionRate: '2:1',
        };
      },
      providesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    getCustomersByTier: builder.query<Customer[], string>({
      query: (tier) => `?tier=${encodeURIComponent(tier)}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    // PREFERENCES
    updatePreferences: builder.mutation<Customer, { customerId: string; data: UpdatePreferencesRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}`,
        method: 'PATCH',
        body: { preferences: data },
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    // ORDER STATS — canonical PATCH /{id}
    updateOrderStats: builder.mutation<Customer, { customerId: string; data: UpdateOrderStatsRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}`,
        method: 'PATCH',
        body: { orderStats: data },
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customer', id: customerId },
        'CustomerStats',
      ],
    }),

    // NOTES — canonical PATCH /{id}
    addNote: builder.mutation<Customer, { customerId: string; data: AddCustomerNoteRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}`,
        method: 'PATCH',
        body: { note: data },
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    // VERIFICATION — canonical PATCH /{id}
    verifyEmail: builder.mutation<Customer, string>({
      query: (customerId) => ({
        url: `/${customerId}`,
        method: 'PATCH',
        body: { emailVerified: true },
      }),
      invalidatesTags: (result, error, customerId) => [{ type: 'Customer', id: customerId }, 'CustomerStats'],
    }),

    verifyPhone: builder.mutation<Customer, string>({
      query: (customerId) => ({
        url: `/${customerId}`,
        method: 'PATCH',
        body: { phoneVerified: true },
      }),
      invalidatesTags: (result, error, customerId) => [{ type: 'Customer', id: customerId }, 'CustomerStats'],
    }),

    // TAGS
    addTags: builder.mutation<Customer, { customerId: string; tags: string[] }>({
      query: ({ customerId, tags }) => ({
        url: `/${customerId}/tags`,
        method: 'POST',
        body: { add: tags },
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    removeTags: builder.mutation<Customer, { customerId: string; tags: string[] }>({
      query: ({ customerId, tags }) => ({
        url: `/${customerId}/tags`,
        method: 'POST',
        body: { remove: tags },
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    getCustomersByTags: builder.query<Customer[], string[]>({
      query: (tags) => `?tag=${encodeURIComponent(tags[0] ?? '')}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    // QUERIES — derived client-side from GET /api/customers (no dedicated backend routes)
    getHighValueCustomers: builder.query<Customer[], number>({
      query: () => '',
      transformResponse: (response: Customer[], _meta, minSpending = 10000) =>
        response
          .filter((c) => c.orderStats.totalSpent >= minSpending)
          .sort((a, b) => b.orderStats.totalSpent - a.orderStats.totalSpent),
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getTopSpenders: builder.query<Customer[], number>({
      query: () => '',
      transformResponse: (response: Customer[], _meta, limit = 10) =>
        [...response].sort((a, b) => b.orderStats.totalSpent - a.orderStats.totalSpent).slice(0, limit),
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getRecentlyActiveCustomers: builder.query<Customer[], number>({
      query: () => '',
      transformResponse: (response: Customer[], _meta, days = 30) => {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return response.filter((c) => {
          const lastOrder = c.lastOrderDate ?? c.orderStats.lastOrderDate;
          return lastOrder ? new Date(lastOrder).getTime() >= cutoff : false;
        });
      },
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getInactiveCustomers: builder.query<Customer[], number>({
      query: () => '',
      transformResponse: (response: Customer[], _meta, days = 90) => {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return response.filter((c) => {
          const lastOrder = c.lastOrderDate ?? c.orderStats.lastOrderDate;
          return !lastOrder || new Date(lastOrder).getTime() < cutoff;
        });
      },
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getBirthdayCustomersToday: builder.query<Customer[], void>({
      query: () => '',
      transformResponse: (response: Customer[]) => {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        return response.filter((c) => {
          if (!c.dateOfBirth) return false;
          const dob = new Date(c.dateOfBirth);
          return dob.getMonth() + 1 === month && dob.getDate() === day;
        });
      },
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getMarketingOptInCustomers: builder.query<Customer[], void>({
      query: () => '',
      transformResponse: (response: Customer[]) => response.filter((c) => c.marketingOptIn),
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getSmsOptInCustomers: builder.query<Customer[], void>({
      query: () => '',
      transformResponse: (response: Customer[]) => response.filter((c) => c.smsOptIn),
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    // STATISTICS
    getCustomerStats: builder.query<CustomerStatsResponse, string | undefined>({
      query: () => '/stats',
      providesTags: (result, error, storeId) => [{ type: 'CustomerStats', id: storeId || 'DEFAULT' }],
    }),

    // DELETE
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, 'Customers', 'CustomerStats'],
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useGetOrCreateCustomerMutation,
  useGetCustomerByIdQuery,
  useGetCustomerByUserIdQuery,
  useGetCustomerByEmailQuery,
  useGetCustomerByPhoneQuery,
  useGetAllCustomersQuery,
  useGetActiveCustomersQuery,
  useSearchCustomersQuery,
  useUpdateCustomerMutation,
  useDeactivateCustomerMutation,
  useActivateCustomerMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  useAddLoyaltyPointsMutation,
  useRedeemLoyaltyPointsMutation,
  useGetMaxRedeemablePointsQuery,
  useGetCustomersByTierQuery,
  useUpdatePreferencesMutation,
  useUpdateOrderStatsMutation,
  useAddNoteMutation,
  useVerifyEmailMutation,
  useVerifyPhoneMutation,
  useAddTagsMutation,
  useRemoveTagsMutation,
  useGetCustomersByTagsQuery,
  useGetHighValueCustomersQuery,
  useGetTopSpendersQuery,
  useGetRecentlyActiveCustomersQuery,
  useGetInactiveCustomersQuery,
  useGetBirthdayCustomersTodayQuery,
  useGetMarketingOptInCustomersQuery,
  useGetSmsOptInCustomersQuery,
  useGetCustomerStatsQuery,
  useDeleteCustomerMutation,
} = customerApi;
