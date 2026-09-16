import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

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

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
        if (user.storeId) {
          headers.set('X-User-Store-Id', user.storeId);
        }
      }

      if (selectedStoreId) {
        headers.set('X-Selected-Store-Id', selectedStoreId);
      }

      return headers;
    },
  }),
  tagTypes: ['Equipment'],
  endpoints: (builder) => ({
    createEquipment: builder.mutation<KitchenEquipment, Partial<KitchenEquipment>>({
      query: (equipment) => ({
        url: '/equipment',
        method: 'POST',
        body: equipment,
      }),
      invalidatesTags: ['Equipment'],
    }),

    getEquipmentByStore: builder.query<KitchenEquipment[], string | undefined>({
      query: (storeId) =>
        `/equipment${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ''}`,
      providesTags: (result, _error, storeId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Equipment' as const, id })), { type: 'Equipment', id: storeId || 'DEFAULT' }]
          : [{ type: 'Equipment', id: storeId || 'DEFAULT' }],
    }),

    getEquipmentById: builder.query<KitchenEquipment, string>({
      query: (equipmentId) => `/equipment/${equipmentId}`,
      providesTags: (_result, _error, id) => [{ type: 'Equipment', id }],
    }),

    updateEquipmentStatus: builder.mutation<KitchenEquipment, { equipmentId: string; status: KitchenEquipment['status']; staffId: string; notes?: string }>({
      query: ({ equipmentId, status, staffId, notes }) => ({
        url: `/equipment/${equipmentId}`,
        method: 'PATCH',
        body: { status, staffId, notes },
      }),
      invalidatesTags: (_result, _error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    toggleEquipmentPower: builder.mutation<KitchenEquipment, { equipmentId: string; isOn: boolean; staffId: string }>({
      query: ({ equipmentId, isOn, staffId }) => ({
        url: `/equipment/${equipmentId}`,
        method: 'PATCH',
        body: { isOn, staffId },
      }),
      invalidatesTags: (_result, _error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    updateTemperature: builder.mutation<KitchenEquipment, { equipmentId: string; temperature: number }>({
      query: ({ equipmentId, temperature }) => ({
        url: `/equipment/${equipmentId}`,
        method: 'PATCH',
        body: { temperature },
      }),
      invalidatesTags: (_result, _error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    recordMaintenance: builder.mutation<KitchenEquipment, { equipmentId: string; nextMaintenanceDate: string; notes: string }>({
      query: ({ equipmentId, nextMaintenanceDate, notes }) => ({
        url: `/equipment/${equipmentId}/maintenance`,
        method: 'POST',
        body: { nextMaintenanceDate, notes },
      }),
      invalidatesTags: (_result, _error, { equipmentId }) => [
        { type: 'Equipment', id: equipmentId },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    getEquipmentByStatus: builder.query<KitchenEquipment[], { status: KitchenEquipment['status'] }>({
      query: ({ status }) => `/equipment?status=${status}`,
      providesTags: ['Equipment'],
    }),

    getEquipmentNeedingMaintenance: builder.query<KitchenEquipment[], string | undefined>({
      query: (storeId) => {
        const p = new URLSearchParams({ maintenanceNeeded: 'true' });
        if (storeId) p.set('storeId', storeId);
        return `/equipment?${p.toString()}`;
      },
      providesTags: (_result, _error, storeId) => [{ type: 'Equipment', id: storeId || 'DEFAULT' }],
    }),

    deleteEquipment: builder.mutation<void, string>({
      query: (equipmentId) => ({
        url: `/equipment/${equipmentId}`,
        method: 'DELETE',
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
} = equipmentApi;