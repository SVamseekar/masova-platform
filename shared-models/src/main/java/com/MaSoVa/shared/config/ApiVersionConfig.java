package com.MaSoVa.shared.config;

/**
 * API Versioning Configuration
 * Week 4: Centralized API version constants
 *
 * Usage:
 * - Use ApiVersionConfig.V1 as prefix for all API endpoints
 * - Example: @RequestMapping(ApiVersionConfig.V1 + "/orders")
 *
 * Migration Strategy:
 * 1. New endpoints should use /api/v1/resource
 * 2. Existing endpoints remain at /api/resource for backward compatibility
 * 3. Gradual migration over time with deprecation notices
 */
public final class ApiVersionConfig {

    private ApiVersionConfig() {
        // Utility class - prevent instantiation
    }

    /**
     * API Version 1 prefix
     * Use this for all new API endpoints
     */
    public static final String V1 = "/api/v1";

    /**
     * Legacy API prefix (no version)
     * For backward compatibility with existing clients
     * @deprecated Use V1 for all new endpoints
     */
    @Deprecated
    public static final String LEGACY = "/api";

    /**
     * API Version prefix for future use
     */
    public static final String V2 = "/api/v2";
}
