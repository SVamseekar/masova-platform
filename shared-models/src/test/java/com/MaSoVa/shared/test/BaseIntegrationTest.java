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
