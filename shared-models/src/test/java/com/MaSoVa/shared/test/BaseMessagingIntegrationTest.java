package com.MaSoVa.shared.test;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;

public abstract class BaseMessagingIntegrationTest extends BaseFullIntegrationTest {

    // Use env-var credentials (no rabbitmqadmin needed — works on alpine and management images alike)
    @Container
    @SuppressWarnings("resource")
    protected static final RabbitMQContainer rabbitContainer =
            new RabbitMQContainer("rabbitmq:3.12-alpine")
                    .withEnv("RABBITMQ_DEFAULT_USER", "masova")
                    .withEnv("RABBITMQ_DEFAULT_PASS", "masova_secret")
                    .withReuse(true);

    @DynamicPropertySource
    static void configureRabbitProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", rabbitContainer::getHost);
        registry.add("spring.rabbitmq.port", rabbitContainer::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "masova");
        registry.add("spring.rabbitmq.password", () -> "masova_secret");
    }
}
