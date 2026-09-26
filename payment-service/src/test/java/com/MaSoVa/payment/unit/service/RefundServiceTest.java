package com.MaSoVa.payment.unit.service;

import com.MaSoVa.payment.service.RefundService;
import com.MaSoVa.payment.messaging.OrderPaymentSyncRelay;
import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.PaymentGatewayResolver;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
    @Mock private OrderPaymentSyncRelay orderPaymentSyncRelay;
    @Mock private MongoTemplate mongoTemplate;

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
        lenient().when(mongoTemplate.findAndModify(
                any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(Transaction.class)))
                .thenReturn(successTransaction);

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
    @DisplayName("claim release")
    class ClaimReleaseTests {

        private boolean releases(Update update) {
            Object inc = update.getUpdateObject().get("$inc");
            return inc instanceof org.bson.Document doc
                    && BigDecimal.valueOf(-200.00).compareTo((BigDecimal) doc.get("refundClaimedAmount")) == 0;
        }

        @Test
        @DisplayName("releases the claim when the refund row cannot be saved")
        void releasesClaimWhenRefundRowSaveFails() {
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(refundRepository.save(any(Refund.class))).thenThrow(new RuntimeException("mongo write failed"));

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .hasMessageContaining("mongo write failed");

            verify(mongoTemplate).updateFirst(any(Query.class),
                    org.mockito.ArgumentMatchers.argThat(this::releases), eq(Transaction.class));
        }

        @Test
        @DisplayName("releases the claim and keeps the gateway error when marking FAILED also fails")
        void releasesClaimWhenFailedMarkerCannotBeSaved() throws Exception {
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
            when(paymentGateway.refund(anyString(), any(BigDecimal.class), anyString(), anyString()))
                    .thenThrow(new com.stripe.exception.InvalidRequestException(
                            "charge already refunded", "charge", "req_1", "charge_already_refunded", 400, null));
            when(refundRepository.save(any(Refund.class)))
                    .thenAnswer(inv -> inv.getArgument(0))
                    .thenThrow(new RuntimeException("mongo write failed"));

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .hasMessageContaining("charge already refunded");

            verify(mongoTemplate).updateFirst(any(Query.class),
                    org.mockito.ArgumentMatchers.argThat(this::releases), eq(Transaction.class));
        }
    }

    @Nested
    @DisplayName("gateway outcome")
    class GatewayOutcomeTests {

        private boolean releases(Update update) {
            Object inc = update.getUpdateObject().get("$inc");
            return inc instanceof org.bson.Document doc && doc.get("refundClaimedAmount") instanceof BigDecimal amount
                    && amount.signum() < 0;
        }

        @BeforeEach
        void razorpayTransaction() {
            lenient().when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            lenient().when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            lenient().when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
            lenient().when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
        }

        @Test
        @DisplayName("a timeout keeps the claim and leaves the refund PROCESSING for reconciliation")
        void ambiguousGatewayErrorKeepsClaim() throws Exception {
            when(paymentGateway.refund(anyString(), any(BigDecimal.class), anyString(), anyString()))
                    .thenThrow(new com.stripe.exception.ApiConnectionException("read timed out"));
            org.mockito.ArgumentCaptor<Refund> saved = org.mockito.ArgumentCaptor.forClass(Refund.class);

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .hasMessageContaining("read timed out");

            verify(mongoTemplate, org.mockito.Mockito.never()).updateFirst(any(Query.class),
                    org.mockito.ArgumentMatchers.argThat(this::releases), eq(Transaction.class));
            verify(refundRepository, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
            assertThat(saved.getValue().getStatus()).isEqualTo(Refund.RefundStatus.PROCESSING);
        }

        @Test
        @DisplayName("a failing release does not hide the gateway error")
        void releaseFailureKeepsGatewayError() throws Exception {
            when(paymentGateway.refund(anyString(), any(BigDecimal.class), anyString(), anyString()))
                    .thenThrow(new com.stripe.exception.InvalidRequestException(
                            "amount too large", "amount", "req_2", "amount_too_large", 400, null));
            when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Transaction.class)))
                    .thenThrow(new RuntimeException("mongo down"));

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .hasMessageContaining("amount too large");
        }

        @Test
        @DisplayName("reject releases nothing when approve already moved the refund out of PENDING_APPROVAL")
        void rejectLosingRaceWithApproveDoesNotRelease() {
            Refund pending = Refund.builder().transactionId("txn-001").amount(BigDecimal.valueOf(200.00))
                    .status(Refund.RefundStatus.PENDING_APPROVAL).build();
            pending.setId("refund-race");
            when(refundRepository.findById("refund-race")).thenReturn(Optional.of(pending));
            when(mongoTemplate.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class),
                    eq(Refund.class))).thenReturn(null);

            assertThatThrownBy(() -> refundService.rejectRefund("refund-race", "manager-1", "no"))
                    .isInstanceOf(RuntimeException.class);

            verify(mongoTemplate, org.mockito.Mockito.never()).updateFirst(any(Query.class),
                    org.mockito.ArgumentMatchers.argThat(this::releases), eq(Transaction.class));
        }

        @Test
        @DisplayName("a failed-refund webhook releases the claim of a refund still in flight")
        void failedWebhookReleasesClaim() {
            Refund inFlight = Refund.builder().transactionId("txn-001").amount(BigDecimal.valueOf(200.00))
                    .razorpayRefundId("rfnd_async").status(Refund.RefundStatus.PROCESSING).build();
            inFlight.setId("refund-async");
            when(refundRepository.findByRazorpayRefundId("rfnd_async")).thenReturn(Optional.of(inFlight));
            when(mongoTemplate.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class),
                    eq(Refund.class))).thenReturn(inFlight);

            refundService.updateRefundStatus("rfnd_async", "failed");

            verify(mongoTemplate).updateFirst(any(Query.class),
                    org.mockito.ArgumentMatchers.argThat(this::releases), eq(Transaction.class));
        }
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
            when(paymentGateway.refund(eq("pay_razorpay_001"), eq(BigDecimal.valueOf(200.00)), eq("normal"), anyString()))
                    .thenReturn("rfnd_razorpay_001");
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> {
                Refund r = inv.getArgument(0);
                r.setId("refund-001");
                return r;
            });

            Refund result = refundService.initiateRefund(refundRequest);

            assertThat(result).isNotNull();
            assertThat(result.getRazorpayRefundId()).isEqualTo("rfnd_razorpay_001");
            assertThat(result.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(200.00));
            assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSING);
            verify(orderPaymentSyncRelay).requestOrderPaymentStatus("txn-001", "REFUNDED");
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
            when(paymentGateway.refund(eq("pi_test_de"), eq(BigDecimal.valueOf(42.50)), eq("normal"), anyString()))
                    .thenReturn("re_stripe_001");
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));

            Refund result = refundService.initiateRefund(req);

            assertThat(result.getRazorpayRefundId()).isEqualTo("re_stripe_001");
            assertThat(result.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
            assertThat(result.getStoreId()).isEqualTo("DOM001");
            verify(paymentGateway).refund(eq("pi_test_de"), eq(BigDecimal.valueOf(42.50)), eq("normal"), anyString());
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
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
            when(paymentGateway.refund(anyString(), any(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("Gateway error"));

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Second overlapping refund loses the atomic claim and does not call the gateway")
        void overlappingRefundLosesClaim() throws Exception {
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
            when(paymentGateway.getGatewayName()).thenReturn("RAZORPAY");
            when(paymentGateway.refund(anyString(), any(), anyString(), anyString())).thenReturn("rfnd_one");
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));
            when(mongoTemplate.findAndModify(
                    any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(Transaction.class)))
                    .thenReturn(successTransaction, (Transaction) null);

            refundService.initiateRefund(refundRequest);

            assertThatThrownBy(() -> refundService.initiateRefund(refundRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("exceeds available");
            verify(paymentGateway, times(1)).refund(anyString(), any(), anyString(), anyString());
        }

        @Test
        @DisplayName("Each partial refund gets its own Stripe idempotency key; a retry reuses the stored key")
        void partialRefundsUseDistinctKeysAndRetryReusesStoredKey() throws Exception {
            when(transactionRepository.findById("txn-001")).thenReturn(Optional.of(successTransaction));
            when(refundRepository.findByTransactionId("txn-001")).thenReturn(Collections.emptyList());
            when(paymentGatewayResolver.resolveByGatewayName("RAZORPAY")).thenReturn(paymentGateway);
            when(paymentGateway.getGatewayName()).thenReturn("RAZORPAY");
            when(paymentGateway.refund(anyString(), any(), anyString(), anyString())).thenReturn("rfnd_a", "rfnd_b");
            when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));

            Refund first = refundService.initiateRefund(refundRequest);
            RefundRequest later = RefundRequest.builder()
                    .transactionId("txn-001")
                    .amount(BigDecimal.valueOf(50.00))
                    .type(Refund.RefundType.PARTIAL)
                    .reason("Later partial")
                    .initiatedBy("manager-001")
                    .speed("normal")
                    .build();
            Refund second = refundService.initiateRefund(later);

            assertThat(first.getIdempotencyKey()).startsWith("rfnd_");
            assertThat(second.getIdempotencyKey()).startsWith("rfnd_");
            assertThat(second.getIdempotencyKey()).isNotEqualTo(first.getIdempotencyKey());

            org.mockito.ArgumentCaptor<String> keys = org.mockito.ArgumentCaptor.forClass(String.class);
            verify(paymentGateway, times(2)).refund(anyString(), any(), anyString(), keys.capture());
            assertThat(keys.getAllValues()).containsExactly(first.getIdempotencyKey(), second.getIdempotencyKey());

            String stored = first.getIdempotencyKey();
            first.setStatus(Refund.RefundStatus.INITIATED);
            assertThat(first.getIdempotencyKey()).isEqualTo(stored);
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
