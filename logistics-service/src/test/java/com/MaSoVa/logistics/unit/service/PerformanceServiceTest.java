package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.client.UserServiceClient;
import com.MaSoVa.logistics.delivery.dto.DeliveryMetricsResponse;
import com.MaSoVa.logistics.delivery.dto.DriverPerformanceResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.delivery.service.PerformanceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PerformanceService Unit Tests")
class PerformanceServiceTest {

    @Mock private DeliveryTrackingRepository deliveryTrackingRepository;
    @Mock private UserServiceClient userServiceClient;

    @InjectMocks private PerformanceService performanceService;

    private DeliveryTracking buildDelivered(int actualMinutes, boolean onTime, Integer rating) {
        DeliveryTracking t = new DeliveryTracking();
        t.setStatus("DELIVERED");
        t.setActualDeliveryMinutes(actualMinutes);
        t.setOnTime(onTime);
        t.setCustomerRating(rating);
        t.setDistanceKm(new BigDecimal("5.50"));
        return t;
    }

    private DeliveryTracking buildTracking(String status) {
        DeliveryTracking t = new DeliveryTracking();
        t.setStatus(status);
        return t;
    }

    @Nested
    @DisplayName("getDriverPerformance")
    class GetDriverPerformance {

        @Test
        @DisplayName("calculates correct metrics for driver with deliveries")
        void calculatesMetrics() {
            when(userServiceClient.getDriverDetails("driver-1"))
                .thenReturn(Map.of("name", "John Driver"));
            when(deliveryTrackingRepository.findByDriverIdAndStoreIdAndCreatedAtBetween(
                    anyString(), anyString(), any(), any()))
                .thenReturn(List.of(
                    buildDelivered(20, true, 5),
                    buildDelivered(35, false, 4),
                    buildTracking("CANCELLED")
                ));

            DriverPerformanceResponse result = performanceService.getDriverPerformance(
                "driver-1", "store-1",
                LocalDate.now().minusDays(7), LocalDate.now());

            assertThat(result.getDriverId()).isEqualTo("driver-1");
            assertThat(result.getDriverName()).isEqualTo("John Driver");
            assertThat(result.getTotalDeliveries()).isEqualTo(3);
            assertThat(result.getCompletedDeliveries()).isEqualTo(2);
            assertThat(result.getCancelledDeliveries()).isEqualTo(1);
            assertThat(result.getOnTimeDeliveries()).isEqualTo(1);
            assertThat(result.getLateDeliveries()).isEqualTo(1);
            assertThat(result.getAverageRating()).isEqualTo(4.5);
            assertThat(result.getTotalRatings()).isEqualTo(2);
            assertThat(result.getFiveStarCount()).isEqualTo(1);
            assertThat(result.getFourStarCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("returns zero metrics when no deliveries")
        void returnsZeroMetricsWhenNoDeliveries() {
            when(userServiceClient.getDriverDetails("driver-1"))
                .thenReturn(Map.of("name", "John Driver"));
            when(deliveryTrackingRepository.findByDriverIdAndStoreIdAndCreatedAtBetween(
                    anyString(), anyString(), any(), any()))
                .thenReturn(List.of());

            DriverPerformanceResponse result = performanceService.getDriverPerformance(
                "driver-1", "store-1",
                LocalDate.now().minusDays(7), LocalDate.now());

            assertThat(result.getTotalDeliveries()).isEqualTo(0);
            assertThat(result.getCompletionRate()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getAverageDeliveryTime()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getOnTimePercentage()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("returns EXCELLENT performance level for top driver")
        void returnsExcellentLevel() {
            when(userServiceClient.getDriverDetails("driver-1"))
                .thenReturn(Map.of("name", "Star Driver"));
            // All delivered, on time, 5-star ratings
            List<DeliveryTracking> deliveries = List.of(
                buildDelivered(15, true, 5),
                buildDelivered(18, true, 5),
                buildDelivered(20, true, 5)
            );
            when(deliveryTrackingRepository.findByDriverIdAndStoreIdAndCreatedAtBetween(
                    anyString(), anyString(), any(), any()))
                .thenReturn(deliveries);

            DriverPerformanceResponse result = performanceService.getDriverPerformance(
                "driver-1", "store-1",
                LocalDate.now().minusDays(7), LocalDate.now());

            assertThat(result.getPerformanceLevel()).isEqualTo("EXCELLENT");
        }

        @Test
        @DisplayName("returns NEEDS_IMPROVEMENT for poor performer")
        void returnsNeedsImprovement() {
            when(userServiceClient.getDriverDetails("driver-1"))
                .thenReturn(Map.of("name", "Poor Driver"));
            // Mix of cancelled and late, low ratings
            when(deliveryTrackingRepository.findByDriverIdAndStoreIdAndCreatedAtBetween(
                    anyString(), anyString(), any(), any()))
                .thenReturn(List.of(
                    buildTracking("CANCELLED"),
                    buildTracking("CANCELLED"),
                    buildDelivered(60, false, 2)
                ));

            DriverPerformanceResponse result = performanceService.getDriverPerformance(
                "driver-1", "store-1",
                LocalDate.now().minusDays(7), LocalDate.now());

            assertThat(result.getPerformanceLevel()).isEqualTo("NEEDS_IMPROVEMENT");
        }

        @Test
        @DisplayName("uses Unknown name when driver details has no name")
        void usesUnknownNameWhenNoName() {
            when(userServiceClient.getDriverDetails("driver-1")).thenReturn(Map.of());
            when(deliveryTrackingRepository.findByDriverIdAndStoreIdAndCreatedAtBetween(
                    anyString(), anyString(), any(), any()))
                .thenReturn(List.of());

            DriverPerformanceResponse result = performanceService.getDriverPerformance(
                "driver-1", "store-1",
                LocalDate.now().minusDays(7), LocalDate.now());

            assertThat(result.getDriverName()).isEqualTo("Unknown");
        }

        @Test
        @DisplayName("calculates distance metrics for deliveries with distance data")
        void calculatesDistanceMetrics() {
            when(userServiceClient.getDriverDetails("driver-1"))
                .thenReturn(Map.of("name", "Driver"));
            DeliveryTracking d1 = buildDelivered(20, true, 5);
            d1.setDistanceKm(new BigDecimal("4.00"));
            DeliveryTracking d2 = buildDelivered(25, true, 4);
            d2.setDistanceKm(new BigDecimal("6.00"));

            when(deliveryTrackingRepository.findByDriverIdAndStoreIdAndCreatedAtBetween(
                    anyString(), anyString(), any(), any()))
                .thenReturn(List.of(d1, d2));

            DriverPerformanceResponse result = performanceService.getDriverPerformance(
                "driver-1", "store-1",
                LocalDate.now().minusDays(7), LocalDate.now());

            assertThat(result.getTotalDistanceKm()).isEqualByComparingTo(new BigDecimal("10.00"));
            assertThat(result.getAverageDistancePerDelivery()).isEqualByComparingTo(new BigDecimal("5.00"));
        }
    }

    @Nested
    @DisplayName("getTodayMetrics")
    class GetTodayMetrics {

        @Test
        @DisplayName("calculates today metrics with deliveries")
        void calculatesTodayMetrics() {
            when(deliveryTrackingRepository.findByStoreIdAndCreatedAtBetween(anyString(), any(), any()))
                .thenReturn(List.of(
                    buildDelivered(20, true, 5),
                    buildDelivered(30, false, 3),
                    buildTracking("ASSIGNED"),
                    buildTracking("CANCELLED")
                ));

            DeliveryMetricsResponse result = performanceService.getTodayMetrics("store-1");

            assertThat(result.getTotalDeliveries()).isEqualTo(4);
            assertThat(result.getCompletedDeliveries()).isEqualTo(2);
            assertThat(result.getCancelledDeliveries()).isEqualTo(1);
            assertThat(result.getActiveDeliveries()).isEqualTo(1); // ASSIGNED
            assertThat(result.getOnTimeDeliveryRate()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("returns zeros when no deliveries today")
        void returnsZerosWhenNoDeliveries() {
            when(deliveryTrackingRepository.findByStoreIdAndCreatedAtBetween(anyString(), any(), any()))
                .thenReturn(List.of());

            DeliveryMetricsResponse result = performanceService.getTodayMetrics("store-1");

            assertThat(result.getTotalDeliveries()).isEqualTo(0);
            assertThat(result.getAverageDeliveryTime()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getOnTimeDeliveryRate()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getCustomerSatisfactionRate()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("calculates satisfaction rate from customer ratings")
        void calculatesSatisfactionRate() {
            DeliveryTracking d1 = buildDelivered(20, true, 5);
            DeliveryTracking d2 = buildDelivered(25, true, 3);

            when(deliveryTrackingRepository.findByStoreIdAndCreatedAtBetween(anyString(), any(), any()))
                .thenReturn(List.of(d1, d2));

            DeliveryMetricsResponse result = performanceService.getTodayMetrics("store-1");

            // Average rating = (5+3)/2 = 4.0
            assertThat(result.getCustomerSatisfactionRate()).isEqualByComparingTo(new BigDecimal("4.00"));
        }
    }
}
