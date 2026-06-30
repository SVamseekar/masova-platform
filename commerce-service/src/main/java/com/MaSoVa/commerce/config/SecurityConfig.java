package com.MaSoVa.commerce.config;

import com.MaSoVa.shared.security.config.SecurityConfigurationBase;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig extends SecurityConfigurationBase {

    public SecurityConfig(JwtTokenProvider tokenProvider) {
        super(tokenProvider);
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

            // Public rating token validation (SMS/email links)
            "/api/orders/rating-token/**",

            // Payment status callback from payment-service
            "/api/orders/*/payment",

            // ── Infrastructure ─────────────────────────────────────────────
            "/actuator/health",
            "/api/health/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
        };
    }
}
