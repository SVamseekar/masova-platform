package com.MaSoVa.core.user.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Client for communicating with Delivery Service for GDPR data export.
 * GDPR-004: Complete GDPR data export
 */
@Component
public class DeliveryServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryServiceClient.class);

    @Value("${services.delivery.url:http://localhost:8086}")
    private String deliveryServiceUrl;

    private final RestTemplate restTemplate;

    public DeliveryServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Get all delivery tracking records for a customer (GDPR data export).
     * Phase 1: DeliveryController has no per-customer delivery query endpoint.
     * DeliveryTracking is indexed by orderId/driverId, not customerId.
     * Returns empty list — Phase 3 will add GET /api/delivery?customerId= when needed.
     */
    @CircuitBreaker(name = "deliveryService", fallbackMethod = "getCustomerDeliveriesFallback")
    public List<Map<String, Object>> getCustomerDeliveries(String customerId, String authToken) {
        // Phase 1: no canonical endpoint — DeliveryTracking stores no customer PII.
        // Delivery records are linked via orderId; GDPR export covers this through order history.
        logger.warn("getCustomerDeliveries: no Phase 1 endpoint for customerId={}; returning empty", customerId);
        return Collections.emptyList();
    }

    /**
     * Anonymize customer data in delivery tracking records (for GDPR erasure).
     * Phase 1: POST /api/delivery/gdpr/anonymize?customerId= (internal-only, X-Internal-Service required).
     * DeliveryTracking stores no customer PII — endpoint is a confirmed no-op.
     */
    public boolean anonymizeCustomerData(String customerId, String authToken) {
        try {
            String url = deliveryServiceUrl + "/api/delivery/gdpr/anonymize?customerId=" + customerId;

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Void> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Void.class
            );

            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.error("Error anonymizing deliveries for customer {}: {}", customerId, e.getMessage());
            return false;
        }
    }

    public List<Map<String, Object>> getCustomerDeliveriesFallback(String customerId, String authToken, Exception e) {
        logger.warn("delivery-service circuit open for customer {} GDPR export: {}", customerId, e.getMessage());
        return Collections.emptyList();
    }

    private HttpHeaders createHttpHeaders(String authToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authToken != null && !authToken.isEmpty()) {
            headers.set("Authorization", "Bearer " + authToken);
        }
        headers.set("X-Internal-Service", "user-service");
        return headers;
    }
}
