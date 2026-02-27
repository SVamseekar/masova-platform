import type { Store, Address, StoreOperatingConfig, WeeklySchedule } from '../../store/api/storeApi';

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

const downtownAddress: Address = {
  street: '123 Main Street',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
  landmark: 'Near Charminar',
  latitude: 17.385,
  longitude: 78.4867,
};

const uptownAddress: Address = {
  street: '456 Tech Park Road',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500081',
  landmark: 'Near HITEC City Metro',
  latitude: 17.4435,
  longitude: 78.3772,
};

// ---------------------------------------------------------------------------
// Operating configs
// ---------------------------------------------------------------------------

function createDaySlot(isOpen: boolean, start = '09:00', end = '22:00') {
  return { startTime: start, endTime: end, isOpen };
}

const standardSchedule: WeeklySchedule = {
  MONDAY: createDaySlot(true),
  TUESDAY: createDaySlot(true),
  WEDNESDAY: createDaySlot(true),
  THURSDAY: createDaySlot(true),
  FRIDAY: createDaySlot(true),
  SATURDAY: createDaySlot(true, '10:00', '23:00'),
  SUNDAY: createDaySlot(true, '10:00', '21:00'),
};

const standardOperatingConfig: StoreOperatingConfig = {
  weeklySchedule: standardSchedule,
  deliveryRadiusKm: 10,
  maxConcurrentOrders: 50,
  estimatedPrepTimeMinutes: 20,
  acceptsOnlineOrders: true,
  minimumOrderValueINR: 200,
};

// ---------------------------------------------------------------------------
// Store fixtures
// ---------------------------------------------------------------------------

export const mockStore: Store = {
  id: 'store-1',
  name: 'Downtown Branch',
  storeCode: 'DT-001',
  address: downtownAddress,
  phoneNumber: '555-0100',
  status: 'ACTIVE',
  operatingConfig: standardOperatingConfig,
  openingDate: '2025-01-15',
  createdAt: '2025-01-01T00:00:00Z',
  lastModified: '2026-02-01T00:00:00Z',
};

export const mockStoreUptown: Store = {
  id: 'store-2',
  name: 'HITEC City Branch',
  storeCode: 'HC-002',
  address: uptownAddress,
  phoneNumber: '555-0200',
  status: 'ACTIVE',
  operatingConfig: {
    ...standardOperatingConfig,
    maxConcurrentOrders: 75,
    deliveryRadiusKm: 8,
  },
  openingDate: '2025-06-01',
  createdAt: '2025-05-15T00:00:00Z',
  lastModified: '2026-02-01T00:00:00Z',
};

export const mockStoreTemporarilyClosed: Store = {
  id: 'store-3',
  name: 'Secunderabad Branch',
  storeCode: 'SC-003',
  address: {
    street: '789 Station Road',
    city: 'Secunderabad',
    state: 'Telangana',
    pincode: '500003',
  },
  phoneNumber: '555-0300',
  status: 'TEMPORARILY_CLOSED',
  operatingConfig: standardOperatingConfig,
  createdAt: '2025-03-01T00:00:00Z',
  lastModified: '2026-02-10T00:00:00Z',
};

export const mockStoreWithSpecialHours: Store = {
  ...mockStore,
  id: 'store-4',
  name: 'Festival Branch',
  storeCode: 'FB-004',
  operatingConfig: {
    ...standardOperatingConfig,
    specialHours: [
      {
        date: '2026-03-14',
        reason: 'Holi Festival',
        isClosed: false,
        timeSlot: { startTime: '11:00', endTime: '20:00' },
      },
      {
        date: '2026-03-31',
        reason: 'Annual Maintenance',
        isClosed: true,
      },
    ],
  },
};

export const mockStorePendingApproval: Store = {
  id: 'store-5',
  name: 'New Location',
  storeCode: 'NL-005',
  address: {
    street: '100 New Market',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500010',
  },
  status: 'PENDING_APPROVAL',
  operatingConfig: standardOperatingConfig,
  createdAt: '2026-02-14T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export const mockStoreList: Store[] = [
  mockStore,
  mockStoreUptown,
  mockStoreTemporarilyClosed,
];

export const mockActiveStoreList: Store[] = [
  mockStore,
  mockStoreUptown,
];
