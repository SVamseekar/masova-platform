# Stage 1: Build — Maven with dependency caching
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy poms first for layer caching (deps only re-downloaded when pom changes)
COPY pom.xml .
COPY shared-models/pom.xml shared-models/pom.xml
COPY shared-security/pom.xml shared-security/pom.xml
COPY intelligence-service/pom.xml intelligence-service/pom.xml
RUN mvn dependency:go-offline -pl intelligence-service -am -q 2>/dev/null || true

# Copy source and build
COPY shared-models/src shared-models/src
COPY shared-security/src shared-security/src
COPY intelligence-service/src intelligence-service/src
RUN mvn package -pl intelligence-service -am -DskipTests -q

# Stage 2: Runtime — JRE only (~200MB vs ~600MB JDK)
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app

RUN groupadd -r masova && useradd -r -g masova -u 1001 masova
USER masova

COPY --from=builder --chown=masova:masova /build/intelligence-service/target/intelligence-service-*.jar app.jar

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8087/actuator/health || exit 1

EXPOSE 8087
ENTRYPOINT ["java", "-jar", "-Xmx512m", "-XX:+UseContainerSupport", "-Dspring.profiles.active=prod", "app.jar"]

