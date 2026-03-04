package com.MaSoVa.core.user.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

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
 * Client for communicating with Payment Service for GDPR data export.
 * GDPR-004: Complete GDPR data export
 */
@Component
public class PaymentServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(PaymentServiceClient.class);

    @Value("${services.payment.url:http://localhost:8089}")
    private String paymentServiceUrl;

    private final RestTemplate restTemplate;

    public PaymentServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Get all transactions for a customer (GDPR data export)
     */
    @CircuitBreaker(name = "paymentService", fallbackMethod = "getCustomerTransactionsFallback")
    public List<Map<String, Object>> getCustomerTransactions(String customerId, String authToken) {
        try {
            // Phase 1: /api/payments/customer/{id} → /api/payments?customerId=
            String url = paymentServiceUrl + "/api/payments?customerId=" + customerId;

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            logger.error("Error fetching transactions for customer {}: {}", customerId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Get payment methods saved by customer.
     * Phase 1: /api/payments/customer/{id}/methods removed — PaymentController has no methods endpoint.
     * Saved payment methods are derived from transaction history via GET /api/payments?customerId=.
     * Returns empty list for GDPR export; Phase 3 may add a dedicated endpoint if needed.
     */
    public List<Map<String, Object>> getCustomerPaymentMethods(String customerId, String authToken) {
        // Phase 1: no canonical payment methods endpoint — payment methods are not stored separately.
        logger.warn("getCustomerPaymentMethods: no Phase 1 endpoint for customerId={}; returning empty", customerId);
        return Collections.emptyList();
    }

    /**
     * Anonymize customer data in payments (for GDPR erasure).
     * Phase 1: POST /api/payments/gdpr/anonymize?customerId= (internal-only, X-Internal-Service required).
     */
    public boolean anonymizeCustomerData(String customerId, String authToken) {
        try {
            String url = paymentServiceUrl + "/api/payments/gdpr/anonymize?customerId=" + customerId;

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
            logger.error("Error anonymizing payments for customer {}: {}", customerId, e.getMessage());
            return false;
        }
    }

    public List<Map<String, Object>> getCustomerTransactionsFallback(String customerId, String authToken, Exception e) {
        logger.warn("payment-service circuit open for customer {} GDPR export: {}", customerId, e.getMessage());
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
