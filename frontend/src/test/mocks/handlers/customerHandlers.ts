import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

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
  http.post(apiUrl('/customers'), () => HttpResponse.json(mockCustomer)),
  http.post(apiUrl('/customers/get-or-create'), () => HttpResponse.json(mockCustomer)),

  http.get(apiUrl('/customers'), ({ request }) => {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const phone = url.searchParams.get('phone');
    const userId = url.searchParams.get('userId');
    const tier = url.searchParams.get('tier');
    const tag = url.searchParams.get('tag');
    const search = url.searchParams.get('search');

    if (email || phone || userId) {
      return HttpResponse.json([mockCustomer]);
    }
    if (tier || tag || search) {
      return HttpResponse.json([mockCustomer]);
    }
    return HttpResponse.json([mockCustomer]);
  }),

  http.get(apiUrl('/customers/stats'), () =>
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

  http.get(apiUrl('/customers/:id'), () => HttpResponse.json(mockCustomer)),

  http.patch(apiUrl('/customers/:id'), () => HttpResponse.json(mockCustomer)),

  http.post(apiUrl('/customers/:id/deactivate'), () =>
    HttpResponse.json({ ...mockCustomer, active: false }),
  ),

  http.post(apiUrl('/customers/:id/activate'), () => HttpResponse.json(mockCustomer)),

  http.post(apiUrl('/customers/:customerId/addresses'), () => HttpResponse.json(mockCustomer)),

  http.patch(apiUrl('/customers/:customerId/addresses/:addressId'), () =>
    HttpResponse.json(mockCustomer),
  ),

  http.delete(apiUrl('/customers/:customerId/addresses/:addressId'), () =>
    HttpResponse.json(mockCustomer),
  ),

  http.post(apiUrl('/customers/:customerId/loyalty'), () => HttpResponse.json(mockCustomer)),

  http.post(apiUrl('/customers/:customerId/tags'), () => HttpResponse.json(mockCustomer)),

  http.post(apiUrl('/customers/:customerId/notes'), () => HttpResponse.json(mockCustomer)),

  http.delete(apiUrl('/customers/:id'), () => new HttpResponse(null, { status: 204 })),
];