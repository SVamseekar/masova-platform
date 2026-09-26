package com.MaSoVa.commerce.order.messaging;

import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderPaymentStatusEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Applies payment-service's order payment status events (at-least-once delivery).
 * Failures are retried with backoff, then dead-lettered to masova.dlq.
 */
@Component
public class PaymentStatusListener {

    private static final Logger log = LoggerFactory.getLogger(PaymentStatusListener.class);

    private final OrderService orderService;

    public PaymentStatusListener(OrderService orderService) {
        this.orderService = orderService;
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.COMMERCE_PAYMENT_STATUS_QUEUE)
    public void onPaymentStatus(OrderPaymentStatusEvent event) {
        log.info("Payment status {} for order {} (event {})",
                event.getPaymentStatus(), event.getOrderId(), event.getEventId());
        orderService.applyPaymentStatusEvent(event.getOrderId(), event.getPaymentStatus(), event.getTransactionId());
    }
}
