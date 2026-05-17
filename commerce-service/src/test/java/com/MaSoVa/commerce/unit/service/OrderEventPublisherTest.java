package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
import com.MaSoVa.shared.model.FiscalSignature;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderEventPublisherTest {

    @Mock private RabbitTemplate rabbitTemplate;
    @InjectMocks private OrderEventPublisher publisher;

    @Test
    void publishOrderCreated_sends_to_correct_exchange_and_key() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                "ord-1", "cust-1", "store-1", "TAKEAWAY", BigDecimal.valueOf(200), "INR");

        publisher.publishOrderCreated(event);

        verify(rabbitTemplate).convertAndSend(
                eq(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE),
                eq(MaSoVaRabbitMQConfig.ORDER_CREATED_KEY),
                eq(event));
    }

    @Test
    void publishOrderCreated_does_not_throw_on_rabbit_failure() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                "ord-1", "cust-1", "store-1", "TAKEAWAY", BigDecimal.valueOf(200), "INR");
        doThrow(new RuntimeException("RabbitMQ down"))
                .when(rabbitTemplate).convertAndSend(any(String.class), any(String.class), any(Object.class));

        publisher.publishOrderCreated(event);
        // no exception thrown
    }

    @Test
    void publishOrderStatusChanged_sends_to_correct_exchange_and_key() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                "ord-1", "cust-1", "RECEIVED", "PREPARING", "store-1");

        publisher.publishOrderStatusChanged(event);

        verify(rabbitTemplate).convertAndSend(
                eq(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE),
                eq(MaSoVaRabbitMQConfig.ORDER_STATUS_CHANGED_KEY),
                eq(event));
    }

    @Test
    void publishOrderStatusChanged_does_not_throw_on_rabbit_failure() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                "ord-1", "cust-1", "RECEIVED", "PREPARING", "store-1");
        doThrow(new RuntimeException("timeout"))
                .when(rabbitTemplate).convertAndSend(any(String.class), any(String.class), any(Object.class));

        publisher.publishOrderStatusChanged(event);
    }

    @Test
    void publishReceiptSigned_sends_to_correct_exchange_and_key() {
        FiscalSignature sig = FiscalSignature.passthrough("IN");
        ReceiptSignedEvent event = new ReceiptSignedEvent("ord-1", "store-1", "IN", sig);

        publisher.publishReceiptSigned(event);

        verify(rabbitTemplate).convertAndSend(
                eq(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE),
                eq(MaSoVaRabbitMQConfig.ORDER_RECEIPT_SIGNED_KEY),
                eq(event));
    }

    @Test
    void publishReceiptSigned_does_not_throw_on_rabbit_failure() {
        FiscalSignature sig = FiscalSignature.passthrough("IN");
        ReceiptSignedEvent event = new ReceiptSignedEvent("ord-1", "store-1", "IN", sig);
        doThrow(new RuntimeException("connection refused"))
                .when(rabbitTemplate).convertAndSend(any(String.class), any(String.class), any(Object.class));

        publisher.publishReceiptSigned(event);
    }
}
