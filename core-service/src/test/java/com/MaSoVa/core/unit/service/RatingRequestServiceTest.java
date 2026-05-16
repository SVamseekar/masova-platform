package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.service.EmailService;
import com.MaSoVa.core.notification.service.RatingRequestService;
import com.MaSoVa.core.notification.service.SmsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RatingRequestService Unit Tests")
class RatingRequestServiceTest {

    @Mock private EmailService emailService;
    @Mock private SmsService smsService;

    @InjectMocks private RatingRequestService ratingRequestService;

    @BeforeEach
    void setUpFields() {
        ReflectionTestUtils.setField(ratingRequestService, "frontendBaseUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(ratingRequestService, "ratingRequestEnabled", true);
    }

    @Nested
    @DisplayName("sendRatingRequest")
    class SendRatingRequest {

        @Test
        @DisplayName("sends SMS and email when both phone and email provided")
        void sendsBothChannels() {
            when(smsService.sendSms(any())).thenReturn(true);
            when(emailService.sendEmail(anyString(), anyString(), anyString())).thenReturn(true);

            ratingRequestService.sendRatingRequest(
                    "order-1", "ORD-001", "+911234567890", "test@example.com", "token123");

            verify(smsService).sendSms(any());
            verify(emailService).sendEmail(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("sends only SMS when email is null")
        void sendsOnlySmsWhenNoEmail() {
            when(smsService.sendSms(any())).thenReturn(true);

            ratingRequestService.sendRatingRequest(
                    "order-1", "ORD-001", "+911234567890", null, "token123");

            verify(smsService).sendSms(any());
            verify(emailService, never()).sendEmail(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("sends only email when phone is null")
        void sendsOnlyEmailWhenNoPhone() {
            when(emailService.sendEmail(anyString(), anyString(), anyString())).thenReturn(true);

            ratingRequestService.sendRatingRequest(
                    "order-1", "ORD-001", null, "test@example.com", "token123");

            verify(smsService, never()).sendSms(any());
            verify(emailService).sendEmail(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("sends nothing when both channels are null/empty")
        void sendsNothingWhenBothNull() {
            ratingRequestService.sendRatingRequest(
                    "order-1", "ORD-001", null, null, "token123");

            verify(smsService, never()).sendSms(any());
            verify(emailService, never()).sendEmail(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("does not throw when SMS send fails")
        void doesNotThrowOnSmsFailure() {
            when(smsService.sendSms(any())).thenThrow(new RuntimeException("SMS failed"));

            assertThatCode(() -> ratingRequestService.sendRatingRequest(
                    "order-1", "ORD-001", "+911234567890", null, "token123"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("does not throw when email send fails")
        void doesNotThrowOnEmailFailure() {
            when(emailService.sendEmail(anyString(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("Email failed"));

            assertThatCode(() -> ratingRequestService.sendRatingRequest(
                    "order-1", "ORD-001", null, "test@example.com", "token123"))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("ratingRequestEnabled flag")
    class EnabledFlag {

        @Test
        @DisplayName("skips all sending when disabled")
        void skipsWhenDisabled() {
            ReflectionTestUtils.setField(ratingRequestService, "ratingRequestEnabled", false);

            ratingRequestService.sendRatingRequest(
                    "order-1", "ORD-001", "+911234567890", "test@example.com", "token123");

            verify(smsService, never()).sendSms(any());
            verify(emailService, never()).sendEmail(anyString(), anyString(), anyString());
        }
    }
}
