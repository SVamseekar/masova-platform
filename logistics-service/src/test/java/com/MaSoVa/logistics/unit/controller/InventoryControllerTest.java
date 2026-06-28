package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.InventoryController;
import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.service.InventoryService;
import com.MaSoVa.shared.exception.GlobalExceptionHandler;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryController Unit Tests")
class InventoryControllerTest extends BaseServiceTest {

    @Mock private InventoryService inventoryService;
    @InjectMocks private InventoryController inventoryController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private InventoryItem buildItem(String id) {
        InventoryItem item = new InventoryItem();
        item.setId(id);
        item.setItemName("Flour");
        item.setStoreId("store-1");
        item.setCategory("PRODUCE");
        item.setCurrentStock(50.0);
        item.setReservedStock(0.0);
        item.setMinimumStock(5.0);
        item.setUnit("KG");
        return item;
    }

    @Nested
    @DisplayName("GET /api/inventory")
    class GetInventory {

        @Test
        @DisplayName("returns 200 with all items by default")
        void returns200WithAll() throws Exception {
            when(inventoryService.getAllInventoryItems(any())).thenReturn(List.of(buildItem("item-1")));

            mockMvc.perform(get("/api/inventory").header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns low stock items when lowStock=true")
        void returnsLowStock() throws Exception {
            when(inventoryService.getLowStockAlerts(any())).thenReturn(List.of(buildItem("item-1")));

            mockMvc.perform(get("/api/inventory")
                    .header("X-User-Store-Id", "store-1")
                    .param("lowStock", "true"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns out-of-stock items when outOfStock=true")
        void returnsOutOfStock() throws Exception {
            when(inventoryService.getOutOfStockItems(any())).thenReturn(List.of(buildItem("item-1")));

            mockMvc.perform(get("/api/inventory")
                    .header("X-User-Store-Id", "store-1")
                    .param("outOfStock", "true"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns expiring items when expiringSoon=7")
        void returnsExpiring() throws Exception {
            when(inventoryService.getItemsExpiringSoon(any(), eq(7))).thenReturn(List.of(buildItem("item-1")));

            mockMvc.perform(get("/api/inventory")
                    .header("X-User-Store-Id", "store-1")
                    .param("expiringSoon", "7"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns search results when search param provided")
        void returnsSearchResults() throws Exception {
            when(inventoryService.searchItems(any(), eq("flour"))).thenReturn(List.of(buildItem("item-1")));

            mockMvc.perform(get("/api/inventory")
                    .header("X-User-Store-Id", "store-1")
                    .param("search", "flour"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns items by category when category param provided")
        void returnsByCategory() throws Exception {
            when(inventoryService.getItemsByCategory(any(), eq("PRODUCE"))).thenReturn(List.of(buildItem("item-1")));

            mockMvc.perform(get("/api/inventory")
                    .header("X-User-Store-Id", "store-1")
                    .param("category", "PRODUCE"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("uses selectedStoreId for MANAGER user type when it matches JWT store membership")
        void usesSelectedStoreIdForManager() throws Exception {
            when(inventoryService.getAllInventoryItems(eq("store-selected")))
                .thenReturn(List.of(buildItem("item-1")));

            mockMvc.perform(get("/api/inventory")
                    .header("X-User-Type", "MANAGER")
                    .header("X-Selected-Store-Id", "store-selected")
                    .header("X-User-Store-Id", "store-selected"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("denies selectedStoreId for MANAGER outside their JWT store membership")
        void deniesSelectedStoreIdOutsideMembership() throws Exception {
            mockMvc.perform(get("/api/inventory")
                    .header("X-User-Type", "MANAGER")
                    .header("X-Selected-Store-Id", "store-selected")
                    .header("X-User-Store-Id", "store-default"))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/inventory")
    class CreateItem {

        @Test
        @DisplayName("returns 201 with created item")
        void returns201() throws Exception {
            when(inventoryService.createInventoryItem(any())).thenReturn(buildItem("item-new"));

            mockMvc.perform(post("/api/inventory")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"itemName\":\"Flour\",\"storeId\":\"store-1\",\"category\":\"PRODUCE\",\"currentStock\":50.0,\"unit\":\"KG\"}"))
                .andExpect(status().isCreated());
        }
    }

    @Nested
    @DisplayName("GET /api/inventory/{id}")
    class GetItem {

        @Test
        @DisplayName("returns 200 with item")
        void returns200() throws Exception {
            when(inventoryService.getInventoryItemById("item-1")).thenReturn(buildItem("item-1"));

            mockMvc.perform(get("/api/inventory/item-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("PATCH /api/inventory/{id}")
    class UpdateItem {

        @Test
        @DisplayName("returns 200 with updated item")
        void returns200() throws Exception {
            when(inventoryService.updateInventoryItem(any())).thenReturn(buildItem("item-1"));

            mockMvc.perform(patch("/api/inventory/item-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"itemName\":\"Rice\",\"currentStock\":100.0}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("DELETE /api/inventory/{id}")
    class DeleteItem {

        @Test
        @DisplayName("returns 200 with success message")
        void returns200() throws Exception {
            doNothing().when(inventoryService).deleteInventoryItem(anyString(), anyString());

            mockMvc.perform(delete("/api/inventory/item-1")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Inventory item deleted successfully"));
        }
    }

    @Nested
    @DisplayName("POST /api/inventory/{id}/stock")
    class StockOperation {

        @Test
        @DisplayName("ADJUST operation returns 200 with updated item")
        void adjustReturns200() throws Exception {
            when(inventoryService.adjustStock(eq("item-1"), eq(10.0), anyString(), any(), anyString(), anyString()))
                .thenReturn(buildItem("item-1"));

            mockMvc.perform(post("/api/inventory/item-1/stock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"operation\":\"ADJUST\",\"quantityChange\":10.0,\"storeId\":\"store-1\",\"updatedBy\":\"user-1\",\"reason\":\"RESTOCK\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("RESERVE operation returns 200 with message")
        void reserveReturns200() throws Exception {
            doNothing().when(inventoryService).reserveStock(eq("item-1"), eq(5.0), anyString());

            mockMvc.perform(post("/api/inventory/item-1/stock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"operation\":\"RESERVE\",\"quantity\":5.0,\"storeId\":\"store-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Stock reserved"));
        }

        @Test
        @DisplayName("RELEASE operation returns 200 with message")
        void releaseReturns200() throws Exception {
            doNothing().when(inventoryService).releaseReservedStock(eq("item-1"), eq(3.0), anyString());

            mockMvc.perform(post("/api/inventory/item-1/stock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"operation\":\"RELEASE\",\"quantity\":3.0,\"storeId\":\"store-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Reserved stock released"));
        }

        @Test
        @DisplayName("CONSUME operation returns 200 with message")
        void consumeReturns200() throws Exception {
            doNothing().when(inventoryService).consumeReservedStock(eq("item-1"), eq(2.0), anyString());

            mockMvc.perform(post("/api/inventory/item-1/stock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"operation\":\"CONSUME\",\"quantity\":2.0,\"storeId\":\"store-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Reserved stock consumed"));
        }

        @Test
        @DisplayName("returns 400 for unknown operation")
        void returns400ForUnknownOperation() throws Exception {
            mockMvc.perform(post("/api/inventory/item-1/stock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"operation\":\"TRANSFER\",\"quantity\":5.0}"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/inventory/value")
    class InventoryValue {

        @Test
        @DisplayName("returns total value when byCategory not set")
        void returnsTotalValue() throws Exception {
            when(inventoryService.getTotalInventoryValue(any()))
                .thenReturn(new BigDecimal("12500.00"));

            mockMvc.perform(get("/api/inventory/value")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns value by category when byCategory=true")
        void returnsByCategory() throws Exception {
            when(inventoryService.getInventoryValueByCategory(any()))
                .thenReturn(Map.of("PRODUCE", new BigDecimal("5000.00"), "DAIRY", new BigDecimal("3000.00")));

            mockMvc.perform(get("/api/inventory/value")
                    .header("X-User-Store-Id", "store-1")
                    .param("byCategory", "true"))
                .andExpect(status().isOk());
        }
    }
}
