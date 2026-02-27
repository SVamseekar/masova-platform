package com.MaSoVa.payment.service;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
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
    }

    @Nested
    @DisplayName("initiatePayment")
    class InitiatePaymentTests {

        @Test
        @DisplayName("Should initiate payment successfully for a valid request")
        void shouldInitiatePaymentSuccessfully() throws RazorpayException {
            // Given
            Order razorpayOrder = mock(Order.class);
            when(razorpayOrder.get("id")).thenReturn("order_razorpay_001");
            when(transactionRepository.findByOrderId("order-123")).thenReturn(Optional.empty());
            when(razorpayService.createOrder(any(BigDecimal.class), eq("order-123"), anyString()))
                    .thenReturn(razorpayOrder);
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
            verify(transactionRepository).save(any(Transaction.class));
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
        void shouldWrapRazorpayException() throws RazorpayException {
            // Given
            when(transactionRepository.findByOrderId("order-123")).thenReturn(Optional.empty());
            when(razorpayService.createOrder(any(), anyString(), anyString()))
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
    }
}
