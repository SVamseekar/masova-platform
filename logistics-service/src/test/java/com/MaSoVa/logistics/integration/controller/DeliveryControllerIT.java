package com.MaSoVa.logistics.integration.controller;

import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("DeliveryController Integration Tests")
class DeliveryControllerIT extends BaseMessagingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/delivery/zones returns 200 with zone list")
    void getDeliveryZones_returnsZones() throws Exception {
        mockMvc.perform(get("/api/delivery/zones"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/delivery/track/{orderId} returns 404 for non-existent order")
    void trackOrder_returns404() throws Exception {
        mockMvc.perform(get("/api/delivery/track/nonexistent"))
            .andExpect(status().isNotFound());
    }
}
