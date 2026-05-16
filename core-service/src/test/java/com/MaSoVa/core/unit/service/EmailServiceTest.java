package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.config.BrevoConfig;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("EmailService Unit Tests")
class EmailServiceTest {

    @Mock private BrevoConfig brevoConfig;
    @Mock private ObjectMapper objectMapper;
    @Mock private RedisTemplate<String, String> redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    @InjectMocks private EmailService emailService;

    private Notification buildNotification(String recipientEmail) {
        Notification n = new Notification("user-1", "Subject", "Body",
                Notification.NotificationType.ORDER_STATUS_UPDATE, Notification.NotificationChannel.EMAIL);
        n.setRecipientEmail(recipientEmail);
        return n;
    }

    @Nested
    @DisplayName("sendEmail(Notification)")
    class SendEmailNotification {

        @Test
        @DisplayName("returns true immediately when Brevo is disabled")
        void returnsTrueWhenDisabled() {
            when(brevoConfig.isEnabled()).thenReturn(false);

            boolean result = emailService.sendEmail(buildNotification("test@example.com"));

            assertThat(result).isTrue();
            verifyNoInteractions(redisTemplate);
        }

        @Test
        @DisplayName("returns false when recipient email is missing")
        void returnsFalseWhenNoEmail() {
            when(brevoConfig.isEnabled()).thenReturn(true);
            when(redisTemplate.opsForValue()).thenReturn(valueOps);
            when(valueOps.get(anyString())).thenReturn("0");
            when(brevoConfig.getDailyLimit()).thenReturn(300);

            boolean result = emailService.sendEmail(buildNotification(null));

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when rate limit is reached")
        void returnsFalseWhenRateLimited() {
            when(brevoConfig.isEnabled()).thenReturn(true);
            when(redisTemplate.opsForValue()).thenReturn(valueOps);
            when(valueOps.get(anyString())).thenReturn("300");
            when(brevoConfig.getDailyLimit()).thenReturn(300);

            boolean result = emailService.sendEmail(buildNotification("test@example.com"));

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("sendEmail(String, String, String)")
    class SendEmailTemplate {

        @Test
        @DisplayName("returns true when Brevo is disabled")
        void returnsTrueWhenDisabled() {
            when(brevoConfig.isEnabled()).thenReturn(false);

            assertThat(emailService.sendEmail("test@example.com", "Subject", "Body")).isTrue();
        }
    }

    @Nested
    @DisplayName("sendBulkEmail")
    class SendBulkEmail {

        @Test
        @DisplayName("returns true when Brevo is disabled")
        void returnsTrueWhenDisabled() {
            when(brevoConfig.isEnabled()).thenReturn(false);

            boolean result = emailService.sendBulkEmail(
                    new String[]{"a@example.com", "b@example.com"}, "Subject", "Content");

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns false when rate limit is reached immediately")
        void returnsFalseWhenRateLimited() {
            when(brevoConfig.isEnabled()).thenReturn(true);
            when(redisTemplate.opsForValue()).thenReturn(valueOps);
            when(valueOps.get(anyString())).thenReturn("300");
            when(brevoConfig.getDailyLimit()).thenReturn(300);

            boolean result = emailService.sendBulkEmail(
                    new String[]{"a@example.com"}, "Subject", "Content");

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("getDailyEmailCount and getRemainingDailyEmails")
    class RateLimitInfo {

        @Test
        @DisplayName("returns 0 when no Redis count exists")
        void returnsZeroWhenNoCount() {
            when(redisTemplate.opsForValue()).thenReturn(valueOps);
            when(valueOps.get(anyString())).thenReturn(null);

            assertThat(emailService.getDailyEmailCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("returns current count from Redis")
        void returnsCurrentCount() {
            when(redisTemplate.opsForValue()).thenReturn(valueOps);
            when(valueOps.get(anyString())).thenReturn("42");

            assertThat(emailService.getDailyEmailCount()).isEqualTo(42);
        }

        @Test
        @DisplayName("returns remaining = limit - current count")
        void returnsRemaining() {
            when(redisTemplate.opsForValue()).thenReturn(valueOps);
            when(valueOps.get(anyString())).thenReturn("50");
            when(brevoConfig.getDailyLimit()).thenReturn(300);

            assertThat(emailService.getRemainingDailyEmails()).isEqualTo(250);
        }
    }
}
