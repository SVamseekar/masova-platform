import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

export const authHandlers = [
  http.post(apiUrl('/auth/login'), () =>
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

  http.post(apiUrl('/auth/register'), () =>
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

  http.post(apiUrl('/auth/refresh'), () =>
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

  http.post(apiUrl('/auth/logout'), () =>
    new HttpResponse(null, { status: 204 }),
  ),
];