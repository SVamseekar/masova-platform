package com.MaSoVa.payment.config;

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

    @Override
    protected String[] getPublicEndpoints() {
        return new String[]{
            // Razorpay webhook endpoint (must be public for callbacks)
            "/api/payments/webhook",
            "/api/webhooks/**",

            // Stripe webhook endpoint (must be public — Stripe cannot send JWT)
            "/api/payments/webhook/stripe",

            // Dev seed only available when Profile is dev/demo (controller gated);
            // still require JWT in gateway — listed here only if called direct on :8089 for scripts.
            // Prefer manager JWT via gateway for /api/test-data/payments/**

            // Health and actuator endpoints
            "/actuator/health",
            "/api/health/**",

            // API documentation
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
        };
    }
}
