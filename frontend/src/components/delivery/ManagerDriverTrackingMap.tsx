import React, { useState, useEffect } from 'react';
import { DriverTrackingMap } from './DriverTrackingMap';
import { useDriverLocationWebSocket } from '../../hooks/useDriverLocationWebSocket';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useTrackOrderQuery } from '../../store/api/deliveryApi';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createCard, createBadge } from '../../styles/neumorphic-utils';
import { Driver } from '../../store/api/driverApi';

interface ManagerDriverTrackingMapProps {
  driver: Driver;
  onClose: () => void;
}

/**
 * Manager view for live driver tracking
 * - Real-time location updates via WebSocket
 * - Shows driver details, current delivery, and route
 * - Free OpenStreetMap (no API key required)
 * - Shows actual store and delivery address markers
 */
export const ManagerDriverTrackingMap: React.FC<ManagerDriverTrackingMapProps> = ({ driver, onClose }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [driverPosition, setDriverPosition] = useState<[number, number]>([12.9716, 77.5946]); // Default to Bangalore
  const [restaurantPosition, setRestaurantPosition] = useState<[number, number]>([12.9716, 77.5946]); // Store location
  const [customerPosition, setCustomerPosition] = useState<[number, number]>([12.9716, 77.5946]);
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);
  const [eta, setEta] = useState<string | undefined>(undefined);

  // Fetch active delivery tracking data if driver has active delivery
  const { data: trackingData } = useTrackOrderQuery(driver.activeDeliveryId || '', {
    skip: !driver.activeDeliveryId,
    pollingInterval: 10000, // Poll every 10 seconds
  });

  // WebSocket connection for real-time location
  const { location, isConnected, lastUpdateTime } = useDriverLocationWebSocket({
    driverId: driver.id,
    enabled: true,
    onLocationUpdate: (newLocation) => {
      setDriverPosition([newLocation.latitude, newLocation.longitude]);
    },
  });

  // Update driver position when WebSocket location changes
  useEffect(() => {
    if (location) {
      setDriverPosition([location.latitude, location.longitude]);
    }
  }, [location]);

  // Update restaurant and customer positions from tracking data
  useEffect(() => {
    if (trackingData) {
      // Update customer delivery address
      if (trackingData.destination && trackingData.destination.coordinates) {
        setCustomerPosition([
          trackingData.destination.coordinates[1], // GeoJSON: [lng, lat] -> [lat, lng]
          trackingData.destination.coordinates[0],
        ]);
      }

      // For store location, use user's store coordinates if available
      // Or keep default (this would ideally come from store API)
      if (currentUser?.storeId) {
        // TODO: Fetch store details to get exact coordinates
        // For now, keeping default
      }

      // Parse ETA
      if (trackingData.estimatedArrival) {
        const etaDate = new Date(trackingData.estimatedArrival);
        const now = new Date();
        const minutesRemaining = Math.round((etaDate.getTime() - now.getTime()) / 60000);
        setEta(`${minutesRemaining} min`);
      }
    }
  }, [trackingData, currentUser]);

  // Container styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing[4],
  };

  const modalStyles: React.CSSProperties = {
    ...createCard('md', 'lg'),
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    backgroundColor: colors.surface.primary,
    padding: spacing[6],
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  const closeButtonStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const infoCardStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.lg,
  };

  const infoRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  };

  const labelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  };

  const valueStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const statusBadgeStyles: React.CSSProperties = {
    ...createBadge(isConnected ? 'success' : 'error'),
    fontSize: typography.fontSize.xs,
    padding: `${spacing[1]} ${spacing[2]}`,
  };

  const getDriverStatusBadge = () => {
    if (!driver.isActive) {
      return <span style={{ ...statusBadgeStyles, ...createBadge('error') }}>Inactive</span>;
    }
    if (driver.isOnline) {
      return driver.activeDeliveryId ? (
        <span style={{ ...statusBadgeStyles, ...createBadge('warning') }}>Busy - Active Delivery</span>
      ) : (
        <span style={{ ...statusBadgeStyles, ...createBadge('success') }}>Online - Available</span>
      );
    }
    return <span style={{ ...statusBadgeStyles, ...createBadge('warning') }}>Offline</span>;
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <h2 style={titleStyles}>📍 Live Driver Tracking</h2>
          <button onClick={onClose} style={closeButtonStyles}>
            ✕ Close
          </button>
        </div>

        {/* Driver Info Card */}
        <div style={infoCardStyles}>
          <div style={infoRowStyles}>
            <span style={labelStyles}>Driver Name</span>
            <span style={valueStyles}>{driver.name}</span>
          </div>
          <div style={infoRowStyles}>
            <span style={labelStyles}>Phone</span>
            <span style={valueStyles}>{driver.phone}</span>
          </div>
          <div style={infoRowStyles}>
            <span style={labelStyles}>Status</span>
            {getDriverStatusBadge()}
          </div>
          <div style={infoRowStyles}>
            <span style={labelStyles}>WebSocket Connection</span>
            <span style={statusBadgeStyles}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          {lastUpdateTime && (
            <div style={{ ...infoRowStyles, marginBottom: 0 }}>
              <span style={labelStyles}>Last Update</span>
              <span style={valueStyles}>
                {new Date(lastUpdateTime).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Live Map */}
        {driver.isOnline ? (
          <>
            {location ? (
              <DriverTrackingMap
                driverPosition={driverPosition}
                restaurantPosition={restaurantPosition}
                customerPosition={customerPosition}
                route={route}
                eta={eta}
                driverName={driver.name}
                height="500px"
                autoCenter={true}
              />
            ) : (
              <div
                style={{
                  ...infoCardStyles,
                  height: '500px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[3],
                }}
              >
                <div style={{ fontSize: '3rem' }}>📡</div>
                <div style={{ fontSize: typography.fontSize.lg, color: colors.text.secondary }}>
                  Waiting for driver location...
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  {isConnected
                    ? 'Driver is online but location has not been broadcasted yet'
                    : 'Connecting to real-time tracking...'}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              ...infoCardStyles,
              height: '500px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[3],
            }}
          >
            <div style={{ fontSize: '3rem' }}>📴</div>
            <div style={{ fontSize: typography.fontSize.lg, color: colors.text.secondary }}>
              Driver is currently offline
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
              Location tracking is only available when the driver is online
            </div>
          </div>
        )}

        {/* Active Delivery Info */}
        {driver.activeDeliveryId && (
          <div style={{ ...infoCardStyles, marginTop: spacing[4] }}>
            <div style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing[3],
            }}>
              🚚 Active Delivery
            </div>
            <div style={infoRowStyles}>
              <span style={labelStyles}>Delivery ID</span>
              <span style={valueStyles}>{driver.activeDeliveryId}</span>
            </div>
            {location?.speed !== undefined && (
              <div style={{ ...infoRowStyles, marginBottom: 0 }}>
                <span style={labelStyles}>Current Speed</span>
                <span style={valueStyles}>{location.speed.toFixed(1)} km/h</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDriverTrackingMap;
