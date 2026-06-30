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
  http.patch(apiUrl('/shifts/:id'), () => HttpResponse.json(mockShift)),
];