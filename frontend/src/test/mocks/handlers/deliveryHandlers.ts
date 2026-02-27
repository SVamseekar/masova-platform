import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const deliveryHandlers = [
  http.get(`${API}/delivery/drivers/available`, () =>
    HttpResponse.json([
      {
        id: 'driver-1',
        name: 'Rajesh Kumar',
        phone: '555-1001',
        rating: 4.8,
        activeDeliveries: 1,
        currentLocation: { latitude: 17.385, longitude: 78.4867 },
        status: 'AVAILABLE',
      },
      {
        id: 'driver-2',
        name: 'Sunil Reddy',
        phone: '555-1002',
        rating: 4.5,
        activeDeliveries: 0,
        currentLocation: { latitude: 17.39, longitude: 78.49 },
        status: 'AVAILABLE',
      },
    ]),
  ),

  http.post(`${API}/delivery/auto-dispatch`, () =>
    HttpResponse.json({
      orderId: 'order-1',
      driverId: 'driver-1',
      driverName: 'Rajesh Kumar',
      driverPhone: '555-1001',
      distanceToPickup: 2.5,
      estimatedPickupTime: 10,
      estimatedDeliveryTime: 25,
      assignedAt: new Date().toISOString(),
      dispatchMethod: 'AUTO',
      status: 'ASSIGNED',
    }),
  ),

  http.post(`${API}/delivery/route-optimize`, () =>
    HttpResponse.json({
      distanceKm: 5.2,
      durationMinutes: 18,
      polyline: 'mock_polyline_string',
      steps: [
        { instruction: 'Head north on Main St', distanceMeters: 500, durationSeconds: 60 },
        { instruction: 'Turn right on Oak Ave', distanceMeters: 1200, durationSeconds: 180 },
      ],
      distance: 5200,
      duration: 1080,
      segments: [],
      estimatedArrival: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
    }),
  ),

  http.post(`${API}/delivery/location-update`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/delivery/track/:orderId`, ({ params }) =>
    HttpResponse.json({
      orderId: params.orderId,
      driverId: 'driver-1',
      driverName: 'Rajesh Kumar',
      driverPhone: '555-1001',
      currentLocation: { type: 'Point', coordinates: [78.4867, 17.385] },
      destination: { type: 'Point', coordinates: [78.49, 17.39] },
      status: 'IN_TRANSIT',
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      distanceRemaining: 3200,
      lastUpdated: new Date().toISOString(),
      orderType: 'DELIVERY',
    }),
  ),

  http.get(`${API}/delivery/eta/:orderId`, ({ params }) =>
    HttpResponse.json({
      orderId: params.orderId,
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      distanceRemaining: 3200,
      timeRemaining: 15,
      confidence: 'HIGH',
    }),
  ),

  http.get(`${API}/delivery/metrics`, () =>
    HttpResponse.json({
      totalDeliveries: 150,
      activeDeliveries: 5,
      completedDeliveries: 140,
      cancelledDeliveries: 5,
      averageDeliveryTime: 28,
      averageDeliveryDistance: 4.5,
      onTimeDeliveryRate: 92,
      customerSatisfactionRate: 4.6,
    }),
  ),

  http.get(`${API}/delivery/metrics/today`, () =>
    HttpResponse.json({
      totalDeliveries: 12,
      activeDeliveries: 3,
      completedDeliveries: 9,
      cancelledDeliveries: 0,
      averageDeliveryTime: 25,
      averageDeliveryDistance: 3.8,
      onTimeDeliveryRate: 95,
      customerSatisfactionRate: 4.7,
    }),
  ),

  http.get(`${API}/delivery/driver/:driverId/performance`, () =>
    HttpResponse.json({
      totalDeliveries: 200,
      averageRating: 4.7,
      onTimeRate: 94,
      completionRate: 98,
    }),
  ),

  http.get(`${API}/delivery/driver/:driverId/performance/today`, () =>
    HttpResponse.json({
      deliveriesToday: 5,
      averageTime: 22,
      onTimeRate: 100,
    }),
  ),

  http.get(`${API}/delivery/driver/:driverId/status`, () =>
    HttpResponse.json({ status: 'AVAILABLE', activeDeliveries: 1 }),
  ),

  http.get(`${API}/delivery/driver/:driverId/pending`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${API}/delivery/zone/check`, () =>
    HttpResponse.json({ inZone: true, zoneName: 'Zone A' }),
  ),

  http.get(`${API}/delivery/zone/fee`, () =>
    HttpResponse.json({ fee: 50, distance: 3.2 }),
  ),

  http.get(`${API}/delivery/zone/list`, () =>
    HttpResponse.json([
      { id: '1', name: 'Zone A', radius: 5, baseFee: 30 },
      { id: '2', name: 'Zone B', radius: 10, baseFee: 50 },
    ]),
  ),

  http.get(`${API}/delivery/zone/validate`, () =>
    HttpResponse.json({ valid: true, zoneName: 'Zone A' }),
  ),

  http.post(`${API}/delivery/accept`, () =>
    HttpResponse.json({ status: 'ACCEPTED' }),
  ),

  http.post(`${API}/delivery/reject`, () =>
    HttpResponse.json({ status: 'REJECTED' }),
  ),

  http.post(`${API}/delivery/:orderId/generate-otp`, () =>
    HttpResponse.json({ otp: '1234', expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }),
  ),

  http.post(`${API}/delivery/:orderId/regenerate-otp`, () =>
    HttpResponse.json({ otp: '5678', expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }),
  ),
];
