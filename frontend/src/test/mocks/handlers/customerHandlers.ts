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
  http.get(`${API}/api/customers`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('search') || url.searchParams.get('query')) {
      return HttpResponse.json({
        content: [mockCustomer],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      });
    }
    return HttpResponse.json([mockCustomer]);
  }),

  http.post(`${API}/api/customers`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/get-or-create`, () =>
    HttpResponse.json(mockCustomer),
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

  http.get(`${API}/api/customers/:id`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('loyaltyInfo') === 'true') {
      return HttpResponse.json({
        maxRedeemablePoints: 300,
        maxDiscountAmount: 30,
        redemptionRate: '1:0.1',
      });
    }
    return HttpResponse.json(mockCustomer);
  }),

  http.patch(`${API}/api/customers/:id`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:id/activate`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:id/deactivate`, () =>
    HttpResponse.json({ ...mockCustomer, active: false }),
  ),

  http.post(`${API}/api/customers/:id/loyalty`, () =>
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

  http.post(`${API}/api/customers/:customerId/tags`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.delete(`${API}/api/customers/:customerId/tags`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(`${API}/api/customers/:id`, () =>
    HttpResponse.json(mockCustomer),
  ),

  http.delete(`${API}/api/customers/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
