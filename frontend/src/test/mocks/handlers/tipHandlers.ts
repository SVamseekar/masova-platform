import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

export const tipHandlers = [
  http.post(apiUrl('/orders/:orderId/tip'), () =>
    HttpResponse.json({
      tipId: 'tip-1',
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      amountInr: 5000,
      tipType: 'ORDER',
      distributed: false,
      createdAt: new Date().toISOString(),
    }),
  ),
  http.get(apiUrl('/staff/tips/pending'), () => HttpResponse.json([])),
];