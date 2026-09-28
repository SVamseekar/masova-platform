package com.MaSoVa.shared.security.service;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates internal calls from another MaSoVa service.
 * A present but invalid service token is rejected with 401 (fail closed).
 * X-Internal-Service is not an authorization and is ignored.
 */
public class ServiceTokenAuthenticationFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Service-Authorization";

    private static final Logger log = LoggerFactory.getLogger(ServiceTokenAuthenticationFilter.class);

    private final ServiceTokenVerifier verifier;

    public ServiceTokenAuthenticationFilter(ServiceTokenVerifier verifier) {
        this.verifier = verifier;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HEADER);
        if (header == null || header.isBlank()) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.startsWith("Bearer ") ? header.substring(7) : header;
        Optional<Claims> claims = verifier.verify(token);
        if (claims.isEmpty()) {
            log.warn("Rejected invalid service token on {} {}", request.getMethod(), request.getRequestURI());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid service token");
            return;
        }
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_SERVICE"));
        ServiceTokenVerifier.scopes(claims.get())
                .forEach(scope -> authorities.add(new SimpleGrantedAuthority("SCOPE_" + scope)));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "service:" + claims.get().getIssuer(), null, authorities));
        chain.doFilter(request, response);
    }
}
