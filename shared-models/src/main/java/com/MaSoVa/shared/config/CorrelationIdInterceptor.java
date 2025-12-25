package com.MaSoVa.shared.config;

import org.slf4j.MDC;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * RestTemplate interceptor to propagate correlation ID to downstream services.
 * PROD-002: Correlation ID propagation
 *
 * Usage: Add this to RestTemplate bean configuration:
 * <pre>
 * @Bean
 * public RestTemplate restTemplate(CorrelationIdInterceptor correlationIdInterceptor) {
 *     RestTemplate restTemplate = new RestTemplate();
 *     restTemplate.setInterceptors(List.of(correlationIdInterceptor));
 *     return restTemplate;
 * }
 * </pre>
 */
@Component
public class CorrelationIdInterceptor implements ClientHttpRequestInterceptor {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";

    @Override
    public ClientHttpResponse intercept(
            HttpRequest request,
            byte[] body,
            ClientHttpRequestExecution execution) throws IOException {

        // Get correlation ID from MDC (set by CorrelationIdFilter)
        String correlationId = MDC.get(CORRELATION_ID_MDC_KEY);

        // Add to outgoing request headers if present
        if (correlationId != null && !correlationId.isEmpty()) {
            request.getHeaders().add(CORRELATION_ID_HEADER, correlationId);
        }

        // Continue with the request
        return execution.execute(request, body);
    }
}
