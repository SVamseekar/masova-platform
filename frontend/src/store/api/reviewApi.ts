import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../config/api.config';
import type { RootState } from '../store';

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  overallRating: number;
  comment: string;
  foodQualityRating?: number;
  serviceRating?: number;
  deliveryRating?: number;
  driverId?: string;
  driverName?: string;
  driverRating?: number;
  driverComment?: string;
  itemReviews: ItemReview[];
  isAnonymous: boolean;
  isVerifiedPurchase: boolean;
  photoUrls: string[];
  status: ReviewStatus;
  flagReason?: string;
  moderatorId?: string;
  moderatedAt?: string;
  responseId?: string;
  response?: {
    id: string;
    text: string;
    respondedBy: string;
    respondedAt: string;
  }; // Populated response object
  sentiment?: SentimentType;
  sentimentScore?: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface ItemReview {
  menuItemId: string;
  menuItemName: string;
  rating: number;
  comment?: string;
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
  DELETED = 'DELETED',
}

export enum SentimentType {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  MIXED = 'MIXED',
}

export interface CreateReviewRequest {
  orderId: string;
  overallRating: number;
  comment?: string;
  foodQualityRating?: number;
  serviceRating?: number;
  deliveryRating?: number;
  driverId?: string;
  driverRating?: number;
  driverComment?: string;
  itemReviews?: {
    menuItemId: string;
    rating: number;
    comment?: string;
  }[];
  isAnonymous?: boolean;
  photoUrls?: string[];
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  managerId: string;
  managerName: string;
  responseText: string;
  responseType: ResponseType;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
}

export enum ResponseType {
  THANK_YOU = 'THANK_YOU',
  APOLOGY = 'APOLOGY',
  CLARIFICATION = 'CLARIFICATION',
  RESOLUTION_OFFERED = 'RESOLUTION_OFFERED',
  CUSTOM = 'CUSTOM',
}

export interface CreateResponseRequest {
  responseText: string;
  responseType?: ResponseType;
  isTemplate?: boolean;
}

export interface FlagReviewRequest {
  reason: string;
  flagType: FlagType;
}

export enum FlagType {
  SPAM = 'SPAM',
  INAPPROPRIATE_LANGUAGE = 'INAPPROPRIATE_LANGUAGE',
  FAKE_REVIEW = 'FAKE_REVIEW',
  OFFENSIVE_CONTENT = 'OFFENSIVE_CONTENT',
  MISLEADING = 'MISLEADING',
  OTHER = 'OTHER',
}

export interface ReviewStatsResponse {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  averageFoodQualityRating: number;
  averageServiceRating: number;
  averageDeliveryRating: number;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  recentTrendPercentage: number;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
}

export interface DriverRatingResponse {
  driverId: string;
  driverName: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  averageDeliveryRating?: number;
  averageProfessionalismRating?: number;
  positiveReviews: number;
  negativeReviews: number;
  last30DaysRating: number;
  performanceTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface ItemRatingResponse {
  menuItemId: string;
  menuItemName: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  commonPraises: string[];
  commonComplaints: string[];
  trendStatus: 'TRENDING_UP' | 'TRENDING_DOWN' | 'STABLE';
  recentRatingChange: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
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
  tagTypes: ['Review', 'ReviewResponse', 'ReviewStats'],
  endpoints: (builder) => ({
    // Create review
    createReview: builder.mutation<Review, CreateReviewRequest>({
      query: (body) => ({
        url: '/api/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Review', 'ReviewStats'],
    }),

    // Get review by ID
    getReviewById: builder.query<Review, string>({
      query: (reviewId) => `/api/reviews/${reviewId}`,
      providesTags: (result, error, id) => [{ type: 'Review', id }],
    }),

    // Get reviews by order ID
    getReviewsByOrderId: builder.query<Review[], string>({
      query: (orderId) => `/api/reviews?orderId=${orderId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Review' as const, id })), 'Review']
          : ['Review'],
    }),

    // Get reviews by customer ID
    getReviewsByCustomerId: builder.query<
      PagedResponse<Review>,
      { customerId: string; page?: number; size?: number }
    >({
      query: ({ customerId, page = 0, size = 20 }) =>
        `/api/reviews?customerId=${customerId}&page=${page}&size=${size}`,
      providesTags: ['Review'],
    }),

    // Get reviews by driver ID
    getReviewsByDriverId: builder.query<
      PagedResponse<Review>,
      { driverId: string; page?: number; size?: number }
    >({
      query: ({ driverId, page = 0, size = 20 }) =>
        `/api/reviews?driverId=${driverId}&page=${page}&size=${size}`,
      providesTags: ['Review'],
    }),

    // Get reviews by menu item ID
    getReviewsByMenuItemId: builder.query<
      PagedResponse<Review>,
      { menuItemId: string; page?: number; size?: number }
    >({
      query: ({ menuItemId, page = 0, size = 20 }) =>
        `/api/reviews?menuItemId=${menuItemId}&page=${page}&size=${size}`,
      providesTags: ['Review'],
    }),

    // Get recent reviews
    getRecentReviews: builder.query<
      PagedResponse<Review>,
      { storeId?: string; page?: number; size?: number }
    >({
      query: ({ storeId, page = 0, size = 20 }) => {
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append("recent","true"); return `/api/reviews?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Review', id: storeId || 'DEFAULT' }],
    }),

    // Get reviews needing response
    getReviewsNeedingResponse: builder.query<
      PagedResponse<Review>,
      { storeId?: string; page?: number; size?: number }
    >({
      query: ({ storeId, page = 0, size = 20 }) => {
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append("needsResponse","true"); return `/api/reviews?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Review', id: storeId || 'DEFAULT' }],
    }),

    // Flag review
    flagReview: builder.mutation<Review, { reviewId: string; request: FlagReviewRequest }>({
      query: ({ reviewId, request }) => ({
        url: `/api/reviews/${reviewId}`,
        method: 'PATCH',
        body: request,
      }),
      invalidatesTags: (result, error, { reviewId }) => [{ type: 'Review', id: reviewId }],
    }),

    // Update review status
    updateReviewStatus: builder.mutation<
      Review,
      { reviewId: string; status: ReviewStatus }
    >({
      query: ({ reviewId, status }) => ({
        url: `/api/reviews/${reviewId}`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { reviewId }) => [{ type: 'Review', id: reviewId }],
    }),

    // Delete review
    deleteReview: builder.mutation<{ message: string }, string>({
      query: (reviewId) => ({
        url: `/api/reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Review', id }, 'Review'],
    }),

    // Get overall stats
    getOverallStats: builder.query<ReviewStatsResponse, string | undefined>({
      query: (storeId) => `/api/reviews/stats${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'ReviewStats', id: storeId || 'DEFAULT' }],
    }),

    // Get driver rating
    getDriverRating: builder.query<DriverRatingResponse, string>({
      query: (driverId) => `/api/reviews/stats?driverId=${driverId}`,
      providesTags: (result, error, id) => [{ type: 'ReviewStats', id }],
    }),

    // Get staff rating
    getStaffRating: builder.query<{
      staffId: string;
      staffName: string | null;
      averageRating: number;
      totalReviews: number;
    }, string>({
      query: (staffId) => `/api/reviews/stats?staffId=${staffId}`,
      providesTags: (result, error, id) => [{ type: 'ReviewStats', id: `staff-${id}` }],
    }),

    // Get reviews by staff
    getReviewsByStaffId: builder.query<{
      content: Review[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }, { staffId: string; page?: number; size?: number }>({
      query: ({ staffId, page = 0, size = 20 }) =>
        `/api/reviews?staffId=${staffId}&page=${page}&size=${size}`,
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({ type: 'Review' as const, id })),
              { type: 'Review', id: 'LIST' },
            ]
          : [{ type: 'Review', id: 'LIST' }],
    }),

    // Get item rating
    getItemRating: builder.query<ItemRatingResponse, string>({
      query: (menuItemId) => `/api/reviews/stats?menuItemId=${menuItemId}`,
      providesTags: (result, error, id) => [{ type: 'ReviewStats', id }],
    }),

    // Get public item rating (no auth required)
    getPublicItemRating: builder.query<
      { menuItemId: string; averageRating: number; totalReviews: number },
      string
    >({
      query: (menuItemId) => `/api/reviews/public/token/${menuItemId}`,
    }),

    // Response endpoints
    createResponse: builder.mutation<
      ReviewResponse,
      { reviewId: string; request: CreateResponseRequest }
    >({
      query: ({ reviewId, request }) => ({
        url: `/api/reviews/${reviewId}/response`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'Review', id: reviewId },
        'ReviewResponse',
      ],
    }),

    getResponseByReviewId: builder.query<ReviewResponse, string>({
      query: (reviewId) => `/api/reviews/${reviewId}/response`,
      providesTags: (result, error, id) => [{ type: 'ReviewResponse', id }],
    }),

    getResponseTemplates: builder.query<Record<ResponseType, string>, void>({
      query: () => '/api/reviews/response-templates',
    }),

    updateResponse: builder.mutation<
      ReviewResponse,
      { responseId: string; responseText: string }
    >({
      query: ({ responseId, responseText }) => ({
        url: `/api/reviews/response/${responseId}`,
        method: 'PUT',
        body: { responseText },
      }),
      invalidatesTags: (result, error, { responseId }) => [
        { type: 'ReviewResponse', id: responseId },
      ],
    }),

    deleteResponse: builder.mutation<{ message: string }, string>({
      query: (responseId) => ({
        url: `/api/reviews/response/${responseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'ReviewResponse', id }],
    }),

    // Moderation endpoints
    getPendingReviews: builder.query<
      PagedResponse<Review>,
      { storeId?: string; page?: number; size?: number }
    >({
      query: ({ storeId, page = 0, size = 20 }) => {
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append("status","PENDING"); return `/api/reviews?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Review', id: storeId || 'DEFAULT' }],
    }),

    getFlaggedReviews: builder.query<
      PagedResponse<Review>,
      { storeId?: string; page?: number; size?: number }
    >({
      query: ({ storeId, page = 0, size = 20 }) => {
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append("status","FLAGGED"); return `/api/reviews?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Review', id: storeId || 'DEFAULT' }],
    }),

    approveReview: builder.mutation<Review, string>({
      query: (reviewId) => ({
        url: `/api/reviews/${reviewId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Review', id }, 'Review'],
    }),

    rejectReview: builder.mutation<Review, { reviewId: string; reason: string }>({
      query: ({ reviewId, reason }) => ({
        url: `/api/reviews/${reviewId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'Review', id: reviewId },
        'Review',
      ],
    }),
  }),
});

export const {
  useCreateReviewMutation,
  useGetReviewByIdQuery,
  useGetReviewsByOrderIdQuery,
  useGetReviewsByCustomerIdQuery,
  useGetReviewsByDriverIdQuery,
  useGetReviewsByMenuItemIdQuery,
  useGetRecentReviewsQuery,
  useGetReviewsNeedingResponseQuery,
  useFlagReviewMutation,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
  useGetOverallStatsQuery,
  useGetDriverRatingQuery,
  useGetStaffRatingQuery,
  useGetReviewsByStaffIdQuery,
  useGetItemRatingQuery,
  useGetPublicItemRatingQuery,
  useCreateResponseMutation,
  useGetResponseByReviewIdQuery,
  useGetResponseTemplatesQuery,
  useUpdateResponseMutation,
  useDeleteResponseMutation,
  useGetPendingReviewsQuery,
  useGetFlaggedReviewsQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
} = reviewApi;
