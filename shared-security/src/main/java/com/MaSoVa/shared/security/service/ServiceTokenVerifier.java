package com.MaSoVa.shared.security.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Verifies service tokens against the trusted public keys of each calling service. */
public class ServiceTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(ServiceTokenVerifier.class);

    private final String name;
    private final Map<String, List<PublicKey>> trusted = new HashMap<>();

    public ServiceTokenVerifier(ServiceAuthProperties properties) {
        this.name = properties.getName();
        properties.getTrusted().forEach((issuer, keys) -> {
            List<PublicKey> parsed = keys.stream()
                    .filter(key -> key != null && !key.isBlank())
                    .map(ServiceTokenVerifier::parsePublicKey)
                    .toList();
            trusted.put(issuer, parsed);
            if (parsed.isEmpty()) {
                log.warn("no trusted keys configured for issuer '{}' on {}; its service tokens will always be rejected",
                        issuer, name);
            } else {
                log.info("loaded {} trusted key(s) for issuer '{}' on {}", parsed.size(), issuer, name);
            }
        });
    }

    /** Verified claims, or empty when the token is invalid, expired, untrusted or for another service. */
    public Optional<Claims> verify(String token) {
        String issuer = unverifiedKeyId(token);
        for (PublicKey key : trusted.getOrDefault(issuer, List.of())) {
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .requireIssuer(issuer)
                        .requireAudience(name)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
                return Optional.of(claims);
            } catch (JwtException | IllegalArgumentException e) {
                // try the next key (rotation) — not attacker-facing, safe to log the reason for ops diagnosis
                log.debug("service token rejected for issuer '{}' on {}: {}: {}",
                        issuer, name, e.getClass().getSimpleName(), e.getMessage());
            }
        }
        return Optional.empty();
    }

    @SuppressWarnings("unchecked")
    static List<String> scopes(Claims claims) {
        Object scope = claims.get("scope");
        return scope instanceof Collection<?> values
                ? values.stream().map(String::valueOf).toList()
                : List.of();
    }

    private static String unverifiedKeyId(String token) {
        try {
            String header = new String(Base64.getUrlDecoder().decode(token.substring(0, token.indexOf('.'))));
            int start = header.indexOf("\"kid\":\"");
            if (start < 0) {
                return "";
            }
            start += 7;
            return header.substring(start, header.indexOf('"', start));
        } catch (RuntimeException e) {
            log.debug("malformed service token header: {}: {}", e.getClass().getSimpleName(), e.getMessage());
            return "";
        }
    }

    private static PublicKey parsePublicKey(String base64) {
        try {
            byte[] der = Base64.getDecoder().decode(base64.trim());
            return KeyFactory.getInstance("EC").generatePublic(new X509EncodedKeySpec(der));
        } catch (Exception e) {
            throw new IllegalStateException("service-auth.trusted key is not a base64 X.509 EC public key", e);
        }
    }
}
