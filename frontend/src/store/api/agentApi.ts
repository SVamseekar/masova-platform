import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  customerId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

export interface AgentTriggerResult {
  [key: string]: unknown;
}

export interface ReviewTriggerRequest {
  reviewId: string;
  rating: number;
  text: string;
  storeId: string;
  orderId?: string;
}

export const agentApi = createApi({
  reducerPath: 'agentApi',
  baseQuery: fetchBaseQuery({ baseUrl: AGENT_URL }),
  tagTypes: ['AgentHealth'],
  endpoints: (builder) => ({
    chat: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: '/agent/chat',
        method: 'POST',
        body,
      }),
    }),
    getHealth: builder.query<{ status: string; service: string }, void>({
      query: () => '/health',
      providesTags: ['AgentHealth'],
    }),
    triggerDemandForecast: builder.mutation<AgentTriggerResult, void>({
      query: () => ({ url: '/agents/demand-forecast/trigger', method: 'POST' }),
    }),
    triggerInventoryReorder: builder.mutation<AgentTriggerResult, void>({
      query: () => ({ url: '/agents/inventory-reorder/trigger', method: 'POST' }),
    }),
    triggerChurnPrevention: builder.mutation<AgentTriggerResult, void>({
      query: () => ({ url: '/agents/churn-prevention/trigger', method: 'POST' }),
    }),
    triggerReviewResponse: builder.mutation<AgentTriggerResult, ReviewTriggerRequest>({
      query: (body) => ({ url: '/agents/review-response/trigger', method: 'POST', body }),
    }),
    triggerShiftOptimisation: builder.mutation<AgentTriggerResult, void>({
      query: () => ({ url: '/agents/shift-optimisation/trigger', method: 'POST' }),
    }),
    triggerKitchenCoach: builder.mutation<AgentTriggerResult, void>({
      query: () => ({ url: '/agents/kitchen-coach/trigger', method: 'POST' }),
    }),
    triggerDynamicPricing: builder.mutation<AgentTriggerResult, void>({
      query: () => ({ url: '/agents/dynamic-pricing/trigger', method: 'POST' }),
    }),
  }),
});

export const {
  useChatMutation,
  useGetHealthQuery,
  useTriggerDemandForecastMutation,
  useTriggerInventoryReorderMutation,
  useTriggerChurnPreventionMutation,
  useTriggerReviewResponseMutation,
  useTriggerShiftOptimisationMutation,
  useTriggerKitchenCoachMutation,
  useTriggerDynamicPricingMutation,
} = agentApi;
