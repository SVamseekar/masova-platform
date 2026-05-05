package com.MaSoVa.payment.service;

import com.MaSoVa.payment.dto.UpdateOrderPaymentRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Client for communicating with Order Service
 * Week 2 Performance Fix: Added circuit breaker protection
 * Week 2/3 Fix: Added retry logic with exponential backoff
 */
@Service
public class OrderServiceClient {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.order-service.url:http://localhost:8084}")
    private String orderServiceUrl;

    public OrderServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Update order payment status
     * Enterprise-grade implementation with proper DTO and error handling
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "updateOrderPaymentStatusFallback")
    public void updateOrderPaymentStatus(String orderId, String status, String transactionId) {
        try {
            String url = orderServiceUrl + "/api/orders/" + orderId + "/payment";

            // Use proper DTO instead of Map for type safety
            UpdateOrderPaymentRequest request = new UpdateOrderPaymentRequest(status, transactionId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<UpdateOrderPaymentRequest> entity = new HttpEntity<>(request, headers);

            log.info("Sending payment status update to order-service. Order: {}, Status: {}, Transaction: {}",
                     orderId, status, transactionId);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PATCH,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully updated payment status for order: {} to {}", orderId, status);
            } else {
                log.error("Failed to update payment status for order: {}. HTTP Status: {}",
                         orderId, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating order payment status for order: {}. Status: {}, Transaction: {}",
                     orderId, status, transactionId, e);
            throw e;
        }
    }

    /**
     * Get order details
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrderDetailsFallback")
    public Map<String, Object> getOrderDetails(String orderId) {
        try {
            String url = orderServiceUrl + "/api/orders/" + orderId;

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully retrieved order details for: {}", orderId);
                return (Map<String, Object>) response.getBody();
            } else {
                log.error("Failed to retrieve order details for: {}. Status: {}",
                         orderId, response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            log.error("Error retrieving order details for: {}", orderId, e);
            throw e;
        }
    }

    // Fallback methods
    private void updateOrderPaymentStatusFallback(String orderId, String status, String transactionId, Exception ex) {
        log.warn("Circuit breaker fallback for updateOrderPaymentStatus. Order: {}, Status: {}, Transaction: {}, Error: {}",
                orderId, status, transactionId, ex.getMessage());
        // Don't throw exception - payment succeeded even if order update failed
        // This should be handled asynchronously or with retry logic
        // In production, this would trigger a compensating transaction or alert
    }

    private Map<String, Object> getOrderDetailsFallback(String orderId, Exception ex) {
        log.warn("Circuit breaker fallback for getOrderDetails. OrderId: {}, Error: {}", orderId, ex.getMessage());
        return null;
    }
}
