import React, { useState } from 'react';
import {
  useGetRecentReviewsQuery,
  useGetReviewsNeedingResponseQuery,
  useGetPendingReviewsQuery,
  useGetFlaggedReviewsQuery,
  useGetOverallStatsQuery,
  useCreateResponseMutation,
  useGetResponseTemplatesQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
  Review,
  ResponseType,
} from '../../store/api/reviewApi';
import ReviewCard from '../../components/reviews/ReviewCard';
import { Card } from '../../components/ui/neumorphic/Card';
import { Button } from '../../components/ui/neumorphic/Button';
import { LoadingSpinner } from '../../components/ui/neumorphic/LoadingSpinner';
import { Badge } from '../../components/ui/neumorphic/Badge';
import {
  Star,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Flag,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const ReviewManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'needs-response' | 'pending' | 'flagged'>(
    'all'
  );
  const [page, setPage] = useState(0);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseType | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetOverallStatsQuery();
  const { data: templates } = useGetResponseTemplatesQuery();

  const { data: allReviews, isLoading: allLoading } = useGetRecentReviewsQuery(
    { page, size: 20 },
    { skip: activeTab !== 'all' }
  );

  const { data: needsResponse, isLoading: needsLoading } = useGetReviewsNeedingResponseQuery(
    { page, size: 20 },
    { skip: activeTab !== 'needs-response' }
  );

  const { data: pending, isLoading: pendingLoading } = useGetPendingReviewsQuery(
    { page, size: 20 },
    { skip: activeTab !== 'pending' }
  );

  const { data: flagged, isLoading: flaggedLoading } = useGetFlaggedReviewsQuery(
    { page, size: 20 },
    { skip: activeTab !== 'flagged' }
  );

  const [createResponse, { isLoading: isCreatingResponse }] = useCreateResponseMutation();
  const [approveReview] = useApproveReviewMutation();
  const [rejectReview] = useRejectReviewMutation();

  const currentData = {
    all: allReviews,
    'needs-response': needsResponse,
    pending: pending,
    flagged: flagged,
  }[activeTab];

  const isLoading = {
    all: allLoading,
    'needs-response': needsLoading,
    pending: pendingLoading,
    flagged: flaggedLoading,
  }[activeTab];

  const handleReply = (review: Review) => {
    setSelectedReview(review);
    setResponseText('');
    setSelectedTemplate(null);
    setShowResponseDialog(true);
  };

  const handleTemplateSelect = (type: ResponseType) => {
    setSelectedTemplate(type);
    if (templates && templates[type]) {
      setResponseText(templates[type]);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      await createResponse({
        reviewId: selectedReview.id,
        request: {
          responseText,
          responseType: selectedTemplate || ResponseType.CUSTOM,
          isTemplate: !!selectedTemplate,
        },
      }).unwrap();

      setShowResponseDialog(false);
      setSelectedReview(null);
      setResponseText('');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to create response:', error);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await approveReview(reviewId).unwrap();
    } catch (error) {
      console.error('Failed to approve review:', error);
    }
  };

  const handleRejectClick = (review: Review) => {
    setSelectedReview(review);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedReview || !rejectReason.trim()) return;

    try {
      await rejectReview({
        reviewId: selectedReview.id,
        reason: rejectReason,
      }).unwrap();

      setShowRejectDialog(false);
      setSelectedReview(null);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject review:', error);
    }
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'UP') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (direction === 'DOWN') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="text-gray-600">Monitor and respond to customer reviews</p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="flex justify-center mb-8">
            <LoadingSpinner />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Average Rating</h3>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
                <span className="text-sm text-gray-500">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(stats.trendDirection)}
                <span className="text-sm text-gray-600">
                  {stats.recentTrendPercentage > 0 ? '+' : ''}
                  {stats.recentTrendPercentage.toFixed(1)}%
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Reviews</h3>
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
              <div className="mt-2">
                <span className="text-sm text-green-600">{stats.positiveReviews} positive</span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Food Quality</h3>
                <Star className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageFoodQualityRating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Average rating</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Service Rating</h3>
                <CheckCircle className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageServiceRating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Average rating</p>
            </Card>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={activeTab === 'all' ? 'primary' : 'secondary'}
            onClick={() => {
              setActiveTab('all');
              setPage(0);
            }}
          >
            All Reviews
          </Button>
          <Button
            variant={activeTab === 'needs-response' ? 'primary' : 'secondary'}
            onClick={() => {
              setActiveTab('needs-response');
              setPage(0);
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Needs Response
          </Button>
          <Button
            variant={activeTab === 'pending' ? 'primary' : 'secondary'}
            onClick={() => {
              setActiveTab('pending');
              setPage(0);
            }}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </Button>
          <Button
            variant={activeTab === 'flagged' ? 'primary' : 'secondary'}
            onClick={() => {
              setActiveTab('flagged');
              setPage(0);
            }}
          >
            <Flag className="w-4 h-4 mr-2" />
            Flagged
          </Button>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : currentData && currentData.content.length > 0 ? (
          <>
            <div className="space-y-4">
              {currentData.content.map((review) => (
                <div key={review.id}>
                  <ReviewCard
                    review={review}
                    showActions
                    onReplyClick={() => handleReply(review)}
                  />
                  {activeTab === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRejectClick(review)}
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {currentData.totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page + 1} of {currentData.totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= currentData.totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No reviews found in this category</p>
          </Card>
        )}

        {/* Response Dialog */}
        {showResponseDialog && selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Respond to Review</h3>

              {/* Review Summary */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{selectedReview.customerName}</span>
                  <Badge variant="default">{selectedReview.overallRating} ★</Badge>
                </div>
                <p className="text-sm text-gray-600">{selectedReview.comment}</p>
              </div>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use Template (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ResponseType).map(([key, value]) => (
                    <button
                      key={value}
                      onClick={() => handleTemplateSelect(value)}
                      className={`px-4 py-2 rounded-lg border transition ${
                        selectedTemplate === value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {key.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response *
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Write your response to the customer..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || isCreatingResponse}
                  className="flex-1"
                >
                  {isCreatingResponse ? 'Submitting...' : 'Submit Response'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowResponseDialog(false)}
                  disabled={isCreatingResponse}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Reject Dialog */}
        {showRejectDialog && selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Review</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this review.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                placeholder="Reason for rejection..."
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1"
                >
                  Reject Review
                </Button>
                <Button variant="secondary" onClick={() => setShowRejectDialog(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewManagementPage;
