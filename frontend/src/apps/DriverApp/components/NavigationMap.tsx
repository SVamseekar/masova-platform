import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../../../styles/design-tokens';
import { createCard, createNeumorphicSurface } from '../../../styles/neumorphic-utils';

interface NavigationMapProps {
  destination: string;
  destinationCoords?: { latitude: number; longitude: number };
  currentLocation?: { latitude: number; longitude: number };
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

const NavigationMap: React.FC<NavigationMapProps> = ({ destination, destinationCoords, currentLocation }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  // Mock turn-by-turn instructions (in production, get from Google Maps API)
  const mockInstructions: RouteStep[] = [
    { instruction: 'Head north on Main St toward 1st Ave', distance: '0.5 km', duration: '2 min' },
    { instruction: 'Turn right onto Park Avenue', distance: '1.2 km', duration: '3 min' },
    { instruction: 'At the roundabout, take the 2nd exit onto Highway 101', distance: '5.8 km', duration: '8 min' },
    { instruction: 'Take exit 45 toward Downtown', distance: '0.8 km', duration: '1 min' },
    { instruction: 'Turn left onto Elm Street', distance: '0.3 km', duration: '1 min' },
    { instruction: 'Destination will be on your right', distance: '50 m', duration: '< 1 min' },
  ];

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
    flex: 1,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    transition: 'all 0.2s',
  };

  const secondaryButtonStyles: React.CSSProperties = {
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

      {/* Map Placeholder */}
      <div style={mapPlaceholderStyles}>
        <span style={mapIconStyles}>🗺️</span>
        <p style={mapTextStyles}>
          <strong>Map Integration Placeholder</strong>
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
        </button>
      </div>

      {/* Turn-by-Turn Instructions */}
      {showInstructions && (
        <div style={instructionsContainerStyles}>
          <div style={instructionsTitleStyles}>
            <span>🧭</span>
            <span>Turn-by-Turn Directions</span>
          </div>

          {mockInstructions.map((step, index) => (
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
        </div>
      )}

      {/* Production Note */}
      <div style={alertStyles}>
        <strong style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          For Production:
        </strong>
        <p style={alertTextStyles}>
          Integrate Google Maps JavaScript API with your API key in .env file.
          Add REACT_APP_GOOGLE_MAPS_API_KEY to enable:
        </p>
        <ul style={{ ...alertTextStyles, marginLeft: spacing[4], marginTop: spacing[2] }}>
          <li>Real-time embedded maps</li>
          <li>Live turn-by-turn navigation</li>
          <li>Traffic updates</li>
          <li>Route optimization</li>
          <li>ETA calculations</li>
        </ul>
      </div>
    </div>
  );
};

export default NavigationMap;
