package com.MaSoVa.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class CustomerServiceClient {
    
    private static final Logger log = LoggerFactory.getLogger(CustomerServiceClient.class);
    
    private final RestTemplate restTemplate;
    
    @Value("${services.customer-service.url:http://localhost:8083}")
    private String customerServiceUrl;
    
    public CustomerServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * Update customer order statistics after order creation/completion
     * Called when order status changes to DELIVERED or order is created
     */
    public void updateOrderStats(String customerId, String status, double orderTotal) {
        if (customerId == null || customerId.trim().isEmpty()) {
            log.debug("Skipping order stats update - no customer ID provided");
            return;
        }
        
        try {
            String url = customerServiceUrl + "/api/customers/" + customerId + "/order-stats";
            
            Map<String, Object> request = new HashMap<>();
            request.put("status", status);
            request.put("orderTotal", orderTotal);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            log.info("Updating customer order stats. Customer: {}, Status: {}, Total: {}", 
                     customerId, status, orderTotal);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully updated order stats for customer: {}", customerId);
            } else {
                log.error("Failed to update order stats for customer: {}. HTTP Status: {}", 
                         customerId, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating customer order stats for customer: {}. Order Total: {}", 
                     customerId, orderTotal, e);
            // Don't throw - order creation should succeed even if stats update fails
            // This should be handled with retry logic or event-driven updates
        }
    }
}
