import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius } from '../styles/design-tokens';
import { createCard, createNeumorphicSurface } from '../styles/neumorphic-utils';

interface TokenDetails {
  valid: boolean;
  orderId?: string;
  orderNumber?: string;
  driverName?: string;
  message?: string;
}

const PublicRatingPage: React.FC = () => {
  const { orderId, token } = useParams<{ orderId: string; token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);

  // Rating state
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [driverComment, setDriverComment] = useState('');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/reviews/public/token/${token}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid or expired rating link');
      } else {
        setTokenDetails(data);
      }
    } catch (err) {
      setError('Failed to load rating page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/public/submit?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          overallRating,
          foodQualityRating: foodRating || null,
          serviceRating: serviceRating || null,
          deliveryRating: deliveryRating || null,
          driverRating: driverRating || null,
          comment: comment || null,
          driverComment: driverComment || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Tap to rate';
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    backgroundColor: colors.surface.background,
    fontFamily: typography.fontFamily.primary,
  };

  const cardStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    maxWidth: '600px',
    width: '100%',
    padding: spacing[8],
    backgroundColor: colors.surface.primary,
  };

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing[8],
  };

  const logoStyles: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: spacing[3],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  const sectionStyles: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  };

  const starContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  };

  const starButtonStyles = (index: number, currentRating: number, hovered: number): React.CSSProperties => {
    const isHovered = index <= hovered;
    const isSelected = index <= currentRating;
    const isActive = isHovered || isSelected;

    return {
      padding: spacing[1],
      fontSize: '2rem',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: isActive ? '#FFD700' : colors.text.disabled,
      textShadow: isActive ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
      transform: isHovered ? 'scale(1.15)' : 'scale(1)',
    };
  };

  const ratingTextStyles: React.CSSProperties = {
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand.primary,
    minHeight: '24px',
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    resize: 'vertical',
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing[4],
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    cursor: overallRating > 0 && !submitting ? 'pointer' : 'not-allowed',
    opacity: overallRating > 0 && !submitting ? 1 : 0.5,
    ...createNeumorphicSurface('raised', 'md', 'xl'),
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    transition: 'all 0.3s',
  };

  const successStyles: React.CSSProperties = {
    textAlign: 'center',
  };

  const successIconStyles: React.CSSProperties = {
    fontSize: '5rem',
    marginBottom: spacing[4],
  };

  const successTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.success,
    marginBottom: spacing[3],
  };

  const successMessageStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  const errorStyles: React.CSSProperties = {
    padding: spacing[4],
    backgroundColor: colors.semantic.errorLight,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    color: colors.semantic.error,
    textAlign: 'center',
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: spacing[3] }}>⏳</div>
            <div style={{ fontSize: typography.fontSize.lg, color: colors.text.secondary }}>
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !tokenDetails) {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: spacing[3] }}>❌</div>
            <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.semantic.error, marginBottom: spacing[3] }}>
              Invalid Link
            </div>
            <div style={{ fontSize: typography.fontSize.base, color: colors.text.secondary }}>
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <div style={successStyles}>
            <div style={successIconStyles}>✅</div>
            <div style={successTitleStyles}>Thank You!</div>
            <div style={successMessageStyles}>
              Your feedback has been submitted successfully.
              <br />
              We appreciate you taking the time to rate your experience.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={logoStyles}>🍕</div>
          <h1 style={titleStyles}>Rate Your Experience</h1>
          <p style={subtitleStyles}>
            {tokenDetails?.message || 'How was your recent order?'}
          </p>
        </div>

        {error && (
          <div style={errorStyles}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Overall Rating */}
          <div style={sectionStyles}>
            <div style={sectionTitleStyles}>Overall Rating *</div>
            <div style={starContainerStyles}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  style={starButtonStyles(star, overallRating, hoveredRating)}
                  onClick={() => setOverallRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  ★
                </button>
              ))}
            </div>
            <div style={ratingTextStyles}>
              {getRatingText(hoveredRating || overallRating)}
            </div>
          </div>

          {/* Food Quality */}
          <div style={sectionStyles}>
            <div style={sectionTitleStyles}>Food Quality (Optional)</div>
            <div style={starContainerStyles}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  style={starButtonStyles(star, foodRating, 0)}
                  onClick={() => setFoodRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Service */}
          <div style={sectionStyles}>
            <div style={sectionTitleStyles}>Service (Optional)</div>
            <div style={starContainerStyles}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  style={starButtonStyles(star, serviceRating, 0)}
                  onClick={() => setServiceRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Delivery (if applicable) */}
          {tokenDetails?.driverName && (
            <>
              <div style={sectionStyles}>
                <div style={sectionTitleStyles}>Delivery Experience (Optional)</div>
                <div style={starContainerStyles}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      style={starButtonStyles(star, deliveryRating, 0)}
                      onClick={() => setDeliveryRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={sectionStyles}>
                <div style={sectionTitleStyles}>Driver: {tokenDetails.driverName} (Optional)</div>
                <div style={starContainerStyles}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      style={starButtonStyles(star, driverRating, 0)}
                      onClick={() => setDriverRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={sectionStyles}>
                <div style={sectionTitleStyles}>Driver Feedback (Optional)</div>
                <textarea
                  value={driverComment}
                  onChange={(e) => setDriverComment(e.target.value)}
                  placeholder="Share your experience with the driver..."
                  style={textareaStyles}
                  maxLength={1000}
                />
              </div>
            </>
          )}

          {/* General Comment */}
          <div style={sectionStyles}>
            <div style={sectionTitleStyles}>Additional Comments (Optional)</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              style={textareaStyles}
              maxLength={2000}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={buttonStyles}
            disabled={overallRating === 0 || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicRatingPage;
