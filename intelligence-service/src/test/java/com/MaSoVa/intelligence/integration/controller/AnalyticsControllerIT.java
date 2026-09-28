package com.MaSoVa.intelligence.integration.controller;

import com.MaSoVa.shared.test.BaseMessagingIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// BaseMessagingIntegrationTest, not BaseIntegrationTest: intelligence-service always wires
// AnalyticsEventListener (a real @RabbitListener bean) regardless of which test runs, so the
// context needs a RabbitMQ connection override even for a test that only hits an HTTP
// endpoint - otherwise it falls back to Spring Boot's default localhost:5672, which fails with
// "Connection refused" on a clean runner (a stray local docker-compose RabbitMQ can mask this).
@DisplayName("AnalyticsController Integration Tests")
class AnalyticsControllerIT extends BaseMessagingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/analytics?type=sales returns 200")
    void getAnalytics_sales_returns200() throws Exception {
        mockMvc.perform(get("/api/analytics")
                .param("type", "sales")
                .header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/analytics?type=invalid returns 400")
    void getAnalytics_invalidType_returns400() throws Exception {
        mockMvc.perform(get("/api/analytics")
                .param("type", "invalid-type"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/bi?type=sales-forecast returns 200")
    void getBi_salesForecast_returns200() throws Exception {
        mockMvc.perform(get("/api/bi")
                .param("type", "sales-forecast")
                .header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk());
    }
}
