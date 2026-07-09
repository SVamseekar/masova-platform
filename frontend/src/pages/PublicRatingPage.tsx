import React, { useState, useEffect, useCallback } from 'react';
import { getApiErrorMessage } from './utils/apiError';
import { useParams } from 'react-router-dom';

interface TokenDetails {
  valid: boolean;
  orderId?: string;
  orderNumber?: string;
  driverName?: string;
  message?: string;
}

const PublicRatingPage: React.FC = () => {
  const { orderId, token } = useParams<{ orderId: string; token: string }>();

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

  const validateToken = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/reviews/public/token/${token}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid or expired rating link');
      } else {
        setTokenDetails(data);
      }
    } catch {
      setError('Failed to load rating page. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to submit rating. Please try again.'));
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

  // Dark-premium tokens only (CustomerLayout --bg / --surface / etc.)
  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'var(--bg)',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-1)',
  };

  const cardStyles: React.CSSProperties = {
    maxWidth: 600,
    width: '100%',
    padding: 36,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
  };

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: 32,
  };

  const logoStyles: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: 12,
  };

  const titleStyles: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-1)',
    marginBottom: 8,
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'var(--text-2)',
  };

  const sectionStyles: React.CSSProperties = {
    marginBottom: 24,
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-1)',
    marginBottom: 12,
  };

  const starContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  };

  const starButtonStyles = (index: number, currentRating: number, hovered: number): React.CSSProperties => {
    const isHovered = index <= hovered;
    const isSelected = index <= currentRating;
    const isActive = isHovered || isSelected;

    return {
      padding: 4,
      fontSize: '2rem',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      transition: 'var(--transition)',
      color: isActive ? 'var(--gold)' : 'var(--text-3)',
      textShadow: isActive ? '0 0 10px rgba(212, 168, 67, 0.45)' : 'none',
      transform: isHovered ? 'scale(1.15)' : 'scale(1)',
    };
  };

  const ratingTextStyles: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--gold)',
    minHeight: 24,
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: 80,
    padding: 12,
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-1)',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    resize: 'vertical',
    boxSizing: 'border-box',
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: 14,
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    color: 'var(--text-1)',
    cursor: overallRating > 0 && !submitting ? 'pointer' : 'not-allowed',
    opacity: overallRating > 0 && !submitting ? 1 : 0.5,
    background: 'var(--red)',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    transition: 'var(--transition)',
  };

  const errorStyles: React.CSSProperties = {
    padding: 14,
    backgroundColor: 'rgba(198,42,9,0.12)',
    border: '1px solid var(--red)',
    borderRadius: 10,
    marginBottom: 16,
    color: 'var(--red-light)',
    textAlign: 'center',
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-3)' }}>Loading rating form…</div>
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
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>❌</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--red-light)',
                marginBottom: 12,
              }}
            >
              Invalid or expired link
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-2)' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--success-light)',
                marginBottom: 12,
              }}
            >
              Thank you!
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.55 }}>
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
