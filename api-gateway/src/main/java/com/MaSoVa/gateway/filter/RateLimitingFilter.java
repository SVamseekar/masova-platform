package com.MaSoVa.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting filter to protect against DDoS and brute force attacks.
 * Supports configurable limits per route type and automatic cleanup of stale entries.
 */
@Component
public class RateLimitingFilter extends AbstractGatewayFilterFactory<RateLimitingFilter.Config> {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);

    // Store user request counts with timestamp - keyed by identifier (user ID or IP)
    private final Map<String, UserRateLimit> rateLimitStore = new ConcurrentHashMap<>();

    // Store IP-based limits for login endpoints (brute force protection)
    private final Map<String, BruteForceLimit> loginLimitStore = new ConcurrentHashMap<>();

    @Value("${rate.limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${rate.limit.default.requests-per-minute:100}")
    private int defaultRequestsPerMinute;

    @Value("${rate.limit.login.max-attempts:5}")
    private int loginMaxAttempts;

    @Value("${rate.limit.login.lockout-minutes:15}")
    private int loginLockoutMinutes;

    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();

    public RateLimitingFilter() {
        super(Config.class);
    }

    @PostConstruct
    public void init() {
        // Schedule cleanup of stale rate limit entries every 5 minutes
        cleanupExecutor.scheduleAtFixedRate(this::cleanupStaleEntries, 5, 5, TimeUnit.MINUTES);
        logger.info("Rate limiting initialized - enabled: {}, default limit: {} req/min, login attempts: {}, lockout: {} min",
            rateLimitEnabled, defaultRequestsPerMinute, loginMaxAttempts, loginLockoutMinutes);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            if (!rateLimitEnabled) {
                return chain.filter(exchange);
            }

            String path = exchange.getRequest().getPath().value();
            String clientIp = getClientIp(exchange.getRequest().getRemoteAddress());
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");

            // For login endpoints, check IP-based brute force lockout
            if (isLoginEndpoint(path)) {
                BruteForceLimit bruteForceLimit = loginLimitStore.computeIfAbsent(clientIp, k -> new BruteForceLimit());

                if (bruteForceLimit.isLockedOut(loginLockoutMinutes)) {
                    long remainingLockout = bruteForceLimit.getRemainingLockoutSeconds(loginLockoutMinutes);
                    logger.warn("Brute force lockout for IP: {} - {} seconds remaining", clientIp, remainingLockout);

                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                    exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(remainingLockout));

                    String errorBody = String.format(
                        "{\"error\":\"Too many login attempts\",\"message\":\"Account temporarily locked. Try again in %d seconds.\",\"retryAfter\":%d}",
                        remainingLockout, remainingLockout
                    );

                    byte[] bytes = errorBody.getBytes(StandardCharsets.UTF_8);
                    return exchange.getResponse().writeWith(
                        Mono.just(exchange.getResponse().bufferFactory().wrap(bytes))
                    );
                }

                // Only increment failed attempts on authentication failure (401/403)
                // This is handled in the response filter below, not on every request
            }

            // General rate limiting by user ID or IP
            String rateLimitKey = userId != null ? "user:" + userId : "ip:" + clientIp;
            int limit = config.getRequestsPerMinute() > 0 ? config.getRequestsPerMinute() : defaultRequestsPerMinute;

            UserRateLimit rateLimit = rateLimitStore.computeIfAbsent(rateLimitKey, k -> new UserRateLimit());

            if (rateLimit.isLimitExceeded(limit)) {
                long retryAfter = rateLimit.getSecondsUntilReset();
                logger.warn("Rate limit exceeded for {} - limit: {} req/min, retry after: {}s", rateLimitKey, limit, retryAfter);

                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(retryAfter));
                exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(limit));
                exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", "0");
                exchange.getResponse().getHeaders().add("X-RateLimit-Reset", String.valueOf(rateLimit.getResetTimestamp()));

                String errorBody = String.format(
                    "{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please try again later.\",\"retryAfter\":%d,\"limit\":%d}",
                    retryAfter, limit
                );

                byte[] bytes = errorBody.getBytes(StandardCharsets.UTF_8);
                return exchange.getResponse().writeWith(
                    Mono.just(exchange.getResponse().bufferFactory().wrap(bytes))
                );
            }

            // Increment request count
            int remaining = rateLimit.incrementAndGetRemaining(limit);

            // Add rate limit headers to response
            exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(limit));
            exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(remaining));
            exchange.getResponse().getHeaders().add("X-RateLimit-Reset", String.valueOf(rateLimit.getResetTimestamp()));

            // Track failed login attempts in response filter
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                if (isLoginEndpoint(path)) {
                    HttpStatus status = (HttpStatus) exchange.getResponse().getStatusCode();
                    if (status != null && (status.value() == 401 || status.value() == 403 || status.value() == 500)) {
                        // Authentication failed - increment brute force counter
                        BruteForceLimit bruteForceLimit = loginLimitStore.computeIfAbsent(clientIp, k -> new BruteForceLimit());
                        if (bruteForceLimit.incrementAndCheck(loginMaxAttempts)) {
                            logger.warn("Brute force limit triggered for IP: {} after {} failed attempts", clientIp, loginMaxAttempts);
                        }
                    } else if (status != null && status.is2xxSuccessful()) {
                        // Login succeeded - reset brute force counter
                        BruteForceLimit bruteForceLimit = loginLimitStore.get(clientIp);
                        if (bruteForceLimit != null) {
                            bruteForceLimit.resetOnSuccess();
                            logger.debug("Reset brute force counter for IP: {} after successful login", clientIp);
                        }
                    }
                }
            }));
        };
    }

    private boolean isLoginEndpoint(String path) {
        return path.contains("/login") || path.contains("/register") || path.contains("/refresh");
    }

    private String getClientIp(java.net.InetSocketAddress remoteAddress) {
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }
        return "unknown";
    }

    private void cleanupStaleEntries() {
        long currentTime = System.currentTimeMillis();
        long staleThreshold = Duration.ofMinutes(10).toMillis();

        // Cleanup general rate limits
        rateLimitStore.entrySet().removeIf(entry ->
            currentTime - entry.getValue().getLastAccessTime() > staleThreshold);

        // Cleanup brute force limits (keep for lockout duration + buffer)
        long bruteForceThreshold = Duration.ofMinutes(loginLockoutMinutes + 5).toMillis();
        loginLimitStore.entrySet().removeIf(entry ->
            currentTime - entry.getValue().getLastAttemptTime() > bruteForceThreshold);

        logger.debug("Rate limit cleanup - general entries: {}, brute force entries: {}",
            rateLimitStore.size(), loginLimitStore.size());
    }

    public static class Config {
        private int requestsPerMinute = 100; // Default: 100 requests per minute
        private String routeType = "default"; // Route type for logging

        public int getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(int requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }

        public String getRouteType() {
            return routeType;
        }

        public void setRouteType(String routeType) {
            this.routeType = routeType;
        }
    }

    private static class UserRateLimit {
        private final AtomicInteger requestCount = new AtomicInteger(0);
        private volatile long windowStartTime = System.currentTimeMillis();
        private volatile long lastAccessTime = System.currentTimeMillis();
        private static final long WINDOW_DURATION = Duration.ofMinutes(1).toMillis();

        public synchronized boolean isLimitExceeded(int maxRequests) {
            resetIfWindowExpired();
            lastAccessTime = System.currentTimeMillis();
            return requestCount.get() >= maxRequests;
        }

        public synchronized int incrementAndGetRemaining(int maxRequests) {
            resetIfWindowExpired();
            lastAccessTime = System.currentTimeMillis();
            int current = requestCount.incrementAndGet();
            return Math.max(0, maxRequests - current);
        }

        private void resetIfWindowExpired() {
            long currentTime = System.currentTimeMillis();
            if (currentTime - windowStartTime >= WINDOW_DURATION) {
                requestCount.set(0);
                windowStartTime = currentTime;
            }
        }

        public long getSecondsUntilReset() {
            long elapsed = System.currentTimeMillis() - windowStartTime;
            return Math.max(1, (WINDOW_DURATION - elapsed) / 1000);
        }

        public long getResetTimestamp() {
            return (windowStartTime + WINDOW_DURATION) / 1000;
        }

        public long getLastAccessTime() {
            return lastAccessTime;
        }
    }

    /**
     * Brute force protection for login endpoints.
     * Tracks failed attempts and locks out after threshold.
     */
    private static class BruteForceLimit {
        private final AtomicInteger attemptCount = new AtomicInteger(0);
        private volatile long firstAttemptTime = System.currentTimeMillis();
        private volatile long lastAttemptTime = System.currentTimeMillis();
        private volatile boolean lockedOut = false;
        private volatile long lockoutStartTime = 0;

        public synchronized boolean incrementAndCheck(int maxAttempts) {
            long currentTime = System.currentTimeMillis();
            lastAttemptTime = currentTime;

            // Reset if more than lockout window has passed since first attempt
            if (currentTime - firstAttemptTime > Duration.ofMinutes(30).toMillis()) {
                attemptCount.set(0);
                firstAttemptTime = currentTime;
                lockedOut = false;
            }

            int attempts = attemptCount.incrementAndGet();
            if (attempts >= maxAttempts && !lockedOut) {
                lockedOut = true;
                lockoutStartTime = currentTime;
                return true;
            }
            return false;
        }

        public boolean isLockedOut(int lockoutMinutes) {
            if (!lockedOut) return false;

            long lockoutDuration = Duration.ofMinutes(lockoutMinutes).toMillis();
            if (System.currentTimeMillis() - lockoutStartTime > lockoutDuration) {
                // Lockout expired - reset
                lockedOut = false;
                attemptCount.set(0);
                return false;
            }
            return true;
        }

        public long getRemainingLockoutSeconds(int lockoutMinutes) {
            if (!lockedOut) return 0;
            long lockoutDuration = Duration.ofMinutes(lockoutMinutes).toMillis();
            long elapsed = System.currentTimeMillis() - lockoutStartTime;
            return Math.max(1, (lockoutDuration - elapsed) / 1000);
        }

        public long getLastAttemptTime() {
            return lastAttemptTime;
        }

        @SuppressWarnings("unused")
        public void resetOnSuccess() {
            attemptCount.set(0);
            lockedOut = false;
        }
    }
}
