package com.MaSoVa.notification.controller;

import com.MaSoVa.notification.entity.UserPreferences;
import com.MaSoVa.notification.service.UserPreferencesService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserPreferencesController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("UserPreferencesController")
class UserPreferencesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserPreferencesService userPreferencesService;

    private UserPreferences testPreferences;

    @BeforeEach
    void setUp() {
        testPreferences = new UserPreferences("user-123");
        testPreferences.setId("pref-001");
        testPreferences.setEmail("user@example.com");
        testPreferences.setPhone("+1234567890");
    }

    @Nested
    @DisplayName("GET /api/preferences/user/{userId}")
    class GetPreferences {

        @Test
        @DisplayName("Given a user ID, when getting preferences, then returns 200 with preferences")
        void shouldReturnPreferences() throws Exception {
            // Given
            when(userPreferencesService.getOrCreatePreferences("user-123")).thenReturn(testPreferences);

            // When / Then
            mockMvc.perform(get("/api/preferences/user/user-123"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId", is("user-123")))
                    .andExpect(jsonPath("$.email", is("user@example.com")))
                    .andExpect(jsonPath("$.smsEnabled", is(true)))
                    .andExpect(jsonPath("$.emailEnabled", is(true)));
        }
    }

    @Nested
    @DisplayName("PUT /api/preferences/user/{userId}")
    class UpdatePreferences {

        @Test
        @DisplayName("Given updated preferences, when updating, then returns 200 with updated preferences")
        void shouldReturnUpdatedPreferences() throws Exception {
            // Given
            testPreferences.setSmsEnabled(false);
            when(userPreferencesService.updatePreferences(eq("user-123"), any(UserPreferences.class)))
                    .thenReturn(testPreferences);

            Map<String, Object> request = Map.of(
                    "email", "updated@example.com",
                    "smsEnabled", false,
                    "emailEnabled", true
            );

            // When / Then
            mockMvc.perform(put("/api/preferences/user/user-123")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.smsEnabled", is(false)));
        }
    }

    @Nested
    @DisplayName("PATCH /api/preferences/user/{userId}/channel/{channel}")
    class UpdateChannelPreference {

        @Test
        @DisplayName("Given SMS channel and enabled=false, when updating, then returns 200 with updated preferences")
        void shouldUpdateChannelPreference() throws Exception {
            // Given
            testPreferences.setSmsEnabled(false);
            when(userPreferencesService.updateChannelPreference("user-123", "SMS", false))
                    .thenReturn(testPreferences);

            // When / Then
            mockMvc.perform(patch("/api/preferences/user/user-123/channel/SMS")
                            .param("enabled", "false"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.smsEnabled", is(false)));
        }
    }

    @Nested
    @DisplayName("PATCH /api/preferences/user/{userId}/device-token")
    class UpdateDeviceToken {

        @Test
        @DisplayName("Given a new device token, when updating, then returns 200 with updated preferences")
        void shouldUpdateDeviceToken() throws Exception {
            // Given
            testPreferences.setDeviceToken("new-device-token");
            when(userPreferencesService.updateDeviceToken("user-123", "new-device-token"))
                    .thenReturn(testPreferences);

            Map<String, String> request = Map.of("deviceToken", "new-device-token");

            // When / Then
            mockMvc.perform(patch("/api/preferences/user/user-123/device-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.deviceToken", is("new-device-token")));
        }
    }

    @Nested
    @DisplayName("PATCH /api/preferences/user/{userId}/contact")
    class UpdateContactInfo {

        @Test
        @DisplayName("Given new email and phone, when updating, then returns 200 with updated preferences")
        void shouldUpdateContactInfo() throws Exception {
            // Given
            testPreferences.setEmail("new@example.com");
            testPreferences.setPhone("+9876543210");
            when(userPreferencesService.updateContactInfo("user-123", "new@example.com", "+9876543210"))
                    .thenReturn(testPreferences);

            Map<String, String> request = Map.of(
                    "email", "new@example.com",
                    "phone", "+9876543210"
            );

            // When / Then
            mockMvc.perform(patch("/api/preferences/user/user-123/contact")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email", is("new@example.com")))
                    .andExpect(jsonPath("$.phone", is("+9876543210")));
        }
    }

    @Nested
    @DisplayName("DELETE /api/preferences/user/{userId}")
    class DeletePreferences {

        @Test
        @DisplayName("Given a user ID, when deleting preferences, then returns 200 OK")
        void shouldReturn200() throws Exception {
            // When / Then
            mockMvc.perform(delete("/api/preferences/user/user-123"))
                    .andExpect(status().isOk());

            verify(userPreferencesService).deletePreferences("user-123");
        }
    }
}
