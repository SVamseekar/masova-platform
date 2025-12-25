package com.MaSoVa.shared.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Advanced caching configuration with multi-level caching strategy
 * Implements cache warming, invalidation policies, and connection pooling
 * Phase 13: Performance Optimization & Caching
 */
@Configuration
@EnableCaching
public class AdvancedCacheConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${cache.redis.pool.max-total:20}")
    private int maxTotal;

    @Value("${cache.redis.pool.max-idle:10}")
    private int maxIdle;

    @Value("${cache.redis.pool.min-idle:5}")
    private int minIdle;

    /**
     * Configure Redis connection factory with connection pooling
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        // Configure connection pool
        GenericObjectPoolConfig<?> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(maxTotal);
        poolConfig.setMaxIdle(maxIdle);
        poolConfig.setMinIdle(minIdle);
        poolConfig.setTestOnBorrow(true);
        poolConfig.setTestOnReturn(true);
        poolConfig.setTestWhileIdle(true);

        // Configure Lettuce client with pooling
        LettucePoolingClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
                .poolConfig(poolConfig)
                .commandTimeout(Duration.ofSeconds(5))
                .shutdownTimeout(Duration.ofMillis(100))
                .build();

        org.springframework.data.redis.connection.RedisStandaloneConfiguration redisConfig =
                new org.springframework.data.redis.connection.RedisStandaloneConfiguration(redisHost, redisPort);

        if (redisPassword != null && !redisPassword.trim().isEmpty()) {
            redisConfig.setPassword(redisPassword);
        }

        LettuceConnectionFactory factory = new LettuceConnectionFactory(redisConfig, clientConfig);
        factory.setValidateConnection(true);
        return factory;
    }

    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.findAndRegisterModules();
        return mapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer =
            new GenericJackson2JsonRedisSerializer(redisObjectMapper());

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.setDefaultSerializer(jsonSerializer);
        template.setEnableTransactionSupport(true);
        template.afterPropertiesSet();

        return template;
    }

    /**
     * Multi-level cache configuration with different TTLs for different cache types
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer serializer =
            new GenericJackson2JsonRedisSerializer(redisObjectMapper());

        // Default cache configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(serializer))
                .entryTtl(Duration.ofHours(1))
                .disableCachingNullValues()
                .enableTimeToIdle();

        // Custom cache configurations for different data types
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Menu items - cache for 2 hours (changes infrequently)
        cacheConfigurations.put("menu",
            defaultConfig.entryTtl(Duration.ofHours(2)));

        // User data - cache for 30 minutes
        cacheConfigurations.put("user",
            defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Orders - cache for 15 minutes (frequently updated)
        cacheConfigurations.put("orders",
            defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // Analytics - cache for 5 minutes (real-time data)
        cacheConfigurations.put("analytics",
            defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // Inventory - cache for 10 minutes
        cacheConfigurations.put("inventory",
            defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // Customer data - cache for 1 hour
        cacheConfigurations.put("customer",
            defaultConfig.entryTtl(Duration.ofHours(1)));

        // Reviews - cache for 1 hour
        cacheConfigurations.put("reviews",
            defaultConfig.entryTtl(Duration.ofHours(1)));

        // Payment data - cache for 5 minutes (sensitive, short TTL)
        cacheConfigurations.put("payment",
            defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // Notifications - cache for 2 minutes
        cacheConfigurations.put("notifications",
            defaultConfig.entryTtl(Duration.ofMinutes(2)));

        // Static data - cache for 24 hours
        cacheConfigurations.put("static",
            defaultConfig.entryTtl(Duration.ofHours(24)));

        // Delivery service caches
        // Performance metrics - cache for 30 minutes
        cacheConfigurations.put("performance",
            defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Route optimization - cache for 1 hour (routes don't change frequently)
        cacheConfigurations.put("routes",
            defaultConfig.entryTtl(Duration.ofHours(1)));

        // ETA calculations - cache for 5 minutes (traffic conditions change)
        cacheConfigurations.put("eta",
            defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}
