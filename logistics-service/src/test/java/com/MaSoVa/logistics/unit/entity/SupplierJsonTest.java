package com.MaSoVa.logistics.unit.entity;

import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Supplier JSON / Redis cache round-trip")
class SupplierJsonTest {

    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Test
    @DisplayName("deserializes cache payload with derived fields (reliable, deliveryPerformance)")
    void ignoresUnknownDerivedFields() throws Exception {
        String json = """
            {
              "id": "sup-1",
              "supplierCode": "SEED-SUP-MOZZ",
              "supplierName": "Berlin Molkerei",
              "status": "ACTIVE",
              "totalOrders": 10,
              "completedOrders": 9,
              "onTimeDeliveryRate": 95.0,
              "qualityRating": 4.8,
              "reliable": true,
              "deliveryPerformance": 90.0
            }
            """;
        Supplier s = mapper.readValue(json, Supplier.class);
        assertThat(s.getSupplierCode()).isEqualTo("SEED-SUP-MOZZ");
        assertThat(s.isReliable()).isTrue();
        assertThat(s.getDeliveryPerformance()).isEqualTo(90.0);
    }

    @Test
    @DisplayName("serialize omits derived fields")
    void serializeOmitsDerived() throws Exception {
        Supplier s = new Supplier();
        s.setSupplierCode("X");
        s.setSupplierName("Y");
        s.setTotalOrders(5);
        s.setCompletedOrders(4);
        String json = mapper.writeValueAsString(s);
        assertThat(json).doesNotContain("\"reliable\"");
        assertThat(json).doesNotContain("\"deliveryPerformance\"");
    }
}
