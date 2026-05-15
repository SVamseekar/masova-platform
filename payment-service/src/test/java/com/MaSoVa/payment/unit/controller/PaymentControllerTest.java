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
    }
}
