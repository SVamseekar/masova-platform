package com.MaSoVa.intelligence.unit.service;

import com.MaSoVa.intelligence.client.CustomerServiceClient;
import com.MaSoVa.intelligence.client.OrderServiceClient;
import com.MaSoVa.intelligence.dto.*;
import com.MaSoVa.intelligence.service.BIEngineService;
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
@DisplayName("BIEngineService Unit Tests")
class BIEngineServiceTest {

    @Mock private OrderServiceClient orderServiceClient;
    @Mock private CustomerServiceClient customerServiceClient;

    @InjectMocks private BIEngineService biEngineService;

    @Test
    @DisplayName("generateSalesForecast returns non-null response")
    void generateSalesForecast_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

        SalesForecastResponse result = biEngineService.generateSalesForecast("store-1", "weekly", 7);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("analyzeCustomerBehavior returns non-null response")
    void analyzeCustomerBehavior_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());
        when(customerServiceClient.getAllCustomers()).thenReturn(List.of());

        CustomerBehaviorResponse result = biEngineService.analyzeCustomerBehavior("store-1");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("predictChurn returns non-null response")
    void predictChurn_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());
        when(customerServiceClient.getAllCustomers()).thenReturn(List.of());

        ChurnPredictionResponse result = biEngineService.predictChurn("store-1");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("generateDemandForecast returns non-null response")
    void generateDemandForecast_returnsResponse() {
        when(orderServiceClient.getOrdersByDate(any())).thenReturn(List.of());
        when(orderServiceClient.getOrdersByDateRange(any(), any())).thenReturn(List.of());

        DemandForecastResponse result = biEngineService.generateDemandForecast("store-1", "weekly");

        assertThat(result).isNotNull();
    }
}
