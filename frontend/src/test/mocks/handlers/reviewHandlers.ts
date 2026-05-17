import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

export const reviewHandlers = [
  http.post(`${API}/api/reviews`, () =>
    HttpResponse.json(mockReview),
  ),

  http.get(`${API}/api/reviews`, () =>
    HttpResponse.json(pagedReviews),
  ),

  http.get(`${API}/api/reviews/stats`, () =>
    HttpResponse.json({
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
    }),
  ),

  http.get(`${API}/api/reviews/public/token/:token`, () =>
    HttpResponse.json(mockReview),
  ),

  http.post(`${API}/api/reviews/public/submit`, () =>
    HttpResponse.json(mockReview),
  ),

  http.get(`${API}/api/reviews/response-templates`, () =>
    HttpResponse.json({
      THANK_YOU: 'Thank you for your kind feedback!',
      APOLOGY: 'We apologize for the inconvenience.',
      CLARIFICATION: 'We would like to clarify...',
      RESOLUTION_OFFERED: 'We would like to offer...',
      CUSTOM: '',
    }),
  ),

  http.get(`${API}/api/reviews/:reviewId`, () =>
    HttpResponse.json(mockReview),
  ),

  http.patch(`${API}/api/reviews/:reviewId`, () =>
    HttpResponse.json(mockReview),
  ),

  http.delete(`${API}/api/reviews/:reviewId`, () =>
    HttpResponse.json({ message: 'Review deleted' }),
  ),

  http.post(`${API}/api/reviews/:reviewId/response`, () =>
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

  http.get(`${API}/api/reviews/:reviewId/response`, () =>
    HttpResponse.json({
      id: 'resp-1',
      reviewId: 'review-1',
      responseText: 'Thank you for your feedback!',
    }),
  ),
];
