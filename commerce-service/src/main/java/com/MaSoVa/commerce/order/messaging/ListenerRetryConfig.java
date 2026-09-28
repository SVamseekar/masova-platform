package com.MaSoVa.commerce.order.messaging;

import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.retry.MessageRecoverer;
import org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.amqp.RabbitRetryTemplateCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.policy.SimpleRetryPolicy;

import java.util.Map;

/**
 * Listener retry for commerce consumers: transient errors retry with backoff (application.yml),
 * errors that cannot succeed on retry go to the dead-letter queue at once, and every
 * dead-lettered message is logged at ERROR and counted so it is never silent.
 */
@Configuration
public class ListenerRetryConfig {

    private static final Logger log = LoggerFactory.getLogger(ListenerRetryConfig.class);

    @Bean
    public RabbitRetryTemplateCustomizer nonRetryableListenerErrors(
            org.springframework.boot.autoconfigure.amqp.RabbitProperties properties) {
        int maxAttempts = properties.getListener().getSimple().getRetry().getMaxAttempts();
        return (target, retryTemplate) -> {
            if (target == RabbitRetryTemplateCustomizer.Target.LISTENER) {
                retryTemplate.setRetryPolicy(new SimpleRetryPolicy(maxAttempts, Map.of(
                        AmqpRejectAndDontRequeueException.class, false,
                        MessageConversionException.class, false,
                        IllegalArgumentException.class, false), true, true));
            }
        };
    }

    @Bean
    public MessageRecoverer deadLetterRecoverer(ObjectProvider<MeterRegistry> meterRegistry) {
        return new RejectAndDontRequeueRecoverer() {
            @Override
            public void recover(Message message, Throwable cause) {
                log.error("Dead-lettering message from queue {} after listener failure: {}",
                        message.getMessageProperties().getConsumerQueue(), cause.getMessage(), cause);
                MeterRegistry registry = meterRegistry.getIfAvailable();
                if (registry != null) {
                    registry.counter("commerce.payment_status.dead_lettered").increment();
                }
                super.recover(message, cause);
            }
        };
    }
}
