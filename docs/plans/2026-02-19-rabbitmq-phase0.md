# RabbitMQ Phase 0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add async event messaging via RabbitMQ so order placement no longer blocks on notification and customer-service HTTP calls — starting with the single highest-value replacement: order-service → notification-service.

**Architecture:** Additive only — existing REST endpoints stay untouched. We add RabbitMQ alongside them, publish an `OrderStatusChangedEvent` from order-service, and have notification-service consume it. No REST calls are removed yet; they run in parallel during this phase to validate the async path before cutting over.

**Tech Stack:** Spring AMQP (`spring-boot-starter-amqp`), RabbitMQ 3.12-management (Docker), Jackson JSON message converter, JUnit 5 + Mockito for unit tests, Testcontainers RabbitMQ for integration tests.

---

## Context You Need

**Project root:** `/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/`

**Existing services involved:**
- `order-service` (port 8083) — publishes events
- `notification-service` (port 8092) — consumes events
- `shared-models` — where shared event classes live

**Key existing file to understand:**
- `order-service/src/main/java/com/MaSoVa/order/service/CustomerNotificationService.java` — this is the synchronous REST caller we are replacing. Do NOT delete it yet. We'll call `rabbitTemplate.convertAndSend()` alongside the existing call, then remove the REST call in a later task once we confirm the async path works.

**Maven:** Java 21, Spring Boot 3.2.0. Root pom.xml manages all versions. Child poms inherit from root. `shared-models` already has Lombok, Jackson, and test dependencies. `notification-service` and `order-service` already have `spring-boot-starter-test` and Testcontainers for MongoDB.

**No Lombok getters/setters** needed in event classes — use Java records (Java 21 feature, already configured in compiler).

---

## Task 1: Enable RabbitMQ in docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Uncomment the RabbitMQ block**

Open `docker-compose.yml`. Find the commented-out `rabbitmq:` section (lines ~23–37). Uncomment it and update to version 3.12:

```yaml
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: masova-rabbitmq
    restart: unless-stopped
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: masova
      RABBITMQ_DEFAULT_PASS: masova_secret
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - masova-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 15s
      timeout: 5s
      retries: 5
```

Also add `rabbitmq_data:` to the `volumes:` section at the bottom:
```yaml
volumes:
  mongodb_data:
  redis_data:
  rabbitmq_data:
```

**Step 2: Start RabbitMQ and verify**

```bash
docker-compose up -d rabbitmq
```

Expected: container starts, then open `http://localhost:15672` in browser.
Login with `masova` / `masova_secret`. You should see the RabbitMQ Management UI with an empty overview.

**Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "infra: enable RabbitMQ 3.12 in docker-compose"
```

---

## Task 2: Add AMQP dependency to shared-models

**Files:**
- Modify: `shared-models/pom.xml`

**Step 1: Add the Spring AMQP starter**

Open `shared-models/pom.xml`. In the `<dependencies>` section, add after the existing Redis dependency:

```xml
<!-- RabbitMQ / Spring AMQP for async event messaging -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

**Step 2: Verify it compiles**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl shared-models -q
```

Expected: `BUILD SUCCESS` with no output (quiet mode).

**Step 3: Commit**

```bash
git add shared-models/pom.xml
git commit -m "deps: add spring-boot-starter-amqp to shared-models"
```

---

## Task 3: Create event classes in shared-models

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/DomainEvent.java`
- Create: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java`
- Create: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderCreatedEvent.java`

**Step 1: Write the base event class**

Create `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/DomainEvent.java`:

```java
package com.MaSoVa.shared.messaging.events;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Base class for all domain events published to RabbitMQ.
 * All fields serialise to JSON via Jackson.
 */
public abstract class DomainEvent implements Serializable {

    private final String eventId = UUID.randomUUID().toString();
    private final LocalDateTime occurredAt = LocalDateTime.now();
    private final String eventType;

    protected DomainEvent(String eventType) {
        this.eventType = eventType;
    }

    public String getEventId()      { return eventId; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public String getEventType()    { return eventType; }
}
```

**Step 2: Write OrderStatusChangedEvent**

Create `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java`:

```java
package com.MaSoVa.shared.messaging.events;

import java.math.BigDecimal;

/**
 * Published by order-service whenever an order's status changes.
 * Consumed by notification-service to send customer emails/SMS.
 *
 * Routing key: order.status.{newStatus}  (e.g. order.status.DISPATCHED)
 */
public class OrderStatusChangedEvent extends DomainEvent {

    private String orderId;
    private String orderNumber;   // e.g. "ORD2619400471" — for display
    private String customerId;
    private String customerEmail;
    private String customerName;
    private String previousStatus;
    private String newStatus;
    private String storeId;

    /** Required by Jackson deserialisation. */
    public OrderStatusChangedEvent() {
        super("ORDER_STATUS_CHANGED");
    }

    public OrderStatusChangedEvent(
            String orderId,
            String orderNumber,
            String customerId,
            String customerEmail,
            String customerName,
            String previousStatus,
            String newStatus,
            String storeId
    ) {
        super("ORDER_STATUS_CHANGED");
        this.orderId       = orderId;
        this.orderNumber   = orderNumber;
        this.customerId    = customerId;
        this.customerEmail = customerEmail;
        this.customerName  = customerName;
        this.previousStatus = previousStatus;
        this.newStatus     = newStatus;
        this.storeId       = storeId;
    }

    // Getters (no setters — use constructor)
    public String getOrderId()        { return orderId; }
    public String getOrderNumber()    { return orderNumber; }
    public String getCustomerId()     { return customerId; }
    public String getCustomerEmail()  { return customerEmail; }
    public String getCustomerName()   { return customerName; }
    public String getPreviousStatus() { return previousStatus; }
    public String getNewStatus()      { return newStatus; }
    public String getStoreId()        { return storeId; }

    // Setters needed by Jackson for deserialisation
    public void setOrderId(String v)        { this.orderId = v; }
    public void setOrderNumber(String v)    { this.orderNumber = v; }
    public void setCustomerId(String v)     { this.customerId = v; }
    public void setCustomerEmail(String v)  { this.customerEmail = v; }
    public void setCustomerName(String v)   { this.customerName = v; }
    public void setPreviousStatus(String v) { this.previousStatus = v; }
    public void setNewStatus(String v)      { this.newStatus = v; }
    public void setStoreId(String v)        { this.storeId = v; }
}
```

**Step 3: Write OrderCreatedEvent**

Create `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderCreatedEvent.java`:

```java
package com.MaSoVa.shared.messaging.events;

import java.math.BigDecimal;

/**
 * Published by order-service when a new order is placed.
 * Consumed by notification-service (confirmation email) and
 * customer-service (update order stats).
 *
 * Routing key: order.created
 */
public class OrderCreatedEvent extends DomainEvent {

    private String orderId;
    private String orderNumber;
    private String customerId;
    private String customerEmail;
    private String customerName;
    private String storeId;
    private BigDecimal total;
    private String orderType;   // DELIVERY | PICKUP | DINE_IN

    public OrderCreatedEvent() {
        super("ORDER_CREATED");
    }

    public OrderCreatedEvent(
            String orderId,
            String orderNumber,
            String customerId,
            String customerEmail,
            String customerName,
            String storeId,
            BigDecimal total,
            String orderType
    ) {
        super("ORDER_CREATED");
        this.orderId       = orderId;
        this.orderNumber   = orderNumber;
        this.customerId    = customerId;
        this.customerEmail = customerEmail;
        this.customerName  = customerName;
        this.storeId       = storeId;
        this.total         = total;
        this.orderType     = orderType;
    }

    public String getOrderId()       { return orderId; }
    public String getOrderNumber()   { return orderNumber; }
    public String getCustomerId()    { return customerId; }
    public String getCustomerEmail() { return customerEmail; }
    public String getCustomerName()  { return customerName; }
    public String getStoreId()       { return storeId; }
    public BigDecimal getTotal()     { return total; }
    public String getOrderType()     { return orderType; }

    public void setOrderId(String v)       { this.orderId = v; }
    public void setOrderNumber(String v)   { this.orderNumber = v; }
    public void setCustomerId(String v)    { this.customerId = v; }
    public void setCustomerEmail(String v) { this.customerEmail = v; }
    public void setCustomerName(String v)  { this.customerName = v; }
    public void setStoreId(String v)       { this.storeId = v; }
    public void setTotal(BigDecimal v)     { this.total = v; }
    public void setOrderType(String v)     { this.orderType = v; }
}
```

**Step 4: Verify compile**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl shared-models -q
```

Expected: `BUILD SUCCESS`.

**Step 5: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/
git commit -m "feat(shared-models): add DomainEvent base + OrderCreatedEvent + OrderStatusChangedEvent"
```

---

## Task 4: Create RabbitMQ topology config in shared-models

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java`

**Step 1: Write the config class**

This declares all exchanges, queues, and bindings as Spring beans. Any service that includes `shared-models` can `@Import` this config.

Create `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java`:

```java
package com.MaSoVa.shared.messaging.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares all MaSoVa RabbitMQ exchanges, queues, and bindings.
 *
 * Import this in any service that needs RabbitMQ:
 *   @Import(MaSoVaRabbitMQConfig.class)
 *
 * Exchange naming: masova.{domain}.events  (topic, durable)
 * Queue naming:    masova.{consumer}.{event}.queue  (durable)
 * Routing keys:    {domain}.{event}[.{qualifier}]
 */
@Configuration
public class MaSoVaRabbitMQConfig {

    // ── Exchange names ──────────────────────────────────────────────────────────
    public static final String ORDERS_EXCHANGE   = "masova.orders.events";
    public static final String PAYMENTS_EXCHANGE = "masova.payments.events";
    public static final String DELIVERY_EXCHANGE = "masova.delivery.events";
    public static final String DLX_EXCHANGE      = "masova.dlx";

    // ── Routing keys ────────────────────────────────────────────────────────────
    public static final String RK_ORDER_CREATED         = "order.created";
    public static final String RK_ORDER_STATUS_CHANGED  = "order.status.#";  // wildcard for consumers
    public static final String RK_ORDER_STATUS_PREFIX   = "order.status.";   // prefix for publishers
    public static final String RK_PAYMENT_COMPLETED     = "payment.completed";
    public static final String RK_PAYMENT_FAILED        = "payment.failed";
    public static final String RK_DELIVERY_ASSIGNED     = "delivery.assigned";
    public static final String RK_DELIVERY_COMPLETED    = "delivery.completed";

    // ── Queue names ─────────────────────────────────────────────────────────────
    public static final String Q_NOTIFICATION_ORDER_CREATED  = "masova.notification.order-created.queue";
    public static final String Q_NOTIFICATION_ORDER_STATUS   = "masova.notification.order-status.queue";
    public static final String Q_CUSTOMER_ORDER_CREATED      = "masova.customer.order-created.queue";
    public static final String Q_ANALYTICS_ORDER_EVENTS      = "masova.analytics.order-events.queue";
    public static final String Q_DLX                         = "masova.dlx.queue";

    // ── Exchanges ────────────────────────────────────────────────────────────────

    @Bean
    public TopicExchange ordersExchange() {
        return ExchangeBuilder.topicExchange(ORDERS_EXCHANGE).durable(true).build();
    }

    @Bean
    public TopicExchange paymentsExchange() {
        return ExchangeBuilder.topicExchange(PAYMENTS_EXCHANGE).durable(true).build();
    }

    @Bean
    public TopicExchange deliveryExchange() {
        return ExchangeBuilder.topicExchange(DELIVERY_EXCHANGE).durable(true).build();
    }

    @Bean
    public TopicExchange dlxExchange() {
        return ExchangeBuilder.topicExchange(DLX_EXCHANGE).durable(true).build();
    }

    // ── Queues (durable, with DLX routing) ─────────────────────────────────────

    @Bean
    public Queue notificationOrderCreatedQueue() {
        return QueueBuilder.durable(Q_NOTIFICATION_ORDER_CREATED)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlx.notification.order-created")
                .withArgument("x-message-ttl", 86_400_000)   // 24 hours
                .build();
    }

    @Bean
    public Queue notificationOrderStatusQueue() {
        return QueueBuilder.durable(Q_NOTIFICATION_ORDER_STATUS)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlx.notification.order-status")
                .withArgument("x-message-ttl", 86_400_000)
                .build();
    }

    @Bean
    public Queue customerOrderCreatedQueue() {
        return QueueBuilder.durable(Q_CUSTOMER_ORDER_CREATED)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlx.customer.order-created")
                .withArgument("x-message-ttl", 86_400_000)
                .build();
    }

    @Bean
    public Queue analyticsOrderEventsQueue() {
        return QueueBuilder.durable(Q_ANALYTICS_ORDER_EVENTS)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlx.analytics.order")
                .withArgument("x-message-ttl", 86_400_000)
                .build();
    }

    @Bean
    public Queue dlxQueue() {
        return QueueBuilder.durable(Q_DLX)
                .withArgument("x-message-ttl", 259_200_000)  // 3 days
                .build();
    }

    // ── Bindings ────────────────────────────────────────────────────────────────

    @Bean
    public Binding bindNotificationOrderCreated(TopicExchange ordersExchange) {
        return BindingBuilder.bind(notificationOrderCreatedQueue())
                .to(ordersExchange).with(RK_ORDER_CREATED);
    }

    @Bean
    public Binding bindNotificationOrderStatus(TopicExchange ordersExchange) {
        return BindingBuilder.bind(notificationOrderStatusQueue())
                .to(ordersExchange).with(RK_ORDER_STATUS_CHANGED);
    }

    @Bean
    public Binding bindCustomerOrderCreated(TopicExchange ordersExchange) {
        return BindingBuilder.bind(customerOrderCreatedQueue())
                .to(ordersExchange).with(RK_ORDER_CREATED);
    }

    @Bean
    public Binding bindAnalyticsOrderEvents(TopicExchange ordersExchange) {
        return BindingBuilder.bind(analyticsOrderEventsQueue())
                .to(ordersExchange).with("order.#");
    }

    @Bean
    public Binding bindDlx(TopicExchange dlxExchange) {
        return BindingBuilder.bind(dlxQueue())
                .to(dlxExchange).with("#");
    }

    // ── Jackson JSON converter ──────────────────────────────────────────────────

    @Bean
    public MessageConverter jsonMessageConverter() {
        ObjectMapper mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(mapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
```

**Step 2: Verify compile**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl shared-models -q
```

Expected: `BUILD SUCCESS`.

**Step 3: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/config/
git commit -m "feat(shared-models): add MaSoVaRabbitMQConfig with exchanges, queues, bindings"
```

---

## Task 5: Add AMQP to order-service + create OrderEventPublisher

**Files:**
- Modify: `order-service/pom.xml`
- Modify: `order-service/src/main/resources/application.yml`
- Create: `order-service/src/main/java/com/MaSoVa/order/messaging/OrderEventPublisher.java`
- Modify: `order-service/src/main/java/com/MaSoVa/order/OrderServiceApplication.java` (add @Import)
- Create (test): `order-service/src/test/java/com/MaSoVa/order/messaging/OrderEventPublisherTest.java`

**Step 1: Add spring-boot-starter-amqp to order-service/pom.xml**

In `order-service/pom.xml`, after the WebSocket dependency, add:

```xml
<!-- RabbitMQ for async event publishing -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

**Step 2: Add RabbitMQ connection to order-service application.yml**

Open `order-service/src/main/resources/application.yml`. After the `redis:` block, add:

```yaml
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:masova}
    password: ${RABBITMQ_PASS:masova_secret}
    virtual-host: /
    connection-timeout: 5000
    listener:
      simple:
        acknowledge-mode: auto
        retry:
          enabled: true
          initial-interval: 2000
          max-attempts: 3
          multiplier: 2.0
```

**Step 3: Write the failing test first**

Create `order-service/src/test/java/com/MaSoVa/order/messaging/OrderEventPublisherTest.java`:

```java
package com.MaSoVa.order.messaging;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderEventPublisherTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    private OrderEventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new OrderEventPublisher(rabbitTemplate);
    }

    @Test
    void publishOrderCreated_sendsToCorrectExchangeAndRoutingKey() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-123", "ORD123", "cust-456",
                "customer@example.com", "John Doe",
                "store-1", new BigDecimal("450.00"), "DELIVERY"
        );

        publisher.publishOrderCreated(event);

        verify(rabbitTemplate).convertAndSend(
                eq(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE),
                eq(MaSoVaRabbitMQConfig.RK_ORDER_CREATED),
                eq(event)
        );
    }

    @Test
    void publishOrderStatusChanged_sendsRoutingKeyWithStatus() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                "order-123", "ORD123", "cust-456",
                "customer@example.com", "John Doe",
                "PREPARING", "READY", "store-1"
        );

        publisher.publishOrderStatusChanged(event);

        verify(rabbitTemplate).convertAndSend(
                eq(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE),
                eq(MaSoVaRabbitMQConfig.RK_ORDER_STATUS_PREFIX + "READY"),
                eq(event)
        );
    }

    @Test
    void publishOrderCreated_doesNotThrowWhenRabbitTemplateThrows() {
        doThrow(new RuntimeException("Connection refused"))
                .when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-123", "ORD123", "cust-456",
                "customer@example.com", "John Doe",
                "store-1", new BigDecimal("450.00"), "DELIVERY"
        );

        // Must NOT throw — publishing failure should be logged, not propagate
        publisher.publishOrderCreated(event);
    }
}
```

**Step 4: Run the test to confirm it fails**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn test -pl order-service -Dtest=OrderEventPublisherTest -q 2>&1 | tail -5
```

Expected: `COMPILATION ERROR` — `OrderEventPublisher` does not exist yet.

**Step 5: Create OrderEventPublisher**

Create `order-service/src/main/java/com/MaSoVa/order/messaging/OrderEventPublisher.java`:

```java
package com.MaSoVa.order.messaging;

import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes order domain events to RabbitMQ.
 *
 * Publishing failures are caught and logged — they must never
 * cause the original business operation to fail.
 */
@Component
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public OrderEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publish an OrderCreatedEvent.
     * Routing key: order.created
     */
    public void publishOrderCreated(OrderCreatedEvent event) {
        publish(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE, MaSoVaRabbitMQConfig.RK_ORDER_CREATED, event);
    }

    /**
     * Publish an OrderStatusChangedEvent.
     * Routing key: order.status.{newStatus}  e.g. order.status.DISPATCHED
     */
    public void publishOrderStatusChanged(OrderStatusChangedEvent event) {
        String routingKey = MaSoVaRabbitMQConfig.RK_ORDER_STATUS_PREFIX + event.getNewStatus();
        publish(MaSoVaRabbitMQConfig.ORDERS_EXCHANGE, routingKey, event);
    }

    private void publish(String exchange, String routingKey, Object event) {
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, event);
            log.debug("[RabbitMQ] Published {} to {}/{}", event.getClass().getSimpleName(), exchange, routingKey);
        } catch (Exception ex) {
            // Log but do NOT re-throw — a RabbitMQ failure must never roll back a business transaction
            log.error("[RabbitMQ] Failed to publish {} to {}/{}: {}",
                    event.getClass().getSimpleName(), exchange, routingKey, ex.getMessage(), ex);
        }
    }
}
```

**Step 6: Add @Import to OrderServiceApplication**

Open `order-service/src/main/java/com/MaSoVa/order/OrderServiceApplication.java`. Add the import annotation:

```java
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(MaSoVaRabbitMQConfig.class)
public class OrderServiceApplication { ... }
```

**Step 7: Run tests — expect PASS**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn test -pl order-service -Dtest=OrderEventPublisherTest -q
```

Expected: `Tests run: 3, Failures: 0, Errors: 0`

**Step 8: Commit**

```bash
git add order-service/pom.xml \
        order-service/src/main/resources/application.yml \
        order-service/src/main/java/com/MaSoVa/order/messaging/ \
        order-service/src/main/java/com/MaSoVa/order/OrderServiceApplication.java \
        order-service/src/test/java/com/MaSoVa/order/messaging/
git commit -m "feat(order-service): add OrderEventPublisher for async RabbitMQ events"
```

---

## Task 6: Wire publisher into CustomerNotificationService (dual-publish)

**Files:**
- Modify: `order-service/src/main/java/com/MaSoVa/order/service/CustomerNotificationService.java`

**Strategy:** We inject `OrderEventPublisher` and call it alongside the existing REST call. The REST call stays for now — we observe that both paths work, then remove the REST call in Task 8 after confirming the notification-service consumer works end-to-end.

**Step 1: Find the order status notification method**

Open `CustomerNotificationService.java` and find the method that sends status-change notifications to the notification-service (it calls `POST /api/notifications/send`). Look for something like `sendOrderStatusNotification(Order order)`.

**Step 2: Inject OrderEventPublisher**

Add to the constructor parameters:

```java
private final OrderEventPublisher orderEventPublisher;

public CustomerNotificationService(
        OrderWebSocketController webSocketController,
        RestTemplate restTemplate,
        OrderEventPublisher orderEventPublisher,          // ADD THIS
        @Value("${services.notification.url}") String notificationServiceUrl,
        @Value("${services.customer-service.url}") String customerServiceUrl,
        @Value("${services.user.url}") String userServiceUrl,
        @Value("${app.frontend.url}") String frontendUrl
) {
    this.webSocketController = webSocketController;
    this.restTemplate = restTemplate;
    this.orderEventPublisher = orderEventPublisher;       // ADD THIS
    this.notificationServiceUrl = notificationServiceUrl;
    this.customerServiceUrl = customerServiceUrl;
    this.userServiceUrl = userServiceUrl;
    this.frontendUrl = frontendUrl;
}
```

**Step 3: Publish event at the end of the status-change method**

In the method that handles order status changes, add at the end (after the existing REST call, not replacing it):

```java
// Async event — notification-service will also pick this up via RabbitMQ
// (REST call above stays active during Phase 0 validation period)
OrderStatusChangedEvent event = new OrderStatusChangedEvent(
        order.getId(),
        order.getOrderNumber(),
        order.getCustomerId(),
        order.getCustomerEmail(),
        order.getCustomerName(),
        previousStatus,          // capture before you update, or read from order if already stored
        order.getStatus().name(),
        order.getStoreId()
);
orderEventPublisher.publishOrderStatusChanged(event);
```

> Note: `previousStatus` — look at how the method is called. If `CustomerNotificationService.sendOrderStatusUpdate(Order order, String previousStatus)` already receives it, use it. If not, you may need to add it as a parameter or read from the order's history. Adapt to what exists.

**Step 4: Compile to check for errors**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl order-service -q
```

Expected: `BUILD SUCCESS`.

**Step 5: Commit**

```bash
git add order-service/src/main/java/com/MaSoVa/order/service/CustomerNotificationService.java
git commit -m "feat(order-service): dual-publish order status events to RabbitMQ alongside REST"
```

---

## Task 7: Add AMQP to notification-service + create event consumer

**Files:**
- Modify: `notification-service/pom.xml`
- Modify: `notification-service/src/main/resources/application.yml`
- Modify: `notification-service/src/main/java/com/MaSoVa/notification/NotificationServiceApplication.java`
- Create: `notification-service/src/main/java/com/MaSoVa/notification/messaging/OrderEventListener.java`
- Create (test): `notification-service/src/test/java/com/MaSoVa/notification/messaging/OrderEventListenerTest.java`

**Step 1: Add dependency to notification-service/pom.xml**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

**Step 2: Add RabbitMQ connection to notification-service/application.yml**

After the `redis:` block:

```yaml
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:masova}
    password: ${RABBITMQ_PASS:masova_secret}
    virtual-host: /
    listener:
      simple:
        acknowledge-mode: auto
        retry:
          enabled: true
          initial-interval: 2000
          max-attempts: 3
          multiplier: 2.0
```

**Step 3: Write the failing test first**

Create `notification-service/src/test/java/com/MaSoVa/notification/messaging/OrderEventListenerTest.java`:

```java
package com.MaSoVa.notification.messaging;

import com.MaSoVa.notification.service.NotificationService;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderEventListenerTest {

    @Mock
    private NotificationService notificationService;

    private OrderEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new OrderEventListener(notificationService);
    }

    @Test
    void onOrderCreated_callsNotificationService() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-123", "ORD123", "cust-456",
                "customer@example.com", "John Doe",
                "store-1", new BigDecimal("450.00"), "DELIVERY"
        );

        listener.onOrderCreated(event);

        // Verify notification-service was called with the event data
        verify(notificationService).sendOrderCreatedNotification(
                eq("customer@example.com"),
                eq("John Doe"),
                eq("ORD123"),
                eq(new BigDecimal("450.00"))
        );
    }

    @Test
    void onOrderStatusChanged_callsNotificationService() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                "order-123", "ORD123", "cust-456",
                "customer@example.com", "John Doe",
                "PREPARING", "DISPATCHED", "store-1"
        );

        listener.onOrderStatusChanged(event);

        verify(notificationService).sendOrderStatusNotification(
                eq("customer@example.com"),
                eq("John Doe"),
                eq("ORD123"),
                eq("DISPATCHED")
        );
    }

    @Test
    void onOrderCreated_doesNotThrowWhenNotificationServiceThrows() {
        doThrow(new RuntimeException("Brevo API down"))
                .when(notificationService).sendOrderCreatedNotification(any(), any(), any(), any());

        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-123", "ORD123", "cust-456",
                "bad@example.com", "John",
                "store-1", new BigDecimal("100.00"), "PICKUP"
        );

        // Must NOT throw — listener must ack the message even on notification failure
        // (the message goes to DLX for retry, not re-queued forever)
        listener.onOrderCreated(event);
    }
}
```

**Step 4: Run test to confirm it fails**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn test -pl notification-service -Dtest=OrderEventListenerTest -q 2>&1 | tail -5
```

Expected: `COMPILATION ERROR` — `OrderEventListener` does not exist yet.

**Step 5: Check what methods NotificationService already has**

Before writing the listener, check what the existing `NotificationService` exposes. Run:

```bash
grep -n "public.*void\|public.*send\|public.*notify" \
  notification-service/src/main/java/com/MaSoVa/notification/service/NotificationService.java | head -20
```

If `sendOrderCreatedNotification(email, name, orderNumber, total)` and `sendOrderStatusNotification(email, name, orderNumber, status)` do not exist, you'll need to either:
- Use whatever existing method signature matches, adjusting the test
- Add thin wrapper methods to `NotificationService` (preferred — keeps listener clean)

**Step 6: Create OrderEventListener**

Create `notification-service/src/main/java/com/MaSoVa/notification/messaging/OrderEventListener.java`:

```java
package com.MaSoVa.notification.messaging;

import com.MaSoVa.notification.service.NotificationService;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumes order domain events from RabbitMQ and triggers notifications.
 *
 * IMPORTANT: Listener methods must catch all exceptions internally.
 * If they throw, Spring AMQP will NACK and retry (up to 3 times per config),
 * then route to DLX. This is the desired behavior for transient failures.
 * For permanent failures (e.g. invalid data), catch and log — do not re-throw.
 */
@Component
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);

    private final NotificationService notificationService;

    public OrderEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.Q_NOTIFICATION_ORDER_CREATED)
    public void onOrderCreated(OrderCreatedEvent event) {
        log.info("[RabbitMQ] Received OrderCreatedEvent for order: {}", event.getOrderNumber());
        try {
            notificationService.sendOrderCreatedNotification(
                    event.getCustomerEmail(),
                    event.getCustomerName(),
                    event.getOrderNumber(),
                    event.getTotal()
            );
            log.info("[RabbitMQ] Order created notification sent for: {}", event.getOrderNumber());
        } catch (Exception ex) {
            log.error("[RabbitMQ] Failed to send order-created notification for {}: {}",
                    event.getOrderNumber(), ex.getMessage(), ex);
            // Swallow — message is already consumed, notification failure should not re-queue
            // In production: save to failed_notifications collection for retry UI
        }
    }

    @RabbitListener(queues = MaSoVaRabbitMQConfig.Q_NOTIFICATION_ORDER_STATUS)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        log.info("[RabbitMQ] Received OrderStatusChangedEvent: {} → {} for order: {}",
                event.getPreviousStatus(), event.getNewStatus(), event.getOrderNumber());
        try {
            notificationService.sendOrderStatusNotification(
                    event.getCustomerEmail(),
                    event.getCustomerName(),
                    event.getOrderNumber(),
                    event.getNewStatus()
            );
        } catch (Exception ex) {
            log.error("[RabbitMQ] Failed to send order-status notification for {}: {}",
                    event.getOrderNumber(), ex.getMessage(), ex);
        }
    }
}
```

**Step 7: Add @Import to NotificationServiceApplication**

Open `notification-service/src/main/java/com/MaSoVa/notification/NotificationServiceApplication.java` and add:

```java
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(MaSoVaRabbitMQConfig.class)
public class NotificationServiceApplication { ... }
```

**Step 8: Add missing methods to NotificationService (if needed)**

If the existing `NotificationService` does not have `sendOrderCreatedNotification(String email, String name, String orderNumber, BigDecimal total)` and `sendOrderStatusNotification(String email, String name, String orderNumber, String status)`, add thin wrapper methods that delegate to the existing email logic. Adapt the method signatures in the test if you use a different existing API.

**Step 9: Run tests**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn test -pl notification-service -Dtest=OrderEventListenerTest -q
```

Expected: `Tests run: 3, Failures: 0, Errors: 0`

**Step 10: Compile all services**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl shared-models,order-service,notification-service -q
```

Expected: `BUILD SUCCESS` for all three.

**Step 11: Commit**

```bash
git add notification-service/pom.xml \
        notification-service/src/main/resources/application.yml \
        notification-service/src/main/java/com/MaSoVa/notification/ \
        notification-service/src/test/java/com/MaSoVa/notification/messaging/
git commit -m "feat(notification-service): consume OrderCreated + OrderStatusChanged events from RabbitMQ"
```

---

## Task 8: End-to-end smoke test

**Goal:** Confirm events flow from order-service → RabbitMQ → notification-service with both services running.

**Step 1: Start infrastructure**

```bash
docker-compose up -d mongodb redis rabbitmq
```

Wait ~10 seconds for RabbitMQ to finish starting. Confirm at `http://localhost:15672` — you should see the exchanges (`masova.orders.events`) and queues (`masova.notification.order-created.queue`) in the UI.

**Step 2: Start order-service and notification-service**

In two terminal tabs:

```bash
# Tab 1 — order-service
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn spring-boot:run -pl order-service
```

```bash
# Tab 2 — notification-service
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn spring-boot:run -pl notification-service
```

**Step 3: Trigger an order status change**

You can do this via the web frontend (place an order, then change its status in the manager dashboard), or directly via curl:

```bash
# Adjust the order ID and token to a real order in your local DB
curl -X POST http://localhost:8080/api/orders/{orderId}/status \
  -H "Authorization: Bearer {your-jwt}" \
  -H "Content-Type: application/json" \
  -d '{"status": "DISPATCHED"}'
```

**Step 4: Verify in RabbitMQ UI**

In the Management UI at `http://localhost:15672`:
- Go to **Queues** tab
- Look at `masova.notification.order-status.queue`
- Click the queue → **Get Messages** → you should see the JSON event (or it may already be consumed by notification-service)
- Check the **Message rates** chart — a spike confirms a message was published and consumed

**Step 5: Verify in notification-service logs**

In Tab 2, look for:
```
[RabbitMQ] Received OrderStatusChangedEvent: PREPARING → DISPATCHED for order: ORDXXXXXXX
[RabbitMQ] Order status notification sent for: ORDXXXXXXX
```

**Step 6: Confirm email was sent**

Check your Brevo dashboard or the email inbox for `vamseesoura56@gmail.com` (the from-email). If the customer email in the order is a real address, the email should arrive within ~30 seconds.

---

## Task 9: Final commit and summary

**Step 1: Run all tests across the three changed modules**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn test -pl shared-models,order-service,notification-service -q
```

Expected: All tests pass, no failures.

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: Phase 0 RabbitMQ complete — async order events via masova.orders.events exchange

- shared-models: DomainEvent, OrderCreatedEvent, OrderStatusChangedEvent,
  MaSoVaRabbitMQConfig (exchanges + queues + bindings + Jackson converter)
- order-service: OrderEventPublisher, dual-publish in CustomerNotificationService
- notification-service: OrderEventListener consuming 2 queues
- docker-compose: RabbitMQ 3.12-management-alpine enabled
- Verified: events flow end-to-end, email sent via Brevo

Next: Phase 0 Step 2 — replace payment-service→notification-service REST call with event"
```

---

## What's NOT Done Yet (Phase 0 Step 2, separate plan)

- Replace `payment-service → notification-service` REST call with `PaymentCompletedEvent`
- Replace `delivery-service → order-service` 6 REST calls with `DeliveryAssignedEvent` + `DeliveryCompletedEvent`
- Remove the legacy REST call from `CustomerNotificationService` (after validating async path)
- DLQ handler + `dead_letters` MongoDB collection for failed messages
- Add `customer-service` consumer for `order.created` (update stats async)
