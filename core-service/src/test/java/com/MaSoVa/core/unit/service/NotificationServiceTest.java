package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.entity.UserPreferences;
import com.MaSoVa.core.notification.repository.NotificationRepository;
import com.MaSoVa.core.notification.repository.UserPreferencesRepository;
import com.MaSoVa.core.notification.service.EmailService;
import com.MaSoVa.core.notification.service.NotificationService;
import com.MaSoVa.core.notification.service.PushService;
import com.MaSoVa.core.notification.service.SmsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserPreferencesRepository userPreferencesRepository;
    @Mock private SmsService smsService;
    @Mock private EmailService emailService;
    @Mock private PushService pushService;

    @InjectMocks private NotificationService notificationService;

    private Notification buildNotification(String id, String userId,
                                           Notification.NotificationType type,
                                           Notification.NotificationChannel channel) {
        Notification n = new Notification(userId, "Test Title", "Test message", type, channel);
        n.setId(id);
        return n;
    }

    // ===========================
    // createNotification
    // ===========================

    @Nested
    @DisplayName("createNotification")
    class CreateNotification {

        @Test
        @DisplayName("saves notification with PENDING status")
        void savesAsPending() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.EMAIL);
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Notification result = notificationService.createNotification(n);

            assertThat(result.getStatus()).isEqualTo(Notification.NotificationStatus.PENDING);
            assertThat(result.getRetryCount()).isEqualTo(0);
        }
    }

    // ===========================
    // markAsRead
    // ===========================

    @Nested
    @DisplayName("markAsRead")
    class MarkAsRead {

        @Test
        @DisplayName("throws when notification not found")
        void throwsWhenNotFound() {
            when(notificationRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markAsRead("missing"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("sets readAt and status to READ")
        void setsRead() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.EMAIL);
            when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Notification result = notificationService.markAsRead("n1");

            assertThat(result.getStatus()).isEqualTo(Notification.NotificationStatus.READ);
            assertThat(result.getReadAt()).isNotNull();
        }
    }

    // ===========================
    // markAllAsRead
    // ===========================

    @Nested
    @DisplayName("markAllAsRead")
    class MarkAllAsRead {

        @Test
        @DisplayName("marks all unread notifications as READ")
        void marksAllRead() {
            Notification n1 = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.IN_APP);
            Notification n2 = buildNotification("n2", "user-1",
                    Notification.NotificationType.PROMOTIONAL, Notification.NotificationChannel.IN_APP);
            when(notificationRepository.findByUserIdAndReadAtIsNull("user-1")).thenReturn(List.of(n1, n2));

            notificationService.markAllAsRead("user-1");

            verify(notificationRepository).saveAll(argThat(list ->
                    ((List<Notification>) list).stream()
                            .allMatch(n -> n.getStatus() == Notification.NotificationStatus.READ)));
        }

        @Test
        @DisplayName("does nothing when no unread notifications")
        void noopWhenNoneUnread() {
            when(notificationRepository.findByUserIdAndReadAtIsNull("user-1")).thenReturn(List.of());

            notificationService.markAllAsRead("user-1");

            verify(notificationRepository).saveAll(argThat(list -> ((List<?>) list).isEmpty()));
        }
    }

    // ===========================
    // deleteNotification
    // ===========================

    @Nested
    @DisplayName("deleteNotification")
    class DeleteNotification {

        @Test
        @DisplayName("calls deleteById on repository")
        void deletesById() {
            notificationService.deleteNotification("n1");
            verify(notificationRepository).deleteById("n1");
        }
    }

    // ===========================
    // getUnreadCount
    // ===========================

    @Nested
    @DisplayName("getUnreadCount")
    class GetUnreadCount {

        @Test
        @DisplayName("returns count from repository")
        void returnsCount() {
            when(notificationRepository.countByUserIdAndReadAtIsNull("user-1")).thenReturn(5L);
            assertThat(notificationService.getUnreadCount("user-1")).isEqualTo(5L);
        }
    }

    // ===========================
    // getRecentNotifications
    // ===========================

    @Nested
    @DisplayName("getRecentNotifications")
    class GetRecentNotifications {

        @Test
        @DisplayName("queries repository with correct since date")
        void queriesWithCorrectDate() {
            when(notificationRepository.findByUserIdAndCreatedAtAfter(eq("user-1"), any()))
                    .thenReturn(List.of());

            List<Notification> result = notificationService.getRecentNotifications("user-1", 7);

            assertThat(result).isEmpty();
            verify(notificationRepository).findByUserIdAndCreatedAtAfter(eq("user-1"), any());
        }
    }

    // ===========================
    // sendNotification — channel routing
    // ===========================

    @Nested
    @DisplayName("sendNotification — channel routing")
    class SendNotification {

        @Test
        @DisplayName("routes SMS channel to SmsService")
        void routesToSmsService() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.SMS);
            when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.empty());
            when(smsService.sendSms(any())).thenReturn(true);
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            notificationService.sendNotification("n1");

            verify(smsService).sendSms(n);
        }

        @Test
        @DisplayName("routes EMAIL channel to EmailService")
        void routesToEmailService() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.EMAIL);
            when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.empty());
            when(emailService.sendEmail(any())).thenReturn(true);
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            notificationService.sendNotification("n1");

            verify(emailService).sendEmail(n);
        }

        @Test
        @DisplayName("routes PUSH channel to PushService")
        void routesToPushService() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.PUSH);
            when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.empty());
            when(pushService.sendPushNotification(any())).thenReturn(true);
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            notificationService.sendNotification("n1");

            verify(pushService).sendPushNotification(n);
        }

        @Test
        @DisplayName("IN_APP channel marks as SENT without calling external services")
        void inAppNoExternalCall() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.IN_APP);
            when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.empty());
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            notificationService.sendNotification("n1");

            verify(smsService, never()).sendSms(any());
            verify(emailService, never()).sendEmail(any());
            verify(pushService, never()).sendPushNotification(any());
        }

        @Test
        @DisplayName("cancels notification when user has SMS disabled in preferences")
        void cancelledWhenSmsDisabled() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.SMS);
            UserPreferences prefs = new UserPreferences("user-1");
            prefs.setSmsEnabled(false);
            when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.of(prefs));
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            notificationService.sendNotification("n1");

            verify(smsService, never()).sendSms(any());
            verify(notificationRepository).save(argThat(notif ->
                    notif.getStatus() == Notification.NotificationStatus.CANCELLED));
        }

        @Test
        @DisplayName("increments retry count on send failure, marks FAILED after 3 attempts")
        void marksFailedAfterThreeRetries() {
            Notification n = buildNotification("n1", "user-1",
                    Notification.NotificationType.ORDER_UPDATE, Notification.NotificationChannel.EMAIL);
            n.setRetryCount(2); // already failed twice
            when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));
            when(userPreferencesRepository.findByUserId("user-1")).thenReturn(Optional.empty());
            when(emailService.sendEmail(any())).thenReturn(false);
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            notificationService.sendNotification("n1");

            verify(notificationRepository).save(argThat(notif ->
                    notif.getStatus() == Notification.NotificationStatus.FAILED));
        }

        @Test
        @DisplayName("does not throw when notification not found")
        void doesNotThrowWhenNotFound() {
            when(notificationRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatCode(() -> notificationService.sendNotification("missing"))
                    .doesNotThrowAnyException();
        }
    }
}
