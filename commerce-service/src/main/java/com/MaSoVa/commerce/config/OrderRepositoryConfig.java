package com.MaSoVa.commerce.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Binds order-domain repositories to the primary orders MongoTemplate (masova_orders DB).
 */
@Configuration
@EnableMongoRepositories(
        basePackages = "com.MaSoVa.commerce.order.repository",
        mongoTemplateRef = "mongoTemplate"
)
public class OrderRepositoryConfig {
}
