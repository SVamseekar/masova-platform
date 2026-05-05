package com.MaSoVa.shared.messaging.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MaSoVaRabbitMQConfig {

    // Exchange names
    public static final String ORDERS_EXCHANGE = "masova.orders.events";
    public static final String PAYMENTS_EXCHANGE = "masova.payments.events";
    public static final String DELIVERY_EXCHANGE = "masova.delivery.events";
    public static final String DLX = "masova.dlx";

    // Routing keys — orders
    public static final String ORDER_CREATED_KEY = "order.created";
    public static final String ORDER_STATUS_CHANGED_KEY = "order.status.changed";

    // Routing keys — payments
    public static final String PAYMENT_COMPLETED_KEY = "payment.completed";
    public static final String PAYMENT_FAILED_KEY = "payment.failed";

    // Routing keys — delivery
    public static final String DELIVERY_ASSIGNED_KEY = "delivery.assigned";
    public static final String DELIVERY_COMPLETED_KEY = "delivery.completed";

    // Routing key — aggregator
    public static final String AGGREGATOR_ORDER_RECEIVED_KEY = "order.aggregator.received";

    // Queue names
    public static final String NOTIFICATION_ORDER_QUEUE = "masova.notification.order-events";
    public static final String ANALYTICS_PAYMENT_QUEUE = "masova.analytics.payment-events";
    public static final String ANALYTICS_ORDER_QUEUE = "masova.analytics.order-events";
    public static final String ANALYTICS_AGGREGATOR_QUEUE = "masova.analytics.aggregator-events";
    public static final String DLQ = "masova.dlq";

    @Bean
    public TopicExchange ordersExchange() {
        return ExchangeBuilder.topicExchange(ORDERS_EXCHANGE).durable(true).build();
    }

    @Bean
    public TopicExchange deliveryExchange() {
        return ExchangeBuilder.topicExchange(DELIVERY_EXCHANGE).durable(true).build();
    }

    @Bean
    public TopicExchange paymentsExchange() {
        return ExchangeBuilder.topicExchange(PAYMENTS_EXCHANGE).durable(true).build();
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return ExchangeBuilder.topicExchange(DLX).durable(true).build();
    }

    @Bean
    public Queue notificationOrderQueue() {
        return QueueBuilder.durable(NOTIFICATION_ORDER_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ).build();
    }

    @Bean
    public Binding notificationOrderCreatedBinding(Queue notificationOrderQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(notificationOrderQueue).to(ordersExchange).with("order.#");
    }

    @Bean
    public Queue analyticsPaymentQueue() {
        return QueueBuilder.durable(ANALYTICS_PAYMENT_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Queue analyticsOrderQueue() {
        return QueueBuilder.durable(ANALYTICS_ORDER_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Binding analyticsPaymentBinding(Queue analyticsPaymentQueue, TopicExchange paymentsExchange) {
        return BindingBuilder.bind(analyticsPaymentQueue).to(paymentsExchange).with("payment.#");
    }

    @Bean
    public Binding analyticsOrderBinding(Queue analyticsOrderQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(analyticsOrderQueue).to(ordersExchange).with("order.#");
    }

    @Bean
    public Queue analyticsAggregatorQueue() {
        return QueueBuilder.durable(ANALYTICS_AGGREGATOR_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Binding analyticsAggregatorBinding(Queue analyticsAggregatorQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(analyticsAggregatorQueue).to(ordersExchange).with(AGGREGATOR_ORDER_RECEIVED_KEY);
    }

    @Bean
    public Binding dlqBinding(Queue deadLetterQueue, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetterQueue).to(deadLetterExchange).with("dlq");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(mapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                          MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
