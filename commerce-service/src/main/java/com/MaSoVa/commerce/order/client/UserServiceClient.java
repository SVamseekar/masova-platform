package com.MaSoVa.commerce.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Client for communicating with User Service
 * Used to fetch driver details when assigning drivers to orders
 */
@Component
public class UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    private final RestTemplate restTemplate;

    public UserServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Value("${services.user.url:http://localhost:8081}")
    private String userServiceUrl;

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
            log.error("Error fetching driver details for driver {}: {}", driverId, e.getMessage());
            return Map.of();
        }
    }
}
