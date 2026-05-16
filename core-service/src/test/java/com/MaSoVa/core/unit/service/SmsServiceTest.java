package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.config.TwilioConfig;
import com.MaSoVa.core.notification.entity.Notification;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SmsService Unit Tests")
class SmsServiceTest {

    @Mock private TwilioConfig twilioConfig;

    @InjectMocks private SmsService smsService;

    private Notification buildNotification(String recipientPhone) {
        Notification n = new Notification("user-1", "Test Title", "Test message",
                Notification.NotificationType.ORDER_STATUS_UPDATE, Notification.NotificationChannel.SMS);
        n.setRecipientPhone(recipientPhone);
        return n;
    }

    @Nested
    @DisplayName("sendSms")
    class SendSms {

        @Test
        @DisplayName("returns true when Twilio is disabled")
        void returnsTrueWhenDisabled() {
            when(twilioConfig.isEnabled()).thenReturn(false);

            boolean result = smsService.sendSms(buildNotification("+911234567890"));

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns false when recipient phone is null and Twilio is enabled")
        void returnsFalseWhenPhoneNull() {
            when(twilioConfig.isEnabled()).thenReturn(true);
            when(twilioConfig.getPhoneNumber()).thenReturn("+15555555555");

            boolean result = smsService.sendSms(buildNotification(null));

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when recipient phone is empty and Twilio is enabled")
        void returnsFalseWhenPhoneEmpty() {
            when(twilioConfig.isEnabled()).thenReturn(true);
            when(twilioConfig.getPhoneNumber()).thenReturn("+15555555555");

            boolean result = smsService.sendSms(buildNotification(""));

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("sendBulkSms")
    class SendBulkSms {

        @Test
        @DisplayName("returns true when Twilio is disabled")
        void returnsTrueWhenDisabled() {
            when(twilioConfig.isEnabled()).thenReturn(false);

            boolean result = smsService.sendBulkSms(new String[]{"+911234567890"}, "Hello");

            assertThat(result).isTrue();
        }
    }
}
