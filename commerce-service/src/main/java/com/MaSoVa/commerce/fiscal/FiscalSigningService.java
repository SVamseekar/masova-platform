package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Orchestrates fiscal signing after an order reaches terminal status.
 * 1. Resolves the correct FiscalSigner via FiscalSignerRegistry.
 * 2. Calls sign() — never throws (all exceptions handled inside signer).
 * 3. Stores FiscalSignature on the MongoDB order document.
 * 4. Dual-writes fiscal columns to PostgreSQL OrderJpaEntity.
 * 5. Publishes ReceiptSignedEvent — isSigningFailed=true alerts manager.
 *
 * Runs @Async so fiscal signing does not block the status update HTTP response.
 */
@Service
public class FiscalSigningService {

    private static final Logger log = LoggerFactory.getLogger(FiscalSigningService.class);

    private final FiscalSignerRegistry registry;
    private final OrderRepository orderRepository;
    private final OrderJpaRepository orderJpaRepository;
    private final OrderEventPublisher eventPublisher;

    public FiscalSigningService(FiscalSignerRegistry registry,
                                 OrderRepository orderRepository,
                                 OrderJpaRepository orderJpaRepository,
                                 OrderEventPublisher eventPublisher) {
        this.registry = registry;
        this.orderRepository = orderRepository;
        this.orderJpaRepository = orderJpaRepository;
        this.eventPublisher = eventPublisher;
    }

    @Async
    public void signOrder(Order order) {
        String countryCode = order.getVatCountryCode();
        FiscalSigner signer = registry.resolve(countryCode);

        FiscalSignature signature;
        try {
            signature = signer.sign(order, order.getVatBreakdown());
        } catch (Exception e) {
            log.warn("[FISCAL] Unexpected exception from signer for order={} country={}: {}",
                    order.getId(), countryCode, e.getMessage());
            signature = FiscalSignature.failed(
                countryCode != null ? countryCode : "UNKNOWN",
                signer.getSignerSystem(),
                e.getMessage()
            );
        }

        order.setFiscalSignature(signature);
        orderRepository.save(order);

        if (signature.isSigningFailed()) {
            log.warn("[FISCAL] RECEIPT_SIGNING_FAILED for order={} country={}: {}",
                    order.getId(), countryCode, signature.getSigningError());
        }

        // Dual-write: update PostgreSQL fiscal columns
        final FiscalSignature finalSignature = signature;
        try {
            orderJpaRepository.findByMongoId(order.getId()).ifPresent(jpa -> {
                jpa.setFiscalSignatureId(finalSignature.getTransactionId());
                jpa.setFiscalSignerSystem(finalSignature.getSignerSystem());
                jpa.setFiscalSigningFailed(finalSignature.isSigningFailed());
                jpa.setFiscalSignedAt(finalSignature.getSignedAt());
                orderJpaRepository.save(jpa);
            });
        } catch (Exception e) {
            log.warn("[FISCAL] PG dual-write failed for order={}: {}", order.getId(), e.getMessage());
        }

        ReceiptSignedEvent event = new ReceiptSignedEvent(
            order.getId(),
            order.getStoreId(),
            countryCode,
            signature
        );
        eventPublisher.publishReceiptSigned(event);
    }
}
