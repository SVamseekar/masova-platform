package com.MaSoVa.order.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
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
 * PROD-001: Circuit breaker protection added
 * Week 2/3 Fix: Added retry logic with exponential backoff
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
     * PROD-001: Circuit breaker with fail-open fallback
     */
    @Retry(name = "menuService")
    @CircuitBreaker(name = "menuService", fallbackMethod = "isMenuItemAvailableFallback")
    @SuppressWarnings("unchecked")
    public boolean isMenuItemAvailable(String menuItemId) {
        try {
            String url = menuServiceUrl + "/api/menu/public/" + menuItemId;
            Map<String, Object> response = (Map<String, Object>) restTemplate.getForObject(url, Map.class);

            if (response != null) {
                Boolean available = (Boolean) response.get("isAvailable");
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
    @SuppressWarnings("unchecked")
    public boolean validatePrice(String menuItemId, Double expectedPrice) {
        try {
            String url = menuServiceUrl + "/api/menu/public/" + menuItemId;
            Map<String, Object> response = (Map<String, Object>) restTemplate.getForObject(url, Map.class);

            if (response != null) {
                // basePrice is in paise, convert to rupees for comparison
                Long basePrice = ((Number) response.get("basePrice")).longValue();
                Double actualPrice = basePrice / 100.0;
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
     * Fallback method for isMenuItemAvailable
     * PROD-001: Fail-open strategy - allow order to proceed
     */
    private boolean isMenuItemAvailableFallback(String menuItemId, Exception ex) {
        log.warn("Circuit breaker fallback for menu availability check. MenuItemId: {}, Error: {}",
                menuItemId, ex.getMessage());
        // Fail-open: Allow order if menu service is unavailable
        return true;
    }

    /**
     * Get menu item details
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getMenuItem(String menuItemId) {
        try {
            String url = menuServiceUrl + "/api/menu/public/" + menuItemId;
            return (Map<String, Object>) restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            log.error("Failed to get menu item details: {}", menuItemId, e);
            return null;
        }
    }
}
