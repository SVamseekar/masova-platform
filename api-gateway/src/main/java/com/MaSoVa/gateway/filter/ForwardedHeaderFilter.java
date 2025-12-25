package com.MaSoVa.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Global filter to clean up and prevent accumulation of forwarded headers.
 * This filter removes all forwarded headers to prevent header size overflow.
 */
@Component
public class ForwardedHeaderFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(ForwardedHeaderFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Remove all forwarded headers to prevent accumulation
        ServerHttpRequest cleanedRequest = request.mutate()
                .headers(headers -> {
                    // Remove standard forwarded headers
                    headers.remove("Forwarded");
                    headers.remove("X-Forwarded-For");
                    headers.remove("X-Forwarded-Proto");
                    headers.remove("X-Forwarded-Host");
                    headers.remove("X-Forwarded-Port");
                    headers.remove("X-Forwarded-Prefix");

                    // Add only essential forwarding information if needed
                    String remoteAddress = "unknown";
                    var remoteAddr = request.getRemoteAddress();
                    if (remoteAddr != null) {
                        var address = remoteAddr.getAddress();
                        if (address != null) {
                            String addr = address.getHostAddress();
                            if (addr != null) {
                                remoteAddress = addr;
                            }
                        }
                    }
                    headers.set("X-Forwarded-For", remoteAddress);

                    // Add protocol
                    String scheme = request.getURI().getScheme();
                    if (scheme != null) {
                        headers.set("X-Forwarded-Proto", scheme);
                    }

                    // Add original host
                    var host = request.getHeaders().getHost();
                    if (host != null) {
                        String hostString = host.getHostString();
                        if (hostString != null) {
                            headers.set("X-Forwarded-Host", hostString);
                        }
                    }
                })
                .build();

        logger.debug("Cleaned forwarded headers for request: {}", request.getPath());

        return chain.filter(exchange.mutate().request(cleanedRequest).build());
    }

    @Override
    public int getOrder() {
        // Execute this filter early in the chain, before authentication
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
