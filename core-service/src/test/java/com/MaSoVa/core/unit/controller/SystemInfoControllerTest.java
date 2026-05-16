package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.SystemInfoController;
import com.MaSoVa.shared.service.UpdateService;
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

import java.time.LocalDateTime;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SystemInfoController Unit Tests")
class SystemInfoControllerTest extends BaseServiceTest {

    @Mock private UpdateService updateService;
    @InjectMocks private SystemInfoController systemInfoController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(systemInfoController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("GET /api/system/version returns 200 with version info")
    void getVersion_returns200() throws Exception {
        when(updateService.getCurrentVersion()).thenReturn("1.0.0");
        when(updateService.getBuildDate()).thenReturn(LocalDateTime.of(2026, 5, 15, 0, 0));

        mockMvc.perform(get("/api/system/version"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value("1.0.0"));
    }

    @Test
    @DisplayName("GET /api/system/updates/check returns 200")
    void checkForUpdates_returns200() throws Exception {
        doNothing().when(updateService).manualCheckForUpdates();
        when(updateService.isUpdateAvailable()).thenReturn(false);
        when(updateService.getCurrentVersion()).thenReturn("1.0.0");
        when(updateService.getLatestVersion()).thenReturn("1.0.0");

        mockMvc.perform(get("/api/system/updates/check"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/system/updates/status returns 200 with update availability")
    void getUpdateStatus_returns200() throws Exception {
        when(updateService.getCurrentVersion()).thenReturn("1.0.0");
        when(updateService.getLatestVersion()).thenReturn("1.1.0");
        when(updateService.isUpdateAvailable()).thenReturn(true);
        when(updateService.getUpdateDetails()).thenReturn("Bug fixes");

        mockMvc.perform(get("/api/system/updates/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.updateAvailable").value(true));
    }

    @Test
    @DisplayName("GET /api/system/health returns 200 with UP status")
    void health_returns200() throws Exception {
        when(updateService.getCurrentVersion()).thenReturn("1.0.0");

        mockMvc.perform(get("/api/system/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("GET /api/system/info returns 200 with system info")
    void getSystemInfo_returns200() throws Exception {
        when(updateService.getCurrentVersion()).thenReturn("1.0.0");
        when(updateService.getBuildDate()).thenReturn(LocalDateTime.of(2026, 5, 15, 0, 0));
        when(updateService.isUpdateAvailable()).thenReturn(false);
        when(updateService.getLatestVersion()).thenReturn("1.0.0");

        mockMvc.perform(get("/api/system/info"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.javaVersion").exists());
    }
}
