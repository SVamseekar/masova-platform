package com.MaSoVa.order.service;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderEventPublisherTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    private OrderEventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new OrderEventPublisher(rabbitTemplate);
    }

    @Test
    void publishOrderCreated_sendsToCorrectExchangeAndRoutingKey() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-1", "customer-1", "store-1", "DELIVERY",
                new BigDecimal("29.99"), "INR");

        publisher.publishOrderCreated(event);

        verify(rabbitTemplate).convertAndSend(
                MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
                MaSoVaRabbitMQConfig.ORDER_CREATED_KEY,
                event);
    }

    @Test
    void publishOrderStatusChanged_sendsToCorrectExchangeAndRoutingKey() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                "order-1", "customer-1", "PENDING", "PREPARING", "store-1");

        publisher.publishOrderStatusChanged(event);

        verify(rabbitTemplate).convertAndSend(
                MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
                MaSoVaRabbitMQConfig.ORDER_STATUS_CHANGED_KEY,
                event);
    }

    @Test
    void publishOrderCreated_whenRabbitUnavailable_logsAndDoesNotThrow() {
        doThrow(new RuntimeException("Connection refused"))
                .when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-1", "customer-1", "store-1", "DELIVERY",
                new BigDecimal("29.99"), "INR");

        assertDoesNotThrow(() -> publisher.publishOrderCreated(event));
    }
}
