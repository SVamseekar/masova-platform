package com.MaSoVa.analytics.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Client for communicating with Inventory Service
 * Week 2 Performance Fix: Added circuit breaker protection
 * Week 2/3 Fix: Added retry logic with exponential backoff
 */
@Component
public class InventoryServiceClient {

    private static final Logger log = LoggerFactory.getLogger(InventoryServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.inventory.url:http://localhost:8084}")
    private String inventoryServiceUrl;

    public InventoryServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Retry(name = "inventoryService")
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "getAllInventoryItemsFallback")
    public List<Map<String, Object>> getAllInventoryItems() {
        try {
            String url = inventoryServiceUrl + "/api/inventory";
            log.info("Fetching all inventory items from: {}", url);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            return Objects.requireNonNullElse(response.getBody(), Collections.emptyList());
        } catch (Exception e) {
            log.error("Error fetching inventory items: {}", e.getMessage());
            throw e;
        }
    }

    @Retry(name = "inventoryService")
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "getInventoryItemFallback")
    public Map<String, Object> getInventoryItem(String itemId) {
        try {
            String url = inventoryServiceUrl + "/api/inventory/" + itemId;
            log.info("Fetching inventory item {} from: {}", itemId, url);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            return Objects.requireNonNullElse(response.getBody(), Collections.emptyMap());
        } catch (Exception e) {
            log.error("Error fetching inventory item {}: {}", itemId, e.getMessage());
            throw e;
        }
    }

    @Retry(name = "inventoryService")
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "getLowStockItemsFallback")
    public List<Map<String, Object>> getLowStockItems() {
        try {
            String url = inventoryServiceUrl + "/api/inventory/low-stock";
            log.info("Fetching low stock items from: {}", url);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            return Objects.requireNonNullElse(response.getBody(), Collections.emptyList());
        } catch (Exception e) {
            log.error("Error fetching low stock items: {}", e.getMessage());
            throw e;
        }
    }

    // Fallback methods
    private List<Map<String, Object>> getAllInventoryItemsFallback(Exception ex) {
        log.warn("Circuit breaker fallback for getAllInventoryItems. Error: {}", ex.getMessage());
        return Collections.emptyList();
    }

    private Map<String, Object> getInventoryItemFallback(String itemId, Exception ex) {
        log.warn("Circuit breaker fallback for getInventoryItem. ItemId: {}, Error: {}", itemId, ex.getMessage());
        return Collections.emptyMap();
    }

    private List<Map<String, Object>> getLowStockItemsFallback(Exception ex) {
        log.warn("Circuit breaker fallback for getLowStockItems. Error: {}", ex.getMessage());
        return Collections.emptyList();
    }
}
