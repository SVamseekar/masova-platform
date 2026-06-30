import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

export interface TipRequest {
  amountInr: number;
  recipientStaffId?: string;
}

export interface TipResponse {
  tipId: string;
  orderId: string;
  orderNumber: string;
  amountInr: number;
  tipType: string;
  recipientStaffId?: string;
  distributed: boolean;
  createdAt: string;
}

export const tipApi = createApi({
  reducerPath: 'tipApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Tip', 'PendingTips'],
  endpoints: (builder) => ({
    addOrderTip: builder.mutation<TipResponse, { orderId: string; tip: TipRequest }>({
      query: ({ orderId, tip }) => ({
        url: `orders/${orderId}/tip`,
        method: 'POST',
        body: tip,
      }),
      invalidatesTags: ['Tip', 'PendingTips'],
    }),

    getPendingTips: builder.query<TipResponse[], string>({
      query: (employeeId) =>
        `staff/tips/pending?employeeId=${encodeURIComponent(employeeId)}`,
      providesTags: (result, error, employeeId) => [{ type: 'PendingTips', id: employeeId }],
    }),
  }),
});

export const {
  useAddOrderTipMutation,
  useGetPendingTipsQuery,
} = tipApi;