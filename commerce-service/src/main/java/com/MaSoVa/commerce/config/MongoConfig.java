package com.MaSoVa.commerce.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Dual MongoDB configuration for commerce-service.
 *
 * - PRIMARY:  masova_orders  — used by order repositories (OrderRepository, RatingTokenRepository, KitchenEquipmentRepository)
 * - SECONDARY: MaSoVa        — used by menu repositories (MenuItemRepository)
 *
 * Spring Data auto-config uses the primary MongoTemplate unless repositories explicitly
 * specify a different one. Since both order + menu repos are here, we wire them with
 * @EnableMongoRepositories on separate packages pointing to different MongoTemplates.
 */
@Configuration
public class MongoConfig {

    @Value("${orders.mongodb.uri:mongodb://localhost:27017/masova_orders}")
    private String ordersMongoUri;

    @Value("${spring.data.mongodb.uri:mongodb://localhost:27017/MaSoVa}")
    private String menuMongoUri;

    // ── Orders MongoDB (primary) ──────────────────────────────────────────────

    @Primary
    @Bean(name = "ordersMongoClient")
    public MongoClient ordersMongoClient() {
        return MongoClients.create(ordersMongoUri);
    }

    @Primary
    @Bean(name = "ordersMongoDatabaseFactory")
    public MongoDatabaseFactory ordersMongoDatabaseFactory() {
        return new SimpleMongoClientDatabaseFactory(ordersMongoClient(), extractDbName(ordersMongoUri));
    }

    @Bean(name = "mongoMappingContext")
    public MongoMappingContext mongoMappingContext() {
        return new MongoMappingContext();
    }

    @Primary
    @Bean(name = "mongoTemplate")
    public MongoTemplate ordersMongoTemplate() {
        return new MongoTemplate(ordersMongoDatabaseFactory());
    }

    // ── Menu MongoDB (secondary) ──────────────────────────────────────────────

    @Bean(name = "menuMongoClient")
    public MongoClient menuMongoClient() {
        return MongoClients.create(menuMongoUri);
    }

    @Bean(name = "menuMongoDatabaseFactory")
    public MongoDatabaseFactory menuMongoDatabaseFactory() {
        return new SimpleMongoClientDatabaseFactory(menuMongoClient(), extractDbName(menuMongoUri));
    }

    @Bean(name = "menuMongoTemplate")
    public MongoTemplate menuMongoTemplate() {
        return new MongoTemplate(menuMongoDatabaseFactory());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String extractDbName(String uri) {
        // mongodb://host:port/dbname  →  extract "dbname"
        int lastSlash = uri.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < uri.length() - 1) {
            String dbPart = uri.substring(lastSlash + 1);
            // Strip query params
            int q = dbPart.indexOf('?');
            return q >= 0 ? dbPart.substring(0, q) : dbPart;
        }
        throw new IllegalArgumentException("Cannot extract database name from URI: " + uri);
    }
}
