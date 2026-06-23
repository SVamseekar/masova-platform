package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security remediation Task 4 — Part A: cancel-request endpoint ownership + routing.
 * (Standalone MockMvc bypasses @PreAuthorize; this verifies the inline ownership check.)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OrderController cancel-request Tests")
class OrderControllerCancellationRequestTest extends BaseServiceTest {

    @Mock private OrderService orderService;
    @InjectMocks private OrderController orderController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
            .build();
    }

    private Order buildOrder(String id, String customerId) {
        Order o = new Order();
        o.setId(id);
        o.setOrderNumber("ORD-001");
        o.setStoreId("store-1");
        o.setCustomerId(customerId);
        o.setStatus(Order.OrderStatus.PREPARING);
        o.setOrderType(Order.OrderType.TAKEAWAY);
        o.setTotal(new BigDecimal("210.00"));
        return o;
    }

    @Test
    @DisplayName("owning customer can request cancellation")
    void owningCustomerCanRequest() throws Exception {
        Order order = buildOrder("o1", "cust-1");
        when(orderService.assertCustomerOwnsOrder("o1", "cust-1")).thenReturn(order);
        when(orderService.requestCancellation(eq("o1"), any(), eq("cust-1"))).thenReturn(order);

        mockMvc.perform(post("/api/orders/o1/cancel-request")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"changed mind\"}"))
            .andExpect(status().isOk());

        verify(orderService).requestCancellation(eq("o1"), eq("changed mind"), eq("cust-1"));
    }

    @Test
    @DisplayName("non-owning customer is denied (403) and service is not called")
    void nonOwningCustomerDenied() throws Exception {
        when(orderService.assertCustomerOwnsOrder("o1", "intruder-cust"))
                .thenThrow(new org.springframework.security.access.AccessDeniedException("Cannot access an order you do not own"));

        mockMvc.perform(post("/api/orders/o1/cancel-request")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "intruder-cust")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"steal\"}"))
            .andExpect(status().isForbidden());

        verify(orderService, never()).requestCancellation(any(), any(), any());
    }

    @Test
    @DisplayName("agent on behalf of owning customer routes to cancel-request, not direct cancel")
    void agentRequestRoutesToRequestNotCancel() throws Exception {
        Order order = buildOrder("o1", "cust-1");
        when(orderService.assertCustomerOwnsOrder("o1", "cust-1")).thenReturn(order);
        when(orderService.requestCancellation(eq("o1"), any(), eq("cust-1"))).thenReturn(order);

        mockMvc.perform(post("/api/orders/o1/cancel-request")
                .header("X-User-Type", "AGENT")
                .header("X-User-Id", "cust-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"customer asked\"}"))
            .andExpect(status().isOk());

        verify(orderService).assertCustomerOwnsOrder("o1", "cust-1");
        verify(orderService).requestCancellation(eq("o1"), eq("customer asked"), eq("cust-1"));
        verify(orderService, never()).cancelOrder(any(), any());
    }

    @Test
    @DisplayName("agent acting for non-owner customer is denied (403)")
    void agentNonOwnerDenied() throws Exception {
        when(orderService.assertCustomerOwnsOrder("o1", "other-cust"))
                .thenThrow(new org.springframework.security.access.AccessDeniedException("Cannot access an order you do not own"));

        mockMvc.perform(post("/api/orders/o1/cancel-request")
                .header("X-User-Type", "AGENT")
                .header("X-User-Id", "other-cust")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"customer asked\"}"))
            .andExpect(status().isForbidden());

        verify(orderService, never()).requestCancellation(any(), any(), any());
    }

    @Test
    @DisplayName("manager approve routes to approveCancellationRequest")
    void managerApprove() throws Exception {
        Order order = buildOrder("o1", "cust-1");
        order.setStatus(Order.OrderStatus.CANCELLED);
        when(orderService.approveCancellationRequest("o1")).thenReturn(order);

        mockMvc.perform(post("/api/orders/o1/cancel-request/approve"))
            .andExpect(status().isOk());

        verify(orderService).approveCancellationRequest("o1");
    }

    @Test
    @DisplayName("manager reject routes to rejectCancellationRequest")
    void managerReject() throws Exception {
        Order order = buildOrder("o1", "cust-1");
        when(orderService.rejectCancellationRequest(eq("o1"), any())).thenReturn(order);

        mockMvc.perform(post("/api/orders/o1/cancel-request/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"already cooking\"}"))
            .andExpect(status().isOk());

        verify(orderService).rejectCancellationRequest("o1", "already cooking");
    }
}
