package com.MaSoVa.commerce.order.controller;

import com.MaSoVa.commerce.order.service.RatingTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders/rating-token")
@Tag(name = "Rating Token", description = "Public rating token validation")
public class RatingTokenController {

    private static final Logger log = LoggerFactory.getLogger(RatingTokenController.class);

    private final RatingTokenService ratingTokenService;

    public RatingTokenController(RatingTokenService ratingTokenService) {
        this.ratingTokenService = ratingTokenService;
    }

    @GetMapping("/{token}")
    @Operation(summary = "Validate rating token and return order details (public, no auth)")
    public ResponseEntity<?> getTokenDetails(@PathVariable("token") String token) {
        try {
            return ResponseEntity.ok(ratingTokenService.getTokenDetails(token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", "Invalid rating token"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", e.getMessage()));
        } catch (Exception e) {
            log.warn("Error validating rating token: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "valid", false,
                    "error", "Failed to validate token"));
        }
    }

    @PostMapping("/{token}/mark-used")
    @Operation(summary = "Mark rating token as used (internal service call)")
    public ResponseEntity<?> markTokenAsUsed(
            @PathVariable("token") String token,
            jakarta.servlet.http.HttpServletRequest request) {
        String internalCaller = request.getHeader("X-Internal-Service");
        if (internalCaller == null || internalCaller.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            ratingTokenService.markTokenAsUsed(token);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            log.warn("Error marking rating token as used: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to mark token as used"));
        }
    }
}