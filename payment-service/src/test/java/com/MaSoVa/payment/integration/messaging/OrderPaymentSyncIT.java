package com.MaSoVa.payment.integration.messaging;

import com.MaSoVa.payment.entity.OrderPaymentSync;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.messaging.OrderPaymentSyncRelay;
import com.MaSoVa.payment.repository.TransactionRepository;
import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderPaymentStatusEvent;
import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Payment → order status goes through an outbox embedded in the Transaction document (#119).
 * The status change and the pending event are one atomic single-document write;
 * the relay publishes with broker confirms and marks the event SENT.
 */
@DisplayName("Order payment status outbox and relay")
class OrderPaymentSyncIT extends BaseMessagingIntegrationTest {

    private static final String PROBE_QUEUE = "it.order-payment-status.probe";

    @Autowired private PaymentService paymentService;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private OrderPaymentSyncRelay relay;
    @Autowired private RabbitTemplate rabbitTemplate;
    @Autowired private AmqpAdmin amqpAdmin;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        Queue probe = new Queue(PROBE_QUEUE, false, false, true);
        amqpAdmin.declareQueue(probe);
        amqpAdmin.purgeQueue(PROBE_QUEUE, false);
        Binding binding = BindingBuilder.bind(probe)
                .to(new TopicExchange(MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE))
                .with(MaSoVaRabbitMQConfig.ORDER_PAYMENT_STATUS_KEY);
        amqpAdmin.declareBinding(binding);
    }

    private Transaction initiatedStripe(String orderId) {
        return transactionRepository.save(Transaction.builder()
                .orderId(orderId)
                .storeId("store-de-1")
                .amount(new BigDecimal("20.00"))
                .currency("EUR")
                .paymentGateway("STRIPE")
                .stripePaymentIntentId("pi_" + orderId)
                .status(Transaction.PaymentStatus.INITIATED)
                .build());
    }

    private GatewayWebhookResult captured(String orderId) {
        return new GatewayWebhookResult(GatewayWebhookResult.EventType.PAYMENT_CAPTURED,
                "pi_" + orderId, "ch_" + orderId, null, null, "card");
    }

    @Test
    @DisplayName("a captured payment stores SUCCESS and a pending PAID event in one write")
    void capturedPaymentQueuesPaidEvent() {
        Transaction tx = initiatedStripe("ord-sync-1");

        paymentService.handleStripeWebhookEvent(captured("ord-sync-1"));

        Transaction after = transactionRepository.findById(tx.getId()).orElseThrow();
        assertThat(after.getStatus()).isEqualTo(Transaction.PaymentStatus.SUCCESS);
        assertThat(after.getOrderSync()).isNotNull();
        assertThat(after.getOrderSync().getPaymentStatus()).isEqualTo("PAID");
        assertThat(after.getOrderSync().getStatus()).isEqualTo(OrderPaymentSync.Status.PENDING);
    }

    @Test
    @DisplayName("the relay publishes the pending event and marks it SENT")
    void relayPublishesAndMarksSent() {
        Transaction tx = initiatedStripe("ord-sync-2");
        paymentService.handleStripeWebhookEvent(captured("ord-sync-2"));

        int published = relay.relayDue();

        assertThat(published).isEqualTo(1);
        Object message = rabbitTemplate.receiveAndConvert(PROBE_QUEUE, 5000);
        assertThat(message).isInstanceOf(OrderPaymentStatusEvent.class);
        OrderPaymentStatusEvent event = (OrderPaymentStatusEvent) message;
        assertThat(event.getOrderId()).isEqualTo("ord-sync-2");
        assertThat(event.getPaymentStatus()).isEqualTo("PAID");
        assertThat(event.getTransactionId()).isEqualTo(tx.getId());
        OrderPaymentSync sync = transactionRepository.findById(tx.getId()).orElseThrow().getOrderSync();
        assertThat(sync.getStatus()).isEqualTo(OrderPaymentSync.Status.SENT);
        assertThat(sync.getEventId()).isEqualTo(event.getEventId());
    }

    @Test
    @DisplayName("a duplicate webhook does not queue a second event")
    void duplicateWebhookQueuesNothingNew() {
        initiatedStripe("ord-sync-3");
        paymentService.handleStripeWebhookEvent(captured("ord-sync-3"));
        relay.relayDue();

        paymentService.handleStripeWebhookEvent(captured("ord-sync-3"));

        assertThat(relay.relayDue()).isZero();
    }

    @Test
    @DisplayName("an ack for an older event does not mark a newer pending status SENT")
    void staleAckDoesNotHideNewerStatus() {
        Transaction tx = initiatedStripe("ord-sync-4");
        paymentService.handleStripeWebhookEvent(captured("ord-sync-4"));
        String paidEventId = transactionRepository.findById(tx.getId()).orElseThrow().getOrderSync().getEventId();

        relay.requestOrderPaymentStatus(tx.getId(), "REFUNDED");
        relay.markSent(tx.getId(), paidEventId);

        OrderPaymentSync sync = transactionRepository.findById(tx.getId()).orElseThrow().getOrderSync();
        assertThat(sync.getPaymentStatus()).isEqualTo("REFUNDED");
        assertThat(sync.getStatus()).isEqualTo(OrderPaymentSync.Status.PENDING);
    }
}
