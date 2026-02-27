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
  http.get(`${API}/orders`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(`${API}/orders/:orderId`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.get(`${API}/orders/track/:orderId`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'DISPATCHED' }),
  ),

  http.get(`${API}/orders/kitchen`, () =>
    HttpResponse.json(mockOrders.filter((o) => ['RECEIVED', 'PREPARING'].includes(o.status))),
  ),

  http.get(`${API}/orders/status/:status`, ({ params }) =>
    HttpResponse.json(mockOrders.filter((o) => o.status === params.status)),
  ),

  http.post(`${API}/orders`, () =>
    HttpResponse.json(mockOrder),
  ),

  http.patch(`${API}/orders/:orderId/status`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'PREPARING' }),
  ),

  http.delete(`${API}/orders/:orderId`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'CANCELLED' }),
  ),

  http.get(`${API}/orders/customer/:customerId`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(`${API}/orders/number/:orderNumber`, () =>
    HttpResponse.json(mockOrder),
  ),

  http.get(`${API}/orders/store`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.patch(`${API}/orders/:orderId/next-stage`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'PREPARING' }),
  ),

  http.patch(`${API}/orders/:orderId/assign-driver`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, assignedDriverId: 'driver-1' }),
  ),

  http.patch(`${API}/orders/:orderId/payment`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, paymentStatus: 'PAID' }),
  ),

  http.patch(`${API}/orders/:orderId/items`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.patch(`${API}/orders/:orderId/priority`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, priority: 'URGENT' }),
  ),

  http.get(`${API}/orders/search`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.post(`${API}/orders/:orderId/quality-checkpoint`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.patch(`${API}/orders/:orderId/quality-checkpoint/:checkpointName`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.get(`${API}/orders/:orderId/quality-checkpoints`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${API}/orders/store/failed-quality-checks`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${API}/orders/store/avg-prep-time`, () =>
    HttpResponse.json(18),
  ),

  http.patch(`${API}/orders/:orderId/assign-make-table`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, assignedMakeTableStation: 'Station A' }),
  ),

  http.get(`${API}/orders/store/make-table/:station`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(`${API}/orders/date/:date`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(`${API}/orders/range`, () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(`${API}/orders/active-deliveries/count`, () =>
    HttpResponse.json({ count: 3 }),
  ),
];
