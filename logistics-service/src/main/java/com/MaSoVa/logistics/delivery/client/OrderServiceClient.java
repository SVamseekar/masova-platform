package com.MaSoVa.logistics.delivery.client;

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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Client for communicating with Order Service
 * Week 2 Performance Fix: Added circuit breaker protection
 * Week 2/3 Fix: Added retry logic with exponential backoff
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
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrderDetailsFallback")
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
            throw e;
        }
    }

    /**
     * Update order delivery status
     * Phase 1: /api/orders/{id}/delivery-status → POST /api/orders/{id}/status (state machine)
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "updateOrderDeliveryStatusFallback")
    public void updateOrderDeliveryStatus(String orderId, String status) {
        String url = orderServiceUrl + "/api/orders/" + orderId + "/status";
        log.debug("Updating order delivery status: {} to {}", orderId, status);

        try {
            Map<String, String> request = Map.of("status", status);
            restTemplate.postForObject(url, request, Void.class);
        } catch (Exception e) {
            log.error("Error updating order delivery status: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Assign driver to order
     * Phase 1: /api/orders/{id}/assign-driver → PATCH /api/orders/{id} body={driverId}
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "assignDriverToOrderFallback")
    public void assignDriverToOrder(String orderId, String driverId) {
        String url = orderServiceUrl + "/api/orders/" + orderId;
        log.info("Assigning driver {} to order {}", driverId, orderId);

        try {
            Map<String, String> request = Map.of("driverId", driverId);
            restTemplate.patchForObject(url, request, Void.class);
            log.info("Successfully assigned driver {} to order {}", driverId, orderId);
        } catch (Exception e) {
            log.error("Error assigning driver to order: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Set delivery OTP on order (DELIV-002)
     * Phase 1: PUT /api/orders/{id}/delivery-otp → PATCH /api/orders/{id} body={otp,...}
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "setDeliveryOtpFallback")
    public void setDeliveryOtp(String orderId, String otp, LocalDateTime generatedAt, LocalDateTime expiresAt) {
        String url = orderServiceUrl + "/api/orders/" + orderId;
        log.debug("Setting delivery OTP for order {}", orderId);

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("otp", otp);
            request.put("generatedAt", generatedAt.toString());
            request.put("expiresAt", expiresAt.toString());
            restTemplate.patchForObject(url, request, Void.class);
        } catch (Exception e) {
            log.error("Error setting delivery OTP: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Set delivery proof details (DELIV-002)
     * Phase 1: PUT /api/orders/{id}/delivery-proof → PATCH /api/orders/{id} body={proofType,...}
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "setDeliveryProofFallback")
    public void setDeliveryProof(String orderId, String proofType, String photoUrl, String signatureUrl, String notes) {
        String url = orderServiceUrl + "/api/orders/" + orderId;
        log.debug("Setting delivery proof for order {} (type: {})", orderId, proofType);

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("proofType", proofType);
            if (photoUrl != null) request.put("photoUrl", photoUrl);
            if (signatureUrl != null) request.put("signatureUrl", signatureUrl);
            if (notes != null) request.put("notes", notes);
            restTemplate.patchForObject(url, request, Void.class);
        } catch (Exception e) {
            log.error("Error setting delivery proof: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Mark order as delivered (DELIV-002)
     * Phase 1: PUT /api/orders/{id}/mark-delivered → PATCH /api/orders/{id} body={deliveredAt,...}
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "markOrderDeliveredFallback")
    public void markOrderDelivered(String orderId, LocalDateTime deliveredAt, String proofType) {
        String url = orderServiceUrl + "/api/orders/" + orderId;
        log.debug("Marking order {} as delivered", orderId);

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("deliveredAt", deliveredAt.toString());
            request.put("proofType", proofType);
            restTemplate.patchForObject(url, request, Void.class);
        } catch (Exception e) {
            log.error("Error marking order as delivered: {}", e.getMessage());
            throw e;
        }
    }

    // Fallback methods
    private Map<String, Object> getOrderDetailsFallback(String orderId, Exception ex) {
        log.warn("Circuit breaker fallback for getOrderDetails. OrderId: {}, Error: {}", orderId, ex.getMessage());
        return Map.of();
    }

    private void updateOrderDeliveryStatusFallback(String orderId, String status, Exception ex) {
        log.warn("Circuit breaker fallback for updateOrderDeliveryStatus. OrderId: {}, Status: {}, Error: {}",
                orderId, status, ex.getMessage());
    }

    private void assignDriverToOrderFallback(String orderId, String driverId, Exception ex) {
        log.warn("Circuit breaker fallback for assignDriverToOrder. OrderId: {}, DriverId: {}, Error: {}",
                orderId, driverId, ex.getMessage());
    }

    private void setDeliveryOtpFallback(String orderId, String otp, LocalDateTime generatedAt, LocalDateTime expiresAt, Exception ex) {
        log.warn("Circuit breaker fallback for setDeliveryOtp. OrderId: {}, Error: {}", orderId, ex.getMessage());
    }

    private void setDeliveryProofFallback(String orderId, String proofType, String photoUrl, String signatureUrl, String notes, Exception ex) {
        log.warn("Circuit breaker fallback for setDeliveryProof. OrderId: {}, ProofType: {}, Error: {}",
                orderId, proofType, ex.getMessage());
    }

    private void markOrderDeliveredFallback(String orderId, LocalDateTime deliveredAt, String proofType, Exception ex) {
        log.warn("Circuit breaker fallback for markOrderDelivered. OrderId: {}, Error: {}", orderId, ex.getMessage());
    }
}
