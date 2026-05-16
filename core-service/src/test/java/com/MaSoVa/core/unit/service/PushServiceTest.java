package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.config.FirebaseConfig;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.service.PushService;
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
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PushService Unit Tests")
class PushServiceTest {

    @Mock private FirebaseConfig firebaseConfig;

    @InjectMocks private PushService pushService;

    private Notification buildNotification(String deviceToken) {
        Notification n = new Notification("user-1", "Test Title", "Test message",
                Notification.NotificationType.ORDER_STATUS_UPDATE, Notification.NotificationChannel.PUSH);
        n.setRecipientDeviceToken(deviceToken);
        return n;
    }

    @Nested
    @DisplayName("sendPushNotification")
    class SendPushNotification {

        @Test
        @DisplayName("returns true when Firebase is disabled")
        void returnsTrueWhenDisabled() {
            when(firebaseConfig.isEnabled()).thenReturn(false);

            boolean result = pushService.sendPushNotification(buildNotification("some-token"));

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns false when device token is null and Firebase is enabled")
        void returnsFalseWhenTokenNull() {
            when(firebaseConfig.isEnabled()).thenReturn(true);

            boolean result = pushService.sendPushNotification(buildNotification(null));

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when device token is empty and Firebase is enabled")
        void returnsFalseWhenTokenEmpty() {
            when(firebaseConfig.isEnabled()).thenReturn(true);

            boolean result = pushService.sendPushNotification(buildNotification(""));

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("sendBulkPushNotification")
    class SendBulkPushNotification {

        @Test
        @DisplayName("returns true when Firebase is disabled")
        void returnsTrueWhenDisabled() {
            when(firebaseConfig.isEnabled()).thenReturn(false);

            boolean result = pushService.sendBulkPushNotification(
                    List.of("token-1", "token-2"), "Title", "Body");

            assertThat(result).isTrue();
        }
    }

    @Nested
    @DisplayName("sendPushWithData")
    class SendPushWithData {

        @Test
        @DisplayName("returns true when Firebase is disabled")
        void returnsTrueWhenDisabled() {
            when(firebaseConfig.isEnabled()).thenReturn(false);

            boolean result = pushService.sendPushWithData("device-token", "Title", "Body",
                    Map.of("key", "value"));

            assertThat(result).isTrue();
        }
    }
}
