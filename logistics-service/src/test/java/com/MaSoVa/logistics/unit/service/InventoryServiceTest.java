package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.repository.InventoryItemRepository;
import com.MaSoVa.logistics.inventory.service.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
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
        item.setCurrentStock(qty);
        item.setReservedStock(0.0);
        item.setMinimumStock(5.0);
        item.setUnit("KG");
        return item;
    }

    @Test
    @DisplayName("createInventoryItem saves and returns item")
    void createInventoryItem_savesItem() {
        InventoryItem item = buildItem(null, "store-1", 10.0);
        when(inventoryItemRepository.save(any())).thenAnswer(inv -> {
            InventoryItem i = inv.getArgument(0);
            i.setId("item-1");
            return i;
        });

        InventoryItem result = inventoryService.createInventoryItem(item);

        assertThat(result.getId()).isEqualTo("item-1");
        verify(inventoryItemRepository).save(item);
    }

    @Test
    @DisplayName("getInventoryItemById returns item when found")
    void getInventoryItemById_returnsItem() {
        InventoryItem item = buildItem("item-1", "store-1", 10.0);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));

        InventoryItem result = inventoryService.getInventoryItemById("item-1");

        assertThat(result.getId()).isEqualTo("item-1");
    }

    @Test
    @DisplayName("getInventoryItemById throws when not found")
    void getInventoryItemById_throwsWhenNotFound() {
        when(inventoryItemRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.getInventoryItemById("missing"))
            .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("getAllInventoryItems returns items for store")
    void getAllInventoryItems_returnsStoreItems() {
        when(inventoryItemRepository.findByStoreId("store-1"))
            .thenReturn(List.of(buildItem("item-1", "store-1", 10.0)));

        List<InventoryItem> result = inventoryService.getAllInventoryItems("store-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStoreId()).isEqualTo("store-1");
    }

    @Test
    @DisplayName("adjustStock increases currentStock by positive delta")
    void adjustStock_increaseStock() {
        InventoryItem item = buildItem("item-1", "store-1", 10.0);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
        when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryItem result = inventoryService.adjustStock("item-1", 5.0, "store-1", null, "user-1", "RESTOCK");

        assertThat(result.getCurrentStock()).isEqualTo(15.0);
    }

    @Test
    @DisplayName("adjustStock throws when reducing below zero")
    void adjustStock_throwsWhenBelowZero() {
        InventoryItem item = buildItem("item-1", "store-1", 3.0);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> inventoryService.adjustStock("item-1", -10.0, "store-1", null, "user-1", "USE"))
            .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("reserveStock reduces available stock")
    void reserveStock_reducesAvailableStock() {
        InventoryItem item = buildItem("item-1", "store-1", 10.0);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(item));
        when(inventoryItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        inventoryService.reserveStock("item-1", 3.0, "store-1");

        verify(inventoryItemRepository).save(argThat(i -> i.getReservedStock() == 3.0));
    }

    @Test
    @DisplayName("getItemsNeedingReorder returns low stock items")
    void getItemsNeedingReorder_returnsLowStockItems() {
        InventoryItem lowStock = buildItem("item-1", "store-1", 2.0);
        when(inventoryItemRepository.findItemsNeedingReorder("store-1"))
            .thenReturn(List.of(lowStock));

        List<InventoryItem> result = inventoryService.getItemsNeedingReorder("store-1");

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("deleteInventoryItem calls repository deleteById")
    void deleteInventoryItem_deletesItem() {
        doNothing().when(inventoryItemRepository).deleteById("item-1");

        inventoryService.deleteInventoryItem("item-1", "store-1");

        verify(inventoryItemRepository).deleteById("item-1");
    }
}
