package com.MaSoVa.payment.client;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Reads what an order costs from commerce-service, as the current caller.
 *
 * The browser (or POS, or mobile app) chooses the amount it sends to /api/payments, so payment-service
 * charges the order's own total and currency instead. The caller's JWT and user headers are forwarded,
 * so commerce-service also checks that the caller may see the order (a customer's own order, or an
 * order of the staff member's store).
 */
@Component
public class OrderChargeClient {

    private static final Logger log = LoggerFactory.getLogger(OrderChargeClient.class);
    private static final String[] FORWARDED_HEADERS = {
            HttpHeaders.AUTHORIZATION, "X-User-Id", "X-User-Type", "X-User-Store-Id", "X-Selected-Store-Id"
    };

    /** What the order costs: total in major units, rounded to two decimals, and its ISO currency. */
    public record OrderCharge(BigDecimal amount, String currency) {}

    private final RestTemplate restTemplate;
    private final String orderServiceUrl;

    public OrderChargeClient(RestTemplate restTemplate,
                             @Value("${services.order-service.url:http://localhost:8084}") String orderServiceUrl) {
        this.restTemplate = restTemplate;
        this.orderServiceUrl = orderServiceUrl;
    }

    /**
     * @throws AccessDeniedException when commerce-service refuses the caller or does not know the order
     * @throws IllegalStateException when the order has no total
     */
    public OrderCharge getOrderCharge(String orderId) {
        Map<String, Object> order;
        try {
            order = restTemplate.exchange(orderServiceUrl + "/api/orders/" + orderId, HttpMethod.GET,
                    new HttpEntity<>(forwardedHeaders()),
                    new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
        } catch (HttpClientErrorException.Forbidden | HttpClientErrorException.NotFound e) {
            log.warn("Order {} refused for payment: {}", orderId, e.getStatusCode());
            throw new AccessDeniedException("Cannot pay for an order you cannot access");
        }
        return toCharge(orderId, order);
    }

    static OrderCharge toCharge(String orderId, Map<String, Object> order) {
        Object total = order == null ? null : order.get("total");
        if (total == null) {
            throw new IllegalStateException("Order " + orderId + " has no total to charge");
        }
        BigDecimal amount = new BigDecimal(total.toString()).setScale(2, RoundingMode.HALF_UP);
        Object currency = order.get("currency");
        // Orders without a currency predate Global-3 and are India (INR) orders.
        String code = currency == null || currency.toString().isBlank() ? "INR" : currency.toString().toUpperCase();
        return new OrderCharge(amount, code);
    }

    private static HttpHeaders forwardedHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest current = attributes.getRequest();
            for (String name : FORWARDED_HEADERS) {
                String value = current.getHeader(name);
                if (value != null && !value.isBlank()) {
                    headers.set(name, value);
                }
            }
        }
        return headers;
    }
}
