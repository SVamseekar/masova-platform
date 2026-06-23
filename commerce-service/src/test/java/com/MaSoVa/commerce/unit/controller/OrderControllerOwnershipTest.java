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
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security remediation Task 6 — order ownership on GET /api/orders/{id}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OrderController ownership Tests")
class OrderControllerOwnershipTest extends BaseServiceTest {

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

    private Order buildOrder(String id, String customerId, String storeId) {
        Order o = new Order();
        o.setId(id);
        o.setCustomerId(customerId);
        o.setStoreId(storeId);
        o.setOrderNumber("ORD-001");
        o.setStatus(Order.OrderStatus.RECEIVED);
        o.setOrderType(Order.OrderType.TAKEAWAY);
        o.setTotal(new BigDecimal("100.00"));
        return o;
    }

    @Test
    @DisplayName("CUSTOMER can GET own order")
    void customerOwnOrder() throws Exception {
        Order order = buildOrder("o1", "cust-1", "store-a");
        when(orderService.assertCustomerOwnsOrder("o1", "cust-1")).thenReturn(order);

        mockMvc.perform(get("/api/orders/o1")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1"))
            .andExpect(status().isOk());

        verify(orderService).assertCustomerOwnsOrder("o1", "cust-1");
    }

    @Test
    @DisplayName("CUSTOMER GET non-own order returns 403")
    void customerOtherOrderDenied() throws Exception {
        when(orderService.assertCustomerOwnsOrder(eq("o1"), eq("intruder")))
                .thenThrow(new AccessDeniedException("Cannot access an order you do not own"));

        mockMvc.perform(get("/api/orders/o1")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "intruder"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("AGENT with session customer id can GET matching order")
    void agentMatchingCustomer() throws Exception {
        Order order = buildOrder("o1", "cust-1", "store-a");
        when(orderService.assertCustomerOwnsOrder("o1", "cust-1")).thenReturn(order);

        mockMvc.perform(get("/api/orders/o1")
                .header("X-User-Type", "AGENT")
                .header("X-User-Id", "cust-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("AGENT with wrong customer id returns 403")
    void agentWrongCustomerDenied() throws Exception {
        when(orderService.assertCustomerOwnsOrder(eq("o1"), eq("other-cust")))
                .thenThrow(new AccessDeniedException("Cannot access an order you do not own"));

        mockMvc.perform(get("/api/orders/o1")
                .header("X-User-Type", "AGENT")
                .header("X-User-Id", "other-cust"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("MANAGER in store-a cannot GET order from store-b")
    void managerCrossStoreDenied() throws Exception {
        Order order = buildOrder("o1", "cust-1", "store-b");
        when(orderService.getOrderById("o1")).thenReturn(order);

        mockMvc.perform(get("/api/orders/o1")
                .header("X-User-Type", "MANAGER")
                .header("X-User-Store-Id", "store-a")
                .header("X-Selected-Store-Id", "store-a"))
            .andExpect(status().isForbidden());

        verify(orderService, never()).assertCustomerOwnsOrder(eq("o1"), eq("cust-1"));
    }

    @Test
    @DisplayName("MANAGER in same store can GET order")
    void managerSameStore() throws Exception {
        Order order = buildOrder("o1", "cust-1", "store-a");
        when(orderService.getOrderById("o1")).thenReturn(order);

        mockMvc.perform(get("/api/orders/o1")
                .header("X-User-Type", "MANAGER")
                .header("X-User-Store-Id", "store-a")
                .header("X-Selected-Store-Id", "store-a"))
            .andExpect(status().isOk());
    }
}