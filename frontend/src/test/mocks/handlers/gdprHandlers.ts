import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockRequest = {
  id: 'req-1',
  userId: 'user-1',
  requestType: 'access',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
};

export const gdprHandlers = [
  http.get(apiUrl('/gdpr/consent'), () => HttpResponse.json([])),

  http.post(apiUrl('/gdpr/consent'), () =>
    HttpResponse.json({
      id: 'consent-1',
      userId: 'user-1',
      consentType: 'COOKIES',
      version: '1.0',
      granted: true,
      grantedAt: new Date().toISOString(),
    }),
  ),

  http.delete(apiUrl('/gdpr/consent'), () =>
    HttpResponse.json({
      id: 'consent-1',
      userId: 'user-1',
      consentType: 'COOKIES',
      version: '1.0',
      granted: false,
      revokedAt: new Date().toISOString(),
    }),
  ),

  http.get(apiUrl('/gdpr/request'), () => HttpResponse.json([mockRequest])),

  http.post(apiUrl('/gdpr/request'), () =>
    HttpResponse.json({
      id: 'req-2',
      userId: 'user-1',
      requestType: 'access',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }),
  ),

  http.post(apiUrl('/gdpr/request/:requestId/process'), ({ params }) =>
    HttpResponse.json({
      ...mockRequest,
      id: params.requestId,
      status: 'COMPLETED',
      processedAt: new Date().toISOString(),
    }),
  ),

  http.get(apiUrl('/gdpr/export/:userId'), ({ params }) =>
    HttpResponse.json({
      userId: params.userId,
      exportedAt: new Date().toISOString(),
      profile: { name: 'Test User', email: 'test@example.com' },
      orders: [],
      consents: [],
    }),
  ),

  http.get(apiUrl('/gdpr/audit/:userId'), ({ params }) =>
    HttpResponse.json([
      {
        id: 'audit-1',
        userId: params.userId,
        action: 'REQUEST_SUBMITTED',
        details: 'GDPR request submitted: access',
        performedBy: params.userId,
        timestamp: new Date().toISOString(),
      },
    ]),
  ),
];