package com.MaSoVa.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends AbstractGatewayFilterFactory<RateLimitingFilter.Config> {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);

    // Store user request counts with timestamp
    private final Map<String, UserRateLimit> rateLimitStore = new ConcurrentHashMap<>();

    public RateLimitingFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");

            if (userId == null) {
                userId = exchange.getRequest().getRemoteAddress() != null
                        ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                        : "anonymous";
            }

            UserRateLimit rateLimit = rateLimitStore.computeIfAbsent(userId, k -> new UserRateLimit());

            // Check if rate limit exceeded
            if (rateLimit.isLimitExceeded(config.requestsPerMinute)) {
                logger.warn("Rate limit exceeded for user: {}", userId);
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                return exchange.getResponse().setComplete();
            }

            // Increment request count
            rateLimit.incrementRequests();

            return chain.filter(exchange);
        };
    }

    public static class Config {
        private int requestsPerMinute = 100; // Default: 100 requests per minute

        public int getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(int requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }
    }

    private static class UserRateLimit {
        private final AtomicInteger requestCount = new AtomicInteger(0);
        private long windowStartTime = System.currentTimeMillis();

        public synchronized boolean isLimitExceeded(int maxRequests) {
            long currentTime = System.currentTimeMillis();
            long windowDuration = Duration.ofMinutes(1).toMillis();

            // Reset window if minute has passed
            if (currentTime - windowStartTime >= windowDuration) {
                requestCount.set(0);
                windowStartTime = currentTime;
                return false;
            }

            return requestCount.get() >= maxRequests;
        }

        public void incrementRequests() {
            requestCount.incrementAndGet();
        }
    }
}
