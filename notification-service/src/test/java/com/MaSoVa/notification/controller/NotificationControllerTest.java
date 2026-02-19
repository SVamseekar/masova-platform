package com.MaSoVa.notification.controller;

import com.MaSoVa.notification.entity.Notification;
import com.MaSoVa.notification.entity.Notification.NotificationChannel;
import com.MaSoVa.notification.entity.Notification.NotificationStatus;
import com.MaSoVa.notification.entity.Notification.NotificationType;
import com.MaSoVa.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("NotificationController")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testNotification = new Notification(
                "user-123",
                "Order Confirmed",
                "Your order has been confirmed",
                NotificationType.ORDER_CONFIRMED,
                NotificationChannel.EMAIL
        );
        testNotification.setId("notif-001");
        testNotification.setStatus(NotificationStatus.PENDING);
    }

    @Nested
    @DisplayName("POST /api/notifications/send")
    class SendNotification {

        @Test
        @DisplayName("Given a valid notification request, when sending, then returns 200 with created notification")
        void shouldReturnCreatedNotification() throws Exception {
            // Given
            when(notificationService.createNotification(any(Notification.class))).thenReturn(testNotification);

            Map<String, Object> request = Map.of(
                    "userId", "user-123",
                    "title", "Order Confirmed",
                    "message", "Your order has been confirmed",
                    "type", "ORDER_CONFIRMED",
                    "channel", "EMAIL"
            );

            // When / Then
            mockMvc.perform(post("/api/notifications/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value("notif-001"))
                    .andExpect(jsonPath("$.userId").value("user-123"))
                    .andExpect(jsonPath("$.title").value("Order Confirmed"));

            verify(notificationService).createNotification(any(Notification.class));
            verify(notificationService).sendNotification("notif-001");
        }

        @Test
        @DisplayName("Given request with optional fields, when sending, then sets priority and recipient info")
        void shouldSetOptionalFields() throws Exception {
            // Given
            when(notificationService.createNotification(any(Notification.class))).thenReturn(testNotification);

            Map<String, Object> request = Map.of(
                    "userId", "user-123",
                    "title", "Order Confirmed",
                    "message", "Your order has been confirmed",
                    "type", "ORDER_CONFIRMED",
                    "channel", "EMAIL",
                    "priority", "HIGH",
                    "recipientEmail", "user@example.com",
                    "recipientPhone", "+1234567890",
                    "recipientDeviceToken", "device-token"
            );

            // When / Then
            mockMvc.perform(post("/api/notifications/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(notificationService).createNotification(any(Notification.class));
        }
    }

    @Nested
    @DisplayName("GET /api/notifications/user/{userId}")
    class GetUserNotifications {

        @Test
        @DisplayName("Given a user with notifications, when fetching paginated, then returns page of notifications")
        void shouldReturnPaginatedNotifications() throws Exception {
            // Given
            var page = new PageImpl<>(List.of(testNotification), PageRequest.of(0, 20), 1);
            when(notificationService.getUserNotifications(eq("user-123"), any())).thenReturn(page);

            // When / Then
            mockMvc.perform(get("/api/notifications/user/user-123")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].id").value("notif-001"));
        }

        @Test
        @DisplayName("Given default page params, when fetching, then uses page=0 size=20")
        void shouldUseDefaultPageParams() throws Exception {
            // Given
            var page = new PageImpl<com.MaSoVa.notification.entity.Notification>(List.of(), PageRequest.of(0, 20), 0);
            when(notificationService.getUserNotifications(eq("user-123"), any())).thenReturn(page);

            // When / Then
            mockMvc.perform(get("/api/notifications/user/user-123"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/notifications/user/{userId}/unread")
    class GetUnreadNotifications {

        @Test
        @DisplayName("Given a user with unread notifications, when fetching, then returns list")
        void shouldReturnUnreadNotifications() throws Exception {
            // Given
            when(notificationService.getUnreadNotifications("user-123")).thenReturn(List.of(testNotification));

            // When / Then
            mockMvc.perform(get("/api/notifications/user/user-123/unread"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id").value("notif-001"));
        }
    }

    @Nested
    @DisplayName("GET /api/notifications/user/{userId}/unread-count")
    class GetUnreadCount {

        @Test
        @DisplayName("Given a user with 5 unread notifications, when getting count, then returns 5")
        void shouldReturnUnreadCount() throws Exception {
            // Given
            when(notificationService.getUnreadCount("user-123")).thenReturn(5L);

            // When / Then
            mockMvc.perform(get("/api/notifications/user/user-123/unread-count"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("5"));
        }
    }

    @Nested
    @DisplayName("PATCH /api/notifications/{id}/read")
    class MarkAsRead {

        @Test
        @DisplayName("Given an existing notification, when marking as read, then returns updated notification")
        void shouldReturnUpdatedNotification() throws Exception {
            // Given
            testNotification.setStatus(NotificationStatus.READ);
            testNotification.setReadAt(LocalDateTime.now());
            when(notificationService.markAsRead("notif-001")).thenReturn(testNotification);

            // When / Then
            mockMvc.perform(patch("/api/notifications/notif-001/read"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("READ"));
        }
    }

    @Nested
    @DisplayName("PATCH /api/notifications/user/{userId}/read-all")
    class MarkAllAsRead {

        @Test
        @DisplayName("Given a user ID, when marking all as read, then returns 200 OK")
        void shouldReturn200() throws Exception {
            // When / Then
            mockMvc.perform(patch("/api/notifications/user/user-123/read-all"))
                    .andExpect(status().isOk());

            verify(notificationService).markAllAsRead("user-123");
        }
    }

    @Nested
    @DisplayName("DELETE /api/notifications/{id}")
    class DeleteNotification {

        @Test
        @DisplayName("Given a notification ID, when deleting, then returns 200 OK")
        void shouldReturn200() throws Exception {
            // When / Then
            mockMvc.perform(delete("/api/notifications/notif-001"))
                    .andExpect(status().isOk());

            verify(notificationService).deleteNotification("notif-001");
        }
    }

    @Nested
    @DisplayName("GET /api/notifications/user/{userId}/recent")
    class GetRecentNotifications {

        @Test
        @DisplayName("Given a user ID and days param, when fetching recent, then returns notifications")
        void shouldReturnRecentNotifications() throws Exception {
            // Given
            when(notificationService.getRecentNotifications("user-123", 7)).thenReturn(List.of(testNotification));

            // When / Then
            mockMvc.perform(get("/api/notifications/user/user-123/recent")
                            .param("days", "7"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }

        @Test
        @DisplayName("Given no days param, when fetching recent, then defaults to 7 days")
        void shouldDefaultToSevenDays() throws Exception {
            // Given
            when(notificationService.getRecentNotifications("user-123", 7)).thenReturn(List.of());

            // When / Then
            mockMvc.perform(get("/api/notifications/user/user-123/recent"))
                    .andExpect(status().isOk());

            verify(notificationService).getRecentNotifications("user-123", 7);
        }
    }
}
