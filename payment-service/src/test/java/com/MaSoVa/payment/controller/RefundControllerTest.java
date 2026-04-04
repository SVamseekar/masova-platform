package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.dto.RefundRequest;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.service.RefundService;
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
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RefundController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("RefundController Integration Tests")
class RefundControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RefundService refundService;

    private Refund sampleRefund;
    private RefundRequest refundRequest;

    @BeforeEach
    void setUp() {
        sampleRefund = Refund.builder()
                .transactionId("txn-001")
                .orderId("order-123")
                .razorpayRefundId("rfnd_razorpay_001")
                .razorpayPaymentId("pay_razorpay_001")
                .amount(BigDecimal.valueOf(200.00))
                .status(Refund.RefundStatus.INITIATED)
                .type(Refund.RefundType.PARTIAL)
                .reason("Customer requested partial refund")
                .initiatedBy("manager-001")
                .customerId("cust-456")
                .speed("normal")
                .build();
        sampleRefund.setId("refund-001");

        refundRequest = RefundRequest.builder()
                .transactionId("txn-001")
                .amount(BigDecimal.valueOf(200.00))
                .type(Refund.RefundType.PARTIAL)
                .reason("Customer requested partial refund")
                .initiatedBy("manager-001")
                .speed("normal")
                .build();
    }

    @Nested
    @DisplayName("POST /api/payments/refund")
    class InitiateRefundEndpointTests {

        @Test
        @DisplayName("Should return 201 with refund on successful initiation")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn201OnSuccessfulRefund() throws Exception {
            // Given
            when(refundService.initiateRefund(any(RefundRequest.class))).thenReturn(sampleRefund);

            // When / Then
            mockMvc.perform(post("/api/payments/refund")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(refundRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is("refund-001")))
                    .andExpect(jsonPath("$.razorpayRefundId", is("rfnd_razorpay_001")))
                    .andExpect(jsonPath("$.status", is("INITIATED")));
        }

        @Test
        @DisplayName("Should return 500 when refund service throws exception")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn500OnServiceException() throws Exception {
            // Given
            when(refundService.initiateRefund(any(RefundRequest.class)))
                    .thenThrow(new RuntimeException("Refund failed"));

            // When / Then
            mockMvc.perform(post("/api/payments/refund")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(refundRequest)))
                    .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("GET /api/payments/refund/{refundId}")
    class GetRefundEndpointTests {

        @Test
        @DisplayName("Should return 200 with refund details")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn200WithRefundDetails() throws Exception {
            // Given
            when(refundService.getRefund("refund-001")).thenReturn(sampleRefund);

            // When / Then
            mockMvc.perform(get("/api/payments/refund/refund-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is("refund-001")))
                    .andExpect(jsonPath("$.amount").value(200.00));
        }

        @Test
        @DisplayName("Should return 404 when refund not found")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn404WhenNotFound() throws Exception {
            // Given
            when(refundService.getRefund("missing"))
                    .thenThrow(new RuntimeException("Refund not found"));

            // When / Then
            mockMvc.perform(get("/api/payments/refund/missing"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/payments/refund/transaction/{transactionId}")
    class GetRefundsByTransactionEndpointTests {

        @Test
        @DisplayName("Should return 200 with refunds list for transaction")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn200WithRefundsForTransaction() throws Exception {
            // Given
            when(refundService.getRefundsByTransactionId("txn-001"))
                    .thenReturn(List.of(sampleRefund));

            // When / Then
            mockMvc.perform(get("/api/payments/refund/transaction/txn-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }

        @Test
        @DisplayName("Should return 200 with empty list when no refunds")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn200WithEmptyListWhenNoRefunds() throws Exception {
            // Given
            when(refundService.getRefundsByTransactionId("txn-no-refunds"))
                    .thenReturn(Collections.emptyList());

            // When / Then
            mockMvc.perform(get("/api/payments/refund/transaction/txn-no-refunds"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/payments/refund/order/{orderId}")
    class GetRefundsByOrderEndpointTests {

        @Test
        @DisplayName("Should return 200 with refunds list for order")
        @WithMockUser(roles = "MANAGER")
        void shouldReturn200WithRefundsForOrder() throws Exception {
            // Given
            when(refundService.getRefundsByOrderId("order-123"))
                    .thenReturn(List.of(sampleRefund));

            // When / Then
            mockMvc.perform(get("/api/payments/refund/order/order-123"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].orderId", is("order-123")));
        }
    }

    @Nested
    @DisplayName("GET /api/payments/refund/customer/{customerId}")
    class GetRefundsByCustomerEndpointTests {

        @Test
        @DisplayName("Should return 200 with refunds list for customer")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn200WithRefundsForCustomer() throws Exception {
            // Given
            when(refundService.getRefundsByCustomerId("cust-456"))
                    .thenReturn(List.of(sampleRefund));

            // When / Then
            mockMvc.perform(get("/api/payments/refund/customer/cust-456"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].customerId", is("cust-456")));
        }

        @Test
        @DisplayName("Should return 500 when service throws exception")
        @WithMockUser(roles = "CUSTOMER")
        void shouldReturn500OnServiceException() throws Exception {
            // Given
            when(refundService.getRefundsByCustomerId("cust-err"))
                    .thenThrow(new RuntimeException("Database error"));

            // When / Then
            mockMvc.perform(get("/api/payments/refund/customer/cust-err"))
                    .andExpect(status().isInternalServerError());
        }
    }
}
