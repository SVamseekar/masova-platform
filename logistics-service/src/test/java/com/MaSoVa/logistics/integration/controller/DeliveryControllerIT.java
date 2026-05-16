package com.MaSoVa.logistics.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("DeliveryController Integration Tests")
class DeliveryControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/delivery/zones returns 200 with zone list")
    void getDeliveryZones_returnsZones() throws Exception {
        mockMvc.perform(get("/api/delivery/zones"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/delivery/track/{orderId} returns error for non-existent order")
    void trackOrder_returnsErrorForNonExistent() throws Exception {
        mockMvc.perform(get("/api/delivery/track/nonexistent"))
            .andExpect(status().is4xxClientError());
    }
}
