package com.MaSoVa.commerce.order.client;

import com.MaSoVa.shared.http.HttpMethods;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class CustomerServiceClient {
    
    private static final Logger log = LoggerFactory.getLogger(CustomerServiceClient.class);
    
    private final RestTemplate restTemplate;
    
    @Value("${services.customer-service.url:http://localhost:8085}")
    private String customerServiceUrl;
    
    public CustomerServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Customer profile ids belonging to a user account. Orders reference the customer profile id,
     * while the authenticated caller is identified by user id. Core only answers this for the
     * caller's own account (the JWT is forwarded). A refusal from core yields no ids; an outage is
     * reported as 503 so it is not mistaken for an ownership violation.
     */
    public java.util.Set<String> findCustomerIdsForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return java.util.Set.of();
        }
        try {
            String url = org.springframework.web.util.UriComponentsBuilder.fromHttpUrl(customerServiceUrl)
                    .path("/api/customers").queryParam("userId", userId).toUriString();
            java.util.List<Map<String, Object>> customers = restTemplate.exchange(url, HttpMethods.GET, null,
                    new org.springframework.core.ParameterizedTypeReference<java.util.List<Map<String, Object>>>() {}).getBody();
            java.util.Set<String> ids = new java.util.HashSet<>();
            if (customers != null) {
                for (Map<String, Object> customer : customers) {
                    if (customer.get("id") instanceof String id && userId.equals(customer.get("userId"))) {
                        ids.add(id);
                    }
                }
            }
            return ids;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Core refused the lookup for this caller: no profiles, so ownership stays denied
            log.warn("Customer profile lookup refused for user {}: {}", userId, e.getStatusCode());
            return java.util.Set.of();
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("Customer profile lookup failed for user {}", userId, e);
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Order ownership could not be verified right now. Try again shortly.");
        }
    }

    /**
     * Update customer email address
     * Called when customer provides real email during order creation
     *
     * Note: JWT Authorization header is automatically forwarded by JwtForwardingInterceptor
     */
    public void updateCustomerEmail(String customerId, String email) {
        if (customerId == null || customerId.trim().isEmpty()) {
            log.debug("Skipping email update - no customer ID provided");
            return;
        }

        if (email == null || email.trim().isEmpty()) {
            log.debug("Skipping email update - no email provided");
            return;
        }

        try {
            // Phase 1: /update-email removed → PATCH /api/customers/{id} with email field
            String url = customerServiceUrl + "/api/customers/" + customerId;

            Map<String, Object> request = new HashMap<>();
            request.put("email", email);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            log.info("Updating customer email. Customer: {}", customerId);
            restTemplate.exchange(url, HttpMethods.PATCH, entity, String.class);
            log.info("Successfully updated email for customer: {}", customerId);
        } catch (Exception e) {
            log.error("Error updating customer email for customer: {}", customerId, e);
            // Don't throw - order creation should succeed even if email update fails
        }
    }

    /**
     * Update customer order statistics after order creation/completion
     * Called when order status changes to DELIVERED or order is created
     *
     * Note: JWT Authorization header is automatically forwarded by JwtForwardingInterceptor
     */
    public void updateOrderStats(String customerId, String orderId, String orderType, String status, double orderTotal) {
        if (customerId == null || customerId.trim().isEmpty()) {
            log.debug("Skipping order stats update - no customer ID provided");
            return;
        }

        // Phase 1: /order-stats sub-resource removed. Order statistics are derived by querying
        // orders directly. This update is a no-op until Phase 3 (event-driven stats via RabbitMQ).
        log.debug("updateOrderStats skipped — no Phase 1 canonical endpoint. customerId={}, orderId={}", customerId, orderId);
    }
}
