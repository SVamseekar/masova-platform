package com.MaSoVa.core.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Application configuration for notification service
 */
@Configuration
public class AppConfig {

    /**
     * RestTemplate bean for making HTTP requests to other services
     * Used by ManagerNotificationService to fetch manager emails from user-service
     */
    @Bean
    public RestTemplate restTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(3000);  // 3 seconds
        factory.setConnectionRequestTimeout(5000);  // 5 seconds
        return new RestTemplate(factory);
    }
}
