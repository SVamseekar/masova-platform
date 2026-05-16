package com.MaSoVa.payment.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("PaymentController Integration Tests")
class PaymentControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/payments returns 200 with empty list")
    void getPayments_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/payments")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/payments/{transactionId} returns error for non-existent transaction")
    void getTransaction_returnsErrorForNonExistent() throws Exception {
        mockMvc.perform(get("/api/payments/nonexistent")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/payments/refund with no params returns 400")
    void getRefunds_noParams_returns400() throws Exception {
        mockMvc.perform(get("/api/payments/refund")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/payments/refund?orderId=nonexistent returns 200 with empty list")
    void getRefunds_withOrderId_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/payments/refund")
                .param("orderId", "nonexistent-order")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
