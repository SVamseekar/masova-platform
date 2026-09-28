package com.MaSoVa.gateway.unit.filter;

import com.MaSoVa.gateway.filter.InternalHeaderStripFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class InternalHeaderStripFilterTest {

    @Test
    @DisplayName("external callers cannot present internal-only headers")
    void stripsInternalHeaders() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/api/orders/gdpr/anonymize")
                .header("X-Service-Authorization", "Bearer forged")
                .header("X-Internal-Service", "core-service")
                .header("Authorization", "Bearer user"));
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();

        new InternalHeaderStripFilter().filter(exchange, e -> {
            forwarded.set(e);
            return Mono.empty();
        }).block();

        assertThat(forwarded.get().getRequest().getHeaders().containsKey("X-Service-Authorization")).isFalse();
        assertThat(forwarded.get().getRequest().getHeaders().containsKey("X-Internal-Service")).isFalse();
        assertThat(forwarded.get().getRequest().getHeaders().getFirst("Authorization")).isEqualTo("Bearer user");
    }
}
