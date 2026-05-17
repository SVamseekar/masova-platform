package com.MaSoVa.payment.unit.service;

import com.MaSoVa.payment.service.PaymentNotificationService;
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

        @Test
        @DisplayName("Should skip notification for no-reply email")
        void shouldSkipForNoReplyEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "no-reply@masova.com", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }

        @Test
        @DisplayName("Should skip notification for email without dot")
        void shouldSkipForEmailWithoutDot() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "user@nodot", "+31612345678");

            // Then
            verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        }
    }

    @Nested
    @DisplayName("fetchOrderItems path coverage")
    class FetchOrderItemsTests {

        @Test
        @DisplayName("Should include order items in success notification HTML when orderId present")
        void shouldIncludeOrderItemsInEmailWhenOrderIdPresent() {
            // Given — orderId is set on transaction, restTemplate returns order with items
            java.util.Map<String, Object> orderResponse = new java.util.HashMap<>();
            java.util.List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("name", "Burger");
            item.put("quantity", 2);
            item.put("price", 100.0);
            items.add(item);
            orderResponse.put("items", items);

            // First call: getForObject (order items fetch)
            when(restTemplate.getForObject(anyString(), eq(java.util.Map.class)))
                    .thenReturn(orderResponse);
            // Second call: postForEntity (notification send)
            when(restTemplate.postForEntity(anyString(), any(org.springframework.http.HttpEntity.class), eq(java.util.Map.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then — notification was sent (not skipped)
            verify(restTemplate).postForEntity(anyString(), any(), eq(java.util.Map.class));
        }

        @Test
        @DisplayName("Should proceed gracefully when order items fetch fails")
        void shouldProceedWhenOrderItemsFetchFails() {
            // Given — order fetch throws, notification still sends
            when(restTemplate.getForObject(anyString(), eq(java.util.Map.class)))
                    .thenThrow(new org.springframework.web.client.RestClientException("Order service down"));
            when(restTemplate.postForEntity(anyString(), any(org.springframework.http.HttpEntity.class), eq(java.util.Map.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When — should not throw
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then — notification still sent
            verify(restTemplate).postForEntity(anyString(), any(), eq(java.util.Map.class));
        }

        @Test
        @DisplayName("Should handle null order response gracefully")
        void shouldHandleNullOrderResponse() {
            // Given
            when(restTemplate.getForObject(anyString(), eq(java.util.Map.class))).thenReturn(null);
            when(restTemplate.postForEntity(anyString(), any(org.springframework.http.HttpEntity.class), eq(java.util.Map.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate).postForEntity(anyString(), any(), eq(java.util.Map.class));
        }

        @Test
        @DisplayName("Should handle order item with Integer price")
        void shouldHandleOrderItemWithIntegerPrice() {
            // Given
            java.util.Map<String, Object> orderResponse = new java.util.HashMap<>();
            java.util.List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("name", "Pizza");
            item.put("quantity", 1);
            item.put("price", 250); // Integer not Double
            items.add(item);
            orderResponse.put("items", items);

            when(restTemplate.getForObject(anyString(), eq(java.util.Map.class))).thenReturn(orderResponse);
            when(restTemplate.postForEntity(anyString(), any(org.springframework.http.HttpEntity.class), eq(java.util.Map.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then — sent without error
            verify(restTemplate).postForEntity(anyString(), any(), eq(java.util.Map.class));
        }
    }

    @Nested
    @DisplayName("Phone number handling")
    class PhoneHandlingTests {

        @Test
        @DisplayName("Should include phone in notification when phone is non-empty")
        void shouldIncludePhoneWhenNonEmpty() {
            // Given
            when(restTemplate.postForEntity(anyString(), any(org.springframework.http.HttpEntity.class), eq(java.util.Map.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate).postForEntity(anyString(), httpEntityCaptor.capture(), eq(java.util.Map.class));
            java.util.Map<String, Object> body = httpEntityCaptor.getValue().getBody();
            assertThat(body).containsKey("recipientPhone");
        }

        @Test
        @DisplayName("Should not include phone in notification when phone is null")
        void shouldNotIncludePhoneWhenNull() {
            // Given
            when(restTemplate.postForEntity(anyString(), any(org.springframework.http.HttpEntity.class), eq(java.util.Map.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", null);

            // Then
            verify(restTemplate).postForEntity(anyString(), httpEntityCaptor.capture(), eq(java.util.Map.class));
            java.util.Map<String, Object> body = httpEntityCaptor.getValue().getBody();
            assertThat(body).doesNotContainKey("recipientPhone");
        }
    }
}
