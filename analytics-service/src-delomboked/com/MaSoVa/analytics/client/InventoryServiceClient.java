package com.MaSoVa.analytics.client;

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

@Component
public class InventoryServiceClient {

    private static final Logger log = LoggerFactory.getLogger(InventoryServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.inventory.url:http://localhost:8084}")
    private String inventoryServiceUrl;

    public InventoryServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

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

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching inventory items: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

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

            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching inventory item {}: {}", itemId, e.getMessage());
            return Collections.emptyMap();
        }
    }

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

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching low stock items: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
