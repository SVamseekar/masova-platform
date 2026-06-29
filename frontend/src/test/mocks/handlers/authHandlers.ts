import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';


export const authHandlers = [
  http.post(apiUrl('/users/login'), () =>
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

  http.post(apiUrl('/users/register'), () =>
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

  http.post(apiUrl('/users/refresh-token'), () =>
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

  http.post(apiUrl('/users/logout'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(apiUrl('/users/profile'), () =>
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
