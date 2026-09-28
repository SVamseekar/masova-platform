package com.MaSoVa.shared.security.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.spec.ECGenParameterSpec;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Service-to-service tokens")
class ServiceTokenTest {

    private static KeyPair coreKeys;
    private static KeyPair otherKeys;

    private ServiceTokenIssuer coreIssuer;
    private ServiceTokenVerifier commerceVerifier;

    private static KeyPair ecKeys() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        return generator.generateKeyPair();
    }

    private static String b64(byte[] der) {
        return Base64.getEncoder().encodeToString(der);
    }

    @BeforeEach
    void setUp() throws Exception {
        if (coreKeys == null) {
            coreKeys = ecKeys();
            otherKeys = ecKeys();
        }
        ServiceAuthProperties core = new ServiceAuthProperties();
        core.setName("core-service");
        core.setPrivateKey(b64(coreKeys.getPrivate().getEncoded()));
        coreIssuer = new ServiceTokenIssuer(core, Clock.systemUTC());

        ServiceAuthProperties commerce = new ServiceAuthProperties();
        commerce.setName("commerce-service");
        commerce.setTrusted(Map.of("core-service", List.of(b64(coreKeys.getPublic().getEncoded()))));
        commerceVerifier = new ServiceTokenVerifier(commerce);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletResponse run(MockHttpServletRequest request) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        new ServiceTokenAuthenticationFilter(commerceVerifier).doFilter(request, response, new MockFilterChain());
        return response;
    }

    private static List<String> authorities(Authentication auth) {
        return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }

    @Test
    @DisplayName("a token for this service grants its scopes as authorities")
    void validTokenAuthenticatesWithScopes() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ServiceTokenAuthenticationFilter.HEADER,
                "Bearer " + coreIssuer.issue("commerce-service", "orders:gdpr-anonymize"));

        MockHttpServletResponse response = run(request);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(auth.getName()).isEqualTo("service:core-service");
        assertThat(authorities(auth)).contains("SCOPE_orders:gdpr-anonymize", "ROLE_SERVICE");
    }

    @Test
    @DisplayName("a token meant for another service is rejected")
    void wrongAudienceIsRejected() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ServiceTokenAuthenticationFilter.HEADER,
                "Bearer " + coreIssuer.issue("payment-service", "payments:gdpr-anonymize"));

        assertThat(run(request).getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("a token signed by an untrusted key is rejected")
    void untrustedKeyIsRejected() throws Exception {
        ServiceAuthProperties forged = new ServiceAuthProperties();
        forged.setName("core-service");
        forged.setPrivateKey(b64(otherKeys.getPrivate().getEncoded()));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ServiceTokenAuthenticationFilter.HEADER,
                "Bearer " + new ServiceTokenIssuer(forged, Clock.systemUTC()).issue("commerce-service", "orders:gdpr-anonymize"));

        assertThat(run(request).getStatus()).isEqualTo(401);
    }

    @Test
    @DisplayName("an expired token is rejected")
    void expiredTokenIsRejected() throws Exception {
        ServiceAuthProperties core = new ServiceAuthProperties();
        core.setName("core-service");
        core.setPrivateKey(b64(coreKeys.getPrivate().getEncoded()));
        Clock past = Clock.fixed(Instant.now().minus(Duration.ofMinutes(10)), ZoneOffset.UTC);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ServiceTokenAuthenticationFilter.HEADER,
                "Bearer " + new ServiceTokenIssuer(core, past).issue("commerce-service", "orders:gdpr-anonymize"));

        assertThat(run(request).getStatus()).isEqualTo(401);
    }

    @Test
    @DisplayName("X-Internal-Service alone authenticates nothing")
    void internalServiceHeaderAloneIsIgnored() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Internal-Service", "core-service");

        assertThat(run(request).getStatus()).isEqualTo(200);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("an issuer without a private key refuses to mint tokens")
    void issuerWithoutKeyFailsClosed() {
        ServiceAuthProperties empty = new ServiceAuthProperties();
        empty.setName("core-service");

        assertThatThrownBy(() -> new ServiceTokenIssuer(empty, Clock.systemUTC()).issue("commerce-service", "x"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("a rotated-in second trusted key is accepted")
    void secondTrustedKeyIsAccepted() throws Exception {
        ServiceAuthProperties commerce = new ServiceAuthProperties();
        commerce.setName("commerce-service");
        commerce.setTrusted(Map.of("core-service", List.of(
                b64(coreKeys.getPublic().getEncoded()), b64(otherKeys.getPublic().getEncoded()))));
        commerceVerifier = new ServiceTokenVerifier(commerce);
        ServiceAuthProperties rotated = new ServiceAuthProperties();
        rotated.setName("core-service");
        rotated.setPrivateKey(b64(otherKeys.getPrivate().getEncoded()));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ServiceTokenAuthenticationFilter.HEADER,
                "Bearer " + new ServiceTokenIssuer(rotated, Clock.systemUTC()).issue("commerce-service", "orders:gdpr-anonymize"));

        assertThat(run(request).getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("blank trusted-key entries from unset env vars are ignored")
    void blankTrustedKeysAreIgnored() {
        ServiceAuthProperties commerce = new ServiceAuthProperties();
        commerce.setName("commerce-service");
        commerce.setTrusted(Map.of("core-service", List.of("", "  ")));

        ServiceTokenVerifier verifier = new ServiceTokenVerifier(commerce);

        assertThat(verifier.verify(coreIssuer.issue("commerce-service", "x"))).isEmpty();
    }
}
