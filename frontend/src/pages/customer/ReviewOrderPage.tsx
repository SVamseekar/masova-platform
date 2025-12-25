import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateReviewMutation, useGetReviewsByOrderIdQuery } from '../../store/api/reviewApi';
import { useGetOrderQuery } from '../../store/api/orderApi';
import ReviewForm from '../../components/reviews/ReviewForm';
import { Card } from '../../components/ui/neumorphic/Card';
import { Button } from '../../components/ui/neumorphic/Button';
import { LoadingSpinner } from '../../components/ui/neumorphic/LoadingSpinner';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const ReviewOrderPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { data: order, isLoading: orderLoading } = useGetOrderQuery(orderId!, {
    skip: !orderId,
  });

  const { data: existingReviews, isLoading: reviewsLoading } = useGetReviewsByOrderIdQuery(
    orderId!,
    { skip: !orderId }
  );

  const [createReview, { isLoading: isSubmitting, isSuccess, isError, error }] =
    useCreateReviewMutation();

  useEffect(() => {
    if (isSuccess) {
      setShowSuccessMessage(true);
      setTimeout(() => {
        navigate('/customer/orders');
      }, 3000);
    }
  }, [isSuccess, navigate]);

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-red-600">Invalid order ID</p>
        </Card>
      </div>
    );
  }

  if (orderLoading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-red-600">Order not found</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/customer/orders')}
            className="mt-4"
          >
            Back to Orders
          </Button>
        </Card>
      </div>
    );
  }

  if (existingReviews && existingReviews.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You've Already Reviewed This Order
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your feedback! You can view your review in your order history.
            </p>
            <Button variant="primary" onClick={() => navigate('/customer/orders')}>
              Back to Orders
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You for Your Review!
            </h2>
            <p className="text-gray-600 mb-6">
              Your feedback helps us improve our service. Redirecting you back to your orders...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const orderItems = order.items?.map((item) => ({
    id: item.menuItemId,
    name: item.name,
  })) || [];

  const handleSubmit = async (reviewData: any) => {
    try {
      await createReview(reviewData).unwrap();
    } catch (err) {
      console.error('Failed to create review:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/customer/orders')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Order</h1>
          <p className="text-gray-600">Order #{orderId}</p>
        </div>

        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-medium">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">₹{(order.totalAmount ?? order.total ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items:</span>
              <span className="font-medium">{order.items?.length || 0} items</span>
            </div>
          </div>
        </Card>

        {/* Review Form */}
        <ReviewForm
          orderId={orderId}
          orderItems={orderItems}
          driverId={order.driverId}
          driverName={order.driverName}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/customer/orders')}
          isSubmitting={isSubmitting}
        />

        {/* Error Message */}
        {isError && (
          <Card className="p-4 mt-4 bg-red-50 border border-red-200">
            <p className="text-red-600">
              Failed to submit review: {(error as any)?.data?.error || 'Unknown error'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewOrderPage;
