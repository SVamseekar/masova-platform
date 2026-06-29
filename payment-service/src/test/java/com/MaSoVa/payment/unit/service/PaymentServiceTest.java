package com.MaSoVa.payment.unit.service;

import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.payment.service.OrderServiceClient;
import com.MaSoVa.payment.service.RazorpayService;
import com.MaSoVa.payment.service.PiiEncryptionService;
import com.MaSoVa.payment.service.PaymentNotificationService;
import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.GatewayPaymentResult;
import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("PaymentService Unit Tests")
class PaymentServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private RazorpayService razorpayService;

    @Mock
    private OrderServiceClient orderServiceClient;

    @Mock
    private RazorpayConfig razorpayConfig;

    @Mock
    private PiiEncryptionService encryptionService;

    @Mock
    private PaymentNotificationService paymentNotificationService;

    @Mock
    private com.MaSoVa.payment.messaging.PaymentEventPublisher paymentEventPublisher;

    @Mock
    private PaymentGatewayResolver paymentGatewayResolver;

    @Mock
    private PaymentGateway razorpayGateway;

    @Mock
    private PaymentGateway stripeGateway;

    @InjectMocks
    private PaymentService paymentService;

    private InitiatePaymentRequest paymentRequest;
    private Transaction successTransaction;
    private Transaction initiatedTransaction;

    @BeforeEach
    void setUp() {
        paymentRequest = InitiatePaymentRequest.builder()
                .orderId("order-123")
                .amount(BigDecimal.valueOf(500.00))
                .customerId("cust-456")
                .customerEmail("customer@real.com")
                .customerPhone("+31612345678")
                .storeId("store-789")
                .orderType("TAKEAWAY")
                .paymentMethod("CARD")
                .build();

        initiatedTransaction = Transaction.builder()
                .orderId("order-123")
                .razorpayOrderId("order_razorpay_001")
                .amount(BigDecimal.valueOf(500.00))
                .status(Transaction.PaymentStatus.INITIATED)
                .customerId("cust-456")
                .customerEmail("encrypted-email")
                .customerPhone("encrypted-phone")
                .storeId("store-789")
                .receipt("RCP_abc12345")
                .currency("INR")
                .reconciled(false)
                .build();
        initiatedTransaction.setId("txn-001");

        successTransaction = Transaction.builder()
                .orderId("order-123")
                .razorpayOrderId("order_razorpay_001")
                .amount(BigDecimal.valueOf(500.00))
                .status(Transaction.PaymentStatus.SUCCESS)
                .customerId("cust-456")
                .customerEmail("encrypted-email")
                .customerPhone("encrypted-phone")
                .storeId("store-789")
                .currency("INR")
                .reconciled(false)
                .build();
        successTransaction.setId("txn-001");
        successTransaction.setRazorpayPaymentId("pay_razorpay_001");
        successTransaction.setPaymentMethod(Transaction.PaymentMethod.CARD);
        successTransaction.setCreatedAt(LocalDateTime.now());

        when(paymentGatewayResolver.isIndiaStore(any())).thenAnswer(inv -> {
            String countryCode = inv.getArgument(0);
            if (countryCode == null || countryCode.isBlank()) {
                return true;
            }
            return "IN".equalsIgnoreCase(countryCode.trim());
        });
    }

    @Nested
    @DisplayName("initiatePayment")
    class InitiatePaymentTests {

        @Test
        @DisplayName("Should initiate payment successfully for a valid request (India/Razorpay unchanged)")
        void shouldInitiatePaymentSuccessfully() throws Exception {
            // Given
            when(transactionRepository.findByOrderId("order-123")).thenReturn(Optional.empty());
            when(paymentGatewayResolver.resolve(null)).thenReturn(razorpayGateway);
            when(razorpayGateway.initiatePayment(any()))
                    .thenReturn(new GatewayPaymentResult("RAZORPAY", "order_razorpay_001", null, "rzp_test_key"));
            when(encryptionService.encrypt("customer@real.com")).thenReturn("encrypted-email");
            when(encryptionService.encrypt("+31612345678")).thenReturn("encrypted-phone");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");

            // When
            PaymentResponse response = paymentService.initiatePayment(paymentRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo("order-123");
            assertThat(response.getRazorpayOrderId()).isEqualTo("order_razorpay_001");
            assertThat(response.getStatus()).isEqualTo(Transaction.PaymentStatus.INITIATED);
            assertThat(response.getCustomerEmail()).isEqualTo("customer@real.com");
            assertThat(response.getRazorpayKeyId()).isEqualTo("rzp_test_key");
            assertThat(response.getStripePublishableKey()).isNull();
            verify(transactionRepository).save(any(Transaction.class));
            verify(razorpayGateway).initiatePayment(any());
        }

        @Test
        @DisplayName("Should route explicit IN countryCode to Razorpay, not Stripe")
        void shouldRouteIndiaCountryCodeToRazorpay() throws Exception {
            InitiatePaymentRequest inRequest = InitiatePaymentRequest.builder()
                    .orderId("order-in-001")
                    .amount(BigDecimal.valueOf(500.00))
                    .customerId("cust-in")
                    .customerEmail("customer@real.com")
                    .customerPhone("+919876543210")
                    .storeId("store-in")
                    .orderType("TAKEAWAY")
                    .paymentMethod("UPI")
                    .build();
            inRequest.setCountryCode("IN");

            when(transactionRepository.findByOrderId("order-in-001")).thenReturn(Optional.empty());
            when(paymentGatewayResolver.resolve("IN")).thenReturn(razorpayGateway);
            when(razorpayGateway.initiatePayment(any()))
                    .thenReturn(new GatewayPaymentResult("RAZORPAY", "order_in_001", null, "rzp_test_key"));
            when(encryptionService.encrypt(anyString())).thenReturn("encrypted");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");

            PaymentResponse response = paymentService.initiatePayment(inRequest);

            assertThat(response.getPaymentGateway()).isNull();
            assertThat(response.getRazorpayKeyId()).isEqualTo("rzp_test_key");
            verify(stripeGateway, never()).initiatePayment(any());
            verify(razorpayGateway).initiatePayment(any());
        }

        @Test
        @DisplayName("Should route EU store (countryCode=DE) to Stripe gateway, not Razorpay")
        void shouldRouteGermanyToStripe() throws Exception {
            // Given
            InitiatePaymentRequest deRequest = InitiatePaymentRequest.builder()
                    .orderId("order-de-001")
                    .amount(BigDecimal.valueOf(45.00))
                    .customerId("cust-de")
                    .customerEmail("customer@real.com")
                    .customerPhone("+31612345678")
                    .storeId("store-de")
                    .orderType("DELIVERY")
                    .paymentMethod("CARD")
                    .build();
            deRequest.setCountryCode("DE");
            deRequest.setCurrency("EUR");

            Transaction stripeTransaction = Transaction.builder()
                    .orderId("order-de-001")
                    .stripePaymentIntentId("pi_123")
                    .paymentGateway("STRIPE")
                    .amount(BigDecimal.valueOf(45.00))
                    .status(Transaction.PaymentStatus.INITIATED)
                    .customerId("cust-de")
                    .customerEmail("encrypted-email")
                    .customerPhone("encrypted-phone")
                    .storeId("store-de")
                    .currency("EUR")
                    .reconciled(false)
                    .build();
            stripeTransaction.setId("txn-de-001");

            when(transactionRepository.findByOrderId("order-de-001")).thenReturn(Optional.empty());
            when(paymentGatewayResolver.resolve("DE")).thenReturn(stripeGateway);
            when(stripeGateway.initiatePayment(any()))
                    .thenReturn(new GatewayPaymentResult("STRIPE", "pi_123", "pi_123_secret", "pk_test_123"));
            when(encryptionService.encrypt(anyString())).thenReturn("encrypted");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(stripeTransaction);
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");

            // When
            PaymentResponse response = paymentService.initiatePayment(deRequest);

            // Then
            assertThat(response.getPaymentGateway()).isEqualTo("STRIPE");
            assertThat(response.getStripeClientSecret()).isEqualTo("pi_123_secret");
            assertThat(response.getStripePublishableKey()).isEqualTo("pk_test_123");
            assertThat(response.getRazorpayKeyId()).isNull();
            verify(stripeGateway).initiatePayment(any());
            verify(razorpayGateway, never()).initiatePayment(any());
        }

        @Test
        @DisplayName("Should reject cash payment for delivery orders")
        void shouldRejectCashPaymentForDeliveryOrders() {
            // Given
            InitiatePaymentRequest deliveryRequest = InitiatePaymentRequest.builder()
                    .orderId("order-delivery")
                    .amount(BigDecimal.valueOf(300.00))
                    .customerId("cust-456")
                    .storeId("store-789")
                    .orderType("DELIVERY")
                    .paymentMethod("CASH")
                    .build();

            // When / Then
            assertThatThrownBy(() -> paymentService.initiatePayment(deliveryRequest))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should throw when payment already completed for order")
        void shouldThrowWhenPaymentAlreadyCompleted() {
            // Given
            when(transactionRepository.findByOrderId("order-123"))
                    .thenReturn(Optional.of(successTransaction));

            // When / Then
            assertThatThrownBy(() -> paymentService.initiatePayment(paymentRequest))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should wrap RazorpayException in RuntimeException")
        void shouldWrapRazorpayException() throws Exception {
            // Given
            when(transactionRepository.findByOrderId("order-123")).thenReturn(Optional.empty());
            when(paymentGatewayResolver.resolve(null)).thenReturn(razorpayGateway);
            when(razorpayGateway.initiatePayment(any()))
                    .thenThrow(new RazorpayException("Gateway unavailable"));

            // When / Then
            assertThatThrownBy(() -> paymentService.initiatePayment(paymentRequest))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("verifyPayment")
    class VerifyPaymentTests {

        private PaymentCallbackRequest callbackRequest;

        @BeforeEach
        void setUp() {
            callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_razorpay_001")
                    .razorpaySignature("valid_signature")
                    .paymentMethod("CARD")
                    .build();
        }

        @Test
        @DisplayName("Should return cached response for already-verified payment (idempotency)")
        void shouldReturnCachedResponseForIdempotentCall() {
            // Given
            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(successTransaction));
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");

            // When
            PaymentResponse response = paymentService.verifyPayment(callbackRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(Transaction.PaymentStatus.SUCCESS);
            verify(razorpayService, never()).verifyPaymentSignature(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("Should throw when transaction already completed with different payment ID")
        void shouldThrowForDifferentPaymentIdOnCompletedTransaction() {
            // Given
            PaymentCallbackRequest differentPaymentRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_different_002")
                    .razorpaySignature("some_signature")
                    .build();
            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(successTransaction));

            // When / Then
            assertThatThrownBy(() -> paymentService.verifyPayment(differentPaymentRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("already completed");
        }

        @Test
        @DisplayName("Should fail when transaction not found")
        void shouldFailWhenTransactionNotFound() {
            // Given
            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> paymentService.verifyPayment(callbackRequest))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should mark transaction FAILED and send notification when signature invalid")
        void shouldMarkFailedWhenSignatureInvalid() {
            // Given
            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(initiatedTransaction));
            when(razorpayService.verifyPaymentSignature(anyString(), anyString(), anyString()))
                    .thenReturn(false);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");

            // When / Then
            assertThatThrownBy(() -> paymentService.verifyPayment(callbackRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("signature verification failed");

            verify(paymentNotificationService).sendPaymentFailureNotification(
                    any(Transaction.class), eq("customer@real.com"), eq("+31612345678"), anyString());
        }

        @Test
        @DisplayName("Should verify, update, and notify on successful payment")
        void shouldCompleteVerificationSuccessfully() throws RazorpayException {
            // Given
            Payment razorpayPayment = mock(Payment.class);
            when(razorpayPayment.get("method")).thenReturn("card");

            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(initiatedTransaction));
            when(razorpayService.verifyPaymentSignature(anyString(), anyString(), anyString()))
                    .thenReturn(true);
            when(razorpayService.fetchPayment("pay_razorpay_001")).thenReturn(razorpayPayment);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");
            doNothing().when(orderServiceClient).updateOrderPaymentStatus(anyString(), anyString(), anyString());

            // When
            PaymentResponse response = paymentService.verifyPayment(callbackRequest);

            // Then
            assertThat(response).isNotNull();
            verify(orderServiceClient).updateOrderPaymentStatus(eq("order-123"), eq("PAID"), anyString());
            verify(paymentNotificationService).sendPaymentSuccessNotification(
                    any(Transaction.class), eq("customer@real.com"), eq("+31612345678"));
        }
    }

    @Nested
    @DisplayName("getTransaction")
    class GetTransactionTests {

        @Test
        @DisplayName("Should return transaction by ID")
        void shouldReturnTransactionById() {
            // Given
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");

            // When
            PaymentResponse response = paymentService.getTransaction("txn-001");

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getTransactionId()).isEqualTo("txn-001");
            assertThat(response.getCustomerEmail()).isEqualTo("customer@real.com");
        }

        @Test
        @DisplayName("Should throw when transaction not found by ID")
        void shouldThrowWhenTransactionNotFound() {
            // Given
            when(transactionRepository.findById("nonexistent")).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> paymentService.getTransaction("nonexistent"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Transaction not found");
        }
    }

    @Nested
    @DisplayName("getTransactionByOrderId")
    class GetTransactionByOrderIdTests {

        @Test
        @DisplayName("Should return transaction for a given order ID")
        void shouldReturnTransactionByOrderId() {
            // Given
            when(transactionRepository.findByOrderId("order-123"))
                    .thenReturn(Optional.of(successTransaction));
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");

            // When
            PaymentResponse response = paymentService.getTransactionByOrderId("order-123");

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo("order-123");
        }

        @Test
        @DisplayName("Should throw when no transaction exists for order ID")
        void shouldThrowWhenNoTransactionForOrder() {
            // Given
            when(transactionRepository.findByOrderId("missing-order")).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> paymentService.getTransactionByOrderId("missing-order"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Transaction not found for order");
        }
    }

    @Nested
    @DisplayName("getTransactionsByCustomerId / getTransactionsByStoreId")
    class ListTransactionsTests {

        @Test
        @DisplayName("Should return list of transactions by customer ID")
        void shouldReturnTransactionsByCustomerId() {
            // Given
            when(transactionRepository.findByCustomerId("cust-456"))
                    .thenReturn(List.of(successTransaction));
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");

            // When
            List<PaymentResponse> responses = paymentService.getTransactionsByCustomerId("cust-456");

            // Then
            assertThat(responses).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty list when customer has no transactions")
        void shouldReturnEmptyListWhenNoTransactions() {
            // Given
            when(transactionRepository.findByCustomerId("unknown-cust"))
                    .thenReturn(Collections.emptyList());

            // When
            List<PaymentResponse> responses = paymentService.getTransactionsByCustomerId("unknown-cust");

            // Then
            assertThat(responses).isEmpty();
        }

        @Test
        @DisplayName("Should return transactions by store ID")
        void shouldReturnTransactionsByStoreId() {
            // Given
            when(transactionRepository.findByStoreId("store-789"))
                    .thenReturn(List.of(successTransaction));
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");

            // When
            List<PaymentResponse> responses = paymentService.getTransactionsByStoreId("store-789");

            // Then
            assertThat(responses).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getDailyReconciliation")
    class ReconciliationTests {

        @Test
        @DisplayName("Should calculate reconciliation report correctly")
        void shouldCalculateReconciliationReportCorrectly() {
            // Given
            Transaction successTxn = Transaction.builder()
                    .amount(BigDecimal.valueOf(200.00))
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .reconciled(false)
                    .build();
            successTxn.setPaymentMethod(Transaction.PaymentMethod.UPI);

            Transaction failedTxn = Transaction.builder()
                    .amount(BigDecimal.valueOf(100.00))
                    .status(Transaction.PaymentStatus.FAILED)
                    .reconciled(true)
                    .build();

            Transaction refundedTxn = Transaction.builder()
                    .amount(BigDecimal.valueOf(50.00))
                    .status(Transaction.PaymentStatus.REFUNDED)
                    .reconciled(false)
                    .build();

            when(transactionRepository.findByStoreIdAndCreatedAtBetween(
                    eq("store-789"), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(List.of(successTxn, failedTxn, refundedTxn));

            // When
            ReconciliationReportResponse report = paymentService.getDailyReconciliation(
                    "store-789", LocalDate.of(2026, 2, 15));

            // Then
            assertThat(report.getTotalTransactions()).isEqualTo(3);
            assertThat(report.getSuccessfulTransactions()).isEqualTo(1);
            assertThat(report.getFailedTransactions()).isEqualTo(1);
            assertThat(report.getRefundedTransactions()).isEqualTo(1);
            assertThat(report.getSuccessfulAmount()).isEqualByComparingTo(BigDecimal.valueOf(200.00));
            assertThat(report.getRefundedAmount()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
            assertThat(report.getNetAmount()).isEqualByComparingTo(BigDecimal.valueOf(150.00));
            assertThat(report.getUnreconciledCount()).isEqualTo(2);
            assertThat(report.getPaymentMethodBreakdown()).containsKey("UPI");
        }

        @Test
        @DisplayName("Should return empty report when no transactions exist")
        void shouldReturnEmptyReportWhenNoTransactions() {
            // Given
            when(transactionRepository.findByStoreIdAndCreatedAtBetween(
                    eq("store-789"), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(Collections.emptyList());

            // When
            ReconciliationReportResponse report = paymentService.getDailyReconciliation(
                    "store-789", LocalDate.of(2026, 2, 15));

            // Then
            assertThat(report.getTotalTransactions()).isEqualTo(0);
            assertThat(report.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("markAsReconciled")
    class MarkAsReconciledTests {

        @Test
        @DisplayName("Should mark transaction as reconciled")
        void shouldMarkTransactionAsReconciled() {
            // Given
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(initiatedTransaction));
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);

            // When
            paymentService.markAsReconciled("txn-001", "manager-user");

            // Then
            verify(transactionRepository).save(any(Transaction.class));
            assertThat(initiatedTransaction.isReconciled()).isTrue();
            assertThat(initiatedTransaction.getReconciledBy()).isEqualTo("manager-user");
        }

        @Test
        @DisplayName("Should throw when transaction not found for reconciliation")
        void shouldThrowWhenTransactionNotFoundForReconciliation() {
            // Given
            when(transactionRepository.findById("missing")).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> paymentService.markAsReconciled("missing", "manager"))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("recordCashPayment")
    class RecordCashPaymentTests {

        @Test
        @DisplayName("Should record cash payment successfully for takeaway order")
        void shouldRecordCashPaymentSuccessfully() {
            // Given
            InitiatePaymentRequest cashRequest = InitiatePaymentRequest.builder()
                    .orderId("order-cash-001")
                    .amount(BigDecimal.valueOf(150.00))
                    .customerId("cust-456")
                    .customerEmail("customer@real.com")
                    .customerPhone("+31612345678")
                    .storeId("store-789")
                    .orderType("TAKEAWAY")
                    .build();

            Transaction cashTxn = Transaction.builder()
                    .orderId("order-cash-001")
                    .razorpayOrderId("CASH_order-cash-001")
                    .amount(BigDecimal.valueOf(150.00))
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .customerId("cust-456")
                    .customerEmail("encrypted-email")
                    .customerPhone("encrypted-phone")
                    .storeId("store-789")
                    .currency("INR")
                    .reconciled(false)
                    .build();
            cashTxn.setId("txn-cash-001");
            cashTxn.setPaymentMethod(Transaction.PaymentMethod.CASH);

            when(transactionRepository.findByOrderId("order-cash-001")).thenReturn(Optional.empty());
            when(encryptionService.encrypt("customer@real.com")).thenReturn("encrypted-email");
            when(encryptionService.encrypt("+31612345678")).thenReturn("encrypted-phone");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(cashTxn);
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");

            // When
            PaymentResponse response = paymentService.recordCashPayment(cashRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(Transaction.PaymentStatus.SUCCESS);
            assertThat(response.getPaymentMethod()).isEqualTo(Transaction.PaymentMethod.CASH);
        }

        @Test
        @DisplayName("Should reject cash payment for delivery orders")
        void shouldRejectCashPaymentForDelivery() {
            // Given
            InitiatePaymentRequest deliveryCash = InitiatePaymentRequest.builder()
                    .orderId("order-del-001")
                    .amount(BigDecimal.valueOf(300.00))
                    .customerId("cust-456")
                    .storeId("store-789")
                    .orderType("DELIVERY")
                    .build();

            // When / Then
            assertThatThrownBy(() -> paymentService.recordCashPayment(deliveryCash))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should return existing transaction when payment already exists for order")
        void shouldReturnExistingTransactionIfAlreadyExists() {
            // Given
            InitiatePaymentRequest cashRequest = InitiatePaymentRequest.builder()
                    .orderId("order-123")
                    .amount(BigDecimal.valueOf(500.00))
                    .customerId("cust-456")
                    .storeId("store-789")
                    .orderType("TAKEAWAY")
                    .build();

            when(transactionRepository.findByOrderId("order-123"))
                    .thenReturn(Optional.of(successTransaction));
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");

            // When
            PaymentResponse response = paymentService.recordCashPayment(cashRequest);

            // Then
            assertThat(response).isNotNull();
            verify(transactionRepository, never()).save(any(Transaction.class));
        }

        @Test
        @DisplayName("Should handle orderServiceClient failure gracefully for cash payment")
        void shouldHandleOrderClientFailureGracefully() {
            // Given
            InitiatePaymentRequest cashRequest = InitiatePaymentRequest.builder()
                    .orderId("order-cash-002")
                    .amount(BigDecimal.valueOf(150.00))
                    .customerId("cust-456")
                    .customerEmail("customer@real.com")
                    .customerPhone("+31612345678")
                    .storeId("store-789")
                    .orderType("PICKUP")
                    .build();

            Transaction cashTxn = Transaction.builder()
                    .orderId("order-cash-002")
                    .razorpayOrderId("CASH_order-cash-002")
                    .amount(BigDecimal.valueOf(150.00))
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .customerId("cust-456")
                    .customerEmail("enc-email")
                    .customerPhone("enc-phone")
                    .storeId("store-789")
                    .currency("INR")
                    .reconciled(false)
                    .build();
            cashTxn.setId("txn-cash-002");
            cashTxn.setPaymentMethod(Transaction.PaymentMethod.CASH);

            when(transactionRepository.findByOrderId("order-cash-002")).thenReturn(Optional.empty());
            when(encryptionService.encrypt(anyString())).thenReturn("enc");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(cashTxn);
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");
            doNothing().when(paymentEventPublisher).publishPaymentCompleted(any());
            // orderServiceClient throws — should be caught and logged, not propagated
            org.mockito.Mockito.doThrow(new RuntimeException("Order service down"))
                    .when(orderServiceClient).updateOrderPaymentStatus(anyString(), anyString(), anyString());

            // When — should NOT throw
            PaymentResponse response = paymentService.recordCashPayment(cashRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(Transaction.PaymentStatus.SUCCESS);
        }
    }

    @Nested
    @DisplayName("anonymizeCustomerData")
    class AnonymizeCustomerDataTests {

        @Test
        @DisplayName("Should anonymize all PII fields for given customer")
        void shouldAnonymizeAllTransactionsForCustomer() {
            // Given
            Transaction tx1 = Transaction.builder()
                    .orderId("order-1")
                    .customerEmail("encrypted-email-1")
                    .customerPhone("encrypted-phone-1")
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .build();
            tx1.setId("txn-anon-1");

            Transaction tx2 = Transaction.builder()
                    .orderId("order-2")
                    .customerEmail("encrypted-email-2")
                    .customerPhone("encrypted-phone-2")
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .build();
            tx2.setId("txn-anon-2");

            when(transactionRepository.findByCustomerId("cust-999"))
                    .thenReturn(List.of(tx1, tx2));
            when(encryptionService.encrypt("ANONYMIZED")).thenReturn("anon-encrypted");
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            // When
            paymentService.anonymizeCustomerData("cust-999");

            // Then
            verify(transactionRepository, org.mockito.Mockito.times(2)).save(any(Transaction.class));
            assertThat(tx1.getCustomerEmail()).isEqualTo("anon-encrypted");
            assertThat(tx1.getCustomerPhone()).isEqualTo("anon-encrypted");
            assertThat(tx2.getCustomerEmail()).isEqualTo("anon-encrypted");
        }

        @Test
        @DisplayName("Should do nothing when customer has no transactions")
        void shouldDoNothingWhenNoTransactions() {
            // Given
            when(transactionRepository.findByCustomerId("cust-none"))
                    .thenReturn(Collections.emptyList());

            // When
            paymentService.anonymizeCustomerData("cust-none");

            // Then
            verify(transactionRepository, never()).save(any(Transaction.class));
        }
    }

    @Nested
    @DisplayName("verifyPayment - additional paths")
    class VerifyPaymentAdditionalTests {

        @Test
        @DisplayName("Should use Razorpay method when request paymentMethod is null")
        void shouldUseRazorpayMethodWhenRequestMethodNull() throws com.razorpay.RazorpayException {
            // Given
            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_razorpay_001")
                    .razorpaySignature("valid_signature")
                    .paymentMethod(null) // null — should fall back to Razorpay payment object
                    .build();

            com.razorpay.Payment razorpayPayment = mock(com.razorpay.Payment.class);
            when(razorpayPayment.get("method")).thenReturn("upi");

            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(initiatedTransaction));
            when(razorpayService.verifyPaymentSignature(anyString(), anyString(), anyString()))
                    .thenReturn(true);
            when(razorpayService.fetchPayment("pay_razorpay_001")).thenReturn(razorpayPayment);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");
            doNothing().when(orderServiceClient).updateOrderPaymentStatus(anyString(), anyString(), anyString());

            // When
            PaymentResponse response = paymentService.verifyPayment(callbackRequest);

            // Then
            assertThat(response).isNotNull();
            verify(paymentNotificationService).sendPaymentSuccessNotification(
                    any(Transaction.class), anyString(), anyString());
        }

        @Test
        @DisplayName("Should use OTHER method when Razorpay returns unknown method string")
        void shouldUseOtherMethodWhenRazorpayReturnsUnknown() throws com.razorpay.RazorpayException {
            // Given
            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_razorpay_001")
                    .razorpaySignature("valid_signature")
                    .paymentMethod("UNSUPPORTED_METHOD") // triggers IllegalArgumentException -> OTHER
                    .build();

            com.razorpay.Payment razorpayPayment = mock(com.razorpay.Payment.class);

            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(initiatedTransaction));
            when(razorpayService.verifyPaymentSignature(anyString(), anyString(), anyString()))
                    .thenReturn(true);
            when(razorpayService.fetchPayment("pay_razorpay_001")).thenReturn(razorpayPayment);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");
            doNothing().when(orderServiceClient).updateOrderPaymentStatus(anyString(), anyString(), anyString());

            // When
            PaymentResponse response = paymentService.verifyPayment(callbackRequest);

            // Then
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("Should use OTHER when Razorpay payment method is also unknown string")
        void shouldUseOtherWhenRazorpayPaymentMethodUnknown() throws com.razorpay.RazorpayException {
            // Given
            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_razorpay_001")
                    .razorpaySignature("valid_signature")
                    .paymentMethod(null)
                    .build();

            com.razorpay.Payment razorpayPayment = mock(com.razorpay.Payment.class);
            when(razorpayPayment.get("method")).thenReturn("unknown_gateway_method");

            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(initiatedTransaction));
            when(razorpayService.verifyPaymentSignature(anyString(), anyString(), anyString()))
                    .thenReturn(true);
            when(razorpayService.fetchPayment("pay_razorpay_001")).thenReturn(razorpayPayment);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");
            doNothing().when(orderServiceClient).updateOrderPaymentStatus(anyString(), anyString(), anyString());

            // When
            PaymentResponse response = paymentService.verifyPayment(callbackRequest);

            // Then
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("Should handle null method from Razorpay payment object")
        void shouldHandleNullMethodFromRazorpay() throws com.razorpay.RazorpayException {
            // Given
            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_razorpay_001")
                    .razorpaySignature("valid_signature")
                    .paymentMethod(null)
                    .build();

            com.razorpay.Payment razorpayPayment = mock(com.razorpay.Payment.class);
            when(razorpayPayment.get("method")).thenReturn(null);

            when(transactionRepository.findByRazorpayOrderId("order_razorpay_001"))
                    .thenReturn(Optional.of(initiatedTransaction));
            when(razorpayService.verifyPaymentSignature(anyString(), anyString(), anyString()))
                    .thenReturn(true);
            when(razorpayService.fetchPayment("pay_razorpay_001")).thenReturn(razorpayPayment);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");
            doNothing().when(orderServiceClient).updateOrderPaymentStatus(anyString(), anyString(), anyString());

            // When — should not throw
            PaymentResponse response = paymentService.verifyPayment(callbackRequest);

            // Then
            assertThat(response).isNotNull();
        }
    }

    @Nested
    @DisplayName("initiatePayment - additional paths")
    class InitiatePaymentAdditionalTests {

        @Test
        @DisplayName("Should allow re-initiation when existing transaction is not SUCCESS")
        void shouldAllowReInitiationWhenExistingIsNotSuccess() throws Exception {
            // Given — existing INITIATED transaction (not SUCCESS) should NOT block
            when(transactionRepository.findByOrderId("order-123"))
                    .thenReturn(Optional.of(initiatedTransaction)); // INITIATED status

            when(paymentGatewayResolver.resolve(null)).thenReturn(razorpayGateway);
            when(razorpayGateway.initiatePayment(any()))
                    .thenReturn(new GatewayPaymentResult("RAZORPAY", "order_razorpay_002", null, "rzp_test_key"));
            when(encryptionService.encrypt(anyString())).thenReturn("encrypted");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(initiatedTransaction);
            when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");
            when(encryptionService.decrypt("encrypted-email")).thenReturn("customer@real.com");
            when(encryptionService.decrypt("encrypted-phone")).thenReturn("+31612345678");

            // When
            PaymentResponse response = paymentService.initiatePayment(paymentRequest);

            // Then
            assertThat(response).isNotNull();
        }
    }

    @Nested
    @DisplayName("verifyPayment - Stripe guard")
    class VerifyPaymentStripeGuardTests {

        @Test
        @DisplayName("Should reject /verify for Stripe transactions — must confirm via webhook")
        void shouldRejectVerifyForStripeTransaction() {
            // Given
            Transaction stripeTxn = Transaction.builder()
                    .orderId("order-de-001")
                    .stripePaymentIntentId("pi_123")
                    .paymentGateway("STRIPE")
                    .amount(BigDecimal.valueOf(45.00))
                    .status(Transaction.PaymentStatus.INITIATED)
                    .build();
            stripeTxn.setId("txn-de-001");
            stripeTxn.setRazorpayOrderId(null);

            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("pi_123")
                    .razorpayPaymentId("ch_123")
                    .razorpaySignature("n/a")
                    .build();

            when(transactionRepository.findByRazorpayOrderId("pi_123"))
                    .thenReturn(Optional.of(stripeTxn));

            // When / Then
            assertThatThrownBy(() -> paymentService.verifyPayment(callbackRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Stripe");
        }
    }

    @Nested
    @DisplayName("handleStripeWebhookEvent")
    class HandleStripeWebhookEventTests {

        private Transaction stripeTxn;

        @BeforeEach
        void setUp() {
            stripeTxn = Transaction.builder()
                    .orderId("order-de-001")
                    .stripePaymentIntentId("pi_123")
                    .paymentGateway("STRIPE")
                    .amount(BigDecimal.valueOf(45.00))
                    .status(Transaction.PaymentStatus.INITIATED)
                    .customerEmail("encrypted-email")
                    .customerPhone("encrypted-phone")
                    .currency("EUR")
                    .build();
            stripeTxn.setId("txn-de-001");
        }

        @Test
        @DisplayName("Should mark transaction SUCCESS and publish event on payment_intent.succeeded")
        void shouldHandlePaymentCaptured() {
            // Given
            GatewayWebhookResult result = new GatewayWebhookResult(
                    GatewayWebhookResult.EventType.PAYMENT_CAPTURED, "pi_123", "ch_123", null, 150L, "ideal");

            when(transactionRepository.findByStripePaymentIntentId("pi_123"))
                    .thenReturn(Optional.of(stripeTxn));
            when(transactionRepository.save(any(Transaction.class))).thenReturn(stripeTxn);
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");

            // When
            paymentService.handleStripeWebhookEvent(result);

            // Then
            assertThat(stripeTxn.getStatus()).isEqualTo(Transaction.PaymentStatus.SUCCESS);
            assertThat(stripeTxn.getStripeFeeMinorUnits()).isEqualTo(150L);
            assertThat(stripeTxn.getPaymentMethodType()).isEqualTo("ideal");
            assertThat(stripeTxn.getPaymentMethod()).isEqualTo(Transaction.PaymentMethod.OTHER);
            verify(orderServiceClient).updateOrderPaymentStatus("order-de-001", "PAID", "txn-de-001");
            verify(paymentEventPublisher).publishPaymentCompleted(any());
        }

        @Test
        @DisplayName("Should be idempotent — duplicate payment_intent.succeeded webhook is a no-op")
        void shouldIgnoreDuplicateCapturedWebhook() {
            // Given — transaction already SUCCESS (Stripe retried the webhook)
            stripeTxn.setStatus(Transaction.PaymentStatus.SUCCESS);
            GatewayWebhookResult result = new GatewayWebhookResult(
                    GatewayWebhookResult.EventType.PAYMENT_CAPTURED, "pi_123", "ch_123", null, 150L);

            when(transactionRepository.findByStripePaymentIntentId("pi_123"))
                    .thenReturn(Optional.of(stripeTxn));

            // When
            paymentService.handleStripeWebhookEvent(result);

            // Then — no save, no order update, no duplicate notification/event
            verify(transactionRepository, never()).save(any(Transaction.class));
            verify(orderServiceClient, never()).updateOrderPaymentStatus(anyString(), anyString(), anyString());
            verify(paymentEventPublisher, never()).publishPaymentCompleted(any());
        }

        @Test
        @DisplayName("Should mark transaction FAILED and publish failure event on payment_intent.payment_failed")
        void shouldHandlePaymentFailed() {
            // Given
            GatewayWebhookResult result = new GatewayWebhookResult(
                    GatewayWebhookResult.EventType.PAYMENT_FAILED, "pi_123", null, "card_declined", null);

            when(transactionRepository.findByStripePaymentIntentId("pi_123"))
                    .thenReturn(Optional.of(stripeTxn));
            when(transactionRepository.save(any(Transaction.class))).thenReturn(stripeTxn);
            when(encryptionService.decrypt(anyString())).thenReturn("decrypted");

            // When
            paymentService.handleStripeWebhookEvent(result);

            // Then
            assertThat(stripeTxn.getStatus()).isEqualTo(Transaction.PaymentStatus.FAILED);
            assertThat(stripeTxn.getErrorDescription()).isEqualTo("card_declined");
            verify(paymentEventPublisher).publishPaymentFailed(any());
        }

        @Test
        @DisplayName("Should ignore webhook when no matching transaction exists")
        void shouldIgnoreWebhookWhenTransactionNotFound() {
            // Given
            GatewayWebhookResult result = new GatewayWebhookResult(
                    GatewayWebhookResult.EventType.PAYMENT_CAPTURED, "pi_unknown", "ch_999", null, null);

            when(transactionRepository.findByStripePaymentIntentId("pi_unknown"))
                    .thenReturn(Optional.empty());

            // When
            paymentService.handleStripeWebhookEvent(result);

            // Then
            verify(transactionRepository, never()).save(any(Transaction.class));
        }
    }
}
