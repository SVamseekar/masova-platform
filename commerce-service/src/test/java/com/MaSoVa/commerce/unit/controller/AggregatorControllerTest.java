package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.AggregatorController;
import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.commerce.order.service.AggregatorService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AggregatorController Unit Tests")
class AggregatorControllerTest extends BaseServiceTest {

    @Mock private AggregatorService aggregatorService;
    @InjectMocks private AggregatorController aggregatorController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(aggregatorController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("GET /api/aggregators/connections returns 200")
    void getConnections_returns200() throws Exception {
        when(aggregatorService.getConnectionsForStore(anyString())).thenReturn(List.of(new AggregatorConnection()));

        mockMvc.perform(get("/api/aggregators/connections").param("storeId", "store-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/aggregators/connections returns 200")
    void upsertConnection_returns200() throws Exception {
        when(aggregatorService.upsertConnection(anyString(), any(), any())).thenReturn(new AggregatorConnection());

        mockMvc.perform(put("/api/aggregators/connections")
                .param("storeId", "store-1")
                .param("platform", "MASOVA")
                .param("commissionPercent", "15.0"))
            .andExpect(status().isOk());
    }
}
