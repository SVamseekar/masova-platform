package com.MaSoVa.commerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
@ComponentScan(basePackages = {"com.MaSoVa.commerce", "com.MaSoVa.shared"})
public class CommerceServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CommerceServiceApplication.class, args);
    }
}
