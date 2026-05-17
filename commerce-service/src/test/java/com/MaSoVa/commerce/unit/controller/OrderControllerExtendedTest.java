package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderControllerExtendedTest extends BaseServiceTest {

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

    private Order buildOrder(String id, Order.OrderStatus status) {
        Order o = new Order();
        o.setId(id);
        o.setOrderNumber("ORD-001");
        o.setStoreId("store-1");
        o.setCustomerId("cust-1");
        o.setStatus(status);
        o.setOrderType(Order.OrderType.TAKEAWAY);
        o.setPriority(Order.Priority.NORMAL);
        o.setSubtotal(new BigDecimal("200.00"));
        o.setTax(new BigDecimal("10.00"));
        o.setTotal(new BigDecimal("210.00"));
        o.setItems(Collections.emptyList());
        return o;
    }

    // POST /api/orders/{orderId}/next-stage
    @Test
    void nextStage_returns_200() throws Exception {
        when(orderService.moveOrderToNextStage("order-1"))
                .thenReturn(buildOrder("order-1", Order.OrderStatus.PREPARING));

        mockMvc.perform(post("/api/orders/order-1/next-stage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));
    }

    // GET /api/orders (store orders) — must pass X-User-Store-Id header
    @Test
    void getOrders_by_storeId_returns_list() throws Exception {
        when(orderService.getStoreOrders("store-1"))
                .thenReturn(List.of(buildOrder("order-1", Order.OrderStatus.RECEIVED)));

        mockMvc.perform(get("/api/orders")
                        .param("storeId", "store-1")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }

    @Test
    void getOrders_by_customerId_returns_list() throws Exception {
        when(orderService.getCustomerOrders("cust-1"))
                .thenReturn(List.of(buildOrder("order-1", Order.OrderStatus.DELIVERED)));

        mockMvc.perform(get("/api/orders")
                        .param("customerId", "cust-1")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }

    @Test
    void getOrders_by_status_returns_filtered_list() throws Exception {
        when(orderService.getOrdersByStatus(eq("store-1"), eq(Order.OrderStatus.PREPARING)))
                .thenReturn(List.of(buildOrder("order-1", Order.OrderStatus.PREPARING)));

        mockMvc.perform(get("/api/orders")
                        .param("storeId", "store-1")
                        .param("status", "PREPARING")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }

    // GET /api/orders/kitchen-queue
    @Test
    void kitchenQueue_returns_orders() throws Exception {
        when(orderService.getKitchenQueue("store-1"))
                .thenReturn(List.of(buildOrder("order-1", Order.OrderStatus.RECEIVED)));

        mockMvc.perform(get("/api/orders/kitchen-queue")
                        .param("storeId", "store-1")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // PATCH /api/orders/{orderId}/payment — uses X-Internal-Service to bypass role check
    @Test
    void updatePaymentStatus_returns_200_with_internal_header() throws Exception {
        when(orderService.updatePaymentStatus(eq("order-1"), any(), any()))
                .thenReturn(buildOrder("order-1", Order.OrderStatus.RECEIVED));

        mockMvc.perform(patch("/api/orders/order-1/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PAID\",\"transactionId\":\"txn-123\"}")
                        .header("X-Internal-Service", "payment-service"))
                .andExpect(status().isOk());
    }

    // PATCH /api/orders/{orderId} (update order priority — simpler body)
    @Test
    void updateOrder_priority_returns_200() throws Exception {
        when(orderService.updateOrderPriority(eq("order-1"), eq(Order.Priority.URGENT)))
                .thenReturn(buildOrder("order-1", Order.OrderStatus.RECEIVED));

        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"priority\":\"URGENT\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // POST /api/orders/gdpr/anonymize — requires X-Internal-Service header
    @Test
    void anonymizeCustomerOrders_returns_200_with_internal_header() throws Exception {
        mockMvc.perform(post("/api/orders/gdpr/anonymize")
                        .param("customerId", "cust-1")
                        .header("X-Internal-Service", "core-service"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymizeCustomerOrders_returns_403_without_internal_header() throws Exception {
        mockMvc.perform(post("/api/orders/gdpr/anonymize")
                        .param("customerId", "cust-1"))
                .andExpect(status().isForbidden());
    }

    // GET /api/orders with search
    @Test
    void getOrders_search_returns_results() throws Exception {
        when(orderService.searchOrders(eq("store-1"), eq("pizza")))
                .thenReturn(List.of(buildOrder("order-1", Order.OrderStatus.RECEIVED)));

        mockMvc.perform(get("/api/orders")
                        .param("storeId", "store-1")
                        .param("search", "pizza")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }

    // PATCH /api/orders/{orderId}/quality-checkpoint/{checkpointName}
    @Test
    void updateQualityCheckpoint_returns_200() throws Exception {
        when(orderService.updateQualityCheckpoint(eq("order-1"), eq("temp-check"), any(), any()))
                .thenReturn(buildOrder("order-1", Order.OrderStatus.PREPARING));

        mockMvc.perform(patch("/api/orders/order-1/quality-checkpoint/temp-check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PASSED\",\"notes\":\"OK\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // PATCH /api/orders/{orderId} assign driver via body field
    @Test
    void updateOrder_assignDriver_returns_200() throws Exception {
        when(orderService.assignDriver(eq("order-1"), eq("driver-1"), any(), any()))
                .thenReturn(buildOrder("order-1", Order.OrderStatus.DISPATCHED));

        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"driverId\":\"driver-1\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // GET /api/orders/analytics — type=active-deliveries (simplest, no extra params needed)
    @Test
    void getAnalytics_active_deliveries_returns_200() throws Exception {
        when(orderService.getActiveDeliveryCount("store-1")).thenReturn(3);

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "active-deliveries")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }

    // GET /api/orders/analytics — no type returns 400
    @Test
    void getAnalytics_without_type_returns_400() throws Exception {
        mockMvc.perform(get("/api/orders/analytics")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isBadRequest());
    }

    // RuntimeException → 400
    @Test
    void runtimeException_mapped_to_400() throws Exception {
        when(orderService.moveOrderToNextStage("bad-id"))
                .thenThrow(new RuntimeException("Order not found"));

        mockMvc.perform(post("/api/orders/bad-id/next-stage"))
                .andExpect(status().isBadRequest());
    }
}
