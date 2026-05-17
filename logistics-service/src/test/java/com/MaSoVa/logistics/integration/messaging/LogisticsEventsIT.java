package com.MaSoVa.logistics.integration.messaging;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@DisplayName("Logistics Delivery Event IT")
class LogisticsEventsIT extends BaseMessagingIntegrationTest {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private AmqpAdmin amqpAdmin;

    @Test
    @DisplayName("delivery.assigned event reaches delivery exchange and bound test queue")
    void deliveryAssignedEvent_reachesDeliveryExchange() {
        Queue testQueue = new Queue("test.logistics.delivery.queue", false, false, true);
        TopicExchange deliveryExchange = new TopicExchange(MaSoVaRabbitMQConfig.DELIVERY_EXCHANGE);
        amqpAdmin.declareQueue(testQueue);
        amqpAdmin.declareBinding(
            BindingBuilder.bind(testQueue).to(deliveryExchange).with("delivery.#")
        );

        Map<String, Object> deliveryEvent = Map.of(
            "deliveryId", "delivery-001",
            "orderId", "order-logistics-001",
            "driverId", "driver-001",
            "status", "ASSIGNED"
        );

        rabbitTemplate.convertAndSend(
            MaSoVaRabbitMQConfig.DELIVERY_EXCHANGE,
            MaSoVaRabbitMQConfig.DELIVERY_ASSIGNED_KEY,
            deliveryEvent
        );

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            Object received = rabbitTemplate.receiveAndConvert("test.logistics.delivery.queue", 500);
            assertThat(received).isNotNull();
        });

        amqpAdmin.deleteQueue("test.logistics.delivery.queue");
    }
}
