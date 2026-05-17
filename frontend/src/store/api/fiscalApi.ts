import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

// No FiscalController exists in any backend service — this file is a stub
// Fiscal signing is internal to commerce-service and not exposed via REST to the frontend

export const fiscalApi = createApi({
  reducerPath: 'fiscalApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: [],
  endpoints: () => ({}),
});
