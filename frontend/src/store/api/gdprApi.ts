import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

/** Values of the backend ConsentType enum. */
export type ConsentType =
  | 'TERMS_AND_CONDITIONS'
  | 'PRIVACY_POLICY'
  | 'COOKIE_POLICY'
  | 'MARKETING_COMMUNICATIONS'
  | 'DATA_PROCESSING'
  | 'THIRD_PARTY_SHARING'
  | 'ANALYTICS_TRACKING'
  | 'PERSONALIZATION'
  | 'LOCATION_TRACKING'
  | 'NOTIFICATIONS'
  | 'PROFILING';

/** Processing action a manager applies to a request. */
export type GdprRequestType = 'access' | 'erasure' | 'portability' | 'rectification';
/** Values of the backend GdprRequestType enum that a person can file. */
export type GdprRequestKind = 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'DATA_PORTABILITY';

export interface GdprConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  version: string;
  status: 'GRANTED' | 'REVOKED' | 'WITHDRAWN' | 'EXPIRED' | 'PENDING';
  grantedAt?: string;
  revokedAt?: string;
  consentText?: string;
}

export interface GdprDataRequest {
  id: string;
  userId: string;
  requestType: string;
  status: string;
  reason?: string;
  createdAt: string;
  requestedAt?: string;
  completedAt?: string;
  dueDate?: string;
  processedAt?: string;
}

export interface GdprAuditLog {
  id: string;
  userId: string;
  action: string;
  details?: string;
  performedBy?: string;
  timestamp: string;
}

export interface GdprConsentRequest {
  userId: string;
  consentType: ConsentType;
  version: string;
  consentText?: string;
}

export interface GdprDataRequestDto {
  userId: string;
  requestType: GdprRequestKind;
  reason?: string;
}

export interface GdprExportPackage {
  userId: string;
  exportedAt: string;
  /** False when a service that holds part of the data could not be read. */
  complete?: boolean;
  errors?: string[];
  profile?: Record<string, unknown>;
  orders?: unknown[];
  consents?: GdprConsent[];
}

export const gdprApi = createApi({
  reducerPath: 'gdprApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['GdprConsent', 'GdprRequest', 'GdprAudit'],
  endpoints: (builder) => ({
    getConsents: builder.query<GdprConsent[], string>({
      query: (userId) => `/gdpr/consent?userId=${encodeURIComponent(userId)}`,
      providesTags: (result, error, userId) => [{ type: 'GdprConsent', id: userId }],
    }),

    grantConsent: builder.mutation<GdprConsent, GdprConsentRequest>({
      query: (body) => ({
        url: '/gdpr/consent',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'GdprConsent', id: userId }],
    }),

    revokeConsent: builder.mutation<GdprConsent, { userId: string; consentType: ConsentType }>({
      query: (body) => ({
        url: '/gdpr/consent',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'GdprConsent', id: userId }],
    }),

    createGdprRequest: builder.mutation<GdprDataRequest, GdprDataRequestDto>({
      query: (body) => ({
        url: '/gdpr/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'GdprRequest', id: userId }],
    }),

    getGdprRequests: builder.query<GdprDataRequest[], string>({
      query: (userId) => `/gdpr/request?userId=${encodeURIComponent(userId)}`,
      providesTags: (result, error, userId) => [{ type: 'GdprRequest', id: userId }],
    }),

    processGdprRequest: builder.mutation<unknown, { requestId: string; type: GdprRequestType; updates?: Record<string, unknown> }>({
      query: ({ requestId, type, updates }) => ({
        url: `/gdpr/request/${requestId}/process`,
        method: 'POST',
        body: { type, updates },
      }),
      invalidatesTags: ['GdprRequest'],
    }),

    exportUserData: builder.query<GdprExportPackage, string>({
      query: (userId) => `/gdpr/export/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'GdprRequest', id: `export-${userId}` }],
    }),

    getGdprAuditLog: builder.query<GdprAuditLog[], string>({
      query: (userId) => `/gdpr/audit/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'GdprAudit', id: userId }],
    }),
  }),
});

export const {
  useGetConsentsQuery,
  useGrantConsentMutation,
  useRevokeConsentMutation,
  useCreateGdprRequestMutation,
  useGetGdprRequestsQuery,
  useProcessGdprRequestMutation,
  useExportUserDataQuery,
  useLazyExportUserDataQuery,
  useGetGdprAuditLogQuery,
} = gdprApi;