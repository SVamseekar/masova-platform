package com.MaSoVa.analytics.config;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;

/**
 * Interceptor to forward JWT tokens from incoming requests to outgoing RestTemplate calls
 * This enables proper authentication for microservice-to-microservice communication
 */
@Component
public class JwtForwardingInterceptor implements ClientHttpRequestInterceptor {

    private static final Logger log = LoggerFactory.getLogger(JwtForwardingInterceptor.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";

    // All headers that need to be forwarded for multi-tenant support
    private static final String[] HEADERS_TO_FORWARD = {
        "X-User-Id",
        "X-User-Type",
        "X-Selected-Store-Id",
        "X-User-Store-Id",
        "X-Store-ID"
    };

    @Override
    @NonNull
    public ClientHttpResponse intercept(@NonNull HttpRequest request, @NonNull byte[] body, @NonNull ClientHttpRequestExecution execution) throws IOException {
        // Get the current HTTP request from the context
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            HttpServletRequest currentRequest = attributes.getRequest();

            // Forward Authorization header (JWT token)
            String authHeader = currentRequest.getHeader(AUTHORIZATION_HEADER);
            if (authHeader != null && !authHeader.isEmpty()) {
                request.getHeaders().add(AUTHORIZATION_HEADER, authHeader);
                log.debug("Forwarding JWT token to: {}", request.getURI());
            } else {
                log.warn("No JWT token found in request to forward to: {}", request.getURI());
            }

            // Forward all store and user context headers
            for (String headerName : HEADERS_TO_FORWARD) {
                String headerValue = currentRequest.getHeader(headerName);
                if (headerValue != null && !headerValue.isEmpty()) {
                    request.getHeaders().add(headerName, (String) headerValue);
                    log.debug("Forwarding {}: {} to: {}", headerName, headerValue, request.getURI());
                }
            }
        } else {
            log.warn("No request context available - cannot forward headers to: {}", request.getURI());
        }

        return execution.execute(request, body);
    }
}
