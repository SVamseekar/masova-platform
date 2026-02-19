package com.MaSoVa.order.service;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);
    private final RabbitTemplate rabbitTemplate;

    public OrderEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishOrderCreated(OrderCreatedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
                    MaSoVaRabbitMQConfig.ORDER_CREATED_KEY,
                    event);
            log.info("[AMQP] Published OrderCreatedEvent orderId={}", event.getOrderId());
        } catch (Exception e) {
            log.error("[AMQP] Failed to publish OrderCreatedEvent orderId={}: {}", event.getOrderId(), e.getMessage());
        }
    }

    public void publishOrderStatusChanged(OrderStatusChangedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
                    MaSoVaRabbitMQConfig.ORDER_STATUS_CHANGED_KEY,
                    event);
            log.info("[AMQP] Published OrderStatusChangedEvent orderId={} status={}", event.getOrderId(), event.getNewStatus());
        } catch (Exception e) {
            log.error("[AMQP] Failed to publish OrderStatusChangedEvent orderId={}: {}", event.getOrderId(), e.getMessage());
        }
    }
}
