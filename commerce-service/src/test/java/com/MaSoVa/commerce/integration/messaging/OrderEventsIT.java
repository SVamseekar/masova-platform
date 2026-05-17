package com.MaSoVa.commerce.integration.messaging;

import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
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

@DisplayName("Commerce Order Event Publisher IT")
class OrderEventsIT extends BaseMessagingIntegrationTest {

    @Autowired
    private OrderEventPublisher orderEventPublisher;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private AmqpAdmin amqpAdmin;

    @Test
    @DisplayName("publishOrderCreated sends OrderCreatedEvent to masova.orders.events exchange")
    void publishOrderCreated_messageArrivesOnBoundQueue() {
        String queueName = "test.order.created." + UUID.randomUUID();
        Queue testQueue = new Queue(queueName, false, false, true);
        TopicExchange ordersExchange = new TopicExchange(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE);
        amqpAdmin.declareQueue(testQueue);
        amqpAdmin.declareBinding(BindingBuilder.bind(testQueue).to(ordersExchange).with(MaSoVaRabbitMQConfig.ORDER_CREATED_KEY));

        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-evt-001", "cust-001", "store-001",
            "DELIVERY", new BigDecimal("210.00"), "INR"
        );
        orderEventPublisher.publishOrderCreated(event);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            Object received = rabbitTemplate.receiveAndConvert(queueName, 500);
            assertThat(received).isNotNull().isInstanceOf(OrderCreatedEvent.class);
            OrderCreatedEvent evt = (OrderCreatedEvent) received;
            assertThat(evt.getOrderId()).isEqualTo("order-evt-001");
            assertThat(evt.getOrderType()).isEqualTo("DELIVERY");
            assertThat(evt.getTotalAmount()).isEqualByComparingTo("210.00");
        });

        amqpAdmin.deleteQueue(queueName);
    }

    @Test
    @DisplayName("publishOrderStatusChanged sends OrderStatusChangedEvent to masova.orders.events exchange")
    void publishOrderStatusChanged_messageArrivesOnBoundQueue() {
        String queueName = "test.order.status." + UUID.randomUUID();
        Queue testQueue = new Queue(queueName, false, false, true);
        TopicExchange ordersExchange = new TopicExchange(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE);
        amqpAdmin.declareQueue(testQueue);
        amqpAdmin.declareBinding(BindingBuilder.bind(testQueue).to(ordersExchange).with(MaSoVaRabbitMQConfig.ORDER_STATUS_CHANGED_KEY));

        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-evt-002", "cust-002", "RECEIVED", "READY", "store-001"
        );
        orderEventPublisher.publishOrderStatusChanged(event);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            Object received = rabbitTemplate.receiveAndConvert(queueName, 500);
            assertThat(received).isNotNull().isInstanceOf(OrderStatusChangedEvent.class);
            OrderStatusChangedEvent evt = (OrderStatusChangedEvent) received;
            assertThat(evt.getOrderId()).isEqualTo("order-evt-002");
            assertThat(evt.getNewStatus()).isEqualTo("READY");
            assertThat(evt.getPreviousStatus()).isEqualTo("RECEIVED");
        });

        amqpAdmin.deleteQueue(queueName);
    }
}
