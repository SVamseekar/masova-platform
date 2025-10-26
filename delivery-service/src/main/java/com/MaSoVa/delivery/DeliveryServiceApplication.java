package com.MaSoVa.delivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Delivery Service - Manages auto-dispatch, route optimization, and live tracking
 * Port: 8090
 */
@SpringBootApplication
@EnableCaching
@EnableMongoRepositories
public class DeliveryServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeliveryServiceApplication.class, args);
    }
}
