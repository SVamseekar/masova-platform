package com.MaSoVa.core.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8096}")
    private String serverPort;

    @Bean
    public OpenAPI coreServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Core Service API")
                        .description("Unified user, customer, notification and review management")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local")
                ));
    }
}
