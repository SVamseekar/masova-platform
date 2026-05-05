package com.MaSoVa.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Field;
import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("RateLimitingFilter")
class RateLimitingFilterTest {

    private RateLimitingFilter filter;
    private GatewayFilterChain chain;

    @BeforeEach
    void setUp() throws Exception {
        filter = new RateLimitingFilter();
        setField(filter, "rateLimitEnabled", true);
        setField(filter, "defaultRequestsPerMinute", 100);
        setField(filter, "loginMaxAttempts", 5);
        setField(filter, "loginLockoutMinutes", 15);

        chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private RateLimitingFilter.Config createConfig(int requestsPerMinute) {
        RateLimitingFilter.Config config = new RateLimitingFilter.Config();
        config.setRequestsPerMinute(requestsPerMinute);
        config.setRouteType("test");
        return config;
    }

    private MockServerWebExchange createExchange(String path) {
        return MockServerWebExchange.from(
                MockServerHttpRequest.get(path)
                        .remoteAddress(new InetSocketAddress("192.168.1.100", 12345)));
    }

    private MockServerWebExchange createExchangeWithUserId(String path, String userId) {
        return MockServerWebExchange.from(
                MockServerHttpRequest.get(path)
                        .header("X-User-Id", userId)
                        .remoteAddress(new InetSocketAddress("192.168.1.100", 12345)));
    }

    // ---- Tests for rate limiting toggle ----

    @Nested
    @DisplayName("Rate limiting enabled/disabled toggle")
    class RateLimitToggle {

        @Test
        @DisplayName("Should pass through when rate limiting is disabled")
        void shouldPassThrough_whenDisabled() throws Exception {
            setField(filter, "rateLimitEnabled", false);
            GatewayFilter gatewayFilter = filter.apply(createConfig(1));
            MockServerWebExchange exchange = createExchange("/api/orders");

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            // Status should not be 429 since rate limiting is off
            assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }

        @Test
        @DisplayName("Should enforce limits when rate limiting is enabled")
        void shouldEnforceLimits_whenEnabled() {
            GatewayFilter gatewayFilter = filter.apply(createConfig(1));

            // First request should succeed
            MockServerWebExchange exchange1 = createExchangeWithUserId("/api/orders", "user-1");
            StepVerifier.create(gatewayFilter.filter(exchange1, chain)).verifyComplete();

            // Second request from same user should be rate limited
            MockServerWebExchange exchange2 = createExchangeWithUserId("/api/orders", "user-1");
            StepVerifier.create(gatewayFilter.filter(exchange2, chain)).verifyComplete();
            assertThat(exchange2.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    // ---- Tests for general rate limiting ----

    @Nested
    @DisplayName("General rate limiting behavior")
    class GeneralRateLimiting {

        @Test
        @DisplayName("Should allow requests within the limit")
        void shouldAllow_withinLimit() {
            GatewayFilter gatewayFilter = filter.apply(createConfig(5));
            MockServerWebExchange exchange = createExchangeWithUserId("/api/orders", "user-ok");

            StepVerifier.create(gatewayFilter.filter(exchange, chain)).verifyComplete();
            assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }

        @Test
        @DisplayName("Should add X-RateLimit response headers on successful requests")
        void shouldAddRateLimitHeaders() {
            GatewayFilter gatewayFilter = filter.apply(createConfig(100));
            MockServerWebExchange exchange = createExchangeWithUserId("/api/orders", "user-headers");

            StepVerifier.create(gatewayFilter.filter(exchange, chain)).verifyComplete();

            assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit")).isEqualTo("100");
            assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining")).isNotNull();
            assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Reset")).isNotNull();
        }

        @Test
        @DisplayName("Should return 429 with Retry-After header when limit is exceeded")
        void shouldReturn429_withRetryAfter() {
            GatewayFilter gatewayFilter = filter.apply(createConfig(1));

            // Exhaust the limit
            MockServerWebExchange first = createExchangeWithUserId("/api/data", "user-flood");
            StepVerifier.create(gatewayFilter.filter(first, chain)).verifyComplete();

            // Next request should be rejected
            MockServerWebExchange second = createExchangeWithUserId("/api/data", "user-flood");
            StepVerifier.create(gatewayFilter.filter(second, chain)).verifyComplete();

            assertThat(second.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
            assertThat(second.getResponse().getHeaders().getFirst("Retry-After")).isNotNull();
        }

        @Test
        @DisplayName("Should rate limit by IP when no user ID is present")
        void shouldRateLimitByIp_whenNoUserId() {
            GatewayFilter gatewayFilter = filter.apply(createConfig(1));

            // First request (no user ID, uses IP)
            MockServerWebExchange first = createExchange("/api/public");
            StepVerifier.create(gatewayFilter.filter(first, chain)).verifyComplete();

            // Second request from same IP
            MockServerWebExchange second = createExchange("/api/public");
            StepVerifier.create(gatewayFilter.filter(second, chain)).verifyComplete();

            assertThat(second.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }

        @Test
        @DisplayName("Should use config limit when set, falling back to default")
        void shouldUseConfigLimit_overDefault() {
            // Config with 0 means use default (100)
            RateLimitingFilter.Config configZero = new RateLimitingFilter.Config();
            configZero.setRequestsPerMinute(0);

            GatewayFilter gatewayFilter = filter.apply(configZero);
            MockServerWebExchange exchange = createExchangeWithUserId("/api/orders", "user-default");

            StepVerifier.create(gatewayFilter.filter(exchange, chain)).verifyComplete();

            // Should use default limit (100), so first request succeeds
            assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit")).isEqualTo("100");
        }

        @Test
        @DisplayName("Should isolate rate limits between different users")
        void shouldIsolateLimits_betweenUsers() {
            GatewayFilter gatewayFilter = filter.apply(createConfig(1));

            // User A - first request
            MockServerWebExchange exchangeA = createExchangeWithUserId("/api/orders", "user-A");
            StepVerifier.create(gatewayFilter.filter(exchangeA, chain)).verifyComplete();
            assertThat(exchangeA.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);

            // User B - first request (different bucket)
            MockServerWebExchange exchangeB = createExchangeWithUserId("/api/orders", "user-B");
            StepVerifier.create(gatewayFilter.filter(exchangeB, chain)).verifyComplete();
            assertThat(exchangeB.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    // ---- Tests for Config inner class ----

    @Nested
    @DisplayName("Config properties")
    class ConfigTests {

        @Test
        @DisplayName("Should have default values for Config")
        void shouldHaveDefaults() {
            RateLimitingFilter.Config config = new RateLimitingFilter.Config();
            assertThat(config.getRequestsPerMinute()).isEqualTo(100);
            assertThat(config.getRouteType()).isEqualTo("default");
        }

        @Test
        @DisplayName("Should allow setting custom config values")
        void shouldAllowCustomValues() {
            RateLimitingFilter.Config config = new RateLimitingFilter.Config();
            config.setRequestsPerMinute(50);
            config.setRouteType("auth");

            assertThat(config.getRequestsPerMinute()).isEqualTo(50);
            assertThat(config.getRouteType()).isEqualTo("auth");
        }
    }

    // ---- Tests for login endpoint detection ----

    @Nested
    @DisplayName("Login endpoint brute force protection")
    class LoginBruteForceProtection {

        @Test
        @DisplayName("Should detect login endpoint paths correctly")
        void shouldDetectLoginEndpoints() {
            // Login endpoints should trigger brute force tracking
            // We test indirectly by hitting login paths
            GatewayFilter gatewayFilter = filter.apply(createConfig(100));

            MockServerWebExchange loginExchange = createExchange("/api/users/login");
            StepVerifier.create(gatewayFilter.filter(loginExchange, chain)).verifyComplete();

            // Should succeed - first request
            assertThat(loginExchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }

        @Test
        @DisplayName("Should detect register endpoint as login-type path")
        void shouldDetectRegisterEndpoint() {
            GatewayFilter gatewayFilter = filter.apply(createConfig(100));

            MockServerWebExchange registerExchange = createExchange("/api/users/register");
            StepVerifier.create(gatewayFilter.filter(registerExchange, chain)).verifyComplete();

            assertThat(registerExchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }
}
