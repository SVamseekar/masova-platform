package com.MaSoVa.delivery.client;

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
 * Client for communicating with Order Service
 */
@Component
public class OrderServiceClient {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceClient.class);

    private final RestTemplate restTemplate;

    public OrderServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Value("${services.order-service.url}")
    private String orderServiceUrl;

    /**
     * Get order details by ID
     */
    public Map<String, Object> getOrderDetails(String orderId) {
        String url = orderServiceUrl + "/api/orders/" + orderId;
        log.debug("Fetching order details from: {}", url);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching order details: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Update order delivery status
     */
    public void updateOrderDeliveryStatus(String orderId, String status) {
        String url = orderServiceUrl + "/api/orders/" + orderId + "/delivery-status";
        log.debug("Updating order delivery status: {} to {}", orderId, status);

        try {
            Map<String, String> request = Map.of("status", status);
            restTemplate.put(url, request);
        } catch (Exception e) {
            log.error("Error updating order delivery status: {}", e.getMessage());
        }
    }

    /**
     * Assign driver to order
     */
    public void assignDriverToOrder(String orderId, String driverId) {
        String url = orderServiceUrl + "/api/orders/" + orderId + "/assign-driver";
        log.debug("Assigning driver {} to order {}", driverId, orderId);

        try {
            Map<String, String> request = Map.of("driverId", driverId);
            restTemplate.put(url, request);
        } catch (Exception e) {
            log.error("Error assigning driver to order: {}", e.getMessage());
        }
    }
}
