package com.MaSoVa.shared.security.service;

import io.jsonwebtoken.Jwts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Mints short-lived ES256 tokens that prove which service is calling, for which callee,
 * with which scopes. Sent in {@link ServiceTokenAuthenticationFilter#HEADER} so the end
 * user's JWT can stay in Authorization.
 */
public class ServiceTokenIssuer {

    private static final Logger log = LoggerFactory.getLogger(ServiceTokenIssuer.class);

    static final Duration LIFETIME = Duration.ofSeconds(60);

    private final String name;
    private final PrivateKey privateKey;
    private final Clock clock;

    public ServiceTokenIssuer(ServiceAuthProperties properties, Clock clock) {
        this.name = properties.getName();
        this.privateKey = parsePrivateKey(properties.getPrivateKey());
        this.clock = clock;
        if (this.privateKey == null) {
            log.warn("service-auth.private-key is not configured for {}; this service cannot issue service tokens "
                    + "(fine if it never calls another service's internal endpoints)", name);
        }
    }

    public String issue(String audience, String... scopes) {
        if (privateKey == null) {
            throw new IllegalStateException("service-auth.private-key is not set for " + name
                    + "; cannot call internal endpoints");
        }
        Instant now = clock.instant();
        return Jwts.builder()
                .header().keyId(name).and()
                .issuer(name)
                .audience().add(audience).and()
                .claim("scope", List.of(scopes))
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(LIFETIME)))
                .signWith(privateKey, Jwts.SIG.ES256)
                .compact();
    }

    /** Header value for an internal call. */
    public String bearer(String audience, String... scopes) {
        return "Bearer " + issue(audience, scopes);
    }

    private static PrivateKey parsePrivateKey(String base64) {
        if (base64 == null || base64.isBlank()) {
            return null;
        }
        try {
            byte[] der = Base64.getDecoder().decode(base64.trim());
            return KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(der));
        } catch (Exception e) {
            throw new IllegalStateException("service-auth.private-key is not a base64 PKCS#8 EC key", e);
        }
    }
}
