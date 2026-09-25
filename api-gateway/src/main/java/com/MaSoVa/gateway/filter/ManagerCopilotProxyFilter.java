package com.MaSoVa.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Proxies manager copilot calls to masova-support. The browser sends the staff JWT.
 * This filter adds X-Agent-Api-Key from the server environment and never logs that value.
 */
@Component
public class ManagerCopilotProxyFilter implements WebFilter {

    private static final Pattern PROPOSAL_RESOLVE =
            Pattern.compile("^/api/agent/proposals/([A-Za-z0-9_-]+)/resolve$");

    private final String jwtSecret;
    private final String agentApiKey;
    private final WebClient webClient;

    public ManagerCopilotProxyFilter(
            @Value("${jwt.secret:}") String jwtSecret,
            @Value("${support.agent-api-key:}") String agentApiKey,
            @Value("${support.service-url:http://localhost:8000}") String supportBaseUrl) {
        this.jwtSecret = jwtSecret;
        this.agentApiKey = agentApiKey == null ? "" : agentApiKey.trim();
        String base = supportBaseUrl == null ? "http://localhost:8000" : supportBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        this.webClient = WebClient.builder().baseUrl(base).build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String upstream = upstreamPath(exchange.getRequest().getPath().value());
        if (upstream == null) {
            return chain.filter(exchange);
        }
        if (exchange.getRequest().getMethod() != HttpMethod.POST) {
            return complete(exchange, HttpStatus.METHOD_NOT_ALLOWED, "");
        }

        String auth = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            return complete(exchange, HttpStatus.UNAUTHORIZED, "");
        }

        final String userType;
        try {
            Claims claims = parseToken(auth.substring(7));
            userType = claims.get("userType", String.class);
        } catch (Exception ex) {
            return complete(exchange, HttpStatus.UNAUTHORIZED, "");
        }

        if (!"MANAGER".equals(userType) && !"ASSISTANT_MANAGER".equals(userType)) {
            return complete(exchange, HttpStatus.FORBIDDEN, "");
        }
        if (agentApiKey.isEmpty()) {
            return complete(exchange, HttpStatus.SERVICE_UNAVAILABLE, "");
        }

        return DataBufferUtils.join(exchange.getRequest().getBody())
                .defaultIfEmpty(exchange.getResponse().bufferFactory().wrap(new byte[0]))
                .flatMap(buffer -> {
                    byte[] bytes = new byte[buffer.readableByteCount()];
                    buffer.read(bytes);
                    DataBufferUtils.release(buffer);
                    String json = new String(bytes, StandardCharsets.UTF_8);
                    return webClient.post()
                            .uri(upstream)
                            .header("X-Agent-Api-Key", agentApiKey)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(json)
                            .exchangeToMono(response -> response.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(body -> complete(
                                            exchange,
                                            HttpStatus.resolve(response.statusCode().value()),
                                            body)));
                });
    }

    private String upstreamPath(String path) {
        if ("/api/agent/manager/chat".equals(path)) {
            return "/agent/manager/chat";
        }
        Matcher matcher = PROPOSAL_RESOLVE.matcher(path);
        if (matcher.matches()) {
            return "/agent/proposals/" + matcher.group(1) + "/resolve";
        }
        return null;
    }

    private Claims parseToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        if (claims.getExpiration().before(new Date())) {
            throw new IllegalArgumentException("expired");
        }
        return claims;
    }

    private Mono<Void> complete(ServerWebExchange exchange, HttpStatus status, String body) {
        exchange.getResponse().setStatusCode(status == null ? HttpStatus.BAD_GATEWAY : status);
        if (body == null || body.isEmpty()) {
            return exchange.getResponse().setComplete();
        }
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
