package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.notification.controller.CampaignController;
import com.MaSoVa.core.notification.entity.Campaign;
import com.MaSoVa.core.notification.service.CampaignService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CampaignController Unit Tests")
class CampaignControllerTest extends BaseServiceTest {

    @Mock private CampaignService campaignService;
    @InjectMocks private CampaignController campaignController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(campaignController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Campaign buildCampaign(String id) {
        Campaign c = new Campaign();
        c.setId(id);
        c.setName("Test Campaign");
        return c;
    }

    @Test
    @DisplayName("GET /api/campaigns returns 200 with campaign list")
    void getCampaigns_returns200() throws Exception {
        when(campaignService.getAllCampaigns(any())).thenReturn(new PageImpl<>(new ArrayList<>(List.of(buildCampaign("camp-1"))), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/campaigns"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/campaigns returns 200 with created campaign")
    void createCampaign_returns200() throws Exception {
        when(campaignService.createCampaign(any())).thenReturn(buildCampaign("camp-new"));

        mockMvc.perform(post("/api/campaigns")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Summer Promo\",\"type\":\"SMS\",\"message\":\"Hi!\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/campaigns/{id} returns 200 when found")
    void getCampaign_returns200() throws Exception {
        when(campaignService.getCampaignById("camp-1")).thenReturn(Optional.of(buildCampaign("camp-1")));

        mockMvc.perform(get("/api/campaigns/camp-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/campaigns/{id}/execute returns 200")
    void executeCampaign_returns200() throws Exception {
        doNothing().when(campaignService).executeCampaign("camp-1");

        mockMvc.perform(post("/api/campaigns/camp-1/execute"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/campaigns/{id}/cancel returns 200")
    void cancelCampaign_returns200() throws Exception {
        doNothing().when(campaignService).cancelCampaign("camp-1");

        mockMvc.perform(post("/api/campaigns/camp-1/cancel"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/campaigns/{id} returns 200")
    void deleteCampaign_returns200() throws Exception {
        doNothing().when(campaignService).deleteCampaign("camp-1");

        mockMvc.perform(delete("/api/campaigns/camp-1"))
            .andExpect(status().isOk());
    }
}
