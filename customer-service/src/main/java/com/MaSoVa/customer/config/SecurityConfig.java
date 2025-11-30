package com.MaSoVa.customer.config;

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
