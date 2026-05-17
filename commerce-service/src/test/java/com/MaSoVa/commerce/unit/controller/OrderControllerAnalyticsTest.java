package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.OrderController;
import com.MaSoVa.commerce.order.dto.PosStaffPerformanceDTO;
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
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderControllerAnalyticsTest extends BaseServiceTest {

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

    // type=kitchen
    @Test
    void analytics_kitchen_returns_200() throws Exception {
        when(orderService.getKitchenStaffPerformance(eq("staff-1"), any()))
                .thenReturn(Map.of("totalOrders", 5));

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "kitchen")
                        .param("staffId", "staff-1")
                        .param("date", "2025-05-17")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    @Test
    void analytics_kitchen_without_staffId_returns_400() throws Exception {
        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "kitchen")
                        .param("date", "2025-05-17")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isBadRequest());
    }

    // type=pos
    @Test
    void analytics_pos_returns_200() throws Exception {
        PosStaffPerformanceDTO dto = new PosStaffPerformanceDTO(10L, BigDecimal.valueOf(2000), 8L, 2L, "staff-1", "Alice");
        when(orderService.getPosStaffPerformance(eq("staff-1"), any(), any())).thenReturn(dto);

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "pos")
                        .param("staffId", "staff-1")
                        .param("startDate", "2025-05-01")
                        .param("endDate", "2025-05-17")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    @Test
    void analytics_pos_without_dates_returns_400() throws Exception {
        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "pos")
                        .param("staffId", "staff-1")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isBadRequest());
    }

    // type=prep-time
    @Test
    void analytics_prep_time_returns_200() throws Exception {
        when(orderService.getAveragePreparationTime(eq("store-1"), any())).thenReturn(25.0);

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "prep-time")
                        .param("date", "2025-05-17")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    @Test
    void analytics_prep_time_without_date_returns_400() throws Exception {
        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "prep-time")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isBadRequest());
    }

    // type=prep-time-by-item
    @Test
    void analytics_prep_time_by_item_returns_200() throws Exception {
        when(orderService.getAveragePreparationTimeByMenuItem(eq("store-1"), any()))
                .thenReturn(Map.of("Pizza", 22.0));

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "prep-time-by-item")
                        .param("date", "2025-05-17")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // type=prep-time-distribution
    @Test
    void analytics_prep_time_distribution_returns_200() throws Exception {
        when(orderService.getPreparationTimeDistribution(eq("store-1"), any()))
                .thenReturn(Map.of("min", 10, "max", 40, "average", 25.0));

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "prep-time-distribution")
                        .param("date", "2025-05-17")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // type=failed-quality
    @Test
    void analytics_failed_quality_returns_200() throws Exception {
        when(orderService.getOrdersWithFailedQualityChecks("store-1"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "failed-quality")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // type=make-table-station
    @Test
    void analytics_make_table_station_returns_200() throws Exception {
        when(orderService.getOrdersByMakeTableStation(eq("store-1"), eq("STATION-A")))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "make-table-station")
                        .param("station", "STATION-A")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // invalid date format
    @Test
    void analytics_invalid_date_returns_400() throws Exception {
        mockMvc.perform(get("/api/orders/analytics")
                        .param("type", "prep-time")
                        .param("date", "not-a-date")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isBadRequest());
    }

    // GET /api/orders with date param
    @Test
    void getOrders_with_date_returns_200() throws Exception {
        when(orderService.getOrdersByDate(eq("store-1"), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/orders")
                        .param("date", "2025-05-17")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }

    // GET /api/orders with startDate + endDate
    @Test
    void getOrders_with_date_range_returns_200() throws Exception {
        when(orderService.getOrdersByDateRange(eq("store-1"), any(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/orders")
                        .param("startDate", "2025-05-01T00:00:00")
                        .param("endDate", "2025-05-17T23:59:59")
                        .header("X-User-Store-Id", "store-1")
                        .header("X-User-Type", "MANAGER"))
                .andExpect(status().isOk());
    }

    // GET /api/orders with order number
    @Test
    void getOrders_by_number_returns_200() throws Exception {
        Order order = new Order();
        order.setOrderNumber("ORD-001");
        when(orderService.getOrderByNumber("ORD-001")).thenReturn(order);

        mockMvc.perform(get("/api/orders")
                        .param("number", "ORD-001")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }

    // GET /api/orders with kitchen=true
    @Test
    void getOrders_kitchen_flag_returns_kitchen_queue() throws Exception {
        when(orderService.getKitchenQueue("store-1")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/orders")
                        .param("kitchen", "true")
                        .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
    }
}
