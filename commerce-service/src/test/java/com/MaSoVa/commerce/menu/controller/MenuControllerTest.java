package com.MaSoVa.commerce.menu.controller;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.AllergenType;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.exception.BusinessException;
import com.MaSoVa.commerce.menu.dto.AllergenDeclarationRequest;
import com.MaSoVa.commerce.menu.service.MenuService;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MenuController.class)
class MenuControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MenuService menuService;

    @Test
    @DisplayName("GET /api/menu/public/{id} returns 200 for existing item")
    void getMenuItem_returns200() throws Exception {
        MenuItem item = new MenuItem("Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 29900L);
        item.setId("item-1");
        item.setAllergensDeclared(true);
        when(menuService.getMenuItemById("item-1")).thenReturn(Optional.of(item));

        mockMvc.perform(get("/api/menu/public/item-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Pizza"));
    }

    @Test
    @DisplayName("GET /api/menu/public/{id} returns 404 for missing item")
    void getMenuItem_returns404() throws Exception {
        when(menuService.getMenuItemById("bad-id")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/menu/public/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/menu/items/{id}/allergens returns 200 with valid body")
    void declareAllergens_returns200() throws Exception {
        MenuItem declared = new MenuItem("Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 29900L);
        declared.setId("item-1");
        declared.setAllergensDeclared(true);
        declared.setAllergens(Set.of(AllergenType.MILK, AllergenType.EGGS));
        when(menuService.declareAllergens(eq("item-1"), anySet(), eq(false))).thenReturn(declared);

        AllergenDeclarationRequest req = new AllergenDeclarationRequest();
        req.setAllergens(Set.of(AllergenType.MILK, AllergenType.EGGS));
        req.setAllergenFree(false);

        mockMvc.perform(patch("/api/menu/items/item-1/allergens")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.allergensDeclared").value(true));
    }

    @Test
    @DisplayName("PATCH /api/menu/items/{id}/allergens returns 400 for invalid AllergenType")
    void declareAllergens_returns400ForInvalidEnum() throws Exception {
        mockMvc.perform(patch("/api/menu/items/item-1/allergens")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"allergens\":[\"INVALID_ALLERGEN\"],\"allergenFree\":false}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/menu/items returns 400 when name is missing")
    void createMenuItem_returns400WhenNameMissing() throws Exception {
        mockMvc.perform(post("/api/menu/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cuisine\":\"ITALIAN\",\"category\":\"PIZZA\",\"basePrice\":29900}"))
            .andExpect(status().isBadRequest());
    }
}
