package com.MaSoVa.commerce.order.config;

import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;

import java.time.Duration;

/**
 * Cache configuration for commerce-service.
 *
 * The default Spring Boot RedisCacheManager disallows null values, which causes
 * a runtime exception when @Cacheable methods return null or Optional.empty().
 * This config allows nulls for the menuItems cache (item lookups by ID may
 * return empty when an item is not found) and sets a sensible TTL.
 */
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {
        return builder -> builder
                .withCacheConfiguration("menuItems",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(30))
                                .allowCachingNullValues());
    }
}
