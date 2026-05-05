package com.MaSoVa.shared.messaging.events;

import com.MaSoVa.shared.model.FiscalSignature;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ReceiptSignedEventTest {

    @Test
    void event_carries_order_id_and_signature() {
        FiscalSignature sig = FiscalSignature.passthrough("NL");
        ReceiptSignedEvent event = new ReceiptSignedEvent("ord-001", "store-001", "NL", sig);
        assertThat(event.getOrderId()).isEqualTo("ord-001");
        assertThat(event.getStoreId()).isEqualTo("store-001");
        assertThat(event.getCountryCode()).isEqualTo("NL");
        assertThat(event.getFiscalSignature()).isNotNull();
        assertThat(event.getEventType()).isEqualTo("RECEIPT_SIGNED");
    }

    @Test
    void signing_failed_flag_is_propagated() {
        FiscalSignature sig = FiscalSignature.failed("DE", "TSE", "TSE offline");
        ReceiptSignedEvent event = new ReceiptSignedEvent("ord-002", "store-002", "DE", sig);
        assertThat(event.isSigningFailed()).isTrue();
    }
}
