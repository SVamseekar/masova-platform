import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

export const sessionHandlers = [
  http.post(`${API}/api/sessions`, () =>
    HttpResponse.json({ ...mockSession, loginTime: new Date().toISOString() }),
  ),

  http.post(`${API}/api/sessions/end`, () =>
    HttpResponse.json({
      ...mockSession,
      logoutTime: new Date().toISOString(),
      isActive: false,
      status: 'COMPLETED',
    }),
  ),

  http.post(`${API}/api/sessions/clock-in`, () =>
    HttpResponse.json({ message: 'Clocked in successfully', session: mockSession }),
  ),

  http.post(`${API}/api/sessions/clock-out`, () =>
    HttpResponse.json({
      message: 'Clocked out successfully',
      session: { ...mockSession, isActive: false, status: 'COMPLETED' },
    }),
  ),

  http.get(`${API}/api/sessions`, () =>
    HttpResponse.json([mockSession]),
  ),

  http.get(`${API}/api/sessions/pending`, () =>
    HttpResponse.json([]),
  ),

  http.post(`${API}/api/sessions/:sessionId/approve`, () =>
    HttpResponse.json({ ...mockSession, status: 'COMPLETED' }),
  ),

  http.post(`${API}/api/sessions/:sessionId/reject`, () =>
    HttpResponse.json({ ...mockSession, status: 'COMPLETED' }),
  ),

  http.post(`${API}/api/sessions/:sessionId/break`, () =>
    HttpResponse.json({ ...mockSession, breakDurationMinutes: 45 }),
  ),
];
