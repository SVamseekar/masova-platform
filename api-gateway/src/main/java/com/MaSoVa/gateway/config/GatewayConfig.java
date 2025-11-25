package com.MaSoVa.gateway.config;

import com.MaSoVa.gateway.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // ============================================
                // PUBLIC ROUTES (No Authentication Required)
                // ============================================

                // Auth Routes - Login/Register
                .route("auth_login", r -> r.path("/api/auth/login")
                        .uri("http://localhost:8081"))

                .route("auth_register", r -> r.path("/api/auth/register")
                        .uri("http://localhost:8081"))

                .route("auth_refresh", r -> r.path("/api/auth/refresh")
                        .uri("http://localhost:8081"))

                // Public Menu Browsing
                .route("menu_public_all", r -> r.path("/api/menu/items")
                        .and().method("GET")
                        .uri("http://localhost:8082"))

                .route("menu_public_by_id", r -> r.path("/api/menu/items/**")
                        .and().method("GET")
                        .uri("http://localhost:8082"))

                .route("menu_public_by_cuisine", r -> r.path("/api/menu/cuisine/**")
                        .and().method("GET")
                        .uri("http://localhost:8082"))

                .route("menu_public_by_category", r -> r.path("/api/menu/category/**")
                        .and().method("GET")
                        .uri("http://localhost:8082"))

                // Stores - Public Information
                .route("stores_public", r -> r.path("/api/stores/public/**")
                        .uri("http://localhost:8081"))

                // Health Checks
                .route("health_user", r -> r.path("/api/health/user")
                        .uri("http://localhost:8081"))

                .route("health_menu", r -> r.path("/api/health/menu")
                        .uri("http://localhost:8082"))

                .route("health_order", r -> r.path("/api/health/order")
                        .uri("http://localhost:8083"))

                // Payment Service - Webhook (Public - Razorpay callbacks)
                .route("payment_webhook", r -> r.path("/api/payments/webhook")
                        .and().method("POST")
                        .uri("http://localhost:8086"))

                // Review Service - Public Routes (ratings display)
                .route("reviews_public", r -> r.path("/api/reviews/public/**")
                        .and().method("GET")
                        .uri("http://localhost:8089"))

                // ============================================
                // PROTECTED ROUTES (Authentication Required)
                // ============================================

                // User Service - Protected Routes
                .route("users_protected", r -> r.path("/api/users/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                .route("sessions_protected", r -> r.path("/api/sessions/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                .route("stores_protected", r -> r.path("/api/stores/**")
                        .and().not(p -> p.path("/api/stores/public/**"))
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                .route("shifts_protected", r -> r.path("/api/shifts/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                // Menu Service - Protected Routes (Create/Update/Delete)
                .route("menu_admin", r -> r.path("/api/menu/admin/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8082"))

                .route("menu_modify", r -> r.path("/api/menu/items/**")
                        .and().method("POST", "PUT", "DELETE", "PATCH")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8082"))

                // Order Service - All Routes Protected
                .route("orders_protected", r -> r.path("/api/orders/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8083"))

                .route("kitchen_protected", r -> r.path("/api/kitchen/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8083"))

                // Analytics Routes - Protected
                .route("analytics_protected", r -> r.path("/api/analytics/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                // Payment Service - Protected Routes (All except webhook)
                .route("payments_protected", r -> r.path("/api/payments/**")
                        .and().not(p -> p.path("/api/payments/webhook"))
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                // Inventory Service - Protected Routes
                .route("inventory_protected", r -> r.path("/api/inventory/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8088"))

                // Customer Service - Protected Routes
                .route("customers_protected", r -> r.path("/api/customers/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8091"))

                // Kitchen Equipment - Protected Routes
                .route("kitchen_equipment_protected", r -> r.path("/api/kitchen-equipment/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8083"))

                // Review Service - Protected Routes
                .route("reviews_protected", r -> r.path("/api/reviews/**")
                        .and().not(p -> p.path("/api/reviews/public/**"))
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8089"))

                .route("responses_protected", r -> r.path("/api/responses/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8089"))

                // Default fallback
                .route("fallback", r -> r.path("/**")
                        .uri("http://localhost:8080/fallback"))

                .build();
    }
}
