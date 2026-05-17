package com.MaSoVa.payment.unit.controller;

import com.MaSoVa.payment.controller.PaymentController;
import com.MaSoVa.payment.dto.PaymentResponse;
import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentController Unit Tests")
class PaymentControllerTest extends BaseServiceTest {

    @Mock private PaymentService paymentService;
    @InjectMocks private PaymentController paymentController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
            .build();
    }

    private PaymentResponse buildPaymentResponse(String id, Transaction.PaymentStatus status) {
        PaymentResponse r = new PaymentResponse();
        r.setTransactionId(id);
        r.setStatus(status);
        r.setAmount(new BigDecimal("200.00"));
        return r;
    }

    @Nested
    @DisplayName("POST /api/payments/initiate")
    class InitiatePayment {

        @Test
        @DisplayName("returns 200 on successful initiation")
        void returns200OnSuccess() throws Exception {
            when(paymentService.initiatePayment(any())).thenReturn(buildPaymentResponse("txn-1", Transaction.PaymentStatus.PENDING));

            mockMvc.perform(post("/api/payments/initiate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"amount\":200.00,\"customerId\":\"cust-1\",\"storeId\":\"store-1\",\"paymentMethod\":\"UPI\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value("txn-1"));
        }
    }

    @Nested
    @DisplayName("GET /api/payments/{transactionId}")
    class GetTransaction {

        @Test
        @DisplayName("returns 200 for existing transaction")
        void returns200WhenFound() throws Exception {
            when(paymentService.getTransaction("txn-1")).thenReturn(buildPaymentResponse("txn-1", Transaction.PaymentStatus.SUCCESS));

            mockMvc.perform(get("/api/payments/txn-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value("txn-1"));
        }

        @Test
        @DisplayName("returns 404 when not found")
        void returns404WhenNotFound() throws Exception {
            when(paymentService.getTransaction("bad-id")).thenThrow(new RuntimeException("Transaction not found"));

            mockMvc.perform(get("/api/payments/bad-id"))
                .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/payments")
    class GetTransactions {

        @Test
        @DisplayName("returns 200 with transaction list by customerId")
        void returns200WithListByCustomer() throws Exception {
            when(paymentService.getTransactionsByCustomerId("cust-1"))
                .thenReturn(List.of(buildPaymentResponse("txn-1", Transaction.PaymentStatus.SUCCESS)));

            mockMvc.perform(get("/api/payments").param("customerId", "cust-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/payments/cash")
    class CashPayment {

        @Test
        @DisplayName("returns 200 on cash payment")
        void returns200() throws Exception {
            when(paymentService.recordCashPayment(any())).thenReturn(buildPaymentResponse("txn-cash", Transaction.PaymentStatus.SUCCESS));

            mockMvc.perform(post("/api/payments/cash")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"amount\":200.00,\"customerId\":\"cust-1\",\"storeId\":\"store-1\",\"paymentMethod\":\"CASH\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 500 on cash payment exception")
        void returns500OnException() throws Exception {
            when(paymentService.recordCashPayment(any())).thenThrow(new RuntimeException("Service error"));

            mockMvc.perform(post("/api/payments/cash")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"amount\":200.00,\"customerId\":\"cust-1\",\"storeId\":\"store-1\",\"paymentMethod\":\"CASH\"}"))
                .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("POST /api/payments/verify")
    class VerifyPayment {

        @Test
        @DisplayName("returns 200 on successful verification")
        void returns200OnSuccess() throws Exception {
            when(paymentService.verifyPayment(any())).thenReturn(buildPaymentResponse("txn-1", Transaction.PaymentStatus.SUCCESS));

            mockMvc.perform(post("/api/payments/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"razorpayOrderId\":\"order_rzp_1\",\"razorpayPaymentId\":\"pay_rzp_1\",\"razorpaySignature\":\"sig123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value("txn-1"));
        }

        @Test
        @DisplayName("returns 400 on verification failure")
        void returns400OnFailure() throws Exception {
            when(paymentService.verifyPayment(any())).thenThrow(new RuntimeException("Signature invalid"));

            mockMvc.perform(post("/api/payments/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"razorpayOrderId\":\"order_rzp_1\",\"razorpayPaymentId\":\"pay_rzp_1\",\"razorpaySignature\":\"bad_sig\"}"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/payments/{transactionId}/reconcile")
    class ReconcileTransaction {

        @Test
        @DisplayName("returns 200 on successful reconciliation")
        void returns200OnSuccess() throws Exception {
            PaymentResponse resp = buildPaymentResponse("txn-1", Transaction.PaymentStatus.SUCCESS);
            resp.setStoreId("store-1");
            when(paymentService.getTransaction("txn-1")).thenReturn(resp);
            org.mockito.Mockito.doNothing().when(paymentService).markAsReconciled(anyString(), anyString());

            mockMvc.perform(post("/api/payments/txn-1/reconcile")
                    .param("reconciledBy", "manager-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 500 on reconciliation error")
        void returns500OnError() throws Exception {
            when(paymentService.getTransaction("txn-bad")).thenThrow(new RuntimeException("Not found"));

            mockMvc.perform(post("/api/payments/txn-bad/reconcile")
                    .param("reconciledBy", "manager-1"))
                .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("GET /api/payments - query params")
    class GetTransactionsQueryParams {

        @Test
        @DisplayName("returns 200 with reconciliation report")
        void returns200WithReconciliationReport() throws Exception {
            com.MaSoVa.payment.dto.ReconciliationReportResponse report =
                com.MaSoVa.payment.dto.ReconciliationReportResponse.builder()
                    .storeId("store-1")
                    .totalTransactions(5)
                    .build();
            when(paymentService.getDailyReconciliation(any(), any())).thenReturn(report);

            mockMvc.perform(get("/api/payments")
                    .param("reconciliation", "true")
                    .param("date", "2026-02-15"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for transaction by orderId")
        void returns200ByOrderId() throws Exception {
            PaymentResponse resp = buildPaymentResponse("txn-1", Transaction.PaymentStatus.SUCCESS);
            when(paymentService.getTransactionByOrderId("order-1")).thenReturn(resp);

            mockMvc.perform(get("/api/payments").param("orderId", "order-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 by storeId default when no params given")
        void returns200ByStoreDefault() throws Exception {
            when(paymentService.getTransactionsByStoreId(any()))
                .thenReturn(java.util.List.of(buildPaymentResponse("txn-1", Transaction.PaymentStatus.SUCCESS)));

            mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 500 on exception during list fetch")
        void returns500OnException() throws Exception {
            when(paymentService.getTransactionsByCustomerId("cust-bad"))
                .thenThrow(new RuntimeException("DB error"));

            mockMvc.perform(get("/api/payments").param("customerId", "cust-bad"))
                .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("POST /api/payments/gdpr/anonymize")
    class GdprAnonymize {

        @Test
        @DisplayName("returns 200 with valid internal header")
        void returns200WithInternalHeader() throws Exception {
            org.mockito.Mockito.doNothing().when(paymentService).anonymizeCustomerData(anyString());

            mockMvc.perform(post("/api/payments/gdpr/anonymize")
                    .param("customerId", "cust-1")
                    .header("X-Internal-Service", "core-service"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 403 without internal header")
        void returns403WithoutInternalHeader() throws Exception {
            mockMvc.perform(post("/api/payments/gdpr/anonymize")
                    .param("customerId", "cust-1"))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 403 with blank internal header")
        void returns403WithBlankInternalHeader() throws Exception {
            mockMvc.perform(post("/api/payments/gdpr/anonymize")
                    .param("customerId", "cust-1")
                    .header("X-Internal-Service", "   "))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/payments - initiate 500 path")
    class InitiatePaymentError {

        @Test
        @DisplayName("returns 500 on initiate exception")
        void returns500OnInitiateException() throws Exception {
            when(paymentService.initiatePayment(any())).thenThrow(new RuntimeException("Razorpay down"));

            mockMvc.perform(post("/api/payments/initiate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderId\":\"order-1\",\"amount\":200.00,\"customerId\":\"cust-1\",\"storeId\":\"store-1\",\"paymentMethod\":\"UPI\"}"))
                .andExpect(status().isInternalServerError());
        }
    }
}
