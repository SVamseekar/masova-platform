import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const authHandlers = [
  http.post(`${API}/api/auth/login`, () =>
    HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        type: 'CUSTOMER',
        isActive: true,
      },
    }),
  ),

  http.post(`${API}/api/auth/register`, () =>
    HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        name: 'New User',
        email: 'newuser@example.com',
        phone: '555-0999',
        type: 'CUSTOMER',
        isActive: true,
      },
    }),
  ),

  http.post(`${API}/api/auth/refresh`, () =>
    HttpResponse.json({
      accessToken: 'mock-refreshed-access-token',
      refreshToken: 'mock-refreshed-refresh-token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        type: 'CUSTOMER',
        isActive: true,
      },
    }),
  ),

  http.post(`${API}/api/auth/logout`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/auth/validate-pin`, () =>
    HttpResponse.json({ userId: '2', name: 'Staff Member', type: 'STAFF', role: 'CASHIER', storeId: '1' }),
  ),

  http.post(`${API}/api/auth/change-password`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/auth/google`, () =>
    HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: '1', name: 'Google User', email: 'google@example.com', type: 'CUSTOMER', isActive: true },
    }),
  ),
];
