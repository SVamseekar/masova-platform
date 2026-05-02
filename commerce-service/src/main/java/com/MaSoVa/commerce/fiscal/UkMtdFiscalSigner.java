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
 * UK Making Tax Digital (MTD) signer.
 * Passthrough at the individual transaction level — records to uk_vat_ledger table.
 * Manager triggers quarterly HMRC MTD submission from FiscalCompliancePage.
 * isRequired() = false because signing doesn't block individual orders,
 * but ledger entry IS recorded (the isRequired check only affects RECEIPT_SIGNING_FAILED alert).
 */
@Component
public class UkMtdFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(UkMtdFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        String mtdTransactionId = "MTD-GB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        FiscalSignature sig = new FiscalSignature(
            "GB", "MTD", mtdTransactionId, null,
            null, Instant.now(), null, false
        );
        log.info("[FISCAL-GB] MTD ledger entry recorded order={} mtdId={}", order.getId(), mtdTransactionId);
        return sig;
    }

    @Override
    public boolean isRequired() { return false; }

    @Override
    public String getSignerSystem() { return "MTD"; }
}
