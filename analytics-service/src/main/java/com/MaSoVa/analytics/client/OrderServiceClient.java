package com.MaSoVa.analytics.client;

import lombok.extern.slf4j.Slf4j;
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

/**
 * Client for communicating with Order Service
 * Used for fetching order data for analytics
 */
@Component
@Slf4j
public class OrderServiceClient {

    private final RestTemplate restTemplate;
    private final String orderServiceUrl;

    public OrderServiceClient(RestTemplate restTemplate,
                             @Value("${analytics.external-services.order-service.url}") String orderServiceUrl) {
        this.restTemplate = restTemplate;
        this.orderServiceUrl = orderServiceUrl;
    }

    /**
     * Get all orders for a specific date
     */
    public List<Map<String, Object>> getOrdersByDate(LocalDate date) {
        try {
            String url = orderServiceUrl + "/api/orders/date/" + date;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to fetch orders for date: {}", date, e);
            return List.of();
        }
    }

    /**
     * Get orders within a date range
     */
    public List<Map<String, Object>> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            String url = orderServiceUrl + "/api/orders/range?start=" + startDate + "&end=" + endDate;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to fetch orders for date range: {} to {}", startDate, endDate, e);
            return List.of();
        }
    }

    /**
     * Get orders processed by a specific staff member
     */
    public List<Map<String, Object>> getOrdersByStaff(String staffId, LocalDate date) {
        try {
            String url = orderServiceUrl + "/api/orders/staff/" + staffId + "/date/" + date;
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Failed to fetch orders for staff: {} on date: {}", staffId, date, e);
            return List.of();
        }
    }

    /**
     * Get active delivery count
     */
    public Integer getActiveDeliveryCount() {
        try {
            String url = orderServiceUrl + "/api/orders/active-deliveries/count";
            return restTemplate.getForObject(url, Integer.class);
        } catch (RestClientException e) {
            log.error("Failed to fetch active delivery count", e);
            return 0;
        }
    }
}
