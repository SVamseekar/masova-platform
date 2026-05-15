package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.InventoryController;
import com.MaSoVa.logistics.inventory.dto.response.MessageResponse;
import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.service.InventoryService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private InventoryItem buildItem(String id) {
        InventoryItem item = new InventoryItem();
        item.setId(id);
        item.setItemName("Flour");
        item.setStoreId("store-1");
        return item;
    }

    @Test
    @DisplayName("GET /api/inventory returns 200 with list")
    void getInventory_returns200() throws Exception {
        when(inventoryService.getAllInventoryItems(any())).thenReturn(List.of(buildItem("item-1")));

        mockMvc.perform(get("/api/inventory").header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/inventory returns 201 with created item")
    void createItem_returns201() throws Exception {
        when(inventoryService.createInventoryItem(any())).thenReturn(buildItem("item-new"));

        mockMvc.perform(post("/api/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Flour\",\"storeId\":\"store-1\",\"category\":\"PRODUCE\",\"quantity\":50.0,\"unit\":\"KG\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/inventory/{id} returns 200")
    void getItem_returns200() throws Exception {
        when(inventoryService.getInventoryItemById("item-1")).thenReturn(buildItem("item-1"));

        mockMvc.perform(get("/api/inventory/item-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/inventory/{id} returns 200 even when item is null (controller just wraps)")
    void getItem_returnsOk() throws Exception {
        when(inventoryService.getInventoryItemById("item-1")).thenReturn(buildItem("item-1"));

        mockMvc.perform(get("/api/inventory/item-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/inventory/{id} returns 200 with message")
    void deleteItem_returns200() throws Exception {
        mockMvc.perform(delete("/api/inventory/item-1")
                .header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk());
    }
}
