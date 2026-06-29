package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.KitchenEquipmentController;
import com.MaSoVa.commerce.order.entity.KitchenEquipment;
import com.MaSoVa.commerce.order.service.KitchenEquipmentService;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("KitchenEquipmentController Unit Tests")
class KitchenEquipmentControllerTest extends BaseServiceTest {

    @Mock private KitchenEquipmentService equipmentService;
    @InjectMocks private KitchenEquipmentController controller;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
            .build();
    }

    private KitchenEquipment buildEquipment(String id) {
        KitchenEquipment eq = new KitchenEquipment();
        eq.setId(id);
        eq.setEquipmentName("Oven 1");
        eq.setStoreId("store-1");
        return eq;
    }

    @Test
    @DisplayName("GET /api/equipment returns 200 with list")
    void getEquipment_returns200() throws Exception {
        when(equipmentService.getEquipmentByStore(any())).thenReturn(List.of(buildEquipment("eq-1")));

        mockMvc.perform(get("/api/equipment").param("storeId", "store-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("eq-1"));
    }

    @Test
    @DisplayName("POST /api/equipment returns 200 with created equipment")
    void createEquipment_returns200() throws Exception {
        when(equipmentService.createEquipment(any())).thenReturn(buildEquipment("eq-new"));

        mockMvc.perform(post("/api/equipment")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"equipmentName\":\"Fryer 1\",\"type\":\"FRYER\",\"storeId\":\"store-1\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("eq-new"));
    }

    @Test
    @DisplayName("GET /api/equipment/{id} returns 200")
    void getEquipmentById_returns200() throws Exception {
        when(equipmentService.getEquipmentById("eq-1")).thenReturn(buildEquipment("eq-1"));

        mockMvc.perform(get("/api/equipment/eq-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("eq-1"));
    }

    @Test
    @DisplayName("DELETE /api/equipment/{id} returns 204")
    void deleteEquipment_returns204() throws Exception {
        doNothing().when(equipmentService).deleteEquipment("eq-1");

        mockMvc.perform(delete("/api/equipment/eq-1"))
            .andExpect(status().isNoContent());
    }
}
