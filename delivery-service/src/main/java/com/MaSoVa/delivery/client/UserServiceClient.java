package com.MaSoVa.delivery.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.user-service.url}")
    private String userServiceUrl;

    /**
     * Get all available drivers for a store
     */
    public List<Map<String, Object>> getAvailableDrivers(String storeId) {
        String url = userServiceUrl + "/api/users/drivers/available?storeId=" + storeId;
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
     * Get driver's last known GPS location
     */
    public Map<String, Object> getDriverLastLocation(String driverId) {
        String url = userServiceUrl + "/api/users/drivers/" + driverId + "/location";
        log.debug("Fetching driver location from: {}", url);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching driver location: {}", e.getMessage());
            return Map.of();
        }
    }
}
