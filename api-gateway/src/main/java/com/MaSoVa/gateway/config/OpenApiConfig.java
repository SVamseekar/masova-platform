package com.MaSoVa.gateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI configuration for API Gateway
 * Provides a unified Swagger UI that aggregates all microservice APIs
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI apiGatewayOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MaSoVa API Gateway")
                        .description("Unified API Gateway for MaSoVa Restaurant Management System. " +
                                "Select a service from the dropdown in the top-right corner to view its API documentation.")
                        .version("2.1.0")
                        .contact(new Contact()
                                .name("MaSoVa Development Team")
                                .email("dev@masova.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("API Gateway - Unified Access Point")
                ));
    }
}
