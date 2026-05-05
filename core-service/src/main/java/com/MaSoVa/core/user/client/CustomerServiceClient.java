package com.MaSoVa.core.user.client;

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
 * Client for communicating with Customer Service for GDPR data export.
 * GDPR-004: Complete GDPR data export
 * Week 2 Performance Fix: Added circuit breaker protection
 */
@Component
public class CustomerServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(CustomerServiceClient.class);

    @Value("${services.customer.url:http://localhost:8085}")
    private String customerServiceUrl;

    private final RestTemplate restTemplate;

    public CustomerServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Get full customer profile (GDPR data export)
     */
    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCustomerProfileFallback")
    public Map<String, Object> getCustomerProfile(String customerId, String authToken) {
        try {
            String url = customerServiceUrl + "/api/customers/" + customerId;

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            logger.error("Error fetching customer profile {}: {}", customerId, e.getMessage());
            throw e;
        }
    }

    /**
     * Get customer loyalty information.
     * Phase 1: /api/customers/{id}/loyalty does not exist as a GET sub-resource.
     * Loyalty data is embedded in the customer profile from GET /api/customers/{id}.
     */
    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCustomerLoyaltyFallback")
    public Map<String, Object> getCustomerLoyalty(String customerId, String authToken) {
        try {
            Map<String, Object> profile = getCustomerProfile(customerId, authToken);
            Object loyalty = profile.get("loyaltyInfo");
            if (loyalty instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> loyaltyMap = (Map<String, Object>) loyalty;
                return loyaltyMap;
            }
            return Collections.emptyMap();
        } catch (Exception e) {
            logger.error("Error fetching loyalty info for customer {}: {}", customerId, e.getMessage());
            throw e;
        }
    }

    /**
     * Get customer saved addresses.
     * Phase 1: /api/customers/{id}/addresses does not exist as a GET sub-resource.
     * Addresses are embedded in the customer profile from GET /api/customers/{id}.
     */
    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCustomerAddressesFallback")
    public List<Map<String, Object>> getCustomerAddresses(String customerId, String authToken) {
        try {
            Map<String, Object> profile = getCustomerProfile(customerId, authToken);
            Object addresses = profile.get("savedAddresses");
            if (addresses instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> list = (List<Map<String, Object>>) addresses;
                return list;
            }
            return Collections.emptyList();
        } catch (Exception e) {
            logger.error("Error fetching addresses for customer {}: {}", customerId, e.getMessage());
            throw e;
        }
    }

    /**
     * Get customer communication preferences
     */
    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCommunicationPreferencesFallback")
    public Map<String, Object> getCommunicationPreferences(String customerId, String authToken) {
        try {
            String url = customerServiceUrl + "/api/customers/" + customerId + "/preferences";

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            logger.error("Error fetching preferences for customer {}: {}", customerId, e.getMessage());
            throw e;
        }
    }

    /**
     * Anonymize customer data (for GDPR erasure)
     */
    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "anonymizeCustomerDataFallback")
    public boolean anonymizeCustomerData(String customerId, String authToken) {
        try {
            // Phase 1: /api/customers/{id}/gdpr removed → PATCH /api/customers/{id} with anonymized fields
            String url = customerServiceUrl + "/api/customers/" + customerId;

            Map<String, Object> body = new java.util.HashMap<>();
            body.put("name", "ANONYMIZED");
            body.put("email", "anonymized-" + customerId + "@deleted.local");
            body.put("phone", "ANONYMIZED");

            HttpHeaders headers = createHttpHeaders(authToken);
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            restTemplate.patchForObject(url, entity, Void.class);
            return true;
        } catch (Exception e) {
            logger.error("Error anonymizing customer {}: {}", customerId, e.getMessage());
            throw e;
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

    // Fallback methods
    private Map<String, Object> getCustomerProfileFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for getCustomerProfile. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return Collections.emptyMap();
    }

    private Map<String, Object> getCustomerLoyaltyFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for getCustomerLoyalty. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return Collections.emptyMap();
    }

    private List<Map<String, Object>> getCustomerAddressesFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for getCustomerAddresses. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return Collections.emptyList();
    }

    private Map<String, Object> getCommunicationPreferencesFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for getCommunicationPreferences. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return Collections.emptyMap();
    }

    private boolean anonymizeCustomerDataFallback(String customerId, String authToken, Exception ex) {
        logger.warn("Circuit breaker fallback for anonymizeCustomerData. CustomerId: {}, Error: {}", customerId, ex.getMessage());
        return false;
    }
}
