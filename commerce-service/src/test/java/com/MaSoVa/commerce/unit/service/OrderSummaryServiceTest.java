package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.service.OrderSummaryService;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class OrderSummaryServiceTest {

    @Test
    void berlinDayBoundsConvertToUtc() {
        LocalDate date = LocalDate.of(2026, 9, 14);
        LocalDateTime start = OrderSummaryService.toUtcStart(date);
        LocalDateTime end = OrderSummaryService.toUtcEnd(date);

        assertThat(start).isBefore(end);
        assertThat(end.toInstant(ZoneOffset.UTC).toEpochMilli() - start.toInstant(ZoneOffset.UTC).toEpochMilli())
                .isGreaterThan(20 * 3600_000L);
        assertThat(start.getHour()).isIn(21, 22);
    }

    /**
     * Reproduces: with days=3, weekStart (today.minusDays(6)) falls before rangeStartDate
     * (today.minusDays(2)), so fillMissingDays never backfills days 3-6 and weekSales/
     * weekOrders silently undercount instead of covering the full trailing week.
     */
    @Test
    void weekWindowNeverExtendsBeforeRequestedRangeStart() throws Exception {
        LocalDate today = LocalDate.of(2026, 9, 16);
        int days = 3;
        LocalDate rangeStartDate = today.minusDays(days - 1L);

        List<Map<String, Object>> byDay = new ArrayList<>();
        Method fillMissingDays = OrderSummaryService.class.getDeclaredMethod(
                "fillMissingDays", List.class, LocalDate.class, LocalDate.class);
        fillMissingDays.setAccessible(true);
        fillMissingDays.invoke(null, byDay, rangeStartDate, today);

        LocalDate weekStart = today.minusDays(6);
        Method clampWeekStart = OrderSummaryService.class.getDeclaredMethod(
                "clampWeekStart", LocalDate.class, LocalDate.class);
        clampWeekStart.setAccessible(true);
        LocalDate effectiveWeekStart = (LocalDate) clampWeekStart.invoke(null, weekStart, rangeStartDate);

        assertThat(effectiveWeekStart).isEqualTo(rangeStartDate);
        assertThat(effectiveWeekStart).isAfterOrEqualTo(rangeStartDate);

        boolean allDaysWithinFetchedRange = byDay.stream()
                .map(row -> LocalDate.parse(String.valueOf(row.get("date"))))
                .allMatch(d -> !d.isBefore(rangeStartDate));
        assertThat(allDaysWithinFetchedRange).isTrue();
    }
}
