import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrackOrderQuery } from '../../store/api/deliveryApi';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import LiveMap from '../../components/delivery/LiveMap';
import RatingDialog from '../../components/delivery/RatingDialog';
import { Card, Button } from '../../components/ui/neumorphic';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createCard, createBadge, createNeumorphicSurface } from '../../styles/neumorphic-utils';

const LiveTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  // Poll every 10 seconds for live tracking
  const { data: trackingData, isLoading, error } = useTrackOrderQuery(orderId!, {
    skip: !orderId,
    pollingInterval: 10000, // 10 seconds
  });

  const handleSubmitRating = async (rating: number, feedback: string) => {
    console.log('Rating submitted:', { orderId, rating, feedback });
    // TODO: Implement rating API call
  };

  const callDriver = () => {
    if (trackingData?.driverPhone) {
      window.location.href = `tel:${trackingData.driverPhone}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PICKED_UP':
        return colors.semantic.info;
      case 'IN_TRANSIT':
        return colors.semantic.warning;
      case 'DELIVERED':
        return colors.semantic.success;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PICKED_UP':
        return '📦';
      case 'IN_TRANSIT':
        return '🚚';
      case 'DELIVERED':
        return '✅';
      default:
        return '📍';
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: colors.surface.background,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing[6],
  };

  const statusCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[5],
    marginBottom: spacing[6],
    textAlign: 'center',
  };

  const statusIconStyles: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: spacing[3],
  };

  const statusTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const statusBadgeStyles: React.CSSProperties = {
    display: 'inline-block',
    ...createBadge(),
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    marginBottom: spacing[4],
  };

  const etaContainerStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[4],
    backgroundColor: colors.surface.secondary,
    marginTop: spacing[4],
  };

  const etaLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  };

  const etaValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.brand.primary,
  };

  const driverCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[5],
    marginBottom: spacing[6],
  };

  const driverHeaderStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const driverInfoStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[4],
  };

  const infoItemStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[3],
    backgroundColor: colors.surface.background,
  };

  const infoLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  };

  const infoValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const buttonGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
  };

  const callButtonStyles: React.CSSProperties = {
    flex: 1,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successLight} 100%)`,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    transition: 'all 0.2s',
  };

  const rateButtonStyles: React.CSSProperties = {
    flex: 1,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    transition: 'all 0.2s',
  };

  const handleCartClick = () => {
    navigate('/menu');
  };

  if (isLoading) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            Loading tracking information...
          </div>
        </div>
      </>
    );
  }

  if (error || !trackingData) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={{ ...statusCardStyles, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: spacing[3] }}>❌</div>
            <h2 style={statusTextStyles}>Tracking Not Available</h2>
            <p style={{ color: colors.text.secondary }}>
              Unable to find tracking information for this order.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader
          showPublicNav={true}
          onCartClick={handleCartClick}
        />

        <h1 style={titleStyles}>Live Tracking</h1>
        <p style={subtitleStyles}>Order #{orderId?.slice(-8).toUpperCase()}</p>

        {/* Status Card */}
        <div style={statusCardStyles}>
          <div style={statusIconStyles}>{getStatusIcon(trackingData.status)}</div>
          <div style={statusTextStyles}>
            {trackingData.status?.replace(/_/g, ' ')}
          </div>
          <div style={{ ...statusBadgeStyles, backgroundColor: getStatusColor(trackingData.status) }}>
            {trackingData.status?.toUpperCase()}
          </div>

          {trackingData.estimatedArrival && (
            <div style={etaContainerStyles}>
              <div style={etaLabelStyles}>Estimated Arrival</div>
              <div style={etaValueStyles}>
                {new Date(trackingData.estimatedArrival).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {trackingData.distanceRemaining && (
                <div style={{ ...etaLabelStyles, marginTop: spacing[2] }}>
                  {trackingData.distanceRemaining.toFixed(2)} km away
                </div>
              )}
            </div>
          )}
        </div>

        {/* Driver Information */}
        <div style={driverCardStyles}>
          <h2 style={driverHeaderStyles}>Your Driver</h2>

          <div style={driverInfoStyles}>
            <div style={infoItemStyles}>
              <div style={infoLabelStyles}>Name</div>
              <div style={infoValueStyles}>🚗 {trackingData.driverName}</div>
            </div>

            <div style={infoItemStyles}>
              <div style={infoLabelStyles}>Phone</div>
              <div style={infoValueStyles}>📞 {trackingData.driverPhone}</div>
            </div>

            {trackingData.currentLocation && (
              <div style={infoItemStyles}>
                <div style={infoLabelStyles}>Last Updated</div>
                <div style={infoValueStyles}>
                  ⏱️ {new Date(trackingData.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          <div style={buttonGroupStyles}>
            <button onClick={callDriver} style={callButtonStyles}>
              📞 Call Driver
            </button>
            {trackingData.status?.toUpperCase() === 'DELIVERED' && (
              <button onClick={() => setRatingDialogOpen(true)} style={rateButtonStyles}>
                ⭐ Rate Delivery
              </button>
            )}
          </div>
        </div>

        {/* Live Map */}
        {trackingData.currentLocation && trackingData.destination && (
          <LiveMap
            driverId={trackingData.driverId}
            destination={{
              latitude: trackingData.destination.latitude,
              longitude: trackingData.destination.longitude,
              address: trackingData.destination.address || 'Delivery Address',
            }}
          />
        )}
      </div>

      {/* Rating Dialog */}
      <RatingDialog
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        driverName={trackingData.driverName}
        orderId={orderId!}
        onSubmit={handleSubmitRating}
      />
    </>
  );
};

export default LiveTrackingPage;
