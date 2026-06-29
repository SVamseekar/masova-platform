package com.MaSoVa.gateway.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.cors.reactive.CorsUtils;
import org.springframework.web.cors.reactive.CorsWebFilter;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CorsConfig (Task 14)")
class CorsConfigTest {

    private final CorsWebFilter corsWebFilter = new CorsConfig().corsWebFilter();

    @Test
    @DisplayName("allows configured MaSoVa production origin")
    void allowsProductionOrigin() {
        MockServerWebExchange exchange = preflightExchange("https://masova-restaurant.vercel.app");

        StepVerifier.create(corsWebFilter.filter(exchange, ex -> Mono.empty()))
                .verifyComplete();

        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
                .isEqualTo("https://masova-restaurant.vercel.app");
    }

    @Test
    @DisplayName("does not echo Access-Control-Allow-Origin for unknown origins")
    void rejectsUnknownOrigin() {
        MockServerWebExchange exchange = preflightExchange("https://evil-phishing.example.com");

        StepVerifier.create(corsWebFilter.filter(exchange, ex -> Mono.empty()))
                .verifyComplete();

        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
                .isNull();
    }

    @Test
    @DisplayName("resolveAllowedOrigins excludes wildcard entries")
    void allowedOriginsAreExplicit() {
        assertThat(new CorsConfig().resolveAllowedOrigins())
                .noneMatch(origin -> origin.contains("*"));
        assertThat(new CorsConfig().resolveAllowedOrigins())
                .contains("https://masova.souravamseekar.com");
    }

    private MockServerWebExchange preflightExchange(String origin) {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.OPTIONS, "https://api.masova.com/api/orders")
                .header(HttpHeaders.ORIGIN, origin)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        assertThat(CorsUtils.isPreFlightRequest(request)).isTrue();
        return exchange;
    }
}