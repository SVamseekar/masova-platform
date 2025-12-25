import React, { useState } from 'react';
import { CreateReviewRequest } from '../../store/api/reviewApi';
import StarRating from './StarRating';
import { Card } from '../ui/neumorphic/Card';
import { Button } from '../ui/neumorphic/Button';
import Input from '../ui/neumorphic/Input';

interface ReviewFormProps {
  orderId: string;
  orderItems?: Array<{ id: string; name: string }>;
  driverId?: string;
  driverName?: string;
  onSubmit: (review: CreateReviewRequest) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  orderItems = [],
  driverId,
  driverName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState('');
  const [foodQualityRating, setFoodQualityRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [deliveryRating, setDeliveryRating] = useState<number>(5);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [driverComment, setDriverComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [itemRatings, setItemRatings] = useState<Map<string, { rating: number; comment: string }>>(
    new Map()
  );

  const handleItemRatingChange = (itemId: string, rating: number) => {
    setItemRatings((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId) || { rating: 5, comment: '' };
      newMap.set(itemId, { ...existing, rating });
      return newMap;
    });
  };

  const handleItemCommentChange = (itemId: string, comment: string) => {
    setItemRatings((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId) || { rating: 5, comment: '' };
      newMap.set(itemId, { ...existing, comment });
      return newMap;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemReviews = orderItems
      .filter((item) => itemRatings.has(item.id))
      .map((item) => {
        const itemRating = itemRatings.get(item.id)!;
        return {
          menuItemId: item.id,
          rating: itemRating.rating,
          comment: itemRating.comment || undefined,
        };
      });

    const reviewData: CreateReviewRequest = {
      orderId,
      overallRating,
      comment: comment || undefined,
      foodQualityRating,
      serviceRating,
      deliveryRating: driverId ? deliveryRating : undefined,
      driverId: driverId || undefined,
      driverRating: driverId ? driverRating : undefined,
      driverComment: driverId && driverComment ? driverComment : undefined,
      itemReviews: itemReviews.length > 0 ? itemReviews : undefined,
      isAnonymous,
    };

    onSubmit(reviewData);
  };

  return (
    <Card className="p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Leave a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating *
          </label>
          <StarRating
            rating={overallRating}
            onRatingChange={setOverallRating}
            size="lg"
            showValue
          />
        </div>

        {/* Overall Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Experience
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Share your experience with us..."
          />
        </div>

        {/* Specific Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Quality
            </label>
            <StarRating
              rating={foodQualityRating}
              onRatingChange={setFoodQualityRating}
              size="md"
              showValue
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service
            </label>
            <StarRating
              rating={serviceRating}
              onRatingChange={setServiceRating}
              size="md"
              showValue
            />
          </div>
          {driverId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery
              </label>
              <StarRating
                rating={deliveryRating}
                onRatingChange={setDeliveryRating}
                size="md"
                showValue
              />
            </div>
          )}
        </div>

        {/* Driver Review */}
        {driverId && driverName && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Rate Your Driver: {driverName}</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Rating
              </label>
              <StarRating
                rating={driverRating}
                onRatingChange={setDriverRating}
                size="md"
                showValue
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Comment
              </label>
              <textarea
                value={driverComment}
                onChange={(e) => setDriverComment(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="How was your delivery experience?"
              />
            </div>
          </div>
        )}

        {/* Item Reviews */}
        {orderItems.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Rate Individual Items</h4>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">{item.name}</h5>
                  <div className="mb-2">
                    <StarRating
                      rating={itemRatings.get(item.id)?.rating || 5}
                      onRatingChange={(rating) => handleItemRatingChange(item.id, rating)}
                      size="sm"
                      showValue
                    />
                  </div>
                  <Input
                    type="text"
                    value={itemRatings.get(item.id)?.comment || ''}
                    onChange={(e) => handleItemCommentChange(item.id, e.target.value)}
                    placeholder="Comment on this item (optional)"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anonymous Option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-700">
            Post review anonymously
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default ReviewForm;
