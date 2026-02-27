package com.MaSoVa.payment.service;

import com.MaSoVa.payment.dto.UpdateOrderPaymentRequest;
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
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderServiceClient Unit Tests")
class OrderServiceClientTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private OrderServiceClient orderServiceClient;

    @Captor
    private ArgumentCaptor<HttpEntity<UpdateOrderPaymentRequest>> httpEntityCaptor;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderServiceClient, "orderServiceUrl", "http://localhost:8083");
    }

    @Nested
    @DisplayName("updateOrderPaymentStatus")
    class UpdateOrderPaymentStatusTests {

        @Test
        @DisplayName("Should send PATCH request to order service with correct URL and DTO")
        void shouldSendPatchRequestSuccessfully() {
            // Given
            when(restTemplate.exchange(
                    anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("updated"));

            // When
            orderServiceClient.updateOrderPaymentStatus("order-123", "PAID", "txn-001");

            // Then
            verify(restTemplate).exchange(
                    eq("http://localhost:8083/api/orders/order-123/payment"),
                    eq(HttpMethod.PATCH),
                    httpEntityCaptor.capture(),
                    eq(String.class));

            UpdateOrderPaymentRequest capturedBody = httpEntityCaptor.getValue().getBody();
            assertThat(capturedBody).isNotNull();
            assertThat(capturedBody.getStatus()).isEqualTo("PAID");
            assertThat(capturedBody.getTransactionId()).isEqualTo("txn-001");
        }

        @Test
        @DisplayName("Should propagate exception when REST call fails")
        void shouldPropagateExceptionOnFailure() {
            // Given
            when(restTemplate.exchange(
                    anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new RestClientException("Connection refused"));

            // When / Then
            assertThatThrownBy(() -> orderServiceClient.updateOrderPaymentStatus(
                    "order-123", "PAID", "txn-001"))
                    .isInstanceOf(RestClientException.class);
        }
    }

    @Nested
    @DisplayName("getOrderDetails")
    class GetOrderDetailsTests {

        @Test
        @DisplayName("Should fetch order details successfully")
        @SuppressWarnings("unchecked")
        void shouldFetchOrderDetailsSuccessfully() {
            // Given
            Map<String, Object> orderDetails = Map.of(
                    "id", "order-123",
                    "status", "CONFIRMED",
                    "totalAmount", 500.00);
            when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                    .thenReturn(new ResponseEntity<>(orderDetails, HttpStatus.OK));

            // When
            Map<String, Object> result = orderServiceClient.getOrderDetails("order-123");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.get("id")).isEqualTo("order-123");
            verify(restTemplate).getForEntity(
                    eq("http://localhost:8083/api/orders/order-123"), eq(Map.class));
        }

        @Test
        @DisplayName("Should propagate exception when order service is unavailable")
        void shouldPropagateExceptionWhenUnavailable() {
            // Given
            when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                    .thenThrow(new RestClientException("Service unavailable"));

            // When / Then
            assertThatThrownBy(() -> orderServiceClient.getOrderDetails("order-123"))
                    .isInstanceOf(RestClientException.class);
        }

        @Test
        @DisplayName("Should return null when order service returns non-2xx status")
        @SuppressWarnings("unchecked")
        void shouldReturnNullOnNon2xxStatus() {
            // Given
            when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                    .thenReturn(new ResponseEntity<>(null, HttpStatus.NOT_FOUND));

            // When
            Map<String, Object> result = orderServiceClient.getOrderDetails("order-missing");

            // Then
            assertThat(result).isNull();
        }
    }
}
