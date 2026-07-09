import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

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
  {
    ...mockOrder,
    id: 'order-3',
    orderNumber: 'ORD-20250101-003',
    status: 'PREPARING',
    orderType: 'DELIVERY',
    total: 650,
    cancellationRequested: true,
    cancellationRequestReason: 'Customer changed plans',
    cancellationRequestedBy: 'customer-1',
    cancellationRequestedAt: '2025-01-15T11:30:00Z',
    createdAt: '2025-01-15T11:15:00Z',
    updatedAt: '2025-01-15T11:30:00Z',
  },
];

export const orderHandlers = [
  http.get(apiUrl('/orders'), ({ request }) => {
    const url = new URL(request.url);

    if (url.searchParams.get('kitchen') === 'true') {
      return HttpResponse.json(
        mockOrders.filter((o) => ['RECEIVED', 'PREPARING'].includes(o.status)),
      );
    }

    return HttpResponse.json(mockOrders);
  }),

  // Static / multi-segment routes before :orderId

  http.get(apiUrl('/orders/analytics'), ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    if (type === 'active-deliveries') {
      return HttpResponse.json({ count: 3 });
    }
    if (type === 'prep-time') {
      return HttpResponse.json(18);
    }
    if (type === 'make-table-station' || type === 'staff-date') {
      return HttpResponse.json(mockOrders);
    }
    if (type === 'failed-quality') {
      return HttpResponse.json([]);
    }
    return HttpResponse.json({});
  }),

  http.get(apiUrl('/orders/store'), () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(apiUrl('/orders/search'), () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(apiUrl('/orders/customer/:customerId'), () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(apiUrl('/orders/number/:orderNumber'), () =>
    HttpResponse.json(mockOrder),
  ),

  http.get(apiUrl('/orders/track/:orderId'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'DISPATCHED' }),
  ),

  http.get(apiUrl('/orders/status/:status'), ({ params }) =>
    HttpResponse.json(mockOrders.filter((o) => o.status === params.status)),
  ),

  http.get(apiUrl('/orders/date/:date'), () =>
    HttpResponse.json(mockOrders),
  ),

  http.get(apiUrl('/orders/range'), () =>
    HttpResponse.json(mockOrders),
  ),



  http.post(apiUrl('/orders'), () =>
    HttpResponse.json(mockOrder),
  ),

  // Parameterized :orderId routes last
  http.get(apiUrl('/orders/:orderId/quality-checkpoints'), () =>
    HttpResponse.json([]),
  ),

  http.get(apiUrl('/orders/:orderId'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  // Canonical state machine: POST /orders/{id}/status
  http.post(apiUrl('/orders/:orderId/status'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'PREPARING' }),
  ),

  http.delete(apiUrl('/orders/:orderId'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'CANCELLED' }),
  ),

  // Canonical KDS bump: POST /orders/{id}/next-stage
  http.post(apiUrl('/orders/:orderId/next-stage'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, status: 'PREPARING' }),
  ),

  http.patch(apiUrl('/orders/:orderId/assign-driver'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, assignedDriverId: 'driver-1' }),
  ),

  http.patch(apiUrl('/orders/:orderId/payment'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, paymentStatus: 'PAID' }),
  ),

  http.patch(apiUrl('/orders/:orderId/items'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.patch(apiUrl('/orders/:orderId/priority'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, priority: 'URGENT' }),
  ),

  http.post(apiUrl('/orders/:orderId/quality-checkpoint'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.patch(apiUrl('/orders/:orderId/quality-checkpoint/:checkpointName'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId }),
  ),

  http.patch(apiUrl('/orders/:orderId'), ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: params.orderId, assignedMakeTableStation: 'Station A' }),
  ),

  http.post(apiUrl('/orders/:orderId/cancel-request'), ({ params }) =>
    HttpResponse.json({
      ...mockOrder,
      id: params.orderId,
      cancellationRequested: true,
      cancellationRequestReason: 'Customer requested cancellation',
      cancellationRequestedAt: new Date().toISOString(),
    }),
  ),

  http.post(apiUrl('/orders/:orderId/cancel-request/approve'), ({ params }) =>
    HttpResponse.json({
      ...mockOrder,
      id: params.orderId,
      status: 'CANCELLED',
      cancellationRequested: false,
    }),
  ),

  http.post(apiUrl('/orders/:orderId/cancel-request/reject'), ({ params }) =>
    HttpResponse.json({
      ...mockOrder,
      id: params.orderId,
      cancellationRequested: false,
    }),
  ),
];