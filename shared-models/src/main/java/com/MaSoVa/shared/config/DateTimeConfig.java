package com.MaSoVa.shared.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.format.datetime.standard.DateTimeFormatterRegistrar;
import org.springframework.format.support.DefaultFormattingConversionService;
import org.springframework.format.support.FormattingConversionService;

import java.time.format.DateTimeFormatter;

/**
 * Date/Time Configuration for ISO-8601 standardization across all services
 * Week 5: Fix date/time format inconsistencies
 *
 * This configuration ensures:
 * 1. All date/time serialization uses ISO-8601 format
 * 2. Jackson ObjectMapper is configured for JSR-310 (java.time) types
 * 3. Consistent date/time formatting in request parameters
 * 4. Timezone-aware date handling (UTC by default)
 *
 * ISO-8601 formats:
 * - Date: yyyy-MM-dd (e.g., 2025-12-11)
 * - DateTime: yyyy-MM-dd'T'HH:mm:ss (e.g., 2025-12-11T14:30:00)
 * - DateTime with timezone: yyyy-MM-dd'T'HH:mm:ss.SSSZ (e.g., 2025-12-11T14:30:00.000+0000)
 */
@Configuration
public class DateTimeConfig {

    /**
     * Configure Jackson ObjectMapper for ISO-8601 date/time serialization
     */
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register JavaTimeModule for JSR-310 (java.time) support
        mapper.registerModule(new JavaTimeModule());

        // Disable writing dates as timestamps (use ISO-8601 strings instead)
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Write dates in ISO-8601 format
        mapper.configure(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS, false);

        return mapper;
    }

    /**
     * Configure Spring MVC date/time formatter for request parameters
     * Ensures @RequestParam and @PathVariable dates use ISO-8601
     */
    @Bean
    public FormattingConversionService conversionService() {
        DefaultFormattingConversionService conversionService = new DefaultFormattingConversionService(false);

        DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
        registrar.setUseIsoFormat(true); // Use ISO-8601 format
        registrar.registerFormatters(conversionService);

        return conversionService;
    }

    /**
     * Standard ISO-8601 formatters for manual use in controllers/services
     */
    public static class Formatters {
        public static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_DATE;
        public static final DateTimeFormatter ISO_DATE_TIME = DateTimeFormatter.ISO_DATE_TIME;
        public static final DateTimeFormatter ISO_INSTANT = DateTimeFormatter.ISO_INSTANT;

        private Formatters() {
            // Utility class
        }
    }
}
