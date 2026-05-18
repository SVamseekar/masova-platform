import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const mockOrder = {
  id: 'order-1',
  orderNumber: 'ORD-20250101-001',
  customerId: '1',
  customerName: 'Test User',
  customerPhone: '555-0123',
  storeId: '1',
  items: [
    { menuItemId: '1', name: 'Margherita Pizza', quantity: 2, price: 299 },
    { menuItemId: '2', name: 'Cheeseburger', quantity: 1, price: 199 },
  ],
  subtotal: 797,
  deliveryFee: 50,
  tax: 80,
  total: 927,
  status: 'RECEIVED',
  orderType: 'DELIVERY',
  paymentStatus: 'PENDING',
  paymentMethod: 'UPI',
  priority: 'NORMAL',
  preparationTime: 20,
  createdAt: '2025-01-15T10:30:00Z',
  updatedAt: '2025-01-15T10:30:00Z',
};

const mockOrders = [
  mockOrder,
  {
    ...mockOrder,
    id: 'order-2',
    orderNumber: 'ORD-20250101-002',
    status: 'PREPARING',
    orderType: 'DINE_IN',
    total: 450,
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T11:05:00Z',
  },
];

export const orderHandlers = [
  http.post(`${API}/api/orders`, () =>
    HttpResponse.json(mockOrder),
  ),

  http.get(`${API}/api/orders`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(`${API}/api/orders/track/:orderId`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'DISPATCHED' }),
  ),

  http.get(`${API}/api/orders/analytics`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    if (type === 'avg-prep-time') return HttpResponse.json(18);
    if (type === 'prep-time-by-item') return HttpResponse.json({ 'Margherita Pizza': 15, 'Cheeseburger': 10 });
    return HttpResponse.json({});
  }),

  http.get(`${API}/api/orders/:orderId`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.post(`${API}/api/orders/:orderId/status`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'PREPARING' }),
  ),

  http.post(`${API}/api/orders/:orderId/next-stage`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'PREPARING' }),
  ),

  http.patch(`${API}/api/orders/:orderId`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.delete(`${API}/api/orders/:orderId`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'CANCELLED' }),
  ),

  http.patch(`${API}/api/orders/:orderId/payment`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, paymentStatus: 'PAID' }),
  ),

  http.post(`${API}/api/orders/:orderId/quality-checkpoint`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.patch(`${API}/api/orders/:orderId/quality-checkpoint/:checkpointName`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),
];
