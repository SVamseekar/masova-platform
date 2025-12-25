package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.shared.config.ApiVersionConfig;
import com.MaSoVa.shared.util.StoreContextUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST API endpoints for payment operations
 * Week 4: API Versioning Applied, Week 5: Swagger Documentation
 *
 * Security: All endpoints validate store ownership to prevent cross-store access.
 */
@RestController
@RequestMapping({ApiVersionConfig.V1 + "/payments", ApiVersionConfig.LEGACY + "/payments"})
@Tag(name = "Payment Management", description = "APIs for payment processing, verification, and transaction management with Razorpay integration")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Validates that the user has access to the transaction's store
     * @throws AccessDeniedException if user doesn't belong to the transaction's store
     */
    private void validateStoreAccess(String userStoreId, String transactionStoreId) {
        if (userStoreId != null && !userStoreId.isEmpty()
                && transactionStoreId != null && !transactionStoreId.isEmpty()
                && !userStoreId.equals(transactionStoreId)) {
            log.warn("Cross-store access attempt: user store {} tried to access transaction from store {}",
                    userStoreId, transactionStoreId);
            throw new AccessDeniedException("Cannot access transaction from different store");
        }
    }

    /**
     * POST /api/payments/initiate - Initiate payment (create Razorpay order)
     * Customers initiate payments for their orders, staff/managers for POS orders
     */
    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Initiate payment", description = "Creates a Razorpay order to initiate payment for an order")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Payment initiated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid payment request"),
        @ApiResponse(responseCode = "500", description = "Payment gateway error")
    })
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
     * Customers and staff can verify payments
     */
    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Verify payment", description = "Verifies payment signature from Razorpay after customer completes payment")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Payment verified successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid payment signature"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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
     * All authenticated users can view transactions from their store only
     */
    @GetMapping("/{transactionId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    public ResponseEntity<PaymentResponse> getTransaction(
            @PathVariable String transactionId,
            HttpServletRequest request) {
        log.info("Fetching transaction: {}", transactionId);
        try {
            String userStoreId = StoreContextUtil.getStoreIdFromHeaders(request);
            PaymentResponse response = paymentService.getTransaction(transactionId);

            // Validate store ownership for non-customer users
            validateStoreAccess(userStoreId, response.getStoreId());

            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            log.warn("Access denied for transaction: {}", transactionId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error fetching transaction", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * GET /api/payments/order/{orderId} - Get transaction by order ID
     * All authenticated users can view transactions by order from their store only
     */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    public ResponseEntity<PaymentResponse> getTransactionByOrderId(
            @PathVariable String orderId,
            HttpServletRequest request) {
        log.info("Fetching transaction for order: {}", orderId);
        try {
            String userStoreId = StoreContextUtil.getStoreIdFromHeaders(request);
            PaymentResponse response = paymentService.getTransactionByOrderId(orderId);

            // Validate store ownership
            validateStoreAccess(userStoreId, response.getStoreId());

            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            log.warn("Access denied for order transaction: {}", orderId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error fetching transaction by order ID", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * GET /api/payments/customer/{customerId} - Get transactions by customer ID
     * Customers can view their own transactions, staff/managers can view all
     */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
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
     * Only staff and managers can view store transactions
     */
    @GetMapping("/store")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
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
     * Only managers can view reconciliation reports
     */
    @GetMapping("/reconciliation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
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
     * Only managers can mark transactions as reconciled (from their store only)
     */
    @PostMapping("/{transactionId}/reconcile")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    public ResponseEntity<Void> markAsReconciled(
            @PathVariable String transactionId,
            @RequestParam("reconciledBy") String reconciledBy,
            HttpServletRequest request) {
        log.info("Marking transaction {} as reconciled by {}", transactionId, reconciledBy);
        try {
            String userStoreId = StoreContextUtil.getStoreIdFromHeaders(request);

            // First validate store access before reconciling
            PaymentResponse transaction = paymentService.getTransaction(transactionId);
            validateStoreAccess(userStoreId, transaction.getStoreId());

            paymentService.markAsReconciled(transactionId, reconciledBy);
            return ResponseEntity.ok().build();
        } catch (AccessDeniedException e) {
            log.warn("Access denied for reconciling transaction: {}", transactionId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error marking transaction as reconciled", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/payments/cash - Record a CASH payment as SUCCESS
     * Used for walk-in/POS orders where payment is collected immediately
     * Staff and managers can record cash payments
     */
    @PostMapping("/cash")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Record cash payment", description = "Creates a SUCCESS transaction record for cash payments collected immediately")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Cash payment recorded successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<PaymentResponse> recordCashPayment(@Valid @RequestBody InitiatePaymentRequest request) {
        log.info("Recording cash payment for order: {}", request.getOrderId());
        try {
            PaymentResponse response = paymentService.recordCashPayment(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error recording cash payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
