package com.MaSoVa.commerce.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Authenticates PATCH /api/orders/{id}/payment when the shared callback secret matches.
 * Does not grant a staff role. X-Internal-Service is ignored.
 */
public class InternalPaymentCredentialFilter extends OncePerRequestFilter {

    static final String HEADER = "X-Internal-Payment-Credential";
    private static final Pattern PAYMENT_PATH = Pattern.compile("/api/orders/[^/]+/payment");
    private static final String AUTHORITY = "ROLE_INTERNAL_PAYMENT_CALLBACK";

    private final String secret;

    public InternalPaymentCredentialFilter(String secret) {
        this.secret = secret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (isPaymentCallback(request) && credentialMatches(request.getHeader(HEADER))) {
            var authentication = new UsernamePasswordAuthenticationToken(
                    "payment-service", null, List.of(new SimpleGrantedAuthority(AUTHORITY)));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        filterChain.doFilter(request, response);
    }

    private boolean isPaymentCallback(HttpServletRequest request) {
        return "PATCH".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI() != null
                && PAYMENT_PATH.matcher(request.getRequestURI()).matches();
    }

    private boolean credentialMatches(String presented) {
        if (secret == null || secret.isBlank() || presented == null || presented.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                secret.getBytes(StandardCharsets.UTF_8),
                presented.getBytes(StandardCharsets.UTF_8));
    }
}
