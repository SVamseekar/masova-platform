package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/** Belgium FDM black box hardware signer — stub for Phase 1. */
@Component
public class BelgiumFdmFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(BelgiumFdmFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String fdmTransactionId = "FDM-BE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            FiscalSignature sig = new FiscalSignature(
                "BE", "FDM", fdmTransactionId, "STUB-FDM-SIG-" + order.getId(),
                null, Instant.now(), "STUB-FDM-DEVICE-001", true
            );
            log.info("[FISCAL-BE] FDM signed order={} fdmId={}", order.getId(), fdmTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-BE] FDM signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("BE", "FDM", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "FDM"; }
}
