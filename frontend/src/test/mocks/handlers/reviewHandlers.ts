import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockReview = {
  id: 'review-1',
  orderId: 'order-1',
  customerId: 'cust-1',
  customerName: 'Test Customer',
  overallRating: 4,
  comment: 'Great food and fast delivery!',
  foodQualityRating: 5,
  serviceRating: 4,
  deliveryRating: 4,
  itemReviews: [
    { menuItemId: '1', menuItemName: 'Margherita Pizza', rating: 5, comment: 'Perfect' },
  ],
  isAnonymous: false,
  isVerifiedPurchase: true,
  photoUrls: [],
  status: 'APPROVED',
  sentiment: 'POSITIVE',
  sentimentScore: 0.85,
  createdAt: '2025-01-15T12:00:00Z',
  updatedAt: '2025-01-15T12:00:00Z',
  isDeleted: false,
};

const pagedReviews = {
  content: [mockReview],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
};

const overallStats = {
  totalReviews: 200,
  averageRating: 4.3,
  ratingDistribution: { 1: 5, 2: 10, 3: 25, 4: 80, 5: 80 },
  averageFoodQualityRating: 4.5,
  averageServiceRating: 4.2,
  averageDeliveryRating: 4.1,
  positiveReviews: 160,
  neutralReviews: 25,
  negativeReviews: 15,
  recentTrendPercentage: 5,
  trendDirection: 'UP',
};

const driverStats = {
  driverId: 'driver-1',
  driverName: 'Rajesh Kumar',
  totalReviews: 50,
  averageRating: 4.6,
  ratingDistribution: { 3: 3, 4: 15, 5: 32 },
  positiveReviews: 47,
  negativeReviews: 3,
  last30DaysRating: 4.7,
  performanceTrend: 'IMPROVING',
};

const itemStats = {
  menuItemId: '1',
  menuItemName: 'Margherita Pizza',
  totalReviews: 80,
  averageRating: 4.7,
  ratingDistribution: { 3: 5, 4: 20, 5: 55 },
  positiveReviews: 75,
  neutralReviews: 5,
  negativeReviews: 0,
  commonPraises: ['Delicious', 'Perfect crust'],
  commonComplaints: [],
  trendStatus: 'STABLE',
  recentRatingChange: 0.1,
};

export const reviewHandlers = [
  http.post(apiUrl('/reviews'), () => HttpResponse.json(mockReview)),

  http.get(apiUrl('/reviews/:reviewId'), () => HttpResponse.json(mockReview)),

  http.get(apiUrl('/reviews'), ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const status = url.searchParams.get('status');
    const flagged = url.searchParams.get('flagged');

    if (entityType === 'ORDER') {
      return HttpResponse.json([mockReview]);
    }
    if (status === 'PENDING' || flagged === 'true') {
      return HttpResponse.json({ ...pagedReviews, content: [] });
    }
    if (status === 'APPROVED') {
      return HttpResponse.json(pagedReviews);
    }
    return HttpResponse.json(pagedReviews);
  }),

  http.patch(apiUrl('/reviews/:reviewId'), () => HttpResponse.json(mockReview)),

  http.delete(apiUrl('/reviews/:reviewId'), () =>
    HttpResponse.json({ message: 'Review deleted' }),
  ),

  http.get(apiUrl('/reviews/stats'), ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    if (entityType === 'DRIVER') return HttpResponse.json(driverStats);
    if (entityType === 'MENU_ITEM') return HttpResponse.json(itemStats);
    return HttpResponse.json(overallStats);
  }),

  http.post(apiUrl('/reviews/:reviewId/response'), () =>
    HttpResponse.json({
      id: 'resp-1',
      reviewId: 'review-1',
      managerId: '3',
      managerName: 'Manager User',
      responseText: 'Thank you for your feedback!',
      responseType: 'THANK_YOU',
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
    }),
  ),

  http.get(apiUrl('/reviews/response-templates'), () =>
    HttpResponse.json({
      THANK_YOU: 'Thank you for your kind feedback!',
      APOLOGY: 'We apologize for the inconvenience.',
      CLARIFICATION: 'We would like to clarify...',
      RESOLUTION_OFFERED: 'We would like to offer...',
      CUSTOM: '',
    }),
  ),
];