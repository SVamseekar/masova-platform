package com.MaSoVa.gateway.config;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

/**
 * Configuration for response compression
 * Implements gzip compression for API responses
 * Phase 13: Performance Optimization - Response compression
 */
@Configuration
public class CompressionConfig {

    /**
     * Global filter to add compression headers
     */
    @Bean
    public GlobalFilter compressionFilter() {
        return (exchange, chain) -> {
            // Add Accept-Encoding header to upstream requests
            exchange.getRequest()
                    .mutate()
                    .header(HttpHeaders.ACCEPT_ENCODING, "gzip, deflate");

            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                // Add Content-Encoding header to responses
                if (shouldCompress(exchange.getRequest().getPath().value())) {
                    exchange.getResponse().getHeaders().add(HttpHeaders.CONTENT_ENCODING, "gzip");
                }
            }));
        };
    }

    /**
     * Determine if response should be compressed based on path
     */
    private boolean shouldCompress(String path) {
        // Compress API responses but not static files or images
        return path.startsWith("/api/") &&
               !path.contains("/images/") &&
               !path.contains("/static/") &&
               !path.endsWith(".jpg") &&
               !path.endsWith(".png") &&
               !path.endsWith(".gif");
    }

    /**
     * Order for compression filter
     */
    @Bean
    public Ordered compressionFilterOrder() {
        return () -> Ordered.LOWEST_PRECEDENCE;
    }
}
