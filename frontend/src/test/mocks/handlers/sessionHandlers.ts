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
  http.get(`${API}/users/sessions/current`, () =>
    HttpResponse.json(mockSession),
  ),

  http.post(`${API}/users/sessions/start`, () =>
    HttpResponse.json({ ...mockSession, loginTime: new Date().toISOString() }),
  ),

  http.post(`${API}/users/sessions/end`, () =>
    HttpResponse.json({
      ...mockSession,
      logoutTime: new Date().toISOString(),
      isActive: false,
      status: 'COMPLETED',
    }),
  ),

  http.post(`${API}/users/sessions/:employeeId/break`, () =>
    HttpResponse.json({ ...mockSession, breakDurationMinutes: 45 }),
  ),

  http.get(`${API}/users/sessions/store/active`, () =>
    HttpResponse.json([mockSession]),
  ),

  http.get(`${API}/users/sessions/store`, () =>
    HttpResponse.json([
      mockSession,
      {
        ...mockSession,
        id: 'session-2',
        employeeId: '4',
        employeeName: 'Kitchen Staff',
        logoutTime: '2025-01-15T16:00:00Z',
        isActive: false,
        status: 'COMPLETED',
        totalHours: 8,
      },
    ]),
  ),

  http.get(`${API}/users/sessions/:employeeId`, () =>
    HttpResponse.json([mockSession]),
  ),

  http.get(`${API}/users/sessions/pending-approval`, () =>
    HttpResponse.json([]),
  ),

  http.post(`${API}/users/sessions/:sessionId/approve`, () =>
    HttpResponse.json({ ...mockSession, status: 'COMPLETED' }),
  ),

  http.post(`${API}/users/sessions/:sessionId/reject`, () =>
    HttpResponse.json({ ...mockSession, status: 'COMPLETED' }),
  ),

  http.post(`${API}/users/sessions/clock-in-with-pin`, () =>
    HttpResponse.json({ message: 'Clocked in successfully', session: mockSession }),
  ),

  http.post(`${API}/users/sessions/clock-out-employee`, () =>
    HttpResponse.json({
      message: 'Clocked out successfully',
      session: { ...mockSession, isActive: false, status: 'COMPLETED' },
    }),
  ),

  http.get(`${API}/users/sessions/:employeeId/report`, () =>
    HttpResponse.json({ totalHours: 40, totalSessions: 5, averageHoursPerDay: 8 }),
  ),

  http.get(`${API}/users/sessions/:employeeId/status`, () =>
    HttpResponse.json({ hasActiveSession: true, session: mockSession }),
  ),
];
