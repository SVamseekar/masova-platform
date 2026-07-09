package com.MaSoVa.intelligence.config;

/**
 * Intentionally empty / no CacheManager bean.
 *
 * <p>Intelligence-service component-scans {@code com.MaSoVa.shared}, which loads
 * {@link com.MaSoVa.shared.config.AdvancedCacheConfig}. That shared config owns the
 * primary Redis {@code CacheManager}. A second local CacheManager here either
 * lost the bean fight or confused wiring — typed serialization must live in
 * AdvancedCacheConfig only.
 *
 * <p>Kept as a marker file so prior Phase D docs referring to RedisCacheConfig
 * still resolve; do not re-introduce a competing cacheManager bean.
 */
public final class RedisCacheConfig {
    private RedisCacheConfig() {}
}
