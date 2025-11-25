import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createCard, createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface RatingDialogProps {
  open: boolean;
  onClose: () => void;
  driverName: string;
  orderId: string;
  onSubmit: (rating: number, feedback: string) => void;
}

const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onClose,
  driverName,
  orderId,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, feedback);
      setRating(0);
      setFeedback('');
      onClose();
    }
  };

  // Styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing[4],
  };

  const dialogStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    backgroundColor: colors.surface.background,
    maxWidth: '500px',
    width: '100%',
    padding: spacing[6],
  };

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  const driverInfoStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[4],
    marginBottom: spacing[6],
    textAlign: 'center',
    backgroundColor: colors.surface.primary,
  };

  const driverNameStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  };

  const orderIdStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  };

  const ratingContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[6],
  };

  const starButtonStyles = (index: number): React.CSSProperties => {
    const isHovered = index <= hoveredRating;
    const isSelected = index <= rating;
    const isActive = isHovered || isSelected;

    return {
      padding: spacing[2],
      fontSize: '2.5rem',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: isActive ? '#FFD700' : colors.text.disabled,
      textShadow: isActive ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
    };
  };

  const ratingTextStyles: React.CSSProperties = {
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand.primary,
    marginBottom: spacing[6],
  };

  const feedbackContainerStyles: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '100px',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    backgroundColor: colors.surface.background,
    border: 'none',
    borderRadius: borderRadius.lg,
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    resize: 'vertical',
  };

  const buttonGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
  };

  const cancelButtonStyles: React.CSSProperties = {
    flex: 1,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    transition: 'all 0.2s',
  };

  const submitButtonStyles: React.CSSProperties = {
    flex: 1,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: rating > 0 ? 'pointer' : 'not-allowed',
    opacity: rating > 0 ? 1 : 0.5,
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    transition: 'all 0.2s',
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

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={dialogStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <h2 style={titleStyles}>Rate Your Delivery</h2>
          <p style={subtitleStyles}>How was your delivery experience?</p>
        </div>

        {/* Driver Info */}
        <div style={driverInfoStyles}>
          <div style={driverNameStyles}>🚗 {driverName}</div>
          <div style={orderIdStyles}>Order #{orderId}</div>
        </div>

        {/* Star Rating */}
        <div style={ratingContainerStyles}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              style={starButtonStyles(star)}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              ★
            </button>
          ))}
        </div>

        <div style={ratingTextStyles}>
          {getRatingText(hoveredRating || rating)}
        </div>

        {/* Feedback */}
        <div style={feedbackContainerStyles}>
          <label style={labelStyles}>
            Additional Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience with the delivery..."
            style={textareaStyles}
          />
        </div>

        {/* Buttons */}
        <div style={buttonGroupStyles}>
          <button onClick={onClose} style={cancelButtonStyles}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={submitButtonStyles}
            disabled={rating === 0}
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingDialog;
