import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const mockUsers = [
  {
    id: '1',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '555-0123',
    type: 'CUSTOMER',
    isActive: true,
    storeId: undefined,
  },
  {
    id: '2',
    name: 'Staff Member',
    email: 'staff@example.com',
    phone: '555-0456',
    type: 'STAFF',
    isActive: true,
    storeId: '1',
  },
  {
    id: '3',
    name: 'Manager User',
    email: 'manager@example.com',
    phone: '555-0789',
    type: 'MANAGER',
    isActive: true,
    storeId: '1',
  },
];

export const userHandlers = [
  http.get(`${API}/api/users`, () =>
    HttpResponse.json(mockUsers),
  ),

  http.get(`${API}/api/users/:userId`, ({ params }) =>
    HttpResponse.json(mockUsers.find((u) => u.id === params.userId) ?? mockUsers[0]),
  ),

  http.patch(`${API}/api/users/:userId`, ({ params }) =>
    HttpResponse.json({ ...mockUsers[0], id: params.userId }),
  ),

  http.post(`${API}/api/users/:userId/activate`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/users/:userId/deactivate`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/users/:userId/generate-pin`, () =>
    HttpResponse.json({ pin: '1234', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }),
  ),

  http.get(`${API}/api/users/:userId/status`, () =>
    HttpResponse.json({ status: 'ACTIVE', lastSeen: new Date().toISOString() }),
  ),

  http.patch(`${API}/api/users/:userId/status`, () =>
    HttpResponse.json({ status: 'ACTIVE' }),
  ),

  http.get(`${API}/api/users/:userId/can-take-orders`, () =>
    HttpResponse.json({ canTakeOrders: true }),
  ),

  http.post(`${API}/api/users/kiosk`, () =>
    HttpResponse.json({ ...mockUsers[1], id: '99', type: 'KIOSK' }),
  ),

  http.get(`${API}/api/users/kiosk`, () =>
    HttpResponse.json([{ ...mockUsers[1], id: '99', type: 'KIOSK' }]),
  ),

  http.post(`${API}/api/users/kiosk/:id/regenerate`, () =>
    HttpResponse.json({ token: 'new-kiosk-token' }),
  ),

  http.post(`${API}/api/users/kiosk/:id/deactivate`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
