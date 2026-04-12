package com.MaSoVa.intelligence.messaging;

import com.MaSoVa.intelligence.service.AnalyticsService;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.AggregatorOrderReceivedEvent;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import com.MaSoVa.shared.messaging.events.PaymentCompletedEvent;
import com.MaSoVa.shared.messaging.events.PaymentFailedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

/**
 * Consumes domain events from RabbitMQ to build analytics data
 * without making synchronous REST calls to other services.
 * This implements the Phase 0 event-driven analytics strategy.
 */
@Service
public class AnalyticsEventListener {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsEventListener.class);

    private final AnalyticsService analyticsService;

    public AnalyticsEventListener(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.ANALYTICS_ORDER_QUEUE)
    public void onOrderCreated(OrderCreatedEvent event) {
        try {
            log.info("Analytics: received order.created event orderId={}", event.getOrderId());
            analyticsService.recordOrderEvent(
                event.getOrderId(),
                event.getStoreId(),
                event.getCustomerId(),
                event.getOrderType(),
                event.getTotalAmount(),
                "CREATED"
            );
        } catch (Exception e) {
            log.error("Failed to process order.created analytics event orderId={}", event.getOrderId(), e);
        }
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.ANALYTICS_ORDER_QUEUE)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        try {
            log.info("Analytics: received order.status.changed event orderId={} status={}",
                event.getOrderId(), event.getNewStatus());
            analyticsService.recordOrderEvent(
                event.getOrderId(),
                event.getStoreId(),
                event.getCustomerId(),
                null,
                null,
                event.getNewStatus()
            );
        } catch (Exception e) {
            log.error("Failed to process order.status.changed analytics event orderId={}", event.getOrderId(), e);
        }
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.ANALYTICS_PAYMENT_QUEUE)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        try {
            log.info("Analytics: received payment.completed event paymentId={} orderId={}",
                event.getPaymentId(), event.getOrderId());
            analyticsService.recordPaymentEvent(
                event.getPaymentId(),
                event.getOrderId(),
                event.getAmount(),
                event.getPaymentMethod(),
                true
            );
        } catch (Exception e) {
            log.error("Failed to process payment.completed analytics event paymentId={}", event.getPaymentId(), e);
        }
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.ANALYTICS_AGGREGATOR_QUEUE)
    public void onAggregatorOrderReceived(AggregatorOrderReceivedEvent event) {
        try {
            log.info("Analytics: received aggregator order event orderId={} source={}",
                    event.getOrderId(), event.getOrderSource());
            analyticsService.recordAggregatorOrderEvent(
                    event.getOrderId(),
                    event.getStoreId(),
                    event.getOrderSource(),
                    event.getGrossAmount(),
                    event.getCommissionAmount(),
                    event.getNetPayout(),
                    event.getCurrency()
            );
        } catch (Exception e) {
            log.error("Failed to process aggregator order event orderId={}", event.getOrderId(), e);
        }
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.ANALYTICS_PAYMENT_QUEUE)
    public void onPaymentFailed(PaymentFailedEvent event) {
        try {
            log.info("Analytics: received payment.failed event paymentId={} orderId={}",
                event.getPaymentId(), event.getOrderId());
            analyticsService.recordPaymentEvent(
                event.getPaymentId(),
                event.getOrderId(),
                event.getAmount(),
                null,
                false
            );
        } catch (Exception e) {
            log.error("Failed to process payment.failed analytics event paymentId={}", event.getPaymentId(), e);
        }
    }
}
