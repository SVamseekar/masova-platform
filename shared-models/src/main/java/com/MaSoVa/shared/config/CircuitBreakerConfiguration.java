package com.MaSoVa.shared.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Circuit Breaker configuration for inter-service calls.
 * PROD-001: Resilience4j circuit breakers to prevent cascade failures
 *
 * Circuit breaker states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 *
 * Usage with annotation:
 * <pre>
 * @CircuitBreaker(name = "orderService", fallbackMethod = "fallbackMethod")
 * public Order getOrder(String orderId) {
 *     return orderServiceClient.getOrder(orderId);
 * }
 *
 * private Order fallbackMethod(String orderId, Exception ex) {
 *     log.warn("Circuit breaker fallback for order {}: {}", orderId, ex.getMessage());
 *     return Order.builder().id(orderId).status("UNAVAILABLE").build();
 * }
 * </pre>
 */
@Configuration
public class CircuitBreakerConfiguration {

    private static final Logger log = LoggerFactory.getLogger(CircuitBreakerConfiguration.class);

    /**
     * Default circuit breaker configuration for all services
     */
    @Bean
    public CircuitBreakerConfig defaultCircuitBreakerConfig() {
        return CircuitBreakerConfig.custom()
                // Failure rate threshold (percentage)
                .failureRateThreshold(50)  // Open circuit if 50% of calls fail

                // Slow call threshold (percentage)
                .slowCallRateThreshold(80)  // Consider call slow if 80% exceed duration threshold
                .slowCallDurationThreshold(Duration.ofSeconds(3))  // Calls taking > 3s are "slow"

                // Minimum number of calls before calculating failure rate
                .minimumNumberOfCalls(10)  // Need at least 10 calls to calculate rate

                // Sliding window for recording outcomes
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(20)  // Last 20 calls

                // Wait duration in OPEN state before transitioning to HALF_OPEN
                .waitDurationInOpenState(Duration.ofSeconds(30))  // Wait 30s before retry

                // Number of permitted calls in HALF_OPEN state
                .permittedNumberOfCallsInHalfOpenState(5)  // Allow 5 test calls

                // Automatically transition from OPEN to HALF_OPEN
                .automaticTransitionFromOpenToHalfOpenEnabled(true)

                .build();
    }

    /**
     * Circuit breaker registry with custom configs
     */
    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry(CircuitBreakerConfig defaultConfig) {
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(defaultConfig);

        // Add event listeners for monitoring
        registry.circuitBreaker("default").getEventPublisher()
                .onStateTransition(event ->
                    log.warn("Circuit breaker '{}' state changed: {} -> {}",
                            event.getCircuitBreakerName(),
                            event.getStateTransition().getFromState(),
                            event.getStateTransition().getToState()))
                .onFailureRateExceeded(event ->
                    log.error("Circuit breaker '{}' failure rate exceeded: {}%",
                            event.getCircuitBreakerName(),
                            event.getFailureRate()))
                .onSlowCallRateExceeded(event ->
                    log.warn("Circuit breaker '{}' slow call rate exceeded: {}%",
                            event.getCircuitBreakerName(),
                            event.getSlowCallRate()));

        // Define service-specific circuit breakers with custom settings
        defineServiceCircuitBreakers(registry);

        return registry;
    }

    /**
     * Time limiter configuration for async operations
     */
    @Bean
    public TimeLimiterConfig defaultTimeLimiterConfig() {
        return TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(5))  // Max 5 seconds for any call
                .cancelRunningFuture(true)  // Cancel if timeout exceeded
                .build();
    }

    /**
     * Define circuit breakers for specific services with custom configurations
     */
    private void defineServiceCircuitBreakers(CircuitBreakerRegistry registry) {
        // Order Service - critical, fail fast
        registry.circuitBreaker("orderService", CircuitBreakerConfig.custom()
                .failureRateThreshold(40)  // More sensitive - 40% failure rate
                .minimumNumberOfCalls(5)
                .waitDurationInOpenState(Duration.ofSeconds(20))
                .build());

        // Payment Service - critical, be conservative
        registry.circuitBreaker("paymentService", CircuitBreakerConfig.custom()
                .failureRateThreshold(30)  // Very sensitive - 30% failure rate
                .minimumNumberOfCalls(5)
                .waitDurationInOpenState(Duration.ofSeconds(60))  // Wait longer before retry
                .build());

        // Delivery Service - less critical, allow more failures
        registry.circuitBreaker("deliveryService", CircuitBreakerConfig.custom()
                .failureRateThreshold(60)  // More tolerant - 60% failure rate
                .minimumNumberOfCalls(10)
                .waitDurationInOpenState(Duration.ofSeconds(15))
                .build());

        // Customer Service - read-heavy, allow failures
        registry.circuitBreaker("customerService", CircuitBreakerConfig.custom()
                .failureRateThreshold(60)
                .minimumNumberOfCalls(10)
                .waitDurationInOpenState(Duration.ofSeconds(15))
                .build());

        // Menu Service - read-heavy, cacheable
        registry.circuitBreaker("menuService", CircuitBreakerConfig.custom()
                .failureRateThreshold(70)  // Very tolerant
                .minimumNumberOfCalls(10)
                .waitDurationInOpenState(Duration.ofSeconds(10))
                .build());

        // Analytics Service - non-critical, high tolerance
        registry.circuitBreaker("analyticsService", CircuitBreakerConfig.custom()
                .failureRateThreshold(80)  // Most tolerant
                .minimumNumberOfCalls(15)
                .waitDurationInOpenState(Duration.ofSeconds(10))
                .build());

        log.info("Circuit breakers configured for all services");
    }
}
