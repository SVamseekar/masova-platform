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
    getEquipmentByStore: builder.query<KitchenEquipment[], void>({
      query: () => `/api/kitchen-equipment/store`,
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
    getEquipmentByStatus: builder.query<KitchenEquipment[], { status: KitchenEquipment['status'] }>({
      query: ({ status }) => `/api/kitchen-equipment/store/status/${status}`,
      providesTags: ['Equipment'],
    }),

    // Get equipment needing maintenance
    getEquipmentNeedingMaintenance: builder.query<KitchenEquipment[], void>({
      query: () => `/api/kitchen-equipment/store/maintenance-needed`,
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
    resetUsageCounts: builder.mutation<void, void>({
      query: () => ({
        url: `/api/kitchen-equipment/store/reset-usage`,
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
