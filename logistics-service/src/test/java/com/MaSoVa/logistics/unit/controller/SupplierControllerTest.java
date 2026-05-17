package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.SupplierController;
import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.MaSoVa.logistics.inventory.service.SupplierService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SupplierController Unit Tests")
class SupplierControllerTest extends BaseServiceTest {

    @Mock private SupplierService supplierService;
    @InjectMocks private SupplierController supplierController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(supplierController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Supplier buildSupplier(String id) {
        Supplier s = new Supplier();
        s.setId(id);
        s.setSupplierName("Fresh Farms");
        s.setSupplierCode("FRE-001");
        s.setStatus("ACTIVE");
        s.setOnTimeDeliveryRate(92.0);
        s.setQualityRating(4.5);
        s.setTotalOrders(0);
        s.setCompletedOrders(0);
        s.setCancelledOrders(0);
        return s;
    }

    @Nested
    @DisplayName("GET /api/suppliers")
    class GetSuppliers {

        @Test
        @DisplayName("returns all suppliers by default")
        void returnsAll() throws Exception {
            when(supplierService.getAllSuppliers()).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns ACTIVE suppliers when status=ACTIVE")
        void returnsActive() throws Exception {
            when(supplierService.getActiveSuppliers()).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers").param("status", "ACTIVE"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns preferred suppliers when preferred=true")
        void returnsPreferred() throws Exception {
            when(supplierService.getPreferredSuppliers()).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers").param("preferred", "true"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns reliable suppliers when reliable=true")
        void returnsReliable() throws Exception {
            when(supplierService.getReliableSuppliers()).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers").param("reliable", "true"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns search results when search param given")
        void returnsSearch() throws Exception {
            when(supplierService.searchSuppliers("farm")).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers").param("search", "farm"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns by city when city param given")
        void returnsByCity() throws Exception {
            when(supplierService.getSuppliersByCity("Mumbai")).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers").param("city", "Mumbai"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns by category when category param given")
        void returnsByCategory() throws Exception {
            when(supplierService.getSuppliersByCategory("PRODUCE")).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers").param("category", "PRODUCE"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns by code when code param given")
        void returnsByCode() throws Exception {
            when(supplierService.getSupplierByCode("FRE-001")).thenReturn(buildSupplier("sup-1"));

            mockMvc.perform(get("/api/suppliers").param("code", "FRE-001"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/suppliers")
    class CreateSupplier {

        @Test
        @DisplayName("returns 201 with created supplier")
        void returns201() throws Exception {
            when(supplierService.createSupplier(any())).thenReturn(buildSupplier("sup-new"));

            mockMvc.perform(post("/api/suppliers")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"supplierName\":\"Fresh Farms\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isCreated());
        }
    }

    @Nested
    @DisplayName("GET /api/suppliers/{id}")
    class GetSupplierById {

        @Test
        @DisplayName("returns 200 with supplier")
        void returns200() throws Exception {
            when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));

            mockMvc.perform(get("/api/suppliers/sup-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("PATCH /api/suppliers/{id}")
    class UpdateSupplier {

        @Test
        @DisplayName("updates status when only status field given")
        void updatesStatus() throws Exception {
            when(supplierService.updateSupplierStatus(eq("sup-1"), eq("INACTIVE")))
                .thenReturn(buildSupplier("sup-1"));

            mockMvc.perform(patch("/api/suppliers/sup-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("marks as preferred when only isPreferred field given")
        void marksPreferred() throws Exception {
            when(supplierService.markAsPreferred(eq("sup-1"), eq(true)))
                .thenReturn(buildSupplier("sup-1"));

            mockMvc.perform(patch("/api/suppliers/sup-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"isPreferred\":true}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("updates performance when onTimeDeliveryRate given")
        void updatesPerformance() throws Exception {
            when(supplierService.updatePerformanceMetrics(eq("sup-1"), any(), any(), eq(95.0), any()))
                .thenReturn(buildSupplier("sup-1"));

            mockMvc.perform(patch("/api/suppliers/sup-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"onTimeDeliveryRate\":95.0}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("updates performance when qualityRating given")
        void updatesQualityRating() throws Exception {
            when(supplierService.updatePerformanceMetrics(eq("sup-1"), any(), any(), any(), eq(4.8)))
                .thenReturn(buildSupplier("sup-1"));

            mockMvc.perform(patch("/api/suppliers/sup-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"qualityRating\":4.8}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("full update when multiple fields given")
        void fullUpdate() throws Exception {
            Supplier existing = buildSupplier("sup-1");
            when(supplierService.getSupplierById("sup-1")).thenReturn(existing);
            when(supplierService.updateSupplier(any())).thenReturn(buildSupplier("sup-1"));

            mockMvc.perform(patch("/api/suppliers/sup-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"supplierName\":\"Updated Farm\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("DELETE /api/suppliers/{id}")
    class DeleteSupplier {

        @Test
        @DisplayName("returns 200 with success message")
        void returns200() throws Exception {
            doNothing().when(supplierService).deleteSupplier("sup-1");

            mockMvc.perform(delete("/api/suppliers/sup-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Supplier deleted successfully"));
        }
    }

    @Nested
    @DisplayName("GET /api/suppliers/compare")
    class CompareSuppliers {

        @Test
        @DisplayName("returns 200 with supplier comparison for category")
        void returns200() throws Exception {
            when(supplierService.compareSuppliersByCategory("PRODUCE")).thenReturn(List.of(buildSupplier("sup-1")));

            mockMvc.perform(get("/api/suppliers/compare").param("category", "PRODUCE"))
                .andExpect(status().isOk());
        }
    }
}
