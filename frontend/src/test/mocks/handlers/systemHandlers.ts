import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

export const systemHandlers = [
  http.get(apiUrl('/system/version'), () =>
    HttpResponse.json({
      version: '2.1.0',
      buildDate: '2025-01-01',
      applicationName: 'MaSoVa',
      environment: 'test',
    }),
  ),
  http.get(apiUrl('/system/updates/check'), () =>
    HttpResponse.json({
      currentVersion: '2.1.0',
      latestVersion: '2.1.0',
      updateAvailable: false,
      details: 'Up to date',
    }),
  ),
  http.get(apiUrl('/system/updates/status'), () =>
    HttpResponse.json({
      currentVersion: '2.1.0',
      latestVersion: '2.1.0',
      updateAvailable: false,
      details: 'Up to date',
    }),
  ),
  http.get(apiUrl('/system/health'), () =>
    HttpResponse.json({ status: 'UP', timestamp: new Date().toISOString(), version: '2.1.0', components: {} }),
  ),
  http.get(apiUrl('/system/info'), () =>
    HttpResponse.json({
      version: '2.1.0',
      buildDate: '2025-01-01',
      updateAvailable: false,
      latestVersion: '2.1.0',
      totalMemory: '512MB',
      freeMemory: '256MB',
      maxMemory: '1GB',
      processors: 4,
      javaVersion: '21',
      javaVendor: 'Eclipse',
    }),
  ),
];