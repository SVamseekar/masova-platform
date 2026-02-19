package com.MaSoVa.notification.controller;

import com.MaSoVa.notification.entity.Campaign;
import com.MaSoVa.notification.entity.Campaign.CampaignStatus;
import com.MaSoVa.notification.entity.Notification.NotificationChannel;
import com.MaSoVa.notification.service.CampaignService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CampaignController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CampaignController")
class CampaignControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CampaignService campaignService;

    private Campaign testCampaign;

    @BeforeEach
    void setUp() {
        testCampaign = new Campaign();
        testCampaign.setId("camp-001");
        testCampaign.setName("Summer Promotion");
        testCampaign.setDescription("Summer deals");
        testCampaign.setSubject("Summer Sale!");
        testCampaign.setMessage("Get 20% off!");
        testCampaign.setChannel(NotificationChannel.EMAIL);
        testCampaign.setStatus(CampaignStatus.DRAFT);
    }

    @Nested
    @DisplayName("POST /api/campaigns")
    class CreateCampaign {

        @Test
        @DisplayName("Given a valid campaign, when creating, then returns 200 with created campaign")
        void shouldReturnCreatedCampaign() throws Exception {
            // Given
            when(campaignService.createCampaign(any(Campaign.class))).thenReturn(testCampaign);

            Map<String, Object> request = Map.of(
                    "name", "Summer Promotion",
                    "description", "Summer deals",
                    "subject", "Summer Sale!",
                    "message", "Get 20% off!",
                    "channel", "EMAIL"
            );

            // When / Then
            mockMvc.perform(post("/api/campaigns")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value("camp-001"))
                    .andExpect(jsonPath("$.name").value("Summer Promotion"))
                    .andExpect(jsonPath("$.status").value("DRAFT"));
        }
    }

    @Nested
    @DisplayName("PUT /api/campaigns/{id}")
    class UpdateCampaign {

        @Test
        @DisplayName("Given an existing campaign, when updating, then returns 200 with updated campaign")
        void shouldReturnUpdatedCampaign() throws Exception {
            // Given
            testCampaign.setName("Updated Name");
            when(campaignService.updateCampaign(eq("camp-001"), any(Campaign.class))).thenReturn(testCampaign);

            Map<String, Object> request = Map.of(
                    "name", "Updated Name",
                    "description", "Updated description",
                    "channel", "SMS"
            );

            // When / Then
            mockMvc.perform(put("/api/campaigns/camp-001")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Name"));
        }
    }

    @Nested
    @DisplayName("POST /api/campaigns/{id}/schedule")
    class ScheduleCampaign {

        @Test
        @DisplayName("Given a campaign ID and schedule time, when scheduling, then returns 200 OK")
        void shouldReturn200() throws Exception {
            // Given
            Map<String, String> request = Map.of(
                    "scheduledFor", "2026-03-15T10:00:00"
            );

            // When / Then
            mockMvc.perform(post("/api/campaigns/camp-001/schedule")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(campaignService).scheduleCampaign(eq("camp-001"), any(LocalDateTime.class));
        }
    }

    @Nested
    @DisplayName("POST /api/campaigns/{id}/execute")
    class ExecuteCampaign {

        @Test
        @DisplayName("Given a campaign ID, when executing, then returns 200 OK")
        void shouldReturn200() throws Exception {
            // When / Then
            mockMvc.perform(post("/api/campaigns/camp-001/execute"))
                    .andExpect(status().isOk());

            verify(campaignService).executeCampaign("camp-001");
        }
    }

    @Nested
    @DisplayName("POST /api/campaigns/{id}/cancel")
    class CancelCampaign {

        @Test
        @DisplayName("Given a campaign ID, when cancelling, then returns 200 OK")
        void shouldReturn200() throws Exception {
            // When / Then
            mockMvc.perform(post("/api/campaigns/camp-001/cancel"))
                    .andExpect(status().isOk());

            verify(campaignService).cancelCampaign("camp-001");
        }
    }

    @Nested
    @DisplayName("GET /api/campaigns")
    class GetAllCampaigns {

        @Test
        @DisplayName("Given campaigns exist, when fetching all, then returns paginated results")
        void shouldReturnPaginatedCampaigns() throws Exception {
            // Given
            var page = new PageImpl<>(List.of(testCampaign), PageRequest.of(0, 20), 1);
            when(campaignService.getAllCampaigns(any())).thenReturn(page);

            // When / Then
            mockMvc.perform(get("/api/campaigns")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].id").value("camp-001"));
        }
    }

    @Nested
    @DisplayName("GET /api/campaigns/{id}")
    class GetCampaign {

        @Test
        @DisplayName("Given an existing campaign, when getting by ID, then returns 200 with campaign")
        void shouldReturnCampaign() throws Exception {
            // Given
            when(campaignService.getCampaignById("camp-001")).thenReturn(Optional.of(testCampaign));

            // When / Then
            mockMvc.perform(get("/api/campaigns/camp-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value("camp-001"))
                    .andExpect(jsonPath("$.name").value("Summer Promotion"));
        }

        @Test
        @DisplayName("Given a non-existent campaign, when getting by ID, then returns 404")
        void shouldReturn404WhenNotFound() throws Exception {
            // Given
            when(campaignService.getCampaignById("missing")).thenReturn(Optional.empty());

            // When / Then
            mockMvc.perform(get("/api/campaigns/missing"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/campaigns/{id}")
    class DeleteCampaign {

        @Test
        @DisplayName("Given a campaign ID, when deleting, then returns 200 OK")
        void shouldReturn200() throws Exception {
            // When / Then
            mockMvc.perform(delete("/api/campaigns/camp-001"))
                    .andExpect(status().isOk());

            verify(campaignService).deleteCampaign("camp-001");
        }
    }
}
