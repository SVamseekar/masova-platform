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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Client for communicating with Order Service
 * Week 2 Performance Fix: Added circuit breaker protection
 * Week 2/3 Fix: Added retry logic with exponential backoff
 */
@Component
public class OrderServiceClient {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceClient.class);

    private final RestTemplate restTemplate;
    private final String orderServiceUrl;

    public OrderServiceClient(RestTemplate restTemplate,
                             @Value("${intelligence.external-services.order-service.url}") String orderServiceUrl) {
        this.restTemplate = restTemplate;
        this.orderServiceUrl = orderServiceUrl;
    }

    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrdersByDateFallback")
    public List<Map<String, Object>> getOrdersByDate(LocalDate date) {
        try {
            String url = orderServiceUrl + "/api/orders?date=" + date;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return Objects.requireNonNullElse(response.getBody(), List.of());
        } catch (RestClientException e) {
            log.error("Failed to fetch orders for date: {}", date, e);
            throw e;
        }
    }

    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrdersByDateRangeFallback")
    public List<Map<String, Object>> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            String url = orderServiceUrl + "/api/orders?startDate=" + startDate + "&endDate=" + endDate;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return Objects.requireNonNullElse(response.getBody(), List.of());
        } catch (RestClientException e) {
            log.error("Failed to fetch orders for date range: {} to {}", startDate, endDate, e);
            throw e;
        }
    }

    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrdersByStaffFallback")
    public List<Map<String, Object>> getOrdersByStaff(String staffId, LocalDate date) {
        try {
            // Phase 1: /api/orders/staff/{id}/date/{date} → /api/orders/analytics?type=kitchen&staffId=&date=
            String url = orderServiceUrl + "/api/orders/analytics?type=kitchen&staffId=" + staffId + "&date=" + date;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return Objects.requireNonNullElse(response.getBody(), List.of());
        } catch (RestClientException e) {
            log.error("Failed to fetch orders for staff: {} on date: {}", staffId, date, e);
            throw e;
        }
    }

    @Retry(name = "orderService")
    @CircuitBreaker(name = "orderService", fallbackMethod = "getActiveDeliveryCountFallback")
    public Integer getActiveDeliveryCount() {
        try {
            // Phase 1: /api/orders/active-deliveries/count → /api/orders/analytics?type=active-deliveries
            String url = orderServiceUrl + "/api/orders/analytics?type=active-deliveries";
            return restTemplate.getForObject(url, Integer.class);
        } catch (RestClientException e) {
            log.error("Failed to fetch active delivery count", e);
            throw e;
        }
    }

    // Fallback methods
    private List<Map<String, Object>> getOrdersByDateFallback(LocalDate date, Exception ex) {
        log.warn("Circuit breaker fallback for getOrdersByDate. Date: {}, Error: {}", date, ex.getMessage());
        return List.of();
    }

    private List<Map<String, Object>> getOrdersByDateRangeFallback(LocalDateTime startDate, LocalDateTime endDate, Exception ex) {
        log.warn("Circuit breaker fallback for getOrdersByDateRange. Start: {}, End: {}, Error: {}",
                startDate, endDate, ex.getMessage());
        return List.of();
    }

    private List<Map<String, Object>> getOrdersByStaffFallback(String staffId, LocalDate date, Exception ex) {
        log.warn("Circuit breaker fallback for getOrdersByStaff. StaffId: {}, Date: {}, Error: {}",
                staffId, date, ex.getMessage());
        return List.of();
    }

    private Integer getActiveDeliveryCountFallback(Exception ex) {
        log.warn("Circuit breaker fallback for getActiveDeliveryCount. Error: {}", ex.getMessage());
        return 0;
    }
}
