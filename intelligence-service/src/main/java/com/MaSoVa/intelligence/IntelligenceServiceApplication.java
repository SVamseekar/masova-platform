package com.MaSoVa.intelligence;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
@ComponentScan(basePackages = {"com.MaSoVa.intelligence", "com.MaSoVa.shared"})
public class IntelligenceServiceApplication {

    @SuppressWarnings("resource") // ApplicationContext lives for the JVM's lifetime; Spring Boot registers its own shutdown hook
    public static void main(String[] args) {
        SpringApplication.run(IntelligenceServiceApplication.class, args);
    }
}
