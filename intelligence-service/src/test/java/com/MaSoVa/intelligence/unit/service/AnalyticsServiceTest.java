package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.client.UserServiceClient;
import com.MaSoVa.intelligence.dto.*;
import com.MaSoVa.intelligence.service.AnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AnalyticsService Unit Tests")
class AnalyticsServiceTest {

    @Mock private OrderServiceClient orderServiceClient;
    @Mock private UserServiceClient userServiceClient;

    @InjectMocks private AnalyticsService analyticsService;

    @Test
    @DisplayName("getTodaySalesMetrics returns non-null response")
    void getTodaySalesMetrics_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

        SalesMetricsResponse result = analyticsService.getTodaySalesMetrics("store-1");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getAverageOrderValue returns non-null response")
    void getAverageOrderValue_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

        AverageOrderValueResponse result = analyticsService.getAverageOrderValue("store-1");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getOrderTypeBreakdown returns non-null response")
    void getOrderTypeBreakdown_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

        OrderTypeBreakdownResponse result = analyticsService.getOrderTypeBreakdown("store-1");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getPeakHours returns non-null response")
    void getPeakHours_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

        PeakHoursResponse result = analyticsService.getPeakHours("store-1");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getSalesTrends returns non-null response for daily period")
    void getSalesTrends_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

        SalesTrendResponse result = analyticsService.getSalesTrends("store-1", "daily");

        assertThat(result).isNotNull();
    }
}
