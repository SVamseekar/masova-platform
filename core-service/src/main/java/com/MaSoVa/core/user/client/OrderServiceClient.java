package com.MaSoVa.core.user.client;

import com.MaSoVa.shared.http.HttpMethods;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Client for communicating with Order Service for GDPR data export.
 * GDPR-004: Complete GDPR data export
 * Week 2 Performance Fix: Added circuit breaker protection
 * Week 2/3 Fix: Added retry logic with exponential backoff
 */
@Component
public class OrderServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(OrderServiceClient.class);

    @Value("${services.order.url:http://localhost:8084}")
    private String orderServiceUrl;

    private final RestTemplate restTemplate;

    public OrderServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Get all orders for a customer (GDPR data export)
     * Phase 1: /api/orders/customer/{id} → /api/orders?customerId=
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getCustomerOrdersFallback")
    public List<Map<String, Object>> getCustomerOrders(String customerId, String authToken) {
        try {
            String url = orderServiceUrl + "/api/orders?customerId=" + customerId;

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethods.GET,
                entity,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            logger.error("Error fetching orders for customer {}: {}", customerId, e.getMessage());
            throw e;
        }
    }

    /**
     * Get order count for a customer.
     * Phase 1: no canonical /count endpoint — derive from list size to avoid dead path.
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getCustomerOrderCountFallback")
    public int getCustomerOrderCount(String customerId, String authToken) {
        List<Map<String, Object>> orders = getCustomerOrders(customerId, authToken);
        return orders.size();
    }

    /**
     * Anonymize customer data in orders (for GDPR erasure).
     * Phase 1: PUT /api/orders/customer/{id}/anonymize → POST /api/orders/gdpr/anonymize?customerId=
     * The POST /api/orders/gdpr/anonymize endpoint is internal-only (X-Internal-Service header required).
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "anonymizeCustomerDataFallback")
    public boolean anonymizeCustomerData(String customerId, String authToken) {
        try {
            String url = orderServiceUrl + "/api/orders/gdpr/anonymize?customerId=" + customerId;

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Void> response = restTemplate.exchange(
                url,
                HttpMethods.POST,
                entity,
                Void.class
            );

            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.error("Error anonymizing orders for customer {}: {}", customerId, e.getMessage());
            throw e;
        }
    }

    /**
     * Validate a public rating token and return order/customer details.
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getRatingTokenDetailsFallback")
    public Map<String, Object> getRatingTokenDetails(String token) {
        try {
            String url = orderServiceUrl + "/api/orders/rating-token/" + token;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Service", "core-service");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethods.GET,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            logger.warn("Error fetching rating token details for token {}: {}", token, e.getMessage());
            throw e;
        }
    }

    /**
     * Mark a rating token as used after a public review is submitted.
     */
    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "markRatingTokenUsedFallback")
    public void markRatingTokenUsed(String token) {
        try {
            String url = orderServiceUrl + "/api/orders/rating-token/" + token + "/mark-used";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Service", "core-service");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethods.POST, entity, Void.class);
        } catch (Exception e) {
            logger.warn("Error marking rating token as used for token {}: {}", token, e.getMessage());
            throw e;
        }
    }

    private HttpHeaders createHttpHeaders(String authToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authToken != null && !authToken.isEmpty()) {
            headers.set("Authorization", "Bearer " + authToken);
        }
        // Internal service call marker
        headers.set("X-Internal-Service", "user-service");
        return headers;
    }

    // Fallback methods
    private List<Map<String, Object>> getCustomerOrdersFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for getCustomerOrders. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return Collections.emptyList();
    }

    private int getCustomerOrderCountFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for getCustomerOrderCount. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return 0;
    }

    private boolean anonymizeCustomerDataFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for anonymizeCustomerData. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return false;
    }

    private Map<String, Object> getRatingTokenDetailsFallback(String token, Exception ex) {
        logger.warn("Circuit breaker fallback for getRatingTokenDetails. Token: {}, Error: {}", token, ex.getMessage());
        return Map.of("valid", false, "error", "Rating service temporarily unavailable");
    }

    private void markRatingTokenUsedFallback(String token, Exception ex) {
        logger.warn("Circuit breaker fallback for markRatingTokenUsed. Token: {}, Error: {}", token, ex.getMessage());
    }
}
