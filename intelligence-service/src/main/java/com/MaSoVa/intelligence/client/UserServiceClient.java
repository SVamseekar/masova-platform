package com.MaSoVa.intelligence.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Client for communicating with User Service
 * Used for fetching staff and driver information
 * Week 2 Performance Fix: Added circuit breaker protection
 * Week 2/3 Fix: Added retry logic with exponential backoff
 */
@Component
public class UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public UserServiceClient(RestTemplate restTemplate,
                            @Value("${intelligence.external-services.user-service.url}") String userServiceUrl) {
        this.restTemplate = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    /**
     * Get drivers by store
     * Note: storeId is passed via X-Store-ID header by JwtForwardingInterceptor
     */
    @Retry(name = "userService")
    @CircuitBreaker(name = "userService", fallbackMethod = "getDriversByStoreFallback")
    public List<Map<String, Object>> getDriversByStore(String storeId) {
        try {
            // Phase 1: /api/users/drivers/store → /api/users?type=DRIVER&storeId=
            String url = userServiceUrl + "/api/users?type=DRIVER&storeId=" + storeId;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return Objects.requireNonNullElse(response.getBody(), List.of());
        } catch (RestClientException e) {
            log.error("Failed to fetch drivers for store: {}", storeId, e);
            throw e;
        }
    }

    /**
     * Get staff member details
     */
    @SuppressWarnings("unchecked")
    @Retry(name = "userService")
    @CircuitBreaker(name = "userService", fallbackMethod = "getStaffDetailsFallback")
    public Map<String, Object> getStaffDetails(String staffId) {
        try {
            String url = userServiceUrl + "/api/users/" + staffId;
            Map<String, Object> result = restTemplate.getForObject(url, Map.class);
            return Objects.requireNonNullElse(result, Map.of());
        } catch (RestClientException e) {
            log.error("Failed to fetch staff details for: {}", staffId, e);
            throw e;
        }
    }

    /**
     * Get all staff members by store
     * Note: storeId is passed via X-Store-ID header by JwtForwardingInterceptor
     */
    @Retry(name = "userService")
    @CircuitBreaker(name = "userService", fallbackMethod = "getStaffByStoreFallback")
    public List<Map<String, Object>> getStaffByStore(String storeId) {
        try {
            // Phase 1: /api/users/store → /api/users?storeId=
            String url = userServiceUrl + "/api/users?storeId=" + storeId;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return Objects.requireNonNullElse(response.getBody(), List.of());
        } catch (RestClientException e) {
            log.error("Failed to fetch staff for store: {}", storeId, e);
            throw e;
        }
    }

    // Fallback methods
    private List<Map<String, Object>> getDriversByStoreFallback(String storeId, Exception ex) {
        log.warn("Circuit breaker fallback for getDriversByStore. StoreId: {}, Error: {}", storeId, ex.getMessage());
        return List.of();
    }

    private Map<String, Object> getStaffDetailsFallback(String staffId, Exception ex) {
        log.warn("Circuit breaker fallback for getStaffDetails. StaffId: {}, Error: {}", staffId, ex.getMessage());
        return Map.of();
    }

    private List<Map<String, Object>> getStaffByStoreFallback(String storeId, Exception ex) {
        log.warn("Circuit breaker fallback for getStaffByStore. StoreId: {}, Error: {}", storeId, ex.getMessage());
        return List.of();
    }
}
