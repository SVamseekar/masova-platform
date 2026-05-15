package com.MaSoVa.logistics.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("InventoryController Integration Tests")
class InventoryControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/inventory returns 200 with empty list")
    void getInventory_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/inventory")
                .header("X-User-Type", "MANAGER")
                .header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/inventory/{id} returns 404 for non-existent item")
    void getInventoryItem_returns404() throws Exception {
        mockMvc.perform(get("/api/inventory/nonexistent")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/suppliers returns 200 with empty list")
    void getSuppliers_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/suppliers")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/purchase-orders returns 200 with empty list")
    void getPurchaseOrders_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/purchase-orders")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
