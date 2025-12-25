/**
 * Mock GPS coordinates for testing delivery scenarios
 * Use these when testing locally where driver and customer are at same location
 *
 * These represent realistic locations in Mumbai for testing:
 * - Store: Andheri West
 * - Customer locations: Various distances from store
 * - Driver locations: Simulated positions during delivery
 */

export interface TestLocation {
  latitude: number;
  longitude: number;
  name: string;
  description: string;
}

export interface TestDeliveryScenario {
  store: TestLocation;
  customer: TestLocation;
  driver: TestLocation;
  estimatedDistance: number; // km
  estimatedTime: number; // minutes
}

// Base store location (Andheri West, Mumbai)
export const MOCK_STORE_LOCATION: TestLocation = {
  latitude: 19.1136,
  longitude: 72.8697,
  name: "MaSoVa Pizza - Andheri West",
  description: "Main store location"
};

// Mock customer locations at various distances
export const MOCK_CUSTOMER_LOCATIONS: Record<string, TestLocation> = {
  // Very close (< 1 km)
  NEARBY: {
    latitude: 19.1200,
    longitude: 72.8750,
    name: "Lokhandwala Complex",
    description: "0.8 km from store - 5 min delivery"
  },

  // Medium distance (2-3 km)
  MEDIUM: {
    latitude: 19.1320,
    longitude: 72.8520,
    name: "Versova",
    description: "2.5 km from store - 15 min delivery"
  },

  // Far distance (5+ km)
  FAR: {
    latitude: 19.0760,
    longitude: 72.8777,
    name: "Bandra West",
    description: "5.2 km from store - 25 min delivery"
  },

  // Very far (testing edge case)
  VERY_FAR: {
    latitude: 19.0177,
    longitude: 72.8464,
    name: "Worli",
    description: "12 km from store - 45 min delivery"
  }
};

// Mock driver starting positions
export const MOCK_DRIVER_LOCATIONS: Record<string, TestLocation> = {
  // Driver near store (just finished delivery)
  AT_STORE: {
    latitude: 19.1140,
    longitude: 72.8700,
    name: "Near Store",
    description: "At store parking"
  },

  // Driver in middle of another delivery
  EN_ROUTE: {
    latitude: 19.1250,
    longitude: 72.8650,
    name: "En Route",
    description: "Currently delivering another order"
  },

  // Driver far from store
  FAR_AWAY: {
    latitude: 19.0900,
    longitude: 72.8500,
    name: "Far Location",
    description: "Returning from long delivery"
  }
};

// Pre-configured test scenarios
export const TEST_SCENARIOS: Record<string, TestDeliveryScenario> = {
  QUICK_DELIVERY: {
    store: MOCK_STORE_LOCATION,
    customer: MOCK_CUSTOMER_LOCATIONS.NEARBY,
    driver: MOCK_DRIVER_LOCATIONS.AT_STORE,
    estimatedDistance: 0.8,
    estimatedTime: 5
  },

  NORMAL_DELIVERY: {
    store: MOCK_STORE_LOCATION,
    customer: MOCK_CUSTOMER_LOCATIONS.MEDIUM,
    driver: MOCK_DRIVER_LOCATIONS.EN_ROUTE,
    estimatedDistance: 2.5,
    estimatedTime: 15
  },

  LONG_DELIVERY: {
    store: MOCK_STORE_LOCATION,
    customer: MOCK_CUSTOMER_LOCATIONS.FAR,
    driver: MOCK_DRIVER_LOCATIONS.AT_STORE,
    estimatedDistance: 5.2,
    estimatedTime: 25
  },

  EDGE_CASE_DELIVERY: {
    store: MOCK_STORE_LOCATION,
    customer: MOCK_CUSTOMER_LOCATIONS.VERY_FAR,
    driver: MOCK_DRIVER_LOCATIONS.FAR_AWAY,
    estimatedDistance: 12.0,
    estimatedTime: 45
  }
};

// Helper function to get test scenario by name
export const getTestScenario = (scenarioName: keyof typeof TEST_SCENARIOS): TestDeliveryScenario => {
  return TEST_SCENARIOS[scenarioName];
};

// Helper to convert to GeoJSON Point format
export const toGeoJSONPoint = (location: TestLocation) => ({
  type: 'Point' as const,
  coordinates: [location.longitude, location.latitude] as [number, number] // [lng, lat] tuple for GeoJSON
});

// Helper to convert to AddressDTO format
export const toAddressDTO = (location: TestLocation) => ({
  latitude: location.latitude,
  longitude: location.longitude,
  street: location.name,
  city: "Mumbai",
  state: "Maharashtra",
  zipCode: "400053"
});

// Get random customer location for variety in testing
export const getRandomCustomerLocation = (): TestLocation => {
  const locations = Object.values(MOCK_CUSTOMER_LOCATIONS);
  return locations[Math.floor(Math.random() * locations.length)];
};

// Get random driver location for variety in testing
export const getRandomDriverLocation = (): TestLocation => {
  const locations = Object.values(MOCK_DRIVER_LOCATIONS);
  return locations[Math.floor(Math.random() * locations.length)];
};

// Check if running in test/development mode
export const isTestMode = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.VITE_TEST_MODE === 'true';
};

// Get location based on environment
export const getLocationOrMock = (actualLocation: TestLocation | null, mockLocation: TestLocation): TestLocation => {
  if (isTestMode()) {
    return mockLocation;
  }
  return actualLocation || mockLocation;
};
