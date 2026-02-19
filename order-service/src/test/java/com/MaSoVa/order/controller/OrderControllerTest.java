package com.MaSoVa.order.controller;

import com.MaSoVa.order.config.TestSecurityConfig;
import com.MaSoVa.order.entity.Order;
import com.MaSoVa.order.entity.Order.OrderStatus;
import com.MaSoVa.order.entity.Order.OrderType;
import com.MaSoVa.order.entity.Order.PaymentStatus;
import com.MaSoVa.order.entity.Order.Priority;
import com.MaSoVa.order.entity.OrderItem;
import com.MaSoVa.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import(TestSecurityConfig.class)
@DisplayName("OrderController Unit Tests")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        sampleOrder = Order.builder()
                .id("order-123")
                .orderNumber("ORD123456")
                .customerId("cust-1")
                .customerName("Test Customer")
                .storeId("store-1")
                .status(OrderStatus.RECEIVED)
                .orderType(OrderType.DINE_IN)
                .paymentStatus(PaymentStatus.PENDING)
                .priority(Priority.NORMAL)
                .subtotal(BigDecimal.valueOf(500))
                .deliveryFee(BigDecimal.ZERO)
                .tax(BigDecimal.valueOf(25))
                .total(BigDecimal.valueOf(525))
                .items(List.of(new OrderItem("item-1", "Margherita Pizza", 2, 250.0, "Large", null)))
                .build();
    }

    // ======================================================================
    // GET /api/orders/{orderId}
    // ======================================================================

    @Nested
    @DisplayName("GET /api/orders/{orderId}")
    class GetOrder {

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given authenticated customer and valid order ID, should return 200")
        void shouldReturnOrder() throws Exception {
            when(orderService.getOrderById("order-123")).thenReturn(sampleOrder);

            mockMvc.perform(get("/api/orders/order-123"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderNumber", is("ORD123456")))
                    .andExpect(jsonPath("$.customerName", is("Test Customer")));
        }

        @Test
        @DisplayName("Given unauthenticated request, should return 401")
        void shouldReturn401ForUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/orders/order-123"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ======================================================================
    // GET /api/orders/track/{orderId} (public)
    // ======================================================================

    @Nested
    @DisplayName("GET /api/orders/track/{orderId}")
    class TrackOrder {

        @Test
        @DisplayName("Given valid order ID, should return order without authentication")
        void shouldReturnOrderWithoutAuth() throws Exception {
            when(orderService.getOrderById("order-123")).thenReturn(sampleOrder);

            mockMvc.perform(get("/api/orders/track/order-123"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderNumber", is("ORD123456")));
        }
    }

    // ======================================================================
    // POST /api/orders
    // ======================================================================

    @Nested
    @DisplayName("POST /api/orders")
    class CreateOrder {

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given valid request, should return 201 Created")
        void shouldCreateOrder() throws Exception {
            when(orderService.createOrder(any())).thenReturn(sampleOrder);

            String requestBody = """
                    {
                        "customerName": "Test Customer",
                        "customerId": "cust-1",
                        "storeId": "store-1",
                        "orderType": "DINE_IN",
                        "items": [
                            {
                                "menuItemId": "item-1",
                                "name": "Margherita Pizza",
                                "quantity": 2,
                                "price": 250.0
                            }
                        ]
                    }
                    """;

            mockMvc.perform(post("/api/orders")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.orderNumber", is("ORD123456")));
        }

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given request without customer name, should return 400")
        void shouldReturn400ForMissingCustomerName() throws Exception {
            String requestBody = """
                    {
                        "storeId": "store-1",
                        "orderType": "DINE_IN",
                        "items": [
                            {
                                "menuItemId": "item-1",
                                "name": "Pizza",
                                "quantity": 1,
                                "price": 250.0
                            }
                        ]
                    }
                    """;

            mockMvc.perform(post("/api/orders")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given request without items, should return 400")
        void shouldReturn400ForMissingItems() throws Exception {
            String requestBody = """
                    {
                        "customerName": "Test",
                        "storeId": "store-1",
                        "orderType": "DINE_IN",
                        "items": []
                    }
                    """;

            mockMvc.perform(post("/api/orders")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(roles = "DRIVER")
        @DisplayName("Given driver role, should return 403")
        void shouldReturn403ForDriverRole() throws Exception {
            String requestBody = """
                    {
                        "customerName": "Test",
                        "storeId": "store-1",
                        "orderType": "DINE_IN",
                        "items": [
                            {
                                "menuItemId": "item-1",
                                "name": "Pizza",
                                "quantity": 1,
                                "price": 250.0
                            }
                        ]
                    }
                    """;

            mockMvc.perform(post("/api/orders")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isForbidden());
        }
    }

    // ======================================================================
    // PATCH /api/orders/{orderId}/status
    // ======================================================================

    @Nested
    @DisplayName("PATCH /api/orders/{orderId}/status")
    class UpdateOrderStatus {

        @Test
        @WithMockUser(roles = "STAFF")
        @DisplayName("Given valid status update, should return 200")
        void shouldUpdateStatus() throws Exception {
            sampleOrder.setStatus(OrderStatus.PREPARING);
            when(orderService.updateOrderStatus(eq("order-123"), any())).thenReturn(sampleOrder);

            String body = """
                    {"status": "PREPARING"}
                    """;

            mockMvc.perform(patch("/api/orders/order-123/status")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("PREPARING")));
        }

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given customer role, should return 403")
        void shouldReturn403ForCustomer() throws Exception {
            String body = """
                    {"status": "PREPARING"}
                    """;

            mockMvc.perform(patch("/api/orders/order-123/status")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isForbidden());
        }
    }

    // ======================================================================
    // DELETE /api/orders/{orderId}
    // ======================================================================

    @Nested
    @DisplayName("DELETE /api/orders/{orderId}")
    class CancelOrder {

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given customer role, should cancel order successfully")
        void shouldCancelOrder() throws Exception {
            sampleOrder.setStatus(OrderStatus.CANCELLED);
            when(orderService.cancelOrder(eq("order-123"), anyString())).thenReturn(sampleOrder);

            mockMvc.perform(delete("/api/orders/order-123")
                            .with(csrf())
                            .param("reason", "Changed my mind"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("CANCELLED")));
        }
    }

    // ======================================================================
    // GET /api/orders/kitchen
    // ======================================================================

    @Nested
    @DisplayName("GET /api/orders/kitchen")
    class GetKitchenQueue {

        @Test
        @WithMockUser(roles = "STAFF")
        @DisplayName("Given staff role, should return kitchen queue")
        void shouldReturnKitchenQueue() throws Exception {
            when(orderService.getKitchenQueue(anyString())).thenReturn(List.of(sampleOrder));

            mockMvc.perform(get("/api/orders/kitchen")
                            .header("X-Store-Id", "store-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }
    }

    // ======================================================================
    // GET /api/orders/customer/{customerId}
    // ======================================================================

    @Nested
    @DisplayName("GET /api/orders/customer/{customerId}")
    class GetCustomerOrders {

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given customer role, should return customer orders")
        void shouldReturnCustomerOrders() throws Exception {
            when(orderService.getCustomerOrders("cust-1")).thenReturn(List.of(sampleOrder));

            mockMvc.perform(get("/api/orders/customer/cust-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }

        @Test
        @WithMockUser(roles = "STAFF")
        @DisplayName("Given staff role, should return 403")
        void shouldReturn403ForStaff() throws Exception {
            mockMvc.perform(get("/api/orders/customer/cust-1"))
                    .andExpect(status().isForbidden());
        }
    }

    // ======================================================================
    // PATCH /api/orders/{orderId}/payment
    // ======================================================================

    @Nested
    @DisplayName("PATCH /api/orders/{orderId}/payment")
    class UpdatePaymentStatus {

        @Test
        @DisplayName("Given valid payment update, should return 200 (public endpoint)")
        void shouldUpdatePaymentStatus() throws Exception {
            sampleOrder.setPaymentStatus(PaymentStatus.PAID);
            when(orderService.updatePaymentStatus(eq("order-123"), any(), anyString())).thenReturn(sampleOrder);

            String body = """
                    {"status": "PAID", "transactionId": "TXN123"}
                    """;

            mockMvc.perform(patch("/api/orders/order-123/payment")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
        }
    }

    // ======================================================================
    // Error handling
    // ======================================================================

    @Nested
    @DisplayName("Error handling")
    class ErrorHandling {

        @Test
        @WithMockUser(roles = "CUSTOMER")
        @DisplayName("Given RuntimeException from service, should return 400 with error message")
        void shouldReturn400OnRuntimeException() throws Exception {
            when(orderService.getOrderById("bad-id")).thenThrow(new RuntimeException("Order not found: bad-id"));

            mockMvc.perform(get("/api/orders/bad-id"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("Order not found: bad-id")));
        }
    }
}
