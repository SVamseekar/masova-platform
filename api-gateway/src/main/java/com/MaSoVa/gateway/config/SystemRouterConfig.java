package com.MaSoVa.gateway.config;

import com.MaSoVa.gateway.handler.SystemInfoHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;

/**
 * Router configuration for system endpoints
 */
@Configuration
public class SystemRouterConfig {

    @Bean
    public RouterFunction<ServerResponse> systemRoutes(SystemInfoHandler handler) {
        return RouterFunctions
            .route(GET("/api/system/version"), handler::getVersion)
            .andRoute(GET("/api/system/health"), handler::getHealth)
            .andRoute(GET("/api/system/info"), handler::getInfo);
    }
}
