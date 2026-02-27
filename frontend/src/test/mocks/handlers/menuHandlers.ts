import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const mockMenuItems = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato and mozzarella',
    cuisine: 'ITALIAN',
    category: 'PIZZA',
    basePrice: 29900,
    isAvailable: true,
    imageUrl: '/images/pizza.jpg',
    displayOrder: 1,
    isRecommended: true,
    preparationTime: 15,
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'NONE',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Cheeseburger',
    description: 'Juicy beef patty with cheese',
    cuisine: 'AMERICAN',
    category: 'BURGER',
    basePrice: 19900,
    isAvailable: true,
    imageUrl: '/images/burger.jpg',
    displayOrder: 2,
    isRecommended: false,
    preparationTime: 10,
    dietaryInfo: ['NON_VEGETARIAN'],
    spiceLevel: 'MILD',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Masala Dosa',
    description: 'Crispy dosa with spiced potato filling',
    cuisine: 'SOUTH_INDIAN',
    category: 'DOSA',
    basePrice: 12000,
    isAvailable: true,
    imageUrl: '/images/dosa.jpg',
    displayOrder: 3,
    isRecommended: true,
    preparationTime: 12,
    dietaryInfo: ['VEGETARIAN', 'VEGAN'],
    spiceLevel: 'MEDIUM',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

export const menuHandlers = [
  // Public endpoints
  http.get(`${API}/menu/public`, () =>
    HttpResponse.json(mockMenuItems),
  ),

  http.get(`${API}/menu/public/:id`, ({ params }) =>
    HttpResponse.json({ ...mockMenuItems[0], id: params.id }),
  ),

  http.get(`${API}/menu/public/cuisine/:cuisine`, () =>
    HttpResponse.json(mockMenuItems),
  ),

  http.get(`${API}/menu/public/category/:category`, () =>
    HttpResponse.json(mockMenuItems),
  ),

  http.get(`${API}/menu/public/dietary/:dietaryType`, () =>
    HttpResponse.json(mockMenuItems.filter((item) => item.dietaryInfo.includes('VEGETARIAN'))),
  ),

  http.get(`${API}/menu/public/recommended`, () =>
    HttpResponse.json(mockMenuItems.filter((item) => item.isRecommended)),
  ),

  http.get(`${API}/menu/public/search`, () =>
    HttpResponse.json(mockMenuItems),
  ),

  http.get(`${API}/menu/public/tag/:tag`, () =>
    HttpResponse.json(mockMenuItems),
  ),

  // Manager endpoints
  http.get(`${API}/menu/items`, () =>
    HttpResponse.json(mockMenuItems),
  ),

  http.post(`${API}/menu/items`, () =>
    HttpResponse.json({ ...mockMenuItems[0], id: '99' }),
  ),

  http.post(`${API}/menu/items/bulk`, () =>
    HttpResponse.json(mockMenuItems),
  ),

  http.put(`${API}/menu/items/:id`, ({ params }) =>
    HttpResponse.json({ ...mockMenuItems[0], id: params.id }),
  ),

  http.patch(`${API}/menu/items/:id/availability`, ({ params }) =>
    HttpResponse.json({ ...mockMenuItems[0], id: params.id, isAvailable: false }),
  ),

  http.patch(`${API}/menu/items/:id/availability/:status`, ({ params }) =>
    HttpResponse.json({ ...mockMenuItems[0], id: params.id, isAvailable: params.status === 'true' }),
  ),

  http.delete(`${API}/menu/items/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.delete(`${API}/menu/items`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${API}/menu/stats`, () =>
    HttpResponse.json({
      totalItems: 25,
      availableItems: 22,
      southIndianCount: 8,
      northIndianCount: 6,
      indoChineseCount: 4,
      italianCount: 3,
      pizzaCount: 3,
      burgerCount: 2,
    }),
  ),
];
