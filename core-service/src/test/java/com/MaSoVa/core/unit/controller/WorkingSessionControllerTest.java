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

import com.MaSoVa.core.user.dto.WorkingHoursReport;
import com.MaSoVa.shared.entity.WorkingSession;
import com.MaSoVa.shared.enums.WorkingSessionStatus;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
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

    @Test
    @DisplayName("POST /api/sessions — starts session with storeId header")
    void startSession_returnsOk() throws Exception {
        WorkingSession session = new WorkingSession();
        session.setStatus(WorkingSessionStatus.COMPLETED);
        when(sessionService.startSession(anyString(), anyString())).thenReturn(session);

        mockMvc.perform(post("/api/sessions")
                .header("X-User-Id", "emp-1")
                .header("X-Store-Id", "store-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/sessions — returns 400 when no storeId")
    void startSession_returns400WhenNoStore() throws Exception {
        mockMvc.perform(post("/api/sessions")
                .header("X-User-Id", "emp-1"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/sessions/end — ends session")
    void endSession_returnsOk() throws Exception {
        WorkingSession session = new WorkingSession();
        session.setStatus(WorkingSessionStatus.COMPLETED);
        when(sessionService.endSession(anyString())).thenReturn(session);

        mockMvc.perform(post("/api/sessions/end")
                .header("X-User-Id", "emp-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/sessions/clock-in — returns 400 when no storeId")
    void clockIn_returns400WhenNoStore() throws Exception {
        mockMvc.perform(post("/api/sessions/clock-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"employeeId\":\"emp-1\",\"pin\":\"12345\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/sessions/clock-in — returns 400 when employeeId or pin missing")
    void clockIn_returns400WhenMissingFields() throws Exception {
        mockMvc.perform(post("/api/sessions/clock-in")
                .header("X-Store-Id", "store-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/sessions/clock-out — returns 400 when employeeId missing")
    void clockOut_returns400WhenMissing() throws Exception {
        mockMvc.perform(post("/api/sessions/clock-out")
                .header("X-User-Id", "manager-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/sessions/clock-out — returns 200 with employee clocked out")
    void clockOut_returnsOk() throws Exception {
        WorkingSession session = new WorkingSession();
        session.setStatus(WorkingSessionStatus.COMPLETED);
        when(sessionService.endSession("emp-1")).thenReturn(session);

        mockMvc.perform(post("/api/sessions/clock-out")
                .header("X-User-Id", "manager-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"employeeId\":\"emp-1\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/sessions — returns 400 when no storeId or employeeId")
    void getSessions_returns400WhenNoFilter() throws Exception {
        mockMvc.perform(get("/api/sessions"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/sessions — returns sessions for employeeId")
    void getSessions_byEmployee() throws Exception {
        when(sessionService.getEmployeeSessions(anyString(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/sessions")
                .param("employeeId", "emp-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/sessions — returns active sessions for store")
    void getSessions_activeSessions() throws Exception {
        when(sessionService.getActiveSessionsForStore("store-1")).thenReturn(List.of());

        mockMvc.perform(get("/api/sessions")
                .param("storeId", "store-1")
                .param("active", "true"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/sessions — returns store sessions")
    void getSessions_byStore() throws Exception {
        when(sessionService.getStoreSessions(anyString(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/sessions")
                .param("storeId", "store-1"))
            .andExpect(status().isOk());
    }
}
