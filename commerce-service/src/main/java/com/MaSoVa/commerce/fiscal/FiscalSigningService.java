package com.MaSoVa.commerce.fiscal;

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
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

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
    private final FiscalOutageRepository fiscalOutageRepository;
    private final OrderEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<MeterRegistry> meterRegistry;

    public FiscalSigningService(FiscalSignerRegistry registry,
                                 OrderRepository orderRepository,
                                 OrderJpaRepository orderJpaRepository,
                                 FiscalSignatureRepository fiscalSignatureRepository,
                                 FiscalOutageRepository fiscalOutageRepository,
                                 OrderEventPublisher eventPublisher,
                                 ObjectMapper objectMapper,
                                 ObjectProvider<MeterRegistry> meterRegistry) {
        this.registry = registry;
        this.orderRepository = orderRepository;
        this.orderJpaRepository = orderJpaRepository;
        this.fiscalSignatureRepository = fiscalSignatureRepository;
        this.fiscalOutageRepository = fiscalOutageRepository;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        MeterRegistry registryInstance = meterRegistry.getIfAvailable();
        if (registryInstance != null) {
            io.micrometer.core.instrument.Gauge.builder("fiscal.outage.open", fiscalOutageRepository,
                            FiscalOutageRepository::countByClosedAtIsNull)
                    .description("Open fiscal signing outages (store+signer pairs currently failing)")
                    .register(registryInstance);
        }
    }

    /** True when a store in this country cannot go live: it needs a certified signer and has none (#126). */
    public boolean blocksLiveTrading(String countryCode) {
        return registry.blocksLiveTrading(countryCode);
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

        try {
            recordOutageState(order.getStoreId(), signature);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Two concurrent failures for the same store+signer both tried to open an outage;
            // the partial unique index let one through. The other's outage is already recorded.
            log.debug("[FISCAL] outage already opened by a concurrent order for store={} signer={}",
                    order.getStoreId(), signature.getSignerSystem());
        } catch (Exception e) {
            // Anything else here means the legally-mandated outage log did NOT get updated —
            // distinct from the benign race above, so it gets the full exception and order id.
            log.warn("[FISCAL] outage log update failed for order={} store={} signer={}: {}",
                    order.getId(), order.getStoreId(), signature.getSignerSystem(), e.getMessage(), e);
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

    /**
     * Opens a per-(store, signer) outage row on the first failure and closes it on the next
     * success, so KassenSichV/AEAO §146a Nr. 7's start/end/cause outage log stays accurate (#126).
     */
    private void recordOutageState(String storeId, FiscalSignature signature) {
        String signerSystem = signature.getSignerSystem();
        if (storeId == null || signerSystem == null) {
            log.warn("[FISCAL] outage state not recorded: storeId or signerSystem missing (storeId={}, signerSystem={})",
                    storeId, signerSystem);
            return;
        }
        Optional<FiscalOutageJpaEntity> open =
                fiscalOutageRepository.findByStoreIdAndSignerSystemAndClosedAtIsNull(storeId, signerSystem);
        if (signature.isSigningFailed()) {
            if (open.isEmpty()) {
                fiscalOutageRepository.save(FiscalOutageJpaEntity.builder()
                        .storeId(storeId)
                        .signerSystem(signerSystem)
                        .openedAt(OffsetDateTime.now(ZoneOffset.UTC))
                        .cause(signature.getSigningError())
                        .build());
            }
        } else {
            open.ifPresent(outage -> {
                outage.setClosedAt(OffsetDateTime.now(ZoneOffset.UTC));
                fiscalOutageRepository.save(outage);
            });
        }
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
