package com.MaSoVa.shared.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.connection.ConnectionPoolSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * MongoDB connection pool configuration for production readiness.
 * Prevents connection exhaustion under high load by tuning pool parameters.
 *
 * Environment variables for customization:
 * - MONGO_POOL_MIN_SIZE: Minimum connections (default: 10)
 * - MONGO_POOL_MAX_SIZE: Maximum connections (default: 100)
 * - MONGO_POOL_MAX_WAIT_MS: Max wait time for connection (default: 30000)
 * - MONGO_POOL_MAX_IDLE_MS: Max idle time before close (default: 60000)
 * - MONGO_POOL_MAINTENANCE_INTERVAL_MS: Maintenance check interval (default: 10000)
 */
@Configuration
public class MongoPoolConfig {

    private static final Logger logger = LoggerFactory.getLogger(MongoPoolConfig.class);

    @Value("${spring.data.mongodb.uri:mongodb://localhost:27017/masova}")
    private String mongoUri;

    @Value("${mongo.pool.min-size:10}")
    private int minPoolSize;

    @Value("${mongo.pool.max-size:100}")
    private int maxPoolSize;

    @Value("${mongo.pool.max-wait-ms:30000}")
    private long maxWaitTimeMs;

    @Value("${mongo.pool.max-connection-idle-ms:60000}")
    private long maxConnectionIdleTimeMs;

    @Value("${mongo.pool.max-connection-life-ms:0}")
    private long maxConnectionLifeTimeMs; // 0 = no limit

    @Value("${mongo.pool.maintenance-initial-delay-ms:0}")
    private long maintenanceInitialDelayMs;

    @Value("${mongo.pool.maintenance-frequency-ms:10000}")
    private long maintenanceFrequencyMs;

    /**
     * Creates MongoDB client settings with optimized connection pool configuration.
     * This bean can be used by MongoAutoConfiguration to create the MongoClient.
     */
    @Bean
    public MongoClientSettings mongoClientSettings() {
        logger.info("Configuring MongoDB connection pool: min={}, max={}, maxWait={}ms, maxIdle={}ms",
                minPoolSize, maxPoolSize, maxWaitTimeMs, maxConnectionIdleTimeMs);

        ConnectionPoolSettings.Builder poolBuilder = ConnectionPoolSettings.builder()
                .minSize(minPoolSize)
                .maxSize(maxPoolSize)
                .maxWaitTime(maxWaitTimeMs, TimeUnit.MILLISECONDS)
                .maxConnectionIdleTime(maxConnectionIdleTimeMs, TimeUnit.MILLISECONDS)
                .maintenanceInitialDelay(maintenanceInitialDelayMs, TimeUnit.MILLISECONDS)
                .maintenanceFrequency(maintenanceFrequencyMs, TimeUnit.MILLISECONDS);

        // Only set max lifetime if explicitly configured (> 0)
        if (maxConnectionLifeTimeMs > 0) {
            poolBuilder.maxConnectionLifeTime(maxConnectionLifeTimeMs, TimeUnit.MILLISECONDS);
        }

        ConnectionPoolSettings poolSettings = poolBuilder.build();

        ConnectionString connectionString = new ConnectionString(mongoUri);

        return MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .applyToConnectionPoolSettings(builder -> {
                    builder.minSize(poolSettings.getMinSize());
                    builder.maxSize(poolSettings.getMaxSize());
                    builder.maxWaitTime(poolSettings.getMaxWaitTime(TimeUnit.MILLISECONDS), TimeUnit.MILLISECONDS);
                    builder.maxConnectionIdleTime(poolSettings.getMaxConnectionIdleTime(TimeUnit.MILLISECONDS), TimeUnit.MILLISECONDS);
                    builder.maintenanceInitialDelay(poolSettings.getMaintenanceInitialDelay(TimeUnit.MILLISECONDS), TimeUnit.MILLISECONDS);
                    builder.maintenanceFrequency(poolSettings.getMaintenanceFrequency(TimeUnit.MILLISECONDS), TimeUnit.MILLISECONDS);
                    if (maxConnectionLifeTimeMs > 0) {
                        builder.maxConnectionLifeTime(maxConnectionLifeTimeMs, TimeUnit.MILLISECONDS);
                    }
                })
                // Socket settings for timeout handling
                .applyToSocketSettings(builder -> {
                    builder.connectTimeout(10000, TimeUnit.MILLISECONDS);
                    builder.readTimeout(30000, TimeUnit.MILLISECONDS);
                })
                // Server selection timeout
                .applyToClusterSettings(builder -> {
                    builder.serverSelectionTimeout(30000, TimeUnit.MILLISECONDS);
                })
                .build();
    }

    /**
     * Provides connection pool configuration values for health monitoring.
     */
    public ConnectionPoolInfo getConnectionPoolInfo() {
        return new ConnectionPoolInfo(minPoolSize, maxPoolSize, maxWaitTimeMs, maxConnectionIdleTimeMs);
    }

    /**
     * Simple POJO for connection pool information (for health endpoints).
     */
    public static class ConnectionPoolInfo {
        private final int minSize;
        private final int maxSize;
        private final long maxWaitTimeMs;
        private final long maxIdleTimeMs;

        public ConnectionPoolInfo(int minSize, int maxSize, long maxWaitTimeMs, long maxIdleTimeMs) {
            this.minSize = minSize;
            this.maxSize = maxSize;
            this.maxWaitTimeMs = maxWaitTimeMs;
            this.maxIdleTimeMs = maxIdleTimeMs;
        }

        public int getMinSize() { return minSize; }
        public int getMaxSize() { return maxSize; }
        public long getMaxWaitTimeMs() { return maxWaitTimeMs; }
        public long getMaxIdleTimeMs() { return maxIdleTimeMs; }
    }
}
