package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Germany TSE fiscal signer — §146a AO.
 * Phase 1 implementation: stubs a successful TSE call with a generated transaction ID.
 * Phase 2: calls TSE hardware device REST API on store local network.
 * If unreachable: returns FiscalSignature.failed(...) — order gets RECEIPT_SIGNING_FAILED flag.
 */
@Component
public class GermanyTseFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(GermanyTseFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String tseTransactionId = "TSE-DE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String signatureValue = "STUB-TSE-SIG-" + order.getId();

            FiscalSignature sig = new FiscalSignature(
                "DE", "TSE", tseTransactionId, signatureValue,
                null, Instant.now(), "STUB-DEVICE-001", true
            );
            log.info("[FISCAL-DE] Signed order={} tseId={}", order.getId(), tseTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-DE] TSE signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("DE", "TSE", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "TSE"; }
}
