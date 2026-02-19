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

                // Order Service - Public Tracking (no auth required for email links)
                .route("orders_tracking_public", r -> r.path("/api/orders/track/**")
                        .and().method("GET")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(100, "tracking_public"))))
                        .uri("http://localhost:8083"))

                // Order Service - All Other Routes Protected (higher limit for high-traffic)
                .route("orders_protected", r -> r.path("/api/orders/**")
                        .and().not(p -> p.path("/api/orders/track/**"))
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

                // WebSocket Routes - Delivery Service → logistics-service (port 8095)
                .route("websocket_delivery", r -> r.path("/api/ws/delivery", "/api/ws/delivery/**")
                        .filters(f -> f.rewritePath("/api(?<segment>.*)", "${segment}"))
                        .uri("ws://localhost:8095"))

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

                // Inventory routes → logistics-service (port 8095)
                .route("inventory_protected", r -> r.path("/api/inventory/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "inventory")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8095"))

                .route("suppliers_protected", r -> r.path("/api/suppliers/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "suppliers")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8095"))

                .route("purchase_orders_protected", r -> r.path("/api/purchase-orders/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "purchase_orders")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8095"))

                .route("waste_protected", r -> r.path("/api/waste/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "waste")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8095"))

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

                // Delivery routes → logistics-service (port 8095)
                .route("delivery_protected", r -> r.path("/api/delivery/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "delivery")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8095"))

                .route("dispatch_protected", r -> r.path("/api/dispatch/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "dispatch")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8095"))

                .route("tracking_protected", r -> r.path("/api/tracking/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "tracking")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8095"))

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

                // ============================================
                // COMMERCE SERVICE (port 8084 — menu + orders unified)
                // These routes shadow menu-service and order-service during migration.
                // Once validated, the old service routes above can be removed.
                // ============================================

                // Commerce: Public menu browsing
                .route("commerce_menu_public", r -> r.path("/api/menu/public", "/api/menu/public/**")
                        .and().method("GET")
                        .uri("http://localhost:8084"))

                .route("commerce_menu_items_get", r -> r.path("/api/menu/items", "/api/menu/items/**")
                        .and().method("GET")
                        .uri("http://localhost:8084"))

                .route("commerce_menu_category", r -> r.path("/api/menu/cuisine/**", "/api/menu/category/**")
                        .and().method("GET")
                        .uri("http://localhost:8084"))

                // Commerce: Protected menu admin
                .route("commerce_menu_admin", r -> r.path("/api/menu/admin/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "commerce_menu_admin")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                .route("commerce_menu_modify", r -> r.path("/api/menu/items/**")
                        .and().method("POST", "PUT", "DELETE", "PATCH")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "commerce_menu_modify")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                // Commerce: Public order tracking
                .route("commerce_orders_track", r -> r.path("/api/orders/track/**")
                        .and().method("GET")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(100, "commerce_track"))))
                        .uri("http://localhost:8084"))

                // Commerce: Protected orders
                .route("commerce_orders_protected", r -> r.path("/api/orders/**")
                        .and().not(p -> p.path("/api/orders/track/**"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "commerce_orders")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                // Commerce: Kitchen routes
                .route("commerce_kitchen", r -> r.path("/api/kitchen/**", "/api/kitchen-equipment/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "commerce_kitchen")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                // Commerce: WebSocket
                .route("commerce_websocket", r -> r.path("/api/ws/orders", "/api/ws/orders/**")
                        .filters(f -> f.rewritePath("/api(?<segment>.*)", "${segment}"))
                        .uri("ws://localhost:8084"))

                // Commerce: Swagger docs proxy
                .route("commerce_api_docs", r -> r.path("/commerce-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/commerce-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8084"))

                // Logistics: Swagger docs proxy
                .route("logistics_api_docs", r -> r.path("/logistics-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/logistics-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8095"))

                // Intelligence Service (Analytics) routes — port 8086
                .route("intelligence_analytics", r -> r.path("/api/analytics/**", "/api/bi/**", "/api/reports/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "intelligence_analytics")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                // Intelligence: Swagger docs proxy
                .route("intelligence_api_docs", r -> r.path("/intelligence-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/intelligence-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8086"))

                // Core Service (User + Customer + Notification + Review) routes — port 8096
                .route("core_auth", r -> r.path("/api/auth/**", "/api/users/login", "/api/users/register",
                                                "/api/users/refresh", "/api/users/logout", "/api/users/google")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "core_auth"))))
                        .uri("http://localhost:8096"))

                .route("core_users", r -> r.path("/api/users/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "core_users")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8096"))

                .route("core_customers", r -> r.path("/api/customers/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "core_customers")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8096"))

                .route("core_notifications", r -> r.path("/api/notifications/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "core_notifications")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8096"))

                .route("core_campaigns", r -> r.path("/api/campaigns/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "core_campaigns")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8096"))

                .route("core_reviews", r -> r.path("/api/reviews/**", "/api/responses/**", "/api/ratings/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "core_reviews")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8096"))

                // Core: Swagger docs proxy
                .route("core_api_docs", r -> r.path("/core-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/core-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8096"))

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
