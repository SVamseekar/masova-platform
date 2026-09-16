package com.MaSoVa.core.config;

import com.MaSoVa.shared.security.config.SecurityConfigurationBase;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig extends SecurityConfigurationBase {

    public SecurityConfig(JwtTokenProvider tokenProvider) {
        super(tokenProvider);
    }

    /** Package-visible for unit tests (public store path contract). */
    String[] getPublicEndpointsForTest() {
        return getPublicEndpoints();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    protected String[] getPublicEndpoints() {
        return new String[]{
            // Canonical auth endpoints
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/auth/google",
            "/api/auth/validate-pin",
            // Legacy auth paths (kept for backwards compat during transition)
            "/api/users/login",
            "/api/users/register",
            "/api/users/refresh",
            "/api/users/logout",
            "/api/users/kiosk/**",
            "/api/users/auth/google",
            "/api/users/auth/google/register",
            // Public store browsing (customer store picker / menu entry — no auth)
            // Mutations remain @PreAuthorize(MANAGER) on StoreController
            "/api/stores",
            "/api/stores/**",
            // Legacy aliases (if any callers still use /public)
            "/api/stores/public",
            "/api/stores/public/**",
            "/api/menu/public/**",
            "/api/reviews/public/**",
            // Dev/demo seed bootstrap (controller only loaded under @Profile dev|demo)
            "/api/test-data/**",
            // Health and docs
            "/actuator/health",
            "/api/health/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
        };
    }
}
