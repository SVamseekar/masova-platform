package com.MaSoVa.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.order-service.url}")
    private String orderServiceUrl;

    /**
     * Update order payment status
     */
    public void updateOrderPaymentStatus(String orderId, String status, String transactionId) {
        try {
            String url = orderServiceUrl + "/api/orders/" + orderId + "/payment";

            Map<String, String> request = new HashMap<>();
            request.put("paymentStatus", status);
            request.put("transactionId", transactionId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PATCH,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully updated payment status for order: {}", orderId);
            } else {
                log.error("Failed to update payment status for order: {}. Status: {}",
                         orderId, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating order payment status for order: {}", orderId, e);
            // Don't throw exception - payment succeeded even if order update failed
            // This should be handled asynchronously or with retry logic
        }
    }

    /**
     * Get order details
     */
    public Map<String, Object> getOrderDetails(String orderId) {
        try {
            String url = orderServiceUrl + "/api/orders/" + orderId;

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully retrieved order details for: {}", orderId);
                return response.getBody();
            } else {
                log.error("Failed to retrieve order details for: {}. Status: {}",
                         orderId, response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            log.error("Error retrieving order details for: {}", orderId, e);
            return null;
        }
    }
}
