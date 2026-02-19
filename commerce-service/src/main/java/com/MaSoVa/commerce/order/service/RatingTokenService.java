package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.RatingToken;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.repository.RatingTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RatingTokenService {

    private static final Logger log = LoggerFactory.getLogger(RatingTokenService.class);

    private final RatingTokenRepository ratingTokenRepository;
    private final OrderRepository orderRepository;

    @Value("${app.rating.token-validity-days:30}")
    private int tokenValidityDays;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public RatingTokenService(RatingTokenRepository ratingTokenRepository, OrderRepository orderRepository) {
        this.ratingTokenRepository = ratingTokenRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Generate a unique rating token for an order
     * Called after delivery is completed
     */
    public RatingToken generateRatingToken(String orderId) {
        // Check if token already exists for this order
        if (ratingTokenRepository.existsByOrderId(orderId)) {
            log.info("Rating token already exists for order {}", orderId);
            return ratingTokenRepository.findByOrderId(orderId).orElseThrow();
        }

        // Get order details
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        // Create token
        RatingToken token = new RatingToken();
        token.setToken(UUID.randomUUID().toString());
        token.setOrderId(orderId);
        token.setCustomerId(order.getCustomerId());

        // Get customer contact info from order
        if (order.getCustomerPhone() != null) {
            token.setCustomerPhone(order.getCustomerPhone());
        }
        // Email will be fetched from customer service if needed

        // Driver info (if delivery order)
        if (order.getAssignedDriverId() != null) {
            token.setDriverId(order.getAssignedDriverId());
            // Driver name can be fetched from user service if needed
        }

        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusDays(tokenValidityDays));
        token.setUsed(false);

        RatingToken savedToken = ratingTokenRepository.save(token);
        log.info("Generated rating token for order {} with token {}", orderId, savedToken.getToken());

        return savedToken;
    }

    /**
     * Validate and retrieve rating token
     */
    public RatingToken validateToken(String token) {
        RatingToken ratingToken = ratingTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid rating token"));

        if (!ratingToken.isValid()) {
            throw new IllegalStateException("Rating token is expired or already used");
        }

        return ratingToken;
    }

    /**
     * Mark token as used after rating submission
     */
    public void markTokenAsUsed(String token) {
        RatingToken ratingToken = ratingTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token not found"));

        ratingToken.setUsed(true);
        ratingToken.setUsedAt(LocalDateTime.now());
        ratingTokenRepository.save(ratingToken);

        log.info("Marked rating token {} as used for order {}", token, ratingToken.getOrderId());
    }

    /**
     * Generate rating URL for SMS/Email
     */
    public String generateRatingUrl(String orderId) {
        RatingToken token = generateRatingToken(orderId);
        return String.format("%s/rate/%s/%s", frontendBaseUrl, orderId, token.getToken());
    }

    /**
     * Get order ID from token
     */
    public String getOrderIdFromToken(String token) {
        RatingToken ratingToken = validateToken(token);
        return ratingToken.getOrderId();
    }
}
