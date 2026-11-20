package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.service.OrderSummaryService;
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
import java.util.List;

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
    @Mock private OrderSummaryService orderSummaryService;
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

    @Test
    @DisplayName("CUSTOMER cannot list another customer's orders via ?customerId=")
    void customerCannotListOtherCustomerOrders() throws Exception {
        mockMvc.perform(get("/api/orders")
                .param("customerId", "other-cust")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1"))
            .andExpect(status().isForbidden());

        verify(orderService, never()).getCustomerOrders(eq("other-cust"));
    }

    @Test
    @DisplayName("CUSTOMER can list own orders via ?customerId=")
    void customerCanListOwnOrders() throws Exception {
        when(orderService.callerOwnsCustomerId("cust-1", "cust-1")).thenReturn(true);
        when(orderService.getCustomerOrders("cust-1")).thenReturn(List.of(buildOrder("o1", "cust-1", "store-a")));

        mockMvc.perform(get("/api/orders")
                .param("customerId", "cust-1")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1"))
            .andExpect(status().isOk());

        verify(orderService).getCustomerOrders("cust-1");
    }

    @Test
    @DisplayName("MANAGER can list any customer's orders via ?customerId=")
    void managerCanListAnyCustomerOrders() throws Exception {
        when(orderService.getCustomerOrders("cust-1")).thenReturn(List.of(buildOrder("o1", "cust-1", "store-a")));

        mockMvc.perform(get("/api/orders")
                .param("customerId", "cust-1")
                .header("X-User-Type", "MANAGER")
                .header("X-User-Store-Id", "store-a")
                .header("X-Selected-Store-Id", "store-a"))
            .andExpect(status().isOk());

        verify(orderService).getCustomerOrders("cust-1");
    }

    @org.junit.jupiter.params.ParameterizedTest(name = "CUSTOMER cannot list orders with ?{0}={1}")
    @org.junit.jupiter.params.provider.CsvSource({
            "search, pizza",
            "status, RECEIVED",
            "date, 2026-11-20",
            "kitchen, true",
            "startDate, 2026-11-01T00:00:00"
    })
    @DisplayName("CUSTOMER filters other than an owned customerId/number are denied")
    void customerStoreWideFiltersDenied(String param, String value) throws Exception {
        mockMvc.perform(get("/api/orders")
                .param(param, value)
                .param("endDate", "2026-11-30T00:00:00")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1")
                .header("X-User-Store-Id", "store-a"))
            .andExpect(status().isForbidden());

        org.mockito.Mockito.verifyNoInteractions(orderService);
    }

    @Test
    @DisplayName("CUSTOMER with no filter cannot list the store's orders")
    void customerNoFilterDenied() throws Exception {
        mockMvc.perform(get("/api/orders")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1")
                .header("X-User-Store-Id", "store-a"))
            .andExpect(status().isForbidden());

        org.mockito.Mockito.verifyNoInteractions(orderService);
    }

    @Test
    @DisplayName("CUSTOMER gets the same 404 for another customer's order number as for a missing one")
    void customerOtherOrderByNumberDenied() throws Exception {
        when(orderService.findOrderByNumber("ORD-001"))
                .thenReturn(java.util.Optional.of(buildOrder("o1", "other-cust", "store-a")));
        when(orderService.callerOwnsCustomerId("cust-1", "other-cust")).thenReturn(false);
        when(orderService.findOrderByNumber("ORD-404")).thenReturn(java.util.Optional.empty());

        mockMvc.perform(get("/api/orders")
                .param("number", "ORD-001")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1"))
            .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/orders")
                .param("number", "ORD-404")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1"))
            .andExpect(status().isNotFound());
        verify(orderService, never()).getOrderByNumber(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("CUSTOMER can look up own order by ?number=")
    void customerOwnOrderByNumber() throws Exception {
        when(orderService.findOrderByNumber("ORD-001"))
                .thenReturn(java.util.Optional.of(buildOrder("o1", "cust-1", "store-a")));
        when(orderService.callerOwnsCustomerId("cust-1", "cust-1")).thenReturn(true);

        mockMvc.perform(get("/api/orders")
                .param("number", "ORD-001")
                .header("X-User-Type", "CUSTOMER")
                .header("X-User-Id", "cust-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("MANAGER in store-a cannot look up a store-b order by ?number=")
    void managerCrossStoreNumberDenied() throws Exception {
        when(orderService.getOrderByNumber("ORD-001")).thenReturn(buildOrder("o1", "cust-1", "store-b"));

        mockMvc.perform(get("/api/orders")
                .param("number", "ORD-001")
                .header("X-User-Type", "MANAGER")
                .header("X-User-Store-Id", "store-a")
                .header("X-Selected-Store-Id", "store-a"))
            .andExpect(status().isForbidden());
    }
}
