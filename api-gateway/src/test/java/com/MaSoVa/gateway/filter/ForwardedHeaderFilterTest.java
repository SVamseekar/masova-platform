package com.MaSoVa.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;
import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("ForwardedHeaderFilter")
class ForwardedHeaderFilterTest {

    private ForwardedHeaderFilter filter;
    private GatewayFilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new ForwardedHeaderFilter();
        chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    @Nested
    @DisplayName("Header cleanup behavior")
    class HeaderCleanup {

        @Test
        @DisplayName("Should remove accumulated Forwarded header")
        void shouldRemoveForwardedHeader() {
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders")
                    .header("Forwarded", "for=1.2.3.4;proto=http")
                    .remoteAddress(new InetSocketAddress("10.0.0.1", 8080))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                // The old "Forwarded" header should be removed
                assertThat(headers.containsKey("Forwarded")).isFalse();
                return Mono.empty();
            });

            StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        }

        @Test
        @DisplayName("Should replace X-Forwarded-For with actual remote address")
        void shouldSetXForwardedFor_fromRemoteAddress() {
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders")
                    .header("X-Forwarded-For", "1.2.3.4, 5.6.7.8")
                    .remoteAddress(new InetSocketAddress("10.0.0.1", 8080))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                // Should be set to the actual remote address, not the accumulated chain
                assertThat(headers.getFirst("X-Forwarded-For")).isEqualTo("10.0.0.1");
                return Mono.empty();
            });

            StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        }

        @Test
        @DisplayName("Should set X-Forwarded-For to 'unknown' when remote address is null")
        void shouldSetUnknown_whenNoRemoteAddress() {
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders").build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                assertThat(headers.getFirst("X-Forwarded-For")).isEqualTo("unknown");
                return Mono.empty();
            });

            StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        }

        @Test
        @DisplayName("Should set X-Forwarded-Proto from request URI scheme")
        void shouldSetXForwardedProto() {
            MockServerHttpRequest request = MockServerHttpRequest.get("https://api.masova.com/api/orders")
                    .remoteAddress(new InetSocketAddress("10.0.0.1", 443))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                assertThat(headers.getFirst("X-Forwarded-Proto")).isEqualTo("https");
                return Mono.empty();
            });

            StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        }

        @Test
        @DisplayName("Should set X-Forwarded-Host from original Host header")
        void shouldSetXForwardedHost() {
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders")
                    .header("Host", "api.masova.com")
                    .remoteAddress(new InetSocketAddress("10.0.0.1", 8080))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                assertThat(headers.getFirst("X-Forwarded-Host")).isEqualTo("api.masova.com");
                return Mono.empty();
            });

            StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        }

        @Test
        @DisplayName("Should remove all six standard forwarded headers before re-adding")
        void shouldRemoveAllStandardForwardedHeaders() {
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders")
                    .header("Forwarded", "for=old")
                    .header("X-Forwarded-For", "old-ip")
                    .header("X-Forwarded-Proto", "old-proto")
                    .header("X-Forwarded-Host", "old-host")
                    .header("X-Forwarded-Port", "9999")
                    .header("X-Forwarded-Prefix", "/old-prefix")
                    .remoteAddress(new InetSocketAddress("10.0.0.1", 8080))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                // Forwarded, X-Forwarded-Port, X-Forwarded-Prefix should be gone
                assertThat(headers.containsKey("Forwarded")).isFalse();
                assertThat(headers.containsKey("X-Forwarded-Port")).isFalse();
                assertThat(headers.containsKey("X-Forwarded-Prefix")).isFalse();

                // X-Forwarded-For should be refreshed
                assertThat(headers.getFirst("X-Forwarded-For")).isEqualTo("10.0.0.1");
                return Mono.empty();
            });

            StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        }
    }

    @Nested
    @DisplayName("Filter ordering")
    class FilterOrdering {

        @Test
        @DisplayName("Should execute at HIGHEST_PRECEDENCE to run before other filters")
        void shouldHaveHighestPrecedence() {
            assertThat(filter.getOrder()).isEqualTo(Ordered.HIGHEST_PRECEDENCE);
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCases {

        @Test
        @DisplayName("Should handle request with no custom headers gracefully")
        void shouldHandleCleanRequest() {
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders")
                    .remoteAddress(new InetSocketAddress("10.0.0.1", 8080))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                assertThat(headers.getFirst("X-Forwarded-For")).isEqualTo("10.0.0.1");
                return Mono.empty();
            });

            StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
        }
    }
}
