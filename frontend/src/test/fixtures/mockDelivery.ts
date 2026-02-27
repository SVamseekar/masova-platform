import type {
  AvailableDriver,
  TrackingResponse,
  ETAResponse,
  DeliveryMetrics,
  AutoDispatchResponse,
  RouteOptimizationResponse,
  DeliveryLocation,
  LocationUpdateRequest,
} from '../../store/api/deliveryApi';

// ---------------------------------------------------------------------------
// Delivery locations
// ---------------------------------------------------------------------------

export const mockStoreLocation: DeliveryLocation = {
  type: 'Point',
  coordinates: [78.4867, 17.385], // [longitude, latitude] - Hyderabad
};

export const mockCustomerLocation: DeliveryLocation = {
  type: 'Point',
  coordinates: [78.4772, 17.4065],
};

// ---------------------------------------------------------------------------
// Available drivers
// ---------------------------------------------------------------------------

export const mockAvailableDriver: AvailableDriver = {
  id: 'user-3',
  name: 'Test Driver',
  phone: '555-0003',
  email: 'driver@test.com',
  rating: 4.5,
  activeDeliveries: 0,
  currentLocation: { latitude: 17.39, longitude: 78.49 },
  status: 'AVAILABLE',
};

export const mockBusyDriver: AvailableDriver = {
  id: 'driver-2',
  name: 'Busy Driver',
  phone: '555-0010',
  email: 'busy.driver@test.com',
  rating: 4.2,
  activeDeliveries: 2,
  currentLocation: { latitude: 17.38, longitude: 78.48 },
  status: 'BUSY',
};

export const mockDriverList: AvailableDriver[] = [
  mockAvailableDriver,
  mockBusyDriver,
  {
    id: 'driver-3',
    name: 'New Driver',
    phone: '555-0011',
    rating: 0,
    activeDeliveries: 0,
    currentLocation: { latitude: 17.395, longitude: 78.495 },
    status: 'AVAILABLE',
  },
];

// ---------------------------------------------------------------------------
// Dispatch responses
// ---------------------------------------------------------------------------

export const mockAutoDispatchResponse: AutoDispatchResponse = {
  orderId: 'order-5',
  driverId: 'user-3',
  driverName: 'Test Driver',
  driverPhone: '555-0003',
  distanceToPickup: 2.5,
  estimatedPickupTime: 8,
  estimatedDeliveryTime: 25,
  assignedAt: '2026-02-15T10:20:00Z',
  dispatchMethod: 'AUTO',
  status: 'ASSIGNED',
};

export const mockManualDispatchResponse: AutoDispatchResponse = {
  ...mockAutoDispatchResponse,
  dispatchMethod: 'MANUAL',
};

// ---------------------------------------------------------------------------
// Tracking responses
// ---------------------------------------------------------------------------

export const mockTrackingPending: TrackingResponse = {
  orderId: 'order-5',
  driverId: 'user-3',
  driverName: 'Test Driver',
  driverPhone: '555-0003',
  currentLocation: mockStoreLocation,
  destination: mockCustomerLocation,
  status: 'PICKING_UP',
  estimatedArrival: '2026-02-15T10:45:00Z',
  distanceRemaining: 5200,
  lastUpdated: '2026-02-15T10:22:00Z',
  orderType: 'DELIVERY',
};

export const mockTrackingInProgress: TrackingResponse = {
  ...mockTrackingPending,
  status: 'IN_TRANSIT',
  currentLocation: {
    type: 'Point',
    coordinates: [78.482, 17.396],
  },
  distanceRemaining: 2100,
  lastUpdated: '2026-02-15T10:35:00Z',
};

export const mockTrackingNearby: TrackingResponse = {
  ...mockTrackingPending,
  status: 'NEARBY',
  currentLocation: {
    type: 'Point',
    coordinates: [78.4775, 17.405],
  },
  distanceRemaining: 200,
  lastUpdated: '2026-02-15T10:43:00Z',
};

// ---------------------------------------------------------------------------
// ETA responses
// ---------------------------------------------------------------------------

export const mockETAResponse: ETAResponse = {
  orderId: 'order-5',
  estimatedArrival: '2026-02-15T10:45:00Z',
  distanceRemaining: 5200,
  timeRemaining: 25,
  confidence: 'HIGH',
};

export const mockETALowConfidence: ETAResponse = {
  orderId: 'order-5',
  estimatedArrival: '2026-02-15T11:00:00Z',
  distanceRemaining: 8500,
  timeRemaining: 40,
  confidence: 'LOW',
};

// ---------------------------------------------------------------------------
// Route optimization
// ---------------------------------------------------------------------------

export const mockOptimizedRoute: RouteOptimizationResponse = {
  distanceKm: 5.2,
  durationMinutes: 18,
  polyline: 'a~l~Fjk~uOwHJy@P',
  steps: [
    { instruction: 'Head north on Main Road', distanceMeters: 1200, durationSeconds: 180 },
    { instruction: 'Turn right onto Ring Road', distanceMeters: 2500, durationSeconds: 360, maneuver: 'turn-right' },
    { instruction: 'Turn left onto Curry Lane', distanceMeters: 1500, durationSeconds: 240, maneuver: 'turn-left' },
  ],
  distance: 5200,
  duration: 1080,
  segments: [
    { distance: 1200, duration: 180, instruction: 'Head north on Main Road' },
    { distance: 2500, duration: 360, instruction: 'Turn right onto Ring Road' },
    { distance: 1500, duration: 240, instruction: 'Turn left onto Curry Lane' },
  ],
  estimatedArrival: '2026-02-15T10:45:00Z',
};

// ---------------------------------------------------------------------------
// Delivery metrics
// ---------------------------------------------------------------------------

export const mockDeliveryMetrics: DeliveryMetrics = {
  totalDeliveries: 150,
  activeDeliveries: 8,
  completedDeliveries: 135,
  cancelledDeliveries: 7,
  averageDeliveryTime: 28.5,
  averageDeliveryDistance: 4.8,
  onTimeDeliveryRate: 0.92,
  customerSatisfactionRate: 0.88,
};

export const mockEmptyDeliveryMetrics: DeliveryMetrics = {
  totalDeliveries: 0,
  activeDeliveries: 0,
  completedDeliveries: 0,
  cancelledDeliveries: 0,
  averageDeliveryTime: 0,
  averageDeliveryDistance: 0,
  onTimeDeliveryRate: 0,
  customerSatisfactionRate: 0,
};

// ---------------------------------------------------------------------------
// Location update request
// ---------------------------------------------------------------------------

export const mockLocationUpdate: LocationUpdateRequest = {
  driverId: 'user-3',
  latitude: 17.392,
  longitude: 78.488,
  timestamp: '2026-02-15T10:30:00Z',
  speed: 25.5,
  heading: 45,
  accuracy: 10,
};
