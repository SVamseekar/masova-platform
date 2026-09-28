package com.MaSoVa.payment.integration.repository;

import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import com.mongodb.client.model.IndexOptions;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Stripe transactions have no razorpayOrderId; its unique index must ignore them. */
@DisplayName("Transaction razorpayOrderId index (real MongoDB)")
class TransactionIndexIT extends BaseFullIntegrationTest {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private com.MaSoVa.payment.config.TransactionIndexMigration transactionIndexMigration;

    @BeforeEach
    void clean() {
        transactionRepository.deleteAll();
    }

    private Transaction stripe(String orderId) {
        return Transaction.builder()
                .orderId(orderId)
                .amount(new BigDecimal("9.90"))
                .currency("EUR")
                .paymentGateway("STRIPE")
                .stripePaymentIntentId("pi_" + orderId)
                .status(Transaction.PaymentStatus.INITIATED)
                .build();
    }

    @Test
    @DisplayName("two Stripe transactions without a razorpayOrderId can both be saved")
    void twoStripeTransactionsCanBeSaved() {
        transactionRepository.save(stripe("ord-stripe-1"));
        transactionRepository.save(stripe("ord-stripe-2"));

        assertThat(transactionRepository.count()).isEqualTo(2);
    }

    @Test
    @DisplayName("a duplicate razorpayOrderId is still rejected")
    void duplicateRazorpayOrderIdIsRejected() {
        Transaction first = stripe("ord-rzp-1");
        first.setRazorpayOrderId("order_dup");
        transactionRepository.save(first);
        Transaction second = stripe("ord-rzp-2");
        second.setRazorpayOrderId("order_dup");

        assertThatThrownBy(() -> transactionRepository.save(second)).isInstanceOf(DuplicateKeyException.class);
    }

    @Test
    @DisplayName("an old full unique index is replaced by the partial one")
    void legacyFullIndexIsReplaced() {
        var collection = mongoTemplate.getCollection("transactions");
        for (Document index : collection.listIndexes()) {
            if (((Document) index.get("key")).containsKey("razorpayOrderId")) {
                collection.dropIndex(index.getString("name"));
            }
        }
        collection.createIndex(new Document("razorpayOrderId", 1), new IndexOptions().unique(true).name("razorpayOrderId"));

        transactionIndexMigration.migrate();

        transactionRepository.save(stripe("ord-after-1"));
        transactionRepository.save(stripe("ord-after-2"));
        assertThat(transactionRepository.count()).isEqualTo(2);
    }
}
