package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.notification.config.TwilioConfig;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.service.SmsService;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.rest.api.v2010.account.MessageCreator;
import com.twilio.type.PhoneNumber;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

/**
 * Exercises SmsService's actual call into the Twilio SDK (Message.creator(...).create()),
 * which SmsServiceTest never reaches — its cases all short-circuit before the real API call
 * (Twilio disabled, missing phone). Mocks the SDK's static Message.creator factory rather than
 * sending real SMS, since real Twilio sending is out of scope here.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SmsService <-> Twilio API surface")
class SmsServiceTwilioApiTest {

    @Mock private TwilioConfig twilioConfig;

    @InjectMocks private SmsService smsService;

    private Notification buildNotification(String recipientPhone, String body) {
        Notification n = new Notification("user-1", "Test Title", body,
                Notification.NotificationType.ORDER_STATUS_UPDATE, Notification.NotificationChannel.SMS);
        n.setRecipientPhone(recipientPhone);
        return n;
    }

    @Test
    @DisplayName("sendSms calls Twilio with the exact to/from/body and returns true on success")
    void sendsWithCorrectToFromBody() {
        when(twilioConfig.isEnabled()).thenReturn(true);
        when(twilioConfig.getPhoneNumber()).thenReturn("+15555555555");

        try (MockedStatic<Message> messageStatic = mockStatic(Message.class)) {
            MessageCreator creator = mock(MessageCreator.class);
            Message sent = mock(Message.class);
            when(sent.getSid()).thenReturn("SM_FAKE_SID");
            when(creator.create()).thenReturn(sent);

            ArgumentCaptor<PhoneNumber> toCaptor = ArgumentCaptor.forClass(PhoneNumber.class);
            ArgumentCaptor<PhoneNumber> fromCaptor = ArgumentCaptor.forClass(PhoneNumber.class);
            ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
            messageStatic.when(() -> Message.creator(toCaptor.capture(), fromCaptor.capture(), bodyCaptor.capture()))
                    .thenReturn(creator);

            boolean result = smsService.sendSms(buildNotification("+491701234567", "Your order is ready"));

            assertThat(result).isTrue();
            assertThat(toCaptor.getValue().getEndpoint()).isEqualTo("+491701234567");
            assertThat(fromCaptor.getValue().getEndpoint()).isEqualTo("+15555555555");
            assertThat(bodyCaptor.getValue()).isEqualTo("Your order is ready");
        }
    }

    @Test
    @DisplayName("sendSms returns false and does not throw when Twilio rejects the request")
    void returnsFalseWhenTwilioThrows() {
        when(twilioConfig.isEnabled()).thenReturn(true);
        when(twilioConfig.getPhoneNumber()).thenReturn("+15555555555");

        try (MockedStatic<Message> messageStatic = mockStatic(Message.class)) {
            MessageCreator creator = mock(MessageCreator.class);
            when(creator.create()).thenThrow(new ApiException("Invalid 'To' Phone Number"));
            messageStatic.when(() -> Message.creator(any(PhoneNumber.class), any(PhoneNumber.class), anyString()))
                    .thenReturn(creator);

            boolean result = smsService.sendSms(buildNotification("+491701234567", "Hi"));

            assertThat(result).isFalse();
        }
    }

    @Test
    @DisplayName("sendSms lets a non-Twilio exception propagate rather than swallowing it as a generic send failure")
    void propagatesNonTwilioExceptions() {
        when(twilioConfig.isEnabled()).thenReturn(true);
        when(twilioConfig.getPhoneNumber()).thenReturn("+15555555555");

        try (MockedStatic<Message> messageStatic = mockStatic(Message.class)) {
            MessageCreator creator = mock(MessageCreator.class);
            when(creator.create()).thenThrow(new IllegalStateException("unexpected bug, not a Twilio failure"));
            messageStatic.when(() -> Message.creator(any(PhoneNumber.class), any(PhoneNumber.class), anyString()))
                    .thenReturn(creator);

            org.assertj.core.api.Assertions.assertThatThrownBy(
                    () -> smsService.sendSms(buildNotification("+491701234567", "Hi")))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Test
    @DisplayName("sendSms rejects a recipient phone with no country code instead of guessing one (C3)")
    void rejectsPhoneWithoutCountryCode() {
        when(twilioConfig.isEnabled()).thenReturn(true);

        try (MockedStatic<Message> messageStatic = mockStatic(Message.class)) {
            boolean result = smsService.sendSms(buildNotification("9876543210", "Hi"));

            assertThat(result).isFalse();
            messageStatic.verifyNoInteractions();
        }
    }

    @Test
    @DisplayName("sendBulkSms rejects a phone with no country code without guessing, but keeps processing the rest")
    void bulkSmsRejectsPhoneWithoutCountryCodeButContinues() {
        when(twilioConfig.isEnabled()).thenReturn(true);
        when(twilioConfig.getPhoneNumber()).thenReturn("+15555555555");

        try (MockedStatic<Message> messageStatic = mockStatic(Message.class)) {
            MessageCreator creator = mock(MessageCreator.class);
            Message sent = mock(Message.class);
            when(sent.getSid()).thenReturn("SM_FAKE_SID");
            when(creator.create()).thenReturn(sent);
            messageStatic.when(() -> Message.creator(any(PhoneNumber.class), any(PhoneNumber.class), anyString()))
                    .thenReturn(creator);

            boolean result = smsService.sendBulkSms(
                    new String[]{"9876543210", "+491701234567"}, "Hi");

            assertThat(result).isTrue(); // at least one (the valid one) succeeded
            messageStatic.verify(() -> Message.creator(any(PhoneNumber.class), any(PhoneNumber.class), anyString()));
        }
    }
}
