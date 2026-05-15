package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.WasteController;
import com.MaSoVa.logistics.inventory.entity.WasteRecord;
import com.MaSoVa.logistics.inventory.service.WasteAnalysisService;
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
        return wr;
    }

    @Test
    @DisplayName("GET /api/waste returns 200 with list")
    void getWaste_returns200() throws Exception {
        when(wasteAnalysisService.getAllWasteRecords(any())).thenReturn(List.of(buildWasteRecord("waste-1")));

        mockMvc.perform(get("/api/waste").header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/waste returns 201 with created record")
    void recordWaste_returns201() throws Exception {
        when(wasteAnalysisService.recordWaste(any())).thenReturn(buildWasteRecord("waste-new"));

        mockMvc.perform(post("/api/waste")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"itemName\":\"Lettuce\",\"quantity\":2.0,\"unit\":\"KG\",\"category\":\"PRODUCE\",\"storeId\":\"store-1\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/waste/{id} returns 200")
    void getWasteById_returns200() throws Exception {
        when(wasteAnalysisService.getWasteRecordById("waste-1")).thenReturn(buildWasteRecord("waste-1"));

        mockMvc.perform(get("/api/waste/waste-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/waste/{id} returns 200 with record")
    void getWasteById_returns200() throws Exception {
        when(wasteAnalysisService.getWasteRecordById("waste-1")).thenReturn(buildWasteRecord("waste-1"));

        mockMvc.perform(get("/api/waste/waste-1"))
            .andExpect(status().isOk());
    }
}
