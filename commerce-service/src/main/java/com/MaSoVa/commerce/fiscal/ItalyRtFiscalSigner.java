package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/** Italy RT Device fiscal signer — hardware API stub for Phase 1. */
@Component
public class ItalyRtFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(ItalyRtFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String rtTransactionId = "RT-IT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            FiscalSignature sig = new FiscalSignature(
                "IT", "RT", rtTransactionId, "STUB-RT-SIG-" + order.getId(),
                null, Instant.now(), "STUB-RT-DEVICE-001", true
            );
            log.info("[FISCAL-IT] RT signed order={} rtId={}", order.getId(), rtTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-IT] RT signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("IT", "RT", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "RT"; }
}
