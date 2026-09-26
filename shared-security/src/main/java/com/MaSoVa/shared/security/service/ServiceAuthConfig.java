package com.MaSoVa.shared.security.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
@EnableConfigurationProperties(ServiceAuthProperties.class)
public class ServiceAuthConfig {

    @Bean
    public ServiceTokenIssuer serviceTokenIssuer(ServiceAuthProperties properties,
                                                 @Value("${spring.application.name:unknown-service}") String appName) {
        defaultName(properties, appName);
        return new ServiceTokenIssuer(properties, Clock.systemUTC());
    }

    @Bean
    public ServiceTokenVerifier serviceTokenVerifier(ServiceAuthProperties properties,
                                                     @Value("${spring.application.name:unknown-service}") String appName) {
        defaultName(properties, appName);
        return new ServiceTokenVerifier(properties);
    }

    private static void defaultName(ServiceAuthProperties properties, String appName) {
        if (properties.getName() == null || properties.getName().isBlank()) {
            properties.setName(appName);
        }
    }
}
