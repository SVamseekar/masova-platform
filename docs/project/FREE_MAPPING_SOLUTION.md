# Free Mapping Solution for MaSoVa Delivery System

## Executive Summary

This document outlines a **100% free, open-source mapping stack** for the MaSoVa restaurant management system, replacing Google Maps entirely.

---

## Recommended Stack

| Feature | Free Solution | Notes |
|---------|---------------|-------|
| Interactive Maps | **Leaflet.js** + OpenStreetMap tiles | Zero cost, full-featured |
| Geocoding | **Nominatim** (OSM) | Free API or self-hosted |
| Routing/Directions | **OSRM** (Open Source Routing Machine) | Self-hosted or free public demo |
| Distance Matrix | **OSRM Table API** | Batch distance/time calculations |
| Address Autocomplete | **Photon** or **Nominatim** | Free geocoding with suggestions |
| Reverse Geocoding | **Nominatim** | Coordinates → Address |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Leaflet    │  │ React-      │  │  Custom Hooks           │  │
│  │  Maps       │  │ Leaflet     │  │  (useGeocoding, etc.)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Spring Boot)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ RouteOptimization│  │ GeocodingService│  │ DistanceMatrix  │  │
│  │ Service (OSRM)   │  │ (Nominatim)     │  │ Service (OSRM)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL FREE SERVICES                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ OSM Tiles   │  │ Nominatim   │  │ OSRM Public API         │  │
│  │ (maps)      │  │ (geocoding) │  │ (routing) or self-host  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Frontend Implementation (React + Leaflet)

### 1.1 Install Dependencies

```bash
npm install leaflet react-leaflet @types/leaflet
npm install leaflet-routing-machine  # For turn-by-turn directions
```

### 1.2 Basic Map Component

```tsx
// src/components/delivery/FreeMap.tsx
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet quirk with bundlers)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    label: string;
  }>;
  route?: [number, number][];
}

export const FreeMap: React.FC<MapProps> = ({
  center,
  zoom = 13,
  markers = [],
  route
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '400px', width: '100%' }}
    >
      {/* FREE OpenStreetMap tiles - no API key needed */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((marker, idx) => (
        <Marker key={idx} position={marker.position}>
          <Popup>{marker.label}</Popup>
        </Marker>
      ))}

      {route && (
        <Polyline
          positions={route}
          color="blue"
          weight={4}
        />
      )}
    </MapContainer>
  );
};
```

### 1.3 Live Driver Tracking Component

```tsx
// src/components/delivery/DriverTrackingMap.tsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom driver icon
const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: `<div style="
    background: #3b82f6;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">🚗</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const restaurantIcon = L.divIcon({
  className: 'restaurant-marker',
  html: `<div style="
    background: #ef4444;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">🍕</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customerIcon = L.divIcon({
  className: 'customer-marker',
  html: `<div style="
    background: #22c55e;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Component to auto-center on driver
const AutoCenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

interface DriverTrackingProps {
  driverPosition: [number, number];
  restaurantPosition: [number, number];
  customerPosition: [number, number];
  route: [number, number][];
  eta: string;
}

export const DriverTrackingMap: React.FC<DriverTrackingProps> = ({
  driverPosition,
  restaurantPosition,
  customerPosition,
  route,
  eta
}) => {
  return (
    <MapContainer
      center={driverPosition}
      zoom={14}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AutoCenter position={driverPosition} />

      {/* Route polyline */}
      {route.length > 0 && (
        <Polyline
          positions={route}
          color="#3b82f6"
          weight={5}
          opacity={0.7}
        />
      )}

      {/* Restaurant marker */}
      <Marker position={restaurantPosition} icon={restaurantIcon}>
        <Popup>Restaurant (Pickup)</Popup>
      </Marker>

      {/* Customer marker */}
      <Marker position={customerPosition} icon={customerIcon}>
        <Popup>Delivery Location</Popup>
      </Marker>

      {/* Driver marker */}
      <Marker position={driverPosition} icon={driverIcon}>
        <Popup>
          <strong>Driver Location</strong><br />
          ETA: {eta}
        </Popup>
      </Marker>
    </MapContainer>
  );
};
```

### 1.4 Address Autocomplete Hook (Nominatim)

```tsx
// src/hooks/useAddressAutocomplete.ts
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

interface AddressSuggestion {
  displayName: string;
  lat: number;
  lon: number;
  placeId: string;
}

export const useAddressAutocomplete = () => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAddress = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // Using Nominatim - FREE, no API key required
        // Add your country code for better results (e.g., countrycodes=in for India)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );

        const data = await response.json();

        setSuggestions(data.map((item: any) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          placeId: item.place_id,
        })));
      } catch (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  return { suggestions, loading, searchAddress };
};
```

### 1.5 Address Autocomplete Component

```tsx
// src/components/common/AddressAutocomplete.tsx
import { useState } from 'react';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';

interface Props {
  onSelect: (address: string, lat: number, lon: number) => void;
  placeholder?: string;
}

export const AddressAutocomplete: React.FC<Props> = ({
  onSelect,
  placeholder = "Enter delivery address..."
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading, searchAddress } = useAddressAutocomplete();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    searchAddress(value);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion: typeof suggestions[0]) => {
    setInputValue(suggestion.displayName);
    setShowSuggestions(false);
    onSelect(suggestion.displayName, suggestion.lat, suggestion.lon);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '14px',
        }}
      />

      {loading && (
        <div style={{ position: 'absolute', right: '12px', top: '12px' }}>
          ⏳
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginTop: '4px',
          padding: 0,
          listStyle: 'none',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.placeId}
              onClick={() => handleSelect(suggestion)}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              {suggestion.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

---

## Part 2: Backend Implementation (Spring Boot + OSRM)

### 2.1 Routing Service (OSRM)

```java
// delivery-service/src/main/java/com/MaSoVa/delivery/service/FreeRoutingService.java
package com.MaSoVa.delivery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class FreeRoutingService {

    // OSRM Demo Server (FREE) - For production, self-host OSRM
    private static final String OSRM_BASE_URL = "https://router.project-osrm.org";

    // Nominatim (FREE) - Respect usage policy: max 1 req/sec
    private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public FreeRoutingService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Get route between two points using OSRM
     * Returns: route geometry, distance (meters), duration (seconds)
     */
    public RouteResult getRoute(double startLat, double startLon,
                                 double endLat, double endLon) {
        try {
            // OSRM uses lon,lat format (not lat,lon!)
            String url = String.format(
                "%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson&steps=true",
                OSRM_BASE_URL, startLon, startLat, endLon, endLat
            );

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            if (!"Ok".equals(root.get("code").asText())) {
                throw new RuntimeException("OSRM routing failed");
            }

            JsonNode route = root.get("routes").get(0);
            double distance = route.get("distance").asDouble(); // meters
            double duration = route.get("duration").asDouble(); // seconds

            // Extract route coordinates
            List<double[]> coordinates = new ArrayList<>();
            JsonNode geometry = route.get("geometry").get("coordinates");
            for (JsonNode coord : geometry) {
                coordinates.add(new double[]{
                    coord.get(1).asDouble(), // lat
                    coord.get(0).asDouble()  // lon
                });
            }

            // Extract turn-by-turn instructions
            List<String> instructions = new ArrayList<>();
            JsonNode legs = route.get("legs");
            for (JsonNode leg : legs) {
                for (JsonNode step : leg.get("steps")) {
                    String instruction = step.get("maneuver").get("type").asText();
                    String modifier = step.has("maneuver") &&
                                      step.get("maneuver").has("modifier")
                                      ? step.get("maneuver").get("modifier").asText()
                                      : "";
                    String streetName = step.has("name") ? step.get("name").asText() : "";
                    instructions.add(formatInstruction(instruction, modifier, streetName));
                }
            }

            return new RouteResult(distance, duration, coordinates, instructions);

        } catch (Exception e) {
            throw new RuntimeException("Failed to get route: " + e.getMessage(), e);
        }
    }

    /**
     * Calculate distance matrix for multiple origins/destinations
     * Useful for finding nearest driver or optimizing multi-stop routes
     */
    public DistanceMatrixResult getDistanceMatrix(List<double[]> locations) {
        try {
            // Build coordinates string
            StringBuilder coords = new StringBuilder();
            for (int i = 0; i < locations.size(); i++) {
                if (i > 0) coords.append(";");
                coords.append(locations.get(i)[1]).append(",").append(locations.get(i)[0]); // lon,lat
            }

            String url = String.format(
                "%s/table/v1/driving/%s?annotations=distance,duration",
                OSRM_BASE_URL, coords
            );

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            if (!"Ok".equals(root.get("code").asText())) {
                throw new RuntimeException("OSRM table request failed");
            }

            // Parse distances matrix
            double[][] distances = new double[locations.size()][locations.size()];
            double[][] durations = new double[locations.size()][locations.size()];

            JsonNode distancesNode = root.get("distances");
            JsonNode durationsNode = root.get("durations");

            for (int i = 0; i < locations.size(); i++) {
                for (int j = 0; j < locations.size(); j++) {
                    distances[i][j] = distancesNode.get(i).get(j).asDouble();
                    durations[i][j] = durationsNode.get(i).get(j).asDouble();
                }
            }

            return new DistanceMatrixResult(distances, durations);

        } catch (Exception e) {
            throw new RuntimeException("Failed to get distance matrix: " + e.getMessage(), e);
        }
    }

    /**
     * Geocode an address to coordinates using Nominatim
     */
    public GeocodingResult geocode(String address) {
        try {
            String url = String.format(
                "%s/search?format=json&q=%s&limit=1",
                NOMINATIM_BASE_URL,
                java.net.URLEncoder.encode(address, "UTF-8")
            );

            // Add delay to respect Nominatim rate limits (1 req/sec)
            Thread.sleep(1000);

            String response = restTemplate.getForObject(url, String.class);
            JsonNode results = objectMapper.readTree(response);

            if (results.isEmpty()) {
                throw new RuntimeException("Address not found: " + address);
            }

            JsonNode result = results.get(0);
            return new GeocodingResult(
                result.get("lat").asDouble(),
                result.get("lon").asDouble(),
                result.get("display_name").asText()
            );

        } catch (Exception e) {
            throw new RuntimeException("Geocoding failed: " + e.getMessage(), e);
        }
    }

    /**
     * Reverse geocode coordinates to address
     */
    public String reverseGeocode(double lat, double lon) {
        try {
            String url = String.format(
                "%s/reverse?format=json&lat=%f&lon=%f",
                NOMINATIM_BASE_URL, lat, lon
            );

            Thread.sleep(1000); // Rate limit

            String response = restTemplate.getForObject(url, String.class);
            JsonNode result = objectMapper.readTree(response);

            return result.get("display_name").asText();

        } catch (Exception e) {
            throw new RuntimeException("Reverse geocoding failed: " + e.getMessage(), e);
        }
    }

    /**
     * Optimize route for multiple stops (Traveling Salesman)
     */
    public RouteResult getOptimizedRoute(double startLat, double startLon,
                                          List<double[]> stops,
                                          double endLat, double endLon) {
        try {
            // Build waypoints
            StringBuilder coords = new StringBuilder();
            coords.append(startLon).append(",").append(startLat);

            for (double[] stop : stops) {
                coords.append(";").append(stop[1]).append(",").append(stop[0]);
            }

            coords.append(";").append(endLon).append(",").append(endLat);

            // Use OSRM trip endpoint for route optimization
            String url = String.format(
                "%s/trip/v1/driving/%s?roundtrip=false&source=first&destination=last&geometries=geojson",
                OSRM_BASE_URL, coords
            );

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            if (!"Ok".equals(root.get("code").asText())) {
                throw new RuntimeException("OSRM trip optimization failed");
            }

            JsonNode trip = root.get("trips").get(0);
            double distance = trip.get("distance").asDouble();
            double duration = trip.get("duration").asDouble();

            List<double[]> coordinates = new ArrayList<>();
            for (JsonNode coord : trip.get("geometry").get("coordinates")) {
                coordinates.add(new double[]{
                    coord.get(1).asDouble(),
                    coord.get(0).asDouble()
                });
            }

            return new RouteResult(distance, duration, coordinates, new ArrayList<>());

        } catch (Exception e) {
            throw new RuntimeException("Route optimization failed: " + e.getMessage(), e);
        }
    }

    private String formatInstruction(String type, String modifier, String streetName) {
        String instruction = switch (type) {
            case "turn" -> "Turn " + modifier;
            case "new name" -> "Continue onto";
            case "depart" -> "Start";
            case "arrive" -> "Arrive at destination";
            case "merge" -> "Merge " + modifier;
            case "roundabout" -> "Take roundabout";
            case "fork" -> "Take the " + modifier + " fork";
            default -> type;
        };

        if (!streetName.isEmpty() && !"arrive".equals(type)) {
            instruction += " " + streetName;
        }

        return instruction;
    }

    // DTOs
    public record RouteResult(
        double distanceMeters,
        double durationSeconds,
        List<double[]> coordinates,
        List<String> instructions
    ) {
        public double getDistanceKm() { return distanceMeters / 1000; }
        public int getDurationMinutes() { return (int) Math.ceil(durationSeconds / 60); }
    }

    public record DistanceMatrixResult(
        double[][] distancesMeters,
        double[][] durationsSeconds
    ) {}

    public record GeocodingResult(
        double lat,
        double lon,
        String displayName
    ) {}
}
```

### 2.2 Enhanced Auto-Dispatch with Free Routing

```java
// delivery-service/src/main/java/com/MaSoVa/delivery/service/FreeAutoDispatchService.java
package com.MaSoVa.delivery.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Comparator;

@Service
public class FreeAutoDispatchService {

    private final FreeRoutingService routingService;
    private final DriverRepository driverRepository;

    public FreeAutoDispatchService(FreeRoutingService routingService,
                                    DriverRepository driverRepository) {
        this.routingService = routingService;
        this.driverRepository = driverRepository;
    }

    /**
     * Find the optimal driver for a delivery based on:
     * 1. Distance to restaurant (pickup point)
     * 2. Estimated total delivery time
     * 3. Driver availability/workload
     */
    public DriverAssignment findOptimalDriver(
            double restaurantLat, double restaurantLon,
            double customerLat, double customerLon,
            Long storeId) {

        // Get available drivers for this store
        List<Driver> availableDrivers = driverRepository
            .findByStoreIdAndStatus(storeId, DriverStatus.AVAILABLE);

        if (availableDrivers.isEmpty()) {
            throw new NoDriverAvailableException("No drivers available");
        }

        // Build location list for distance matrix
        List<double[]> locations = new ArrayList<>();
        locations.add(new double[]{restaurantLat, restaurantLon}); // index 0 = restaurant
        locations.add(new double[]{customerLat, customerLon});      // index 1 = customer

        for (Driver driver : availableDrivers) {
            locations.add(new double[]{driver.getCurrentLat(), driver.getCurrentLon()});
        }

        // Get distance matrix (single API call for all distances)
        var matrix = routingService.getDistanceMatrix(locations);

        // Calculate scores for each driver
        List<DriverScore> scores = new ArrayList<>();

        for (int i = 0; i < availableDrivers.size(); i++) {
            Driver driver = availableDrivers.get(i);
            int driverIndex = i + 2; // offset by restaurant(0) and customer(1)

            // Distance from driver to restaurant
            double toRestaurant = matrix.durationsSeconds()[driverIndex][0];

            // Distance from restaurant to customer
            double toCustomer = matrix.durationsSeconds()[0][1];

            // Total estimated time
            double totalTime = toRestaurant + toCustomer;

            // Factor in driver's current load
            int currentDeliveries = driver.getActiveDeliveryCount();
            double loadPenalty = currentDeliveries * 300; // 5 min penalty per active delivery

            double score = totalTime + loadPenalty;

            scores.add(new DriverScore(driver, score,
                matrix.distancesMeters()[driverIndex][0],
                toRestaurant,
                toCustomer));
        }

        // Find best driver (lowest score)
        DriverScore best = scores.stream()
            .min(Comparator.comparingDouble(DriverScore::score))
            .orElseThrow();

        // Get actual route for the selected driver
        var routeToRestaurant = routingService.getRoute(
            best.driver().getCurrentLat(), best.driver().getCurrentLon(),
            restaurantLat, restaurantLon
        );

        var routeToCustomer = routingService.getRoute(
            restaurantLat, restaurantLon,
            customerLat, customerLon
        );

        return new DriverAssignment(
            best.driver(),
            routeToRestaurant,
            routeToCustomer,
            (int) (best.toRestaurantSeconds() / 60),
            (int) (best.toCustomerSeconds() / 60)
        );
    }

    public record DriverScore(
        Driver driver,
        double score,
        double distanceToRestaurant,
        double toRestaurantSeconds,
        double toCustomerSeconds
    ) {}

    public record DriverAssignment(
        Driver driver,
        FreeRoutingService.RouteResult routeToRestaurant,
        FreeRoutingService.RouteResult routeToCustomer,
        int etaToRestaurantMinutes,
        int etaToCustomerMinutes
    ) {
        public int totalEtaMinutes() {
            return etaToRestaurantMinutes + etaToCustomerMinutes;
        }
    }
}
```

### 2.3 ETA Calculation Service

```java
// delivery-service/src/main/java/com/MaSoVa/delivery/service/ETAService.java
package com.MaSoVa.delivery.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class ETAService {

    private final FreeRoutingService routingService;

    // Configurable buffers for realistic ETAs
    private static final int PICKUP_BUFFER_MINUTES = 5;      // Time at restaurant
    private static final int TRAFFIC_BUFFER_PERCENT = 15;    // Rush hour buffer

    public ETAService(FreeRoutingService routingService) {
        this.routingService = routingService;
    }

    /**
     * Calculate customer ETA including:
     * - Driver to restaurant time
     * - Pickup buffer
     * - Restaurant to customer time
     * - Traffic buffer (rush hours)
     */
    public ETAResult calculateCustomerETA(
            double driverLat, double driverLon,
            double restaurantLat, double restaurantLon,
            double customerLat, double customerLon) {

        // Get routes
        var toRestaurant = routingService.getRoute(
            driverLat, driverLon, restaurantLat, restaurantLon
        );

        var toCustomer = routingService.getRoute(
            restaurantLat, restaurantLon, customerLat, customerLon
        );

        // Base time calculation
        int baseMinutes = toRestaurant.getDurationMinutes()
                        + PICKUP_BUFFER_MINUTES
                        + toCustomer.getDurationMinutes();

        // Apply traffic buffer during rush hours
        int hour = LocalDateTime.now().getHour();
        boolean isRushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);

        int adjustedMinutes = isRushHour
            ? (int) (baseMinutes * (1 + TRAFFIC_BUFFER_PERCENT / 100.0))
            : baseMinutes;

        LocalDateTime eta = LocalDateTime.now().plusMinutes(adjustedMinutes);

        return new ETAResult(
            adjustedMinutes,
            eta,
            toRestaurant.getDistanceKm() + toCustomer.getDistanceKm(),
            isRushHour
        );
    }

    /**
     * Update ETA as driver progresses
     */
    public ETAResult recalculateETA(
            double currentDriverLat, double currentDriverLon,
            double destinationLat, double destinationLon,
            DeliveryPhase phase) {

        var route = routingService.getRoute(
            currentDriverLat, currentDriverLon,
            destinationLat, destinationLon
        );

        int minutes = route.getDurationMinutes();

        // Add pickup buffer if still heading to restaurant
        if (phase == DeliveryPhase.HEADING_TO_RESTAURANT) {
            minutes += PICKUP_BUFFER_MINUTES;
        }

        return new ETAResult(
            minutes,
            LocalDateTime.now().plusMinutes(minutes),
            route.getDistanceKm(),
            false
        );
    }

    public enum DeliveryPhase {
        HEADING_TO_RESTAURANT,
        PICKED_UP,
        HEADING_TO_CUSTOMER
    }

    public record ETAResult(
        int estimatedMinutes,
        LocalDateTime estimatedArrival,
        double remainingDistanceKm,
        boolean rushHourAdjusted
    ) {}
}
```

---

## Part 3: Self-Hosting Guide (Production)

For production use, self-host these services to avoid rate limits and ensure reliability.

### 3.1 OSRM with Docker

```yaml
# docker-compose.osrm.yml
version: '3.8'
services:
  osrm-backend:
    image: osrm/osrm-backend
    container_name: osrm-backend
    ports:
      - "5000:5000"
    volumes:
      - ./osrm-data:/data
    command: osrm-routed --algorithm mld /data/india-latest.osrm

  osrm-frontend:
    image: osrm/osrm-frontend
    container_name: osrm-frontend
    ports:
      - "9966:9966"
    environment:
      - OSRM_BACKEND=http://osrm-backend:5000
```

### 3.2 Prepare OSRM Data

```bash
#!/bin/bash
# prepare-osrm.sh

# Download India OSM data (or your region)
wget https://download.geofabrik.de/asia/india-latest.osm.pbf -O osrm-data/india-latest.osm.pbf

# Extract and prepare routing data
docker run -t -v $(pwd)/osrm-data:/data osrm/osrm-backend \
    osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf

docker run -t -v $(pwd)/osrm-data:/data osrm/osrm-backend \
    osrm-partition /data/india-latest.osrm

docker run -t -v $(pwd)/osrm-data:/data osrm/osrm-backend \
    osrm-customize /data/india-latest.osrm

# Now start the routing server
docker-compose -f docker-compose.osrm.yml up -d
```

### 3.3 Self-Hosted Nominatim (Optional)

```yaml
# docker-compose.nominatim.yml
version: '3.8'
services:
  nominatim:
    image: mediagis/nominatim:4.3
    container_name: nominatim
    ports:
      - "8080:8080"
    environment:
      PBF_URL: https://download.geofabrik.de/asia/india-latest.osm.pbf
      REPLICATION_URL: https://download.geofabrik.de/asia/india-updates/
    volumes:
      - nominatim-data:/var/lib/postgresql/14/main
    shm_size: 1g

volumes:
  nominatim-data:
```

### 3.4 Tile Server (Self-Hosted Maps)

```yaml
# docker-compose.tiles.yml
version: '3.8'
services:
  tileserver:
    image: maptiler/tileserver-gl:latest
    container_name: tileserver
    ports:
      - "8081:80"
    volumes:
      - ./tiles:/data
```

---

## Part 4: Configuration

### 4.1 Backend Configuration

```yaml
# application.yml
routing:
  osrm:
    # Use public demo for development, self-hosted for production
    base-url: ${OSRM_URL:https://router.project-osrm.org}
  nominatim:
    base-url: ${NOMINATIM_URL:https://nominatim.openstreetmap.org}
    # Respect rate limits when using public instance
    rate-limit-ms: 1000

  # ETA configuration
  eta:
    pickup-buffer-minutes: 5
    traffic-buffer-percent: 15
    rush-hours:
      morning-start: 8
      morning-end: 10
      evening-start: 17
      evening-end: 20
```

### 4.2 Frontend Configuration

```typescript
// src/config/map.config.ts
export const MAP_CONFIG = {
  // Free tile providers
  tiles: {
    // Default - OpenStreetMap (free, reliable)
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

    // Alternatives (also free)
    osmHot: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    cartoDB: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    cartoDBDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',

    // Self-hosted (production)
    selfHosted: process.env.REACT_APP_TILE_SERVER_URL,
  },

  // Geocoding
  nominatim: {
    url: process.env.REACT_APP_NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
    rateLimit: 1000, // ms between requests
  },

  // Default center (configure for your region)
  defaultCenter: {
    lat: 17.3850,  // Hyderabad, India
    lng: 78.4867,
  },
  defaultZoom: 13,
};
```

---

## Part 5: Feature Comparison

| Feature | Google Maps | This Free Stack | Notes |
|---------|-------------|-----------------|-------|
| Interactive maps | ✅ | ✅ Leaflet + OSM | Fully equivalent |
| Geocoding | ✅ | ✅ Nominatim | Good for structured addresses |
| Reverse geocoding | ✅ | ✅ Nominatim | Works well |
| Routing | ✅ | ✅ OSRM | Fast, accurate |
| Distance matrix | ✅ | ✅ OSRM Table | Same functionality |
| Turn-by-turn | ✅ | ✅ OSRM | Detailed instructions |
| Route optimization | ✅ | ✅ OSRM Trip | Good for multi-stop |
| Live traffic | ✅ | ❌ | Not available (mitigate with buffers) |
| Street View | ✅ | ❌ | Use Mapillary if needed |
| Place autocomplete | ✅ | ⚠️ Nominatim | Works, less polished UI |
| Place details (ratings) | ✅ | ❌ | Need third-party data |
| **Cost** | **$$$** | **FREE** | Zero API costs |

---

## Part 6: Limitations & Mitigations

### No Real-Time Traffic
- **Impact**: ETAs may be less accurate during congestion
- **Mitigation**:
  - Add configurable traffic buffers (15-20% during rush hours)
  - Learn from historical delivery times
  - Allow manual ETA adjustments by drivers

### Geocoding Accuracy
- **Impact**: May struggle with informal addresses
- **Mitigation**:
  - Ask customers to confirm location on map
  - Save verified coordinates after first delivery
  - Allow drivers to correct addresses

### Rate Limits (Public APIs)
- **Impact**: Can't handle high request volumes
- **Mitigation**:
  - Self-host OSRM and Nominatim for production
  - Cache frequently-used routes
  - Batch geocoding requests

---

## Part 7: Cost Analysis

### Google Maps Pricing (Monthly)
| API | Free Tier | After Free Tier |
|-----|-----------|-----------------|
| Directions | 10,000 | $5 per 1,000 |
| Distance Matrix | 10,000 elements | $5 per 1,000 |
| Geocoding | 10,000 | $5 per 1,000 |
| Maps (JS) | 28,000 loads | $7 per 1,000 |

**Estimated monthly cost for active restaurant**: $200-500+

### Free Stack Costs
| Component | Cost |
|-----------|------|
| Leaflet | $0 |
| OpenStreetMap tiles | $0 |
| OSRM (self-hosted) | ~$20/month VPS |
| Nominatim (self-hosted) | Included in VPS |
| Tile server (optional) | Included in VPS |

**Total**: ~$20/month for unlimited requests

---

## Quick Start Checklist

- [ ] Install Leaflet: `npm install leaflet react-leaflet`
- [ ] Add FreeMap component to replace Google Maps
- [ ] Implement AddressAutocomplete with Nominatim
- [ ] Add FreeRoutingService to backend
- [ ] Update auto-dispatch to use OSRM
- [ ] Configure ETA buffers for traffic
- [ ] Test with real addresses in your service area
- [ ] (Production) Set up self-hosted OSRM with Docker
- [ ] (Optional) Set up self-hosted tile server

---

## Conclusion

This free mapping stack provides **95% of Google Maps functionality at $0 API cost**. The main trade-off is lack of real-time traffic data, which can be mitigated with smart ETA buffers and historical learning.

For a restaurant delivery system, this is an excellent choice that scales without per-request costs.
