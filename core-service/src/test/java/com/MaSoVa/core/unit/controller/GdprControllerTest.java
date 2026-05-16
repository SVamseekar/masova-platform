package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.user.controller.GdprController;
import com.MaSoVa.core.user.repository.GdprAuditLogRepository;
import com.MaSoVa.core.user.service.GdprConsentService;
import com.MaSoVa.core.user.service.GdprDataRequestService;
import com.MaSoVa.shared.entity.GdprConsent;
import com.MaSoVa.shared.entity.GdprDataRequest;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GdprController Unit Tests")
class GdprControllerTest extends BaseServiceTest {

    @Mock private GdprConsentService consentService;
    @Mock private GdprDataRequestService dataRequestService;
    @Mock private GdprAuditLogRepository auditLogRepository;

    @InjectMocks private GdprController gdprController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(gdprController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("GET /api/gdpr/consent returns 200 with user consents")
    void getConsents_returns200() throws Exception {
        when(consentService.getUserConsents("user-1")).thenReturn(List.of(new GdprConsent()));

        mockMvc.perform(get("/api/gdpr/consent").param("userId", "user-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/gdpr/request returns 200 with user requests")
    void getUserRequests_returns200() throws Exception {
        when(dataRequestService.getUserRequests("user-1")).thenReturn(List.of(new GdprDataRequest()));

        mockMvc.perform(get("/api/gdpr/request").param("userId", "user-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/gdpr/audit/{userId} returns 200 with audit log")
    void getAuditLog_returns200() throws Exception {
        when(auditLogRepository.findByUserId(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/gdpr/audit/user-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/gdpr/consent returns 200 when consent granted")
    void grantConsent_returns200() throws Exception {
        when(consentService.grantConsent(any(), any(), any(), any(), any(), any()))
                .thenReturn(new GdprConsent());

        mockMvc.perform(post("/api/gdpr/consent")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"user-1\",\"consentType\":\"TERMS_AND_CONDITIONS\",\"version\":\"v1\",\"confirmationText\":\"I agree\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/gdpr/consent returns 200 when consent revoked")
    void revokeConsent_returns200() throws Exception {
        when(consentService.revokeConsent(any(), any(), any(), any()))
                .thenReturn(new GdprConsent());

        mockMvc.perform(delete("/api/gdpr/consent")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"user-1\",\"consentType\":\"TERMS_AND_CONDITIONS\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/gdpr/request returns 201 on request creation")
    void createRequest_returns201() throws Exception {
        when(dataRequestService.createDataRequest(any(), any(), any(), any(), any()))
                .thenReturn(new GdprDataRequest());

        mockMvc.perform(post("/api/gdpr/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"user-1\",\"requestType\":\"ACCESS\",\"description\":\"Please provide my data\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/gdpr/export/{userId} returns 200 with export")
    void exportData_returns200() throws Exception {
        when(dataRequestService.exportAllCustomerData(anyString(), any()))
                .thenReturn(new com.MaSoVa.core.user.dto.GdprExportPackage("user-1"));

        mockMvc.perform(get("/api/gdpr/export/user-1"))
            .andExpect(status().isOk());
    }
}
