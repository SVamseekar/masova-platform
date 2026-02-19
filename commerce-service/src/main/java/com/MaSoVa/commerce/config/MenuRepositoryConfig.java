package com.MaSoVa.commerce.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Binds menu-domain repositories to the secondary menuMongoTemplate (MaSoVa DB).
 */
@Configuration
@EnableMongoRepositories(
        basePackages = "com.MaSoVa.commerce.menu.repository",
        mongoTemplateRef = "menuMongoTemplate"
)
public class MenuRepositoryConfig {
}
