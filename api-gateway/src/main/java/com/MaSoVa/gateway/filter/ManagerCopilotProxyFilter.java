package com.MaSoVa.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
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
 *
 * The client-sent body's store_id is never trusted: it is overwritten with the JWT-attested
 * storeId before forwarding, and X-User-Id/X-Store-Id go upstream for audit (#133). Every
 * manager/assistant-manager JWT in this codebase carries exactly one storeId claim (no
 * multi-store concept exists yet) — if that ever changes, this should become a membership
 * check against an allowed-stores claim rather than a blind overwrite.
 */
@Component
public class ManagerCopilotProxyFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(ManagerCopilotProxyFilter.class);
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    private static final Pattern PROPOSAL_RESOLVE =
            Pattern.compile("^/api/agent/proposals/([A-Za-z0-9_-]+)/resolve$");

    private final String jwtSecret;
    private final String agentApiKey;
    private final WebClient webClient;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ManagerCopilotProxyFilter(String jwtSecret, String agentApiKey, String supportBaseUrl) {
        this(jwtSecret, agentApiKey, supportBaseUrl, null);
    }

    @Autowired
    public ManagerCopilotProxyFilter(
            @Value("${jwt.secret:}") String jwtSecret,
            @Value("${support.agent-api-key:}") String agentApiKey,
            @Value("${support.service-url:http://localhost:8000}") String supportBaseUrl,
            ReactiveStringRedisTemplate redisTemplate) {
        this.jwtSecret = jwtSecret;
        this.agentApiKey = agentApiKey == null ? "" : agentApiKey.trim();
        String base = supportBaseUrl == null ? "http://localhost:8000" : supportBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        this.webClient = WebClient.builder().baseUrl(base).build();
        this.redisTemplate = redisTemplate;
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
        String token = auth.substring(7);

        final Claims claims;
        try {
            claims = parseToken(token);
        } catch (Exception ex) {
            return complete(exchange, HttpStatus.UNAUTHORIZED, "");
        }

        String userType = claims.get("userType", String.class);
        if (!"MANAGER".equals(userType) && !"ASSISTANT_MANAGER".equals(userType)) {
            return complete(exchange, HttpStatus.FORBIDDEN, "");
        }

        String userId = claims.getSubject();
        String storeId = claims.get("storeId", String.class);
        if (storeId == null || storeId.isBlank()) {
            log.warn("Manager copilot call with no storeId claim, userId={}", userId);
            return complete(exchange, HttpStatus.FORBIDDEN, "");
        }

        if (agentApiKey.isEmpty()) {
            return complete(exchange, HttpStatus.SERVICE_UNAVAILABLE, "");
        }

        return isBlacklisted(token).flatMap(blacklisted -> {
            if (blacklisted) {
                return complete(exchange, HttpStatus.UNAUTHORIZED, "");
            }
            return proxyRequest(exchange, upstream, userId, storeId);
        });
    }

    private Mono<Void> proxyRequest(ServerWebExchange exchange, String upstream, String userId, String storeId) {
        return DataBufferUtils.join(exchange.getRequest().getBody())
                .defaultIfEmpty(exchange.getResponse().bufferFactory().wrap(new byte[0]))
                .flatMap(buffer -> {
                    byte[] bytes = new byte[buffer.readableByteCount()];
                    buffer.read(bytes);
                    DataBufferUtils.release(buffer);
                    String json = withStoreId(new String(bytes, StandardCharsets.UTF_8), storeId, userId);
                    if (json == null) {
                        return complete(exchange, HttpStatus.BAD_REQUEST, "");
                    }
                    return webClient.post()
                            .uri(upstream)
                            .header("X-Agent-Api-Key", agentApiKey)
                            .header("X-User-Id", userId)
                            .header("X-Store-Id", storeId)
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

    /**
     * Forces the body's store_id to the JWT-attested value — the client's own store_id is never
     * trusted (#133). A body that can't be safely rewritten (unparseable, or not a JSON object)
     * is rejected rather than forwarded as-is, matching the fail-closed policy used elsewhere in
     * this filter (missing storeId claim, blacklisted token). Returns null to signal rejection.
     */
    private String withStoreId(String json, String storeId, String userId) {
        if (json.isEmpty()) {
            return json;
        }
        JsonNode node;
        try {
            node = objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            log.warn("Rejecting manager copilot request with unparseable body, userId={}, storeId={}: {}",
                    userId, storeId, e.getMessage());
            return null;
        }
        if (!node.isObject()) {
            log.warn("Rejecting manager copilot request with non-object body, userId={}, storeId={}",
                    userId, storeId);
            return null;
        }
        try {
            ((ObjectNode) node).put("store_id", storeId);
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            log.warn("Rejecting manager copilot request; failed to serialize rewritten body, userId={}, storeId={}: {}",
                    userId, storeId, e.getMessage());
            return null;
        }
    }

    private Mono<Boolean> isBlacklisted(String token) {
        if (redisTemplate == null) {
            return Mono.just(false);
        }
        return redisTemplate.hasKey(BLACKLIST_PREFIX + token)
                .onErrorReturn(false); // fail-open: don't lock managers out if Redis is down
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
