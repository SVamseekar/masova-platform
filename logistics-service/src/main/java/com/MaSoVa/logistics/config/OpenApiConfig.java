package com.MaSoVa.logistics.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8095}")
    private String serverPort;

    @Bean
    public OpenAPI logisticsServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Logistics Service API")
                        .description("Unified delivery and inventory management service")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local")
                ));
    }
}
