package com.MaSoVa.user;

import com.MaSoVa.user.service.WorkingSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PreDestroy;
import java.time.Duration;

@SpringBootApplication(scanBasePackages = {"com.MaSoVa.user", "com.MaSoVa.shared"})
@EnableMongoAuditing
@EnableAsync
@EnableCaching
public class UserServiceApplication {

    @Autowired
    private WorkingSessionService workingSessionService;

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setConnectionRequestTimeout(Duration.ofSeconds(5));
        return new RestTemplate(factory);
    }

    /**
     * Phase 1: Shutdown hook to auto-close all active working sessions
     * when services are stopped (VSCode closed, mvn clean, etc.)
     */
    @PreDestroy
    public void onShutdown() {
        System.out.println("===========================================");
        System.out.println("[UserService] Service shutdown initiated");
        System.out.println("[UserService] Closing all active working sessions...");
        System.out.println("===========================================");

        try {
            // Auto-close all active sessions
            workingSessionService.closeAllActiveSessions();
            System.out.println("[UserService] All sessions closed successfully");
        } catch (Exception e) {
            System.err.println("[UserService] Error closing sessions on shutdown: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("[UserService] Shutdown cleanup complete");
    }
}