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
  http.post(`${API}/reviews`, () =>
    HttpResponse.json(mockReview),
  ),

  http.get(`${API}/reviews/:reviewId`, () =>
    HttpResponse.json(mockReview),
  ),

  http.get(`${API}/reviews/order/:orderId`, () =>
    HttpResponse.json([mockReview]),
  ),

  http.get(`${API}/reviews/customer/:customerId`, () =>
    HttpResponse.json(pagedReviews),
  ),

  http.get(`${API}/reviews/driver/:driverId`, () =>
    HttpResponse.json(pagedReviews),
  ),

  http.get(`${API}/reviews/item/:menuItemId`, () =>
    HttpResponse.json(pagedReviews),
  ),

  http.get(`${API}/reviews/recent`, () =>
    HttpResponse.json(pagedReviews),
  ),

  http.get(`${API}/reviews/needs-response`, () =>
    HttpResponse.json({ ...pagedReviews, content: [] }),
  ),

  http.patch(`${API}/reviews/:reviewId/flag`, () =>
    HttpResponse.json({ ...mockReview, status: 'FLAGGED' }),
  ),

  http.patch(`${API}/reviews/:reviewId/status`, () =>
    HttpResponse.json(mockReview),
  ),

  http.delete(`${API}/reviews/:reviewId`, () =>
    HttpResponse.json({ message: 'Review deleted' }),
  ),

  http.get(`${API}/reviews/stats/overall`, () =>
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

  http.get(`${API}/reviews/stats/driver/:driverId`, () =>
    HttpResponse.json({
      driverId: 'driver-1',
      driverName: 'Rajesh Kumar',
      totalReviews: 50,
      averageRating: 4.6,
      ratingDistribution: { 3: 3, 4: 15, 5: 32 },
      positiveReviews: 47,
      negativeReviews: 3,
      last30DaysRating: 4.7,
      performanceTrend: 'IMPROVING',
    }),
  ),

  http.get(`${API}/reviews/stats/item/:menuItemId`, () =>
    HttpResponse.json({
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
    }),
  ),

  http.get(`${API}/reviews/public/item/:menuItemId/average`, () =>
    HttpResponse.json({ menuItemId: '1', averageRating: 4.7, totalReviews: 80 }),
  ),

  http.get(`${API}/reviews/pending`, () =>
    HttpResponse.json({ ...pagedReviews, content: [] }),
  ),

  http.get(`${API}/reviews/flagged`, () =>
    HttpResponse.json({ ...pagedReviews, content: [] }),
  ),

  http.post(`${API}/reviews/:reviewId/approve`, () =>
    HttpResponse.json({ ...mockReview, status: 'APPROVED' }),
  ),

  http.post(`${API}/reviews/:reviewId/reject`, () =>
    HttpResponse.json({ ...mockReview, status: 'REJECTED' }),
  ),

  // Responses
  http.post(`${API}/responses/review/:reviewId`, () =>
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

  http.get(`${API}/responses/review/:reviewId`, () =>
    HttpResponse.json({
      id: 'resp-1',
      reviewId: 'review-1',
      responseText: 'Thank you for your feedback!',
    }),
  ),

  http.get(`${API}/responses/templates`, () =>
    HttpResponse.json({
      THANK_YOU: 'Thank you for your kind feedback!',
      APOLOGY: 'We apologize for the inconvenience.',
      CLARIFICATION: 'We would like to clarify...',
      RESOLUTION_OFFERED: 'We would like to offer...',
      CUSTOM: '',
    }),
  ),

  http.get(`${API}/reviews/staff/:staffId/rating`, () =>
    HttpResponse.json({ staffId: '2', staffName: 'Staff Member', averageRating: 4.5, totalReviews: 30 }),
  ),

  http.get(`${API}/reviews/staff/:staffId`, () =>
    HttpResponse.json(pagedReviews),
  ),
];
