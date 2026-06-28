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
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
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
@SuppressWarnings("unchecked") // any(ParameterizedTypeReference.class) requires a raw-type Class<T> argument
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
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class)))
                    .thenReturn(ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate).exchange(
                    eq("http://localhost:8092/api/notifications/send"),
                    eq(HttpMethod.POST),
                    httpEntityCaptor.capture(),
                    eq(Void.class));

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
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
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
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
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
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for walkin local email")
        void shouldSkipForWalkinLocalEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "guest@walkin.local", "+31612345678");

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for test local email")
        void shouldSkipForTestLocalEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "test@test.local", null);

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should not throw when notification service is unavailable")
        void shouldNotThrowWhenNotificationServiceUnavailable() {
            // Given
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class)))
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
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class)))
                    .thenReturn(ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentFailureNotification(
                    transaction, "customer@valid.com", "+31612345678", "Insufficient funds");

            // Then
            verify(restTemplate).exchange(
                    eq("http://localhost:8092/api/notifications/send"),
                    eq(HttpMethod.POST),
                    httpEntityCaptor.capture(),
                    eq(Void.class));

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
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
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
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }
    }

    @Nested
    @DisplayName("sendRefundNotification")
    class RefundNotificationTests {

        @Test
        @DisplayName("Should send refund notification with refund amount")
        void shouldSendRefundNotification() {
            // Given
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class)))
                    .thenReturn(ResponseEntity.ok(null));

            // When
            notificationService.sendRefundNotification(
                    transaction, "customer@valid.com", "+31612345678", BigDecimal.valueOf(150.00));

            // Then
            verify(restTemplate).exchange(
                    eq("http://localhost:8092/api/notifications/send"),
                    eq(HttpMethod.POST),
                    httpEntityCaptor.capture(),
                    eq(Void.class));

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
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should not throw when notification service call fails")
        void shouldNotThrowOnNotificationFailure() {
            // Given
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class)))
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
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for empty email")
        void shouldSkipForEmptyEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(transaction, "", "+31612345678");

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for example.com email")
        void shouldSkipForExampleDotComEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "test@example.com", "+31612345678");

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for noreply email")
        void shouldSkipForNoreplyEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "noreply@masova.com", "+31612345678");

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for email without @ sign")
        void shouldSkipForEmailWithoutAtSign() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "notanemail", "+31612345678");

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for no-reply email")
        void shouldSkipForNoReplyEmail() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "no-reply@masova.com", "+31612345678");

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should skip notification for email without dot")
        void shouldSkipForEmailWithoutDot() {
            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "user@nodot", "+31612345678");

            // Then
            verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
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

            // First call: exchange GET (order items fetch)
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(orderResponse));
            // Second call: exchange POST (notification send)
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(org.springframework.http.HttpEntity.class), eq(Void.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then — notification was sent (not skipped)
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should proceed gracefully when order items fetch fails")
        void shouldProceedWhenOrderItemsFetchFails() {
            // Given — order fetch throws, notification still sends
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenThrow(new org.springframework.web.client.RestClientException("Order service down"));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(org.springframework.http.HttpEntity.class), eq(Void.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When — should not throw
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then — notification still sent
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }

        @Test
        @DisplayName("Should handle null order response gracefully")
        void shouldHandleNullOrderResponse() {
            // Given
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(org.springframework.http.HttpEntity.class), eq(Void.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
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

            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(orderResponse));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(org.springframework.http.HttpEntity.class), eq(Void.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then — sent without error
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class));
        }
    }

    @Nested
    @DisplayName("Phone number handling")
    class PhoneHandlingTests {

        @Test
        @DisplayName("Should include phone in notification when phone is non-empty")
        void shouldIncludePhoneWhenNonEmpty() {
            // Given
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(org.springframework.http.HttpEntity.class), eq(Void.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", "+31612345678");

            // Then
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), httpEntityCaptor.capture(), eq(Void.class));
            java.util.Map<String, Object> body = httpEntityCaptor.getValue().getBody();
            assertThat(body).containsKey("recipientPhone");
        }

        @Test
        @DisplayName("Should not include phone in notification when phone is null")
        void shouldNotIncludePhoneWhenNull() {
            // Given
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(org.springframework.http.HttpEntity.class), eq(Void.class)))
                    .thenReturn(org.springframework.http.ResponseEntity.ok(null));

            // When
            notificationService.sendPaymentSuccessNotification(
                    transaction, "customer@valid.com", null);

            // Then
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), httpEntityCaptor.capture(), eq(Void.class));
            java.util.Map<String, Object> body = httpEntityCaptor.getValue().getBody();
            assertThat(body).doesNotContainKey("recipientPhone");
        }
    }
}
