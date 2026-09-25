package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.config.SecurityConfig;
import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.service.OrderSummaryService;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Customer cancel contract shared with masova-mobile 7f54fa8.
 * A customer JWT may POST /api/orders/{id}/cancel-request and may not DELETE /api/orders/{id}.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = OrderCustomerCancelContractTest.TestConfig.class)
@TestPropertySource(properties = "jwt.secret=" + OrderCustomerCancelContractTest.JWT_SECRET)
class OrderCustomerCancelContractTest {

    static final String JWT_SECRET =
            "contract-test-jwt-secret-at-least-sixty-four-characters-long-for-hs512";

    @Autowired
    private OrderController orderController;

    @Autowired
    private OrderService orderService;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;
    private String customerJwt;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .apply(springSecurity(springSecurityFilterChain))
                .build();
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        customerJwt = Jwts.builder()
                .subject("cust-1")
                .claim("email", "cust@example.com")
                .claim("roles", List.of("CUSTOMER"))
                .claim("storeId", "store-1")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(key)
                .compact();
    }

    @Test
    @DisplayName("customer JWT cannot DELETE /api/orders/{id}")
    void customerJwtCannotDeleteOrder() throws Exception {
        mockMvc.perform(delete("/api/orders/o1")
                        .header("Authorization", "Bearer " + customerJwt)
                        .header("X-User-Type", "CUSTOMER")
                        .header("X-User-Id", "cust-1"))
                .andExpect(status().isForbidden());

        verify(orderService, never()).cancelOrder(any(), any());
    }

    @Test
    @DisplayName("customer JWT can POST /api/orders/{id}/cancel-request")
    void customerJwtCanPostCancelRequest() throws Exception {
        Order order = new Order();
        order.setId("o1");
        order.setCustomerId("cust-1");
        order.setStoreId("store-1");
        order.setStatus(Order.OrderStatus.PREPARING);
        order.setOrderType(Order.OrderType.TAKEAWAY);
        order.setTotal(new BigDecimal("12.00"));
        when(orderService.assertCustomerOwnsOrder("o1", "cust-1")).thenReturn(order);
        when(orderService.requestCancellation(eq("o1"), eq("changed mind"), eq("cust-1"))).thenReturn(order);

        mockMvc.perform(post("/api/orders/o1/cancel-request")
                        .header("Authorization", "Bearer " + customerJwt)
                        .header("X-User-Type", "CUSTOMER")
                        .header("X-User-Id", "cust-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"changed mind\"}"))
                .andExpect(status().isOk());

        verify(orderService).requestCancellation("o1", "changed mind", "cust-1");
        verify(orderService, never()).cancelOrder(any(), any());
    }

    @Configuration
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean
        OrderService orderService() {
            return mock(OrderService.class);
        }

        @Bean
        OrderSummaryService orderSummaryService() {
            return mock(OrderSummaryService.class);
        }

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper().registerModule(new JavaTimeModule());
        }

        @Bean
        JwtTokenProvider jwtTokenProvider() {
            return new JwtTokenProvider();
        }

        @Bean
        OrderController orderController(OrderService orderService,
                                        OrderSummaryService orderSummaryService,
                                        ObjectMapper objectMapper) {
            return new OrderController(orderService, orderSummaryService, objectMapper);
        }
    }
}
