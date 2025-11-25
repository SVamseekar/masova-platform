package com.MaSoVa.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/**
 * Client for communicating with Menu Service
 * Used for stock availability validation and pricing validation
 */
@Component
public class MenuServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MenuServiceClient.class);

    private final RestTemplate restTemplate;
    private final String menuServiceUrl;

    public MenuServiceClient(RestTemplate restTemplate,
                            @Value("${menu.service.url:http://localhost:8082}") String menuServiceUrl) {
        this.restTemplate = restTemplate;
        this.menuServiceUrl = menuServiceUrl;
    }

    /**
     * Check if menu item is available
     */
    public boolean isMenuItemAvailable(String menuItemId) {
        try {
            String url = menuServiceUrl + "/api/menu/items/" + menuItemId;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null) {
                Boolean available = (Boolean) response.get("available");
                return available != null && available;
            }
            return false;
        } catch (RestClientException e) {
            log.error("Failed to check menu item availability: {}", menuItemId, e);
            // Fail-open: Allow order if menu service is unavailable
            return true;
        }
    }

    /**
     * Validate menu item price
     */
    public boolean validatePrice(String menuItemId, Double expectedPrice) {
        try {
            String url = menuServiceUrl + "/api/menu/items/" + menuItemId;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null) {
                Double actualPrice = ((Number) response.get("price")).doubleValue();
                // Allow small variance for floating point comparison
                return Math.abs(actualPrice - expectedPrice) < 0.01;
            }
            return false;
        } catch (RestClientException e) {
            log.error("Failed to validate menu item price: {}", menuItemId, e);
            // Fail-open: Allow order if menu service is unavailable
            return true;
        }
    }

    /**
     * Get menu item details
     */
    public Map<String, Object> getMenuItem(String menuItemId) {
        try {
            String url = menuServiceUrl + "/api/menu/items/" + menuItemId;
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            log.error("Failed to get menu item details: {}", menuItemId, e);
            return null;
        }
    }
}
