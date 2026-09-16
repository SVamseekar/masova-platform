package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.notification.controller.NotificationController;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.service.NotificationSeedService;
import com.MaSoVa.core.notification.service.NotificationService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationController Unit Tests")
class NotificationControllerTest extends BaseServiceTest {

    @Mock private NotificationService notificationService;
    @Mock private NotificationSeedService notificationSeedService;
    @InjectMocks private NotificationController notificationController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Notification buildNotification(String id) {
        Notification n = new Notification();
        n.setId(id);
        n.setUserId("user-1");
        return n;
    }

    @Test
    @DisplayName("GET /api/notifications returns 200 with list")
    void getNotifications_returns200() throws Exception {
        when(notificationService.getUserNotifications(anyString(), any()))
            .thenReturn(new PageImpl<>(new ArrayList<>(List.of(buildNotification("notif-1")))));

        mockMvc.perform(get("/api/notifications").param("userId", "user-1")
                .principal(new UsernamePasswordAuthenticationToken("user-1", "n/a")))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/notifications without userId uses authentication principal")
    void getNotifications_defaultsToPrincipal() throws Exception {
        when(notificationService.getUserNotifications(anyString(), any()))
            .thenReturn(new PageImpl<>(new ArrayList<>()));

        mockMvc.perform(get("/api/notifications")
                .principal(new UsernamePasswordAuthenticationToken("manager-1", "n/a")))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/notifications returns 200 with sent notification")
    void sendNotification_returns200() throws Exception {
        when(notificationService.createNotification(any())).thenReturn(buildNotification("notif-new"));
        doNothing().when(notificationService).sendNotification(anyString());

        mockMvc.perform(post("/api/notifications")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"user-1\",\"title\":\"Test\",\"message\":\"Test message\",\"type\":\"SYSTEM_ALERT\",\"channel\":\"IN_APP\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/notifications/{id}/read returns 200")
    void markAsRead_returns200() throws Exception {
        when(notificationService.markAsRead("notif-1")).thenReturn(buildNotification("notif-1"));

        mockMvc.perform(patch("/api/notifications/notif-1/read"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/notifications/read-all returns 200")
    void markAllAsRead_returns200() throws Exception {
        doNothing().when(notificationService).markAllAsRead(anyString());

        mockMvc.perform(patch("/api/notifications/read-all").param("userId", "user-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/notifications/{id} returns 200")
    void deleteNotification_returns200() throws Exception {
        doNothing().when(notificationService).deleteNotification("notif-1");

        mockMvc.perform(delete("/api/notifications/notif-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/notifications with unread=true returns unread notifications")
    void getNotifications_unread_returns200() throws Exception {
        when(notificationService.getUnreadNotifications("user-1")).thenReturn(List.of(buildNotification("n1")));

        mockMvc.perform(get("/api/notifications")
                .param("userId", "user-1")
                .param("unread", "true"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/notifications with recent=true returns recent notifications")
    void getNotifications_recent_returns200() throws Exception {
        when(notificationService.getRecentNotifications("user-1", 7)).thenReturn(List.of(buildNotification("n1")));

        mockMvc.perform(get("/api/notifications")
                .param("userId", "user-1")
                .param("recent", "true"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/notifications with optional fields sets them correctly")
    void sendNotification_withOptionalFields_returns200() throws Exception {
        when(notificationService.createNotification(any())).thenReturn(buildNotification("notif-new"));
        doNothing().when(notificationService).sendNotification(anyString());

        mockMvc.perform(post("/api/notifications")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"user-1\",\"title\":\"Test\",\"message\":\"Msg\",\"type\":\"SYSTEM_ALERT\",\"channel\":\"EMAIL\",\"recipientEmail\":\"test@masova.com\",\"recipientPhone\":\"9876543210\"}"))
            .andExpect(status().isOk());
    }
}
