package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.menu.controller.MenuController;
import com.MaSoVa.commerce.menu.service.MenuService;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MenuControllerExtendedTest extends BaseServiceTest {

    @Mock private MenuService menuService;
    @InjectMocks private MenuController menuController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(menuController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    private MenuItem buildItem(String id) {
        MenuItem item = new MenuItem("Test Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 25000L);
        item.setId(id);
        item.setStoreId("store-1");
        item.setIsAvailable(true);
        item.setAllergensDeclared(true);
        item.setAllergens(new HashSet<>());
        item.setVariants(new ArrayList<>());
        item.setCustomizations(new ArrayList<>());
        item.setDietaryInfo(new ArrayList<>());
        item.setIngredients(new ArrayList<>());
        item.setPreparationInstructions(new ArrayList<>());
        item.setTags(new ArrayList<>());
        return item;
    }

    // GET /api/menu
    @Test
    void getMenu_no_params_returns_200() throws Exception {
        when(menuService.getAllMenuItems()).thenReturn(List.of(buildItem("m1")));

        mockMvc.perform(get("/api/menu"))
                .andExpect(status().isOk());
    }

    @Test
    void getMenu_by_storeId_returns_filtered() throws Exception {
        when(menuService.getMenuItemsByStore("store-1")).thenReturn(List.of(buildItem("m1")));

        mockMvc.perform(get("/api/menu").param("storeId", "store-1"))
                .andExpect(status().isOk());
    }

    @Test
    void getMenu_by_cuisine_returns_filtered() throws Exception {
        when(menuService.getMenuItemsByCuisine(Cuisine.ITALIAN)).thenReturn(List.of(buildItem("m1")));

        mockMvc.perform(get("/api/menu").param("cuisine", "ITALIAN"))
                .andExpect(status().isOk());
    }

    @Test
    void getMenu_by_category_returns_filtered() throws Exception {
        when(menuService.getMenuItemsByCategory(MenuCategory.PIZZA)).thenReturn(List.of(buildItem("m1")));

        mockMvc.perform(get("/api/menu").param("category", "PIZZA"))
                .andExpect(status().isOk());
    }

    @Test
    void getMenu_search_returns_filtered() throws Exception {
        when(menuService.searchMenuItems("pizza")).thenReturn(List.of(buildItem("m1")));

        mockMvc.perform(get("/api/menu").param("search", "pizza"))
                .andExpect(status().isOk());
    }

    // GET /api/menu/{id}
    @Test
    void getMenuItem_returns_200_when_found() throws Exception {
        when(menuService.getMenuItemById("m1")).thenReturn(Optional.of(buildItem("m1")));

        mockMvc.perform(get("/api/menu/m1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("m1"));
    }

    @Test
    void getMenuItem_returns_404_when_not_found() throws Exception {
        when(menuService.getMenuItemById("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/menu/missing"))
                .andExpect(status().isNotFound());
    }

    // POST /api/menu
    @Test
    void createMenuItem_returns_201() throws Exception {
        when(menuService.createMenuItem(any())).thenReturn(buildItem("m1"));

        mockMvc.perform(post("/api/menu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Margherita\",\"cuisine\":\"ITALIAN\",\"category\":\"PIZZA\",\"basePrice\":25000,\"storeId\":\"store-1\"}"))
                .andExpect(status().isCreated());
    }

    // PATCH /api/menu/{id}
    @Test
    void updateMenuItem_returns_200() throws Exception {
        when(menuService.updateMenuItem(eq("m1"), any())).thenReturn(buildItem("m1"));

        mockMvc.perform(patch("/api/menu/m1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Pepperoni\",\"cuisine\":\"ITALIAN\",\"category\":\"PIZZA\",\"basePrice\":30000,\"storeId\":\"store-1\"}"))
                .andExpect(status().isOk());
    }

    // DELETE /api/menu/{id}
    @Test
    void deleteMenuItem_returns_204() throws Exception {
        mockMvc.perform(delete("/api/menu/m1"))
                .andExpect(status().isNoContent());
    }

    // POST /api/menu/copy
    @Test
    void copyMenu_returns_200() throws Exception {
        when(menuService.copyMenuBetweenStores("store-src", "store-tgt"))
                .thenReturn(List.of(buildItem("m1")));

        mockMvc.perform(post("/api/menu/copy")
                        .param("fromStoreId", "store-src")
                        .param("toStoreId", "store-tgt"))
                .andExpect(status().isOk());
    }

    // PATCH /api/menu/items/{id}/allergens
    @Test
    void declareAllergens_returns_200() throws Exception {
        when(menuService.declareAllergens(eq("m1"), any(), eq(false))).thenReturn(buildItem("m1"));

        mockMvc.perform(patch("/api/menu/items/m1/allergens")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allergens\":[\"CEREALS_GLUTEN\"],\"allergenFree\":false}"))
                .andExpect(status().isOk());
    }

    // GET /api/menu/stats
    @Test
    void getMenuStats_returns_200() throws Exception {
        when(menuService.getTotalItemsCountByStore(any())).thenReturn(10L);
        when(menuService.getAvailableItemsCountByStore(any())).thenReturn(8L);

        mockMvc.perform(get("/api/menu/stats")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }
}
