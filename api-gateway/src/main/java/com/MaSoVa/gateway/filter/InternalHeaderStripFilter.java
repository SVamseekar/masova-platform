package com.MaSoVa.gateway.filter;

import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Removes headers that only MaSoVa services may send to each other, before any route runs.
 * Internal calls go service to service, never through the gateway.
 */
@Component
public class InternalHeaderStripFilter implements WebFilter, Ordered {

    private static final String[] INTERNAL_HEADERS = {"X-Service-Authorization", "X-Internal-Service"};

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        boolean present = false;
        for (String header : INTERNAL_HEADERS) {
            present |= exchange.getRequest().getHeaders().containsKey(header);
        }
        if (!present) {
            return chain.filter(exchange);
        }
        return chain.filter(exchange.mutate()
                .request(request -> request.headers(headers -> {
                    for (String header : INTERNAL_HEADERS) {
                        headers.remove(header);
                    }
                }))
                .build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
