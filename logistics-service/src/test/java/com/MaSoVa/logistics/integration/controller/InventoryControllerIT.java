package com.MaSoVa.logistics.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Logistics Service Integration Tests")
class InventoryControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Inventory ─────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/inventory returns 200 with empty list")
    void getInventory_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/inventory")
                .header("X-User-Type", "MANAGER")
                .header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/inventory/{id} returns error for non-existent item")
    void getInventoryItem_returnsErrorForNonExistent() throws Exception {
        mockMvc.perform(get("/api/inventory/nonexistent")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().is5xxServerError());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/suppliers returns 200 with empty list")
    void getSuppliers_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/suppliers")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/purchase-orders returns 200 with empty list")
    void getPurchaseOrders_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/purchase-orders")
                .header("X-User-Type", "MANAGER")
                .header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    // ── Delivery ──────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/delivery/zones returns 200 with zone list")
    void getDeliveryZones_returnsZones() throws Exception {
        mockMvc.perform(get("/api/delivery/zones")
                .param("storeId", "store-1"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/delivery/track/{orderId} returns error for non-existent order")
    void trackOrder_returnsErrorForNonExistent() throws Exception {
        mockMvc.perform(get("/api/delivery/track/nonexistent"))
            .andExpect(status().is5xxServerError());
    }
}
