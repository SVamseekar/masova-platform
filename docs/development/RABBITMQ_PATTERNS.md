# RabbitMQ Patterns — Learnings & MaSoVa Application

## Interview Assignment Summary

The Origin Capital assignment (in `docker/`) demonstrates:

- **Topic exchange** routing: `chat.user.*` → Cleverbot consumer → reply on `chat.bot.reply`
- **Docker Compose** with fixed IP network (10.100.0.0/24) — ensures stable inter-container addressing
- **Pika client** (Python): blocking connection, exclusive queue bind, `basic_consume` loop
- **Health-check-based dependency** — `depends_on: condition: service_healthy` prevents the bot starting before RabbitMQ accepts connections
- **Retry-on-startup** — `restart: on-failure` + exponential back-off in Python for resilience

To run:
```bash
docker-compose -f docker/docker-compose.yml up --build
# Management UI: http://localhost:15672 (admin / admin)
# Publish a test message: exchange=chat_exchange, routing_key=chat.user.test, body="Hello"
# Check cleverbot container logs: [Bot] You said: Hello
```

---

## How This Maps to MaSoVa

### Current Architecture (synchronous)
```
OrderService.save()
  └── synchronous NotificationService.sendEmail() → Brevo API (blocking)
```

### Proposed Async Pattern (when RabbitMQ is enabled)
```
OrderService.save()
  └── rabbitTemplate.convertAndSend("order.events", "order.status.changed", event)
        ├── notification.email queue   → EmailConsumer   → Brevo (async)
        ├── notification.push queue    → PushConsumer    → Firebase FCM (async)
        └── notification.inapp queue   → InAppConsumer   → WebSocket broadcast
```

**Benefits:**
- Order save is not blocked by email/push latency (~200–500ms saved per order)
- Each channel is independently scalable and retryable
- Failed emails retry without affecting the order flow
- AI support agent (Point 13) can subscribe to `order.status.changed` for proactive customer updates

---

## Implementation Path (when ready to enable)

### Backend (Spring Boot)
1. Add to `notification-service/pom.xml`:
   ```xml
   <dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-amqp</artifactId>
   </dependency>
   ```

2. Create `notification-service/src/main/java/.../config/RabbitMQConfig.java`:
   ```java
   @Configuration
   public class RabbitMQConfig {
     public static final String EXCHANGE = "order.events";
     public static final String EMAIL_QUEUE = "notification.email";
     public static final String PUSH_QUEUE = "notification.push";

     @Bean TopicExchange orderExchange() { return new TopicExchange(EXCHANGE, true, false); }
     @Bean Queue emailQueue() { return new Queue(EMAIL_QUEUE, true); }
     @Bean Binding emailBinding(Queue emailQueue, TopicExchange exchange) {
       return BindingBuilder.bind(emailQueue).to(exchange).with("order.status.*");
     }
   }
   ```

3. In `OrderService.java` after save:
   ```java
   rabbitTemplate.convertAndSend("order.events", "order.status.changed", orderEvent);
   ```

4. Enable with env var: `RABBITMQ_ENABLED=true` (add feature flag check)

### Uncommenting the main docker-compose.yml block
Uncomment the `rabbitmq:` service block in `docker-compose.yml` and add the connection env vars to `notification-service`.

---

## Key Pika Patterns (Python — for masova-support agent)

```python
import pika

# Connect
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Declare durable topic exchange
channel.exchange_declare(exchange='order.events', exchange_type='topic', durable=True)

# Subscribe to all order events
result = channel.queue_declare(queue='', exclusive=True)
channel.queue_bind(exchange='order.events', queue=result.method.queue, routing_key='order.#')

# Consume
def on_event(ch, method, props, body):
    event = json.loads(body)
    # handle order status change — e.g. proactively notify customer via AI agent
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=result.method.queue, on_message_callback=on_event)
channel.start_consuming()
```

## Routing Key Conventions (proposed)

| Event | Routing Key |
|---|---|
| Order status changed | `order.status.changed` |
| Order created | `order.created` |
| Payment completed | `payment.completed` |
| Driver assigned | `delivery.assigned` |
| Kitchen bump | `kitchen.status.bumped` |
