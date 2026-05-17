package com.MaSoVa.shared.test;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;

public abstract class BaseMessagingIntegrationTest extends BaseFullIntegrationTest {

    // Credentials via env vars (no rabbitmqadmin / management plugin needed).
    // Wait for the "Server startup complete" log line so the Mnesia DB and default
    // user are fully initialised before the first AMQP connection is attempted.
    @Container
    @SuppressWarnings("resource")
    protected static final RabbitMQContainer rabbitContainer =
            new RabbitMQContainer("rabbitmq:3.12-alpine")
                    .withEnv("RABBITMQ_DEFAULT_USER", "masova")
                    .withEnv("RABBITMQ_DEFAULT_PASS", "masova_secret")
                    .waitingFor(Wait.forLogMessage(".*Server startup complete.*", 1))
                    .withReuse(true);

    @DynamicPropertySource
    static void configureRabbitProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", rabbitContainer::getHost);
        registry.add("spring.rabbitmq.port", rabbitContainer::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "masova");
        registry.add("spring.rabbitmq.password", () -> "masova_secret");
    }
}
