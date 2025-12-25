import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
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
  origin?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onLocationUpdate?: (location: DriverLocation) => void;
  showDirections?: boolean;
}

// Map container style
const containerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: borderRadius.xl,
};

// Default center (Bangalore, India)
const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

// Map libraries to load
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ['places', 'geometry'];

const LiveMap: React.FC<LiveMapProps> = ({
  driverId,
  destination,
  origin,
  onLocationUpdate,
  showDirections = true,
}) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Memoized destination position
  const destinationPos = useMemo(() => ({
    lat: destination.latitude,
    lng: destination.longitude,
  }), [destination.latitude, destination.longitude]);

  // Memoized driver position
  const driverPos = useMemo(() => {
    if (!driverLocation) return null;
    return {
      lat: driverLocation.latitude,
      lng: driverLocation.longitude,
    };
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  // Map load callback
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Map unmount callback
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // WebSocket connection for driver location
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupWebSocket = async () => {
      try {
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }
        setConnected(true);

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

  // Calculate and display directions
  useEffect(() => {
    if (!isLoaded || !showDirections || !driverPos) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: driverPos,
        destination: destinationPos,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);

          // Extract ETA and distance
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setEta(leg.duration?.text || null);
            setDistance(leg.distance?.text || null);
          }
        } else {
          console.warn('Directions request failed:', status);
        }
      }
    );
  }, [isLoaded, driverPos, destinationPos, showDirections]);

  // Fit bounds to show all markers
  useEffect(() => {
    if (!map || !isLoaded) return;

    const bounds = new google.maps.LatLngBounds();

    if (driverPos) {
      bounds.extend(driverPos);
    }
    bounds.extend(destinationPos);

    if (origin) {
      bounds.extend({ lat: origin.latitude, lng: origin.longitude });
    }

    map.fitBounds(bounds, 50);
  }, [map, isLoaded, driverPos, destinationPos, origin]);

  // Open in Google Maps (fallback for mobile/external navigation)
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

  const mapWrapperStyles: React.CSSProperties = {
    ...createCard('sm', 'base'),
    overflow: 'hidden',
    marginBottom: spacing[4],
    position: 'relative',
  };

  const statusBadgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    padding: `${spacing[1]} ${spacing[3]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.full,
    backgroundColor: connected ? colors.semantic.success : colors.semantic.error,
    color: '#fff',
    zIndex: 10,
  };

  const etaBadgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    padding: `${spacing[1]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.primary,
    color: '#fff',
    zIndex: 10,
  };

  const infoCardStyles: React.CSSProperties = {
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
    ...createCard('sm', 'base'),
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
  };

  const errorStyles: React.CSSProperties = {
    height: '350px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: spacing[3],
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.xl,
  };

  // Loading state
  if (!isLoaded) {
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
        <div style={errorStyles}>
          <div style={{ fontSize: '3rem' }}>🗺️</div>
          <div style={{ color: colors.text.secondary }}>Loading map...</div>
        </div>
      </div>
    );
  }

  // Error state (API key missing or load failed)
  if (loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
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
        <div style={mapWrapperStyles}>
          <span style={statusBadgeStyles}>
            {connected ? '🟢 Live' : '🔴 Offline'}
          </span>
          <div style={errorStyles}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <div style={{ color: colors.text.secondary, textAlign: 'center', padding: spacing[4] }}>
              <div style={{ fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] }}>
                Google Maps API Not Configured
              </div>
              <div style={{ fontSize: typography.fontSize.sm }}>
                Add VITE_GOOGLE_MAPS_API_KEY to your .env file
              </div>
            </div>
          </div>
        </div>

        {/* Location Info */}
        {driverLocation && (
          <div style={infoCardStyles}>
            <div style={infoRowStyles}>
              <span style={labelStyles}>Driver Location</span>
              <span style={valueStyles}>
                {driverLocation.latitude.toFixed(6)}, {driverLocation.longitude.toFixed(6)}
              </span>
            </div>
            {driverLocation.speed !== undefined && (
              <div style={{ ...infoRowStyles, marginBottom: 0 }}>
                <span style={labelStyles}>Speed</span>
                <span style={valueStyles}>{driverLocation.speed.toFixed(1)} km/h</span>
              </div>
            )}
          </div>
        )}

        <button onClick={openInGoogleMaps} style={buttonStyles}>
          🗺️ Open in Google Maps
        </button>
      </div>
    );
  }

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

      {/* Google Map */}
      <div style={mapWrapperStyles}>
        <span style={statusBadgeStyles}>
          {connected ? '🟢 Live' : '🔴 Offline'}
        </span>

        {eta && (
          <span style={etaBadgeStyles}>
            ETA: {eta}
          </span>
        )}

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={driverPos || destinationPos || defaultCenter}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            styles: [
              // Subtle styling to match app theme
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          }}
        >
          {/* Driver Marker */}
          {driverPos && (
            <Marker
              position={driverPos}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
                    <circle cx="20" cy="20" r="18" fill="#4F46E5" stroke="white" stroke-width="3"/>
                    <text x="20" y="26" font-size="18" text-anchor="middle" fill="white">🚗</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
              }}
              onClick={() => setShowDriverInfo(true)}
            />
          )}

          {/* Driver Info Window */}
          {showDriverInfo && driverPos && driverLocation && (
            <InfoWindow
              position={driverPos}
              onCloseClick={() => setShowDriverInfo(false)}
            >
              <div style={{ padding: spacing[2] }}>
                <div style={{ fontWeight: 'bold', marginBottom: spacing[1] }}>Driver Location</div>
                <div>Speed: {driverLocation.speed?.toFixed(1) || 0} km/h</div>
                {distance && <div>Distance: {distance}</div>}
                {eta && <div>ETA: {eta}</div>}
              </div>
            </InfoWindow>
          )}

          {/* Destination Marker */}
          <Marker
            position={destinationPos}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
                  <path d="M20 0 C8.954 0 0 8.954 0 20 C0 35 20 50 20 50 C20 50 40 35 40 20 C40 8.954 31.046 0 20 0z" fill="#EF4444"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 50),
              anchor: new google.maps.Point(20, 50),
            }}
            title={destination.address}
          />

          {/* Origin Marker (Restaurant) */}
          {origin && (
            <Marker
              position={{ lat: origin.latitude, lng: origin.longitude }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
                    <circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="3"/>
                    <text x="20" y="26" font-size="16" text-anchor="middle" fill="white">🍕</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
              }}
              title={origin.address}
            />
          )}

          {/* Route Directions */}
          {directions && showDirections && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#4F46E5',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Trip Info */}
      {(eta || distance || driverLocation) && (
        <div style={infoCardStyles}>
          {eta && (
            <div style={infoRowStyles}>
              <span style={labelStyles}>Estimated Arrival</span>
              <span style={{ ...valueStyles, color: colors.brand.primary }}>{eta}</span>
            </div>
          )}
          {distance && (
            <div style={infoRowStyles}>
              <span style={labelStyles}>Distance Remaining</span>
              <span style={valueStyles}>{distance}</span>
            </div>
          )}
          {driverLocation?.speed !== undefined && (
            <div style={{ ...infoRowStyles, marginBottom: 0 }}>
              <span style={labelStyles}>Current Speed</span>
              <span style={valueStyles}>{driverLocation.speed.toFixed(1)} km/h</span>
            </div>
          )}
        </div>
      )}

      {/* Destination Info */}
      <div style={infoCardStyles}>
        <div style={infoRowStyles}>
          <span style={labelStyles}>Delivery Address</span>
        </div>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.primary,
          lineHeight: 1.5,
        }}>
          {destination.address}
        </div>
      </div>

      {/* External Navigation Button */}
      <button onClick={openInGoogleMaps} style={buttonStyles}>
        🧭 Open Navigation App
      </button>
    </div>
  );
};

export default LiveMap;
