package com.MaSoVa.user.client;

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

    @Value("${services.customer.url:http://localhost:8091}")
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
     * Get customer loyalty information
     */
    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCustomerLoyaltyFallback")
    public Map<String, Object> getCustomerLoyalty(String customerId, String authToken) {
        try {
            String url = customerServiceUrl + "/api/customers/" + customerId + "/loyalty";

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
            logger.error("Error fetching loyalty info for customer {}: {}", customerId, e.getMessage());
            throw e;
        }
    }

    /**
     * Get customer saved addresses
     */
    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCustomerAddressesFallback")
    public List<Map<String, Object>> getCustomerAddresses(String customerId, String authToken) {
        try {
            String url = customerServiceUrl + "/api/customers/" + customerId + "/addresses";

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
            String url = customerServiceUrl + "/api/customers/" + customerId + "/gdpr";

            HttpHeaders headers = createHttpHeaders(authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Void> response = restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                entity,
                Void.class
            );

            return response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.NO_CONTENT;
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
