package com.MaSoVa.commerce.integration.controller;

import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("MenuController Integration Tests")
class MenuControllerIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("POST /api/menu creates item then GET retrieves it")
    void createThenRetrieve() throws Exception {
        String createBody = "{\"name\":\"Margherita\",\"cuisine\":\"ITALIAN\",\"category\":\"PIZZA\",\"basePrice\":29900,\"storeId\":\"store-1\",\"isAvailable\":false}";

        String response = mockMvc.perform(post("/api/menu")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Type", "MANAGER")
                .content(createBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        String id = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(response).get("id").asText();

        mockMvc.perform(get("/api/menu/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Margherita"));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/menu returns 200 with empty list initially")
    void getMenu_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/menu"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/menu/{id} returns 404 for non-existent item")
    void getMenuItem_returns404() throws Exception {
        mockMvc.perform(get("/api/menu/nonexistent"))
            .andExpect(status().isNotFound());
    }
}
