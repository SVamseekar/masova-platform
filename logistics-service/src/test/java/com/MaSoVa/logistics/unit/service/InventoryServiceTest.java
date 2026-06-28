package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.repository.InventoryItemRepository;
import com.MaSoVa.logistics.inventory.service.InventoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService Unit Tests")
class InventoryServiceTest {

    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private InventoryService inventoryService;

    private InventoryItem buildItem(String id, String storeId, double qty) {
        InventoryItem item = new InventoryItem();
        item.setId(id);
        item.setStoreId(storeId);
        item.setItemName("Tomatoes");
        item.setCategory("PRODUCE");
        item.setCurrentStock(qty);
        item.setReservedStock(0.0);
        item.setMinimumStock(5.0);
        item.setReorderQuantity(20.0);
        item.setUnit("KG");
        item.setAverageCost(new BigDecimal("40.00"));
        return item;
    }

    @Nested
    @DisplayName("createInventoryItem")
    class CreateInventoryItem {

        @Test
        @DisplayName("saves and returns item with AVAILABLE status")
        void savesWithAvailableStatus() {
            InventoryItem item = buildItem(null, "store-1", 10.0);
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> {
                InventoryItem i = inv.getArgument(0);
                i.setId("item-1");
                return i;
            });

            InventoryItem result = inventoryService.createInventoryItem(item);

            assertThat(result.getId()).isEqualTo("item-1");
            assertThat(result.getStatus()).isEqualTo("AVAILABLE");
            verify(inventoryItemRepository).save(item);
        }

        @Test
        @DisplayName("sets status to OUT_OF_STOCK when stock is zero")
        void setsOutOfStockStatusWhenZeroQty() {
            InventoryItem item = buildItem(null, "store-1", 0.0);
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            InventoryItem result = inventoryService.createInventoryItem(item);

            assertThat(result.getStatus()).isEqualTo("OUT_OF_STOCK");
        }
    }

    @Nested
    @DisplayName("getInventoryItemById")
    class GetInventoryItemById {

        @Test
        @DisplayName("returns item when found")
        void returnsItem() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));

            InventoryItem result = inventoryService.getInventoryItemById("item-1");

            assertThat(result.getId()).isEqualTo("item-1");
        }

        @Test
        @DisplayName("throws when item not found")
        void throwsWhenNotFound() {
            when(inventoryItemRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inventoryService.getInventoryItemById("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getAllInventoryItems")
    class GetAllInventoryItems {

        @Test
        @DisplayName("returns items for store")
        void returnsStoreItems() {
            when(inventoryItemRepository.findByStoreId("store-1"))
                .thenReturn(List.of(buildItem("item-1", "store-1", 10.0)));

            List<InventoryItem> result = inventoryService.getAllInventoryItems("store-1");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStoreId()).isEqualTo("store-1");
        }
    }

    @Nested
    @DisplayName("getItemsByCategory")
    class GetItemsByCategory {

        @Test
        @DisplayName("returns items filtered by category")
        void returnsByCategory() {
            when(inventoryItemRepository.findByStoreIdAndCategory("store-1", "PRODUCE"))
                .thenReturn(List.of(buildItem("item-1", "store-1", 10.0)));

            List<InventoryItem> result = inventoryService.getItemsByCategory("store-1", "PRODUCE");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("searchItems")
    class SearchItems {

        @Test
        @DisplayName("returns items matching search term")
        void returnsMatchingItems() {
            when(inventoryItemRepository.searchByName("store-1", "tom"))
                .thenReturn(List.of(buildItem("item-1", "store-1", 10.0)));

            List<InventoryItem> result = inventoryService.searchItems("store-1", "tom");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("updateInventoryItem")
    class UpdateInventoryItem {

        @Test
        @DisplayName("updates item when it exists")
        void updatesItem() {
            InventoryItem existing = buildItem("item-1", "store-1", 10.0);
            InventoryItem updated = buildItem("item-1", "store-1", 15.0);

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(existing));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            InventoryItem result = inventoryService.updateInventoryItem(updated);

            assertThat(result.getCurrentStock()).isEqualTo(15.0);
        }
    }

    @Nested
    @DisplayName("adjustStock")
    class AdjustStock {

        @Test
        @DisplayName("increases currentStock by positive delta")
        void increasesStock() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            InventoryItem result = inventoryService.adjustStock("item-1", 5.0, "store-1", null, "user-1", "RESTOCK");

            assertThat(result.getCurrentStock()).isEqualTo(15.0);
        }

        @Test
        @DisplayName("decreases currentStock by negative delta")
        void decreasesStock() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            InventoryItem result = inventoryService.adjustStock("item-1", -3.0, "store-1", null, "user-1", "USE");

            assertThat(result.getCurrentStock()).isEqualTo(7.0);
        }

        @Test
        @DisplayName("throws when reducing below zero")
        void throwsWhenBelowZero() {
            InventoryItem item = buildItem("item-1", "store-1", 3.0);
            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));

            assertThatThrownBy(() -> inventoryService.adjustStock("item-1", -10.0, "store-1", null, "user-1", "USE"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("below zero");
        }

        @Test
        @DisplayName("updates average cost using weighted average when adding stock with unit cost")
        void updatesAverageCostOnRestock() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            item.setAverageCost(new BigDecimal("40.00"));

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Add 10 units at ₹50/unit — average should be (10*40 + 10*50)/20 = 45
            InventoryItem result = inventoryService.adjustStock("item-1", 10.0, "store-1",
                new BigDecimal("50.00"), "user-1", "RESTOCK");

            assertThat(result.getCurrentStock()).isEqualTo(20.0);
            assertThat(result.getLastPurchaseCost()).isEqualByComparingTo(new BigDecimal("50.00"));
        }

        @Test
        @DisplayName("does not update average cost when adding stock without unit cost")
        void doesNotUpdateCostWithoutUnitCost() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            item.setAverageCost(new BigDecimal("40.00"));

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            InventoryItem result = inventoryService.adjustStock("item-1", 5.0, "store-1", null, "user-1", "MANUAL");

            // Average cost unchanged
            assertThat(result.getAverageCost()).isEqualByComparingTo(new BigDecimal("40.00"));
        }
    }

    @Nested
    @DisplayName("reserveStock")
    class ReserveStock {

        @Test
        @DisplayName("increases reservedStock when enough available")
        void reservesWhenEnoughStock() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            inventoryService.reserveStock("item-1", 3.0, "store-1");

            verify(inventoryItemRepository).save(argThat(i -> i.getReservedStock() == 3.0));
        }

        @Test
        @DisplayName("throws when insufficient stock available")
        void throwsWhenInsufficientStock() {
            InventoryItem item = buildItem("item-1", "store-1", 2.0);
            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));

            assertThatThrownBy(() -> inventoryService.reserveStock("item-1", 5.0, "store-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Insufficient stock");
        }
    }

    @Nested
    @DisplayName("releaseReservedStock")
    class ReleaseReservedStock {

        @Test
        @DisplayName("decreases reservedStock on release")
        void releasesReservedStock() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            item.setReservedStock(5.0);

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            inventoryService.releaseReservedStock("item-1", 3.0, "store-1");

            verify(inventoryItemRepository).save(argThat(i -> i.getReservedStock() == 2.0));
        }

        @Test
        @DisplayName("clamps reserved stock to zero if release exceeds reserved")
        void clampsToZeroWhenExceedsReserved() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            item.setReservedStock(1.0);

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            inventoryService.releaseReservedStock("item-1", 5.0, "store-1");

            verify(inventoryItemRepository).save(argThat(i -> i.getReservedStock() == 0.0));
        }
    }

    @Nested
    @DisplayName("consumeReservedStock")
    class ConsumeReservedStock {

        @Test
        @DisplayName("reduces both current and reserved stock")
        void reducesBothCurrentAndReserved() {
            InventoryItem item = buildItem("item-1", "store-1", 10.0);
            item.setReservedStock(5.0);

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            inventoryService.consumeReservedStock("item-1", 3.0, "store-1");

            verify(inventoryItemRepository).save(argThat(i ->
                i.getCurrentStock() == 7.0 && i.getReservedStock() == 2.0));
        }

        @Test
        @DisplayName("clamps stocks to zero if consume exceeds available")
        void clampsToZeroWhenExceeds() {
            InventoryItem item = buildItem("item-1", "store-1", 2.0);
            item.setReservedStock(2.0);

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            inventoryService.consumeReservedStock("item-1", 5.0, "store-1");

            verify(inventoryItemRepository).save(argThat(i ->
                i.getCurrentStock() == 0.0 && i.getReservedStock() == 0.0));
        }
    }

    @Nested
    @DisplayName("getItemsNeedingReorder")
    class GetItemsNeedingReorder {

        @Test
        @DisplayName("returns low stock items from repository")
        void returnsLowStockItems() {
            InventoryItem lowStock = buildItem("item-1", "store-1", 2.0);
            when(inventoryItemRepository.findItemsNeedingReorder("store-1"))
                .thenReturn(List.of(lowStock));

            List<InventoryItem> result = inventoryService.getItemsNeedingReorder("store-1");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getOutOfStockItems")
    class GetOutOfStockItems {

        @Test
        @DisplayName("returns out-of-stock items")
        void returnsOutOfStockItems() {
            when(inventoryItemRepository.findOutOfStockItems("store-1"))
                .thenReturn(List.of(buildItem("item-1", "store-1", 0.0)));

            List<InventoryItem> result = inventoryService.getOutOfStockItems("store-1");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getItemsExpiringSoon")
    class GetItemsExpiringSoon {

        @Test
        @DisplayName("returns items expiring within daysAhead")
        void returnsExpiring() {
            when(inventoryItemRepository.findItemsExpiringSoon(any(), any()))
                .thenReturn(List.of(buildItem("item-1", "store-1", 5.0)));

            List<InventoryItem> result = inventoryService.getItemsExpiringSoon("store-1", 7);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getLowStockAlerts")
    class GetLowStockAlerts {

        @Test
        @DisplayName("returns LOW_STOCK items")
        void returnsLowStockAlerts() {
            when(inventoryItemRepository.findByStoreIdAndStatus("store-1", "LOW_STOCK"))
                .thenReturn(List.of(buildItem("item-1", "store-1", 3.0)));

            List<InventoryItem> result = inventoryService.getLowStockAlerts("store-1");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("deleteInventoryItem")
    class DeleteInventoryItem {

        @Test
        @DisplayName("deletes item by id")
        void deletesItem() {
            doNothing().when(inventoryItemRepository).deleteById("item-1");

            inventoryService.deleteInventoryItem("item-1", "store-1");

            verify(inventoryItemRepository).deleteById("item-1");
        }
    }

    @Nested
    @DisplayName("getTotalInventoryValue")
    class GetTotalInventoryValue {

        @Test
        @DisplayName("returns sum of all items total stock value")
        void returnsTotalValue() {
            InventoryItem item1 = buildItem("item-1", "store-1", 10.0);
            item1.setAverageCost(new BigDecimal("40.00")); // 10 * 40 = 400
            InventoryItem item2 = buildItem("item-2", "store-1", 5.0);
            item2.setAverageCost(new BigDecimal("100.00")); // 5 * 100 = 500

            when(inventoryItemRepository.findByStoreId("store-1"))
                .thenReturn(List.of(item1, item2));

            BigDecimal result = inventoryService.getTotalInventoryValue("store-1");

            assertThat(result).isEqualByComparingTo(new BigDecimal("900.00"));
        }

        @Test
        @DisplayName("returns zero when no items")
        void returnsZeroWhenEmpty() {
            when(inventoryItemRepository.findByStoreId("store-1")).thenReturn(List.of());

            BigDecimal result = inventoryService.getTotalInventoryValue("store-1");

            assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("getInventoryValueByCategory")
    class GetInventoryValueByCategory {

        @Test
        @DisplayName("returns value grouped by category")
        void returnsValueByCategory() {
            InventoryItem produce = buildItem("item-1", "store-1", 10.0);
            produce.setCategory("PRODUCE");
            produce.setAverageCost(new BigDecimal("40.00")); // 400

            InventoryItem dairy = buildItem("item-2", "store-1", 5.0);
            dairy.setCategory("DAIRY");
            dairy.setAverageCost(new BigDecimal("60.00")); // 300

            when(inventoryItemRepository.findByStoreId("store-1"))
                .thenReturn(List.of(produce, dairy));

            Map<String, BigDecimal> result = inventoryService.getInventoryValueByCategory("store-1");

            assertThat(result).containsKey("PRODUCE");
            assertThat(result).containsKey("DAIRY");
            assertThat(result.get("PRODUCE")).isEqualByComparingTo(new BigDecimal("400.00"));
            assertThat(result.get("DAIRY")).isEqualByComparingTo(new BigDecimal("300.00"));
        }
    }

    @Nested
    @DisplayName("getAllStoreIds")
    class GetAllStoreIds {

        @Test
        @DisplayName("returns distinct store IDs from inventory items")
        void returnsDistinctStoreIds() {
            when(inventoryItemRepository.findAllStoreIds()).thenReturn(List.of(
                buildItem("item-1", "store-1", 5.0),
                buildItem("item-2", "store-1", 3.0), // duplicate
                buildItem("item-3", "store-2", 7.0)
            ));

            List<String> result = inventoryService.getAllStoreIds();

            assertThat(result).containsExactlyInAnyOrder("store-1", "store-2");
        }
    }

    @Nested
    @DisplayName("transferStock")
    class TransferStock {

        @Test
        @DisplayName("throws UnsupportedOperationException (not yet implemented)")
        void throwsUnsupported() {
            assertThatThrownBy(() ->
                inventoryService.transferStock("item-1", "store-1", "store-2", 5.0))
                .isInstanceOf(UnsupportedOperationException.class);
        }
    }

    @Nested
    @DisplayName("batchUpdateStock")
    class BatchUpdateStock {

        @Test
        @DisplayName("calls adjustStock for each adjustment in batch")
        void callsAdjustStockForEach() {
            InventoryItem item1 = buildItem("item-1", "store-1", 10.0);
            InventoryItem item2 = buildItem("item-2", "store-1", 20.0);

            when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item1));
            when(inventoryItemRepository.findById("item-2")).thenReturn(Optional.of(item2));
            when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            List<InventoryService.StockAdjustment> adjustments = List.of(
                new InventoryService.StockAdjustment("item-1", "store-1", 5.0, null, "Restocked"),
                new InventoryService.StockAdjustment("item-2", "store-1", 3.0, null, "Restocked")
            );

            inventoryService.batchUpdateStock(adjustments, "user-1");

            verify(inventoryItemRepository, times(2)).save(any());
        }
    }
}
