package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.WasteController;
import com.MaSoVa.logistics.inventory.entity.WasteRecord;
import com.MaSoVa.logistics.inventory.service.WasteAnalysisService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WasteController Unit Tests")
class WasteControllerTest extends BaseServiceTest {

    @Mock private WasteAnalysisService wasteAnalysisService;
    @InjectMocks private WasteController wasteController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(wasteController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private WasteRecord buildWasteRecord(String id) {
        WasteRecord wr = new WasteRecord();
        wr.setId(id);
        wr.setStoreId("store-1");
        wr.setItemName("Lettuce");
        wr.setQuantity(2.0);
        wr.setUnit("KG");
        wr.setWasteCategory("EXPIRED");
        return wr;
    }

    @Nested
    @DisplayName("GET /api/waste")
    class GetWaste {

        @Test
        @DisplayName("returns all waste records by default")
        void returnsAll() throws Exception {
            when(wasteAnalysisService.getAllWasteRecords(any())).thenReturn(List.of(buildWasteRecord("waste-1")));

            mockMvc.perform(get("/api/waste").header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns waste by category when category param given")
        void returnsByCategory() throws Exception {
            when(wasteAnalysisService.getWasteRecordsByCategory(any(), eq("EXPIRED")))
                .thenReturn(List.of(buildWasteRecord("waste-1")));

            mockMvc.perform(get("/api/waste")
                    .header("X-User-Store-Id", "store-1")
                    .param("category", "EXPIRED"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns waste by date range when startDate and endDate given")
        void returnsByDateRange() throws Exception {
            when(wasteAnalysisService.getWasteRecordsByDateRange(any(), any(), any()))
                .thenReturn(List.of(buildWasteRecord("waste-1")));

            mockMvc.perform(get("/api/waste")
                    .header("X-User-Store-Id", "store-1")
                    .param("startDate", "2026-05-01")
                    .param("endDate", "2026-05-17"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/waste")
    class RecordWaste {

        @Test
        @DisplayName("returns 201 with created waste record")
        void returns201() throws Exception {
            when(wasteAnalysisService.recordWaste(any())).thenReturn(buildWasteRecord("waste-new"));

            mockMvc.perform(post("/api/waste")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"itemName\":\"Lettuce\",\"quantity\":2.0,\"unit\":\"KG\",\"storeId\":\"store-1\",\"wasteCategory\":\"EXPIRED\"}"))
                .andExpect(status().isCreated());
        }
    }

    @Nested
    @DisplayName("GET /api/waste/{id}")
    class GetWasteById {

        @Test
        @DisplayName("returns 200 with waste record")
        void returns200() throws Exception {
            when(wasteAnalysisService.getWasteRecordById("waste-1")).thenReturn(buildWasteRecord("waste-1"));

            mockMvc.perform(get("/api/waste/waste-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("PATCH /api/waste/{id}")
    class UpdateWaste {

        @Test
        @DisplayName("approves waste when approverId given in body")
        void approvesWaste() throws Exception {
            WasteRecord approved = buildWasteRecord("waste-1");
            when(wasteAnalysisService.approveWasteRecord(eq("waste-1"), eq("manager-1")))
                .thenReturn(approved);

            mockMvc.perform(patch("/api/waste/waste-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"approverId\":\"manager-1\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("plain field update when no approverId in body")
        void plainFieldUpdate() throws Exception {
            WasteRecord existing = buildWasteRecord("waste-1");
            when(wasteAnalysisService.getWasteRecordById("waste-1")).thenReturn(existing);
            when(wasteAnalysisService.updateWasteRecord(any())).thenReturn(existing);

            mockMvc.perform(patch("/api/waste/waste-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"itemName\":\"Spinach\",\"quantity\":1.5,\"unit\":\"KG\",\"wasteCategory\":\"DAMAGED\",\"wasteReason\":\"Freezer failure\",\"notes\":\"Updated\",\"preventable\":true,\"preventionNotes\":\"Fix freezer\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("DELETE /api/waste/{id}")
    class DeleteWaste {

        @Test
        @DisplayName("returns 200 with success message")
        void returns200() throws Exception {
            doNothing().when(wasteAnalysisService).deleteWasteRecord("waste-1");

            mockMvc.perform(delete("/api/waste/waste-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Waste record deleted successfully"));
        }
    }

    @Nested
    @DisplayName("GET /api/waste/analytics")
    class WasteAnalytics {

        @Test
        @DisplayName("returns total cost when type=total-cost")
        void returnsTotalCost() throws Exception {
            when(wasteAnalysisService.getTotalWasteCost(any(), isNull(), isNull()))
                .thenReturn(new BigDecimal("1500.00"));

            mockMvc.perform(get("/api/waste/analytics")
                    .header("X-User-Store-Id", "store-1")
                    .param("type", "total-cost"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns cost by category when type=cost-by-category")
        void returnsCostByCategory() throws Exception {
            when(wasteAnalysisService.getWasteCostByCategory(any(), any(), any()))
                .thenReturn(Map.of("EXPIRED", new BigDecimal("800.00")));

            mockMvc.perform(get("/api/waste/analytics")
                    .header("X-User-Store-Id", "store-1")
                    .param("type", "cost-by-category"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns top wasted items when type=top-items")
        void returnsTopItems() throws Exception {
            when(wasteAnalysisService.getTopWastedItems(any(), any(), any(), anyInt()))
                .thenReturn(List.of(Map.of("item", "Lettuce", "totalLoss", 500.0)));

            mockMvc.perform(get("/api/waste/analytics")
                    .header("X-User-Store-Id", "store-1")
                    .param("type", "top-items"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns preventable analysis when type=preventable")
        void returnsPreventable() throws Exception {
            when(wasteAnalysisService.getPreventableWasteAnalysis(any(), any(), any()))
                .thenReturn(Map.of("preventablePercentage", 45.0));

            mockMvc.perform(get("/api/waste/analytics")
                    .header("X-User-Store-Id", "store-1")
                    .param("type", "preventable"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns trend when type=trend")
        void returnsTrend() throws Exception {
            when(wasteAnalysisService.getWasteTrend(any(), anyInt()))
                .thenReturn(List.of(Map.of("month", "2026-05", "totalCost", 1200.0)));

            mockMvc.perform(get("/api/waste/analytics")
                    .header("X-User-Store-Id", "store-1")
                    .param("type", "trend"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 for missing or unknown type")
        void returns400ForMissingType() throws Exception {
            mockMvc.perform(get("/api/waste/analytics")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isBadRequest());
        }
    }
}
