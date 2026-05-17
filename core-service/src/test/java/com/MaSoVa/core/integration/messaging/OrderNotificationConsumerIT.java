package com.MaSoVa.core.integration.messaging;

import com.MaSoVa.core.notification.service.NotificationService;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.test.RabbitListenerTest;
import org.springframework.amqp.rabbit.test.RabbitListenerTestHarness;
import org.springframework.amqp.rabbit.test.RabbitListenerTestHarness.InvocationData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Order Notification Consumer IT")
@RabbitListenerTest(capture = true)
@TestPropertySource(properties = "spring.rabbitmq.listener.simple.auto-startup=true")
class OrderNotificationConsumerIT extends BaseMessagingIntegrationTest {

    @MockBean
    private NotificationService notificationService;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private RabbitListenerTestHarness harness;

    @Test
    @DisplayName("onOrderCreated — listener receives OrderCreatedEvent with correct orderId")
    void onOrderCreated_listenerReceivesCorrectEvent() throws InterruptedException {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-notif-001", "cust-001", "store-001",
            "DELIVERY", new BigDecimal("300.00"), "INR"
        );

        rabbitTemplate.convertAndSend(
            MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
            MaSoVaRabbitMQConfig.ORDER_CREATED_KEY,
            event
        );

        InvocationData invocation = harness.getNextInvocationDataFor(
            "orderCreatedNotificationListener", 5, TimeUnit.SECONDS
        );

        assertThat(invocation).isNotNull();
        OrderCreatedEvent received = (OrderCreatedEvent) invocation.getArguments()[0];
        assertThat(received.getOrderId()).isEqualTo("order-notif-001");
        assertThat(received.getOrderType()).isEqualTo("DELIVERY");
    }

    @Test
    @DisplayName("onOrderStatusChanged — listener receives OrderStatusChangedEvent with new status")
    void onOrderStatusChanged_listenerReceivesCorrectEvent() throws InterruptedException {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-notif-002", "cust-002", "PREPARING", "READY", "store-001"
        );

        rabbitTemplate.convertAndSend(
            MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
            MaSoVaRabbitMQConfig.ORDER_STATUS_CHANGED_KEY,
            event
        );

        InvocationData invocation = harness.getNextInvocationDataFor(
            "orderStatusNotificationListener", 5, TimeUnit.SECONDS
        );

        assertThat(invocation).isNotNull();
        OrderStatusChangedEvent received = (OrderStatusChangedEvent) invocation.getArguments()[0];
        assertThat(received.getOrderId()).isEqualTo("order-notif-002");
        assertThat(received.getNewStatus()).isEqualTo("READY");
    }
}
