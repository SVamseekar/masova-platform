package com.MaSoVa.payment.service;

import com.MaSoVa.payment.entity.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentNotificationService Unit Tests")
class PaymentNotificationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private PaymentNotificationService notificationService;

    @Captor
    private ArgumentCaptor<HttpEntity<Map<String, Object>>> httpEntityCaptor;

    private Transaction transaction;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(notificationService, "notificationServiceUrl", "http://localhost:8092");
        ReflectionTestUtils.setField(notificationService, "orderServiceUrl", "http://localhost:8083");
        ReflectionTestUtils.setField(notificationService, "notificationEnabled", true);

        transaction = Transaction.builder()
                .orderId("order-123")
                .amount(BigDecimal.valueOf(500.00))
                .status(Transaction.PaymentStatus.SUCCESS)
                .customerId("cust-456")
                .storeId("store-789")
                .currency("INR")
                .reconciled(false)
                .build();
        transaction.setId("txn-001");
        transaction.setPaymentMethod(Transaction.PaymentMethod.CARD);
        transaction.setCreatedAt(LocalDateTime.of(2026, 2, 15, 14, 30));
    }

    @Nested
    @DisplayName("sendPaymentSuccessNotification")
    class PaymentSuccessNotificationTests {

        @Test
        @DisplayName("Should send success notification with valid email")
        void shouldSendSuccessNotificationWithValidEmail() {
            // Given
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate).postForEntity(
                    eq("http://localhost:8092/api/notifications/send"),
                    httpEntityCaptor.capture(),
                    eq(Map.class));

            Map<String, Object> body = httpEntityCaptor.getValue().getBody();
            assertThat(body).isNotNull();
            assertThat(body.get("userId")).isEqualTo("cust-456");
            assertThat(body.get("type")).isEqualTo("PAYMENT_SUCCESS");
            assertThat(body.get("recipientEmail")).isEqualTo("customer@valid.com");
            assertThat(body.get("priority")).isEqualTo("HIGH");
        }

        @Test
        @DisplayName("Should skip notification when notifications are disabled")
        void shouldSkipWhenNotificationsDisabled() {
            // Given
            ReflectionTestUtils.setField(notificationService, "notificationEnabled", false);

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification when customer ID is null")
        void shouldSkipWhenCustomerIdIsNull() {
            // Given
            transaction.setCustomerId(null);

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification when customer ID is empty")
        void shouldSkipWhenCustomerIdIsEmpty() {
            // Given
            transaction.setCustomerId("");

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification for walkin local email")
        void shouldSkipForWalkinLocalEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "guest@walkin.local", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification for test local email")
        void shouldSkipForTestLocalEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "test@test.local", null);

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should not throw when notification service is unavailable")
        void shouldNotThrowWhenNotificationServiceUnavailable() {
            // Given
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                    .thenThrow(new RestClientException("Connection refused"));

            // When / Then - should not throw
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");
        }
    }

    @Nested
    @DisplayName("sendPaymentFailureNotification")
    class PaymentFailureNotificationTests {

        @Test
        @DisplayName("Should send failure notification with reason")
        void shouldSendFailureNotification() {
            // Given
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentFailureNotification(
                    transaction, "customer@valid.com", "+31612345678", "Insufficient funds");

            // Then
            verify(restTemplate).postForEntity(
                    eq("http://localhost:8092/api/notifications/send"),
                    httpEntityCaptor.capture(),
                    eq(Map.class));

            Map<String, Object> body = httpEntityCaptor.getValue().getBody();
            assertThat(body).isNotNull();
            assertThat(body.get("type")).isEqualTo("PAYMENT_FAILED");
            assertThat(body.get("priority")).isEqualTo("URGENT");
        }

        @Test
        @DisplayName("Should skip failure notification when notifications disabled")
        void shouldSkipWhenDisabled() {
            // Given
            ReflectionTestUtils.setField(notificationService, "notificationEnabled", false);

            // When
            notificationService.sendPaymentFailureNotification(
                    transaction, "customer@valid.com", "+31612345678", "reason");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip failure notification when customer ID is null")
        void shouldSkipWhenCustomerIdNull() {
            // Given
            transaction.setCustomerId(null);

            // When
            notificationService.sendPaymentFailureNotification(
                    transaction, "customer@valid.com", "+31612345678", "reason");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }
    }

    @Nested
    @DisplayName("sendRefundNotification")
    class RefundNotificationTests {

        @Test
        @DisplayName("Should send refund notification with refund amount")
        void shouldSendRefundNotification() {
            // Given
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(null));

            // When
            notificationService.sendRefundNotification(
                    transaction, "customer@valid.com", "+31612345678", BigDecimal.valueOf(150.00));

            // Then
            verify(restTemplate).postForEntity(
                    eq("http://localhost:8092/api/notifications/send"),
                    httpEntityCaptor.capture(),
                    eq(Map.class));

            Map<String, Object> body = httpEntityCaptor.getValue().getBody();
            assertThat(body).isNotNull();
            assertThat(body.get("type")).isEqualTo("REFUND_PROCESSED");
            assertThat(body.get("priority")).isEqualTo("HIGH");
        }

        @Test
        @DisplayName("Should skip refund notification when disabled")
        void shouldSkipRefundNotificationWhenDisabled() {
            // Given
            ReflectionTestUtils.setField(notificationService, "notificationEnabled", false);

            // When
            notificationService.sendRefundNotification(
                    transaction, "customer@valid.com", "+31612345678", BigDecimal.valueOf(100));

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should not throw when notification service call fails")
        void shouldNotThrowOnNotificationFailure() {
            // Given
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                    .thenThrow(new RestClientException("Timeout"));

            // When / Then - should not throw
            notificationService.sendRefundNotification(
                    transaction, "customer@valid.com", "+31612345678", BigDecimal.valueOf(50));
        }
    }

    @Nested
    @DisplayName("Email Validation")
    class EmailValidationTests {

        @Test
        @DisplayName("Should skip notification for null email")
        void shouldSkipForNullEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(transaction, null, "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification for empty email")
        void shouldSkipForEmptyEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(transaction, "", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification for example.com email")
        void shouldSkipForExampleDotComEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "test@example.com", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification for noreply email")
        void shouldSkipForNoreplyEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "noreply@masova.com", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification for email without @ sign")
        void shouldSkipForEmailWithoutAtSign() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "notanemail", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }
    }
}
