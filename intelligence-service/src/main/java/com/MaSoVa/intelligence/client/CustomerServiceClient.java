package com.MaSoVa.intelligence.client;

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

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Client for communicating with Customer Service
 * Week 2 Performance Fix: Added circuit breaker protection
 * Week 2/3 Fix: Added retry logic with exponential backoff
 */
@Component
public class CustomerServiceClient {

    private static final Logger log = LoggerFactory.getLogger(CustomerServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.customer.url:http://localhost:8091}")
    private String customerServiceUrl;

    public CustomerServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getAllCustomersFallback")
    public List<Map<String, Object>> getAllCustomers() {
        try {
            String url = customerServiceUrl + "/api/customers";
            log.info("Fetching all customers from: {}", url);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            return Objects.requireNonNullElse(response.getBody(), Collections.emptyList());
        } catch (Exception e) {
            log.error("Error fetching customers: {}", e.getMessage());
            throw e; // Rethrow to trigger circuit breaker
        }
    }

    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCustomerByIdFallback")
    public Map<String, Object> getCustomerById(String customerId) {
        try {
            String url = customerServiceUrl + "/api/customers/" + customerId;
            log.info("Fetching customer {} from: {}", customerId, url);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            return Objects.requireNonNullElse(response.getBody(), Collections.emptyMap());
        } catch (Exception e) {
            log.error("Error fetching customer {}: {}", customerId, e.getMessage());
            throw e; // Rethrow to trigger circuit breaker
        }
    }

    @Retry(name = "customerService")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getCustomersRegisteredAfterFallback")
    public List<Map<String, Object>> getCustomersRegisteredAfter(LocalDate date) {
        try {
            String url = customerServiceUrl + "/api/customers?registeredAfter=" + date.toString();
            log.info("Fetching customers registered after {} from: {}", date, url);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            return Objects.requireNonNullElse(response.getBody(), Collections.emptyList());
        } catch (Exception e) {
            log.error("Error fetching customers registered after {}: {}", date, e.getMessage());
            throw e; // Rethrow to trigger circuit breaker
        }
    }

    // Fallback methods
    private List<Map<String, Object>> getAllCustomersFallback(Exception ex) {
        log.warn("Circuit breaker fallback for getAllCustomers. Error: {}", ex.getMessage());
        return Collections.emptyList();
    }

    private Map<String, Object> getCustomerByIdFallback(String customerId, Exception ex) {
        log.warn("Circuit breaker fallback for getCustomerById. CustomerId: {}, Error: {}",
                customerId, ex.getMessage());
        return Collections.emptyMap();
    }

    private List<Map<String, Object>> getCustomersRegisteredAfterFallback(LocalDate date, Exception ex) {
        log.warn("Circuit breaker fallback for getCustomersRegisteredAfter. Date: {}, Error: {}",
                date, ex.getMessage());
        return Collections.emptyList();
    }
}
