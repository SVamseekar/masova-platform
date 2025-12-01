package com.MaSoVa.analytics.client;

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

/**
 * Client for communicating with User Service
 * Used for fetching staff and driver information
 */
@Component
public class UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public UserServiceClient(RestTemplate restTemplate,
                            @Value("${analytics.external-services.user-service.url}") String userServiceUrl) {
        this.restTemplate = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    /**
     * Get drivers by store
     * Note: storeId is passed via X-Store-ID header by JwtForwardingInterceptor
     */
    public List<Map<String, Object>> getDriversByStore(String storeId) {
        try {
            String url = userServiceUrl + "/api/users/drivers/store";
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to fetch drivers for store: {}", storeId, e);
            return List.of();
        }
    }

    /**
     * Get staff member details
     */
    public Map<String, Object> getStaffDetails(String staffId) {
        try {
            String url = userServiceUrl + "/api/users/" + staffId;
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            log.error("Failed to fetch staff details for: {}", staffId, e);
            return null;
        }
    }

    /**
     * Get all staff members by store
     * Note: storeId is passed via X-Store-ID header by JwtForwardingInterceptor
     */
    public List<Map<String, Object>> getStaffByStore(String storeId) {
        try {
            String url = userServiceUrl + "/api/users/store";
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to fetch staff for store: {}", storeId, e);
            return List.of();
        }
    }
}
