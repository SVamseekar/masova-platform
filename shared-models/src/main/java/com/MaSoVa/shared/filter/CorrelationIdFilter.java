package com.MaSoVa.shared.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter to add correlation ID, store ID, and user ID to all requests for distributed tracing.
 * PROD-002: Request correlation IDs across microservices
 * Week 5: Enhanced with Store ID and User ID extraction for structured logging
 *
 * MDC Context includes:
 * 1. correlationId - Extracted from X-Correlation-ID header or generated as UUID
 * 2. storeId - Extracted from X-Store-ID header
 * 3. userId - Extracted from X-User-ID header
 *
 * Usage: This filter is automatically applied when included in the classpath.
 * To propagate to downstream services, use CorrelationIdInterceptor with RestTemplate.
 */
@Component
@Order(1) // Execute first in the filter chain
public class CorrelationIdFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(CorrelationIdFilter.class);

    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    public static final String STORE_ID_HEADER = "X-Store-ID";
    public static final String USER_ID_HEADER = "X-User-ID";

    public static final String CORRELATION_ID_MDC_KEY = "correlationId";
    public static final String STORE_ID_MDC_KEY = "storeId";
    public static final String USER_ID_MDC_KEY = "userId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        try {
            // Extract or generate correlation ID
            String correlationId = httpRequest.getHeader(CORRELATION_ID_HEADER);

            if (correlationId == null || correlationId.trim().isEmpty()) {
                correlationId = generateCorrelationId();
                log.debug("Generated new correlation ID: {}", correlationId);
            } else {
                log.debug("Using existing correlation ID from header: {}", correlationId);
            }

            // Add correlation ID to MDC
            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);

            // Extract and add Store ID to MDC (if present)
            String storeId = httpRequest.getHeader(STORE_ID_HEADER);
            if (storeId != null && !storeId.trim().isEmpty()) {
                MDC.put(STORE_ID_MDC_KEY, storeId);
                log.debug("Store ID from header: {}", storeId);
            }

            // Extract and add User ID to MDC (if present)
            String userId = httpRequest.getHeader(USER_ID_HEADER);
            if (userId != null && !userId.trim().isEmpty()) {
                MDC.put(USER_ID_MDC_KEY, userId);
                log.debug("User ID from header: {}", userId);
            }

            // Add correlation ID to response headers
            httpResponse.setHeader(CORRELATION_ID_HEADER, correlationId);

            log.debug("Processing request: {} {} [correlationId={}, storeId={}, userId={}]",
                    httpRequest.getMethod(),
                    httpRequest.getRequestURI(),
                    correlationId,
                    storeId != null ? storeId : "N/A",
                    userId != null ? userId : "N/A");

            // Continue with the request
            chain.doFilter(request, response);

        } finally {
            // Clean up MDC to prevent memory leaks
            MDC.remove(CORRELATION_ID_MDC_KEY);
            MDC.remove(STORE_ID_MDC_KEY);
            MDC.remove(USER_ID_MDC_KEY);
        }
    }

    /**
     * Generate a new correlation ID
     *
     * @return UUID string without hyphens for compactness
     */
    private String generateCorrelationId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("CorrelationIdFilter initialized - request correlation tracking enabled");
    }

    @Override
    public void destroy() {
        log.info("CorrelationIdFilter destroyed");
    }
}
