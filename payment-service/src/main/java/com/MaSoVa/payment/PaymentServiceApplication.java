package com.MaSoVa.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication(scanBasePackages = {"com.MaSoVa.payment", "com.MaSoVa.shared.security", "com.MaSoVa.shared.messaging"})
@EnableMongoAuditing
public class PaymentServiceApplication {

    @SuppressWarnings("resource") // ApplicationContext lives for the JVM's lifetime; Spring Boot registers its own shutdown hook
    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
    }
}
