package com.MaSoVa.logistics.delivery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Free routing service using OSRM (Open Source Routing Machine) and Nominatim
 * No API keys required - 100% free and open source
 *
 * Features:
 * - Turn-by-turn routing
 * - Distance matrix calculations
 * - Geocoding / Reverse geocoding
 * - Multi-stop optimization
 */
@Service
public class FreeRoutingService {

    private static final Logger log = LoggerFactory.getLogger(FreeRoutingService.class);

    // OSRM Demo Server (FREE) - For production, self-host OSRM
    @Value("${routing.osrm.base-url:https://router.project-osrm.org}")
    private String osrmBaseUrl;

    // Nominatim (FREE) - Respect usage policy: max 1 req/sec
    @Value("${routing.nominatim.base-url:https://nominatim.openstreetmap.org}")
    private String nominatimBaseUrl;

    @Value("${routing.nominatim.rate-limit-ms:1000}")
    private long nominatimRateLimitMs;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Rate limiting for Nominatim
    private long lastNominatimRequestTime = 0;

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
                osrmBaseUrl, startLon, startLat, endLon, endLat
            );

            log.debug("OSRM route request: ({},{}) -> ({},{})", startLat, startLon, endLat, endLon);

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            if (!"Ok".equals(root.get("code").asText())) {
                throw new RuntimeException("OSRM routing failed: " + root.get("message").asText());
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

            log.info("✅ Route calculated: {:.2f}km, {:.1f}min", distance / 1000, duration / 60);

            return new RouteResult(distance, duration, coordinates, instructions);

        } catch (Exception e) {
            log.error("❌ Failed to get route: {}", e.getMessage());
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
                osrmBaseUrl, coords
            );

            log.debug("OSRM distance matrix request for {} locations", locations.size());

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

            log.info("✅ Distance matrix calculated for {} locations", locations.size());

            return new DistanceMatrixResult(distances, durations);

        } catch (Exception e) {
            log.error("❌ Failed to get distance matrix: {}", e.getMessage());
            throw new RuntimeException("Failed to get distance matrix: " + e.getMessage(), e);
        }
    }

    /**
     * Geocode an address to coordinates using Nominatim
     */
    public GeocodingResult geocode(String address) {
        try {
            // Respect rate limiting
            waitForNominatimRateLimit();

            String url = String.format(
                "%s/search?format=json&q=%s&limit=1&addressdetails=1",
                nominatimBaseUrl,
                java.net.URLEncoder.encode(address, "UTF-8")
            );

            log.debug("Nominatim geocode request: {}", address);

            String response = restTemplate.getForObject(url, String.class);
            JsonNode results = objectMapper.readTree(response);

            if (results.isEmpty()) {
                throw new RuntimeException("Address not found: " + address);
            }

            JsonNode result = results.get(0);
            GeocodingResult geocodingResult = new GeocodingResult(
                result.get("lat").asDouble(),
                result.get("lon").asDouble(),
                result.get("display_name").asText()
            );

            log.info("✅ Geocoded: {} -> ({}, {})", address, geocodingResult.lat, geocodingResult.lon);

            return geocodingResult;

        } catch (Exception e) {
            log.error("❌ Geocoding failed: {}", e.getMessage());
            throw new RuntimeException("Geocoding failed: " + e.getMessage(), e);
        }
    }

    /**
     * Reverse geocode coordinates to address
     */
    public String reverseGeocode(double lat, double lon) {
        try {
            // Respect rate limiting
            waitForNominatimRateLimit();

            String url = String.format(
                "%s/reverse?format=json&lat=%f&lon=%f",
                nominatimBaseUrl, lat, lon
            );

            log.debug("Nominatim reverse geocode request: ({}, {})", lat, lon);

            String response = restTemplate.getForObject(url, String.class);
            JsonNode result = objectMapper.readTree(response);

            String displayName = result.get("display_name").asText();

            log.info("✅ Reverse geocoded: ({}, {}) -> {}", lat, lon, displayName);

            return displayName;

        } catch (Exception e) {
            log.error("❌ Reverse geocoding failed: {}", e.getMessage());
            throw new RuntimeException("Reverse geocoding failed: " + e.getMessage(), e);
        }
    }

    /**
     * Respect Nominatim rate limiting (1 request per second)
     */
    private synchronized void waitForNominatimRateLimit() throws InterruptedException {
        long now = System.currentTimeMillis();
        long timeSinceLastRequest = now - lastNominatimRequestTime;

        if (timeSinceLastRequest < nominatimRateLimitMs) {
            long waitTime = nominatimRateLimitMs - timeSinceLastRequest;
            log.debug("Rate limiting: waiting {}ms", waitTime);
            Thread.sleep(waitTime);
        }

        lastNominatimRequestTime = System.currentTimeMillis();
    }

    /**
     * Format routing instructions for human readability
     */
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
