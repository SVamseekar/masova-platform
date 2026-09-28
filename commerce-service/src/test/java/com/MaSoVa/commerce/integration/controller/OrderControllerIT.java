package com.MaSoVa.commerce.integration.controller;

import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("OrderController Integration Tests")
class OrderControllerIT extends BaseMessagingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/orders returns 200 with an empty page initially")
    void getOrders_returnsEmptyList() throws Exception {
        // GET /api/orders returns a PageableResponse ({content, page, size, ...}), not a bare array.
        mockMvc.perform(get("/api/orders")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content").isEmpty())
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/orders/{id} returns error for non-existent order")
    void getOrder_returnsErrorForNonExistent() throws Exception {
        mockMvc.perform(get("/api/orders/nonexistent")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().is4xxClientError());
    }
}
