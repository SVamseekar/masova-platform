package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.notification.controller.UserPreferencesController;
import com.MaSoVa.core.notification.entity.UserPreferences;
import com.MaSoVa.core.notification.service.UserPreferencesService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserPreferencesController Unit Tests")
class UserPreferencesControllerTest extends BaseServiceTest {

    @Mock private UserPreferencesService userPreferencesService;
    @InjectMocks private UserPreferencesController preferencesController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(preferencesController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private UserPreferences buildPreferences(String userId) {
        UserPreferences p = new UserPreferences();
        p.setUserId(userId);
        return p;
    }

    @Test
    @DisplayName("GET /api/preferences/{userId} returns 200 with preferences")
    void getPreferences_returns200() throws Exception {
        when(userPreferencesService.getOrCreatePreferences("user-1")).thenReturn(buildPreferences("user-1"));

        mockMvc.perform(get("/api/preferences/user-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value("user-1"));
    }

    @Test
    @DisplayName("PATCH /api/preferences/{userId} returns 200")
    void updatePreferences_returns200() throws Exception {
        when(userPreferencesService.updatePreferences(anyString(), any()))
            .thenReturn(buildPreferences("user-1"));

        mockMvc.perform(patch("/api/preferences/user-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"emailEnabled\":false}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/preferences/{userId} returns 200")
    void deletePreferences_returns200() throws Exception {
        doNothing().when(userPreferencesService).deletePreferences("user-1");

        mockMvc.perform(delete("/api/preferences/user-1"))
            .andExpect(status().isOk());
    }
}
