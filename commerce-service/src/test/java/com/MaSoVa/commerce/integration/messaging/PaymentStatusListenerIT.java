package com.MaSoVa.commerce.integration.messaging;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderPaymentStatusEvent;
import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * commerce applies payment-service's OrderPaymentStatusEvent idempotently (#119).
 * Replaces the synchronous PATCH /api/orders/{id}/payment callback.
 */
@DisplayName("Order payment status listener")
class PaymentStatusListenerIT extends BaseMessagingIntegrationTest {

    @Autowired private OrderRepository orderRepository;
    @Autowired private RabbitTemplate rabbitTemplate;
    @Autowired private AmqpAdmin amqpAdmin;

    @BeforeEach
    void setUp() {
        amqpAdmin.purgeQueue(MaSoVaRabbitMQConfig.DLQ, false);
    }

    private Order savedOrder(Order.PaymentStatus paymentStatus) {
        Order order = new Order();
        order.setOrderNumber("ORD-PAY-" + UUID.randomUUID());
        order.setStoreId("store-de-1");
        order.setCustomerId("cust-1");
        order.setStatus(Order.OrderStatus.RECEIVED);
        order.setOrderType(Order.OrderType.DELIVERY);
        order.setPaymentStatus(paymentStatus);
        return orderRepository.save(order);
    }

    private void publish(String orderId, String status) {
        rabbitTemplate.convertAndSend(MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE,
                MaSoVaRabbitMQConfig.ORDER_PAYMENT_STATUS_KEY,
                new OrderPaymentStatusEvent(UUID.randomUUID().toString(), orderId, "txn-1", status));
    }

    @Test
    @DisplayName("a PAID event marks the order PAID with the transaction id")
    void paidEventMarksOrderPaid() {
        Order order = savedOrder(Order.PaymentStatus.PENDING);

        publish(order.getId(), "PAID");

        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            Order after = orderRepository.findById(order.getId()).orElseThrow();
            assertThat(after.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
            assertThat(after.getPaymentTransactionId()).isEqualTo("txn-1");
        });
    }

    @Test
    @DisplayName("a late PAID event does not undo a REFUNDED order")
    void latePaidDoesNotUndoRefund() throws Exception {
        Order order = savedOrder(Order.PaymentStatus.REFUNDED);

        publish(order.getId(), "PAID");
        publish(order.getId(), "REFUNDED");

        await().during(2, TimeUnit.SECONDS).atMost(5, TimeUnit.SECONDS).untilAsserted(() ->
                assertThat(orderRepository.findById(order.getId()).orElseThrow().getPaymentStatus())
                        .isEqualTo(Order.PaymentStatus.REFUNDED));
    }

    @Test
    @DisplayName("an event for an unknown order goes to the dead-letter queue")
    void unknownOrderIsDeadLettered() {
        publish("no-such-order-" + UUID.randomUUID(), "PAID");

        await().atMost(20, TimeUnit.SECONDS).untilAsserted(() ->
                assertThat(rabbitTemplate.receive(MaSoVaRabbitMQConfig.DLQ, 500)).isNotNull());
    }
}
