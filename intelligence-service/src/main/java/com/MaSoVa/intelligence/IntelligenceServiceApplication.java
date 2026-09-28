package com.MaSoVa.intelligence;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = {"com.MaSoVa.intelligence", "com.MaSoVa.shared"})
@EnableCaching
@EnableAsync
public class IntelligenceServiceApplication {

    @SuppressWarnings("resource") // ApplicationContext lives for the JVM's lifetime; Spring Boot registers its own shutdown hook
    public static void main(String[] args) {
        SpringApplication.run(IntelligenceServiceApplication.class, args);
    }
}
