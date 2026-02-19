package com.MaSoVa.core.notification.controller;

import com.MaSoVa.core.notification.service.RatingRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@Tag(name = "RatingController", description = "Rating request notifications")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/notifications/rating")
public class RatingController {

    private static final Logger log = LoggerFactory.getLogger(RatingController.class);

    private final RatingRequestService ratingRequestService;

    public RatingController(RatingRequestService ratingRequestService) {
        this.ratingRequestService = ratingRequestService;
    }

    /**
     * Send rating request to customer (called by Order Service after delivery)
     */
    @PostMapping("/send")
    @Operation(summary = "Send rating request via SMS/Email")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    public ResponseEntity<Map<String, String>> sendRatingRequest(
            @Valid @RequestBody RatingRequestDTO request
    ) {
        try {
            log.info("Sending rating request for order: {}", request.getOrderId());

            ratingRequestService.sendRatingRequest(
                request.getOrderId(),
                request.getOrderNumber(),
                request.getCustomerPhone(),
                request.getCustomerEmail(),
                request.getRatingToken()
            );

            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "Rating request sent successfully"
            ));
        } catch (Exception e) {
            log.error("Failed to send rating request for order {}: {}",
                     request.getOrderId(), e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", "false",
                "error", "Failed to send rating request"
            ));
        }
    }

    /**
     * DTO for rating request
     */
    public static class RatingRequestDTO {
        @NotBlank
        private String orderId;

        @NotBlank
        private String orderNumber;

        private String customerPhone;
        private String customerEmail;

        @NotBlank
        private String ratingToken;

        // Getters and Setters
        public String getOrderId() {
            return orderId;
        }

        public void setOrderId(String orderId) {
            this.orderId = orderId;
        }

        public String getOrderNumber() {
            return orderNumber;
        }

        public void setOrderNumber(String orderNumber) {
            this.orderNumber = orderNumber;
        }

        public String getCustomerPhone() {
            return customerPhone;
        }

        public void setCustomerPhone(String customerPhone) {
            this.customerPhone = customerPhone;
        }

        public String getCustomerEmail() {
            return customerEmail;
        }

        public void setCustomerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
        }

        public String getRatingToken() {
            return ratingToken;
        }

        public void setRatingToken(String ratingToken) {
            this.ratingToken = ratingToken;
        }
    }
}
