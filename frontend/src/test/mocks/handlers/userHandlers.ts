import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

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
  // Static / multi-segment routes before :userId (MSW matches in registration order)
  http.get(apiUrl('/users/profile'), () =>
    HttpResponse.json(mockUsers[0]),
  ),

  http.put(apiUrl('/users/profile'), () =>
    HttpResponse.json(mockUsers[0]),
  ),

  http.post(apiUrl('/auth/change-password'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(apiUrl('/users/search'), () =>
    HttpResponse.json(mockUsers),
  ),

  http.get(apiUrl('/users/stats'), () =>
    HttpResponse.json({ totalUsers: 50, activeUsers: 45, staffCount: 12, driverCount: 8 }),
  ),

  // Canonical list: GET /users?type=&storeId=&available=
  http.get(apiUrl('/users'), ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const storeId = url.searchParams.get('storeId');
    let rows = mockUsers;
    if (type) {
      rows = rows.filter((u) => u.type === type);
    }
    if (storeId) {
      rows = rows.filter((u) => u.storeId === storeId || u.storeId === '1');
    }
    return HttpResponse.json(rows);
  }),

  http.post(apiUrl('/users/create'), () =>
    HttpResponse.json({ ...mockUsers[1], id: '99' }),
  ),

  http.post(apiUrl('/auth/validate-pin'), () =>
    HttpResponse.json({ userId: '2', name: 'Staff Member', type: 'STAFF', role: 'CASHIER', storeId: '1' }),
  ),

  // Parameterized routes last
  http.get(apiUrl('/users/:userId/can-take-orders'), () =>
    HttpResponse.json({ canTakeOrders: true }),
  ),

  http.get(apiUrl('/users/:userId'), ({ params }) =>
    HttpResponse.json(mockUsers.find((u) => u.id === params.userId) ?? mockUsers[0]),
  ),

  http.put(apiUrl('/users/:userId'), ({ params }) =>
    HttpResponse.json({ ...mockUsers[0], id: params.userId }),
  ),

  http.post(apiUrl('/users/:userId/activate'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(apiUrl('/users/:userId/deactivate'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(apiUrl('/users/kiosk/:kioskUserId/deactivate'), () =>
    HttpResponse.json({ success: 'true', message: 'Kiosk deactivated successfully' }),
  ),
];