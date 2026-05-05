package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.service.RefundService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    @Operation(summary = "Initiate a refund via Razorpay")
    public ResponseEntity<Refund> initiateRefund(@Valid @RequestBody RefundRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(refundService.initiateRefund(request));
        } catch (Exception e) {
            log.error("Error initiating refund for transaction {}", request.getTransactionId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
