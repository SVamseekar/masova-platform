package com.MaSoVa.payment.integration.messaging;

import com.MaSoVa.payment.messaging.PaymentEventPublisher;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.PaymentCompletedEvent;
import com.MaSoVa.shared.messaging.events.PaymentFailedEvent;
import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@DisplayName("Payment Event Publisher IT")
class PaymentEventsIT extends BaseMessagingIntegrationTest {

    @Autowired
    private PaymentEventPublisher paymentEventPublisher;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private AmqpAdmin amqpAdmin;

    @Test
    @DisplayName("publishPaymentCompleted sends PaymentCompletedEvent to payments exchange")
    void publishPaymentCompleted_messageArrivesOnBoundQueue() {
        String queueName = "test.payment.completed." + UUID.randomUUID();
        Queue testQueue = new Queue(queueName, false, false, true);
        TopicExchange paymentsExchange = new TopicExchange(MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE);
        amqpAdmin.declareQueue(testQueue);
        amqpAdmin.declareBinding(BindingBuilder.bind(testQueue).to(paymentsExchange).with(MaSoVaRabbitMQConfig.PAYMENT_COMPLETED_KEY));

        PaymentCompletedEvent event = new PaymentCompletedEvent(
            "pay-002", "order-pay-001", "cust-001",
            new BigDecimal("750.00"), "INR",
            "UPI", "txn-002", "RAZORPAY", "upi"
        );
        paymentEventPublisher.publishPaymentCompleted(event);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            Object received = rabbitTemplate.receiveAndConvert(queueName, 500);
            assertThat(received).isNotNull().isInstanceOf(PaymentCompletedEvent.class);
            PaymentCompletedEvent evt = (PaymentCompletedEvent) received;
            assertThat(evt.getPaymentId()).isEqualTo("pay-002");
            assertThat(evt.getAmount()).isEqualByComparingTo("750.00");
            assertThat(evt.getPaymentGateway()).isEqualTo("RAZORPAY");
        });

        amqpAdmin.deleteQueue(queueName);
    }

    @Test
    @DisplayName("publishPaymentFailed sends PaymentFailedEvent to payments exchange")
    void publishPaymentFailed_messageArrivesOnBoundQueue() {
        String queueName = "test.payment.failed." + UUID.randomUUID();
        Queue testQueue = new Queue(queueName, false, false, true);
        TopicExchange paymentsExchange = new TopicExchange(MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE);
        amqpAdmin.declareQueue(testQueue);
        amqpAdmin.declareBinding(BindingBuilder.bind(testQueue).to(paymentsExchange).with(MaSoVaRabbitMQConfig.PAYMENT_FAILED_KEY));

        // Constructor: (paymentId, orderId, customerId, amount, failureReason, paymentGateway) — 6 args
        PaymentFailedEvent event = new PaymentFailedEvent(
            "pay-003", "order-pay-002", "cust-002",
            new BigDecimal("200.00"), "INSUFFICIENT_FUNDS", "RAZORPAY"
        );
        paymentEventPublisher.publishPaymentFailed(event);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            Object received = rabbitTemplate.receiveAndConvert(queueName, 500);
            assertThat(received).isNotNull().isInstanceOf(PaymentFailedEvent.class);
            PaymentFailedEvent evt = (PaymentFailedEvent) received;
            assertThat(evt.getPaymentId()).isEqualTo("pay-003");
            assertThat(evt.getFailureReason()).isEqualTo("INSUFFICIENT_FUNDS");
        });

        amqpAdmin.deleteQueue(queueName);
    }
}
