package com.MaSoVa.shared.test;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;

/**
 * Base class for integration tests that require a real MongoDB instance.
 *
 * Uses Testcontainers to spin up a MongoDB container for the test lifecycle.
 * Subclasses get automatic access to MockMvc and ObjectMapper.
 *
 * @example
 * <pre>
 * {@code
 * class OrderControllerIntegrationTest extends BaseIntegrationTest {
 *
 *     @Test
 *     void shouldCreateOrder() throws Exception {
 *         Map<String, Object> order = OrderTestDataBuilder.anOrder().build();
 *
 *         mockMvc.perform(post("/api/orders")
 *                 .contentType(MediaType.APPLICATION_JSON)
 *                 .content(toJson(order)))
 *                 .andExpect(status().isCreated());
 *     }
 * }
 * }
 * </pre>
 *
 * <p><b>Container lifecycle:</b> {@code mongoDBContainer} is a JVM-static singleton, started
 * once and shared across every IT class in the module (a per-class {@code @Container} gets
 * stopped after each class while Spring's cached context still points at it, breaking the next
 * class with "Connection refused" - see git history for the incident this avoided). This means
 * data one IT class writes is visible to every other IT class that runs afterward in the same
 * module. Each subclass is responsible for cleaning up any collection it writes to, typically
 * with a {@code @BeforeEach} that calls {@code someRepository.deleteAll()} - do not assume a
 * collection starts empty just because this class doesn't write to it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @SuppressWarnings("resource")
    protected static final MongoDBContainer mongoDBContainer =
            new MongoDBContainer("mongo:7.0").withExposedPorts(27017).withReuse(true);

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    // Singleton container: started once per JVM and stopped by Ryuk at exit.
    // A per-class @Container is stopped after each test class while Spring's cached
    // context still points at it, which breaks the next class with "Connection refused".
    static {
        mongoDBContainer.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
        // commerce keeps orders in a second Mongo client; without this it falls back to localhost:27017.
        registry.add("orders.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    /**
     * Serialize an object to its JSON string representation.
     */
    protected String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }
}
