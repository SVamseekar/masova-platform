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
  http.get(`${API}/users/profile`, () =>
    HttpResponse.json(mockUsers[0]),
  ),

  http.put(`${API}/users/profile`, () =>
    HttpResponse.json(mockUsers[0]),
  ),

  http.post(`${API}/users/change-password`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/users/:userId`, ({ params }) =>
    HttpResponse.json(mockUsers.find((u) => u.id === params.userId) ?? mockUsers[0]),
  ),

  http.put(`${API}/users/:userId`, ({ params }) =>
    HttpResponse.json({ ...mockUsers[0], id: params.userId }),
  ),

  http.post(`${API}/users/:userId/activate`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/users/:userId/deactivate`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/users/type/:type`, ({ params }) =>
    HttpResponse.json(mockUsers.filter((u) => u.type === params.type)),
  ),

  http.get(`${API}/users/store`, () =>
    HttpResponse.json(mockUsers.filter((u) => u.storeId === '1')),
  ),

  http.get(`${API}/users/managers`, () =>
    HttpResponse.json(mockUsers.filter((u) => u.type === 'MANAGER')),
  ),

  http.get(`${API}/users/:userId/can-take-orders`, () =>
    HttpResponse.json({ canTakeOrders: true }),
  ),

  http.get(`${API}/users`, () =>
    HttpResponse.json(mockUsers),
  ),

  http.post(`${API}/users/create`, () =>
    HttpResponse.json({ ...mockUsers[1], id: '99' }),
  ),

  http.post(`${API}/users/validate-pin`, () =>
    HttpResponse.json({ userId: '2', name: 'Staff Member', type: 'STAFF', role: 'CASHIER', storeId: '1' }),
  ),

  http.get(`${API}/users/search`, () =>
    HttpResponse.json(mockUsers),
  ),

  http.get(`${API}/users/stats`, () =>
    HttpResponse.json({ totalUsers: 50, activeUsers: 45, staffCount: 12, driverCount: 8 }),
  ),
];
