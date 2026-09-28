package com.MaSoVa.commerce.config;

import com.MaSoVa.shared.security.config.SecurityConfigurationBase;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig extends SecurityConfigurationBase {

    public SecurityConfig(JwtTokenProvider tokenProvider) {
        super(tokenProvider);
    }

    @Bean
    @Override
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                // Rating links in SMS/email only read the token; marking it used is internal (service token).
                auth.requestMatchers(HttpMethod.GET, "/api/orders/rating-token/*").permitAll();
                String[] publicEndpoints = getPublicEndpoints();
                if (publicEndpoints != null && publicEndpoints.length > 0) {
                    auth.requestMatchers(publicEndpoints).permitAll();
                }
                auth.anyRequest().authenticated();
            })
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        addServiceTokenFilter(http);

        return http.build();
    }

    /** Package-visible for unit tests (Task 12). */
    String[] getPublicEndpointsForTest() {
        return getPublicEndpoints();
    }

    @Override
    protected String[] getPublicEndpoints() {
        return new String[]{
            // ── Menu public endpoints ──────────────────────────────────────
            "/api/menu",           // public listing (no auth) — gateway route: commerce_menu_public
            "/api/menu/*",         // public item detail (no auth)
            "/api/menu/public/**",
            "/api/menu/public",
            "/api/menu/items",
            "/api/menu/items/**",
            "/api/menu/cuisine/**",
            "/api/menu/category/**",
            "/api/menu/dietary/**",
            "/api/menu/recipes/**",

            // ── Order public endpoints ─────────────────────────────────────
            // WebSocket for real-time KDS (auth enforced at STOMP subscribe layer)
            "/ws/**",
            "/api/ws/**",

            // Public order tracking (for email links)
            "/api/orders/track/**",
            "/orders/track/**",

            // Payment status arrives as an event from payment-service (masova.commerce.payment-status);
            // PATCH /api/orders/{id}/payment is staff-only manual correction.

            // ── Infrastructure ─────────────────────────────────────────────
            "/actuator/health",
            "/api/health/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
        };
    }
}
