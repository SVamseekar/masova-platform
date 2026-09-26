package com.MaSoVa.shared.security.config;

import com.MaSoVa.shared.security.filter.JwtAuthenticationFilter;
import com.MaSoVa.shared.security.service.ServiceTokenAuthenticationFilter;
import com.MaSoVa.shared.security.service.ServiceTokenVerifier;
import org.springframework.beans.factory.annotation.Autowired;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

public abstract class SecurityConfigurationBase {

    protected final JwtTokenProvider tokenProvider;

    private ServiceTokenVerifier serviceTokenVerifier;

    protected SecurityConfigurationBase(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    /**
     * Override this method to define which endpoints are public (no authentication required)
     * Example: return new String[]{"/api/menu/public/**", "/api/health/**"};
     */
    protected abstract String[] getPublicEndpoints();

    @Autowired(required = false)
    public void setServiceTokenVerifier(ServiceTokenVerifier serviceTokenVerifier) {
        this.serviceTokenVerifier = serviceTokenVerifier;
    }

    /**
     * Adds service-to-service token authentication after the user JWT filter, so an internal
     * call is identified as the calling service. Without a verifier, no service token is accepted.
     */
    protected void addServiceTokenFilter(HttpSecurity http) {
        if (serviceTokenVerifier != null) {
            http.addFilterAfter(new ServiceTokenAuthenticationFilter(serviceTokenVerifier), JwtAuthenticationFilter.class);
        }
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(tokenProvider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                // Public endpoints defined by each service
                String[] publicEndpoints = getPublicEndpoints();
                if (publicEndpoints != null && publicEndpoints.length > 0) {
                    auth.requestMatchers(publicEndpoints).permitAll();
                }
                // All other endpoints require authentication
                auth.anyRequest().authenticated();
            })
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        addServiceTokenFilter(http);

        return http.build();
    }
}
