package com.MaSoVa.delivery.config;

import com.google.maps.GeoApiContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Configuration for Google Maps API
 */
@Configuration
@Slf4j
public class GoogleMapsConfig {

    @Value("${google.maps.api-key}")
    private String apiKey;

    @Bean
    public GeoApiContext geoApiContext() {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Google Maps API key not configured. Route optimization features will be limited.");
            return null;
        }

        return new GeoApiContext.Builder()
                .apiKey(apiKey)
                .maxRetries(3)
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build();
    }
}
