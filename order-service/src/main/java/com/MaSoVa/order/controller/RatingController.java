package com.MaSoVa.order.controller;

import com.MaSoVa.order.entity.RatingToken;
import com.MaSoVa.order.service.RatingTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@Tag(name = "RatingController", description = "Rating token management")
@RequestMapping("/api/orders/rating")
public class RatingController {

    private static final Logger log = LoggerFactory.getLogger(RatingController.class);

    private final RatingTokenService ratingTokenService;

    public RatingController(RatingTokenService ratingTokenService) {
        this.ratingTokenService = ratingTokenService;
    }

    /**
     * Validate rating token and get order details (public endpoint for rating page)
     */
    @GetMapping("/token/{token}")
    public ResponseEntity<?> validateToken(@PathVariable String token) {
        try {
            RatingToken ratingToken = ratingTokenService.validateToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("orderId", ratingToken.getOrderId());
            response.put("customerId", ratingToken.getCustomerId());
            response.put("driverId", ratingToken.getDriverId());
            response.put("driverName", ratingToken.getDriverName());
            response.put("message", "Please rate your recent order");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "error", "Invalid rating token"
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error validating token", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "valid", false,
                "error", "Failed to validate token"
            ));
        }
    }

    /**
     * Mark token as used (called by Review Service after rating submission)
     */
    @PostMapping("/token/{token}/mark-used")
    public ResponseEntity<?> markTokenAsUsed(@PathVariable String token) {
        try {
            ratingTokenService.markTokenAsUsed(token);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Error marking token as used", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to mark token as used"
            ));
        }
    }
}
