import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockConnection = {
  id: 'agg-1',
  storeId: '1',
  platform: 'WOLT',
  commissionPercent: 15,
  active: true,
};

export const aggregatorHandlers = [
  http.get(apiUrl('/aggregators/connections'), () =>
    HttpResponse.json({ data: [mockConnection] }),
  ),
  http.put(apiUrl('/aggregators/connections'), () =>
    HttpResponse.json({ data: mockConnection }),
  ),
];