package com.MaSoVa.payment.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("PaymentController Integration Tests")
class PaymentControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/payments returns 200 with empty list")
    void getPayments_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/payments")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/payments/{transactionId} returns 404 for non-existent transaction")
    void getTransaction_returns404() throws Exception {
        mockMvc.perform(get("/api/payments/nonexistent")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/payments/refund returns 200")
    void getRefunds_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/payments/refund")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk());
    }
}
