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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderControllerPatchTest extends BaseServiceTest {

    @Mock private OrderService orderService;
    @InjectMocks private OrderController orderController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(mapper))
                .build();
    }

    private Order buildOrder(String id) {
        Order o = new Order();
        o.setId(id);
        o.setOrderNumber("ORD-001");
        o.setStoreId("store-1");
        o.setStatus(Order.OrderStatus.DISPATCHED);
        o.setOrderType(Order.OrderType.DELIVERY);
        o.setPriority(Order.Priority.NORMAL);
        o.setSubtotal(new BigDecimal("300.00"));
        o.setTax(new BigDecimal("15.00"));
        o.setTotal(new BigDecimal("315.00"));
        o.setItems(Collections.emptyList());
        return o;
    }

    // PATCH /{orderId} — makeTableStation
    @Test
    void patch_order_makeTableStation_returns_200() throws Exception {
        when(orderService.assignToMakeTable(eq("order-1"), eq("STATION-A"), eq("staff-1"), eq("Chef Bob")))
                .thenReturn(buildOrder("order-1"));

        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"makeTableStation\":\"STATION-A\",\"staffId\":\"staff-1\",\"staffName\":\"Chef Bob\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // PATCH /{orderId} — deliveredAt (mark delivered)
    @Test
    void patch_order_deliveredAt_returns_200() throws Exception {
        when(orderService.markOrderDelivered(eq("order-1"), any(), eq("OTP")))
                .thenReturn(buildOrder("order-1"));

        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deliveredAt\":\"2025-05-17T14:30:00\",\"proofType\":\"OTP\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // PATCH /{orderId} — photoUrl (delivery proof)
    @Test
    void patch_order_photoUrl_sets_delivery_proof() throws Exception {
        when(orderService.setDeliveryProof(eq("order-1"), any(), eq("http://cdn/photo.jpg"), any(), any()))
                .thenReturn(buildOrder("order-1"));

        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"photoUrl\":\"http://cdn/photo.jpg\",\"proofType\":\"PHOTO\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // PATCH /{orderId} — signatureUrl
    @Test
    void patch_order_signatureUrl_sets_delivery_proof() throws Exception {
        when(orderService.setDeliveryProof(eq("order-1"), any(), any(), eq("http://cdn/sig.jpg"), any()))
                .thenReturn(buildOrder("order-1"));

        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"signatureUrl\":\"http://cdn/sig.jpg\",\"proofType\":\"SIGNATURE\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // PATCH /{orderId} — otp
    @Test
    void patch_order_otp_sets_delivery_otp() throws Exception {
        when(orderService.setDeliveryOtp(eq("order-1"), eq("1234"), any(), any()))
                .thenReturn(buildOrder("order-1"));

        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"otp\":\"1234\",\"generatedAt\":\"2025-05-17T14:00:00\",\"expiresAt\":\"2025-05-17T14:15:00\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // PATCH /{orderId} — no recognized field returns 400
    @Test
    void patch_order_unknown_field_returns_400() throws Exception {
        mockMvc.perform(patch("/api/orders/order-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"unknownField\":\"value\"}")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isBadRequest());
    }

    // POST /{orderId}/quality-checkpoint — GET checkpoints
    @Test
    void getQualityCheckpoints_returns_200() throws Exception {
        when(orderService.getQualityCheckpoints("order-1")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/orders/order-1/quality-checkpoint"))
                .andExpect(status().isOk());
    }

    // POST /api/orders bulk create
    @Test
    void createOrder_missing_items_returns_400() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"storeId\":\"store-1\",\"orderType\":\"TAKEAWAY\",\"customerName\":\"Test\",\"items\":[]}"))
                .andExpect(status().isBadRequest());
    }
}
