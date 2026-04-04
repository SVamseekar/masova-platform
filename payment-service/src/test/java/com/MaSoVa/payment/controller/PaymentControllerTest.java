package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.InitiatePaymentRequest;
import com.MaSoVa.payment.dto.PaymentCallbackRequest;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.dto.ReconciliationReportResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("PaymentController Integration Tests")
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    private PaymentResponse sampleResponse;
    private InitiatePaymentRequest initiateRequest;

    @BeforeEach
    void setUp() {
        sampleResponse = PaymentResponse.builder()
                .transactionId("txn-001")
                .orderId("order-123")
                .razorpayOrderId("order_razorpay_001")
                .amount(BigDecimal.valueOf(500.00))
                .status(Transaction.PaymentStatus.INITIATED)
                .customerId("cust-456")
                .customerEmail("customer@real.com")
                .customerPhone("+31612345678")
                .storeId("store-789")
                .currency("INR")
                .createdAt(LocalDateTime.of(2026, 2, 15, 14, 30))
                .razorpayKeyId("rzp_test_key")
                .build();

        initiateRequest = InitiatePaymentRequest.builder()
                .orderId("order-123")
                .amount(BigDecimal.valueOf(500.00))
                .customerId("cust-456")
                .customerEmail("customer@real.com")
                .customerPhone("+31612345678")
                .storeId("store-789")
                .orderType("TAKEAWAY")
                .paymentMethod("CARD")
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/payments/initiate")
    class InitiatePaymentEndpointTests {

        @Test
        @DisplayName("Should return 200 with payment response on successful initiation")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn200OnSuccessfulInitiation() throws Exception {
            // Given
            when(paymentService.initiatePayment(any(InitiatePaymentRequest.class)))
                    .thenReturn(sampleResponse);

            // When / Then
            mockMvc.perform(post("/api/v1/payments/initiate")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(initiateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.transactionId", is("txn-001")))
                    .andExpect(jsonPath("$.orderId", is("order-123")))
                    .andExpect(jsonPath("$.razorpayKeyId", is("rzp_test_key")));
        }

        @Test
        @DisplayName("Should return 500 when payment service throws exception")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn500OnServiceException() throws Exception {
            // Given
            when(paymentService.initiatePayment(any(InitiatePaymentRequest.class)))
                    .thenThrow(new RuntimeException("Payment gateway error"));

            // When / Then
            mockMvc.perform(post("/api/v1/payments/initiate")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(initiateRequest)))
                    .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/payments/verify")
    class VerifyPaymentEndpointTests {

        @Test
        @DisplayName("Should return 200 on successful verification")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn200OnSuccessfulVerification() throws Exception {
            // Given
            PaymentResponse verifiedResponse = PaymentResponse.builder()
                    .transactionId("txn-001")
                    .orderId("order-123")
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .amount(BigDecimal.valueOf(500.00))
                    .build();

            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_razorpay_001")
                    .razorpaySignature("valid_signature")
                    .paymentMethod("CARD")
                    .build();

            when(paymentService.verifyPayment(any(PaymentCallbackRequest.class)))
                    .thenReturn(verifiedResponse);

            // When / Then
            mockMvc.perform(post("/api/v1/payments/verify")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(callbackRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("SUCCESS")));
        }

        @Test
        @DisplayName("Should return 400 when verification fails")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn400OnVerificationFailure() throws Exception {
            // Given
            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .razorpayOrderId("order_razorpay_001")
                    .razorpayPaymentId("pay_razorpay_001")
                    .razorpaySignature("invalid_sig")
                    .build();

            when(paymentService.verifyPayment(any(PaymentCallbackRequest.class)))
                    .thenThrow(new RuntimeException("Signature verification failed"));

            // When / Then
            mockMvc.perform(post("/api/v1/payments/verify")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(callbackRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/payments/{transactionId}")
    class GetTransactionEndpointTests {

        @Test
        @DisplayName("Should return 200 with transaction details")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn200WithTransactionDetails() throws Exception {
            // Given
            when(paymentService.getTransaction("txn-001")).thenReturn(sampleResponse);

            // When / Then
            mockMvc.perform(get("/api/v1/payments/txn-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.transactionId", is("txn-001")));
        }

        @Test
        @DisplayName("Should return 404 when transaction not found")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn404WhenNotFound() throws Exception {
            // Given
            when(paymentService.getTransaction("missing"))
                    .thenThrow(new RuntimeException("Transaction not found"));

            // When / Then
            mockMvc.perform(get("/api/v1/payments/missing"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/payments/order/{orderId}")
    class GetTransactionByOrderIdEndpointTests {

        @Test
        @DisplayName("Should return 200 with transaction for order")
        @WithMockUser(roles = "STAFF")
        void shouldReturn200WithTransactionForOrder() throws Exception {
            // Given
            when(paymentService.getTransactionByOrderId("order-123")).thenReturn(sampleResponse);

            // When / Then
            mockMvc.perform(get("/api/v1/payments/order/order-123"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderId", is("order-123")));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/payments/customer/{customerId}")
    class GetTransactionsByCustomerIdEndpointTests {

        @Test
        @DisplayName("Should return 200 with list of customer transactions")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn200WithCustomerTransactions() throws Exception {
            // Given
            when(paymentService.getTransactionsByCustomerId("cust-456"))
                    .thenReturn(List.of(sampleResponse));

            // When / Then
            mockMvc.perform(get("/api/v1/payments/customer/cust-456"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].customerId", is("cust-456")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/payments/cash")
    class RecordCashPaymentEndpointTests {

        @Test
        @DisplayName("Should return 200 for cash payment recording")
        @WithMockUser(roles = "STAFF")
        void shouldReturn200ForCashPayment() throws Exception {
            // Given
            PaymentResponse cashResponse = PaymentResponse.builder()
                    .transactionId("txn-cash-001")
                    .orderId("order-123")
                    .status(Transaction.PaymentStatus.SUCCESS)
                    .paymentMethod(Transaction.PaymentMethod.CASH)
                    .amount(BigDecimal.valueOf(300.00))
                    .build();

            when(paymentService.recordCashPayment(any(InitiatePaymentRequest.class)))
                    .thenReturn(cashResponse);

            // When / Then
            mockMvc.perform(post("/api/v1/payments/cash")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(initiateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paymentMethod", is("CASH")))
                    .andExpect(jsonPath("$.status", is("SUCCESS")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/payments/{transactionId}/reconcile")
    class ReconcileEndpointTests {

        @Test
        @DisplayName("Should return 200 when transaction reconciled successfully")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn200OnSuccessfulReconciliation() throws Exception {
            // Given
            when(paymentService.getTransaction("txn-001")).thenReturn(sampleResponse);

            // When / Then
            mockMvc.perform(post("/api/v1/payments/txn-001/reconcile")
                            .with(csrf())
                            .param("reconciledBy", "manager-user"))
                    .andExpect(status().isOk());
        }
    }
}
