package com.MaSoVa.shared.test;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;

public abstract class BaseMessagingIntegrationTest extends BaseFullIntegrationTest {

    // withAdminPassword sets RABBITMQ_DEFAULT_PASS via configure(); withEnv sets the username.
    // No rabbitmqadmin / management plugin needed — works on plain alpine image.
    // waitingFor ensures the Mnesia DB and default user are ready before the first AMQP connection.
    @Container
    @SuppressWarnings("resource")
    protected static final RabbitMQContainer rabbitContainer =
            new RabbitMQContainer("rabbitmq:3.12-alpine")
                    .withAdminPassword("masova_secret")
                    .withEnv("RABBITMQ_DEFAULT_USER", "masova")
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
