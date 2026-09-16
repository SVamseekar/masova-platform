package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.service.RefundService;
import com.MaSoVa.shared.util.StoreContextUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Refunds — canonical endpoints at {@code /api/payments/refund} (singular).
 * Gateway rewrites:
 *   {@code /api/payments/refunds/**} → {@code /api/payments/refund/**}
 *   {@code /api/refunds/**} → {@code /api/payments/refund/**}
 * Single class-level mapping keeps OpenAPI counts and integration-matrix audit accurate
 * (array {@code @RequestMapping} breaks the CI path extractor).
 */
@RestController
@RequestMapping("/api/payments/refund")
@Tag(name = "Refund Management", description = "Refund processing and tracking (Stripe EU + Razorpay IN)")
@SecurityRequirement(name = "bearerAuth")
public class RefundController {

    private static final Logger log = LoggerFactory.getLogger(RefundController.class);

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Initiate a refund (manager — Stripe/Razorpay/synthetic immediate)")
    public ResponseEntity<?> initiateRefund(@Valid @RequestBody RefundRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(refundService.initiateRefund(request));
        } catch (Exception e) {
            log.error("Error initiating refund for transaction {}", request.getTransactionId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to initiate refund", "detail", safeMessage(e)));
        }
    }

    /**
     * POST …/request — agent/customer path. No money moves until manager approves.
     */
    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Request a refund pending manager approval (no money moved)")
    public ResponseEntity<?> requestRefund(
            @Valid @RequestBody RefundRequest request,
            HttpServletRequest httpRequest) {
        String userId = StoreContextUtil.getUserIdFromHeaders(httpRequest);
        if (userId != null && !userId.isBlank()) {
            request.setInitiatedBy(userId);
        }
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(refundService.requestRefundApproval(request));
        } catch (RuntimeException e) {
            log.warn("Refund request rejected for transaction {}: {}",
                    request.getTransactionId(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{refundId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Approve a pending refund (manager only)")
    public ResponseEntity<?> approveRefund(
            @PathVariable String refundId,
            HttpServletRequest httpRequest) {
        String approvedBy = StoreContextUtil.getUserIdFromHeaders(httpRequest);
        try {
            return ResponseEntity.ok(refundService.approveRefund(refundId, approvedBy));
        } catch (RuntimeException e) {
            log.warn("Refund approval failed for {}: {}", refundId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{refundId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Reject a pending refund (manager only)")
    public ResponseEntity<?> rejectRefund(
            @PathVariable String refundId,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest) {
        String rejectedBy = StoreContextUtil.getUserIdFromHeaders(httpRequest);
        String reason = body != null ? body.get("reason") : null;
        try {
            return ResponseEntity.ok(refundService.rejectRefund(refundId, rejectedBy, reason));
        } catch (RuntimeException e) {
            log.warn("Refund rejection failed for {}: {}", refundId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{refundId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Get refund by ID")
    public ResponseEntity<Refund> getById(@PathVariable String refundId) {
        try {
            return ResponseEntity.ok(refundService.getRefund(refundId));
        } catch (Exception e) {
            log.warn("Refund not found: {}", refundId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET ?transactionId= | orderId= | customerId= | storeId= | status=
     * Manager list: storeId from query or X-Selected-Store-Id header; optional status filter
     * (e.g. PENDING_APPROVAL for the agent approval queue).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "List refunds (query: transactionId, orderId, customerId, storeId, status)")
    public ResponseEntity<?> getRefunds(
            @RequestParam(required = false) String transactionId,
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String status,
            HttpServletRequest request) {
        try {
            if (transactionId != null && !transactionId.isBlank()) {
                return ResponseEntity.ok(refundService.getRefundsByTransactionId(transactionId));
            }
            if (orderId != null && !orderId.isBlank()) {
                return ResponseEntity.ok(refundService.getRefundsByOrderId(orderId));
            }
            if (customerId != null && !customerId.isBlank()) {
                return ResponseEntity.ok(refundService.getRefundsByCustomerId(customerId));
            }

            String effectiveStoreId = (storeId != null && !storeId.isBlank())
                    ? storeId
                    : StoreContextUtil.getStoreIdFromHeaders(request);

            Refund.RefundStatus statusEnum = parseStatus(status);

            if (effectiveStoreId != null && !effectiveStoreId.isBlank()) {
                if (statusEnum != null) {
                    return ResponseEntity.ok(
                            refundService.getRefundsByStoreIdAndStatus(effectiveStoreId, statusEnum));
                }
                return ResponseEntity.ok(refundService.getRefundsByStoreId(effectiveStoreId));
            }

            if (statusEnum != null) {
                return ResponseEntity.ok(refundService.getRefundsByStatus(statusEnum));
            }

            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Provide transactionId, orderId, customerId, storeId, or status",
                    "canonical", "GET /api/payments/refund?storeId=DOM001"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching refunds", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private static Refund.RefundStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return Refund.RefundStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid refund status: " + status);
        }
    }

    private static String safeMessage(Exception e) {
        String msg = e.getMessage();
        return msg != null && msg.length() < 200 ? msg : "see server logs";
    }
}
