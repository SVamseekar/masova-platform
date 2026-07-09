package com.MaSoVa.shared.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectMapper.DefaultTyping;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.api.StatefulConnection;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Advanced caching configuration with multi-level caching strategy
 * Implements cache warming, invalidation policies, and connection pooling
 * Phase 13: Performance Optimization & Caching
 *
 * <p><b>Type-safe Redis values:</b> the ObjectMapper used for cache values must
 * activate default typing. Without it, {@code @Cacheable} round-trips deserialize
 * to {@link java.util.LinkedHashMap} and throw ClassCastException on cache hits
 * (intelligence analytics/BI Phase D regression).
 */
@Configuration
@EnableCaching
public class AdvancedCacheConfig {

    private static final Logger log = LoggerFactory.getLogger(AdvancedCacheConfig.class);

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
        GenericObjectPoolConfig<StatefulConnection<?, ?>> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(maxTotal);
        poolConfig.setMaxIdle(maxIdle);
        poolConfig.setMinIdle(minIdle);
        poolConfig.setTestOnBorrow(true);
        poolConfig.setTestOnReturn(true);
        poolConfig.setTestWhileIdle(true);

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

    /**
     * ObjectMapper for Redis values only (not an HTTP bean). Embeds Java type metadata
     * so cache hits reconstruct DTOs instead of raw LinkedHashMap.
     * <p>Must NOT be a Spring {@code ObjectMapper} bean — Boot would pick it up for
     * REST serialization and leak {@code @class} into API responses.
     */
    private static ObjectMapper createRedisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.findAndRegisterModules();
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return mapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(createRedisObjectMapper());

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
     * Multi-level cache configuration with different TTLs for different cache types.
     * {@link Primary} so service-local CacheManager beans without typing cannot win.
     */
    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(createRedisObjectMapper());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(serializer))
                .entryTtl(Duration.ofHours(1))
                .disableCachingNullValues()
                .enableTimeToIdle();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        cacheConfigurations.put("menu", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigurations.put("user", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("orders", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put("analytics", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("inventory", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("customer", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("reviews", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("payment", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("notifications", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigurations.put("static", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("performance", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("routes", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("eta", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // Intelligence-service @Cacheable names (Phase D analytics / BI)
        Duration analyticsTtl = Duration.ofMinutes(5);
        for (String name : new String[]{
                "salesMetrics", "staffLeaderboard", "staffPerformance", "driverStatus",
                "salesTrends", "orderTypeBreakdown", "peakHours", "topProducts",
                "salesForecast", "customerBehavior", "churnPrediction", "demandForecast",
                "costAnalysis", "executiveSummary", "benchmarking"
        }) {
            cacheConfigurations.put(name, defaultConfig.entryTtl(analyticsTtl));
        }

        log.info("Redis CacheManager initialized with typed Jackson serialization (default typing ON)");

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}
