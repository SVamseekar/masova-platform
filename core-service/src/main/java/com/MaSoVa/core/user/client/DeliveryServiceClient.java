package com.MaSoVa.core.user.client;

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
     * Get all delivery tracking records for a customer (GDPR data export)
     */
    public List<Map<String, Object>> getCustomerDeliveries(String customerId, String authToken) {
        try {
            String url = deliveryServiceUrl + "/api/delivery/customer/" + customerId;

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
            logger.error("Error fetching deliveries for customer {}: {}", customerId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Anonymize customer data in delivery records (for GDPR erasure)
     */
    public boolean anonymizeCustomerData(String customerId, String authToken) {
        try {
            String url = deliveryServiceUrl + "/api/delivery/customer/" + customerId + "/anonymize";

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
            logger.error("Error anonymizing deliveries for customer {}: {}", customerId, e.getMessage());
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
