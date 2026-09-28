package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.OrderPostgresOutbox;
import com.MaSoVa.commerce.order.repository.OrderPostgresOutboxRepository;
import com.MaSoVa.commerce.order.service.OrderPostgresOutboxProjector;
import com.MaSoVa.commerce.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * OrderPostgresOutboxProjector drains OrderPostgresOutbox entries left behind when the
 * in-request best-effort PostgreSQL projection failed (B2b, D08). MongoDB is the system of
 * record; this replays the current Mongo order into Postgres via OrderService.reprojectToPostgres.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderPostgresOutboxProjectorTest {

    @Mock private OrderPostgresOutboxRepository outboxRepository;
    @Mock private OrderService orderService;
    @Mock private ObjectProvider<io.micrometer.core.instrument.MeterRegistry> meterRegistry;

    private OrderPostgresOutboxProjector projector;

    @BeforeEach
    void setUp() {
        when(meterRegistry.getIfAvailable()).thenReturn(null);
        projector = new OrderPostgresOutboxProjector(outboxRepository, orderService, meterRegistry, 3);
    }

    private OrderPostgresOutbox pendingEntry(String orderId) {
        OrderPostgresOutbox entry = new OrderPostgresOutbox();
        entry.setOrderId(orderId);
        entry.setOrderNumber("ORD-" + orderId);
        entry.setOperation("SYNC");
        return entry;
    }

    @Test
    void drain_reprojectsEachPendingEntry_andMarksResolved() {
        OrderPostgresOutbox entry = pendingEntry("o1");
        when(outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc())
                .thenReturn(List.of(entry));

        projector.drain();

        verify(orderService).reprojectToPostgres("o1");
        ArgumentCaptor<OrderPostgresOutbox> saved = ArgumentCaptor.forClass(OrderPostgresOutbox.class);
        verify(outboxRepository).save(saved.capture());
        assertThat(saved.getValue().getResolvedAt()).isNotNull();
        assertThat(saved.getValue().isDeadLettered()).isFalse();
    }

    @Test
    void drain_incrementsAttemptsAndKeepsUnresolved_onFailure() {
        OrderPostgresOutbox entry = pendingEntry("o2");
        when(outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc())
                .thenReturn(List.of(entry));
        doThrow(new RuntimeException("boom")).when(orderService).reprojectToPostgres("o2");

        projector.drain();

        ArgumentCaptor<OrderPostgresOutbox> saved = ArgumentCaptor.forClass(OrderPostgresOutbox.class);
        verify(outboxRepository).save(saved.capture());
        assertThat(saved.getValue().getAttempts()).isEqualTo(1);
        assertThat(saved.getValue().getResolvedAt()).isNull();
        assertThat(saved.getValue().isDeadLettered()).isFalse();
        assertThat(saved.getValue().getLastError()).isEqualTo("boom");
    }

    @Test
    void drain_deadLettersAfterMaxAttempts() {
        OrderPostgresOutbox entry = pendingEntry("o3");
        entry.setAttempts(2); // maxAttempts=3, this failure is the 3rd
        when(outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc())
                .thenReturn(List.of(entry));
        doThrow(new RuntimeException("still broken")).when(orderService).reprojectToPostgres("o3");

        projector.drain();

        ArgumentCaptor<OrderPostgresOutbox> saved = ArgumentCaptor.forClass(OrderPostgresOutbox.class);
        verify(outboxRepository).save(saved.capture());
        assertThat(saved.getValue().getAttempts()).isEqualTo(3);
        assertThat(saved.getValue().isDeadLettered()).isTrue();
    }

    @Test
    void drain_doesNothingWhenNoPendingEntries() {
        when(outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc())
                .thenReturn(List.of());

        projector.drain();

        verifyNoInteractions(orderService);
        verify(outboxRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void drain_continuesBatchWhenOneEntryFails_soOneBadRowDoesNotBlockTheRest() {
        OrderPostgresOutbox first = pendingEntry("o1");
        OrderPostgresOutbox second = pendingEntry("o2");
        OrderPostgresOutbox third = pendingEntry("o3");
        when(outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc())
                .thenReturn(List.of(first, second, third));
        doThrow(new RuntimeException("boom")).when(orderService).reprojectToPostgres("o2");

        projector.drain();

        verify(orderService).reprojectToPostgres("o1");
        verify(orderService).reprojectToPostgres("o2");
        verify(orderService).reprojectToPostgres("o3");
        assertThat(first.getResolvedAt()).isNotNull();
        assertThat(second.getResolvedAt()).isNull();
        assertThat(second.getAttempts()).isEqualTo(1);
        assertThat(third.getResolvedAt()).isNotNull();
        verify(outboxRepository, times(3)).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void drain_continuesBatchWhenSaveItselfFails_soOneBadWriteDoesNotBlockTheRest() {
        OrderPostgresOutbox first = pendingEntry("o1");
        OrderPostgresOutbox second = pendingEntry("o2");
        when(outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc())
                .thenReturn(List.of(first, second));
        doThrow(new RuntimeException("mongo write failed")).when(outboxRepository).save(first);

        projector.drain();

        verify(orderService).reprojectToPostgres("o1");
        verify(orderService).reprojectToPostgres("o2");
        verify(outboxRepository).save(second);
        assertThat(second.getResolvedAt()).isNotNull();
    }

    @Test
    void drain_recordsExceptionClassNameWhenMessageIsNull() {
        OrderPostgresOutbox entry = pendingEntry("o4");
        when(outboxRepository.findTop50ByResolvedAtIsNullAndDeadLetteredFalseOrderByCreatedAtAsc())
                .thenReturn(List.of(entry));
        doThrow(new NullPointerException()).when(orderService).reprojectToPostgres("o4");

        projector.drain();

        assertThat(entry.getLastError()).isEqualTo(NullPointerException.class.getName());
    }
}
