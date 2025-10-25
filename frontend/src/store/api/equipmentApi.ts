import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface KitchenEquipment {
  id: string;
  storeId: string;
  equipmentName: string;
  type: 'OVEN' | 'STOVE' | 'GRILL' | 'FRYER' | 'REFRIGERATOR' | 'FREEZER' | 'MIXER' | 'DISHWASHER' | 'OTHER';
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN' | 'CLEANING';
  temperature?: number;
  isOn: boolean;
  usageCount: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceNotes?: string;
  lastStatusChange?: string;
  statusChangedBy?: string;
  statusNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const equipmentApi = createApi({
  reducerPath: 'equipmentApi',
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
  tagTypes: ['Equipment'],
  endpoints: (builder) => ({
    // Create equipment
    createEquipment: builder.mutation<KitchenEquipment, Partial<KitchenEquipment>>({
      query: (equipment) => ({
        url: '/api/kitchen-equipment',
        method: 'POST',
        body: equipment,
      }),
      invalidatesTags: ['Equipment'],
    }),

    // Get equipment by store
    getEquipmentByStore: builder.query<KitchenEquipment[], string>({
      query: (storeId) => `/api/kitchen-equipment/store/${storeId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Equipment' as const, id })), { type: 'Equipment', id: 'LIST' }]
          : [{ type: 'Equipment', id: 'LIST' }],
    }),

    // Get equipment by ID
    getEquipmentById: builder.query<KitchenEquipment, string>({
      query: (equipmentId) => `/api/kitchen-equipment/${equipmentId}`,
      providesTags: (result, error, id) => [{ type: 'Equipment', id }],
    }),

    // Update equipment status
    updateEquipmentStatus: builder.mutation<KitchenEquipment, { equipmentId: string; status: KitchenEquipment['status']; staffId: string; notes?: string }>({
      query: ({ equipmentId, status, staffId, notes }) => ({
        url: `/api/kitchen-equipment/${equipmentId}/status`,
        method: 'PATCH',
        body: { status, staffId, notes },
      }),
      invalidatesTags: (result, error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    // Toggle equipment power
    toggleEquipmentPower: builder.mutation<KitchenEquipment, { equipmentId: string; isOn: boolean; staffId: string }>({
      query: ({ equipmentId, isOn, staffId }) => ({
        url: `/api/kitchen-equipment/${equipmentId}/power`,
        method: 'PATCH',
        body: { isOn, staffId },
      }),
      invalidatesTags: (result, error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    // Update temperature
    updateTemperature: builder.mutation<KitchenEquipment, { equipmentId: string; temperature: number }>({
      query: ({ equipmentId, temperature }) => ({
        url: `/api/kitchen-equipment/${equipmentId}/temperature`,
        method: 'PATCH',
        body: { temperature },
      }),
      invalidatesTags: (result, error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    // Record maintenance
    recordMaintenance: builder.mutation<KitchenEquipment, { equipmentId: string; nextMaintenanceDate: string; notes: string }>({
      query: ({ equipmentId, nextMaintenanceDate, notes }) => ({
        url: `/api/kitchen-equipment/${equipmentId}/maintenance`,
        method: 'POST',
        body: { nextMaintenanceDate, notes },
      }),
      invalidatesTags: (result, error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    // Get equipment by status
    getEquipmentByStatus: builder.query<KitchenEquipment[], { storeId: string; status: KitchenEquipment['status'] }>({
      query: ({ storeId, status }) => `/api/kitchen-equipment/store/${storeId}/status/${status}`,
      providesTags: ['Equipment'],
    }),

    // Get equipment needing maintenance
    getEquipmentNeedingMaintenance: builder.query<KitchenEquipment[], string>({
      query: (storeId) => `/api/kitchen-equipment/store/${storeId}/maintenance-needed`,
      providesTags: ['Equipment'],
    }),

    // Delete equipment
    deleteEquipment: builder.mutation<void, string>({
      query: (equipmentId) => ({
        url: `/api/kitchen-equipment/${equipmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Equipment'],
    }),

    // Reset usage counts
    resetUsageCounts: builder.mutation<void, string>({
      query: (storeId) => ({
        url: `/api/kitchen-equipment/store/${storeId}/reset-usage`,
        method: 'POST',
      }),
      invalidatesTags: ['Equipment'],
    }),
  }),
});

export const {
  useCreateEquipmentMutation,
  useGetEquipmentByStoreQuery,
  useGetEquipmentByIdQuery,
  useUpdateEquipmentStatusMutation,
  useToggleEquipmentPowerMutation,
  useUpdateTemperatureMutation,
  useRecordMaintenanceMutation,
  useGetEquipmentByStatusQuery,
  useGetEquipmentNeedingMaintenanceQuery,
  useDeleteEquipmentMutation,
  useResetUsageCountsMutation,
} = equipmentApi;
