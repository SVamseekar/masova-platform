package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.service.OrderSummaryService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

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
}
