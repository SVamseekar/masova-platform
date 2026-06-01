import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const authHandlers = [
  http.post(`${API}/users/login`, () =>
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

  http.post(`${API}/users/register`, () =>
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

  http.post(`${API}/users/refresh-token`, () =>
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

  http.post(`${API}/users/logout`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/users/profile`, () =>
    HttpResponse.json({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-0123',
      type: 'CUSTOMER',
      isActive: true,
    }),
  ),
];
