package com.MaSoVa.shared.test;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.containers.wait.strategy.Wait;

public abstract class BaseMessagingIntegrationTest extends BaseFullIntegrationTest {

    // withAdminUser/withAdminPassword set RABBITMQ_DEFAULT_USER/PASS in configure();
    // a plain withEnv for the user is overwritten there and login fails.
    // No rabbitmqadmin / management plugin needed — works on plain alpine image.
    // waitingFor ensures the Mnesia DB and default user are ready before the first AMQP connection.
    @SuppressWarnings("resource")
    protected static final RabbitMQContainer rabbitContainer =
            new RabbitMQContainer("rabbitmq:3.12-alpine")
                    .withAdminUser("masova")
                    .withAdminPassword("masova_secret")
                    .waitingFor(Wait.forLogMessage(".*Server startup complete.*", 1))
                    .withReuse(true);

    // Singleton container: started once per JVM and stopped by Ryuk at exit.
    // A per-class @Container is stopped after each test class while Spring's cached
    // context still points at it, which breaks the next class with "Connection refused".
    static {
        rabbitContainer.start();
    }

    @DynamicPropertySource
    static void configureRabbitProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", rabbitContainer::getHost);
        registry.add("spring.rabbitmq.port", rabbitContainer::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "masova");
        registry.add("spring.rabbitmq.password", () -> "masova_secret");
    }
}
