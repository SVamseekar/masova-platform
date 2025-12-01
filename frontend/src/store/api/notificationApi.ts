import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  priority: NotificationPriority;
  templateId?: string;
  templateData?: Record<string, any>;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceToken?: string;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_PREPARING = 'ORDER_PREPARING',
  ORDER_READY = 'ORDER_READY',
  ORDER_PICKED_UP = 'ORDER_PICKED_UP',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  REVIEW_REQUEST = 'REVIEW_REQUEST',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  KITCHEN_ALERT = 'KITCHEN_ALERT',
  PROMOTIONAL = 'PROMOTIONAL',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface UserPreferences {
  id: string;
  userId: string;
  email?: string;
  phone?: string;
  deviceToken?: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  typePreferences?: Record<string, ChannelPreference>;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  respectQuietHours: boolean;
  marketingEnabled: boolean;
  promotionalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelPreference {
  sms: boolean;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  channel: NotificationChannel;
  templateId?: string;
  subject: string;
  message: string;
  status: CampaignStatus;
  scheduledFor?: string;
  segment?: CustomerSegment;
  targetUserIds?: string[];
  totalRecipients?: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  completedAt?: string;
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export interface CustomerSegment {
  type: SegmentType;
  filters?: Record<string, any>;
}

export enum SegmentType {
  ALL_CUSTOMERS = 'ALL_CUSTOMERS',
  NEW_CUSTOMERS = 'NEW_CUSTOMERS',
  FREQUENT_CUSTOMERS = 'FREQUENT_CUSTOMERS',
  INACTIVE_CUSTOMERS = 'INACTIVE_CUSTOMERS',
  HIGH_VALUE_CUSTOMERS = 'HIGH_VALUE_CUSTOMERS',
  CUSTOM = 'CUSTOM',
}

export interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceToken?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Notification', 'Preferences', 'Campaign'],
  endpoints: (builder) => ({
    // Notification endpoints
    sendNotification: builder.mutation<Notification, NotificationRequest>({
      query: (notification) => ({
        url: '/notifications/send',
        method: 'POST',
        body: notification,
      }),
      invalidatesTags: ['Notification'],
    }),

    getUserNotifications: builder.query<PageResponse<Notification>, { userId: string; page?: number; size?: number }>({
      query: ({ userId, page = 0, size = 20 }) =>
        `/notifications/user/${userId}?page=${page}&size=${size}`,
      providesTags: ['Notification'],
    }),

    getUnreadNotifications: builder.query<Notification[], string>({
      query: (userId) => `/notifications/user/${userId}/unread`,
      providesTags: ['Notification'],
    }),

    getUnreadCount: builder.query<number, string>({
      query: (userId) => `/notifications/user/${userId}/unread-count`,
      providesTags: ['Notification'],
    }),

    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    markAllAsRead: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/notifications/user/${userId}/read-all`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Preferences endpoints
    getUserPreferences: builder.query<UserPreferences, string>({
      query: (userId) => `/preferences/user/${userId}`,
      providesTags: ['Preferences'],
    }),

    updateUserPreferences: builder.mutation<UserPreferences, { userId: string; preferences: Partial<UserPreferences> }>({
      query: ({ userId, preferences }) => ({
        url: `/preferences/user/${userId}`,
        method: 'PUT',
        body: preferences,
      }),
      invalidatesTags: ['Preferences'],
    }),

    updateChannelPreference: builder.mutation<UserPreferences, { userId: string; channel: string; enabled: boolean }>({
      query: ({ userId, channel, enabled }) => ({
        url: `/preferences/user/${userId}/channel/${channel}?enabled=${enabled}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Preferences'],
    }),

    updateDeviceToken: builder.mutation<UserPreferences, { userId: string; deviceToken: string }>({
      query: ({ userId, deviceToken }) => ({
        url: `/preferences/user/${userId}/device-token`,
        method: 'PATCH',
        body: { deviceToken },
      }),
      invalidatesTags: ['Preferences'],
    }),

    // Campaign endpoints
    createCampaign: builder.mutation<Campaign, Partial<Campaign>>({
      query: (campaign) => ({
        url: '/campaigns',
        method: 'POST',
        body: campaign,
      }),
      invalidatesTags: ['Campaign'],
    }),

    updateCampaign: builder.mutation<Campaign, { id: string; campaign: Partial<Campaign> }>({
      query: ({ id, campaign }) => ({
        url: `/campaigns/${id}`,
        method: 'PUT',
        body: campaign,
      }),
      invalidatesTags: ['Campaign'],
    }),

    scheduleCampaign: builder.mutation<void, { id: string; scheduledFor: string }>({
      query: ({ id, scheduledFor }) => ({
        url: `/campaigns/${id}/schedule`,
        method: 'POST',
        body: { scheduledFor },
      }),
      invalidatesTags: ['Campaign'],
    }),

    executeCampaign: builder.mutation<void, string>({
      query: (id) => ({
        url: `/campaigns/${id}/execute`,
        method: 'POST',
      }),
      invalidatesTags: ['Campaign'],
    }),

    cancelCampaign: builder.mutation<void, string>({
      query: (id) => ({
        url: `/campaigns/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Campaign'],
    }),

    getAllCampaigns: builder.query<PageResponse<Campaign>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 20 }) => `/campaigns?page=${page}&size=${size}`,
      providesTags: ['Campaign'],
    }),

    getCampaign: builder.query<Campaign, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: ['Campaign'],
    }),

    deleteCampaign: builder.mutation<void, string>({
      query: (id) => ({
        url: `/campaigns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Campaign'],
    }),
  }),
});

export const {
  useSendNotificationMutation,
  useGetUserNotificationsQuery,
  useGetUnreadNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useUpdateChannelPreferenceMutation,
  useUpdateDeviceTokenMutation,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useScheduleCampaignMutation,
  useExecuteCampaignMutation,
  useCancelCampaignMutation,
  useGetAllCampaignsQuery,
  useGetCampaignQuery,
  useDeleteCampaignMutation,
} = notificationApi;
