package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.fiscal.FiscalComplianceService;
import com.MaSoVa.commerce.fiscal.FiscalController;
import com.MaSoVa.commerce.fiscal.dto.FiscalSummaryDto;
import com.MaSoVa.commerce.fiscal.dto.SigningFailureDto;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("FiscalController Unit Tests")
class FiscalControllerTest extends BaseServiceTest {

    @Mock private FiscalComplianceService fiscalComplianceService;
    @InjectMocks private FiscalController fiscalController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(fiscalController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    @DisplayName("GET /api/fiscal/summary returns summary list")
    void getSummary_returns200() throws Exception {
        when(fiscalComplianceService.getSummary("store-1")).thenReturn(List.of(
                new FiscalSummaryDto("store-1", "DE", "TSE", 10L, 1L,
                        OffsetDateTime.parse("2026-06-29T10:00:00Z"))));

        mockMvc.perform(get("/api/fiscal/summary")
                        .param("storeId", "store-1")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].countryCode").value("DE"))
                .andExpect(jsonPath("$[0].totalSigned").value(10));
    }

    @Test
    @DisplayName("GET /api/fiscal/failures returns failure list")
    void getFailures_returns200() throws Exception {
        when(fiscalComplianceService.getFailures("store-1")).thenReturn(List.of(
                new SigningFailureDto("order-1", "store-1", "DE", "TSE",
                        "TSE offline", OffsetDateTime.parse("2026-06-28T12:00:00Z"))));

        mockMvc.perform(get("/api/fiscal/failures")
                        .param("storeId", "store-1")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value("order-1"))
                .andExpect(jsonPath("$[0].signingError").value("TSE offline"));
    }

    @Test
    @DisplayName("GET /api/fiscal/summary returns 400 when storeId missing")
    void getSummary_returns400WhenInvalidStore() throws Exception {
        when(fiscalComplianceService.getSummary(""))
                .thenThrow(new IllegalArgumentException("storeId is required"));

        mockMvc.perform(get("/api/fiscal/summary")
                        .param("storeId", ""))
                .andExpect(status().isBadRequest());
    }
}