package com.MaSoVa.payment.integration.service;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.StripeGateway;
import com.MaSoVa.payment.repository.RefundRepository;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.service.OrderServiceClient;
import com.MaSoVa.payment.service.RefundService;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Refund capacity claim against a real MongoDB (#124).
 * Unit tests mock MongoTemplate and cannot see how BigDecimal is stored.
 */
@DisplayName("Refund capacity claim (real MongoDB)")
class RefundClaimIT extends BaseFullIntegrationTest {

    @Autowired
    private RefundService refundService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private com.MaSoVa.payment.config.MoneyFieldMigration moneyFieldMigration;

    @MockitoBean
    private StripeGateway stripeGateway;

    @MockitoBean
    private OrderServiceClient orderServiceClient;

    @BeforeEach
    void setUp() throws Exception {
        refundRepository.deleteAll();
        transactionRepository.deleteAll();
        when(stripeGateway.getGatewayName()).thenReturn("STRIPE");
        when(stripeGateway.refund(anyString(), any(BigDecimal.class), anyString(), anyString()))
                .thenReturn("re_test");
    }

    private Transaction paidStripeTransaction(String amount) {
        return transactionRepository.save(Transaction.builder()
                .orderId("ord-refund-it")
                .storeId("store-de-1")
                .customerId("cust-1")
                .amount(new BigDecimal(amount))
                .currency("EUR")
                .paymentGateway("STRIPE")
                .stripePaymentIntentId("pi_refund_it")
                .status(Transaction.PaymentStatus.SUCCESS)
                .build());
    }

    private RefundRequest refundOf(String transactionId, String amount) {
        RefundRequest request = new RefundRequest();
        request.setTransactionId(transactionId);
        request.setAmount(new BigDecimal(amount));
        request.setType(Refund.RefundType.PARTIAL);
        request.setReason("it");
        request.setInitiatedBy("manager-1");
        return request;
    }

    @Test
    @DisplayName("money fields are stored as Decimal128, not strings")
    void moneyIsStoredAsDecimal128() {
        Transaction saved = paidStripeTransaction("10.00");

        Document raw = mongoTemplate.getCollection("transactions")
                .find(new Document("_id", new org.bson.types.ObjectId(saved.getId()))).first();

        assertThat(raw).isNotNull();
        assertThat(raw.get("amount")).isInstanceOf(Decimal128.class);
    }

    @Test
    @DisplayName("two concurrent refunds that together exceed the capture call the gateway once")
    void concurrentRefundsCannotExceedCapture() throws Exception {
        Transaction tx = paidStripeTransaction("10.00");
        CountDownLatch start = new CountDownLatch(1);
        Callable<Boolean> attempt = () -> {
            start.await();
            try {
                refundService.initiateRefund(refundOf(tx.getId(), "8.00"));
                return true;
            } catch (RuntimeException e) {
                return false;
            }
        };

        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Boolean>> results = new ArrayList<>();
        results.add(pool.submit(attempt));
        results.add(pool.submit(attempt));
        start.countDown();
        int succeeded = 0;
        for (Future<Boolean> result : results) {
            if (result.get()) {
                succeeded++;
            }
        }
        pool.shutdown();

        assertThat(succeeded).isEqualTo(1);
        verify(stripeGateway, times(1)).refund(eq("pi_refund_it"), any(BigDecimal.class), anyString(), anyString());
    }

    @Test
    @DisplayName("a successful refund keeps its claim, so a later refund cannot exceed the capture")
    void sequentialRefundsCannotExceedCapture() throws Exception {
        Transaction tx = paidStripeTransaction("10.00");

        refundService.initiateRefund(refundOf(tx.getId(), "8.00"));

        assertThatThrownBy(() -> refundService.initiateRefund(refundOf(tx.getId(), "8.00")))
                .isInstanceOf(RuntimeException.class);
        verify(stripeGateway, times(1)).refund(anyString(), any(BigDecimal.class), anyString(), anyString());
        Transaction after = transactionRepository.findById(tx.getId()).orElseThrow();
        assertThat(after.getRefundClaimedAmount()).isEqualByComparingTo("8.00");
        assertThat(after.getStatus()).isEqualTo(Transaction.PaymentStatus.PARTIAL_REFUND);
    }

    @Test
    @DisplayName("legacy string money fields are migrated to Decimal128 and stay refundable")
    void legacyStringAmountsAreMigrated() throws Exception {
        org.bson.types.ObjectId id = new org.bson.types.ObjectId();
        mongoTemplate.getCollection("transactions").insertOne(new Document("_id", id)
                .append("orderId", "ord-legacy")
                .append("storeId", "store-de-1")
                .append("amount", "12.50")
                .append("refundClaimedAmount", "0")
                .append("currency", "EUR")
                .append("paymentGateway", "STRIPE")
                .append("stripePaymentIntentId", "pi_legacy")
                .append("status", "SUCCESS"));
        mongoTemplate.getCollection("refunds").insertOne(new Document("transactionId", "other")
                .append("amount", "1.00")
                .append("razorpayRefundId", "legacy_rfnd")
                .append("status", "PROCESSED"));

        moneyFieldMigration.run(null);

        Document tx = mongoTemplate.getCollection("transactions").find(new Document("_id", id)).first();
        Document refund = mongoTemplate.getCollection("refunds").find(new Document("razorpayRefundId", "legacy_rfnd")).first();
        assertThat(tx.get("amount")).isEqualTo(new Decimal128(new BigDecimal("12.50")));
        assertThat(tx.get("refundClaimedAmount")).isInstanceOf(Decimal128.class);
        assertThat(refund.get("amount")).isEqualTo(new Decimal128(new BigDecimal("1.00")));

        Refund done = refundService.initiateRefund(refundOf(id.toHexString(), "12.50"));
        assertThat(done.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
    }

    @Test
    @DisplayName("a gateway failure releases the claim and marks the refund FAILED")
    void gatewayFailureReleasesClaim() throws Exception {
        Transaction tx = paidStripeTransaction("10.00");
        when(stripeGateway.refund(anyString(), any(BigDecimal.class), anyString(), anyString()))
                .thenThrow(new RuntimeException("stripe down"))
                .thenReturn("re_retry");

        assertThatThrownBy(() -> refundService.initiateRefund(refundOf(tx.getId(), "10.00")))
                .isInstanceOf(RuntimeException.class);

        assertThat(transactionRepository.findById(tx.getId()).orElseThrow().getRefundClaimedAmount())
                .isEqualByComparingTo("0");
        assertThat(refundRepository.findByTransactionId(tx.getId()))
                .extracting(Refund::getStatus)
                .containsExactly(Refund.RefundStatus.FAILED);

        Refund retry = refundService.initiateRefund(refundOf(tx.getId(), "10.00"));
        assertThat(retry.getStatus()).isEqualTo(Refund.RefundStatus.PROCESSED);
    }
}
