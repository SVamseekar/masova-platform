FROM eclipse-temurin:21-jre-alpine

# Set working directory
WORKDIR /app

# Copy all JAR files
COPY masova-monolith/*.jar /app/

# Expose ports for all services
# API Gateway: 8080, User: 8081, Menu: 8082, Order: 8083
# Analytics: 8085, Payment: 8086, Inventory: 8088, Review: 8089
# Delivery: 8090, Customer: 8091, Notification: 8092
EXPOSE 8080 8081 8082 8083 8085 8086 8088 8089 8090 8091 8092

# Set default service to run (API Gateway)
ENV SERVICE_NAME=api-gateway

# Create startup script
RUN echo '#!/bin/sh\n\
if [ -z "$SERVICE_NAME" ]; then\n\
  echo "ERROR: SERVICE_NAME environment variable not set"\n\
  exit 1\n\
fi\n\
\n\
# Find the JAR file for the service\n\
JAR_FILE=$(ls /app/${SERVICE_NAME}*.jar 2>/dev/null | head -1)\n\
\n\
if [ -z "$JAR_FILE" ]; then\n\
  echo "ERROR: No JAR file found for service: $SERVICE_NAME"\n\
  echo "Available JARs:"\n\
  ls -1 /app/*.jar\n\
  exit 1\n\
fi\n\
\n\
echo "Starting $SERVICE_NAME..."\n\
echo "JAR: $JAR_FILE"\n\
java $JAVA_OPTS -jar "$JAR_FILE"' > /app/start.sh && chmod +x /app/start.sh

# Run the service
CMD ["/app/start.sh"]
