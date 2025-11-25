package com.MaSoVa.analytics.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Component
@Slf4j
@RequiredArgsConstructor
public class CustomerServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.customer.url:http://localhost:8083}")
    private String customerServiceUrl;

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

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching customers: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

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

            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching customer {}: {}", customerId, e.getMessage());
            return Collections.emptyMap();
        }
    }

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

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching customers registered after {}: {}", date, e.getMessage());
            return Collections.emptyList();
        }
    }
}
