package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.shared.util.StoreContextUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * POST /api/payments/initiate - Initiate payment (create Razorpay order)
     */
    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiatePayment(@Valid @RequestBody InitiatePaymentRequest request) {
        log.info("Received payment initiation request for order: {}", request.getOrderId());
        try {
            PaymentResponse response = paymentService.initiatePayment(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error initiating payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/payments/verify - Verify payment after customer completes payment
     */
    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(@Valid @RequestBody PaymentCallbackRequest request) {
        log.info("Received payment verification request. Razorpay Payment ID: {}", request.getRazorpayPaymentId());
        try {
            PaymentResponse response = paymentService.verifyPayment(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * GET /api/payments/{transactionId} - Get transaction by ID
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<PaymentResponse> getTransaction(@PathVariable String transactionId) {
        log.info("Fetching transaction: {}", transactionId);
        try {
            PaymentResponse response = paymentService.getTransaction(transactionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching transaction", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * GET /api/payments/order/{orderId} - Get transaction by order ID
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getTransactionByOrderId(@PathVariable String orderId) {
        log.info("Fetching transaction for order: {}", orderId);
        try {
            PaymentResponse response = paymentService.getTransactionByOrderId(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching transaction by order ID", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * GET /api/payments/customer/{customerId} - Get transactions by customer ID
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PaymentResponse>> getTransactionsByCustomerId(@PathVariable String customerId) {
        log.info("Fetching transactions for customer: {}", customerId);
        try {
            List<PaymentResponse> transactions = paymentService.getTransactionsByCustomerId(customerId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("Error fetching customer transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/payments/store - Get transactions by store ID
     */
    @GetMapping("/store")
    public ResponseEntity<List<PaymentResponse>> getTransactionsByStoreId(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("Fetching transactions for store: {}", storeId);
        try {
            List<PaymentResponse> transactions = paymentService.getTransactionsByStoreId(storeId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("Error fetching store transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/payments/reconciliation - Get daily reconciliation report
     * Query params: date (YYYY-MM-DD)
     */
    @GetMapping("/reconciliation")
    public ResponseEntity<ReconciliationReportResponse> getDailyReconciliation(
            HttpServletRequest request,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("Generating reconciliation report for store: {} on date: {}", storeId, date);
        try {
            ReconciliationReportResponse report = paymentService.getDailyReconciliation(storeId, date);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error generating reconciliation report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/payments/{transactionId}/reconcile - Mark transaction as reconciled
     */
    @PostMapping("/{transactionId}/reconcile")
    public ResponseEntity<Void> markAsReconciled(
            @PathVariable String transactionId,
            @RequestParam("reconciledBy") String reconciledBy) {
        log.info("Marking transaction {} as reconciled by {}", transactionId, reconciledBy);
        try {
            paymentService.markAsReconciled(transactionId, reconciledBy);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking transaction as reconciled", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
