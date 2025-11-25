FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy parent pom and shared-models first
COPY pom.xml ./
COPY shared-models ./shared-models
COPY review-service/pom.xml ./review-service/

# Download dependencies
RUN cd review-service && mvn dependency:go-offline -B

# Copy source code
COPY review-service/src ./review-service/src

# Build the application
RUN cd review-service && mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built artifact
COPY --from=build /app/review-service/target/*.jar app.jar

EXPOSE 8089

ENTRYPOINT ["java", "-jar", "app.jar"]
