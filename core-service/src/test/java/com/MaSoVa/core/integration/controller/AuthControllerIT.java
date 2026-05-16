package com.MaSoVa.core.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Core Service Integration Tests")
class AuthControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Auth ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register then POST /api/auth/login returns valid token")
    void registerThenLogin_returnsValidToken() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test User\",\"email\":\"integration@masova.com\",\"password\":\"Test1234!\",\"phone\":\"9876543210\",\"type\":\"STAFF\",\"storeId\":\"store-1\"}"))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"integration@masova.com\",\"password\":\"Test1234!\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/auth/login with wrong credentials returns error")
    void loginWithWrongCredentials_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"notexist@masova.com\",\"password\":\"wrongpass\"}"))
            .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("POST /api/auth/register with missing required fields returns 400")
    void registerWithMissingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"bad@masova.com\"}"))
            .andExpect(status().isBadRequest());
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/users returns 200 with array")
    void getUsers_returnsArray() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/users/{userId} returns error for non-existent user")
    void getUser_returnsErrorForNonExistent() throws Exception {
        mockMvc.perform(get("/api/users/nonexistent-id")
                .header("X-User-Type", "MANAGER"))
            .andExpect(status().is5xxServerError());
    }
}
