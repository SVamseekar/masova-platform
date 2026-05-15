package com.MaSoVa.core.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("AuthController Integration Tests")
class AuthControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/auth/register then POST /api/auth/login returns valid token")
    void registerThenLogin_returnsValidToken() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"integration@masova.com\",\"password\":\"Test1234!\",\"firstName\":\"Test\",\"lastName\":\"User\",\"phone\":\"+919876543210\"}"))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"integration@masova.com\",\"password\":\"Test1234!\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/auth/login with wrong password returns 401")
    void loginWithWrongPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"notexist@masova.com\",\"password\":\"wrongpass\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/register with duplicate email returns 409")
    void registerDuplicateEmail_returns409() throws Exception {
        String body = "{\"email\":\"dup@masova.com\",\"password\":\"Test1234!\",\"firstName\":\"Dup\",\"lastName\":\"User\",\"phone\":\"+919876543211\"}";

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }
}
