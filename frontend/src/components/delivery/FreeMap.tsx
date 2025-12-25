import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet quirk with bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapMarker {
  position: [number, number]; // [lat, lng]
  label: string;
  type?: 'store' | 'customer' | 'driver' | 'default';
}

interface FreeMapProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: MapMarker[];
  route?: [number, number][]; // Array of [lat, lng] coordinates
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Custom icons for different marker types
const createCustomIcon = (emoji: string, color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    ">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const icons = {
  store: createCustomIcon('🍕', '#ef4444'),
  customer: createCustomIcon('📍', '#22c55e'),
  driver: createCustomIcon('🚗', '#3b82f6'),
  default: undefined, // Use Leaflet default
};

/**
 * Free Map Component using OpenStreetMap and Leaflet
 * - No API key required
 * - 100% free to use
 * - Full-featured mapping solution
 */
export const FreeMap: React.FC<FreeMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  route,
  height = '400px',
  onMapClick,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={true}
    >
      {/* FREE OpenStreetMap tiles - no API key needed */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* Render markers */}
      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          position={marker.position}
          icon={marker.type ? icons[marker.type] : icons.default}
        >
          <Popup>{marker.label}</Popup>
        </Marker>
      ))}

      {/* Render route polyline */}
      {route && route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7,
          }}
        />
      )}
    </MapContainer>
  );
};

export default FreeMap;
