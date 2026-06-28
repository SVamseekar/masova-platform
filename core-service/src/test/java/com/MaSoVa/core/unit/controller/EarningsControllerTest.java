package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.earnings.controller.EarningsController;
import com.MaSoVa.core.earnings.entity.StaffPayRateEntity;
import com.MaSoVa.core.earnings.service.EarningsService;
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

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EarningsController Unit Tests")
class EarningsControllerTest extends BaseServiceTest {

    @Mock private EarningsService earningsService;
    @InjectMocks private EarningsController earningsController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(earningsController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("GET /api/staff/earnings/weekly returns 200")
    void getWeeklyEarnings_returns200() throws Exception {
        when(earningsService.getWeeklyEarnings(anyString(), any())).thenReturn(null);

        mockMvc.perform(get("/api/staff/earnings/weekly").param("employeeId", "emp-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/staff/earnings/history returns 200 with history list")
    void getEarningsHistory_returns200() throws Exception {
        when(earningsService.getEarningsHistory(anyString(), anyInt())).thenReturn(List.of());

        mockMvc.perform(get("/api/staff/earnings/history").param("employeeId", "emp-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/staff/pay-rates returns 200 when rate found")
    void getPayRate_returns200() throws Exception {
        StaffPayRateEntity rate = new StaffPayRateEntity();
        rate.setEmployeeId("emp-1");
        when(earningsService.getCurrentPayRate("emp-1")).thenReturn(Optional.of(rate));

        mockMvc.perform(get("/api/staff/pay-rates").param("employeeId", "emp-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/staff/pay-rates returns 404 when no rate found")
    void getPayRate_returns404() throws Exception {
        when(earningsService.getCurrentPayRate("emp-99")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/staff/pay-rates").param("employeeId", "emp-99"))
            .andExpect(status().isNotFound());
    }
}
