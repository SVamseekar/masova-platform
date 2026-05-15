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
 * France NF525 software certification signer.
 * Once signed, the order is immutable — no fields may be modified.
 * Corrections are new credit note orders, never edits.
 */
@Component
public class FranceNf525FiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(FranceNf525FiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String nf525TransactionId = "NF525-FR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String signatureValue = "STUB-NF525-SIG-" + order.getId();

            FiscalSignature sig = new FiscalSignature(
                "FR", "NF525", nf525TransactionId, signatureValue,
                null, Instant.now(), null, true
            );
            log.info("[FISCAL-FR] NF525 signed order={} txnId={}", order.getId(), nf525TransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-FR] NF525 signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("FR", "NF525", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "NF525"; }
}
