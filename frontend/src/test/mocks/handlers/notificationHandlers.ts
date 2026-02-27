import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const mockNotification = {
  id: 'notif-1',
  userId: '1',
  title: 'Order Confirmed',
  message: 'Your order ORD-001 has been confirmed',
  type: 'ORDER_CONFIRMED',
  channel: 'IN_APP',
  status: 'DELIVERED',
  priority: 'NORMAL',
  retryCount: 0,
  createdAt: '2025-01-15T10:30:00Z',
  updatedAt: '2025-01-15T10:30:00Z',
};

const mockCampaign = {
  id: 'campaign-1',
  name: 'Weekend Special',
  description: 'Weekend promotion for all customers',
  channel: 'EMAIL',
  subject: 'Weekend Special Offers!',
  message: 'Enjoy 20% off this weekend',
  status: 'DRAFT',
  sent: 0,
  delivered: 0,
  failed: 0,
  opened: 0,
  clicked: 0,
  createdBy: '3',
  createdAt: '2025-01-14T00:00:00Z',
  updatedAt: '2025-01-14T00:00:00Z',
};

export const notificationHandlers = [
  http.post(`${API}/api/notifications/send`, () =>
    HttpResponse.json(mockNotification),
  ),

  http.get(`${API}/api/notifications/user/:userId`, () =>
    HttpResponse.json({
      content: [mockNotification],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }),
  ),

  http.get(`${API}/api/notifications/user/:userId/unread`, () =>
    HttpResponse.json([mockNotification]),
  ),

  http.get(`${API}/api/notifications/user/:userId/unread-count`, () =>
    HttpResponse.json(3),
  ),

  http.patch(`${API}/api/notifications/:id/read`, () =>
    HttpResponse.json({ ...mockNotification, status: 'READ', readAt: new Date().toISOString() }),
  ),

  http.patch(`${API}/api/notifications/user/:userId/read-all`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.delete(`${API}/api/notifications/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Preferences
  http.get(`${API}/api/preferences/user/:userId`, () =>
    HttpResponse.json({
      id: 'pref-1',
      userId: '1',
      smsEnabled: false,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      respectQuietHours: false,
      marketingEnabled: true,
      promotionalEnabled: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }),
  ),

  http.put(`${API}/api/preferences/user/:userId`, () =>
    HttpResponse.json({ id: 'pref-1', userId: '1' }),
  ),

  http.patch(`${API}/api/preferences/user/:userId/channel/:channel`, () =>
    HttpResponse.json({ id: 'pref-1', userId: '1' }),
  ),

  http.patch(`${API}/api/preferences/user/:userId/device-token`, () =>
    HttpResponse.json({ id: 'pref-1', userId: '1' }),
  ),

  // Campaigns
  http.post(`${API}/api/campaigns`, () =>
    HttpResponse.json(mockCampaign),
  ),

  http.put(`${API}/api/campaigns/:id`, () =>
    HttpResponse.json(mockCampaign),
  ),

  http.post(`${API}/api/campaigns/:id/schedule`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/campaigns/:id/execute`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/campaigns/:id/cancel`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/api/campaigns`, () =>
    HttpResponse.json({
      content: [mockCampaign],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }),
  ),

  http.get(`${API}/api/campaigns/:id`, () =>
    HttpResponse.json(mockCampaign),
  ),

  http.delete(`${API}/api/campaigns/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
