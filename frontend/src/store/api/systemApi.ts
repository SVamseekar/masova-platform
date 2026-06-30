import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

export interface VersionInfo {
  version: string;
  buildDate: string;
  applicationName: string;
  environment: string;
}

export interface UpdateStatus {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  details: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  components: Record<string, string>;
}

export interface SystemInfo {
  version: string;
  buildDate: string;
  updateAvailable: boolean;
  latestVersion: string;
  totalMemory: string;
  freeMemory: string;
  maxMemory: string;
  processors: number;
  javaVersion: string;
  javaVendor: string;
}

export const systemApi = createApi({
  reducerPath: 'systemApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['System'],
  endpoints: (builder) => ({
    getVersion: builder.query<VersionInfo, void>({
      query: () => 'system/version',
      providesTags: ['System'],
    }),

    checkForUpdates: builder.query<UpdateStatus, void>({
      query: () => 'system/updates/check',
      providesTags: ['System'],
    }),

    getUpdateStatus: builder.query<UpdateStatus, void>({
      query: () => 'system/updates/status',
      providesTags: ['System'],
    }),

    getSystemHealth: builder.query<HealthStatus, void>({
      query: () => 'system/health',
      providesTags: ['System'],
    }),

    getSystemInfo: builder.query<SystemInfo, void>({
      query: () => 'system/info',
      providesTags: ['System'],
    }),
  }),
});

export const {
  useGetVersionQuery,
  useCheckForUpdatesQuery,
  useLazyCheckForUpdatesQuery,
  useGetUpdateStatusQuery,
  useGetSystemHealthQuery,
  useGetSystemInfoQuery,
} = systemApi;