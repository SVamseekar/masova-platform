import React, { useEffect, useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createCard } from '../../styles/neumorphic-utils';
import { websocketService, DriverLocation } from '../../services/websocketService';

interface LiveMapProps {
  driverId: string;
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onLocationUpdate?: (location: DriverLocation) => void;
}

const LiveMap: React.FC<LiveMapProps> = ({ driverId, destination, onLocationUpdate }) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupWebSocket = async () => {
      try {
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }
        setConnected(true);

        // Subscribe to driver location updates
        unsubscribe = websocketService.subscribeToDriverLocation(driverId, (location) => {
          setDriverLocation(location);
          onLocationUpdate?.(location);
        });
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setConnected(false);
      }
    };

    setupWebSocket();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [driverId, onLocationUpdate]);

  const openInGoogleMaps = () => {
    if (driverLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[4],
    marginBottom: spacing[4],
  };

  const mapPlaceholderStyles: React.CSSProperties = {
    ...createCard('sm', 'base'),
    height: '300px',
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
    position: 'relative',
  };

  const iconStyles: React.CSSProperties = {
    fontSize: '4rem',
  };

  const textStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  };

  const locationInfoStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors.surface.primary,
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

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...createCard('sm', 'none'),
  };

  const statusBadgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    padding: `${spacing[1]} ${spacing[3]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.full,
    backgroundColor: connected ? colors.semantic.success : colors.semantic.error,
    color: '#fff',
  };

  return (
    <div style={containerStyles}>
      <h3 style={{
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[4],
      }}>
        Live Tracking
      </h3>

      {/* Map Placeholder */}
      <div style={mapPlaceholderStyles}>
        <span style={statusBadgeStyles}>
          {connected ? '🟢 Live' : '🔴 Offline'}
        </span>

        <span style={iconStyles}>🗺️</span>
        <div style={textStyles}>
          <div style={{ fontWeight: typography.fontWeight.semibold, marginBottom: spacing[1] }}>
            Map Integration Placeholder
          </div>
          <div style={{ fontSize: typography.fontSize.sm }}>
            Click below to open in Google Maps
          </div>
        </div>

        {driverLocation && (
          <div style={{
            position: 'absolute',
            bottom: spacing[3],
            left: spacing[3],
            padding: spacing[2],
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.xs,
          }}>
            📍 Driver: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
            {driverLocation.speed && <div>Speed: {driverLocation.speed.toFixed(1)} km/h</div>}
          </div>
        )}
      </div>

      {/* Location Info */}
      {driverLocation && (
        <div style={locationInfoStyles}>
          <div style={infoRowStyles}>
            <span style={labelStyles}>Current Location</span>
            <span style={valueStyles}>
              {driverLocation.latitude.toFixed(6)}, {driverLocation.longitude.toFixed(6)}
            </span>
          </div>
          {driverLocation.speed !== undefined && (
            <div style={infoRowStyles}>
              <span style={labelStyles}>Speed</span>
              <span style={valueStyles}>{driverLocation.speed.toFixed(1)} km/h</span>
            </div>
          )}
          {driverLocation.heading !== undefined && (
            <div style={infoRowStyles}>
              <span style={labelStyles}>Heading</span>
              <span style={valueStyles}>{driverLocation.heading.toFixed(0)}°</span>
            </div>
          )}
          {driverLocation.accuracy && (
            <div style={infoRowStyles}>
              <span style={labelStyles}>Accuracy</span>
              <span style={valueStyles}>±{driverLocation.accuracy.toFixed(0)}m</span>
            </div>
          )}
          <div style={{ ...infoRowStyles, marginBottom: 0 }}>
            <span style={labelStyles}>Last Updated</span>
            <span style={valueStyles}>
              {new Date(driverLocation.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Destination Info */}
      <div style={locationInfoStyles}>
        <div style={infoRowStyles}>
          <span style={labelStyles}>Destination</span>
          <span style={valueStyles}>
            {destination.latitude.toFixed(6)}, {destination.longitude.toFixed(6)}
          </span>
        </div>
        <div style={{ ...infoRowStyles, marginBottom: 0 }}>
          <span style={labelStyles}>Address</span>
          <span style={{ ...valueStyles, textAlign: 'right', maxWidth: '60%' }}>
            {destination.address}
          </span>
        </div>
      </div>

      {/* Open in Google Maps Button */}
      <button onClick={openInGoogleMaps} style={buttonStyles}>
        🗺️ Open in Google Maps
      </button>

      <div style={{
        marginTop: spacing[3],
        padding: spacing[2],
        backgroundColor: colors.surface.secondary,
        borderRadius: borderRadius.md,
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        textAlign: 'center',
      }}>
        <strong>For Production:</strong> Integrate Google Maps JavaScript API for embedded maps.
        Add REACT_APP_GOOGLE_MAPS_API_KEY to .env file.
      </div>
    </div>
  );
};

export default LiveMap;
