package com.MaSoVa.intelligence.integration.messaging;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.PaymentCompletedEvent;
import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.test.RabbitListenerTest;
import org.springframework.amqp.rabbit.test.RabbitListenerTestHarness;
import org.springframework.amqp.rabbit.test.RabbitListenerTestHarness.InvocationData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Analytics Consumer IT")
@RabbitListenerTest(capture = true)
@TestPropertySource(properties = "spring.rabbitmq.listener.simple.auto-startup=true")
class AnalyticsConsumerIT extends BaseMessagingIntegrationTest {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private RabbitListenerTestHarness harness;

    @Test
    @DisplayName("onOrderCreated — analytics listener records order event for correct storeId")
    void onOrderCreated_analyticsListenerInvokedWithCorrectEvent() throws InterruptedException {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-analytics-001", "cust-001", "store-analytics-1",
            "DELIVERY", new BigDecimal("500.00"), "INR"
        );

        rabbitTemplate.convertAndSend(
            MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
            MaSoVaRabbitMQConfig.ORDER_CREATED_KEY,
            event
        );

        InvocationData invocation = harness.getNextInvocationDataFor(
            "analyticsOrderCreatedListener", 5, TimeUnit.SECONDS
        );

        assertThat(invocation).isNotNull();
        OrderCreatedEvent received = (OrderCreatedEvent) invocation.getArguments()[0];
        assertThat(received.getOrderId()).isEqualTo("order-analytics-001");
        assertThat(received.getStoreId()).isEqualTo("store-analytics-1");
    }

    @Test
    @DisplayName("onPaymentCompleted — analytics listener records payment event")
    void onPaymentCompleted_analyticsListenerInvokedWithCorrectEvent() throws InterruptedException {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
            "pay-001", "order-analytics-002", "cust-001",
            new BigDecimal("500.00"), "INR",
            "CARD", "txn-001", "RAZORPAY", "card"
        );

        rabbitTemplate.convertAndSend(
            MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE,
            MaSoVaRabbitMQConfig.PAYMENT_COMPLETED_KEY,
            event
        );

        InvocationData invocation = harness.getNextInvocationDataFor(
            "analyticsPaymentCompletedListener", 5, TimeUnit.SECONDS
        );

        assertThat(invocation).isNotNull();
        PaymentCompletedEvent received = (PaymentCompletedEvent) invocation.getArguments()[0];
        assertThat(received.getPaymentId()).isEqualTo("pay-001");
        assertThat(received.getAmount()).isEqualByComparingTo("500.00");
    }
}
