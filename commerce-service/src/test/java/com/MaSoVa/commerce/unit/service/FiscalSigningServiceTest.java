package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.fiscal.*;
import com.MaSoVa.commerce.fiscal.entity.FiscalOutageJpaEntity;
import com.MaSoVa.commerce.fiscal.entity.FiscalSignatureJpaEntity;
import com.MaSoVa.commerce.fiscal.repository.FiscalOutageRepository;
import com.MaSoVa.commerce.fiscal.repository.FiscalSignatureRepository;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

class FiscalSigningServiceTest {

    private FiscalSignerRegistry registry;
    private OrderRepository orderRepository;
    private OrderJpaRepository orderJpaRepository;
    private FiscalSignatureRepository fiscalSignatureRepository;
    private FiscalOutageRepository fiscalOutageRepository;
    private OrderEventPublisher eventPublisher;
    private FiscalSigningService fiscalSigningService;

    @SuppressWarnings("unchecked")
    private static ObjectProvider<io.micrometer.core.instrument.MeterRegistry> noopMeterRegistry() {
        ObjectProvider<io.micrometer.core.instrument.MeterRegistry> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }

    @BeforeEach
    void setUp() {
        registry = mock(FiscalSignerRegistry.class);
        orderRepository = mock(OrderRepository.class);
        orderJpaRepository = mock(OrderJpaRepository.class);
        fiscalSignatureRepository = mock(FiscalSignatureRepository.class);
        fiscalOutageRepository = mock(FiscalOutageRepository.class);
        eventPublisher = mock(OrderEventPublisher.class);
        fiscalSigningService = new FiscalSigningService(
                registry, orderRepository, orderJpaRepository, fiscalSignatureRepository,
                fiscalOutageRepository, eventPublisher, new ObjectMapper(), noopMeterRegistry());
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
        verify(fiscalSignatureRepository).save(any(FiscalSignatureJpaEntity.class));
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

    @Nested
    @DisplayName("outage log (#126)")
    class OutageLog {

        private Order deOrder() {
            Order order = new Order();
            order.setId("ord-DE");
            order.setStoreId("store-DE");
            order.setVatCountryCode("DE");
            return order;
        }

        private FiscalSigner failingTse() {
            FiscalSigner signer = mock(FiscalSigner.class);
            when(signer.sign(any(), any())).thenReturn(FiscalSignature.failed("DE", "TSE", "TSE offline"));
            when(signer.getSignerSystem()).thenReturn("TSE");
            return signer;
        }

        @BeforeEach
        void setUp() {
            when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(orderJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());
        }

        @Test
        @DisplayName("a signing failure opens an outage row when none is open")
        void failureOpensOutage() {
            FiscalSigner failing = failingTse();
            when(registry.resolve("DE")).thenReturn(failing);
            when(fiscalOutageRepository.findByStoreIdAndSignerSystemAndClosedAtIsNull("store-DE", "TSE"))
                    .thenReturn(Optional.empty());

            fiscalSigningService.signOrder(deOrder());

            verify(fiscalOutageRepository).save(argThat(outage ->
                    "store-DE".equals(outage.getStoreId()) && "TSE".equals(outage.getSignerSystem())
                            && outage.getOpenedAt() != null && outage.getClosedAt() == null
                            && "TSE offline".equals(outage.getCause())));
        }

        @Test
        @DisplayName("a second failure does not open a duplicate outage")
        void secondFailureDoesNotDuplicateOutage() {
            FiscalSigner failing = failingTse();
            when(registry.resolve("DE")).thenReturn(failing);
            FiscalOutageJpaEntity alreadyOpen = FiscalOutageJpaEntity.builder()
                    .id(1L).storeId("store-DE").signerSystem("TSE")
                    .openedAt(java.time.OffsetDateTime.now().minusHours(1))
                    .build();
            when(fiscalOutageRepository.findByStoreIdAndSignerSystemAndClosedAtIsNull("store-DE", "TSE"))
                    .thenReturn(Optional.of(alreadyOpen));

            fiscalSigningService.signOrder(deOrder());

            verify(fiscalOutageRepository, never()).save(any());
        }

        @Test
        @DisplayName("a success closes the open outage")
        void successClosesOutage() {
            FranceNf525FiscalSigner ok = new FranceNf525FiscalSigner();
            when(registry.resolve("DE")).thenReturn(ok);
            FiscalOutageJpaEntity open = FiscalOutageJpaEntity.builder()
                    .id(1L).storeId("store-DE").signerSystem("NF525")
                    .openedAt(java.time.OffsetDateTime.now().minusHours(1))
                    .build();
            when(fiscalOutageRepository.findByStoreIdAndSignerSystemAndClosedAtIsNull("store-DE", "NF525"))
                    .thenReturn(Optional.of(open));

            fiscalSigningService.signOrder(deOrder());

            verify(fiscalOutageRepository).save(argThat(outage -> outage.getClosedAt() != null));
        }

        @Test
        @DisplayName("a success with no open outage does nothing")
        void successWithNoOpenOutageDoesNothing() {
            FranceNf525FiscalSigner ok = new FranceNf525FiscalSigner();
            when(registry.resolve("DE")).thenReturn(ok);
            when(fiscalOutageRepository.findByStoreIdAndSignerSystemAndClosedAtIsNull("store-DE", "NF525"))
                    .thenReturn(Optional.empty());

            fiscalSigningService.signOrder(deOrder());

            verify(fiscalOutageRepository, never()).save(any());
        }
    }
}
