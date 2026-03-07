import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
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
import { useTriggerReviewResponseMutation } from '../../store/api/agentApi';
import ReviewCard from '../../components/reviews/ReviewCard';
import Card from '../../components/ui/neumorphic/Card';
import Button from '../../components/ui/neumorphic/Button';
import { LoadingSpinner } from '../../components/ui/neumorphic/LoadingSpinner';
import Badge from '../../components/ui/neumorphic/Badge';
import AppHeader from '../../components/common/AppHeader';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
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
import { colors, shadows, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { FilterBar, FilterConfig, FilterValues, SortConfig } from '../../components/common/FilterBar';
import { applyFilters, applySort, exportToCSV, commonFilters } from '../../utils/filterUtils';

const ReviewManagementPage: React.FC = () => {
  const { handleBack } = useSmartBackNavigation();
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

  // Filter and Sort State
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    rating: '',
    responseStatus: '',
    dateRange: {},
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc',
  });

  // Filter Configuration
  const filterConfigs: FilterConfig[] = [
    {
      type: 'search',
      label: 'Search',
      field: 'search',
      placeholder: 'Search by customer name or review text...',
    },
    {
      type: 'select',
      label: 'Rating',
      field: 'rating',
      options: [
        { label: '5 Stars', value: '5' },
        { label: '4 Stars', value: '4' },
        { label: '3 Stars', value: '3' },
        { label: '2 Stars', value: '2' },
        { label: '1 Star', value: '1' },
      ],
    },
    {
      type: 'select',
      label: 'Response Status',
      field: 'responseStatus',
      options: [
        { label: 'Responded', value: 'responded' },
        { label: 'Not Responded', value: 'notResponded' },
      ],
    },
    {
      type: 'dateRange',
      label: 'Date Range',
      field: 'dateRange',
    },
  ];

  const sortOptions = [
    { label: 'Date', field: 'createdAt' },
    { label: 'Rating', field: 'overallRating' },
    { label: 'Customer Name', field: 'customerName' },
  ];

  // Get storeId
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const { data: stats, isLoading: statsLoading } = useGetOverallStatsQuery(storeId, { skip: !storeId });
  const { data: templates } = useGetResponseTemplatesQuery();

  const { data: allReviews, isLoading: allLoading } = useGetRecentReviewsQuery(
    { storeId, page, size: 20 },
    { skip: activeTab !== 'all' || !storeId }
  );

  const { data: needsResponse, isLoading: needsLoading } = useGetReviewsNeedingResponseQuery(
    { storeId, page, size: 20 },
    { skip: activeTab !== 'needs-response' || !storeId }
  );

  const { data: pending, isLoading: pendingLoading } = useGetPendingReviewsQuery(
    { storeId, page, size: 20 },
    { skip: activeTab !== 'pending' || !storeId }
  );

  const { data: flagged, isLoading: flaggedLoading } = useGetFlaggedReviewsQuery(
    { storeId, page, size: 20 },
    { skip: activeTab !== 'flagged' || !storeId }
  );

  const [createResponse, { isLoading: isCreatingResponse }] = useCreateResponseMutation();
  const [approveReview] = useApproveReviewMutation();
  const [rejectReview] = useRejectReviewMutation();
  const [triggerAIDraft, { isLoading: aiDraftLoading }] = useTriggerReviewResponseMutation();

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

  // Apply filters and sorting to current tab's reviews
  const filteredReviews = useMemo(() => {
    if (!currentData?.content) return [];

    const filtered = applyFilters(currentData.content, filterValues, {
      search: (review, value) =>
        commonFilters.searchText(review, value as string, ['customerName', 'comment']),
      rating: (review, value) => String(review.overallRating) === value,
      responseStatus: (review, value) => {
        if (value === 'responded') return !!review.response;
        if (value === 'notResponded') return !review.response;
        return true;
      },
      dateRange: (review, value) =>
        commonFilters.dateRange(review, value, 'createdAt'),
    });

    return applySort(filtered, sortConfig);
  }, [currentData, filterValues, sortConfig]);

  const handleReply = (review: Review) => {
    setSelectedReview(review);
    setResponseText('');
    setSelectedTemplate(null);
    setShowResponseDialog(true);
  };

  const handleAIDraft = async () => {
    if (!selectedReview) return;
    try {
      const result = await triggerAIDraft({
        reviewId: selectedReview.id,
        rating: selectedReview.overallRating,
        text: selectedReview.comment || '',
        storeId,
        orderId: selectedReview.orderId,
      }).unwrap();
      if (result?.draftGenerated) {
        setResponseText(String(result.draftResponse || result.responseLength || ''));
      }
    } catch {
      // Agent service may be offline — fail silently, user can still type manually
    }
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
    if (direction === 'UP') return <TrendingUp style={{ width: '20px', height: '20px', color: colors.semantic.success }} />;
    if (direction === 'DOWN') return <TrendingDown style={{ width: '20px', height: '20px', color: colors.semantic.error }} />;
    return null;
  };

  const handleExport = () => {
    exportToCSV(filteredReviews, 'reviews', [
      { label: 'Customer Name', field: 'customerName' },
      { label: 'Rating', field: 'overallRating' },
      { label: 'Comment', field: 'comment' },
      { label: 'Food Quality', field: 'foodQualityRating' },
      { label: 'Service', field: 'serviceRating' },
      { label: 'Ambiance', field: 'ambianceRating' },
      { label: 'Responded', field: 'response', format: (v) => v ? 'Yes' : 'No' },
      { label: 'Date', field: 'createdAt', format: (v) => new Date(v).toLocaleDateString() },
    ]);
  };

  const handleSortChange = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      rating: '',
      responseStatus: '',
      dateRange: {},
    });
  };

  return (
    <>
      <AppHeader title="Review Management" showBackButton={true} onBack={handleBack} showManagerNav={true} />
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.surface.background,
        padding: `${spacing[8]} ${spacing[4]}`,
        paddingTop: '80px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Stats Cards */}
        {statsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing[8], marginTop: spacing[6] }}>
            <LoadingSpinner />
          </div>
        ) : stats ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: spacing[6],
            marginBottom: spacing[8],
            marginTop: spacing[6]
          }}>
            <Card elevation="md" padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                <h3 style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.brand.secondary,
                  margin: 0
                }}>Average Rating</h3>
                <Star style={{ width: '20px', height: '20px', color: colors.warning.main }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <p style={{
                  fontSize: typography.fontSize['4xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0
                }}>
                  {stats.averageRating?.toFixed(1) ?? '0.0'}
                </p>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>/ 5.0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginTop: spacing[2] }}>
                {getTrendIcon(stats.trendDirection)}
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  {stats.recentTrendPercentage > 0 ? '+' : ''}
                  {stats.recentTrendPercentage?.toFixed(1) ?? '0.0'}%
                </span>
              </div>
            </Card>

            <Card elevation="md" padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                <h3 style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.brand.secondary,
                  margin: 0
                }}>Total Reviews</h3>
                <MessageCircle style={{ width: '20px', height: '20px', color: colors.info.main }} />
              </div>
              <p style={{
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0
              }}>{stats.totalReviews}</p>
              <div style={{ marginTop: spacing[2] }}>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.semantic.success }}>{stats.positiveReviews} positive</span>
              </div>
            </Card>

            <Card elevation="md" padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                <h3 style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.brand.secondary,
                  margin: 0
                }}>Food Quality</h3>
                <Star style={{ width: '20px', height: '20px', color: '#ff8c00' }} />
              </div>
              <p style={{
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0
              }}>
                {stats.averageFoodQualityRating?.toFixed(1) ?? '0.0'}
              </p>
              <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing[2], margin: 0 }}>Average rating</p>
            </Card>

            <Card elevation="md" padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                <h3 style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.brand.secondary,
                  margin: 0
                }}>Service Rating</h3>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
              </div>
              <p style={{
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0
              }}>
                {stats.averageServiceRating?.toFixed(1) ?? '0.0'}
              </p>
              <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing[2], margin: 0 }}>Average rating</p>
            </Card>
          </div>
        ) : null}

        {/* Tabs */}
        <div style={{ marginBottom: spacing[6], display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setActiveTab('all');
              setPage(0);
            }}
            style={{
              padding: `${spacing[3]} ${spacing[5]}`,
              border: `2px solid ${activeTab === 'all' ? colors.brand.primary : colors.surface.border}`,
              borderRadius: '12px',
              background: activeTab === 'all' ? `${colors.brand.primaryLight}11` : colors.surface.primary,
              boxShadow: activeTab === 'all'
                ? `inset 4px 4px 8px rgba(163, 163, 163, 0.25), inset -4px -4px 8px rgba(255, 255, 255, 0.9)`
                : `6px 6px 12px rgba(163, 163, 163, 0.25), -6px -6px 12px rgba(255, 255, 255, 0.9)`,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.primary,
              color: activeTab === 'all' ? colors.brand.primary : colors.text.primary,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2]
            }}
          >
            All Reviews
          </button>
          <button
            onClick={() => {
              setActiveTab('needs-response');
              setPage(0);
            }}
            style={{
              padding: `${spacing[3]} ${spacing[5]}`,
              border: `2px solid ${activeTab === 'needs-response' ? colors.brand.primary : colors.surface.border}`,
              borderRadius: '12px',
              background: activeTab === 'needs-response' ? `${colors.brand.primaryLight}11` : colors.surface.primary,
              boxShadow: activeTab === 'needs-response'
                ? `inset 4px 4px 8px rgba(163, 163, 163, 0.25), inset -4px -4px 8px rgba(255, 255, 255, 0.9)`
                : `6px 6px 12px rgba(163, 163, 163, 0.25), -6px -6px 12px rgba(255, 255, 255, 0.9)`,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.primary,
              color: activeTab === 'needs-response' ? colors.brand.primary : colors.text.primary,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2]
            }}
          >
            <MessageCircle style={{ width: '16px', height: '16px' }} />
            Needs Response
          </button>
          <button
            onClick={() => {
              setActiveTab('pending');
              setPage(0);
            }}
            style={{
              padding: `${spacing[3]} ${spacing[5]}`,
              border: `2px solid ${activeTab === 'pending' ? colors.brand.primary : colors.surface.border}`,
              borderRadius: '12px',
              background: activeTab === 'pending' ? `${colors.brand.primaryLight}11` : colors.surface.primary,
              boxShadow: activeTab === 'pending'
                ? `inset 4px 4px 8px rgba(163, 163, 163, 0.25), inset -4px -4px 8px rgba(255, 255, 255, 0.9)`
                : `6px 6px 12px rgba(163, 163, 163, 0.25), -6px -6px 12px rgba(255, 255, 255, 0.9)`,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.primary,
              color: activeTab === 'pending' ? colors.brand.primary : colors.text.primary,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2]
            }}
          >
            <Clock style={{ width: '16px', height: '16px' }} />
            Pending
          </button>
          <button
            onClick={() => {
              setActiveTab('flagged');
              setPage(0);
            }}
            style={{
              padding: `${spacing[3]} ${spacing[5]}`,
              border: `2px solid ${activeTab === 'flagged' ? colors.brand.primary : colors.surface.border}`,
              borderRadius: '12px',
              background: activeTab === 'flagged' ? `${colors.brand.primaryLight}11` : colors.surface.primary,
              boxShadow: activeTab === 'flagged'
                ? `inset 4px 4px 8px rgba(163, 163, 163, 0.25), inset -4px -4px 8px rgba(255, 255, 255, 0.9)`
                : `6px 6px 12px rgba(163, 163, 163, 0.25), -6px -6px 12px rgba(255, 255, 255, 0.9)`,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.primary,
              color: activeTab === 'flagged' ? colors.brand.primary : colors.text.primary,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2]
            }}
          >
            <Flag style={{ width: '16px', height: '16px' }} />
            Flagged
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ marginBottom: spacing[6] }}>
          <FilterBar
            filters={filterConfigs}
            filterValues={filterValues}
            onFilterChange={(field, value) => setFilterValues({ ...filterValues, [field]: value })}
            onClearFilters={handleClearFilters}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            sortOptions={sortOptions}
            onExport={handleExport}
            showExport={filteredReviews.length > 0}
            isLoading={isLoading}
          />
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: `${spacing[12]} 0` }}>
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredReviews.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
              {filteredReviews.map((review) => (
                <div key={review.id}>
                  <ReviewCard
                    review={review}
                    showActions
                    onReplyClick={() => handleReply(review)}
                  />
                  {activeTab === 'pending' && (
                    <div style={{ marginTop: spacing[2], display: 'flex', gap: spacing[2] }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}
                      >
                        <CheckCircle style={{ width: '16px', height: '16px' }} />
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRejectClick(review)}
                        style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}
                      >
                        <AlertCircle style={{ width: '16px', height: '16px' }} />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {currentData && currentData.totalPages > 1 && (
              <div style={{ marginTop: spacing[6], display: 'flex', justifyContent: 'center', gap: spacing[2], alignItems: 'center' }}>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm
                }}>
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
          <Card elevation="md" padding="xl" style={{ textAlign: 'center' }}>
            <p style={{ color: colors.text.secondary, margin: 0 }}>No reviews found in this category</p>
          </Card>
        )}

        {/* Response Dialog */}
        {showResponseDialog && selectedReview && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[4],
            zIndex: 1400
          }}>
            <Card elevation="lg" padding="lg" style={{
              maxWidth: '48rem',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[4],
                marginTop: 0
              }}>Respond to Review</h3>

              {/* Review Summary */}
              <div style={{
                marginBottom: spacing[4],
                padding: spacing[4],
                backgroundColor: colors.surface.secondary,
                borderRadius: borderRadius.lg
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                  <span style={{ fontWeight: typography.fontWeight.medium }}>{selectedReview.customerName}</span>
                  <Badge variant="primary">{selectedReview.overallRating} ★</Badge>
                </div>
                <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, margin: 0 }}>{selectedReview.comment}</p>
              </div>

              {/* Template Selection */}
              <div style={{ marginBottom: spacing[4] }}>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing[2]
                }}>
                  Use Template (Optional)
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: spacing[2]
                }}>
                  {Object.entries(ResponseType).map(([key, value]) => (
                    <button
                      key={value}
                      onClick={() => handleTemplateSelect(value)}
                      style={{
                        padding: `${spacing[2]} ${spacing[4]}`,
                        borderRadius: borderRadius.lg,
                        border: selectedTemplate === value
                          ? `2px solid ${colors.brand.primary}`
                          : `1px solid ${colors.surface.border}`,
                        backgroundColor: selectedTemplate === value
                          ? `${colors.brand.primary}10`
                          : 'transparent',
                        color: selectedTemplate === value
                          ? colors.brand.primary
                          : colors.text.primary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium
                      }}
                    >
                      {key.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Draft Button */}
              {selectedReview.overallRating <= 3 && (
                <div style={{ marginBottom: spacing[4] }}>
                  <button
                    onClick={handleAIDraft}
                    disabled={aiDraftLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: `${spacing[2]} ${spacing[4]}`,
                      borderRadius: borderRadius.lg,
                      border: `1px solid ${colors.brand.primary}40`,
                      background: `linear-gradient(135deg, ${colors.brand.primary}08 0%, #8B5CF608 100%)`,
                      color: colors.brand.primary,
                      cursor: aiDraftLoading ? 'wait' : 'pointer',
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      fontFamily: typography.fontFamily.primary,
                      transition: 'all 0.2s ease',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
                    </svg>
                    {aiDraftLoading ? 'Generating AI draft...' : 'Generate AI Draft Response'}
                  </button>
                  <p style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.tertiary,
                    margin: `${spacing[1]} 0 0`,
                    textAlign: 'center',
                  }}>
                    AI analyses the review and generates a personalised, empathetic response for you to edit.
                  </p>
                </div>
              )}

              {/* Response Text */}
              <div style={{ marginBottom: spacing[4] }}>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing[2]
                }}>
                  Your Response *
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: `${spacing[2]} ${spacing[4]}`,
                    border: `1px solid ${colors.surface.border}`,
                    borderRadius: borderRadius.lg,
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.base,
                    color: colors.text.primary,
                    backgroundColor: colors.surface.background,
                    boxShadow: shadows.inset.sm,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="Write your response to the customer..."
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: spacing[2] }}>
                <Button
                  variant="primary"
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || isCreatingResponse}
                  style={{ flex: 1 }}
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
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[4],
            zIndex: 1400
          }}>
            <Card elevation="lg" padding="lg" style={{ maxWidth: '28rem', width: '100%' }}>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[4],
                marginTop: 0
              }}>Reject Review</h3>
              <p style={{
                color: colors.text.secondary,
                marginBottom: spacing[4],
                margin: 0
              }}>
                Please provide a reason for rejecting this review.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: `${spacing[2]} ${spacing[4]}`,
                  border: `1px solid ${colors.surface.border}`,
                  borderRadius: borderRadius.lg,
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.base,
                  color: colors.text.primary,
                  backgroundColor: colors.surface.background,
                  boxShadow: shadows.inset.sm,
                  outline: 'none',
                  marginBottom: spacing[4],
                  resize: 'vertical'
                }}
                placeholder="Reason for rejection..."
              />
              <div style={{ display: 'flex', gap: spacing[2] }}>
                <Button
                  variant="primary"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  style={{ flex: 1 }}
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
    </>
  );
};

export default withPageStoreContext(ReviewManagementPage, 'reviews');
