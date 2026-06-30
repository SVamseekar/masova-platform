package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.fiscal.entity.FiscalSignatureJpaEntity;
import com.MaSoVa.commerce.fiscal.repository.FiscalSignatureRepository;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

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
    private final FiscalSignatureRepository fiscalSignatureRepository;
    private final OrderEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public FiscalSigningService(FiscalSignerRegistry registry,
                                 OrderRepository orderRepository,
                                 OrderJpaRepository orderJpaRepository,
                                 FiscalSignatureRepository fiscalSignatureRepository,
                                 OrderEventPublisher eventPublisher,
                                 ObjectMapper objectMapper) {
        this.registry = registry;
        this.orderRepository = orderRepository;
        this.orderJpaRepository = orderJpaRepository;
        this.fiscalSignatureRepository = fiscalSignatureRepository;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
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

        // Append-only write to fiscal_signatures table (legal retention)
        try {
            persistFiscalSignature(order, finalSignature);
        } catch (Exception e) {
            log.warn("[FISCAL] fiscal_signatures insert failed for order={}: {}", order.getId(), e.getMessage());
        }

        ReceiptSignedEvent event = new ReceiptSignedEvent(
            order.getId(),
            order.getStoreId(),
            countryCode,
            signature
        );
        eventPublisher.publishReceiptSigned(event);
    }

    private void persistFiscalSignature(Order order, FiscalSignature signature) {
        OffsetDateTime signedAt = signature.getSignedAt() != null
                ? OffsetDateTime.ofInstant(signature.getSignedAt(), ZoneOffset.UTC)
                : OffsetDateTime.now(ZoneOffset.UTC);

        String extrasJson = null;
        if (signature.getExtras() != null && !signature.getExtras().isEmpty()) {
            extrasJson = objectMapper.valueToTree(signature.getExtras()).toString();
        }

        FiscalSignatureJpaEntity entity = FiscalSignatureJpaEntity.builder()
                .orderId(order.getId())
                .storeId(order.getStoreId())
                .countryCode(signature.getSignerCountry())
                .signerSystem(signature.getSignerSystem())
                .transactionId(signature.getTransactionId())
                .signatureValue(signature.getSignatureValue())
                .qrCodeData(signature.getQrCodeData())
                .signingDeviceId(signature.getSigningDeviceId())
                .signedAt(signedAt)
                .isRequired(signature.isRequired())
                .signingFailed(signature.isSigningFailed())
                .signingError(signature.getSigningError())
                .extras(extrasJson)
                .build();

        fiscalSignatureRepository.save(entity);
    }
}
