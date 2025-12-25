package com.MaSoVa.user.config;

import com.MaSoVa.user.security.JwtAuthenticationFilter;
import com.MaSoVa.user.service.JwtService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Autowired
    private JwtService jwtService;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtService);
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF disabled for stateless REST API with JWT authentication
            // CSRF protection is not needed because:
            // 1. JWT tokens are sent in Authorization header (not cookies)
            // 2. Custom headers cannot be set by browsers in cross-origin requests without CORS
            // 3. API is stateless - no session cookies to be exploited
            .csrf(csrf -> csrf.disable())
            // CORS is handled by API Gateway - do not configure here to avoid duplicate headers
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/users/register", "/api/users/login", "/api/users/refresh").permitAll()
                .requestMatchers("/api/test-data/**").permitAll() // Allow test/migration endpoints
                // Secure actuator endpoints - only health and info are public, rest require authentication
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("MANAGER")
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**").permitAll()
                // Public store endpoints - allow customers to view stores
                .requestMatchers("/api/stores", "/api/stores/{storeId}", "/api/stores/code/{storeCode}",
                                "/api/stores/nearby", "/api/stores/{storeId}/operational-status").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}