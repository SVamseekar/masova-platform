package com.MaSoVa.payment.service;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefundService Unit Tests")
class RefundServiceTest {

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private RazorpayService razorpayService;

    @Mock
    private OrderServiceClient orderServiceClient;

    @InjectMocks
    private RefundService refundService;

    private Transaction successTransaction;
    private RefundRequest refundRequest;
    private Refund savedRefund;

    @BeforeEach
    void setUp() {
        successTransaction = Transaction.builder()
                .orderId("order-123")
                .razorpayOrderId("order_razorpay_001")
                .amount(BigDecimal.valueOf(500.00))
                .status(Transaction.PaymentStatus.SUCCESS)
                .customerId("cust-456")
                .storeId("store-789")
                .currency("INR")
                .reconciled(false)
                .build();
        successTransaction.setId("txn-001");
        successTransaction.setRazorpayPaymentId("pay_razorpay_001");

        refundRequest = RefundRequest.builder()
                .transactionId("txn-001")
                .amount(BigDecimal.valueOf(200.00))
                .type(Refund.RefundType.PARTIAL)
                .reason("Customer requested partial refund")
                .initiatedBy("manager-001")
                .speed("normal")
                .notes("Partial refund for missing item")
                .build();

        savedRefund = Refund.builder()
                .transactionId("txn-001")
                .orderId("order-123")
                .razorpayRefundId("rfnd_razorpay_001")
                .razorpayPaymentId("pay_razorpay_001")
                .amount(BigDecimal.valueOf(200.00))
                .status(Refund.RefundStatus.INITIATED)
                .type(Refund.RefundType.PARTIAL)
                .reason("Customer requested partial refund")
                .initiatedBy("manager-001")
                .customerId("cust-456")
                .speed("normal")
                .notes("Partial refund for missing item")
                .build();
        savedRefund.setId("refund-001");
    }

    @Nested
    @DisplayName("initiateRefund")
    class InitiateRefundTests {

        @Test
        @DisplayName("Should initiate a partial refund successfully")
        void shouldInitiatePartialRefundSuccessfully() throws RazorpayException {
            // Given
            JSONObject razorpayRefundResponse = new JSONObject();
            razorpayRefundResponse.put("id", "rfnd_razorpay_001");
            razorpayRefundResponse.put("status", "processing");

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(razorpayService.createRefund("pay_razorpay_001", BigDecimal.valueOf(200.00), "normal"))
                    .thenReturn(razorpayRefundResponse);
            when(refundRepository.save(any(Refund.class))).thenReturn(savedRefund);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(successTransaction);

            // When
            Refund result = refundService.initiateRefund(refundRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRazorpayRefundId()).isEqualTo("rfnd_razorpay_001");
            assertThat(result.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(200.00));
            verify(orderServiceClient).updateOrderPaymentStatus("order-123", "REFUNDED", "txn-001");
        }

        @Test
        @DisplayName("Should throw when transaction not found")
        void shouldThrowWhenTransactionNotFound() {
            // Given
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should throw when transaction status is not SUCCESS")
        void shouldThrowWhenTransactionNotSuccess() {
            // Given
            Transaction failedTxn = Transaction.builder()
                    .status(Transaction.PaymentStatus.FAILED)
                    .build();
            failedTxn.setId("txn-001");

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(failedTxn));

            // When / Then
            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot refund transaction with status");
        }

        @Test
        @DisplayName("Should throw when refund amount exceeds transaction amount")
        void shouldThrowWhenRefundAmountExceedsTransactionAmount() {
            // Given
            RefundRequest largeRefund = RefundRequest.builder()
                    .transactionId("txn-001")
                    .amount(BigDecimal.valueOf(999.00))
                    .type(Refund.RefundType.FULL)
                    .reason("Test")
                    .initiatedBy("manager-001")
                    .build();

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));

            // When / Then
            assertThatThrownBy(() -> refundService.initiateRefund(largeRefund))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Refund amount cannot exceed transaction amount");
        }

        @Test
        @DisplayName("Should throw when refund amount exceeds available refund amount after prior refunds")
        void shouldThrowWhenExceedsAvailableRefundAmount() {
            // Given
            Refund existingRefund = Refund.builder()
                    .amount(BigDecimal.valueOf(400.00))
                    .status(Refund.RefundStatus.PROCESSED)
                    .build();

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(List.of(existingRefund));

            // When / Then
            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Refund amount exceeds available amount");
        }

        @Test
        @DisplayName("Should mark refund as PROCESSED when Razorpay returns processed status")
        void shouldMarkRefundProcessedWhenRazorpayReturnsProcessed() throws RazorpayException {
            // Given
            JSONObject razorpayRefundResponse = new JSONObject();
            razorpayRefundResponse.put("id", "rfnd_razorpay_002");
            razorpayRefundResponse.put("status", "processed");

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(razorpayService.createRefund(anyString(), any(), anyString()))
                    .thenReturn(razorpayRefundResponse);
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
            when(transactionRepository.save(any(Transaction.class))).thenReturn(successTransaction);

            // When
            Refund result = refundService.initiateRefund(refundRequest);

            // Then
            assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
        }

        @Test
        @DisplayName("Should wrap RazorpayException in RuntimeException")
        void shouldWrapRazorpayException() throws RazorpayException {
            // Given
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(razorpayService.createRefund(anyString(), any(), anyString()))
                    .thenThrow(new RazorpayException("Gateway error"));

            // When / Then
            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("getRefund")
    class GetRefundTests {

        @Test
        @DisplayName("Should return refund by ID")
        void shouldReturnRefundById() {
            // Given
            when(refundRepository.findById("refund-001")).thenReturn(Optional.of(savedRefund));

            // When
            Refund result = refundService.getRefund("refund-001");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo("refund-001");
        }

        @Test
        @DisplayName("Should throw when refund not found")
        void shouldThrowWhenRefundNotFound() {
            // Given
            when(refundRepository.findById("missing")).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> refundService.getRefund("missing"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Refund not found");
        }
    }

    @Nested
    @DisplayName("getRefundsByTransactionId / getRefundsByOrderId / getRefundsByCustomerId")
    class ListRefundsTests {

        @Test
        @DisplayName("Should return refunds by transaction ID")
        void shouldReturnRefundsByTransactionId() {
            // Given
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(List.of(savedRefund));

            // When
            List<Refund> results = refundService.getRefundsByTransactionId("txn-001");

            // Then
            assertThat(results).hasSize(1);
        }

        @Test
        @DisplayName("Should return refunds by order ID")
        void shouldReturnRefundsByOrderId() {
            // Given
            when(refundRepository.findByOrderId("order-123")).thenReturn(List.of(savedRefund));

            // When
            List<Refund> results = refundService.getRefundsByOrderId("order-123");

            // Then
            assertThat(results).hasSize(1);
        }

        @Test
        @DisplayName("Should return refunds by customer ID")
        void shouldReturnRefundsByCustomerId() {
            // Given
            when(refundRepository.findByCustomerId("cust-456")).thenReturn(List.of(savedRefund));

            // When
            List<Refund> results = refundService.getRefundsByCustomerId("cust-456");

            // Then
            assertThat(results).hasSize(1);
        }
    }

    @Nested
    @DisplayName("updateRefundStatus")
    class UpdateRefundStatusTests {

        @Test
        @DisplayName("Should update refund status to PROCESSED")
        void shouldUpdateRefundStatusToProcessed() {
            // Given
            Refund refund = Refund.builder()
                    .status(Refund.RefundStatus.PROCESSING)
                    .build();
            refund.setId("refund-001");

            when(refundRepository.findByRazorpayRefundId("rfnd_razorpay_001"))
                    .thenReturn(Optional.of(refund));
            when(refundRepository.save(any(Refund.class))).thenReturn(refund);

            // When
            refundService.updateRefundStatus("rfnd_razorpay_001", "processed");

            // Then
            assertThat(refund.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
            assertThat(refund.getProcessedAt()).isNotNull();
            verify(refundRepository).save(refund);
        }

        @Test
        @DisplayName("Should update refund status to FAILED")
        void shouldUpdateRefundStatusToFailed() {
            // Given
            Refund refund = Refund.builder()
                    .status(Refund.RefundStatus.PROCESSING)
                    .build();

            when(refundRepository.findByRazorpayRefundId("rfnd_razorpay_001"))
                    .thenReturn(Optional.of(refund));
            when(refundRepository.save(any(Refund.class))).thenReturn(refund);

            // When
            refundService.updateRefundStatus("rfnd_razorpay_001", "failed");

            // Then
            assertThat(refund.getStatus()).isEqualTo(Refund.RefundStatus.FAILED);
        }

        @Test
        @DisplayName("Should ignore unknown refund status without saving")
        void shouldIgnoreUnknownRefundStatus() {
            // Given
            Refund refund = Refund.builder()
                    .status(Refund.RefundStatus.PROCESSING)
                    .build();

            when(refundRepository.findByRazorpayRefundId("rfnd_razorpay_001"))
                    .thenReturn(Optional.of(refund));

            // When
            refundService.updateRefundStatus("rfnd_razorpay_001", "unknown_status");

            // Then
            verify(refundRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when refund not found by Razorpay refund ID")
        void shouldThrowWhenRefundNotFoundByRazorpayId() {
            // Given
            when(refundRepository.findByRazorpayRefundId("rfnd_missing"))
                    .thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> refundService.updateRefundStatus("rfnd_missing", "processed"))
                    .isInstanceOf(RuntimeException.class);
        }
    }
}
