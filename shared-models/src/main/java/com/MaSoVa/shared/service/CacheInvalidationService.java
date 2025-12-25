package com.MaSoVa.shared.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing cache invalidation policies
 * Implements intelligent cache eviction and warming strategies
 * Phase 13: Performance Optimization & Caching
 */
@Service
public class CacheInvalidationService {

    private static final Logger logger = LoggerFactory.getLogger(CacheInvalidationService.class);

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * Invalidate a specific cache entry
     */
    public void invalidateCache(@NonNull String cacheName, @NonNull String key) {
        Objects.requireNonNull(cacheName, "cacheName cannot be null");
        Objects.requireNonNull(key, "key cannot be null");
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.evict(key);
                logger.info("Invalidated cache: {} with key: {}", cacheName, key);
            }
        } catch (Exception e) {
            logger.error("Error invalidating cache: {} with key: {}", cacheName, key, e);
        }
    }

    /**
     * Invalidate all entries in a specific cache
     */
    public void invalidateAllCache(@NonNull String cacheName) {
        Objects.requireNonNull(cacheName, "cacheName cannot be null");
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                logger.info("Cleared all entries from cache: {}", cacheName);
            }
        } catch (Exception e) {
            logger.error("Error clearing cache: {}", cacheName, e);
        }
    }

    /**
     * Invalidate multiple cache entries by pattern
     */
    public void invalidateCacheByPattern(@NonNull String pattern) {
        Objects.requireNonNull(pattern, "pattern cannot be null");
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                logger.info("Invalidated {} cache entries matching pattern: {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            logger.error("Error invalidating cache by pattern: {}", pattern, e);
        }
    }

    /**
     * Invalidate all caches
     */
    public void invalidateAllCaches() {
        try {
            cacheManager.getCacheNames().forEach(cacheName -> {
                if (cacheName != null) {
                    Cache cache = cacheManager.getCache(cacheName);
                    if (cache != null) {
                        cache.clear();
                    }
                }
            });
            logger.info("Cleared all caches");
        } catch (Exception e) {
            logger.error("Error clearing all caches", e);
        }
    }

    /**
     * Check if cache entry exists
     */
    public boolean isCached(String cacheName, String key) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                return cache.get(key) != null;
            }
        } catch (Exception e) {
            logger.error("Error checking cache: {} with key: {}", cacheName, key, e);
        }
        return false;
    }

    /**
     * Get cache statistics
     */
    public long getCacheSize(String cacheName) {
        try {
            Set<String> keys = redisTemplate.keys(cacheName + "*");
            return keys != null ? keys.size() : 0;
        } catch (Exception e) {
            logger.error("Error getting cache size for: {}", cacheName, e);
            return -1;
        }
    }

    /**
     * Set expiration time for a cache entry
     */
    public void setCacheExpiration(@NonNull String key, long timeout, @NonNull TimeUnit timeUnit) {
        Objects.requireNonNull(key, "key cannot be null");
        Objects.requireNonNull(timeUnit, "timeUnit cannot be null");
        try {
            redisTemplate.expire(key, timeout, timeUnit);
            logger.info("Set expiration for key: {} to {} {}", key, timeout, timeUnit);
        } catch (Exception e) {
            logger.error("Error setting expiration for key: {}", key, e);
        }
    }

    /**
     * Invalidate related caches (cascade invalidation)
     * Example: When menu item is updated, invalidate menu, orders, and analytics caches
     */
    public void invalidateRelatedCaches(@NonNull String entityType, @NonNull String entityId) {
        Objects.requireNonNull(entityType, "entityType cannot be null");
        Objects.requireNonNull(entityId, "entityId cannot be null");
        switch (entityType.toLowerCase()) {
            case "menu":
                invalidateCache("menu", entityId);
                invalidateCacheByPattern("orders:*menu*" + entityId + "*");
                invalidateCacheByPattern("analytics:*menu*");
                break;
            case "order":
                invalidateCache("orders", entityId);
                invalidateCacheByPattern("analytics:*order*");
                invalidateCacheByPattern("customer:*order*");
                break;
            case "user":
                invalidateCache("user", entityId);
                invalidateCacheByPattern("orders:*user*" + entityId + "*");
                break;
            case "inventory":
                invalidateCache("inventory", entityId);
                invalidateCacheByPattern("menu:*");
                break;
            case "customer":
                invalidateCache("customer", entityId);
                invalidateCacheByPattern("orders:*customer*" + entityId + "*");
                invalidateCacheByPattern("reviews:*customer*" + entityId + "*");
                break;
            case "review":
                invalidateCache("reviews", entityId);
                invalidateCacheByPattern("analytics:*review*");
                break;
            default:
                logger.warn("Unknown entity type for cache invalidation: {}", entityType);
        }
        logger.info("Invalidated related caches for entity: {} with id: {}", entityType, entityId);
    }

    /**
     * Warm up cache with frequently accessed data
     */
    public void warmUpCache(@NonNull String cacheName, @NonNull String key, @Nullable Object value) {
        Objects.requireNonNull(cacheName, "cacheName cannot be null");
        Objects.requireNonNull(key, "key cannot be null");
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.put(key, value);
                logger.info("Warmed up cache: {} with key: {}", cacheName, key);
            }
        } catch (Exception e) {
            logger.error("Error warming up cache: {} with key: {}", cacheName, key, e);
        }
    }
}
