import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockSession = {
  id: 'session-1',
  employeeId: '2',
  employeeName: 'Staff Member',
  role: 'STAFF',
  storeId: '1',
  loginTime: '2025-01-15T08:00:00Z',
  logoutTime: undefined,
  currentDuration: '4h 30m',
  totalHours: 4.5,
  breakDurationMinutes: 30,
  isActive: true,
  status: 'ACTIVE',
};

const completedSession = {
  ...mockSession,
  id: 'session-2',
  employeeId: '4',
  employeeName: 'Kitchen Staff',
  logoutTime: '2025-01-15T16:00:00Z',
  isActive: false,
  status: 'COMPLETED',
  totalHours: 8,
};

export const sessionHandlers = [
  http.get(apiUrl('/sessions'), ({ request }) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const active = url.searchParams.get('active');

    if (employeeId && active === 'true') {
      return HttpResponse.json([mockSession]);
    }
    if (employeeId) {
      return HttpResponse.json([mockSession]);
    }
    if (active === 'true') {
      return HttpResponse.json([mockSession]);
    }
    return HttpResponse.json([mockSession, completedSession]);
  }),

  http.post(apiUrl('/sessions'), () =>
    HttpResponse.json({ ...mockSession, loginTime: new Date().toISOString() }),
  ),

  http.post(apiUrl('/sessions/end'), () =>
    HttpResponse.json({
      ...mockSession,
      logoutTime: new Date().toISOString(),
      isActive: false,
      status: 'COMPLETED',
    }),
  ),

  http.post(apiUrl('/sessions/:sessionId/break'), () =>
    HttpResponse.json({ ...mockSession, breakDurationMinutes: 45 }),
  ),

  http.get(apiUrl('/sessions/pending'), () =>
    HttpResponse.json([]),
  ),

  http.post(apiUrl('/sessions/:sessionId/approve'), () =>
    HttpResponse.json({ ...mockSession, status: 'COMPLETED' }),
  ),

  http.post(apiUrl('/sessions/:sessionId/reject'), () =>
    HttpResponse.json({ ...mockSession, status: 'COMPLETED' }),
  ),

  http.post(apiUrl('/sessions/clock-in'), () =>
    HttpResponse.json({ message: 'Clocked in successfully', session: mockSession }),
  ),

  http.post(apiUrl('/sessions/clock-out'), () =>
    HttpResponse.json({
      message: 'Clocked out successfully',
      session: { ...mockSession, isActive: false, status: 'COMPLETED' },
    }),
  ),
];