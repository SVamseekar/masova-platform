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
 * Refunds — 3 canonical endpoints at /api/payments/refund.
 * Replaces: /transaction/{transactionId}, /order/{orderId}, /customer/{customerId}
 *           (collapsed into query params on GET /)
 */
@RestController
@RequestMapping("/api/payments/refund")
@Tag(name = "Refund Management", description = "Refund processing and tracking")
@SecurityRequirement(name = "bearerAuth")
public class RefundController {

    private static final Logger log = LoggerFactory.getLogger(RefundController.class);

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Initiate a refund via Razorpay (manager-initiated, immediate)")
    public ResponseEntity<?> initiateRefund(@Valid @RequestBody RefundRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(refundService.initiateRefund(request));
        } catch (Exception e) {
            log.error("Error initiating refund for transaction {}", request.getTransactionId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to initiate refund"));
        }
    }

    /**
     * POST /api/payments/refund/request — request a refund that requires manager approval
     * (security remediation Task 4). Used by the AI agent / customer path. No money moves
     * until a manager approves; the refund is recorded as PENDING_APPROVAL.
     */
    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Request a refund pending manager approval (no money moved)")
    public ResponseEntity<?> requestRefund(
            @Valid @RequestBody RefundRequest request,
            HttpServletRequest httpRequest) {
        // Stamp the requester so the audit trail reflects who asked (agent / customer / staff).
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

    /**
     * POST /api/payments/refund/{refundId}/approve — manager approves a PENDING_APPROVAL
     * refund, executing the actual Razorpay refund.
     */
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

    /**
     * POST /api/payments/refund/{refundId}/reject — manager rejects a PENDING_APPROVAL refund.
     */
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
     * GET /api/payments/refund?transactionId=&orderId=&customerId=
     * Replaces: /transaction/{transactionId}, /order/{orderId}, /customer/{customerId}
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "List refunds (query: transactionId, orderId, customerId)")
    public ResponseEntity<List<Refund>> getRefunds(
            @RequestParam(required = false) String transactionId,
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) String customerId) {
        try {
            if (transactionId != null) return ResponseEntity.ok(refundService.getRefundsByTransactionId(transactionId));
            if (orderId != null) return ResponseEntity.ok(refundService.getRefundsByOrderId(orderId));
            if (customerId != null) return ResponseEntity.ok(refundService.getRefundsByCustomerId(customerId));
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error fetching refunds", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
