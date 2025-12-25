import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom driver icon (animated)
const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: `<div style="
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    animation: pulse 2s ease-in-out infinite;
  ">🚗</div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const restaurantIcon = L.divIcon({
  className: 'restaurant-marker',
  html: `<div style="
    background: #ef4444;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  ">🍕</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = L.divIcon({
  className: 'customer-marker',
  html: `<div style="
    background: #22c55e;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  ">📍</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Component to auto-center on driver
const AutoCenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom(), {
      animate: true,
      duration: 1,
    });
  }, [position, map]);

  return null;
};

interface DriverTrackingMapProps {
  driverPosition: [number, number]; // [lat, lng]
  restaurantPosition: [number, number];
  customerPosition: [number, number];
  route?: [number, number][]; // Optional route coordinates
  eta?: string; // Estimated time of arrival
  driverName?: string;
  height?: string;
  autoCenter?: boolean;
}

/**
 * Live Driver Tracking Map
 * - Shows real-time driver location
 * - Displays restaurant and customer markers
 * - Shows route if available
 * - Auto-centers on driver
 */
export const DriverTrackingMap: React.FC<DriverTrackingMapProps> = ({
  driverPosition,
  restaurantPosition,
  customerPosition,
  route,
  eta,
  driverName = 'Driver',
  height = '500px',
  autoCenter = true,
}) => {
  return (
    <MapContainer
      center={driverPosition}
      zoom={14}
      style={{ height, width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {autoCenter && <AutoCenter position={driverPosition} />}

      {/* Route polyline */}
      {route && route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{
            color: '#3b82f6',
            weight: 5,
            opacity: 0.7,
          }}
        />
      )}

      {/* Restaurant marker */}
      <Marker position={restaurantPosition} icon={restaurantIcon}>
        <Popup>
          <strong>🍕 Restaurant (Pickup)</strong>
        </Popup>
      </Marker>

      {/* Customer marker */}
      <Marker position={customerPosition} icon={customerIcon}>
        <Popup>
          <strong>📍 Delivery Location</strong>
        </Popup>
      </Marker>

      {/* Driver marker */}
      <Marker position={driverPosition} icon={driverIcon}>
        <Popup>
          <div style={{ textAlign: 'center' }}>
            <strong>🚗 {driverName}</strong>
            {eta && (
              <>
                <br />
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                  ETA: {eta}
                </span>
              </>
            )}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default DriverTrackingMap;
