import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';


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
  http.post(apiUrl('/notifications/send'), () =>
    HttpResponse.json(mockNotification),
  ),

  http.get(apiUrl('/notifications/user/:userId'), () =>
    HttpResponse.json({
      content: [mockNotification],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }),
  ),

  http.get(apiUrl('/notifications/user/:userId/unread'), () =>
    HttpResponse.json([mockNotification]),
  ),

  http.get(apiUrl('/notifications/user/:userId/unread-count'), () =>
    HttpResponse.json(3),
  ),

  http.patch(apiUrl('/notifications/:id/read'), () =>
    HttpResponse.json({ ...mockNotification, status: 'READ', readAt: new Date().toISOString() }),
  ),

  http.patch(apiUrl('/notifications/user/:userId/read-all'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.delete(apiUrl('/notifications/:id'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Preferences
  http.get(apiUrl('/preferences/user/:userId'), () =>
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

  http.put(apiUrl('/preferences/user/:userId'), () =>
    HttpResponse.json({ id: 'pref-1', userId: '1' }),
  ),

  http.patch(apiUrl('/preferences/user/:userId/channel/:channel'), () =>
    HttpResponse.json({ id: 'pref-1', userId: '1' }),
  ),

  http.patch(apiUrl('/preferences/user/:userId/device-token'), () =>
    HttpResponse.json({ id: 'pref-1', userId: '1' }),
  ),

  // Campaigns
  http.post(apiUrl('/campaigns'), () =>
    HttpResponse.json(mockCampaign),
  ),

  http.put(apiUrl('/campaigns/:id'), () =>
    HttpResponse.json(mockCampaign),
  ),

  http.post(apiUrl('/campaigns/:id/schedule'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(apiUrl('/campaigns/:id/execute'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(apiUrl('/campaigns/:id/cancel'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(apiUrl('/campaigns'), () =>
    HttpResponse.json({
      content: [mockCampaign],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }),
  ),

  http.get(apiUrl('/campaigns/:id'), () =>
    HttpResponse.json(mockCampaign),
  ),

  http.delete(apiUrl('/campaigns/:id'), () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
