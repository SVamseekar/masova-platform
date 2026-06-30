import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockShift = {
  id: 'shift-1',
  storeId: '1',
  employeeId: '2',
  type: 'REGULAR',
  scheduledStart: '2025-01-15T08:00:00Z',
  scheduledEnd: '2025-01-15T16:00:00Z',
  status: 'SCHEDULED',
  isMandatory: false,
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 'manager-1',
};

export const shiftHandlers = [
  http.get(apiUrl('/shifts'), () => HttpResponse.json([mockShift])),
  http.post(apiUrl('/shifts'), () => HttpResponse.json(mockShift)),
  http.get(apiUrl('/shifts/:shiftId'), () => HttpResponse.json(mockShift)),
  http.patch(apiUrl('/shifts/:shiftId'), () => HttpResponse.json(mockShift)),
  http.delete(apiUrl('/shifts/:shiftId'), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl('/shifts/:shiftId/start'), () =>
    HttpResponse.json({ ...mockShift, status: 'IN_PROGRESS' }),
  ),
  http.post(apiUrl('/shifts/:shiftId/confirm'), () =>
    HttpResponse.json({ ...mockShift, status: 'CONFIRMED' }),
  ),
  http.post(apiUrl('/shifts/:shiftId/complete'), () =>
    HttpResponse.json({ ...mockShift, status: 'COMPLETED' }),
  ),
  http.post(apiUrl('/shifts/bulk'), () => HttpResponse.json([mockShift])),
  http.post(apiUrl('/shifts/copy-week'), () => HttpResponse.json([mockShift])),
];