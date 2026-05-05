package com.MaSoVa.payment.messaging;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.PaymentCompletedEvent;
import com.MaSoVa.shared.messaging.events.PaymentFailedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public PaymentEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE,
                MaSoVaRabbitMQConfig.PAYMENT_COMPLETED_KEY,
                event
            );
            log.info("Published payment.completed event for orderId={}", event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to publish payment.completed event for orderId={}", event.getOrderId(), e);
        }
    }

    public void publishPaymentFailed(PaymentFailedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                MaSoVaRabbitMQConfig.PAYMENTS_EXCHANGE,
                MaSoVaRabbitMQConfig.PAYMENT_FAILED_KEY,
                event
            );
            log.info("Published payment.failed event for orderId={}", event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to publish payment.failed event for orderId={}", event.getOrderId(), e);
        }
    }
}
