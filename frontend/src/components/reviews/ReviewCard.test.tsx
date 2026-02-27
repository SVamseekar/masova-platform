import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewCard from './ReviewCard';
import type { Review, ReviewResponse } from '../../store/api/reviewApi';

// Mock date-fns to produce stable output
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 hours ago',
}));

const mockReview: Review = {
  id: 'review-1',
  orderId: 'order-1',
  customerId: 'cust-1',
  customerName: 'John Doe',
  overallRating: 4,
  comment: 'Great food and fast delivery!',
  foodQualityRating: 5,
  serviceRating: 4,
  deliveryRating: 3,
  isAnonymous: false,
  isVerifiedPurchase: true,
  photoUrls: [],
  status: 'APPROVED',
  itemReviews: [],
  sentiment: 'POSITIVE',
  createdAt: '2026-02-15T10:00:00Z',
  updatedAt: '2026-02-15T10:00:00Z',
};

const mockResponse: ReviewResponse = {
  id: 'resp-1',
  reviewId: 'review-1',
  managerId: 'user-2',
  managerName: 'Manager',
  responseText: 'Thank you for your feedback!',
  responseType: 'THANK_YOU',
  isTemplate: false,
  createdAt: '2026-02-15T12:00:00Z',
  updatedAt: '2026-02-15T12:00:00Z',
  isEdited: false,
  isDeleted: false,
};

describe('ReviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows the customer name', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows "Anonymous" when review is anonymous', () => {
    const anonymousReview = { ...mockReview, isAnonymous: true };
    render(<ReviewCard review={anonymousReview} />);
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('renders the review comment', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('Great food and fast delivery!')).toBeInTheDocument();
  });

  it('renders food quality rating when present', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('Food Quality:')).toBeInTheDocument();
  });

  it('renders service rating when present', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('Service:')).toBeInTheDocument();
  });

  it('renders delivery rating when present', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('Delivery:')).toBeInTheDocument();
  });

  it('shows approved status badge', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('shows pending status badge for pending review', () => {
    const pendingReview = { ...mockReview, status: 'PENDING' as const };
    render(<ReviewCard review={pendingReview} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows flagged status badge and flag reason', () => {
    const flaggedReview = {
      ...mockReview,
      status: 'FLAGGED' as const,
      flagReason: 'Inappropriate content',
    };
    render(<ReviewCard review={flaggedReview} />);
    expect(screen.getByText('Flagged')).toBeInTheDocument();
    expect(screen.getByText('Inappropriate content')).toBeInTheDocument();
  });

  it('renders sentiment badge', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('POSITIVE')).toBeInTheDocument();
  });

  it('renders management response when provided', () => {
    render(<ReviewCard review={mockReview} response={mockResponse} />);
    expect(screen.getByText('Management Response')).toBeInTheDocument();
    expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
  });

  it('shows (Edited) label for edited responses', () => {
    const editedResponse = { ...mockResponse, isEdited: true };
    render(<ReviewCard review={mockReview} response={editedResponse} />);
    expect(screen.getByText('(Edited)')).toBeInTheDocument();
  });

  it('does not show actions by default', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    expect(screen.queryByText('Flag')).not.toBeInTheDocument();
  });

  it('shows Reply button when showActions is true and no response exists', () => {
    const onReplyClick = vi.fn();
    render(
      <ReviewCard review={mockReview} showActions onReplyClick={onReplyClick} />
    );
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('hides Reply button when a response already exists', () => {
    const onReplyClick = vi.fn();
    render(
      <ReviewCard
        review={mockReview}
        response={mockResponse}
        showActions
        onReplyClick={onReplyClick}
      />
    );
    expect(screen.queryByText('Reply')).not.toBeInTheDocument();
  });

  it('shows Flag button when showActions is true and review is not flagged', () => {
    const onFlagClick = vi.fn();
    render(
      <ReviewCard review={mockReview} showActions onFlagClick={onFlagClick} />
    );
    expect(screen.getByText('Flag')).toBeInTheDocument();
  });

  it('hides Flag button when review is already flagged', () => {
    const flaggedReview = { ...mockReview, status: 'FLAGGED' as const };
    const onFlagClick = vi.fn();
    render(
      <ReviewCard review={flaggedReview} showActions onFlagClick={onFlagClick} />
    );
    expect(screen.queryByText('Flag')).not.toBeInTheDocument();
  });

  it('calls onReplyClick when Reply is clicked', async () => {
    const user = userEvent.setup();
    const onReplyClick = vi.fn();
    render(
      <ReviewCard review={mockReview} showActions onReplyClick={onReplyClick} />
    );

    await user.click(screen.getByText('Reply'));
    expect(onReplyClick).toHaveBeenCalledTimes(1);
  });

  it('calls onFlagClick when Flag is clicked', async () => {
    const user = userEvent.setup();
    const onFlagClick = vi.fn();
    render(
      <ReviewCard review={mockReview} showActions onFlagClick={onFlagClick} />
    );

    await user.click(screen.getByText('Flag'));
    expect(onFlagClick).toHaveBeenCalledTimes(1);
  });

  it('renders item reviews when present', () => {
    const reviewWithItems = {
      ...mockReview,
      itemReviews: [
        { menuItemId: 'item-1', menuItemName: 'Pizza', rating: 5, comment: 'Delicious!' },
      ],
    };
    render(<ReviewCard review={reviewWithItems} />);
    expect(screen.getByText('Item Ratings:')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Delicious!')).toBeInTheDocument();
  });

  it('renders photo thumbnails when present', () => {
    const reviewWithPhotos = {
      ...mockReview,
      photoUrls: ['/photo1.jpg', '/photo2.jpg'],
    };
    render(<ReviewCard review={reviewWithPhotos} />);
    const photos = screen.getAllByRole('img');
    expect(photos).toHaveLength(2);
  });

  it('renders driver rating section when present', () => {
    const reviewWithDriver = {
      ...mockReview,
      driverRating: 4,
      driverComment: 'Very polite driver',
    };
    render(<ReviewCard review={reviewWithDriver} />);
    expect(screen.getByText('Driver Rating:')).toBeInTheDocument();
    expect(screen.getByText('Very polite driver')).toBeInTheDocument();
  });

  it('renders time ago text', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });
});
