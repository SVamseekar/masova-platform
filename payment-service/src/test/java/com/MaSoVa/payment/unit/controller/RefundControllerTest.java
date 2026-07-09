package com.MaSoVa.payment.unit.controller;

import com.MaSoVa.payment.controller.RefundController;
import com.MaSoVa.payment.entity.Refund;
import com.MaSoVa.payment.service.RefundService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefundController Unit Tests")
class RefundControllerTest extends BaseServiceTest {

    @Mock private RefundService refundService;
    @InjectMocks private RefundController refundController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(refundController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Refund buildRefund(String id) {
        Refund r = new Refund();
        r.setId(id);
        return r;
    }

    @Test
    @DisplayName("POST /api/payments/refund returns 201 on successful refund")
    void initiateRefund_returns201() throws Exception {
        when(refundService.initiateRefund(any())).thenReturn(buildRefund("refund-1"));

        mockMvc.perform(post("/api/payments/refund")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"transactionId\":\"txn-1\",\"amount\":200.00,\"type\":\"PARTIAL\",\"reason\":\"Customer request\",\"initiatedBy\":\"manager-1\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/payments/refund/{refundId} returns 200 for existing refund")
    void getRefund_returns200() throws Exception {
        when(refundService.getRefund("refund-1")).thenReturn(buildRefund("refund-1"));

        mockMvc.perform(get("/api/payments/refund/refund-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/payments/refund/{refundId} returns 404 when not found")
    void getRefund_returns404() throws Exception {
        when(refundService.getRefund("bad-id")).thenThrow(new RuntimeException("Refund not found"));

        mockMvc.perform(get("/api/payments/refund/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/payments/refund returns 200 with list by transactionId")
    void getRefunds_returns200ByTransactionId() throws Exception {
        when(refundService.getRefundsByTransactionId(anyString())).thenReturn(List.of(buildRefund("refund-1")));

        mockMvc.perform(get("/api/payments/refund").param("transactionId", "txn-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/payments/refund returns 200 with list by orderId")
    void getRefunds_returns200ByOrderId() throws Exception {
        when(refundService.getRefundsByOrderId(anyString())).thenReturn(List.of(buildRefund("refund-1")));

        mockMvc.perform(get("/api/payments/refund").param("orderId", "order-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/payments/refund returns 200 with list by customerId")
    void getRefunds_returns200ByCustomerId() throws Exception {
        when(refundService.getRefundsByCustomerId(anyString())).thenReturn(List.of(buildRefund("refund-1")));

        mockMvc.perform(get("/api/payments/refund").param("customerId", "cust-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/payments/refund returns 400 with no params and no store header")
    void getRefunds_returns400WithNoParams() throws Exception {
        mockMvc.perform(get("/api/payments/refund"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/payments/refund?storeId= lists store refunds")
    void getRefunds_returns200ByStoreId() throws Exception {
        when(refundService.getRefundsByStoreId("DOM001")).thenReturn(List.of(buildRefund("refund-1")));

        mockMvc.perform(get("/api/payments/refund").param("storeId", "DOM001"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/payments/refund?storeId=&status=PENDING_APPROVAL for manager queue")
    void getRefunds_returnsPendingByStore() throws Exception {
        when(refundService.getRefundsByStoreIdAndStatus("DOM001", Refund.RefundStatus.PENDING_APPROVAL))
            .thenReturn(List.of(buildRefund("refund-pending")));

        mockMvc.perform(get("/api/payments/refund")
                .param("storeId", "DOM001")
                .param("status", "PENDING_APPROVAL"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/payments/refunds plural alias works")
    void getRefunds_pluralAlias() throws Exception {
        when(refundService.getRefundsByStoreId("DOM001")).thenReturn(List.of(buildRefund("refund-1")));

        mockMvc.perform(get("/api/payments/refunds").param("storeId", "DOM001"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/refund returns 500 on exception")
    void initiateRefund_returns500OnException() throws Exception {
        when(refundService.initiateRefund(any())).thenThrow(new RuntimeException("Razorpay error"));

        mockMvc.perform(post("/api/payments/refund")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"transactionId\":\"txn-1\",\"amount\":200.00,\"type\":\"PARTIAL\",\"reason\":\"Customer request\",\"initiatedBy\":\"manager-1\"}"))
            .andExpect(status().isInternalServerError());
    }
}
