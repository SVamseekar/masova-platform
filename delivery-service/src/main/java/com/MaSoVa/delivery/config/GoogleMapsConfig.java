package com.MaSoVa.delivery.config;

import com.google.maps.GeoApiContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Configuration for Google Maps API
 */
@Configuration
public class GoogleMapsConfig {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsConfig.class);

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
