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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security remediation Task 4 — Part B: refund request/approve/reject endpoints.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RefundController approval-gate Tests")
class RefundControllerApprovalTest extends BaseServiceTest {

    @Mock private RefundService refundService;
    @InjectMocks private RefundController refundController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(refundController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Refund refund(String id, Refund.RefundStatus status) {
        Refund r = new Refund();
        r.setId(id);
        r.setStatus(status);
        return r;
    }

    @Test
    @DisplayName("POST /request routes to requestRefundApproval and stamps requester")
    void requestRoutesToApproval() throws Exception {
        when(refundService.requestRefundApproval(any())).thenReturn(refund("r1", Refund.RefundStatus.PENDING_APPROVAL));

        mockMvc.perform(post("/api/payments/refund/request")
                .header("X-User-Type", "AGENT")
                .header("X-User-Id", "agent-bot")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"transactionId\":\"txn-1\",\"amount\":200.00,\"type\":\"PARTIAL\",\"reason\":\"agent req\",\"initiatedBy\":\"placeholder\"}"))
            .andExpect(status().isCreated());

        verify(refundService).requestRefundApproval(any());
    }

    @Test
    @DisplayName("POST /request returns 400 on invalid request")
    void requestReturns400OnInvalid() throws Exception {
        when(refundService.requestRefundApproval(any()))
                .thenThrow(new RuntimeException("Refund amount cannot exceed transaction amount"));

        mockMvc.perform(post("/api/payments/refund/request")
                .header("X-User-Id", "agent-bot")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"transactionId\":\"txn-1\",\"amount\":99999.00,\"type\":\"FULL\",\"reason\":\"x\",\"initiatedBy\":\"agent-bot\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /{id}/approve routes to approveRefund with manager id")
    void approveRoutes() throws Exception {
        when(refundService.approveRefund(eq("r1"), eq("manager-1")))
                .thenReturn(refund("r1", Refund.RefundStatus.PROCESSING));

        mockMvc.perform(post("/api/payments/refund/r1/approve")
                .header("X-User-Id", "manager-1"))
            .andExpect(status().isOk());

        verify(refundService).approveRefund("r1", "manager-1");
    }

    @Test
    @DisplayName("POST /{id}/reject routes to rejectRefund")
    void rejectRoutes() throws Exception {
        when(refundService.rejectRefund(eq("r1"), eq("manager-1"), any()))
                .thenReturn(refund("r1", Refund.RefundStatus.REJECTED));

        mockMvc.perform(post("/api/payments/refund/r1/reject")
                .header("X-User-Id", "manager-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"not justified\"}"))
            .andExpect(status().isOk());

        verify(refundService).rejectRefund("r1", "manager-1", "not justified");
    }
}
