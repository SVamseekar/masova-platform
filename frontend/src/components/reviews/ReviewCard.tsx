import React from 'react';
import { Review, ReviewResponse } from '../../store/api/reviewApi';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { User, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { Card } from '../ui/neumorphic/Card';
import { Badge } from '../ui/neumorphic/Badge';

interface ReviewCardProps {
  review: Review;
  response?: ReviewResponse;
  onReplyClick?: () => void;
  onFlagClick?: () => void;
  showActions?: boolean;
  className?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  response,
  onReplyClick,
  onFlagClick,
  showActions = false,
  className = '',
}) => {
  const getSentimentColor = (sentiment?: string): 'success' | 'error' | 'warning' | 'primary' | 'secondary' => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'success';
      case 'NEGATIVE':
        return 'error';
      case 'MIXED':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'FLAGGED':
        return <Badge variant="error">Flagged</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">
                {review.isAnonymous ? 'Anonymous' : review.customerName}
              </h4>
              {review.isVerifiedPurchase && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StarRating rating={review.overallRating} readonly size="sm" />
          {getStatusBadge(review.status)}
        </div>
      </div>

      {/* Overall Rating and Specific Ratings */}
      <div className="mb-4">
        {review.foodQualityRating && (
          <div className="flex items-center gap-2 text-sm mb-1">
            <span className="text-gray-600 w-24">Food Quality:</span>
            <StarRating rating={review.foodQualityRating} readonly size="sm" />
          </div>
        )}
        {review.serviceRating && (
          <div className="flex items-center gap-2 text-sm mb-1">
            <span className="text-gray-600 w-24">Service:</span>
            <StarRating rating={review.serviceRating} readonly size="sm" />
          </div>
        )}
        {review.deliveryRating && (
          <div className="flex items-center gap-2 text-sm mb-1">
            <span className="text-gray-600 w-24">Delivery:</span>
            <StarRating rating={review.deliveryRating} readonly size="sm" />
          </div>
        )}
      </div>

      {/* Comment */}
      {review.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      )}

      {/* Driver Review */}
      {review.driverRating && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Driver Rating:</span>
            <StarRating rating={review.driverRating} readonly size="sm" />
          </div>
          {review.driverComment && (
            <p className="text-sm text-gray-600">{review.driverComment}</p>
          )}
        </div>
      )}

      {/* Item Reviews */}
      {review.itemReviews && review.itemReviews.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Item Ratings:</h5>
          <div className="space-y-2">
            {review.itemReviews.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{item.menuItemName}</span>
                    <StarRating rating={item.rating} readonly size="sm" />
                  </div>
                  {item.comment && (
                    <p className="text-sm text-gray-600">{item.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {review.photoUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Review photo ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              />
            ))}
          </div>
        </div>
      )}

      {/* Sentiment Badge */}
      {review.sentiment && (
        <div className="mb-4">
          <Badge variant={getSentimentColor(review.sentiment)}>
            {review.sentiment}
          </Badge>
        </div>
      )}

      {/* Management Response */}
      {response && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-blue-900">Management Response</span>
                <span className="text-sm text-blue-600">
                  {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-blue-800">{response.responseText}</p>
              {response.isEdited && (
                <span className="text-xs text-blue-600 mt-1 inline-block">(Edited)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          {onReplyClick && !response && (
            <button
              onClick={onReplyClick}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition"
            >
              Reply
            </button>
          )}
          {onFlagClick && review.status !== 'FLAGGED' && (
            <button
              onClick={onFlagClick}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Flag
            </button>
          )}
        </div>
      )}

      {/* Flag Reason (if flagged) */}
      {review.status === 'FLAGGED' && review.flagReason && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <span className="font-semibold text-red-900">Flagged:</span>
              <p className="text-red-800 text-sm mt-1">{review.flagReason}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReviewCard;
