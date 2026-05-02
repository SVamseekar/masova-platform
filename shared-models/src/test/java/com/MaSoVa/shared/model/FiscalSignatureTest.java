package com.MaSoVa.shared.model;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class FiscalSignatureTest {

    @Test
    void passthrough_signature_has_no_signature_value() {
        FiscalSignature sig = FiscalSignature.passthrough("NL");
        assertThat(sig.getSignerCountry()).isEqualTo("NL");
        assertThat(sig.getSignerSystem()).isEqualTo("PASSTHROUGH");
        assertThat(sig.getSignatureValue()).isNull();
        assertThat(sig.isRequired()).isFalse();
        assertThat(sig.getSignedAt()).isNotNull();
    }

    @Test
    void full_signature_stores_all_fields() {
        Instant now = Instant.now();
        FiscalSignature sig = new FiscalSignature(
            "DE", "TSE", "txn-001", "SIG-ABC123", null, now, "device-1", false
        );
        assertThat(sig.getSignerCountry()).isEqualTo("DE");
        assertThat(sig.getSignerSystem()).isEqualTo("TSE");
        assertThat(sig.getTransactionId()).isEqualTo("txn-001");
        assertThat(sig.getSignatureValue()).isEqualTo("SIG-ABC123");
        assertThat(sig.getSignedAt()).isEqualTo(now);
        assertThat(sig.isRequired()).isFalse();
    }

    @Test
    void failed_signature_captures_error() {
        FiscalSignature sig = FiscalSignature.failed("DE", "TSE", "Connection refused");
        assertThat(sig.getSignerCountry()).isEqualTo("DE");
        assertThat(sig.isSigningFailed()).isTrue();
        assertThat(sig.getSigningError()).isEqualTo("Connection refused");
    }
}
