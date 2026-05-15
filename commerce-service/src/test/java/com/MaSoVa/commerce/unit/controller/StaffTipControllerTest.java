package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.tip.controller.StaffTipController;
import com.MaSoVa.commerce.tip.service.TipService;
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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StaffTipController Unit Tests")
class StaffTipControllerTest extends BaseServiceTest {

    @Mock private TipService tipService;
    @InjectMocks private StaffTipController staffTipController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(staffTipController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("GET /api/staff/tips/pending returns 200 with tip list")
    void getPendingTips_returns200() throws Exception {
        when(tipService.getUndistributedTipsForStaff(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/staff/tips/pending").param("employeeId", "emp-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/staff/tips/pending returns 200 with empty list")
    void getPendingTips_returnsEmptyList() throws Exception {
        when(tipService.getUndistributedTipsForStaff("emp-99")).thenReturn(List.of());

        mockMvc.perform(get("/api/staff/tips/pending").param("employeeId", "emp-99"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }
}
