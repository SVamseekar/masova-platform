import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

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
  allergens: string[];
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
}

export interface CreateCustomerRequest {
  userId: string;
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
}

export interface AddAddressRequest {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  isDefault?: boolean;
}

export interface UpdatePreferencesRequest {
  favoriteMenuItems?: string[];
  cuisinePreferences?: string[];
  dietaryRestrictions?: string[];
  allergens?: string[];
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
    baseUrl: `${API_CONFIG.CUSTOMER_SERVICE_URL}/api/customers`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
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
      invalidatesTags: ['Customers', 'CustomerStats'],
    }),

    // READ
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),

    getCustomerByUserId: builder.query<Customer, string>({
      query: (userId) => `/user/${userId}`,
      providesTags: (result) => (result ? [{ type: 'Customer', id: result.id }] : []),
    }),

    getCustomerByEmail: builder.query<Customer, string>({
      query: (email) => `/email/${email}`,
      providesTags: (result) => (result ? [{ type: 'Customer', id: result.id }] : []),
    }),

    getCustomerByPhone: builder.query<Customer, string>({
      query: (phone) => `/phone/${phone}`,
      providesTags: (result) => (result ? [{ type: 'Customer', id: result.id }] : []),
    }),

    getAllCustomers: builder.query<Customer[], void>({
      query: () => '',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), { type: 'Customers', id: 'LIST' }]
          : [{ type: 'Customers', id: 'LIST' }],
    }),

    getActiveCustomers: builder.query<Customer[], void>({
      query: () => '/active',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), { type: 'Customers', id: 'ACTIVE' }]
          : [{ type: 'Customers', id: 'ACTIVE' }],
    }),

    searchCustomers: builder.query<PageResponse<Customer>, { query: string; page?: number; size?: number }>({
      query: ({ query, page = 0, size = 20 }) => `/search?query=${query}&page=${page}&size=${size}`,
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
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, 'Customers'],
    }),

    deactivateCustomer: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `/${id}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, 'Customers', 'CustomerStats'],
    }),

    activateCustomer: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `/${id}/activate`,
        method: 'PATCH',
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

    removeAddress: builder.mutation<Customer, { customerId: string; addressId: string }>({
      query: ({ customerId, addressId }) => ({
        url: `/${customerId}/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    setDefaultAddress: builder.mutation<Customer, { customerId: string; addressId: string }>({
      query: ({ customerId, addressId }) => ({
        url: `/${customerId}/addresses/${addressId}/set-default`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    // LOYALTY MANAGEMENT
    addLoyaltyPoints: builder.mutation<Customer, { customerId: string; data: AddLoyaltyPointsRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}/loyalty/points`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    getCustomersByTier: builder.query<Customer[], string>({
      query: (tier) => `/loyalty/tier/${tier}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    // PREFERENCES
    updatePreferences: builder.mutation<Customer, { customerId: string; data: UpdatePreferencesRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}/preferences`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    // ORDER STATS
    updateOrderStats: builder.mutation<Customer, { customerId: string; data: UpdateOrderStatsRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}/order-stats`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customer', id: customerId },
        'CustomerStats',
      ],
    }),

    // NOTES
    addNote: builder.mutation<Customer, { customerId: string; data: AddCustomerNoteRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}/notes`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    // VERIFICATION
    verifyEmail: builder.mutation<Customer, string>({
      query: (customerId) => ({
        url: `/${customerId}/verify-email`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, customerId) => [{ type: 'Customer', id: customerId }, 'CustomerStats'],
    }),

    verifyPhone: builder.mutation<Customer, string>({
      query: (customerId) => ({
        url: `/${customerId}/verify-phone`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, customerId) => [{ type: 'Customer', id: customerId }, 'CustomerStats'],
    }),

    // TAGS
    addTags: builder.mutation<Customer, { customerId: string; tags: string[] }>({
      query: ({ customerId, tags }) => ({
        url: `/${customerId}/tags`,
        method: 'POST',
        body: tags,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    removeTags: builder.mutation<Customer, { customerId: string; tags: string[] }>({
      query: ({ customerId, tags }) => ({
        url: `/${customerId}/tags`,
        method: 'DELETE',
        body: tags,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    getCustomersByTags: builder.query<Customer[], string[]>({
      query: (tags) => `/tags?tags=${tags.join(',')}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    // QUERIES
    getHighValueCustomers: builder.query<Customer[], number>({
      query: (minSpending = 10000) => `/high-value?minSpending=${minSpending}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getTopSpenders: builder.query<Customer[], number>({
      query: (limit = 10) => `/top-spenders?limit=${limit}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getRecentlyActiveCustomers: builder.query<Customer[], number>({
      query: (days = 30) => `/recently-active?days=${days}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getInactiveCustomers: builder.query<Customer[], number>({
      query: (days = 90) => `/inactive?days=${days}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getBirthdayCustomersToday: builder.query<Customer[], void>({
      query: () => '/birthdays/today',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getMarketingOptInCustomers: builder.query<Customer[], void>({
      query: () => '/marketing-opt-in',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    getSmsOptInCustomers: builder.query<Customer[], void>({
      query: () => '/sms-opt-in',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Customer' as const, id })), 'Customers'] : ['Customers'],
    }),

    // STATISTICS
    getCustomerStats: builder.query<CustomerStatsResponse, void>({
      query: () => '/stats',
      providesTags: ['CustomerStats'],
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
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  useAddLoyaltyPointsMutation,
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
