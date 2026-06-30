import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

export const fiscalHandlers = [
  http.get(apiUrl('/fiscal/summary'), () =>
    HttpResponse.json([
      {
        storeId: '1',
        countryCode: 'IN',
        signerSystem: 'PASSTHROUGH',
        totalSigned: 120,
        failedLast7Days: 2,
        lastSignedAt: new Date().toISOString(),
      },
    ]),
  ),
  http.get(apiUrl('/fiscal/failures'), () =>
    HttpResponse.json([
      {
        orderId: 'order-fail-1',
        storeId: '1',
        countryCode: 'DE',
        signerSystem: 'TSE',
        signingError: 'Hardware unavailable',
        occurredAt: new Date().toISOString(),
      },
    ]),
  ),
];