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
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

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
@Testcontainers
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Container
    protected static final MongoDBContainer mongoDBContainer =
            new MongoDBContainer("mongo:7.0").withExposedPorts(27017);

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    /**
     * Serialize an object to its JSON string representation.
     */
    protected String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }
}
