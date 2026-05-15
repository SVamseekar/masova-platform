# Backend Test Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the corporate-grade backend test infrastructure that all subsequent test writing plans depend on — shared test-jar, Testcontainers base classes, JaCoCo coverage gates, application-test.yml per service, Maven Surefire/Failsafe separation, and correct folder structure.

**Architecture:** `shared-models` publishes a test-jar containing `BaseServiceTest`, `BaseIntegrationTest`, `BaseFullIntegrationTest`, and `BaseMessagingIntegrationTest`. Each service depends on this test-jar and organises its tests into `unit/`, `integration/`, and `contract/` sub-packages. Maven Surefire runs `*Test.java` (fast, no Docker), Failsafe runs `*IT.java` (Testcontainers, Docker). JaCoCo enforces 80% line / 70% branch coverage at the `verify` phase.

**Tech Stack:** JUnit 5, Mockito, Testcontainers 1.19.3, JaCoCo 0.8.11, Maven Surefire 3.x, Maven Failsafe 3.x, Spring Boot 3.x test slices

---

## File Map

| File | Change |
|------|--------|
| `shared-models/pom.xml` | Add maven-jar-plugin test-jar goal |
| `shared-models/src/test/java/com/MaSoVa/shared/test/BaseFullIntegrationTest.java` | Create — MongoDB + PostgreSQL + Redis Testcontainers |
| `shared-models/src/test/java/com/MaSoVa/shared/test/BaseMessagingIntegrationTest.java` | Create — extends BaseFullIntegrationTest + RabbitMQ |
| `pom.xml` (root) | Add JaCoCo plugin to pluginManagement, Surefire + Failsafe config |
| `core-service/pom.xml` | Add Testcontainers deps + test-jar dep |
| `commerce-service/pom.xml` | Add postgresql Testcontainer + test-jar dep |
| `logistics-service/pom.xml` | Add Testcontainers deps + test-jar dep |
| `payment-service/pom.xml` | Add postgresql Testcontainer + test-jar dep |
| `intelligence-service/pom.xml` | Add Testcontainers deps + test-jar dep |
| `api-gateway/pom.xml` | Add Testcontainers junit-jupiter + test-jar dep |
| `{service}/src/test/resources/application-test.yml` | Create for core, commerce, logistics, intelligence |
| `{service}/src/test/java/.../unit/` | Create empty package marker per service |
| `{service}/src/test/java/.../integration/` | Create empty package marker per service |
| `{service}/src/test/java/.../contract/` | Create empty package marker per service |
| Existing test files | Move into correct unit/ subfolder |

---

### Task 1: Publish shared-models as a Test-JAR

**Context:** `BaseIntegrationTest`, `BaseServiceTest`, `MockFactory`, `TestDataBuilder`, and `MockServiceClients` live in `shared-models/src/test/java`. Test-scoped code in a dependency is not available to consumers unless the module explicitly publishes a test-jar. Without this, every service that tries to `extend BaseIntegrationTest` will get a compile error.

**Files:**
- Modify: `shared-models/pom.xml`

- [ ] **Step 1: Add the maven-jar-plugin test-jar execution to shared-models/pom.xml**

Find the `<build><plugins>` section in `shared-models/pom.xml` and add:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-jar-plugin</artifactId>
  <executions>
    <execution>
      <id>test-jar</id>
      <phase>package</phase>
      <goals>
        <goal>test-jar</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

- [ ] **Step 2: Verify the test-jar is produced**

```bash
mvn package -pl shared-models --no-transfer-progress -q
ls shared-models/target/ | grep test
```

Expected output includes: `shared-models-1.0.0-tests.jar`

- [ ] **Step 3: Commit**

```bash
git add shared-models/pom.xml
git commit -m "feat(shared-models): publish test-jar so BaseIntegrationTest and test utilities are available to all services"
```

---

### Task 2: Create BaseFullIntegrationTest (MongoDB + PostgreSQL + Redis)

**Context:** The existing `BaseIntegrationTest` only spins up MongoDB. Most services also need PostgreSQL (for dual-write JPA entities) and Redis (for caching and JWT blacklist). `BaseFullIntegrationTest` extends the existing class and adds PostgreSQL and Redis containers using Spring Boot 3.1+ `@ServiceConnection` where possible, falling back to `@DynamicPropertySource` for Redis.

**Files:**
- Create: `shared-models/src/test/java/com/MaSoVa/shared/test/BaseFullIntegrationTest.java`

- [ ] **Step 1: Create the file**

```java
package com.MaSoVa.shared.test;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseFullIntegrationTest extends BaseIntegrationTest {

    @Container
    @SuppressWarnings("resource")
    protected static final PostgreSQLContainer<?> postgresContainer =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("masova_test")
                    .withUsername("masova")
                    .withPassword("masova_test")
                    .withReuse(true);

    @Container
    @SuppressWarnings("resource")
    protected static final GenericContainer<?> redisContainer =
            new GenericContainer<>("redis:7-alpine")
                    .withExposedPorts(6379)
                    .withReuse(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgresContainer::getUsername);
        registry.add("spring.datasource.password", postgresContainer::getPassword);
        registry.add("spring.data.redis.host", redisContainer::getHost);
        registry.add("spring.data.redis.port", () -> redisContainer.getMappedPort(6379));
        registry.add("spring.data.redis.password", () -> "");
    }
}
```

- [ ] **Step 2: Rebuild shared-models test-jar to include the new class**

```bash
mvn package -pl shared-models --no-transfer-progress -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add shared-models/src/test/java/com/MaSoVa/shared/test/BaseFullIntegrationTest.java
git commit -m "feat(shared-models): add BaseFullIntegrationTest with PostgreSQL + Redis Testcontainers"
```

---

### Task 3: Create BaseMessagingIntegrationTest (adds RabbitMQ)

**Context:** Services that consume or publish RabbitMQ events (core, commerce, logistics, intelligence) need a broker in integration tests. `BaseMessagingIntegrationTest` extends `BaseFullIntegrationTest` and adds a `RabbitMQContainer`.

**Files:**
- Create: `shared-models/src/test/java/com/MaSoVa/shared/test/BaseMessagingIntegrationTest.java`

- [ ] **Step 1: Add RabbitMQ testcontainer dependency to shared-models pom**

In `shared-models/pom.xml`, find the testcontainers block and add:

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>rabbitmq</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 2: Create the file**

```java
package com.MaSoVa.shared.test;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;

public abstract class BaseMessagingIntegrationTest extends BaseFullIntegrationTest {

    @Container
    @SuppressWarnings("resource")
    protected static final RabbitMQContainer rabbitContainer =
            new RabbitMQContainer("rabbitmq:3.12-alpine")
                    .withUser("masova", "masova_secret")
                    .withReuse(true);

    @DynamicPropertySource
    static void configureRabbitProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", rabbitContainer::getHost);
        registry.add("spring.rabbitmq.port", rabbitContainer::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "masova");
        registry.add("spring.rabbitmq.password", () -> "masova_secret");
    }
}
```

- [ ] **Step 3: Rebuild and verify**

```bash
mvn package -pl shared-models --no-transfer-progress -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add shared-models/pom.xml shared-models/src/test/java/com/MaSoVa/shared/test/BaseMessagingIntegrationTest.java
git commit -m "feat(shared-models): add BaseMessagingIntegrationTest with RabbitMQ Testcontainer"
```

---

### Task 4: Configure Maven Surefire/Failsafe + JaCoCo in Root pom.xml

**Context:** Currently `mvn test` runs all tests including Testcontainer-based integration tests, making local test runs slow and Docker-dependent. The fix: `*Test.java` → Surefire (fast, no Docker), `*IT.java` → Failsafe (Docker required). JaCoCo enforces 80% line / 70% branch at the `verify` phase and is excluded for boilerplate classes.

**Files:**
- Modify: `pom.xml` (root)

- [ ] **Step 1: Add Surefire, Failsafe, and JaCoCo to root pom pluginManagement**

In the root `pom.xml`, inside `<build><pluginManagement><plugins>`, add:

```xml
<!-- Surefire: runs *Test.java (unit tests, no Docker) -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-surefire-plugin</artifactId>
  <version>3.2.5</version>
  <configuration>
    <includes>
      <include>**/*Test.java</include>
    </includes>
    <excludes>
      <exclude>**/*IT.java</exclude>
    </excludes>
    <argLine>${surefireArgLine}</argLine>
  </configuration>
</plugin>

<!-- Failsafe: runs *IT.java (integration tests, Docker required) -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-failsafe-plugin</artifactId>
  <version>3.2.5</version>
  <configuration>
    <includes>
      <include>**/*IT.java</include>
    </includes>
    <argLine>${failsafeArgLine}</argLine>
  </configuration>
  <executions>
    <execution>
      <goals>
        <goal>integration-test</goal>
        <goal>verify</goal>
      </goals>
    </execution>
  </executions>
</plugin>

<!-- JaCoCo: coverage reporting and enforcement -->
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <id>prepare-agent</id>
      <goals><goal>prepare-agent</goal></goals>
      <configuration>
        <propertyName>surefireArgLine</propertyName>
      </configuration>
    </execution>
    <execution>
      <id>prepare-agent-integration</id>
      <goals><goal>prepare-agent-integration</goal></goals>
      <configuration>
        <propertyName>failsafeArgLine</propertyName>
      </configuration>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals><goal>report</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <phase>verify</phase>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
              </limit>
              <limit>
                <counter>BRANCH</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.70</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
        <excludes>
          <exclude>**/*Application.class</exclude>
          <exclude>**/*Config.class</exclude>
          <exclude>**/*Configuration.class</exclude>
          <exclude>**/dto/**</exclude>
          <exclude>**/entity/**</exclude>
          <exclude>**/model/**</exclude>
        </excludes>
      </configuration>
    </execution>
  </executions>
</plugin>
```

- [ ] **Step 2: Verify root pom compiles**

```bash
mvn validate --no-transfer-progress -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Verify unit tests run with `mvn test` (no Docker)**

```bash
mvn test -pl shared-models --no-transfer-progress 2>&1 | tail -10
```

Expected: `BUILD SUCCESS` — only `*Test.java` files run.

- [ ] **Step 4: Commit**

```bash
git add pom.xml
git commit -m "feat(build): add Surefire/Failsafe separation and JaCoCo 80% coverage gate to root pom"
```

---

### Task 5: Add Testcontainer Dependencies to Each Service pom.xml

**Context:** Each service needs the correct Testcontainer modules to match its infrastructure. commerce-service and payment-service already have MongoDB containers but need PostgreSQL. core-service, logistics-service need all containers from scratch. intelligence-service needs MongoDB only (no PostgreSQL). api-gateway needs junit-jupiter only (WebFlux reactive, no DB).

Also, each service needs to declare a dependency on `shared-models` test-jar so they can extend `BaseFullIntegrationTest`.

**Files:**
- Modify: `core-service/pom.xml`, `commerce-service/pom.xml`, `logistics-service/pom.xml`, `payment-service/pom.xml`, `intelligence-service/pom.xml`, `api-gateway/pom.xml`

- [ ] **Step 1: Add to core-service/pom.xml**

In the `<dependencies>` section after existing test deps:

```xml
<!-- Testcontainers for integration tests -->
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>mongodb</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>rabbitmq</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<!-- Shared test utilities -->
<dependency>
  <groupId>com.MaSoVa</groupId>
  <artifactId>shared-models</artifactId>
  <version>1.0.0</version>
  <type>test-jar</type>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 2: Add to commerce-service/pom.xml**

commerce-service already has `junit-jupiter:1.19.3` and `mongodb:1.19.3`. Add only:

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>rabbitmq</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.MaSoVa</groupId>
  <artifactId>shared-models</artifactId>
  <version>1.0.0</version>
  <type>test-jar</type>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 3: Add to logistics-service/pom.xml**

logistics-service has no Testcontainers at all. Add:

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>mongodb</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.MaSoVa</groupId>
  <artifactId>shared-models</artifactId>
  <version>1.0.0</version>
  <type>test-jar</type>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 4: Add to payment-service/pom.xml**

payment-service already has `junit-jupiter:1.19.3` and `mongodb:1.19.3`. Add:

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.MaSoVa</groupId>
  <artifactId>shared-models</artifactId>
  <version>1.0.0</version>
  <type>test-jar</type>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 5: Add to intelligence-service/pom.xml**

intelligence-service has no Testcontainers. It only uses MongoDB (no PostgreSQL). Add:

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>mongodb</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>rabbitmq</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.MaSoVa</groupId>
  <artifactId>shared-models</artifactId>
  <version>1.0.0</version>
  <type>test-jar</type>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 6: Add to api-gateway/pom.xml**

api-gateway is WebFlux reactive (no DB). Add only:

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.MaSoVa</groupId>
  <artifactId>shared-models</artifactId>
  <version>1.0.0</version>
  <type>test-jar</type>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 7: Verify all services compile**

```bash
mvn compile -pl core-service,commerce-service,logistics-service,payment-service,intelligence-service,api-gateway -am --no-transfer-progress -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 8: Commit**

```bash
git add core-service/pom.xml commerce-service/pom.xml logistics-service/pom.xml payment-service/pom.xml intelligence-service/pom.xml api-gateway/pom.xml
git commit -m "feat(test): add Testcontainers deps and shared-models test-jar to all 6 services"
```

---

### Task 6: Create application-test.yml for Missing Services

**Context:** `application-test.yml` provides test-specific Spring config overrides — disabling unnecessary features (Firebase, Twilio, Google Maps), setting predictable JWT secrets, and pointing to Testcontainer URIs. payment-service and api-gateway already have these. core-service, commerce-service, logistics-service, intelligence-service do not.

**Files:**
- Create: `core-service/src/test/resources/application-test.yml`
- Create: `commerce-service/src/test/resources/application-test.yml`
- Create: `logistics-service/src/test/resources/application-test.yml`
- Create: `intelligence-service/src/test/resources/application-test.yml`

- [ ] **Step 1: Create core-service/src/test/resources/application-test.yml**

```yaml
spring:
  data:
    mongodb:
      # Overridden by @DynamicPropertySource in BaseIntegrationTest
      uri: mongodb://localhost:27017/masova_core_test
  datasource:
    # Overridden by @DynamicPropertySource in BaseFullIntegrationTest
    url: jdbc:postgresql://localhost:5432/masova_test
    username: masova
    password: masova_test
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
  rabbitmq:
    host: localhost
    port: 5672
    username: masova
    password: masova_secret
  cache:
    type: none

jwt:
  secret: test-secret-key-at-least-64-characters-long-for-hs512-algorithm-ok
  access-token-expiration: 900000
  refresh-token-expiration: 86400000

# Disable external service calls in tests
google:
  oauth:
    client-id: test-client-id
twilio:
  enabled: false
firebase:
  enabled: false

logging:
  level:
    com.MaSoVa: WARN
    org.springframework: WARN
    org.testcontainers: WARN
```

- [ ] **Step 2: Create commerce-service/src/test/resources/application-test.yml**

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/masova_commerce_test
  datasource:
    url: jdbc:postgresql://localhost:5432/masova_test
    username: masova
    password: masova_test
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
  rabbitmq:
    host: localhost
    port: 5672
    username: masova
    password: masova_secret
  cache:
    type: none

jwt:
  secret: test-secret-key-at-least-64-characters-long-for-hs512-algorithm-ok
  access-token-expiration: 900000
  refresh-token-expiration: 86400000

logging:
  level:
    com.MaSoVa: WARN
    org.springframework: WARN
    org.testcontainers: WARN
```

- [ ] **Step 3: Create logistics-service/src/test/resources/application-test.yml**

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/masova_logistics_test
  datasource:
    url: jdbc:postgresql://localhost:5432/masova_test
    username: masova
    password: masova_test
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
  rabbitmq:
    host: localhost
    port: 5672
    username: masova
    password: masova_secret
  cache:
    type: none

jwt:
  secret: test-secret-key-at-least-64-characters-long-for-hs512-algorithm-ok
  access-token-expiration: 900000
  refresh-token-expiration: 86400000

google:
  maps:
    api-key: test-maps-key

logging:
  level:
    com.MaSoVa: WARN
    org.springframework: WARN
    org.testcontainers: WARN
```

- [ ] **Step 4: Create intelligence-service/src/test/resources/application-test.yml**

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/masova_analytics_test
  rabbitmq:
    host: localhost
    port: 5672
    username: masova
    password: masova_secret
  cache:
    type: none

jwt:
  secret: test-secret-key-at-least-64-characters-long-for-hs512-algorithm-ok
  access-token-expiration: 900000
  refresh-token-expiration: 86400000

logging:
  level:
    com.MaSoVa: WARN
    org.springframework: WARN
    org.testcontainers: WARN
```

- [ ] **Step 5: Commit**

```bash
git add core-service/src/test/resources/ commerce-service/src/test/resources/ logistics-service/src/test/resources/ intelligence-service/src/test/resources/
git commit -m "feat(test): add application-test.yml to core, commerce, logistics, intelligence services"
```

---

### Task 7: Restructure Existing Test Files into unit/ Subfolders

**Context:** All existing test files are in flat packages. They need to move into `unit/` (for Mockito tests) so Surefire picks them up correctly via the `*Test.java` convention. No code changes needed — just directory restructure and package declaration updates.

Map of files to move:

**core-service:**
- `store/StoreVatFieldsTest.java` → `unit/domain/StoreVatFieldsTest.java`
- `store/service/StoreServiceCurrencyTest.java` → `unit/service/StoreServiceCurrencyTest.java`
- `store/service/CountryProfileServiceTest.java` → `unit/service/CountryProfileServiceTest.java`

**commerce-service:**
- All 14 existing test files → `unit/` with appropriate sub-package (controller/, service/, domain/)

**payment-service:**
- All 13 existing test files → `unit/` with appropriate sub-package (controller/, service/, gateway/)

**api-gateway:**
- All 4 existing test files → `unit/` with appropriate sub-package (filter/, handler/)

**Files:**
- Move + update package: all existing test files in core, commerce, payment, api-gateway

- [ ] **Step 1: Move core-service test files**

```bash
cd core-service/src/test/java/com/MaSoVa/core
mkdir -p unit/domain unit/service
mv store/StoreVatFieldsTest.java unit/domain/StoreVatFieldsTest.java
mv store/service/StoreServiceCurrencyTest.java unit/service/StoreServiceCurrencyTest.java
mv store/service/CountryProfileServiceTest.java unit/service/CountryProfileServiceTest.java
```

Update package declarations in each moved file from `com.MaSoVa.core.store` to `com.MaSoVa.core.unit.domain` (or `.unit.service`).

- [ ] **Step 2: Move commerce-service test files**

```bash
cd commerce-service/src/test/java/com/MaSoVa/commerce
mkdir -p unit/controller unit/service unit/domain unit/config
mv menu/controller/MenuControllerTest.java unit/controller/MenuControllerTest.java
mv menu/service/MenuServiceTest.java unit/service/MenuServiceTest.java
mv fiscal/FiscalSignerRegistryTest.java unit/service/FiscalSignerRegistryTest.java
mv fiscal/FiscalSigningServiceTest.java unit/service/FiscalSigningServiceTest.java
mv order/config/EuVatConfigurationTest.java unit/config/EuVatConfigurationTest.java
mv order/config/TaxConfigurationTest.java unit/config/TaxConfigurationTest.java
mv order/entity/OrderCurrencyFieldTest.java unit/domain/OrderCurrencyFieldTest.java
mv order/entity/OrderVatFieldsTest.java unit/domain/OrderVatFieldsTest.java
mv order/service/AggregatorServiceTest.java unit/service/AggregatorServiceTest.java
mv order/service/EuVatEngineTest.java unit/service/EuVatEngineTest.java
mv order/service/OrderServiceCreateOrderTest.java unit/service/OrderServiceCreateOrderTest.java
mv order/service/OrderServiceCurrencyTest.java unit/service/OrderServiceCurrencyTest.java
mv order/service/OrderServiceEuVatTest.java unit/service/OrderServiceEuVatTest.java
mv order/service/OrderServiceTerminalStatusTest.java unit/service/OrderServiceTerminalStatusTest.java
```

Update package declarations in each moved file accordingly.

- [ ] **Step 3: Move payment-service test files**

```bash
cd payment-service/src/test/java/com/MaSoVa/payment
mkdir -p unit/controller unit/service unit/gateway
mv controller/PaymentControllerTest.java unit/controller/PaymentControllerTest.java
mv controller/RefundControllerTest.java unit/controller/RefundControllerTest.java
mv controller/StripeWebhookControllerTest.java unit/controller/StripeWebhookControllerTest.java
mv controller/WebhookControllerTest.java unit/controller/WebhookControllerTest.java
mv service/OrderServiceClientTest.java unit/service/OrderServiceClientTest.java
mv service/PaymentNotificationServiceTest.java unit/service/PaymentNotificationServiceTest.java
mv service/PaymentServiceTest.java unit/service/PaymentServiceTest.java
mv service/PiiEncryptionServiceTest.java unit/service/PiiEncryptionServiceTest.java
mv service/RazorpayServiceTest.java unit/service/RazorpayServiceTest.java
mv service/RefundServiceTest.java unit/service/RefundServiceTest.java
mv gateway/PaymentGatewayResolverTest.java unit/gateway/PaymentGatewayResolverTest.java
mv gateway/RazorpayGatewayTest.java unit/gateway/RazorpayGatewayTest.java
mv gateway/StripeGatewayTest.java unit/gateway/StripeGatewayTest.java
```

Update package declarations in each moved file accordingly.

- [ ] **Step 4: Move api-gateway test files**

```bash
cd api-gateway/src/test/java/com/MaSoVa/gateway
mkdir -p unit/filter unit/handler
mv filter/ForwardedHeaderFilterTest.java unit/filter/ForwardedHeaderFilterTest.java
mv filter/JwtAuthenticationFilterTest.java unit/filter/JwtAuthenticationFilterTest.java
mv filter/RateLimitingFilterTest.java unit/filter/RateLimitingFilterTest.java
mv handler/SystemInfoHandlerTest.java unit/handler/SystemInfoHandlerTest.java
```

Update package declarations in each moved file accordingly.

- [ ] **Step 5: Also fix PaymentControllerTest stale /api/v1/ paths**

In `payment-service/src/test/java/com/MaSoVa/payment/unit/controller/PaymentControllerTest.java`, find all occurrences of `/api/v1/payments` and replace with `/api/payments`:

```bash
grep -n "api/v1/payments" payment-service/src/test/java/com/MaSoVa/payment/unit/controller/PaymentControllerTest.java
```

Replace every `/api/v1/payments` with `/api/payments` in that file.

- [ ] **Step 6: Verify all unit tests still compile and pass**

```bash
mvn test -pl core-service,commerce-service,payment-service,api-gateway --no-transfer-progress 2>&1 | tail -20
```

Expected: `BUILD SUCCESS` — all tests pass with no compile errors.

- [ ] **Step 7: Commit**

```bash
git add core-service/src/test/ commerce-service/src/test/ payment-service/src/test/ api-gateway/src/test/
git commit -m "refactor(test): move existing tests into unit/ subfolders, fix PaymentControllerTest stale /api/v1/ paths"
```

---

### Task 8: Create Empty integration/ and contract/ Package Placeholders

**Context:** Create the `integration/` and `contract/` directory structure per service so subsequent plans have the correct target locations to write tests into.

**Files:**
- Create: `.gitkeep` files in each service's `integration/controller/`, `integration/repository/`, `integration/messaging/`, `contract/` directories

- [ ] **Step 1: Create directory structure for all 6 services**

```bash
for svc in core-service commerce-service logistics-service payment-service intelligence-service api-gateway; do
  base="$svc/src/test/java/com/MaSoVa"
  # Determine correct package fragment
  case $svc in
    core-service) pkg="core" ;;
    commerce-service) pkg="commerce" ;;
    logistics-service) pkg="logistics" ;;
    payment-service) pkg="payment" ;;
    intelligence-service) pkg="intelligence" ;;
    api-gateway) pkg="gateway" ;;
  esac
  mkdir -p "$base/$pkg/integration/controller"
  mkdir -p "$base/$pkg/integration/repository"
  mkdir -p "$base/$pkg/integration/messaging"
  mkdir -p "$base/$pkg/contract"
  touch "$base/$pkg/integration/controller/.gitkeep"
  touch "$base/$pkg/integration/repository/.gitkeep"
  touch "$base/$pkg/integration/messaging/.gitkeep"
  touch "$base/$pkg/contract/.gitkeep"
done
```

- [ ] **Step 2: Verify structure**

```bash
find core-service/src/test -type d | sort
```

Expected output includes `unit/`, `integration/controller/`, `integration/repository/`, `integration/messaging/`, `contract/`

- [ ] **Step 3: Commit**

```bash
git add core-service/src/test core-service/src/test commerce-service/src/test logistics-service/src/test payment-service/src/test intelligence-service/src/test api-gateway/src/test
git commit -m "feat(test): create unit/integration/contract folder structure for all 6 services"
```

---

## Verification Checklist

- [ ] `mvn package -pl shared-models` produces `target/shared-models-1.0.0-tests.jar`
- [ ] `mvn test -pl core-service,commerce-service,payment-service,api-gateway` passes all unit tests (no Docker needed)
- [ ] `mvn compile -pl core-service,commerce-service,logistics-service,payment-service,intelligence-service,api-gateway -am` succeeds
- [ ] `grep "api/v1/payments" payment-service/src/test/java/com/MaSoVa/payment/unit/controller/PaymentControllerTest.java` returns nothing
- [ ] Each service has `src/test/resources/application-test.yml`
- [ ] Each service has `unit/`, `integration/controller/`, `integration/repository/`, `integration/messaging/`, `contract/` directories
