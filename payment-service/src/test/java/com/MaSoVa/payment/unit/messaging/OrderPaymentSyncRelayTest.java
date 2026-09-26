package com.MaSoVa.payment.unit.messaging;

import com.MaSoVa.payment.entity.OrderPaymentSync;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.messaging.OrderPaymentSyncRelay;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderPaymentSyncRelayTest {

    private MongoTemplate mongoTemplate;
    private RabbitTemplate rabbitTemplate;
    private SimpleMeterRegistry registry;
    private OrderPaymentSyncRelay relay;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mongoTemplate = mock(MongoTemplate.class);
        rabbitTemplate = mock(RabbitTemplate.class);
        registry = new SimpleMeterRegistry();
        ObjectProvider<MeterRegistry> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(registry);
        relay = new OrderPaymentSyncRelay(mongoTemplate, rabbitTemplate, provider, 3, 50, 100);
    }

    private Transaction leased(int attempts) {
        Transaction tx = Transaction.builder().orderId("ord-1").amount(BigDecimal.TEN).build();
        tx.setId("txn-1");
        OrderPaymentSync sync = OrderPaymentSync.pending("PAID");
        sync.setAttempts(attempts);
        tx.setOrderSync(sync);
        return tx;
    }

    private Update capturedRetryUpdate() {
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), update.capture(), eq(Transaction.class));
        return update.getValue();
    }

    @Test
    @DisplayName("a broker failure schedules a retry and keeps the entry PENDING")
    void brokerFailureSchedulesRetry() {
        when(mongoTemplate.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class),
                eq(Transaction.class))).thenReturn(leased(0), (Transaction) null);
        doThrow(new AmqpException("broker down")).when(rabbitTemplate)
                .convertAndSend(anyString(), anyString(), any(Object.class), any(org.springframework.amqp.rabbit.connection.CorrelationData.class));

        assertThat(relay.relayDue()).isZero();

        Document set = (Document) capturedRetryUpdate().getUpdateObject().get("$set");
        assertThat(set.get("orderSync.attempts")).isEqualTo(1);
        assertThat(set.containsKey("orderSync.status")).isFalse();
        assertThat(registry.counter("payment.order_sync.dead").count()).isZero();
    }

    @Test
    @DisplayName("the last allowed failure marks the entry DEAD and counts it")
    void lastFailureMarksDead() {
        when(mongoTemplate.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class),
                eq(Transaction.class))).thenReturn(leased(2), (Transaction) null);
        doThrow(new AmqpException("broker down")).when(rabbitTemplate)
                .convertAndSend(anyString(), anyString(), any(Object.class), any(org.springframework.amqp.rabbit.connection.CorrelationData.class));

        relay.relayDue();

        Document set = (Document) capturedRetryUpdate().getUpdateObject().get("$set");
        assertThat(set.get("orderSync.status")).isEqualTo("DEAD");
        assertThat(registry.counter("payment.order_sync.dead").count()).isEqualTo(1.0);
    }
}
