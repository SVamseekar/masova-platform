package com.MaSoVa.intelligence.unit.messaging;

import com.MaSoVa.intelligence.messaging.AnalyticsEventListener;
import com.MaSoVa.intelligence.service.AnalyticsService;
import com.MaSoVa.shared.messaging.events.AggregatorOrderReceivedEvent;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import com.MaSoVa.shared.messaging.events.PaymentCompletedEvent;
import com.MaSoVa.shared.messaging.events.PaymentFailedEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsEventListener Unit Tests")
class AnalyticsEventListenerTest {

    @Mock private AnalyticsService analyticsService;

    @InjectMocks private AnalyticsEventListener analyticsEventListener;

    @Test
    @DisplayName("onOrderCreated calls recordOrderEvent with CREATED status")
    void onOrderCreated_callsRecordOrderEvent() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "ord-1", "cust-1", "store-1", "DELIVERY", BigDecimal.valueOf(300), "INR"
        );

        analyticsEventListener.onOrderCreated(event);

        verify(analyticsService).recordOrderEvent("ord-1", "store-1", "cust-1", "DELIVERY", BigDecimal.valueOf(300), "CREATED");
    }

    @Test
    @DisplayName("onOrderStatusChanged calls recordOrderEvent with new status")
    void onOrderStatusChanged_callsRecordOrderEvent() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "ord-2", "cust-2", "PENDING", "DELIVERED", "store-1"
        );

        analyticsEventListener.onOrderStatusChanged(event);

        verify(analyticsService).recordOrderEvent("ord-2", "store-1", "cust-2", null, null, "DELIVERED");
    }

    @Test
    @DisplayName("onPaymentCompleted calls recordPaymentEvent with success=true")
    void onPaymentCompleted_callsRecordPaymentEventWithSuccess() {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
            "pay-1", "ord-1", "cust-1", BigDecimal.valueOf(500), "INR", "UPI", "txn-1", "RAZORPAY", "upi"
        );

        analyticsEventListener.onPaymentCompleted(event);

        verify(analyticsService).recordPaymentEvent("pay-1", "ord-1", BigDecimal.valueOf(500), "UPI", true);
    }

    @Test
    @DisplayName("onPaymentFailed calls recordPaymentEvent with success=false and null method")
    void onPaymentFailed_callsRecordPaymentEventWithFailure() {
        PaymentFailedEvent event = new PaymentFailedEvent(
            "pay-2", "ord-2", "cust-2", BigDecimal.valueOf(200), "Insufficient funds", "RAZORPAY"
        );

        analyticsEventListener.onPaymentFailed(event);

        verify(analyticsService).recordPaymentEvent("pay-2", "ord-2", BigDecimal.valueOf(200), null, false);
    }

    @Test
    @DisplayName("onAggregatorOrderReceived calls recordAggregatorOrderEvent with correct params")
    void onAggregatorOrderReceived_callsRecordAggregatorOrderEvent() {
        AggregatorOrderReceivedEvent event = new AggregatorOrderReceivedEvent(
            "ord-3", "store-1", "ZOMATO",
            BigDecimal.valueOf(500), BigDecimal.valueOf(50), BigDecimal.valueOf(450), "INR"
        );

        analyticsEventListener.onAggregatorOrderReceived(event);

        verify(analyticsService).recordAggregatorOrderEvent(
            "ord-3", "store-1", "ZOMATO",
            BigDecimal.valueOf(500), BigDecimal.valueOf(50), BigDecimal.valueOf(450), "INR"
        );
    }

    @Test
    @DisplayName("onOrderCreated catches exception and does not rethrow")
    void onOrderCreated_catchesExceptionGracefully() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "ord-err", "cust-1", "store-1", "DELIVERY", BigDecimal.valueOf(100), "INR"
        );

        doThrow(new RuntimeException("DB unavailable"))
            .when(analyticsService).recordOrderEvent(any(), any(), any(), any(), any(), any());

        analyticsEventListener.onOrderCreated(event);
    }

    @Test
    @DisplayName("onOrderStatusChanged catches exception and does not rethrow")
    void onOrderStatusChanged_catchesExceptionGracefully() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "ord-err", "cust-1", "PENDING", "CANCELLED", "store-1"
        );

        doThrow(new RuntimeException("DB unavailable"))
            .when(analyticsService).recordOrderEvent(any(), any(), any(), isNull(), isNull(), any());

        analyticsEventListener.onOrderStatusChanged(event);
    }

    @Test
    @DisplayName("onPaymentCompleted catches exception and does not rethrow")
    void onPaymentCompleted_catchesExceptionGracefully() {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
            "pay-err", "ord-1", "cust-1", BigDecimal.valueOf(100), "INR", "CARD", "txn-1", "RAZORPAY", "card"
        );

        doThrow(new RuntimeException("service down"))
            .when(analyticsService).recordPaymentEvent(any(), any(), any(), any(), anyBoolean());

        analyticsEventListener.onPaymentCompleted(event);
    }

    @Test
    @DisplayName("onPaymentFailed catches exception and does not rethrow")
    void onPaymentFailed_catchesExceptionGracefully() {
        PaymentFailedEvent event = new PaymentFailedEvent(
            "pay-err", "ord-1", "cust-1", BigDecimal.valueOf(100), "Network error", "RAZORPAY"
        );

        doThrow(new RuntimeException("service down"))
            .when(analyticsService).recordPaymentEvent(any(), any(), any(), isNull(), anyBoolean());

        analyticsEventListener.onPaymentFailed(event);
    }

    @Test
    @DisplayName("onAggregatorOrderReceived catches exception and does not rethrow")
    void onAggregatorOrderReceived_catchesExceptionGracefully() {
        AggregatorOrderReceivedEvent event = new AggregatorOrderReceivedEvent(
            "ord-err", "store-1", "SWIGGY",
            BigDecimal.valueOf(200), BigDecimal.valueOf(20), BigDecimal.valueOf(180), "INR"
        );

        doThrow(new RuntimeException("service down"))
            .when(analyticsService).recordAggregatorOrderEvent(any(), any(), any(), any(), any(), any(), any());

        analyticsEventListener.onAggregatorOrderReceived(event);
    }
}
