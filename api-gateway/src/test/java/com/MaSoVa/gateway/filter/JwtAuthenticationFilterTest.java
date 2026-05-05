package com.MaSoVa.gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.SecretKey;
import java.lang.reflect.Field;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("JwtAuthenticationFilter")
class JwtAuthenticationFilterTest {

    private JwtAuthenticationFilter filter;
    private GatewayFilterChain chain;

    // A 64-character secret key for HS512 compatibility
    private static final String VALID_SECRET =
            "ThisIsAVeryLongSecretKeyThatIsAtLeast64CharactersLongForHS512Algorithm!!";

    @BeforeEach
    void setUp() throws Exception {
        filter = new JwtAuthenticationFilter();
        setField(filter, "secretKey", VALID_SECRET);

        chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    // ---- Helper methods ----

    private String generateValidToken(String userId, String userType, String storeId) {
        SecretKey key = Keys.hmacShaKeyFor(VALID_SECRET.getBytes());
        var builder = Jwts.builder()
                .subject(userId)
                .claim("userType", userType)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000));

        if (storeId != null) {
            builder.claim("storeId", storeId);
        }

        return builder.signWith(key).compact();
    }

    private String generateExpiredToken(String userId, String userType) {
        SecretKey key = Keys.hmacShaKeyFor(VALID_SECRET.getBytes());
        return Jwts.builder()
                .subject(userId)
                .claim("userType", userType)
                .issuedAt(new Date(System.currentTimeMillis() - 7200_000))
                .expiration(new Date(System.currentTimeMillis() - 3600_000))
                .signWith(key)
                .compact();
    }

    private MockServerWebExchange createExchangeWithAuthHeader(String authHeader) {
        MockServerHttpRequest.BaseBuilder<?> requestBuilder = MockServerHttpRequest.get("/api/orders");
        if (authHeader != null) {
            requestBuilder.header(HttpHeaders.AUTHORIZATION, authHeader);
        }
        return MockServerWebExchange.from(requestBuilder);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    // ---- Tests for validateSecretKey (@PostConstruct) ----

    @Nested
    @DisplayName("Secret key validation on startup")
    class SecretKeyValidation {

        @Test
        @DisplayName("Should throw IllegalStateException when secret key is null")
        void shouldRejectNullSecretKey() throws Exception {
            JwtAuthenticationFilter testFilter = new JwtAuthenticationFilter();
            setField(testFilter, "secretKey", null);

            assertThatThrownBy(testFilter::validateSecretKey)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("JWT secret key is not configured");
        }

        @Test
        @DisplayName("Should throw IllegalStateException when secret key is empty")
        void shouldRejectEmptySecretKey() throws Exception {
            JwtAuthenticationFilter testFilter = new JwtAuthenticationFilter();
            setField(testFilter, "secretKey", "");

            assertThatThrownBy(testFilter::validateSecretKey)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("JWT secret key is not configured");
        }

        @Test
        @DisplayName("Should throw IllegalStateException when secret key is too short")
        void shouldRejectShortSecretKey() throws Exception {
            JwtAuthenticationFilter testFilter = new JwtAuthenticationFilter();
            setField(testFilter, "secretKey", "ShortKey123");

            assertThatThrownBy(testFilter::validateSecretKey)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("too short");
        }

        @Test
        @DisplayName("Should accept a valid 64+ character secret key")
        void shouldAcceptValidSecretKey() throws Exception {
            JwtAuthenticationFilter testFilter = new JwtAuthenticationFilter();
            setField(testFilter, "secretKey", VALID_SECRET);

            // Should not throw
            testFilter.validateSecretKey();
        }

        @Test
        @DisplayName("Should warn when key contains predictable patterns but not fail")
        void shouldWarnOnPredictableKey() throws Exception {
            JwtAuthenticationFilter testFilter = new JwtAuthenticationFilter();
            String predictableKey = "ThisSecretKeyContainsTheWordSecretAndIsLongEnoughToPassLengthCheck!!!";
            setField(testFilter, "secretKey", predictableKey);

            // Should not throw - only warns
            testFilter.validateSecretKey();
        }
    }

    // ---- Tests for filter apply (token validation) ----

    @Nested
    @DisplayName("Token extraction and validation")
    class TokenValidation {

        @Test
        @DisplayName("Should return 401 when Authorization header is missing")
        void shouldReject_whenNoAuthorizationHeader() {
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = MockServerWebExchange.from(
                    MockServerHttpRequest.get("/api/orders"));

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("Should return 401 when Authorization header does not start with Bearer")
        void shouldReject_whenNotBearerToken() {
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Basic abc123");

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("Should return 401 when token is malformed")
        void shouldReject_whenTokenIsMalformed() {
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer not-a-valid-jwt");

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("Should return 401 when token is expired")
        void shouldReject_whenTokenIsExpired() {
            String expiredToken = generateExpiredToken("user123", "CUSTOMER");
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + expiredToken);

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("Should return 401 when token is signed with a different key")
        void shouldReject_whenTokenSignedWithWrongKey() {
            String wrongSecret = "ADifferentSecretKeyThatIsAlsoAtLeast64CharactersLongForHS512Algorithm!!";
            SecretKey wrongKey = Keys.hmacShaKeyFor(wrongSecret.getBytes());
            String token = Jwts.builder()
                    .subject("user123")
                    .claim("userType", "CUSTOMER")
                    .expiration(new Date(System.currentTimeMillis() + 3600_000))
                    .signWith(wrongKey)
                    .compact();

            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
    }

    // ---- Tests for successful validation and header forwarding ----

    @Nested
    @DisplayName("Successful authentication and header forwarding")
    class SuccessfulAuth {

        @Test
        @DisplayName("Should forward user info headers for a valid CUSTOMER token")
        void shouldForwardHeaders_forCustomerToken() {
            String token = generateValidToken("cust-001", "CUSTOMER", null);
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());

            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            // Capture the modified exchange passed to the chain
            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                assertThat(headers.getFirst("X-User-Id")).isEqualTo("cust-001");
                assertThat(headers.getFirst("X-User-Type")).isEqualTo("CUSTOMER");
                return Mono.empty();
            });

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();
        }

        @Test
        @DisplayName("Should forward storeId header for staff users")
        void shouldForwardStoreId_forStaffToken() {
            String token = generateValidToken("staff-001", "STAFF", "store-abc");
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());

            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                assertThat(headers.getFirst("X-User-Store-Id")).isEqualTo("store-abc");
                return Mono.empty();
            });

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();
        }

        @Test
        @DisplayName("Should forward X-Selected-Store-Id if present in original request")
        void shouldForwardSelectedStoreId_ifPresent() {
            String token = generateValidToken("mgr-001", "MANAGER", "store-abc");
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());

            MockServerHttpRequest request = MockServerHttpRequest.get("/api/orders")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header("X-Selected-Store-Id", "store-xyz")
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(request);

            when(chain.filter(any())).thenAnswer(invocation -> {
                org.springframework.web.server.ServerWebExchange modifiedExchange = invocation.getArgument(0);
                HttpHeaders headers = modifiedExchange.getRequest().getHeaders();

                assertThat(headers.getFirst("X-Selected-Store-Id")).isEqualTo("store-xyz");
                return Mono.empty();
            });

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();
        }
    }

    // ---- Tests for store context enforcement ----

    @Nested
    @DisplayName("Store context requirement for staff roles")
    class StoreContextEnforcement {

        @Test
        @DisplayName("Should return 403 when MANAGER token has no storeId")
        void shouldRejectManager_withoutStoreId() {
            String token = generateValidToken("mgr-001", "MANAGER", null);
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @DisplayName("Should return 403 when STAFF token has empty storeId")
        void shouldRejectStaff_withEmptyStoreId() {
            String token = generateValidToken("staff-001", "STAFF", "  ");
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @DisplayName("Should return 403 when DRIVER token has no storeId")
        void shouldRejectDriver_withoutStoreId() {
            String token = generateValidToken("drv-001", "DRIVER", null);
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @DisplayName("Should return 403 when KIOSK token has no storeId")
        void shouldRejectKiosk_withoutStoreId() {
            String token = generateValidToken("kiosk-001", "KIOSK", null);
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @DisplayName("Should allow CUSTOMER token without storeId")
        void shouldAllowCustomer_withoutStoreId() {
            String token = generateValidToken("cust-001", "CUSTOMER", null);
            GatewayFilter gatewayFilter = filter.apply(new JwtAuthenticationFilter.Config());
            MockServerWebExchange exchange = createExchangeWithAuthHeader("Bearer " + token);

            StepVerifier.create(gatewayFilter.filter(exchange, chain))
                    .verifyComplete();

            // Should NOT be forbidden - customers do not need storeId
            assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
        }
    }
}
