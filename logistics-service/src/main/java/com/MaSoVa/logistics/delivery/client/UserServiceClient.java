package com.MaSoVa.logistics.delivery.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Client for communicating with User Service
 */
@Component
public class UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    private final RestTemplate restTemplate;

    public UserServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Value("${services.user-service.url:http://localhost:8085}")
    private String userServiceUrl;

    /**
     * Get all available drivers for a store
     */
    @CircuitBreaker(name = "userService", fallbackMethod = "getAvailableDriversFallback")
    public List<Map<String, Object>> getAvailableDrivers(String storeId) {
        // Phase 1: canonical path — /api/users/drivers/available collapsed into /api/users?type=DRIVER&available=true
        String url = userServiceUrl + "/api/users?type=DRIVER&available=true&storeId=" + storeId;
        log.debug("Fetching available drivers from: {}", url);

        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching available drivers: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Get driver details by ID
     */
    @CircuitBreaker(name = "userService", fallbackMethod = "getDriverDetailsFallback")
    public Map<String, Object> getDriverDetails(String driverId) {
        String url = userServiceUrl + "/api/users/" + driverId;
        log.debug("Fetching driver details from: {}", url);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching driver details: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Get driver's last known GPS location.
     * Phase 1: /api/users/drivers/{id}/location removed — real-time location will be
     * served from the WebSocket/Redis cache introduced in Phase 3.
     * Returns empty map (fail-open) until Phase 3 wires this up.
     */
    @CircuitBreaker(name = "userService", fallbackMethod = "getDriverLastLocationFallback")
    public Map<String, Object> getDriverLastLocation(String driverId) {
        log.warn("getDriverLastLocation({}) — endpoint removed in Phase 1, Phase 3 will implement WS location cache", driverId);
        return Map.of();
    }

    public Map<String, Object> getDriverLastLocationFallback(String driverId, Exception e) {
        log.warn("user-service circuit open for driver location ({}): {}", driverId, e.getMessage());
        return Map.of();
    }

    /**
     * Update driver online/offline status
     * Phase 8: Driver status persistence
     */
    public void updateDriverStatus(String driverId, String status) {
        String url = userServiceUrl + "/api/users/" + driverId + "/status";
        log.info("Updating driver {} status to: {}", driverId, status);

        try {
            Map<String, String> request = Map.of("status", status);
            // Phase 1: /{userId}/status is now PATCH, not PUT
            restTemplate.patchForObject(url, request, Void.class);
            log.info("Driver status updated successfully");
        } catch (Exception e) {
            log.error("Error updating driver status: {}", e.getMessage());
            throw new RuntimeException("Failed to update driver status: " + e.getMessage());
        }
    }

    /**
     * Get driver's current online/offline status
     * Phase 8: Driver status persistence
     */
    public String getDriverStatus(String driverId) {
        String url = userServiceUrl + "/api/users/" + driverId + "/status";
        log.debug("Fetching driver status from: {}", url);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> body = response.getBody();
            return body != null ? (String) body.get("status") : "OFF_DUTY";
        } catch (Exception e) {
            log.error("Error fetching driver status: {}", e.getMessage());
            return "OFF_DUTY"; // Default to offline on error
        }
    }

    /**
     * Get employee's working session status.
     * GET /api/sessions?employeeId= returns List<WorkingSessionResponse>.
     * We return a summary map {active, sessionId} derived from the list.
     */
    public Map<String, Object> getEmployeeWorkingStatus(String employeeId) {
        String url = userServiceUrl + "/api/sessions?employeeId=" + employeeId;
        log.debug("Fetching employee working status from: {}", url);

        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            List<Map<String, Object>> sessions = response.getBody();
            if (sessions == null || sessions.isEmpty()) {
                return Map.of("active", false);
            }
            // Return the most recent session's data (list is ordered by date desc)
            Map<String, Object> latest = sessions.get(0);
            Boolean active = (Boolean) latest.getOrDefault("active", false);
            return Map.of("active", Boolean.TRUE.equals(active), "sessionId", latest.getOrDefault("id", ""));
        } catch (Exception e) {
            log.error("Error fetching employee working status for {}: {}", employeeId, e.getMessage());
            throw new RuntimeException("Failed to check working session: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getAvailableDriversFallback(String storeId, Exception e) {
        log.warn("user-service circuit open for available drivers (store {}): {}", storeId, e.getMessage());
        return List.of();
    }

    public Map<String, Object> getDriverDetailsFallback(String driverId, Exception e) {
        log.warn("user-service circuit open for driver {}: {}", driverId, e.getMessage());
        return Map.of();
    }
}
