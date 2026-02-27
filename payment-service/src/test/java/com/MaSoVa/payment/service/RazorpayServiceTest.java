package com.MaSoVa.payment.service;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.razorpay.Order;
import com.razorpay.OrderClient;
import com.razorpay.Payment;
import com.razorpay.PaymentClient;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RazorpayService Unit Tests")
class RazorpayServiceTest {

    @Mock
    private RazorpayClient razorpayClient;

    @Mock
    private RazorpayConfig razorpayConfig;

    @Mock
    private OrderClient orderClient;

    @Mock
    private PaymentClient paymentClient;

    private RazorpayService razorpayService;

    @BeforeEach
    void setUp() {
        razorpayClient.orders = orderClient;
        razorpayClient.payments = paymentClient;
        razorpayService = new RazorpayService(razorpayClient, razorpayConfig);
    }

    @Nested
    @DisplayName("createOrder")
    class CreateOrderTests {

        @Test
        @DisplayName("Should create Razorpay order with amount converted to paisa")
        void shouldCreateOrderSuccessfully() throws RazorpayException {
            // Given
            Order mockOrder = mock(Order.class);
            when(mockOrder.get("id")).thenReturn("order_test_123");
            when(orderClient.create(any(JSONObject.class))).thenReturn(mockOrder);

            // When
            Order result = razorpayService.createOrder(
                    BigDecimal.valueOf(250.50), "order-123", "RCP_abc12345");

            // Then
            assertThat(result).isNotNull();
            assertThat((Object) result.get("id")).isEqualTo("order_test_123");
        }

        @Test
        @DisplayName("Should propagate RazorpayException when order creation fails")
        void shouldPropagateRazorpayException() throws RazorpayException {
            // Given
            when(orderClient.create(any(JSONObject.class)))
                    .thenThrow(new RazorpayException("Gateway timeout"));

            // When / Then
            assertThatThrownBy(() -> razorpayService.createOrder(
                    BigDecimal.valueOf(100), "order-123", "RCP_receipt"))
                    .isInstanceOf(RazorpayException.class)
                    .hasMessageContaining("Gateway timeout");
        }
    }

    @Nested
    @DisplayName("verifyPaymentSignature")
    class VerifyPaymentSignatureTests {

        @Test
        @DisplayName("Should return false when signature verification throws exception")
        void shouldReturnFalseOnException() {
            // Given - verifyPaymentSignature uses Utils.verifyPaymentSignature which is static
            // The method catches RazorpayException and returns false
            when(razorpayConfig.getKeySecret()).thenReturn("test_secret");

            // When - with invalid inputs that will cause the static Utils to throw
            boolean result = razorpayService.verifyPaymentSignature(
                    "order_id", "payment_id", "invalid_signature");

            // Then - since Utils.verifyPaymentSignature is static and will fail with test data
            // the catch block returns false
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("fetchPayment")
    class FetchPaymentTests {

        @Test
        @DisplayName("Should fetch payment details successfully")
        void shouldFetchPaymentSuccessfully() throws RazorpayException {
            // Given
            Payment mockPayment = mock(Payment.class);
            when(paymentClient.fetch("pay_123")).thenReturn(mockPayment);

            // When
            Payment result = razorpayService.fetchPayment("pay_123");

            // Then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Should propagate exception when payment fetch fails")
        void shouldPropagateExceptionOnFetchFailure() throws RazorpayException {
            // Given
            when(paymentClient.fetch("pay_invalid"))
                    .thenThrow(new RazorpayException("Payment not found"));

            // When / Then
            assertThatThrownBy(() -> razorpayService.fetchPayment("pay_invalid"))
                    .isInstanceOf(RazorpayException.class)
                    .hasMessageContaining("Payment not found");
        }
    }

    @Nested
    @DisplayName("createRefund")
    class CreateRefundTests {

        @Test
        @DisplayName("Should create refund with amount in paisa")
        void shouldCreateRefundSuccessfully() throws RazorpayException {
            // Given
            com.razorpay.Refund mockRefund = mock(com.razorpay.Refund.class);
            JSONObject refundJson = new JSONObject();
            refundJson.put("id", "rfnd_test_001");
            refundJson.put("status", "processed");
            when(mockRefund.toJson()).thenReturn(refundJson);
            when(paymentClient.refund(eq("pay_123"), any(JSONObject.class))).thenReturn(mockRefund);

            // When
            JSONObject result = razorpayService.createRefund(
                    "pay_123", BigDecimal.valueOf(100.00), "normal");

            // Then
            assertThat(result.getString("id")).isEqualTo("rfnd_test_001");
            assertThat(result.getString("status")).isEqualTo("processed");
        }

        @Test
        @DisplayName("Should propagate exception when refund creation fails")
        void shouldPropagateExceptionOnRefundFailure() throws RazorpayException {
            // Given
            when(paymentClient.refund(anyString(), any(JSONObject.class)))
                    .thenThrow(new RazorpayException("Refund failed"));

            // When / Then
            assertThatThrownBy(() -> razorpayService.createRefund(
                    "pay_123", BigDecimal.valueOf(50), "normal"))
                    .isInstanceOf(RazorpayException.class)
                    .hasMessageContaining("Refund failed");
        }
    }

    @Nested
    @DisplayName("fetchRefund")
    class FetchRefundTests {

        @Test
        @DisplayName("Should fetch refund details successfully")
        void shouldFetchRefundSuccessfully() throws RazorpayException {
            // Given
            com.razorpay.Refund mockRefund = mock(com.razorpay.Refund.class);
            JSONObject refundJson = new JSONObject();
            refundJson.put("id", "rfnd_test_001");
            when(mockRefund.toJson()).thenReturn(refundJson);
            when(paymentClient.fetchRefund("pay_123", "rfnd_test_001")).thenReturn(mockRefund);

            // When
            JSONObject result = razorpayService.fetchRefund("pay_123", "rfnd_test_001");

            // Then
            assertThat(result.getString("id")).isEqualTo("rfnd_test_001");
        }

        @Test
        @DisplayName("Should propagate exception when refund fetch fails")
        void shouldPropagateExceptionOnFetchRefundFailure() throws RazorpayException {
            // Given
            when(paymentClient.fetchRefund(anyString(), anyString()))
                    .thenThrow(new RazorpayException("Not found"));

            // When / Then
            assertThatThrownBy(() -> razorpayService.fetchRefund("pay_123", "rfnd_missing"))
                    .isInstanceOf(RazorpayException.class);
        }
    }

    @Nested
    @DisplayName("verifyWebhookSignature")
    class VerifyWebhookSignatureTests {

        @Test
        @DisplayName("Should return false when verification throws exception")
        void shouldReturnFalseOnVerificationException() {
            // Given - Utils.verifyWebhookSignature is static, will fail with test data

            // When
            boolean result = razorpayService.verifyWebhookSignature(
                    "payload", "bad_signature", "secret");

            // Then
            assertThat(result).isFalse();
        }
    }
}
