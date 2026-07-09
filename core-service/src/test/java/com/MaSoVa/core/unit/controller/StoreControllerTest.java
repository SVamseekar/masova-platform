package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.StoreController;
import com.MaSoVa.core.user.service.StoreService;
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StoreController Unit Tests")
class StoreControllerTest extends BaseServiceTest {

    @Mock private StoreService storeService;
    @InjectMocks private StoreController storeController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(storeController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Store buildStore(String id, String name) {
        Store store = new Store();
        store.setId(id);
        store.setName(name);
        return store;
    }

    @Test
    @DisplayName("GET /api/stores returns 200 with store list")
    void getStores_returns200() throws Exception {
        when(storeService.getActiveStores()).thenReturn(List.of(buildStore("store-1", "MaSoVa Mumbai")));

        mockMvc.perform(get("/api/stores"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("store-1"));
    }

    @Test
    @DisplayName("GET /api/stores/{storeId} returns 200 for existing store")
    void getStore_returns200() throws Exception {
        when(storeService.getStoreByCode("store-1")).thenThrow(new RuntimeException("not found by code"));
        when(storeService.getStore("store-1")).thenReturn(buildStore("store-1", "MaSoVa Mumbai"));

        mockMvc.perform(get("/api/stores/store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("MaSoVa Mumbai"));
    }

    @Test
    @DisplayName("GET /api/stores/public returns active store list (anonymous alias)")
    void getPublicStores_returns200() throws Exception {
        when(storeService.getActiveStores()).thenReturn(List.of(buildStore("store-1", "MaSoVa Berlin")));

        mockMvc.perform(get("/api/stores/public"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("MaSoVa Berlin"));
    }

    @Test
    @DisplayName("GET /api/stores/public/{code} returns store by code (anonymous alias)")
    void getPublicStoreByCode_returns200() throws Exception {
        when(storeService.getStoreByCode("DOM001")).thenReturn(buildStore("store-1", "MaSoVa Berlin Mitte"));

        mockMvc.perform(get("/api/stores/public/DOM001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("MaSoVa Berlin Mitte"));
    }

    private static final String VALID_STORE_JSON =
        "{\"name\":\"New Branch\",\"code\":\"DOM001\",\"address\":{\"street\":\"MG Road\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\",\"pincode\":\"400001\",\"country\":\"India\"},\"phoneNumber\":\"9876543210\"}";

    @Test
    @DisplayName("POST /api/stores returns 200 with created store")
    void createStore_returns200() throws Exception {
        Store store = buildStore("store-new", "New Branch");
        when(storeService.saveStore(any())).thenReturn(store);

        mockMvc.perform(post("/api/stores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_STORE_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("store-new"));
    }

    @Test
    @DisplayName("PATCH /api/stores/{storeId} returns 200 with updated store")
    void updateStore_returns200() throws Exception {
        Store store = buildStore("store-1", "Updated Branch");
        when(storeService.saveStore(any())).thenReturn(store);

        mockMvc.perform(patch("/api/stores/store-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_STORE_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Updated Branch"));
    }
}
