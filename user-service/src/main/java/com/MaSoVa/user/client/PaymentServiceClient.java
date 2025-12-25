package com.MaSoVa.user.client;

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

    @Value("${services.payment.url:http://localhost:8086}")
    private String paymentServiceUrl;

    private final RestTemplate restTemplate;

    public PaymentServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Get all transactions for a customer (GDPR data export)
     */
    public List<Map<String, Object>> getCustomerTransactions(String customerId, String authToken) {
        try {
            String url = paymentServiceUrl + "/api/payments/customer/" + customerId;

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
     * Get payment methods saved by customer
     */
    public List<Map<String, Object>> getCustomerPaymentMethods(String customerId, String authToken) {
        try {
            String url = paymentServiceUrl + "/api/payments/customer/" + customerId + "/methods";

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
            logger.error("Error fetching payment methods for customer {}: {}", customerId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Anonymize customer data in payments (for GDPR erasure)
     */
    public boolean anonymizeCustomerData(String customerId, String authToken) {
        try {
            String url = paymentServiceUrl + "/api/payments/customer/" + customerId + "/anonymize";

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Void> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                Void.class
            );

            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.error("Error anonymizing payments for customer {}: {}", customerId, e.getMessage());
            return false;
        }
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
