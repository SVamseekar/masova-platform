package com.MaSoVa.gateway.unit.filter;

import com.MaSoVa.gateway.filter.ManagerCopilotProxyFilter;
import com.sun.net.httpserver.HttpServer;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

@DisplayName("ManagerCopilotProxyFilter")
class ManagerCopilotProxyFilterTest {

    private static final String VALID_SECRET =
            "ThisIsAVeryLongSecretKeyThatIsAtLeast64CharactersLongForHS512Algorithm!!";
    private static final String SERVER_KEY = "server-side-agent-key";

    private HttpServer support;
    private final AtomicReference<String> outboundKey = new AtomicReference<>();
    private final AtomicReference<String> outboundBody = new AtomicReference<>();
    private final AtomicReference<String> outboundPath = new AtomicReference<>();
    private final AtomicReference<String> outboundUserId = new AtomicReference<>();
    private final AtomicReference<String> outboundStoreId = new AtomicReference<>();
    private int hits;

    @BeforeEach
    void setUp() throws IOException {
        hits = 0;
        outboundKey.set(null);
        outboundBody.set(null);
        outboundPath.set(null);
        outboundUserId.set(null);
        outboundStoreId.set(null);
        support = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        support.createContext("/", exchange -> {
            hits++;
            outboundKey.set(exchange.getRequestHeaders().getFirst("X-Agent-Api-Key"));
            outboundUserId.set(exchange.getRequestHeaders().getFirst("X-User-Id"));
            outboundStoreId.set(exchange.getRequestHeaders().getFirst("X-Store-Id"));
            outboundPath.set(exchange.getRequestURI().getPath());
            outboundBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] body = "{\"reply\":\"ok\",\"proposal_id\":\"prop-1\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        support.start();
    }

    @AfterEach
    void tearDown() {
        if (support != null) {
            support.stop(0);
        }
    }

    @Test
    @DisplayName("customer JWT is forbidden and support is not called")
    void customerJwtForbidden() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        MockServerWebExchange exchange = chatExchange(token("CUSTOMER"), "{\"message\":\"hi\"}");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(hits).isZero();
    }

    @Test
    @DisplayName("manager JWT is proxied with the server key; browser need not send it")
    void managerJwtProxiesWithServerKey() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        String json = "{\"message\":\"stock check\",\"session_id\":\"s1\",\"store_id\":\"store-1\"}";
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), json);

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(exchange.getResponse().getBodyAsString().block()).contains("prop-1");
        assertThat(exchange.getRequest().getHeaders().getFirst("X-Agent-Api-Key")).isNull();
        assertThat(outboundKey.get()).isEqualTo(SERVER_KEY);
        assertThat(outboundPath.get()).isEqualTo("/agent/manager/chat");
        assertThat(outboundBody.get()).isEqualTo(json);
        assertThat(hits).isEqualTo(1);
    }

    @Test
    @DisplayName("a spoofed store_id in the body is overwritten with the JWT's storeId (#133)")
    void spoofedStoreIdIsOverwritten() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        String json = "{\"message\":\"stock check\",\"store_id\":\"store-EVIL\"}";
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), json);

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(outboundBody.get()).isEqualTo("{\"message\":\"stock check\",\"store_id\":\"store-1\"}");
    }

    @Test
    @DisplayName("forwards X-User-Id and X-Store-Id from JWT claims for audit (#133)")
    void forwardsUserIdAndStoreIdHeadersForAudit() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), "{\"message\":\"hi\"}");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(outboundUserId.get()).isEqualTo("user-1");
        assertThat(outboundStoreId.get()).isEqualTo("store-1");
    }

    @Test
    @DisplayName("a JWT with a wrong-typed claim is rejected as unauthorized, not an unhandled 500 (B10 review)")
    void wrongTypedClaimIsUnauthorized() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        SecretKey key = Keys.hmacShaKeyFor(VALID_SECRET.getBytes(StandardCharsets.UTF_8));
        String badToken = Jwts.builder()
                .subject("user-1")
                .claim("userType", "MANAGER")
                .claim("storeId", 12345) // wrong type: storeId must be a String
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(key)
                .compact();
        MockServerWebExchange exchange = chatExchange(badToken, "{\"message\":\"hi\"}");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(hits).isZero();
    }

    @Test
    @DisplayName("an empty body is rejected with 400 rather than silently forwarded (B10 review)")
    void emptyBodyIsRejected() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), "");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(hits).isZero();
    }

    @Test
    @DisplayName("a failure reaching masova-support returns 502, not an unhandled error (B10 review)")
    void upstreamConnectionFailureReturns502() {
        ManagerCopilotProxyFilter filter = new ManagerCopilotProxyFilter(VALID_SECRET, SERVER_KEY, "http://127.0.0.1:1");
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), "{\"message\":\"hi\"}");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
    }

    @Test
    @DisplayName("a malformed JSON body is rejected with 400, not forwarded as-is (B10 review)")
    void malformedBodyIsRejected() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), "{not valid json");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(hits).isZero();
    }

    @Test
    @DisplayName("a non-object JSON body (array/string/number) is rejected with 400, not forwarded as-is (B10 review)")
    void nonObjectBodyIsRejected() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), "[\"not\",\"an\",\"object\"]");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(hits).isZero();
    }

    @Test
    @DisplayName("a manager JWT with no storeId claim is forbidden and support is not called")
    void missingStoreIdIsForbidden() {
        ManagerCopilotProxyFilter filter = filterWithKey(SERVER_KEY);
        String tokenWithNoStore = Jwts.builder()
                .subject("user-1")
                .claim("userType", "MANAGER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(Keys.hmacShaKeyFor(VALID_SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();
        MockServerWebExchange exchange = chatExchange(tokenWithNoStore, "{\"message\":\"hi\"}");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(hits).isZero();
    }

    @Test
    @DisplayName("a blacklisted (logged-out) manager token is rejected before reaching support (C5)")
    void blacklistedTokenIsRejected() {
        org.springframework.data.redis.core.ReactiveStringRedisTemplate redis =
                mock(org.springframework.data.redis.core.ReactiveStringRedisTemplate.class);
        org.mockito.Mockito.when(redis.hasKey(org.mockito.ArgumentMatchers.anyString())).thenReturn(Mono.just(true));
        String base = "http://127.0.0.1:" + support.getAddress().getPort();
        ManagerCopilotProxyFilter filter = new ManagerCopilotProxyFilter(VALID_SECRET, SERVER_KEY, base, redis);
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), "{\"message\":\"hi\"}");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(hits).isZero();
    }

    @Test
    @DisplayName("a Redis error checking the blacklist fails open, matching shared-security's convention")
    void redisErrorFailsOpen() {
        org.springframework.data.redis.core.ReactiveStringRedisTemplate redis =
                mock(org.springframework.data.redis.core.ReactiveStringRedisTemplate.class);
        org.mockito.Mockito.when(redis.hasKey(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(Mono.error(new RuntimeException("Redis down")));
        String base = "http://127.0.0.1:" + support.getAddress().getPort();
        ManagerCopilotProxyFilter filter = new ManagerCopilotProxyFilter(VALID_SECRET, SERVER_KEY, base, redis);
        MockServerWebExchange exchange = chatExchange(token("MANAGER"), "{\"message\":\"hi\"}");

        StepVerifier.create(filter.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(hits).isEqualTo(1);
    }

    @Test
    @DisplayName("assistant manager may resolve a proposal; missing server key is 503")
    void assistantManagerResolveAndMissingKey() {
        ManagerCopilotProxyFilter allowed = filterWithKey(SERVER_KEY);
        String json = "{\"status\":\"APPROVED\"}";
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/agent/proposals/prop-9/resolve")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ASSISTANT_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(json));

        StepVerifier.create(allowed.filter(exchange, noopChain())).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(outboundPath.get()).isEqualTo("/agent/proposals/prop-9/resolve");
        assertThat(outboundKey.get()).isEqualTo(SERVER_KEY);
        // store_id is stamped from the JWT even though the client's body never sent one (#133)
        assertThat(outboundBody.get()).isEqualTo("{\"status\":\"APPROVED\",\"store_id\":\"store-1\"}");

        ManagerCopilotProxyFilter unconfigured = filterWithKey("");
        MockServerWebExchange blocked = chatExchange(token("MANAGER"), "{\"message\":\"hi\"}");
        int hitsBefore = hits;
        StepVerifier.create(unconfigured.filter(blocked, noopChain())).verifyComplete();
        assertThat(blocked.getResponse().getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(hits).isEqualTo(hitsBefore);
    }

    private ManagerCopilotProxyFilter filterWithKey(String agentApiKey) {
        String base = "http://127.0.0.1:" + support.getAddress().getPort();
        return new ManagerCopilotProxyFilter(VALID_SECRET, agentApiKey, base);
    }

    private MockServerWebExchange chatExchange(String jwt, String json) {
        return MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/agent/manager/chat")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(json));
    }

    private String token(String userType) {
        SecretKey key = Keys.hmacShaKeyFor(VALID_SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject("user-1")
                .claim("userType", userType)
                .claim("storeId", "store-1")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(key)
                .compact();
    }

    private WebFilterChain noopChain() {
        WebFilterChain chain = mock(WebFilterChain.class);
        org.mockito.Mockito.when(chain.filter(org.mockito.ArgumentMatchers.any())).thenReturn(Mono.empty());
        return chain;
    }
}
