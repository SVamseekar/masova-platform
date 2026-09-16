package com.MaSoVa.payment.unit.service;

import com.MaSoVa.payment.service.RefundService;
import com.MaSoVa.payment.service.OrderServiceClient;
import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
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
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefundService Unit Tests")
class RefundServiceTest {

    @Mock private RefundRepository refundRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private PaymentGatewayResolver paymentGatewayResolver;
    @Mock private PaymentGateway paymentGateway;
    @Mock private OrderServiceClient orderServiceClient;

    @InjectMocks
    private RefundService refundService;

    private Transaction successTransaction;
    private RefundRequest refundRequest;

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
                .paymentGateway("RAZORPAY")
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
    }

    @Nested
    @DisplayName("initiateRefund")
    class InitiateRefundTests {

        @Test
        @DisplayName("Should initiate a partial Razorpay refund successfully")
        void shouldInitiatePartialRefundSuccessfully() throws Exception {
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
            when(paymentGateway.getGatewayName()).thenReturn("RAZORPAY");
            when(paymentGateway.refund("pay_razorpay_001", BigDecimal.valueOf(200.00), "normal"))
                    .thenReturn("rfnd_razorpay_001");
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> {
                Refund r = inv.getArgument(0);
                r.setId("refund-001");
                return r;
            });
            when(transactionRepository.save(any(Transaction.class))).thenReturn(successTransaction);

            Refund result = refundService.initiateRefund(refundRequest);

            assertThat(result).isNotNull();
            assertThat(result.getRazorpayRefundId()).isEqualTo("rfnd_razorpay_001");
            assertThat(result.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(200.00));
            assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSING);
            verify(orderServiceClient).updateOrderPaymentStatus("order-123", "REFUNDED", "txn-001");
        }

        @Test
        @DisplayName("Should refund Stripe PaymentIntent via Stripe gateway")
        void shouldRefundStripeTransaction() throws Exception {
            Transaction stripeTxn = Transaction.builder()
                    .orderId("order-de-1")
                    .amount(BigDecimal.valueOf(42.50))
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .customerId("cust-de")
                    .storeId("DOM001")
                    .currency("EUR")
                    .paymentGateway("STRIPE")
                    .stripePaymentIntentId("pi_test_de")
                    .reconciled(false)
                    .build();
            stripeTxn.setId("txn-stripe");
            stripeTxn.setRazorpayPaymentId("ch_test_de");

            RefundRequest req = RefundRequest.builder()
                    .transactionId("txn-stripe")
                    .amount(BigDecimal.valueOf(42.50))
                    .type(Refund.RefundType.FULL)
                    .reason("Customer cancelled")
                    .initiatedBy("manager-berlin")
                    .speed("normal")
                    .build();

            when(transactionRepository.findById("txn-stripe")).thenReturn(Optional.of(stripeTxn));
            when(refundRepository.findByTransactionId("txn-stripe")).thenReturn(Collections.emptyList());
            when(paymentGatewayResolver.resolveByGatewayName("STRIPE")).thenReturn(paymentGateway);
            when(paymentGateway.getGatewayName()).thenReturn("STRIPE");
            when(paymentGateway.refund("pi_test_de", BigDecimal.valueOf(42.50), "normal"))
                    .thenReturn("re_stripe_001");
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
            when(transactionRepository.save(any(Transaction.class))).thenReturn(stripeTxn);

            Refund result = refundService.initiateRefund(req);

            assertThat(result.getRazorpayRefundId()).isEqualTo("re_stripe_001");
            assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
            assertThat(result.getStoreId()).isEqualTo("DOM001");
            verify(paymentGateway).refund("pi_test_de", BigDecimal.valueOf(42.50), "normal");
        }

        @Test
        @DisplayName("Should process cash/synthetic refund without calling PSP")
        void shouldSyntheticRefundCash() {
            Transaction cash = Transaction.builder()
                    .orderId("order-cash")
                    .razorpayOrderId("CASH_order-cash")
                    .amount(BigDecimal.valueOf(15.00))
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .customerId("walk-in")
                    .storeId("DOM001")
                    .currency("EUR")
                    .paymentGateway("CASH")
                    .reconciled(false)
                    .build();
            cash.setId("txn-cash");
            cash.setPaymentMethod(Transaction.PaymentMethod.CASH);

            RefundRequest req = RefundRequest.builder()
                    .transactionId("txn-cash")
                    .amount(BigDecimal.valueOf(15.00))
                    .type(Refund.RefundType.FULL)
                    .reason("Wrong order")
                    .initiatedBy("manager-1")
                    .build();

            when(transactionRepository.findById("txn-cash")).thenReturn(Optional.of(cash));
            when(refundRepository.findByTransactionId("txn-cash")).thenReturn(Collections.emptyList());
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
            when(transactionRepository.save(any(Transaction.class))).thenReturn(cash);

            Refund result = refundService.initiateRefund(req);

            assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
            assertThat(result.getRazorpayRefundId()).startsWith("syn_rfnd_");
            verifyNoInteractions(paymentGatewayResolver);
        }

        @Test
        @DisplayName("Should throw when transaction not found")
        void shouldThrowWhenTransactionNotFound() {
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should throw when transaction status is not SUCCESS")
        void shouldThrowWhenTransactionNotSuccess() {
            Transaction failedTxn = Transaction.builder()
                    .status(Transaction.PaymentStatus.FAILED)
                    .build();
            failedTxn.setId("txn-001");

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(failedTxn));

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot refund transaction with status");
        }

        @Test
        @DisplayName("Should throw when refund amount exceeds transaction amount")
        void shouldThrowWhenRefundAmountExceedsTransactionAmount() {
            RefundRequest largeRefund = RefundRequest.builder()
                    .transactionId("txn-001")
                    .amount(BigDecimal.valueOf(999.00))
                    .type(Refund.RefundType.FULL)
                    .reason("Test")
                    .initiatedBy("manager-001")
                    .build();

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));

            assertThatThrownBy(() -> refundService.initiateRefund(largeRefund))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Refund amount cannot exceed transaction amount");
        }

        @Test
        @DisplayName("Should throw when refund amount exceeds available refund amount after prior refunds")
        void shouldThrowWhenExceedsAvailableRefundAmount() {
            Refund existingRefund = Refund.builder()
                    .amount(BigDecimal.valueOf(400.00))
                    .status(Refund.RefundStatus.PROCESSED)
                    .build();

            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(List.of(existingRefund));

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Refund amount exceeds available amount");
        }

        @Test
        @DisplayName("Should wrap gateway failures")
        void shouldWrapGatewayException() throws Exception {
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
            when(paymentGateway.refund(anyString(), any(), anyString()))
                    .thenThrow(new RuntimeException("Gateway error"));

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
            Refund saved = Refund.builder().transactionId("txn-001").build();
            saved.setId("refund-001");
            when(refundRepository.findById("refund-001")).thenReturn(Optional.of(saved));

            Refund result = refundService.getRefund("refund-001");

            assertThat(result.getId()).isEqualTo("refund-001");
        }

        @Test
        @DisplayName("Should throw when refund not found")
        void shouldThrowWhenRefundNotFound() {
            when(refundRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> refundService.getRefund("missing"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Refund not found");
        }
    }

    @Nested
    @DisplayName("list helpers")
    class ListRefundsTests {

        @Test
        @DisplayName("Should return refunds by store and status")
        void shouldReturnByStoreAndStatus() {
            when(refundRepository.findByStoreIdAndStatus("DOM001", Refund.RefundStatus.PENDING_APPROVAL))
                    .thenReturn(List.of(new Refund()));

            assertThat(refundService.getRefundsByStoreIdAndStatus("DOM001", Refund.RefundStatus.PENDING_APPROVAL))
                    .hasSize(1);
        }
    }

    @Nested
    @DisplayName("updateRefundStatus")
    class UpdateRefundStatusTests {

        @Test
        @DisplayName("Should update refund status to PROCESSED")
        void shouldUpdateRefundStatusToProcessed() {
            Refund refund = Refund.builder()
                    .status(Refund.RefundStatus.PROCESSING)
                    .build();
            refund.setId("refund-001");

            when(refundRepository.findByRazorpayRefundId("rfnd_razorpay_001"))
                    .thenReturn(Optional.of(refund));
            when(refundRepository.save(any(Refund.class))).thenReturn(refund);

            refundService.updateRefundStatus("rfnd_razorpay_001", "processed");

            assertThat(refund.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
            assertThat(refund.getProcessedAt()).isNotNull();
            verify(refundRepository).save(refund);
        }

        @Test
        @DisplayName("Should accept Stripe succeeded status")
        void shouldAcceptSucceeded() {
            Refund refund = Refund.builder().status(Refund.RefundStatus.PROCESSING).build();
            when(refundRepository.findByRazorpayRefundId("re_1")).thenReturn(Optional.of(refund));
            when(refundRepository.save(any(Refund.class))).thenReturn(refund);

            refundService.updateRefundStatus("re_1", "succeeded");

            assertThat(refund.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
        }
    }
}
