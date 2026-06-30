import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

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
  http.get(apiUrl('/menu'), ({ request }) => {
    const url = new URL(request.url);

    if (url.searchParams.get('recommended') === 'true') {
      return HttpResponse.json(mockMenuItems.filter((item) => item.isRecommended));
    }
    if (url.searchParams.has('search')) {
      return HttpResponse.json(mockMenuItems);
    }
    if (url.searchParams.has('cuisine')) {
      return HttpResponse.json(mockMenuItems);
    }
    if (url.searchParams.has('category')) {
      return HttpResponse.json(mockMenuItems);
    }
    if (url.searchParams.has('dietary')) {
      return HttpResponse.json(mockMenuItems.filter((item) => item.dietaryInfo.includes('VEGETARIAN')));
    }
    if (url.searchParams.has('tag')) {
      return HttpResponse.json(mockMenuItems);
    }

    return HttpResponse.json(mockMenuItems);
  }),

  http.get(apiUrl('/menu/stats'), () =>
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

  http.get(apiUrl('/menu/:id'), ({ params }) =>
    HttpResponse.json({ ...mockMenuItems[0], id: params.id }),
  ),

  http.post(apiUrl('/menu'), () =>
    HttpResponse.json({ ...mockMenuItems[0], id: '99' }),
  ),

  http.post(apiUrl('/menu/bulk'), () =>
    HttpResponse.json(mockMenuItems),
  ),

  http.patch(apiUrl('/menu/:id'), ({ params }) =>
    HttpResponse.json({ ...mockMenuItems[0], id: params.id, isAvailable: false }),
  ),

  http.delete(apiUrl('/menu/:id'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.patch(apiUrl('/menu/items/:id/allergens'), ({ params }) =>
    HttpResponse.json({ ...mockMenuItems[0], id: params.id }),
  ),
];