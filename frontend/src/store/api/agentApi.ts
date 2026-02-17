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

export const agentApi = createApi({
  reducerPath: 'agentApi',
  baseQuery: fetchBaseQuery({ baseUrl: AGENT_URL }),
  endpoints: (builder) => ({
    chat: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: '/agent/chat',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useChatMutation } = agentApi;
