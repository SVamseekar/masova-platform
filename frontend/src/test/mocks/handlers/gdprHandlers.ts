import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

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
  http.get(apiUrl('/gdpr/request'), () => HttpResponse.json([])),
  http.post(apiUrl('/gdpr/request'), () =>
    HttpResponse.json({
      id: 'req-1',
      userId: 'user-1',
      requestType: 'access',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }),
  ),
];