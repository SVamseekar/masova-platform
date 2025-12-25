package com.MaSoVa.gateway.config;

import com.MaSoVa.gateway.filter.JwtAuthenticationFilter;
import com.MaSoVa.gateway.filter.RateLimitingFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // ============================================
                // PUBLIC ROUTES (No Authentication Required)
                // ============================================

                // Auth Routes - Login/Register (mapped to user service /api/users/*)
                // Rate limited to 10 requests per minute per IP for login/register
                .route("auth_login", r -> r.path("/api/users/login")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(10, "auth"))))
                        .uri("http://localhost:8081"))

                .route("kiosk_auto_login", r -> r.path("/api/users/kiosk/auto-login")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(20, "kiosk"))))
                        .uri("http://localhost:8081"))

                .route("auth_register", r -> r.path("/api/users/register")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(5, "register"))))
                        .uri("http://localhost:8081"))

                .route("auth_refresh", r -> r.path("/api/users/refresh")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(20, "refresh"))))
                        .uri("http://localhost:8081"))

                .route("auth_logout", r -> r.path("/api/users/logout")
                        .and().method("POST")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                // Public Menu Browsing
                .route("menu_public", r -> r.path("/api/menu/public", "/api/menu/public/**")
                        .and().method("GET")
                        .uri("http://localhost:8082"))

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

                // Customer Service - Public Routes (get-or-create for checkout)
                .route("customers_public_get_or_create", r -> r.path("/api/customers/get-or-create")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(50, "customer_create"))))
                        .uri("http://localhost:8091"))

                // ============================================
                // PROTECTED ROUTES (Authentication Required)
                // All protected routes have rate limiting (100 req/min default)
                // ============================================

                // User Service - Protected Routes
                .route("users_protected", r -> r.path("/api/users/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "users")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                .route("sessions_protected", r -> r.path("/api/sessions/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(50, "sessions")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                .route("stores_protected", r -> r.path("/api/stores/**")
                        .and().not(p -> p.path("/api/stores/public/**"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "stores")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                .route("shifts_protected", r -> r.path("/api/shifts/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "shifts")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))

                // Menu Service - Protected Routes (Create/Update/Delete)
                .route("menu_admin", r -> r.path("/api/menu/admin/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "menu_admin")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8082"))

                .route("menu_modify", r -> r.path("/api/menu/items/**")
                        .and().method("POST", "PUT", "DELETE", "PATCH")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "menu_modify")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8082"))

                // Order Service - All Routes Protected (higher limit for high-traffic)
                .route("orders_protected", r -> r.path("/api/orders/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "orders")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8083"))

                .route("kitchen_protected", r -> r.path("/api/kitchen/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "kitchen")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8083"))

                // WebSocket Routes - Order Service (No JWT filter for WebSocket handshake)
                .route("websocket_orders", r -> r.path("/api/ws/orders", "/api/ws/orders/**")
                        .filters(f -> f.rewritePath("/api(?<segment>.*)", "${segment}"))
                        .uri("ws://localhost:8083"))

                // WebSocket Routes - Delivery Service (No JWT filter for WebSocket handshake)
                .route("websocket_delivery", r -> r.path("/api/ws/delivery", "/api/ws/delivery/**")
                        .filters(f -> f.rewritePath("/api(?<segment>.*)", "${segment}"))
                        .uri("ws://localhost:8090"))

                // Analytics Routes - Protected (increased limit for dashboard concurrent requests)
                .route("analytics_protected", r -> r.path("/api/analytics/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "analytics")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                // Payment Service - Protected Routes (All except webhook)
                .route("payments_protected", r -> r.path("/api/payments/**")
                        .and().not(p -> p.path("/api/payments/webhook"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(50, "payments")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                // Inventory Service - Protected Routes
                .route("inventory_protected", r -> r.path("/api/inventory/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "inventory")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8088"))

                .route("suppliers_protected", r -> r.path("/api/suppliers/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "suppliers")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8088"))

                .route("purchase_orders_protected", r -> r.path("/api/purchase-orders/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "purchase_orders")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8088"))

                .route("waste_protected", r -> r.path("/api/waste/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "waste")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8088"))

                // Customer Service - Protected Routes
                .route("customers_protected", r -> r.path("/api/customers/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "customers")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8091"))

                // Kitchen Equipment - Protected Routes
                .route("kitchen_equipment_protected", r -> r.path("/api/kitchen-equipment/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "equipment")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8083"))

                // Review Service - Protected Routes
                .route("reviews_protected", r -> r.path("/api/reviews/**")
                        .and().not(p -> p.path("/api/reviews/public/**"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "reviews")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8089"))

                .route("responses_protected", r -> r.path("/api/responses/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "responses")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8089"))

                // Delivery Service - Protected Routes (higher limit for tracking updates)
                .route("delivery_protected", r -> r.path("/api/delivery/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "delivery")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8090"))

                .route("dispatch_protected", r -> r.path("/api/dispatch/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "dispatch")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8090"))

                .route("tracking_protected", r -> r.path("/api/tracking/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "tracking")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8090"))

                // Notification Service - Protected Routes
                .route("notifications_protected", r -> r.path("/api/notifications/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "notifications")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8092"))

                .route("campaigns_protected", r -> r.path("/api/campaigns/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "campaigns")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8092"))

                // Default fallback
                .route("fallback", r -> r.path("/**")
                        .uri("http://localhost:8080/fallback"))

                .build();
    }

    /**
     * Creates a rate limit configuration with specified requests per minute and route type.
     */
    private RateLimitingFilter.Config createRateLimitConfig(int requestsPerMinute, String routeType) {
        RateLimitingFilter.Config config = new RateLimitingFilter.Config();
        config.setRequestsPerMinute(requestsPerMinute);
        config.setRouteType(routeType);
        return config;
    }
}
