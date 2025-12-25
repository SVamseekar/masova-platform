import React, { useState, useEffect, useCallback } from 'react';
import { colors, spacing, typography, borderRadius } from '../../../styles/design-tokens';
import { createCard, createNeumorphicSurface } from '../../../styles/neumorphic-utils';
import { useGetOptimizedRouteMutation, RouteOptimizationResponse, RouteSegment, AddressDTO } from '../../../store/api/deliveryApi';

interface NavigationMapProps {
  destination: string;
  destinationCoords?: { latitude: number; longitude: number };
  currentLocation?: { latitude: number; longitude: number };
  orderId?: string;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

const NavigationMap: React.FC<NavigationMapProps> = ({
  destination,
  destinationCoords,
  currentLocation,
  orderId,
  autoRefresh = true,
  refreshIntervalMs = 30000, // Refresh route every 30 seconds
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [routeData, setRouteData] = useState<RouteOptimizationResponse | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // RTK Query mutation for route optimization (DELIV-004)
  const [getOptimizedRoute, { isLoading: isLoadingRoute }] = useGetOptimizedRouteMutation();

  // Convert RouteSegments to display format
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return '< 1 min';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return `${hours}h ${remainingMins}min`;
    }
    return `${minutes} min`;
  };

  // Fetch real route from backend RouteOptimizationService (DELIV-004)
  const fetchRoute = useCallback(async () => {
    if (!currentLocation || !destinationCoords) {
      console.log('[NavigationMap] Missing location data, skipping route fetch');
      return;
    }

    try {
      setRouteError(null);
      console.log('[NavigationMap] Fetching optimized route from backend...');

      // Create AddressDTO format matching backend expectations
      const originAddress: AddressDTO = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      const destinationAddress: AddressDTO = {
        latitude: destinationCoords.latitude,
        longitude: destinationCoords.longitude,
      };

      const response = await getOptimizedRoute({
        origin: originAddress,
        destination: destinationAddress,
        travelMode: 'DRIVING',
        avoidTolls: false,
        avoidHighways: false,
      }).unwrap();

      setRouteData(response);
      console.log('[NavigationMap] Route received:', {
        distance: formatDistance(response.distance),
        duration: formatDuration(response.duration),
        steps: response.segments?.length || response.steps?.length || 0,
      });
    } catch (err: any) {
      console.error('[NavigationMap] Route optimization failed:', err);
      setRouteError(err.data?.message || err.message || 'Failed to fetch route');
    }
  }, [currentLocation, destinationCoords, getOptimizedRoute]);

  // Fetch route on mount and when locations change
  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Auto-refresh route periodically for real-time updates
  useEffect(() => {
    if (!autoRefresh || !currentLocation || !destinationCoords) {
      return;
    }

    const interval = setInterval(() => {
      console.log('[NavigationMap] Auto-refreshing route...');
      fetchRoute();
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalMs, fetchRoute, currentLocation, destinationCoords]);

  // Convert route segments to display format
  const routeInstructions: RouteStep[] = routeData?.segments?.map((segment: RouteSegment) => ({
    instruction: segment.instruction,
    distance: formatDistance(segment.distance),
    duration: formatDuration(segment.duration),
  })) || [];

  // Fallback to mock data if no real route available
  const mockInstructions: RouteStep[] = [
    { instruction: 'Head north on Main St toward 1st Ave', distance: '0.5 km', duration: '2 min' },
    { instruction: 'Turn right onto Park Avenue', distance: '1.2 km', duration: '3 min' },
    { instruction: 'At the roundabout, take the 2nd exit onto Highway 101', distance: '5.8 km', duration: '8 min' },
    { instruction: 'Take exit 45 toward Downtown', distance: '0.8 km', duration: '1 min' },
    { instruction: 'Turn left onto Elm Street', distance: '0.3 km', duration: '1 min' },
    { instruction: 'Destination will be on your right', distance: '50 m', duration: '< 1 min' },
  ];

  // Use real route if available, otherwise fallback to mock
  const displayInstructions = routeInstructions.length > 0 ? routeInstructions : mockInstructions;
  const isUsingRealRoute = routeInstructions.length > 0;

  const handleOpenGoogleMaps = () => {
    if (currentLocation && destinationCoords) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    } else if (destinationCoords) {
      const url = `https://www.google.com/maps/search/?api=1&query=${destinationCoords.latitude},${destinationCoords.longitude}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
      window.open(url, '_blank');
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[4],
  };

  const headerStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const mapPlaceholderStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'xl'),
    height: '350px',
    backgroundColor: colors.surface.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: spacing[4],
    marginBottom: spacing[4],
    position: 'relative',
  };

  const mapIconStyles: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: spacing[2],
  };

  const mapTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  };

  const destinationTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: '80%',
  };

  const coordsStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: spacing[3],
    left: spacing[3],
    right: spacing[3],
    padding: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.md,
    color: '#fff',
    fontSize: typography.fontSize.xs,
  };

  const buttonGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
    marginBottom: spacing[4],
  };

  const primaryButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    flex: 1,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    flex: 1,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const instructionsContainerStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[4],
    backgroundColor: colors.surface.primary,
    maxHeight: '400px',
    overflowY: 'auto',
  };

  const instructionsTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const stepStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors.surface.background,
  };

  const stepNumberStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.primary,
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing[2],
  };

  const stepTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginBottom: spacing[1],
  };

  const stepMetaStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    display: 'flex',
    gap: spacing[3],
  };

  const alertStyles: React.CSSProperties = {
    ...createCard('sm', 'sm'),
    padding: spacing[3],
    backgroundColor: colors.semantic.info + '20',
    borderLeft: `4px solid ${colors.semantic.info}`,
    marginTop: spacing[4],
  };

  const alertTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  };

  return (
    <div style={containerStyles}>
      <h3 style={headerStyles}>Navigation to Delivery Location</h3>

      {/* Route Summary - DELIV-004: Show real route data */}
      {routeData && (
        <div style={{
          ...createCard('sm', 'sm'),
          padding: spacing[3],
          marginBottom: spacing[4],
          backgroundColor: colors.semantic.success + '15',
          borderLeft: `4px solid ${colors.semantic.success}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[2],
          }}>
            <span style={{ fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
              📍 Route Summary
            </span>
            <span style={{
              fontSize: typography.fontSize.xs,
              color: colors.semantic.success,
              backgroundColor: colors.semantic.success + '20',
              padding: `${spacing[1]} ${spacing[2]}`,
              borderRadius: borderRadius.md,
            }}>
              ✓ Real-time Route
            </span>
          </div>
          <div style={{ display: 'flex', gap: spacing[4], fontSize: typography.fontSize.sm }}>
            <span><strong>📏 Distance:</strong> {formatDistance(routeData.distance)}</span>
            <span><strong>⏱️ Duration:</strong> {formatDuration(routeData.duration)}</span>
            {routeData.estimatedArrival && (
              <span><strong>🎯 ETA:</strong> {new Date(routeData.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>
      )}

      {/* Loading/Error State */}
      {isLoadingRoute && (
        <div style={{
          textAlign: 'center',
          padding: spacing[4],
          color: colors.text.secondary,
          fontSize: typography.fontSize.sm,
        }}>
          <span style={{ marginRight: spacing[2] }}>⏳</span>
          Fetching optimal route...
        </div>
      )}

      {routeError && (
        <div style={{
          ...createCard('sm', 'sm'),
          padding: spacing[3],
          marginBottom: spacing[4],
          backgroundColor: colors.semantic.warning + '15',
          borderLeft: `4px solid ${colors.semantic.warning}`,
        }}>
          <span style={{ fontSize: typography.fontSize.sm, color: colors.semantic.warning }}>
            ⚠️ {routeError} - Using fallback directions
          </span>
        </div>
      )}

      {/* Map Placeholder */}
      <div style={mapPlaceholderStyles}>
        <span style={mapIconStyles}>🗺️</span>
        <p style={mapTextStyles}>
          <strong>{isUsingRealRoute ? 'Route Optimized' : 'Map Integration Placeholder'}</strong>
          <br />
          Click "Open in Google Maps" for navigation
        </p>
        <p style={destinationTextStyles}>
          <strong>Destination:</strong> {destination}
        </p>

        {(currentLocation || destinationCoords) && (
          <div style={coordsStyles}>
            {currentLocation && (
              <div>📍 Your Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</div>
            )}
            {destinationCoords && (
              <div>🎯 Destination: {destinationCoords.latitude.toFixed(4)}, {destinationCoords.longitude.toFixed(4)}</div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={buttonGroupStyles}>
        <button onClick={handleOpenGoogleMaps} style={primaryButtonStyles}>
          🗺️ Open in Google Maps
        </button>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          style={secondaryButtonStyles}
        >
          {showInstructions ? '📍 Hide' : '🧭 Show'} Directions
          {isUsingRealRoute && <span style={{ marginLeft: spacing[1], fontSize: typography.fontSize.xs }}>({displayInstructions.length} steps)</span>}
        </button>
      </div>

      {/* Turn-by-Turn Instructions - DELIV-004: Use real route data */}
      {showInstructions && (
        <div style={instructionsContainerStyles}>
          <div style={instructionsTitleStyles}>
            <span>🧭</span>
            <span>Turn-by-Turn Directions</span>
            {isUsingRealRoute && (
              <span style={{
                fontSize: typography.fontSize.xs,
                color: colors.semantic.success,
                backgroundColor: colors.semantic.success + '20',
                padding: `${spacing[1]} ${spacing[2]}`,
                borderRadius: borderRadius.md,
                marginLeft: 'auto',
              }}>
                ✓ Live Route
              </span>
            )}
          </div>

          {displayInstructions.map((step, index) => (
            <div key={index} style={stepStyles}>
              <div style={stepTextStyles}>
                <span style={stepNumberStyles}>{index + 1}</span>
                {step.instruction}
              </div>
              <div style={stepMetaStyles}>
                <span>📏 {step.distance}</span>
                <span>⏱️ {step.duration}</span>
              </div>
            </div>
          ))}

          {/* Refresh button for real-time updates */}
          <button
            onClick={fetchRoute}
            disabled={isLoadingRoute}
            style={{
              ...secondaryButtonStyles,
              marginTop: spacing[3],
              opacity: isLoadingRoute ? 0.6 : 1,
            }}
          >
            {isLoadingRoute ? '⏳ Updating...' : '🔄 Refresh Route'}
          </button>
        </div>
      )}

      {/* Production Note - Updated for DELIV-004 */}
      <div style={alertStyles}>
        <strong style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          {isUsingRealRoute ? '✓ Connected to Route Service' : 'Route Service Status'}
        </strong>
        <p style={alertTextStyles}>
          {isUsingRealRoute
            ? 'Real-time route optimization is active. Routes refresh automatically every 30 seconds.'
            : 'Configure Google Maps API key for enhanced features:'
          }
        </p>
        {!isUsingRealRoute && (
          <ul style={{ ...alertTextStyles, marginLeft: spacing[4], marginTop: spacing[2] }}>
            <li>Real-time embedded maps</li>
            <li>Live turn-by-turn navigation</li>
            <li>Traffic updates</li>
            <li>Route optimization</li>
            <li>ETA calculations</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default NavigationMap;
