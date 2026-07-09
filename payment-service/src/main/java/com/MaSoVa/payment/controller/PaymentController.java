package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.shared.util.StoreContextUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

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
import java.util.Map;

/**
 * Payments — 6 canonical endpoints at /api/payments.
 * Removed /api/v1/ prefix. Refund sub-resource kept in RefundController.
 * Replaces: /api/v1/payments/**, /customer/{id}, /store, /order/{id},
 *           /{id}/reconcile, /reconciliation (collapsed into query params)
 */
@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Payment processing, verification, and transaction management (Stripe EU + Razorpay IN)")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    private void validateStoreAccess(String userStoreId, String transactionStoreId) {
        if (userStoreId != null && !userStoreId.isEmpty()
                && transactionStoreId != null && !transactionStoreId.isEmpty()
                && !userStoreId.equals(transactionStoreId)) {
            log.warn("Cross-store access attempt: user store {} vs transaction store {}", userStoreId, transactionStoreId);
            throw new AccessDeniedException("Cannot access transaction from different store");
        }
    }

    // ── INITIATE / VERIFY / CASH ──────────────────────────────────────────────────

    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Initiate payment (Stripe PaymentIntent for non-IN; Razorpay for IN)")
    public ResponseEntity<PaymentResponse> initiate(@Valid @RequestBody InitiatePaymentRequest request) {
        try {
            return ResponseEntity.ok(paymentService.initiatePayment(request));
        } catch (Exception e) {
            log.error("Error initiating payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Verify Razorpay payment signature")
    public ResponseEntity<PaymentResponse> verify(@Valid @RequestBody PaymentCallbackRequest request) {
        try {
            return ResponseEntity.ok(paymentService.verifyPayment(request));
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/cash")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Record cash payment immediately as SUCCESS (POS flow)")
    public ResponseEntity<PaymentResponse> cash(@Valid @RequestBody InitiatePaymentRequest request) {
        try {
            return ResponseEntity.ok(paymentService.recordCashPayment(request));
        } catch (Exception e) {
            log.error("Error recording cash payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── READ ──────────────────────────────────────────────────────────────────────

    @GetMapping("/{transactionId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Get transaction by ID")
    public ResponseEntity<PaymentResponse> getById(
            @PathVariable String transactionId,
            HttpServletRequest request) {
        try {
            PaymentResponse response = paymentService.getTransaction(transactionId);
            validateStoreAccess(StoreContextUtil.getStoreIdFromHeaders(request), response.getStoreId());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/payments?orderId=&customerId=&reconciliation=true&date=
     * Replaces: /order/{orderId}, /customer/{customerId}, /store,
     *           /reconciliation?date=, GET with no params (store default)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "List transactions (query: orderId, customerId, storeId, reconciliation+date)")
    public ResponseEntity<?> getTransactions(
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) Boolean reconciliation,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpServletRequest request) {
        String headerStoreId = StoreContextUtil.getStoreIdFromHeaders(request);
        String effectiveStore = (storeId != null && !storeId.isBlank()) ? storeId : headerStoreId;
        try {
            if (Boolean.TRUE.equals(reconciliation) && date != null) {
                ReconciliationReportResponse report = paymentService.getDailyReconciliation(effectiveStore, date);
                return ResponseEntity.ok(report);
            }
            if (orderId != null) {
                PaymentResponse response = paymentService.getTransactionByOrderId(orderId);
                validateStoreAccess(headerStoreId, response.getStoreId());
                return ResponseEntity.ok(response);
            }
            if (customerId != null) {
                List<PaymentResponse> transactions = paymentService.getTransactionsByCustomerId(customerId);
                return ResponseEntity.ok(transactions);
            }
            List<PaymentResponse> transactions = paymentService.getTransactionsByStoreId(effectiveStore);
            return ResponseEntity.ok(transactions);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error fetching transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── LEGACY PATH ALIASES (frontend RTK used these pre-canonical collapse) ──────

    /**
     * GET /api/payments/store?storeId= — same as GET /api/payments with store header.
     * Prefer canonical GET /api/payments with X-Selected-Store-Id.
     */
    @GetMapping("/store")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "List store transactions (legacy alias of GET /api/payments)")
    public ResponseEntity<?> getByStore(
            @RequestParam(required = false) String storeId,
            HttpServletRequest request) {
        String effective = (storeId != null && !storeId.isBlank())
                ? storeId
                : StoreContextUtil.getStoreIdFromHeaders(request);
        try {
            if (effective == null || effective.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "storeId required (query or X-Selected-Store-Id header)"));
            }
            return ResponseEntity.ok(paymentService.getTransactionsByStoreId(effective));
        } catch (Exception e) {
            log.error("Error fetching store transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** GET /api/payments/order/{orderId} — alias of GET /api/payments?orderId= */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Get transaction by order ID (legacy path alias)")
    public ResponseEntity<?> getByOrderPath(
            @PathVariable String orderId,
            HttpServletRequest request) {
        try {
            PaymentResponse response = paymentService.getTransactionByOrderId(orderId);
            validateStoreAccess(StoreContextUtil.getStoreIdFromHeaders(request), response.getStoreId());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** GET /api/payments/customer/{customerId} — alias of GET /api/payments?customerId= */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "List transactions by customer (legacy path alias)")
    public ResponseEntity<List<PaymentResponse>> getByCustomerPath(@PathVariable String customerId) {
        try {
            return ResponseEntity.ok(paymentService.getTransactionsByCustomerId(customerId));
        } catch (Exception e) {
            log.error("Error fetching customer transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── RECONCILE ─────────────────────────────────────────────────────────────────

    @PostMapping("/{transactionId}/reconcile")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Mark transaction as reconciled")
    public ResponseEntity<Void> reconcile(
            @PathVariable String transactionId,
            @RequestParam String reconciledBy,
            HttpServletRequest request) {
        try {
            PaymentResponse transaction = paymentService.getTransaction(transactionId);
            validateStoreAccess(StoreContextUtil.getStoreIdFromHeaders(request), transaction.getStoreId());
            paymentService.markAsReconciled(transactionId, reconciledBy);
            return ResponseEntity.ok().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            log.error("Error reconciling transaction", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── GDPR (internal-only, called by core-service GDPR service) ─────────────────

    /**
     * POST /api/payments/gdpr/anonymize?customerId= — anonymise PII in all transactions.
     * Internal-only: requires X-Internal-Service header. Not accessible via gateway.
     */
    @PostMapping("/gdpr/anonymize")
    @Operation(summary = "Anonymise payment data for customer (GDPR erasure — internal only)")
    public ResponseEntity<Void> gdprAnonymize(
            @RequestParam String customerId,
            HttpServletRequest request) {
        String internalCaller = request.getHeader("X-Internal-Service");
        if (internalCaller == null || internalCaller.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        paymentService.anonymizeCustomerData(customerId);
        return ResponseEntity.ok().build();
    }
}
