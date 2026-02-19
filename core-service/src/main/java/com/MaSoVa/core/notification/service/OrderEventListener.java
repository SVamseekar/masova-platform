package com.MaSoVa.core.notification.service;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);
    private final NotificationService notificationService;

    public OrderEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.NOTIFICATION_ORDER_QUEUE)
    public void onOrderCreated(OrderCreatedEvent event) {
        try {
            notificationService.handleOrderCreatedEvent(event);
        } catch (Exception e) {
            log.error("[AMQP] Error processing OrderCreatedEvent orderId={}: {}", event.getOrderId(), e.getMessage());
        }
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.NOTIFICATION_ORDER_QUEUE)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        try {
            notificationService.handleOrderStatusChangedEvent(event);
        } catch (Exception e) {
            log.error("[AMQP] Error processing OrderStatusChangedEvent orderId={}: {}", event.getOrderId(), e.getMessage());
        }
    }
}
