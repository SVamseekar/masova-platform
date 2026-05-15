package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.WorkingSessionController;
import com.MaSoVa.core.user.dto.WorkingSessionResponse;
import com.MaSoVa.core.user.service.WorkingSessionService;
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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkingSessionController Unit Tests")
class WorkingSessionControllerTest extends BaseServiceTest {

    @Mock private WorkingSessionService sessionService;
    @InjectMocks private WorkingSessionController sessionController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(sessionController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("GET /api/sessions/pending returns 200 with list")
    void getPendingSessions_returns200() throws Exception {
        mockMvc.perform(get("/api/sessions/pending"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("POST /api/sessions/{sessionId}/approve returns 200")
    void approveSession_returns200() throws Exception {
        doNothing().when(sessionService).approveSession(anyString(), anyString());

        mockMvc.perform(post("/api/sessions/session-1/approve")
                .header("X-User-Id", "manager-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Session approved successfully"));
    }

    @Test
    @DisplayName("POST /api/sessions/{sessionId}/reject returns 200")
    void rejectSession_returns200() throws Exception {
        doNothing().when(sessionService).rejectSession(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/sessions/session-1/reject")
                .header("X-User-Id", "manager-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Not authorized\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Session rejected"));
    }
}
