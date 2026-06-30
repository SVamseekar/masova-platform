import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockWeeklyEarnings = {
  employeeId: '2',
  storeId: '1',
  weekStart: '2025-01-13',
  weekEnd: '2025-01-19',
  hoursWorked: 32,
  basePayInr: 1280000,
  tipsInr: 45000,
  totalInr: 1325000,
  hourlyRateInr: 40000,
};

export const earningsHandlers = [
  http.get(apiUrl('/staff/earnings/weekly'), () => HttpResponse.json(mockWeeklyEarnings)),
  http.get(apiUrl('/staff/earnings/history'), () => HttpResponse.json([mockWeeklyEarnings])),
  http.get(apiUrl('/staff/pay-rates'), () =>
    HttpResponse.json({
      id: 'rate-1',
      employeeId: '2',
      storeId: '1',
      hourlyRateInr: 40000,
      effectiveFrom: '2025-01-01',
    }),
  ),
  http.post(apiUrl('/staff/pay-rates'), () =>
    HttpResponse.json({
      id: 'rate-1',
      employeeId: '2',
      storeId: '1',
      hourlyRateInr: 40000,
      effectiveFrom: '2025-01-01',
    }),
  ),
];