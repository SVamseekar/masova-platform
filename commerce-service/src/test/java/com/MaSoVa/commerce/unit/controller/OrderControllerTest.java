package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.service.OrderService;
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

import com.MaSoVa.commerce.order.entity.OrderItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderController Unit Tests")
class OrderControllerTest extends BaseServiceTest {

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
        o.setStatus(status);
        o.setOrderType(Order.OrderType.TAKEAWAY);
        o.setSubtotal(new BigDecimal("200.00"));
        o.setTax(new BigDecimal("10.00"));
        o.setTotal(new BigDecimal("210.00"));
        return o;
    }

    @Nested
    @DisplayName("POST /api/orders")
    class CreateOrder {

        @Test
        @DisplayName("returns 201 with created order")
        void returns201OnCreate() throws Exception {
            Order created = buildOrder("order-1", Order.OrderStatus.RECEIVED);
            when(orderService.createOrder(any())).thenReturn(created);

            mockMvc.perform(post("/api/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"storeId\":\"store-1\",\"orderType\":\"TAKEAWAY\",\"customerName\":\"Test\",\"items\":[{\"menuItemId\":\"item-1\",\"name\":\"Pizza\",\"quantity\":1,\"price\":200.0}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("order-1"))
                .andExpect(jsonPath("$.status").value("RECEIVED"));
        }
    }

    @Nested
    @DisplayName("GET /api/orders/{orderId}")
    class GetOrder {

        @Test
        @DisplayName("returns 200 for existing order")
        void returns200() throws Exception {
            when(orderService.getOrderById("order-1")).thenReturn(buildOrder("order-1", Order.OrderStatus.RECEIVED));

            mockMvc.perform(get("/api/orders/order-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("order-1"));
        }

        @Test
        @DisplayName("returns 400 for missing order (controller @ExceptionHandler maps RuntimeException to 400)")
        void returns400WhenNotFound() throws Exception {
            when(orderService.getOrderById("bad-id")).thenThrow(new RuntimeException("Order not found"));

            mockMvc.perform(get("/api/orders/bad-id"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/orders/track/{orderId}")
    class TrackOrder {

        @Test
        @DisplayName("returns 200 for public order tracking")
        void returns200Public() throws Exception {
            Order order = buildOrder("order-1", Order.OrderStatus.DISPATCHED);
            order.setCustomerName("Secret Customer");
            order.setCustomerPhone("9876543210");
            order.setCustomerEmail("secret@example.com");
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setEstimatedDeliveryTime(LocalDateTime.parse("2026-06-23T18:00:00"));
            OrderItem item = new OrderItem();
            item.setName("Margherita Pizza");
            item.setQuantity(2);
            order.setItems(List.of(item));
            when(orderService.getOrderById("order-1")).thenReturn(order);

            mockMvc.perform(get("/api/orders/track/order-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPATCHED"))
                .andExpect(jsonPath("$.estimatedDeliveryTime").exists())
                .andExpect(jsonPath("$.items[0].name").value("Margherita Pizza"))
                .andExpect(jsonPath("$.customerName").doesNotExist())
                .andExpect(jsonPath("$.customerPhone").doesNotExist())
                .andExpect(jsonPath("$.customerEmail").doesNotExist())
                .andExpect(jsonPath("$.paymentStatus").doesNotExist())
                .andExpect(jsonPath("$.deliveryAddress").doesNotExist());
        }
    }

    @Nested
    @DisplayName("POST /api/orders/{orderId}/status")
    class UpdateStatus {

        @Test
        @DisplayName("returns 200 on valid status transition")
        void returns200OnValidTransition() throws Exception {
            Order updated = buildOrder("order-1", Order.OrderStatus.PREPARING);
            when(orderService.updateOrderStatus(anyString(), any())).thenReturn(updated);

            mockMvc.perform(post("/api/orders/order-1/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"PREPARING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/orders/{orderId}")
    class CancelOrder {

        @Test
        @DisplayName("returns 200 on cancellation")
        void returns200() throws Exception {
            when(orderService.cancelOrder(anyString(), anyString()))
                .thenReturn(buildOrder("order-1", Order.OrderStatus.CANCELLED));

            mockMvc.perform(delete("/api/orders/order-1")
                    .param("reason", "Customer request"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/orders/{orderId}/quality-checkpoint")
    class QualityCheckpoint {

        @Test
        @DisplayName("returns 200 on adding checkpoint")
        void returns200() throws Exception {
            Order updated = buildOrder("order-1", Order.OrderStatus.PREPARING);
            when(orderService.addQualityCheckpoint(anyString(), any())).thenReturn(updated);

            mockMvc.perform(post("/api/orders/order-1/quality-checkpoint")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"checkpointName\":\"temperature-check\",\"status\":\"PASSED\"}"))
                .andExpect(status().isOk());
        }
    }
}
