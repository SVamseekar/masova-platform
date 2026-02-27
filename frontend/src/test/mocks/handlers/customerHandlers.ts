import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const mockCustomer = {
  id: 'cust-1',
  userId: '1',
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '555-0123',
  addresses: [
    {
      id: 'addr-1',
      label: 'HOME',
      addressLine1: '123 Main St',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
      country: 'India',
      isDefault: true,
      createdAt: '2025-01-01T00:00:00Z',
    },
  ],
  defaultAddressId: 'addr-1',
  loyaltyInfo: {
    totalPoints: 500,
    pointsEarned: 600,
    pointsRedeemed: 100,
    tier: 'SILVER',
    pointHistory: [],
  },
  preferences: {
    favoriteMenuItems: ['1'],
    cuisinePreferences: ['SOUTH_INDIAN'],
    dietaryRestrictions: [],
    allergens: [],
    spiceLevel: 'MEDIUM',
    notifyOnOffers: true,
    notifyOnOrderStatus: true,
  },
  orderStats: {
    totalOrders: 15,
    completedOrders: 14,
    cancelledOrders: 1,
    totalSpent: 12500,
    averageOrderValue: 833,
  },
  active: true,
  emailVerified: true,
  phoneVerified: true,
  marketingOptIn: true,
  smsOptIn: false,
  tags: ['regular'],
  notes: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
};

export const customerHandlers = [
  http.post(`${API}/api/customers`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/get-or-create`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.get(`${API}/api/customers/:id`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.get(`${API}/api/customers/user/:userId`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.get(`${API}/api/customers/email/:email`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.get(`${API}/api/customers/phone/:phone`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.get(`${API}/api/customers`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.get(`${API}/api/customers/active`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.get(`${API}/api/customers/search`, () =>
    HttpResponse.json({
      content: [mockCustomer],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }),
  ),

  http.put(`${API}/api/customers/:id`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.patch(`${API}/api/customers/:id/deactivate`, () =>
    HttpResponse.json({ ...mockCustomer, active: false }),
  ),

  http.patch(`${API}/api/customers/:id/activate`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:customerId/addresses`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.patch(`${API}/api/customers/:customerId/addresses/:addressId`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.delete(`${API}/api/customers/:customerId/addresses/:addressId`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.patch(`${API}/api/customers/:customerId/addresses/:addressId/set-default`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:customerId/loyalty/points`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:customerId/loyalty/redeem`, () =>
    HttpResponse.json({ customer: mockCustomer, pointsRedeemed: 100, discountAmount: 50 }),
  ),

  http.get(`${API}/api/customers/:customerId/loyalty/max-redeemable`, () =>
    HttpResponse.json({ maxRedeemablePoints: 300, maxDiscountAmount: 150, redemptionRate: '2:1' }),
  ),

  http.get(`${API}/api/customers/loyalty/tier/:tier`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.put(`${API}/api/customers/:customerId/preferences`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:customerId/order-stats`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:customerId/notes`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.patch(`${API}/api/customers/:customerId/verify-email`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.patch(`${API}/api/customers/:customerId/verify-phone`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:customerId/tags`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.delete(`${API}/api/customers/:customerId/tags`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.get(`${API}/api/customers/tags`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.get(`${API}/api/customers/high-value`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.get(`${API}/api/customers/top-spenders`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.get(`${API}/api/customers/recently-active`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.get(`${API}/api/customers/inactive`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${API}/api/customers/birthdays/today`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${API}/api/customers/marketing-opt-in`, () =>
    HttpResponse.json([mockCustomer]),
  ),

  http.get(`${API}/api/customers/sms-opt-in`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${API}/api/customers/stats`, () =>
    HttpResponse.json({
      totalCustomers: 150,
      activeCustomers: 120,
      inactiveCustomers: 30,
      verifiedEmails: 100,
      verifiedPhones: 80,
      customersByTier: { BRONZE: 60, SILVER: 40, GOLD: 15, PLATINUM: 5 },
      highValueCustomers: 20,
      averageLifetimeValue: 8500,
    }),
  ),

  http.get(`${API}/api/customers/:customerId/order-stats`, () =>
    HttpResponse.json(mockCustomer.orderStats),
  ),

  http.get(`${API}/api/customers/:customerId/preferences`, () =>
    HttpResponse.json(mockCustomer.preferences),
  ),

  http.get(`${API}/api/customers/:customerId/loyalty/points`, () =>
    HttpResponse.json(mockCustomer.loyaltyInfo),
  ),

  http.get(`${API}/api/customers/:customerId/addresses`, () =>
    HttpResponse.json(mockCustomer.addresses),
  ),

  http.delete(`${API}/api/customers/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
