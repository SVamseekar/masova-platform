package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

class FiscalSigningServiceTest {

    private FiscalSignerRegistry registry;
    private OrderRepository orderRepository;
    private OrderJpaRepository orderJpaRepository;
    private OrderEventPublisher eventPublisher;
    private FiscalSigningService fiscalSigningService;

    @BeforeEach
    void setUp() {
        registry = mock(FiscalSignerRegistry.class);
        orderRepository = mock(OrderRepository.class);
        orderJpaRepository = mock(OrderJpaRepository.class);
        eventPublisher = mock(OrderEventPublisher.class);
        fiscalSigningService = new FiscalSigningService(registry, orderRepository, orderJpaRepository, eventPublisher);
    }

    @Test
    void india_order_gets_passthrough_signature_and_publishes_event() {
        Order order = new Order();
        order.setId("ord-001");
        order.setStoreId("store-001");
        // vatCountryCode null = India order

        PassthroughFiscalSigner pt = new PassthroughFiscalSigner();
        when(registry.resolve(null)).thenReturn(pt);
        when(orderRepository.save(any())).thenReturn(order);
        when(orderJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

        fiscalSigningService.signOrder(order);

        verify(orderRepository).save(argThat(o -> o.getFiscalSignature() != null));
        verify(eventPublisher).publishReceiptSigned(any(ReceiptSignedEvent.class));
    }

    @Test
    void signing_failure_sets_signingFailed_flag_and_still_publishes() {
        Order order = new Order();
        order.setId("ord-002");
        order.setStoreId("store-DE");
        order.setVatCountryCode("DE");

        FiscalSigner failingSigner = mock(FiscalSigner.class);
        when(failingSigner.sign(any(), any())).thenReturn(
            FiscalSignature.failed("DE", "TSE", "TSE offline")
        );
        when(failingSigner.isRequired()).thenReturn(true);
        when(failingSigner.getSignerSystem()).thenReturn("TSE");
        when(registry.resolve("DE")).thenReturn(failingSigner);
        when(orderRepository.save(any())).thenReturn(order);
        when(orderJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

        fiscalSigningService.signOrder(order);

        verify(orderRepository).save(argThat(o ->
            o.getFiscalSignature() != null && o.getFiscalSignature().isSigningFailed()
        ));
        verify(eventPublisher).publishReceiptSigned(argThat(ReceiptSignedEvent::isSigningFailed));
    }

    @Test
    void successful_signing_does_not_set_failed_flag() {
        Order order = new Order();
        order.setId("ord-003");
        order.setStoreId("store-FR");
        order.setVatCountryCode("FR");

        FranceNf525FiscalSigner nf525 = new FranceNf525FiscalSigner();
        when(registry.resolve("FR")).thenReturn(nf525);
        when(orderRepository.save(any())).thenReturn(order);
        when(orderJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

        fiscalSigningService.signOrder(order);

        verify(orderRepository).save(argThat(o ->
            o.getFiscalSignature() != null && !o.getFiscalSignature().isSigningFailed()
        ));
    }
}
