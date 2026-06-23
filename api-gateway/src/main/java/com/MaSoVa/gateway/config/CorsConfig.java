package com.MaSoVa.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class CorsConfig {

    /**
     * Explicit production/preview origins — {@code setAllowedOrigins} does not support wildcards.
     * Additional origins can be supplied via {@code CORS_ALLOWED_ORIGINS} (comma-separated).
     */
    static final List<String> DEFAULT_ALLOWED_ORIGINS = List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080",
            "https://masova.souravamseekar.com",
            "https://masova-restaurant.vercel.app",
            "https://masova-restaurant-martisoura-5934s-projects.vercel.app",
            "https://masova-restaurant-martisoura-5934-martisoura-5934s-projects.vercel.app",
            "https://masova-restaurant-anwptt007-martisoura-5934s-projects.vercel.app",
            "https://masova-restaurant-git-main-martisoura-5934s-projects.vercel.app"
    );

    @Value("${cors.allowed-origins:}")
    private String extraAllowedOrigins;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOrigins(resolveAllowedOrigins());

        corsConfig.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        corsConfig.setAllowedHeaders(List.of("*"));
        corsConfig.setAllowCredentials(true);
        corsConfig.setExposedHeaders(Arrays.asList(
                "Authorization",
                "X-User-Id",
                "X-User-Type",
                "X-Store-Id"
        ));
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }

    List<String> resolveAllowedOrigins() {
        List<String> origins = new ArrayList<>(DEFAULT_ALLOWED_ORIGINS);
        if (extraAllowedOrigins != null && !extraAllowedOrigins.isBlank()) {
            Arrays.stream(extraAllowedOrigins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(origins::add);
        }
        return origins.stream().distinct().collect(Collectors.toList());
    }
}