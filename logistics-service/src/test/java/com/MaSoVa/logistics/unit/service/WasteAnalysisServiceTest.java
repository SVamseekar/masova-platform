package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.entity.WasteRecord;
import com.MaSoVa.logistics.inventory.repository.WasteRecordRepository;
import com.MaSoVa.logistics.inventory.service.InventoryService;
import com.MaSoVa.logistics.inventory.service.WasteAnalysisService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("WasteAnalysisService Unit Tests")
class WasteAnalysisServiceTest {

    @Mock private WasteRecordRepository wasteRecordRepository;
    @Mock private InventoryService inventoryService;

    @InjectMocks private WasteAnalysisService wasteAnalysisService;

    private WasteRecord buildWasteRecord(String id, BigDecimal totalCost) {
        WasteRecord wr = new WasteRecord();
        wr.setId(id);
        wr.setStoreId("store-1");
        wr.setItemName("Lettuce");
        wr.setInventoryItemId("item-1");
        wr.setQuantity(2.0);
        wr.setUnit("KG");
        wr.setWasteCategory("EXPIRED");
        wr.setWasteReason("Past use-by date");
        wr.setPreventable(true);
        wr.setUnitCost(totalCost != null ? totalCost.divide(BigDecimal.valueOf(2)) : null);
        // simulate calculateTotalCost
        if (totalCost != null) {
            // use reflection-free path: set directly via method
            wr.setUnitCost(totalCost.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP));
            wr.calculateTotalCost();
        }
        return wr;
    }

    private WasteRecord buildWasteRecord(String id) {
        return buildWasteRecord(id, new BigDecimal("50.00")); // 2 * 25
    }

    private InventoryItem buildInventoryItem() {
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setItemName("Lettuce");
        item.setStoreId("store-1");
        item.setCurrentStock(10.0);
        item.setReservedStock(0.0);
        item.setMinimumStock(2.0);
        item.setAverageCost(new BigDecimal("25.00"));
        return item;
    }

    @Nested
    @DisplayName("recordWaste")
    class RecordWaste {

        @Test
        @DisplayName("records waste, sets unit cost from item, adjusts stock")
        void recordsWaste() {
            WasteRecord record = new WasteRecord();
            record.setInventoryItemId("item-1");
            record.setStoreId("store-1");
            record.setQuantity(2.0);
            record.setWasteCategory("EXPIRED");
            record.setUnitCost(null); // will be set from inventory item

            when(inventoryService.getInventoryItemById("item-1")).thenReturn(buildInventoryItem());
            when(inventoryService.adjustStock(eq("item-1"), eq(-2.0), anyString(), isNull(), any(), anyString()))
                .thenReturn(buildInventoryItem());
            when(wasteRecordRepository.save(any())).thenAnswer(inv -> {
                WasteRecord saved = inv.getArgument(0);
                saved.setId("waste-new");
                return saved;
            });

            WasteRecord result = wasteAnalysisService.recordWaste(record);

            assertThat(result.getId()).isEqualTo("waste-new");
            assertThat(result.getUnitCost()).isEqualByComparingTo(new BigDecimal("25.00"));
            verify(inventoryService).adjustStock(eq("item-1"), eq(-2.0), anyString(), isNull(), any(), anyString());
        }

        @Test
        @DisplayName("keeps existing unit cost when already set")
        void keepsExistingUnitCost() {
            WasteRecord record = new WasteRecord();
            record.setInventoryItemId("item-1");
            record.setStoreId("store-1");
            record.setQuantity(2.0);
            record.setWasteCategory("EXPIRED");
            record.setUnitCost(new BigDecimal("30.00")); // already set

            InventoryItem item = buildInventoryItem();
            when(inventoryService.getInventoryItemById("item-1")).thenReturn(item);
            when(inventoryService.adjustStock(any(), any(), any(), any(), any(), any()))
                .thenReturn(item);
            when(wasteRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WasteRecord result = wasteAnalysisService.recordWaste(record);

            assertThat(result.getUnitCost()).isEqualByComparingTo(new BigDecimal("30.00"));
        }
    }

    @Nested
    @DisplayName("getWasteRecordById")
    class GetWasteRecordById {

        @Test
        @DisplayName("returns record when found")
        void returnsWhenFound() {
            when(wasteRecordRepository.findById("waste-1"))
                .thenReturn(Optional.of(buildWasteRecord("waste-1")));

            WasteRecord result = wasteAnalysisService.getWasteRecordById("waste-1");

            assertThat(result.getId()).isEqualTo("waste-1");
        }

        @Test
        @DisplayName("throws when not found")
        void throwsWhenNotFound() {
            when(wasteRecordRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> wasteAnalysisService.getWasteRecordById("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getAllWasteRecords")
    class GetAllWasteRecords {

        @Test
        @DisplayName("returns all records for store")
        void returnsAll() {
            when(wasteRecordRepository.findByStoreId("store-1"))
                .thenReturn(List.of(buildWasteRecord("waste-1")));

            List<WasteRecord> result = wasteAnalysisService.getAllWasteRecords("store-1");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getWasteRecordsByCategory")
    class GetWasteRecordsByCategory {

        @Test
        @DisplayName("returns records by waste category")
        void returnsByCategory() {
            when(wasteRecordRepository.findByStoreIdAndWasteCategory("store-1", "EXPIRED"))
                .thenReturn(List.of(buildWasteRecord("waste-1")));

            List<WasteRecord> result = wasteAnalysisService.getWasteRecordsByCategory("store-1", "EXPIRED");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getWasteRecordsByDateRange")
    class GetWasteRecordsByDateRange {

        @Test
        @DisplayName("returns records by date range")
        void returnsByDateRange() {
            LocalDate start = LocalDate.of(2026, 5, 1);
            LocalDate end = LocalDate.of(2026, 5, 17);

            when(wasteRecordRepository.findByStoreIdAndDateRange("store-1", start, end))
                .thenReturn(List.of(buildWasteRecord("waste-1")));

            List<WasteRecord> result = wasteAnalysisService.getWasteRecordsByDateRange("store-1", start, end);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("approveWasteRecord")
    class ApproveWasteRecord {

        @Test
        @DisplayName("approves waste record and sets approverId and approvedAt")
        void approvesRecord() {
            WasteRecord record = buildWasteRecord("waste-1");
            when(wasteRecordRepository.findById("waste-1")).thenReturn(Optional.of(record));
            when(wasteRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WasteRecord result = wasteAnalysisService.approveWasteRecord("waste-1", "manager-1");

            assertThat(result.getApprovedBy()).isEqualTo("manager-1");
            assertThat(result.getApprovedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("updateWasteRecord")
    class UpdateWasteRecord {

        @Test
        @DisplayName("fetches existing then saves updated record")
        void updatesRecord() {
            WasteRecord existing = buildWasteRecord("waste-1");
            WasteRecord updated = buildWasteRecord("waste-1");
            updated.setWasteReason("Freezer failure");

            when(wasteRecordRepository.findById("waste-1")).thenReturn(Optional.of(existing));
            when(wasteRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WasteRecord result = wasteAnalysisService.updateWasteRecord(updated);

            assertThat(result.getId()).isEqualTo("waste-1");
            verify(wasteRecordRepository).save(updated);
        }
    }

    @Nested
    @DisplayName("deleteWasteRecord")
    class DeleteWasteRecord {

        @Test
        @DisplayName("deletes record by id")
        void deletesRecord() {
            doNothing().when(wasteRecordRepository).deleteById("waste-1");

            wasteAnalysisService.deleteWasteRecord("waste-1");

            verify(wasteRecordRepository).deleteById("waste-1");
        }
    }

    @Nested
    @DisplayName("getTotalWasteCost")
    class GetTotalWasteCost {

        @Test
        @DisplayName("returns sum of totalCost from all records in date range")
        void returnsTotalCost() {
            WasteRecord r1 = buildWasteRecord("w1", new BigDecimal("50.00"));
            WasteRecord r2 = buildWasteRecord("w2", new BigDecimal("30.00"));

            when(wasteRecordRepository.findByStoreIdAndDateRange(eq("store-1"), any(), any()))
                .thenReturn(List.of(r1, r2));

            BigDecimal result = wasteAnalysisService.getTotalWasteCost("store-1", null, null);

            assertThat(result).isEqualByComparingTo(new BigDecimal("80.00"));
        }

        @Test
        @DisplayName("returns zero when no records")
        void returnsZeroWhenNoRecords() {
            when(wasteRecordRepository.findByStoreIdAndDateRange(eq("store-1"), any(), any()))
                .thenReturn(List.of());

            BigDecimal result = wasteAnalysisService.getTotalWasteCost("store-1", null, null);

            assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("getWasteCostByCategory")
    class GetWasteCostByCategory {

        @Test
        @DisplayName("returns cost grouped by waste category")
        void returnsCostByCategory() {
            WasteRecord expired = buildWasteRecord("w1", new BigDecimal("60.00"));
            expired.setWasteCategory("EXPIRED");

            WasteRecord damaged = buildWasteRecord("w2", new BigDecimal("40.00"));
            damaged.setWasteCategory("DAMAGED");

            when(wasteRecordRepository.findByStoreIdAndDateRange(eq("store-1"), any(), any()))
                .thenReturn(List.of(expired, damaged));

            Map<String, BigDecimal> result = wasteAnalysisService.getWasteCostByCategory("store-1", null, null);

            assertThat(result).containsKey("EXPIRED");
            assertThat(result.get("EXPIRED")).isEqualByComparingTo(new BigDecimal("60.00"));
            assertThat(result.get("DAMAGED")).isEqualByComparingTo(new BigDecimal("40.00"));
        }
    }

    @Nested
    @DisplayName("getTopWastedItems")
    class GetTopWastedItems {

        @Test
        @DisplayName("groups records by item and returns sorted by total cost")
        void returnsTopItemsSortedByCost() {
            WasteRecord w1 = buildWasteRecord("w1", new BigDecimal("100.00"));
            w1.setInventoryItemId("item-1");
            w1.setItemName("Lettuce");

            WasteRecord w2 = buildWasteRecord("w2", new BigDecimal("200.00"));
            w2.setInventoryItemId("item-2");
            w2.setItemName("Tomato");

            when(wasteRecordRepository.findTopWastedItems(eq("store-1"), any(), any()))
                .thenReturn(List.of(w1, w2));

            List<Map<String, Object>> result = wasteAnalysisService.getTopWastedItems("store-1", null, null, 10);

            assertThat(result).hasSize(2);
            // Sorted by totalCost descending — Tomato (200) before Lettuce (100)
            assertThat(result.get(0).get("itemName")).isEqualTo("Tomato");
        }

        @Test
        @DisplayName("limits results to specified limit")
        void limitsResults() {
            WasteRecord w1 = buildWasteRecord("w1", new BigDecimal("100.00"));
            w1.setInventoryItemId("item-1");
            WasteRecord w2 = buildWasteRecord("w2", new BigDecimal("80.00"));
            w2.setInventoryItemId("item-2");
            WasteRecord w3 = buildWasteRecord("w3", new BigDecimal("60.00"));
            w3.setInventoryItemId("item-3");

            when(wasteRecordRepository.findTopWastedItems(eq("store-1"), any(), any()))
                .thenReturn(List.of(w1, w2, w3));

            List<Map<String, Object>> result = wasteAnalysisService.getTopWastedItems("store-1", null, null, 2);

            assertThat(result).hasSize(2);
        }
    }

    @Nested
    @DisplayName("getPreventableWasteAnalysis")
    class GetPreventableWasteAnalysis {

        @Test
        @DisplayName("calculates preventable waste percentage")
        void calculatesPreventablePercentage() {
            LocalDate today = LocalDate.now();
            LocalDate from = today.minusDays(30);

            WasteRecord total1 = buildWasteRecord("w1", new BigDecimal("100.00"));
            total1.setPreventable(false);

            WasteRecord prev1 = buildWasteRecord("w2", new BigDecimal("50.00"));
            prev1.setPreventable(true);

            when(wasteRecordRepository.findByStoreIdAndDateRange(eq("store-1"), any(), any()))
                .thenReturn(List.of(total1, prev1));
            when(wasteRecordRepository.findByStoreIdAndPreventable("store-1", true))
                .thenReturn(List.of(prev1));

            Map<String, Object> result = wasteAnalysisService.getPreventableWasteAnalysis("store-1", from, today);

            assertThat(result).containsKey("preventablePercentage");
            assertThat(result.get("totalWasteCount")).isEqualTo(2);
        }

        @Test
        @DisplayName("returns 0% when no waste records")
        void returnsZeroPercentWhenNoRecords() {
            LocalDate today = LocalDate.now();
            when(wasteRecordRepository.findByStoreIdAndDateRange(eq("store-1"), any(), any()))
                .thenReturn(List.of());
            when(wasteRecordRepository.findByStoreIdAndPreventable("store-1", true))
                .thenReturn(List.of());

            Map<String, Object> result = wasteAnalysisService.getPreventableWasteAnalysis("store-1", today.minusDays(7), today);

            assertThat(result.get("preventablePercentage")).isEqualTo(0.0);
        }
    }

    @Nested
    @DisplayName("getWasteTrend")
    class GetWasteTrend {

        @Test
        @DisplayName("groups records by month and returns sorted trend")
        void returnsTrendByMonth() {
            WasteRecord may = buildWasteRecord("w1", new BigDecimal("150.00"));
            may.setWasteDate(LocalDate.of(2026, 5, 10));

            WasteRecord apr = buildWasteRecord("w2", new BigDecimal("100.00"));
            apr.setWasteDate(LocalDate.of(2026, 4, 15));

            when(wasteRecordRepository.findByStoreIdAndDateRange(eq("store-1"), any(), any()))
                .thenReturn(List.of(may, apr));

            List<Map<String, Object>> result = wasteAnalysisService.getWasteTrend("store-1", 6);

            assertThat(result).hasSize(2);
            // Sorted ascending by month
            assertThat(result.get(0).get("month")).isEqualTo("2026-04");
            assertThat(result.get(1).get("month")).isEqualTo("2026-05");
        }

        @Test
        @DisplayName("returns empty list when no records in period")
        void returnsEmptyWhenNoRecords() {
            when(wasteRecordRepository.findByStoreIdAndDateRange(eq("store-1"), any(), any()))
                .thenReturn(List.of());

            List<Map<String, Object>> result = wasteAnalysisService.getWasteTrend("store-1", 3);

            assertThat(result).isEmpty();
        }
    }
}
