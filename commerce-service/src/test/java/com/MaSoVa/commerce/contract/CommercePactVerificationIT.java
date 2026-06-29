package com.MaSoVa.commerce.contract;

import au.com.dius.pact.core.model.Interaction;
import au.com.dius.pact.core.model.Pact;
import au.com.dius.pact.provider.HttpClientFactory;
import au.com.dius.pact.provider.IHttpClientFactory;
import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junitsupport.IgnoreNoPactsToVerify;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.StateChangeAction;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.spring6.PactVerificationSpring6Provider;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import kotlin.Pair;
import org.apache.hc.client5.http.classic.methods.HttpUriRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;
import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("commerce-service")
@PactFolder("src/test/resources/pacts")
@IgnoreNoPactsToVerify
class CommercePactVerificationIT extends BaseFullIntegrationTest {

    /**
     * Read from the live Spring environment (not hardcoded) so this always matches whatever
     * jwt.secret is active - application-test.yml locally, or the JWT_SECRET env var override in CI.
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    @LocalServerPort
    int port;

    @BeforeEach
    void before(PactVerificationContext context) {
        if (context != null) {
            context.setTarget(new AuthInjectingTestTarget("localhost", port));
        }
    }

    @TestTemplate
    @ExtendWith(PactVerificationSpring6Provider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        if (context != null) { context.verifyInteraction(); }
    }

    /**
     * Pact-jvm's junit5 HttpTestTarget has no @TargetRequestFilter support (that hook only
     * exists in the junit4 module) - override prepareRequest to inject a real signed JWT so
     * requests pass commerce-service's auth filter. Pact only checks headers declared in the
     * contract, so this extra/overridden header does not break matching.
     */
    private final class AuthInjectingTestTarget extends HttpTestTarget {
        AuthInjectingTestTarget(String host, int port) {
            super(host, port, "/", () -> (IHttpClientFactory) new HttpClientFactory());
        }

        @Override
        public Pair<Object, Object> prepareRequest(Pact pact, Interaction interaction, Map<String, Object> context) {
            Pair<Object, Object> result = super.prepareRequest(pact, interaction, context);
            if (result != null && result.getFirst() instanceof HttpUriRequest httpRequest) {
                httpRequest.setHeader("Authorization", "Bearer " + generateTestJwt());
            }
            return result;
        }
    }

    private String generateTestJwt() {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        return Jwts.builder()
                .subject("pact-test-user")
                .claim("email", "pact-test@masova.com")
                .claim("roles", List.of("CUSTOMER"))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + Duration.ofMinutes(5).toMillis()))
                .signWith(key)
                .compact();
    }

    @State("menu items exist")
    void menuItemsExist() {
    }

    @State(value = "menu items exist", action = StateChangeAction.TEARDOWN)
    void cleanupMenuItems() {
    }

    @State("order exists with id ORDER-PACT-1")
    void orderExists() {
    }

    @State(value = "order exists with id ORDER-PACT-1", action = StateChangeAction.TEARDOWN)
    void cleanupOrder() {
    }

    @State("no data")
    void noData() {
    }
}
