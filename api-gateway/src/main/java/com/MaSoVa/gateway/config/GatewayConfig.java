package com.MaSoVa.gateway.config;

import com.MaSoVa.gateway.filter.JwtAuthenticationFilter;
import com.MaSoVa.gateway.filter.RateLimitingFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * API Gateway route configuration — Phase 1 consolidated architecture (6 services).
 *
 * Service map:
 *   core-service         port 8085  — users, customers, notifications, campaigns, reviews
 *   commerce-service     port 8084  — menu, orders, kitchen, kitchen-equipment
 *   payment-service      port 8089  — payments, refunds (standalone for PCI DSS)
 *   logistics-service    port 8086  — delivery, dispatch, tracking, inventory, suppliers, waste
 *   intelligence-service port 8087  — analytics, BI, reports
 *   api-gateway          port 8080  — this service
 */
@Configuration
public class GatewayConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

                // ============================================================
                // CORE SERVICE (port 8096) — users, customers, notifications,
                //                            campaigns, reviews, responses
                // ============================================================

                // ── Canonical auth routes: POST /api/auth/* ──────────────────────────────
                .route("core_auth_login", r -> r.path("/api/auth/login")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(10, "auth"))))
                        .uri("http://localhost:8085"))

                .route("core_auth_register", r -> r.path("/api/auth/register")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(5, "register"))))
                        .uri("http://localhost:8085"))

                .route("core_auth_refresh", r -> r.path("/api/auth/refresh")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(20, "refresh"))))
                        .uri("http://localhost:8085"))

                .route("core_auth_logout", r -> r.path("/api/auth/logout")
                        .and().method("POST")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_auth_google", r -> r.path("/api/auth/google")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(20, "google_auth"))))
                        .uri("http://localhost:8085"))

                .route("core_auth_change_password", r -> r.path("/api/auth/change-password")
                        .and().method("POST")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_auth_validate_pin", r -> r.path("/api/auth/validate-pin")
                        .and().method("POST")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(30, "validate_pin"))))
                        .uri("http://localhost:8085"))

                .route("core_kiosk_public", r -> r.path("/api/users/kiosk/**")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(20, "kiosk"))))
                        .uri("http://localhost:8085"))

                // Stores — all stores routes served by core-service (no /public sub-path any more)
                .route("core_stores_public", r -> r.path("/api/stores")
                        .and().method("GET")
                        .uri("http://localhost:8085"))

                // Reviews — public rating display (no auth for customer-facing pages)
                .route("core_reviews_public", r -> r.path("/api/reviews/public/**")
                        .and().method("GET")
                        .uri("http://localhost:8085"))

                // POST /api/customers/get-or-create is service-to-service only — BLOCKED at gateway (internal only)

                // Users — all other protected user/store/session/shift operations
                .route("core_users", r -> r.path("/api/users/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "core_users")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_stores", r -> r.path("/api/stores/**")
                        .and().not(p -> p.path("/api/stores/public/**"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "core_stores")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_sessions", r -> r.path("/api/sessions/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(50, "core_sessions")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_shifts", r -> r.path("/api/shifts/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "core_shifts")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_customers", r -> r.path("/api/customers/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "core_customers")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_notifications", r -> r.path("/api/notifications/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "core_notifications")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_campaigns", r -> r.path("/api/campaigns/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "core_campaigns")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_reviews", r -> r.path("/api/reviews/**")
                        .and().not(p -> p.path("/api/reviews/public/**"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "core_reviews")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                .route("core_gdpr", r -> r.path("/api/gdpr/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "core_gdpr")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8085"))

                // /api/responses and /api/ratings have been merged into /api/reviews — route removed

                // Core: Swagger docs proxy
                .route("core_api_docs", r -> r.path("/core-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/core-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8085"))

                // ============================================================
                // COMMERCE SERVICE (port 8084) — menu, orders, kitchen
                // ============================================================

                // Menu — public browsing (no auth)
                .route("commerce_menu_public", r -> r.path("/api/menu/public", "/api/menu/public/**",
                                                            "/api/menu/items", "/api/menu/items/**",
                                                            "/api/menu/cuisine/**", "/api/menu/category/**")
                        .and().method("GET")
                        .uri("http://localhost:8084"))

                // Menu — admin mutations (auth required)
                .route("commerce_menu_admin", r -> r.path("/api/menu/admin/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "commerce_menu_admin")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                .route("commerce_menu_modify", r -> r.path("/api/menu/**")
                        .and().method("POST", "PUT", "DELETE", "PATCH")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(30, "commerce_menu_modify")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                // Orders — public tracking (email links, no auth)
                .route("commerce_orders_track", r -> r.path("/api/orders/track/**")
                        .and().method("GET")
                        .filters(f -> f.filter(rateLimitingFilter.apply(createRateLimitConfig(100, "commerce_track"))))
                        .uri("http://localhost:8084"))

                // Orders — protected
                .route("commerce_orders", r -> r.path("/api/orders/**")
                        .and().not(p -> p.path("/api/orders/track/**"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(200, "commerce_orders")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                // Kitchen queue and equipment (canonical path: /api/equipment)
                .route("commerce_kitchen", r -> r.path("/api/kitchen/**", "/api/equipment/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "commerce_kitchen")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))

                // WebSocket — order updates
                .route("commerce_websocket", r -> r.path("/api/ws/orders", "/api/ws/orders/**")
                        .filters(f -> f.rewritePath("/api(?<segment>.*)", "${segment}"))
                        .uri("ws://localhost:8084"))

                // Commerce: Swagger docs proxy
                .route("commerce_api_docs", r -> r.path("/commerce-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/commerce-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8084"))

                // ============================================================
                // PAYMENT SERVICE (port 8087) — standalone PCI DSS scope
                // ============================================================

                // Webhook — public (Razorpay callbacks, no auth)
                .route("payment_webhook", r -> r.path("/api/payments/webhook")
                        .and().method("POST")
                        .uri("http://localhost:8089"))

                // Payments — protected
                .route("payments_protected", r -> r.path("/api/payments/**")
                        .and().not(p -> p.path("/api/payments/webhook"))
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(50, "payments")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8089"))

                // Payment: Swagger docs proxy
                .route("payment_api_docs", r -> r.path("/payment-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/payment-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8089"))

                // ============================================================
                // LOGISTICS SERVICE (port 8095) — delivery, inventory
                // ============================================================

                // Delivery (merged: dispatch + tracking + performance — now all at /api/delivery)
                .route("logistics_delivery", r -> r.path("/api/delivery/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(150, "logistics_delivery")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                // Inventory, suppliers, purchase orders, waste
                .route("logistics_inventory", r -> r.path("/api/inventory/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "logistics_inventory")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                .route("logistics_suppliers", r -> r.path("/api/suppliers/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "logistics_suppliers")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                .route("logistics_purchase_orders", r -> r.path("/api/purchase-orders/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "logistics_purchase_orders")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                .route("logistics_waste", r -> r.path("/api/waste/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(60, "logistics_waste")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8086"))

                // WebSocket — delivery location updates
                .route("logistics_websocket", r -> r.path("/api/ws/delivery", "/api/ws/delivery/**")
                        .filters(f -> f.rewritePath("/api(?<segment>.*)", "${segment}"))
                        .uri("ws://localhost:8086"))

                // Logistics: Swagger docs proxy
                .route("logistics_api_docs", r -> r.path("/logistics-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/logistics-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8086"))

                // ============================================================
                // INTELLIGENCE SERVICE (port 8086) — analytics, BI, reports
                // ============================================================

                .route("intelligence_analytics", r -> r.path("/api/analytics/**", "/api/bi/**", "/api/reports/**")
                        .filters(f -> f
                            .filter(rateLimitingFilter.apply(createRateLimitConfig(100, "intelligence_analytics")))
                            .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("http://localhost:8087"))

                // Intelligence: Swagger docs proxy
                .route("intelligence_api_docs", r -> r.path("/intelligence-service/v3/api-docs")
                        .filters(f -> f.rewritePath("/intelligence-service(?<segment>.*)", "${segment}"))
                        .uri("http://localhost:8087"))

                // ============================================================
                // HEALTH CHECKS (per new service)
                // ============================================================

                .route("health_core", r -> r.path("/api/health/core", "/api/health/user",
                                                   "/api/health/customer", "/api/health/notification")
                        .uri("http://localhost:8085"))

                .route("health_commerce", r -> r.path("/api/health/commerce", "/api/health/menu",
                                                       "/api/health/order")
                        .uri("http://localhost:8084"))

                .route("health_payment", r -> r.path("/api/health/payment")
                        .uri("http://localhost:8089"))

                .route("health_logistics", r -> r.path("/api/health/logistics", "/api/health/delivery",
                                                        "/api/health/inventory")
                        .uri("http://localhost:8086"))

                .route("health_intelligence", r -> r.path("/api/health/intelligence", "/api/health/analytics")
                        .uri("http://localhost:8087"))

                // Default fallback
                .route("fallback", r -> r.path("/**")
                        .uri("http://localhost:8080/fallback"))

                .build();
    }

    private RateLimitingFilter.Config createRateLimitConfig(int requestsPerMinute, String routeType) {
        RateLimitingFilter.Config config = new RateLimitingFilter.Config();
        config.setRequestsPerMinute(requestsPerMinute);
        config.setRouteType(routeType);
        return config;
    }
}
