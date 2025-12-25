package com.MaSoVa.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
@RestController
public class ApiGatewayApplication {

    private static final Logger logger = LoggerFactory.getLogger(ApiGatewayApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
        logger.info("================================================================================");
        logger.info("MaSoVa API Gateway Started Successfully!");
        logger.info("Gateway running on port: 8080");
        logger.info("Routing to 10 microservices:");
        logger.info("  1. User Service         → http://localhost:8081");
        logger.info("  2. Menu Service         → http://localhost:8082");
        logger.info("  3. Order Service        → http://localhost:8083");
        logger.info("  4. Analytics Service    → http://localhost:8085");
        logger.info("  5. Payment Service      → http://localhost:8086");
        logger.info("  6. Inventory Service    → http://localhost:8088");
        logger.info("  7. Review Service       → http://localhost:8089");
        logger.info("  8. Delivery Service     → http://localhost:8090");
        logger.info("  9. Customer Service     → http://localhost:8091");
        logger.info(" 10. Notification Service → http://localhost:8092");
        logger.info("================================================================================");
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "API Gateway");
        response.put("version", "1.0.0");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    @GetMapping("/fallback")
    public Map<String, String> fallback() {
        Map<String, String> response = new HashMap<>();
        response.put("error", "Service Unavailable");
        response.put("message", "The requested service is currently unavailable. Please try again later.");
        return response;
    }
}