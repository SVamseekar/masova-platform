package com.MaSoVa.logistics.delivery.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Collections;

/**
 * Configuration for RestTemplate
 */
@Configuration
public class RestTemplateConfig {

    private final JwtForwardingInterceptor jwtForwardingInterceptor;

    public RestTemplateConfig(JwtForwardingInterceptor jwtForwardingInterceptor) {
        this.jwtForwardingInterceptor = jwtForwardingInterceptor;
    }

    @Bean
    public RestTemplate restTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setConnectionRequestTimeout(Duration.ofSeconds(5));

        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.setInterceptors(Collections.singletonList(jwtForwardingInterceptor));
        return restTemplate;
    }
}
