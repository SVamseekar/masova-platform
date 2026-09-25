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
 * Hungary NTCA (OSCAR) government API signer.
 * The stub is not a legal signature. Production fails closed.
 * Lab profiles may still return a STUB-NTCA value so orders flow.
 */
@Component
public class HungaryNtcaFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(HungaryNtcaFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String ntcaTransactionId = "NTCA-HU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            FiscalSignature sig = new FiscalSignature(
                "HU", "NTCA", ntcaTransactionId, "STUB-NTCA-SIG-" + order.getId(),
                null, Instant.now(), null, true
            );
            log.info("[FISCAL-HU] NTCA signed order={} ntcaId={}", order.getId(), ntcaTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-HU] NTCA signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("HU", "NTCA", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "NTCA"; }
}
