package com.MaSoVa.order.controller;

import com.MaSoVa.order.config.TestSecurityConfig;
import com.MaSoVa.order.entity.KitchenEquipment;
import com.MaSoVa.order.entity.KitchenEquipment.EquipmentStatus;
import com.MaSoVa.order.entity.KitchenEquipment.EquipmentType;
import com.MaSoVa.order.service.KitchenEquipmentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KitchenEquipmentController.class)
@Import(TestSecurityConfig.class)
@WithMockUser(roles = "MANAGER")
@DisplayName("KitchenEquipmentController Unit Tests")
class KitchenEquipmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private KitchenEquipmentService equipmentService;

    private KitchenEquipment sampleEquipment;

    @BeforeEach
    void setUp() {
        sampleEquipment = KitchenEquipment.builder()
                .id("equip-1")
                .storeId("store-1")
                .equipmentName("Pizza Oven")
                .type(EquipmentType.OVEN)
                .status(EquipmentStatus.AVAILABLE)
                .isOn(false)
                .usageCount(0)
                .build();
    }

    // ======================================================================
    // POST /api/kitchen-equipment
    // ======================================================================

    @Nested
    @DisplayName("POST /api/kitchen-equipment")
    class CreateEquipment {

        @Test
        @DisplayName("Given valid equipment, should return 200")
        void shouldCreateEquipment() throws Exception {
            when(equipmentService.createEquipment(any(KitchenEquipment.class))).thenReturn(sampleEquipment);

            String body = objectMapper.writeValueAsString(Map.of(
                    "equipmentName", "Pizza Oven",
                    "storeId", "store-1",
                    "type", "OVEN"
            ));

            mockMvc.perform(post("/api/kitchen-equipment")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.equipmentName", is("Pizza Oven")));
        }
    }

    // ======================================================================
    // GET /api/kitchen-equipment/store
    // ======================================================================

    @Nested
    @DisplayName("GET /api/kitchen-equipment/store")
    class GetStoreEquipment {

        @Test
        @DisplayName("Given valid store ID header, should return equipment list")
        void shouldReturnStoreEquipment() throws Exception {
            when(equipmentService.getEquipmentByStore("store-1")).thenReturn(List.of(sampleEquipment));

            mockMvc.perform(get("/api/kitchen-equipment/store")
                            .header("X-Store-Id", "store-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].equipmentName", is("Pizza Oven")));
        }
    }

    // ======================================================================
    // GET /api/kitchen-equipment/{equipmentId}
    // ======================================================================

    @Test
    @DisplayName("Given valid equipment ID, should return equipment details")
    void shouldReturnEquipmentById() throws Exception {
        when(equipmentService.getEquipmentById("equip-1")).thenReturn(sampleEquipment);

        mockMvc.perform(get("/api/kitchen-equipment/equip-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("equip-1")));
    }

    // ======================================================================
    // PATCH /api/kitchen-equipment/{equipmentId}/status
    // ======================================================================

    @Test
    @DisplayName("Given valid status update, should update equipment status")
    void shouldUpdateEquipmentStatus() throws Exception {
        sampleEquipment.setStatus(EquipmentStatus.MAINTENANCE);
        when(equipmentService.updateEquipmentStatus(eq("equip-1"), eq(EquipmentStatus.MAINTENANCE), anyString(), anyString()))
                .thenReturn(sampleEquipment);

        String body = objectMapper.writeValueAsString(Map.of(
                "status", "MAINTENANCE",
                "staffId", "staff-1",
                "notes", "Scheduled maintenance"
        ));

        mockMvc.perform(patch("/api/kitchen-equipment/equip-1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("MAINTENANCE")));
    }

    // ======================================================================
    // PATCH /api/kitchen-equipment/{equipmentId}/power
    // ======================================================================

    @Test
    @DisplayName("Given power toggle request, should toggle equipment power")
    void shouldTogglePower() throws Exception {
        sampleEquipment.setIsOn(true);
        sampleEquipment.setStatus(EquipmentStatus.IN_USE);
        when(equipmentService.toggleEquipmentPower(eq("equip-1"), eq(true), anyString()))
                .thenReturn(sampleEquipment);

        String body = objectMapper.writeValueAsString(Map.of(
                "isOn", true,
                "staffId", "staff-1"
        ));

        mockMvc.perform(patch("/api/kitchen-equipment/equip-1/power")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isOn", is(true)));
    }

    // ======================================================================
    // PATCH /api/kitchen-equipment/{equipmentId}/temperature
    // ======================================================================

    @Test
    @DisplayName("Given valid temperature, should update equipment temperature")
    void shouldUpdateTemperature() throws Exception {
        sampleEquipment.setTemperature(220);
        when(equipmentService.updateTemperature(eq("equip-1"), eq(220))).thenReturn(sampleEquipment);

        String body = objectMapper.writeValueAsString(Map.of("temperature", 220));

        mockMvc.perform(patch("/api/kitchen-equipment/equip-1/temperature")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.temperature", is(220)));
    }

    // ======================================================================
    // POST /api/kitchen-equipment/{equipmentId}/maintenance
    // ======================================================================

    @Test
    @DisplayName("Given maintenance record request, should record maintenance")
    void shouldRecordMaintenance() throws Exception {
        when(equipmentService.recordMaintenance(eq("equip-1"), any(LocalDateTime.class), anyString()))
                .thenReturn(sampleEquipment);

        String body = objectMapper.writeValueAsString(Map.of(
                "nextMaintenanceDate", "2026-03-15T10:00:00",
                "notes", "Deep clean"
        ));

        mockMvc.perform(post("/api/kitchen-equipment/equip-1/maintenance")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    // ======================================================================
    // DELETE /api/kitchen-equipment/{equipmentId}
    // ======================================================================

    @Test
    @DisplayName("Given valid equipment ID, should delete and return 204")
    void shouldDeleteEquipment() throws Exception {
        doNothing().when(equipmentService).deleteEquipment("equip-1");

        mockMvc.perform(delete("/api/kitchen-equipment/equip-1")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(equipmentService).deleteEquipment("equip-1");
    }

    // ======================================================================
    // GET /api/kitchen-equipment/store/maintenance-needed
    // ======================================================================

    @Test
    @DisplayName("Given valid store header, should return equipment needing maintenance")
    void shouldReturnEquipmentNeedingMaintenance() throws Exception {
        when(equipmentService.getEquipmentNeedingMaintenance("store-1")).thenReturn(List.of(sampleEquipment));

        mockMvc.perform(get("/api/kitchen-equipment/store/maintenance-needed")
                        .header("X-Store-Id", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }
}
