package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.service.RefundService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments/refund")
@Tag(name = "Refund Management", description = "APIs for processing and managing payment refunds")
@SecurityRequirement(name = "bearerAuth")
public class RefundController {

    private static final Logger log = LoggerFactory.getLogger(RefundController.class);

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    /**
     * POST /api/payments/refund - Initiate refund
     */
    @PostMapping
    public ResponseEntity<Refund> initiateRefund(@Valid @RequestBody RefundRequest request) {
        log.info("Received refund request for transaction: {}, amount: {}",
                 request.getTransactionId(), request.getAmount());
        try {
            Refund refund = refundService.initiateRefund(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(refund);
        } catch (Exception e) {
            log.error("Error initiating refund", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/payments/refund/{refundId} - Get refund by ID
     */
    @GetMapping("/{refundId}")
    public ResponseEntity<Refund> getRefund(@PathVariable String refundId) {
        log.info("Fetching refund: {}", refundId);
        try {
            Refund refund = refundService.getRefund(refundId);
            return ResponseEntity.ok(refund);
        } catch (Exception e) {
            log.error("Error fetching refund", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * GET /api/payments/refund/transaction/{transactionId} - Get refunds by transaction ID
     */
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<List<Refund>> getRefundsByTransactionId(@PathVariable String transactionId) {
        log.info("Fetching refunds for transaction: {}", transactionId);
        try {
            List<Refund> refunds = refundService.getRefundsByTransactionId(transactionId);
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error fetching refunds by transaction ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/payments/refund/order/{orderId} - Get refunds by order ID
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Refund>> getRefundsByOrderId(@PathVariable String orderId) {
        log.info("Fetching refunds for order: {}", orderId);
        try {
            List<Refund> refunds = refundService.getRefundsByOrderId(orderId);
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error fetching refunds by order ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/payments/refund/customer/{customerId} - Get refunds by customer ID
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Refund>> getRefundsByCustomerId(@PathVariable String customerId) {
        log.info("Fetching refunds for customer: {}", customerId);
        try {
            List<Refund> refunds = refundService.getRefundsByCustomerId(customerId);
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            log.error("Error fetching refunds by customer ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
