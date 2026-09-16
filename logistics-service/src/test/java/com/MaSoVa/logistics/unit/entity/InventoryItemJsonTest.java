package com.MaSoVa.logistics.unit.entity;

import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("InventoryItem JSON / Redis cache round-trip")
class InventoryItemJsonTest {

    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Test
    @DisplayName("deserializes Redis payload that includes derived fields (expired, availableStock)")
    void ignoresUnknownDerivedFieldsFromCache() throws Exception {
        String cachedJson = """
            {
              "id": "inv-1",
              "storeId": "DOM001",
              "itemName": "Mozzarella",
              "itemCode": "SEED-INV-MOZZ",
              "currentStock": 25.0,
              "reservedStock": 0.0,
              "minimumStock": 5.0,
              "averageCost": 4.50,
              "status": "AVAILABLE",
              "isPerishable": true,
              "expired": false,
              "outOfStock": false,
              "needsReorder": false,
              "availableStock": 25.0,
              "totalStockValue": 112.5
            }
            """;

        InventoryItem item = mapper.readValue(cachedJson, InventoryItem.class);
        assertThat(item.getId()).isEqualTo("inv-1");
        assertThat(item.getStoreId()).isEqualTo("DOM001");
        assertThat(item.getCurrentStock()).isEqualTo(25.0);
        assertThat(item.getAvailableStock()).isEqualTo(25.0);
        assertThat(item.isExpired()).isFalse();
    }

    @Test
    @DisplayName("serialize does not emit derived fields that poison Redis cache")
    void serializeOmitsDerivedFields() throws Exception {
        InventoryItem item = new InventoryItem();
        item.setId("inv-2");
        item.setStoreId("DOM001");
        item.setItemName("Flour");
        item.setCurrentStock(10.0);
        item.setReservedStock(1.0);
        item.setMinimumStock(2.0);
        item.setAverageCost(new BigDecimal("1.20"));
        item.setIsPerishable(false);

        String json = mapper.writeValueAsString(item);
        assertThat(json).doesNotContain("\"expired\"");
        assertThat(json).doesNotContain("\"availableStock\"");
        assertThat(json).doesNotContain("\"needsReorder\"");
        assertThat(json).doesNotContain("\"outOfStock\"");
        assertThat(json).doesNotContain("\"totalStockValue\"");
    }
}
