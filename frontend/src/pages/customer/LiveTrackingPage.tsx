import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTrackOrderQuery } from '../../store/api/deliveryApi';
import { useCreateReviewMutation } from '../../store/api/reviewApi';
import AppHeader from '../../components/common/AppHeader';
import { DriverTrackingMap } from '../../components/delivery/DriverTrackingMap';
import RatingDialog from '../../components/delivery/RatingDialog';
import { useOrderTrackingWebSocket } from '../../hooks/useOrderTrackingWebSocket';
import { OrderTrackingUpdate } from '../../services/websocketService';

const LiveTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [createReview] = useCreateReviewMutation();
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localDriverLocation, setLocalDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { isConnected: wsConnected } = useOrderTrackingWebSocket({
    orderId: orderId || '',
    onOrderUpdate: (update: OrderTrackingUpdate) => {
      setLocalStatus(update.status);
      if (update.driverLocation) setLocalDriverLocation(update.driverLocation);
    },
    enabled: !!orderId,
  });

  const { data: trackingData, isLoading, error } = useTrackOrderQuery(orderId!, {
    skip: !orderId,
    pollingInterval: wsConnected ? 30000 : 10000,
  });

  const effectiveStatus = localStatus || trackingData?.status;
  const effectiveDriverLocation = localDriverLocation || trackingData?.currentLocation;

  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (!orderId) return;
    try {
      await createReview({
        orderId,
        overallRating: rating,
        comment: feedback,
        deliveryRating: rating,
        driverId: trackingData?.driverId,
      }).unwrap();
      setRatingDialogOpen(false);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const callDriver = () => {
    if (trackingData?.driverPhone) window.location.href = `tel:${trackingData.driverPhone}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PICKED_UP': return '#2196f3';
      case 'IN_TRANSIT': return '#ff9800';
      case 'DELIVERED': return '#4caf50';
      default: return 'var(--text-3)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PICKED_UP': return 'rgba(var(--info-rgb), 0.13)';
      case 'IN_TRANSIT': return 'rgba(var(--warning-rgb), 0.13)';
      case 'DELIVERED': return 'rgba(var(--success-rgb), 0.13)';
      default: return 'rgba(var(--text-3), 0.13)';
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-3)' }}>Loading tracking information...</div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />
        <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', padding: '48px 32px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px', opacity: 0.5 }}>📍</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>Tracking Not Available</h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>Unable to find tracking information for this order.</p>
          </div>
        </div>
      </div>
    );
  }

  if (trackingData.orderType && trackingData.orderType !== 'DELIVERY') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />
        <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', padding: '48px 32px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px', opacity: 0.5 }}>🚫</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>Live Tracking Unavailable</h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '8px' }}>
              {trackingData.orderType === 'PICKUP' ? 'Live tracking is not available for pickup orders.' : 'Live tracking is not available for dine-in orders.'}
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>Live driver tracking is only available for delivery orders.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
      <AppHeader showPublicNav onCartClick={() => navigate('/menu')} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        {/* WS indicator */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: wsConnected ? '#4caf50' : 'var(--text-3)', display: 'inline-block' }} />
          <span style={{ fontSize: '0.72rem', color: wsConnected ? '#4caf50' : 'var(--text-3)' }}>
            {wsConnected ? 'Live Updates' : 'Polling Mode'}
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-1)', margin: '0 0 4px 0' }}>
          Live Tracking
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: '0 0 32px 0' }}>
          Order #{orderId?.slice(-8).toUpperCase()}
        </p>

        {/* Status card */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${getStatusColor(effectiveStatus || '')}`,
          padding: '28px 24px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
            {effectiveStatus?.toUpperCase() === 'PICKED_UP' ? '📦'
              : effectiveStatus?.toUpperCase() === 'IN_TRANSIT' ? '🚚'
              : effectiveStatus?.toUpperCase() === 'DELIVERED' ? '✅' : '📍'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px 0' }}>
            {effectiveStatus?.replace(/_/g, ' ')}
          </h2>
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 'var(--radius-pill)',
            background: getStatusColor(effectiveStatus || '') + '22',
            color: getStatusColor(effectiveStatus || ''),
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {effectiveStatus?.toUpperCase()}
          </span>


          {/* OTP display for DISPATCHED status — anchored to REST trackingData to avoid WebSocket/poll race */}
          {trackingData.status?.toUpperCase() === 'DISPATCHED' && trackingData.deliveryOtp && (
            <div style={{
              marginTop: '20px',
              padding: '20px 24px',
              background: 'rgba(var(--dp-success-rgb, 76, 175, 80), 0.08)',
              border: '2px solid rgba(var(--dp-success-rgb, 76, 175, 80), 0.5)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Delivery OTP — Share with your driver
              </p>
              <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--dp-success, #4CAF50)', letterSpacing: '12px' }}>
                {trackingData.deliveryOtp}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-3)' }}>Valid for 15 minutes</p>
            </div>
          )}

          {trackingData.estimatedArrival && (
            <div style={{
              marginTop: '20px',
              padding: '14px 20px',
              background: 'var(--surface-2)',
              borderRadius: '10px',
              display: 'inline-block',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estimated Arrival</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--gold)' }}>
                {new Date(trackingData.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {trackingData.distanceRemaining && (
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                  {trackingData.distanceRemaining.toFixed(2)} km away
                </p>
              )}
            </div>
          )}
        </div>

        {/* Driver card */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 16px 0' }}>
            Your Driver
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Name', value: trackingData.driverName },
              { label: 'Phone', value: trackingData.driverPhone },
              ...(effectiveDriverLocation ? [{ label: 'Last Updated', value: new Date(trackingData.lastUpdated).toLocaleTimeString() }] : []),
            ].map((item) => (
              <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '12px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={callDriver}
              style={{
                flex: 1, background: 'var(--dp-success, #2e7d32)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-pill)', padding: '11px',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--dp-success-light, #388e3c)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--dp-success, #2e7d32)'; }}
            >
              Call Driver
            </button>
            {effectiveStatus?.toUpperCase() === 'DELIVERED' && (
              <button
                onClick={() => setRatingDialogOpen(true)}
                style={{
                  flex: 1, background: 'var(--gold)', color: '#000', border: 'none',
                  borderRadius: 'var(--radius-pill)', padding: '11px',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold-light)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; }}
              >
                Rate Delivery
              </button>
            )}
          </div>
        </div>

        {/* Live map */}
        {effectiveDriverLocation && trackingData.destination &&
          'latitude' in effectiveDriverLocation && 'longitude' in effectiveDriverLocation && (
          <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <DriverTrackingMap
              driverPosition={[effectiveDriverLocation.latitude, effectiveDriverLocation.longitude]}
              restaurantPosition={[12.9716, 77.5946]}
              customerPosition={[
                trackingData.destination.coordinates[1],
                trackingData.destination.coordinates[0],
              ]}
              eta={
                trackingData.estimatedArrival
                  ? (() => {
                      const mins = Math.round((new Date(trackingData.estimatedArrival).getTime() - Date.now()) / 60000);
                      return `${mins} min`;
                    })()
                  : undefined
              }
              driverName={trackingData.driverName}
              height="450px"
              autoCenter
            />
          </div>
        )}
      </div>

      <RatingDialog
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        driverName={trackingData.driverName}
        orderId={orderId!}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
};

export default LiveTrackingPage;
