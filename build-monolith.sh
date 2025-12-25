#!/bin/bash

################################################################################
# MaSoVa - Automated Monolith Build Script
#
# Purpose: Builds all microservices and packages them into a single deployable
#          monolith JAR for easy installation and distribution
#
# Usage: ./build-monolith.sh [OPTIONS]
#
# Options:
#   --skip-tests     Skip running tests (faster build)
#   --docker         Build Docker image after JAR
#   --push           Push Docker image to registry
#   --version=X.Y.Z  Set version tag (default: auto-increment)
#
# Example:
#   ./build-monolith.sh --docker --version=1.0.2
#
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT=$(pwd)
BUILD_DIR="$PROJECT_ROOT/masova-monolith"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_ROOT/build-$TIMESTAMP.log"

# Load configuration
if [ -f "$PROJECT_ROOT/.masova-config" ]; then
    source "$PROJECT_ROOT/.masova-config"
else
    echo -e "${RED}❌ .masova-config file not found${NC}"
    echo "Please create .masova-config and set your Docker Hub username"
    echo "See SETUP-INSTRUCTIONS.md for details"
    exit 1
fi

# Validate Docker Hub username is set
if [ "$DOCKER_HUB_USERNAME" = "YOUR_DOCKERHUB_USERNAME" ]; then
    echo -e "${RED}❌ Docker Hub username not configured${NC}"
    echo ""
    echo "Please edit .masova-config and set your Docker Hub username:"
    echo "  DOCKER_HUB_USERNAME=your-actual-username"
    echo ""
    echo "See SETUP-INSTRUCTIONS.md for complete setup guide"
    exit 1
fi

# Set Docker image names
DOCKER_BACKEND_IMAGE="${DOCKER_HUB_USERNAME}/masova-backend"
DOCKER_FRONTEND_IMAGE="${DOCKER_HUB_USERNAME}/masova-frontend"

# Parse command line arguments
SKIP_TESTS=false
BUILD_DOCKER=false
PUSH_DOCKER=false
VERSION=""

for arg in "$@"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --docker)
            BUILD_DOCKER=true
            shift
            ;;
        --push)
            PUSH_DOCKER=true
            BUILD_DOCKER=true
            shift
            ;;
        --version=*)
            VERSION="${arg#*=}"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            exit 1
            ;;
    esac
done

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================================${NC}"
    echo ""
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Start build
print_header "MaSoVa Monolith Build Process"
echo "Build started at: $(date)"
echo "Build log: $LOG_FILE"
echo ""

# Check prerequisites
print_header "Checking Prerequisites"

if ! command -v mvn &> /dev/null; then
    print_error "Maven not found. Please install Maven."
    exit 1
fi
print_success "Maven found: $(mvn --version | head -n 1)"

if ! command -v java &> /dev/null; then
    print_error "Java not found. Please install JDK 17 or higher."
    exit 1
fi
print_success "Java found: $(java -version 2>&1 | head -n 1)"

if [ "$BUILD_DOCKER" = true ]; then
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Install Docker or remove --docker flag."
        exit 1
    fi
    print_success "Docker found: $(docker --version)"
fi

# Get version
if [ -z "$VERSION" ]; then
    # Auto-increment version from version.properties
    if [ -f "$PROJECT_ROOT/version.properties" ]; then
        CURRENT_VERSION=$(grep "version=" "$PROJECT_ROOT/version.properties" | cut -d'=' -f2)
        # Auto-increment patch version
        IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR="${VERSION_PARTS[0]}"
        MINOR="${VERSION_PARTS[1]}"
        PATCH="${VERSION_PARTS[2]}"
        PATCH=$((PATCH + 1))
        VERSION="$MAJOR.$MINOR.$PATCH"
        print_warning "Auto-incremented version: $CURRENT_VERSION → $VERSION"
    else
        VERSION="1.0.0"
        print_warning "No version found, using default: $VERSION"
    fi
fi

# Save version to file
echo "version=$VERSION" > "$PROJECT_ROOT/version.properties"
echo "buildDate=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$PROJECT_ROOT/version.properties"
print_success "Version set to: $VERSION"

# Clean previous builds
print_header "Cleaning Previous Builds"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
print_success "Build directory cleaned"

# Build parent POM
print_header "Building Parent POM"
mvn clean install -DskipTests >> "$LOG_FILE" 2>&1
print_success "Parent POM built successfully"

# Define microservices to build
MICROSERVICES=(
    "shared-models"
    "shared-security"
    "user-service"
    "menu-service"
    "order-service"
    "customer-service"
    "inventory-service"
    "payment-service"
    "delivery-service"
    "analytics-service"
    "review-service"
    "notification-service"
    "api-gateway"
)

# Build each microservice
print_header "Building Microservices"

for service in "${MICROSERVICES[@]}"; do
    if [ -d "$PROJECT_ROOT/$service" ]; then
        echo ""
        echo -e "${BLUE}Building $service...${NC}"

        cd "$PROJECT_ROOT/$service"

        if [ "$SKIP_TESTS" = true ]; then
            mvn clean package -DskipTests >> "$LOG_FILE" 2>&1
        else
            mvn clean package >> "$LOG_FILE" 2>&1
        fi

        # Copy JAR to build directory
        if [ -f "target/$service-*.jar" ] && [ ! -f "target/$service-*-sources.jar" ]; then
            cp target/$service-*.jar "$BUILD_DIR/"
            print_success "$service built and copied"
        elif [ "$service" = "shared-models" ] || [ "$service" = "shared-security" ]; then
            print_warning "$service is a library (no executable JAR expected)"
        else
            print_error "$service build failed - JAR not found"
            exit 1
        fi

        cd "$PROJECT_ROOT"
    else
        print_warning "$service directory not found, skipping"
    fi
done

# Create application.properties for monolith
print_header "Creating Monolith Configuration"

cat > "$BUILD_DIR/application.properties" << 'EOF'
# MaSoVa Monolith Configuration
# Version: ${VERSION}

# Server Configuration
server.port=8080

# Database
spring.data.mongodb.uri=${MONGODB_URI:mongodb://localhost:27017/masova}
spring.data.mongodb.database=masova

# Redis Cache
spring.redis.host=${REDIS_HOST:localhost}
spring.redis.port=${REDIS_PORT:6379}

# Security
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000

# CORS
cors.allowed.origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000}

# Frontend URLs
frontend.url=${FRONTEND_URL:http://localhost:3000}
frontend.base.url=${FRONTEND_BASE_URL:http://localhost:3000}

# Payment Gateway (Razorpay)
razorpay.key.id=${RAZORPAY_KEY_ID}
razorpay.key.secret=${RAZORPAY_KEY_SECRET}

# Email Service (Brevo)
brevo.api.key=${BREVO_API_KEY}
brevo.from.email=${BREVO_FROM_EMAIL}
brevo.from.name=${BREVO_FROM_NAME}
brevo.enabled=${BREVO_ENABLED:true}
brevo.daily.limit=${BREVO_DAILY_LIMIT:300}

# Logging
logging.level.root=INFO
logging.level.com.MaSoVa=DEBUG
logging.file.name=logs/masova.log
logging.file.max-size=10MB
logging.file.max-history=30

# Actuator
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always

# Version Info
info.app.name=MaSoVa Restaurant Management System
info.app.version=${VERSION}
info.app.description=Complete Restaurant Management Solution
EOF

sed -i.bak "s/\${VERSION}/$VERSION/g" "$BUILD_DIR/application.properties"
rm "$BUILD_DIR/application.properties.bak"
print_success "Monolith configuration created"

# Create startup script
print_header "Creating Startup Scripts"

# Linux/Mac startup script
cat > "$BUILD_DIR/start-masova.sh" << 'EOF'
#!/bin/bash

echo "================================================"
echo "   MaSoVa Restaurant Management System"
echo "   Starting services..."
echo "================================================"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check Java
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install JDK 17 or higher."
    exit 1
fi

# Start all services
echo "Starting API Gateway..."
java -jar api-gateway-*.jar --server.port=8080 &

echo "Starting User Service..."
java -jar user-service-*.jar --server.port=8081 &

echo "Starting Menu Service..."
java -jar menu-service-*.jar --server.port=8082 &

echo "Starting Order Service..."
java -jar order-service-*.jar --server.port=8083 &

echo "Starting Customer Service..."
java -jar customer-service-*.jar --server.port=8084 &

echo "Starting Analytics Service..."
java -jar analytics-service-*.jar --server.port=8085 &

echo "Starting Payment Service..."
java -jar payment-service-*.jar --server.port=8086 &

echo "Starting Inventory Service..."
java -jar inventory-service-*.jar --server.port=8088 &

echo "Starting Review Service..."
java -jar review-service-*.jar --server.port=8089 &

echo "Starting Delivery Service..."
java -jar delivery-service-*.jar --server.port=8090 &

echo "Starting Notification Service..."
java -jar notification-service-*.jar --server.port=8092 &

echo ""
echo "✅ All services started!"
echo "🌐 Access MaSoVa at: http://localhost:3000"
echo "📊 Health check: http://localhost:8080/actuator/health"
echo ""
echo "To stop all services, run: ./stop-masova.sh"
EOF

chmod +x "$BUILD_DIR/start-masova.sh"
print_success "Linux/Mac startup script created"

# Windows startup script
cat > "$BUILD_DIR/start-masova.bat" << 'EOF'
@echo off
echo ================================================
echo    MaSoVa Restaurant Management System
echo    Starting services...
echo ================================================

REM Start all services
start "API Gateway" java -jar api-gateway-*.jar --server.port=8080
start "User Service" java -jar user-service-*.jar --server.port=8081
start "Menu Service" java -jar menu-service-*.jar --server.port=8082
start "Order Service" java -jar order-service-*.jar --server.port=8083
start "Customer Service" java -jar customer-service-*.jar --server.port=8084
start "Analytics Service" java -jar analytics-service-*.jar --server.port=8085
start "Payment Service" java -jar payment-service-*.jar --server.port=8086
start "Inventory Service" java -jar inventory-service-*.jar --server.port=8088
start "Review Service" java -jar review-service-*.jar --server.port=8089
start "Delivery Service" java -jar delivery-service-*.jar --server.port=8090
start "Notification Service" java -jar notification-service-*.jar --server.port=8092

echo.
echo All services started!
echo Access MaSoVa at: http://localhost:3000
echo Health check: http://localhost:8080/actuator/health
echo.
pause
EOF

print_success "Windows startup script created"

# Create stop script
cat > "$BUILD_DIR/stop-masova.sh" << 'EOF'
#!/bin/bash

echo "Stopping MaSoVa services..."

# Kill all Java processes related to MaSoVa
pkill -f "java -jar.*-service"
pkill -f "java -jar api-gateway"

echo "✅ All MaSoVa services stopped"
EOF

chmod +x "$BUILD_DIR/stop-masova.sh"
print_success "Stop script created"

# Build summary
print_header "Build Summary"

echo "Version: $VERSION"
echo "Build Directory: $BUILD_DIR"
echo "Services Built:"
ls -lh "$BUILD_DIR"/*.jar 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'
echo ""
print_success "Monolith build completed successfully!"

# Build Docker image if requested
if [ "$BUILD_DOCKER" = true ]; then
    print_header "Building Docker Image"

    # Create Dockerfile
    cat > "$BUILD_DIR/Dockerfile" << EOF
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy all JARs
COPY *.jar /app/
COPY application.properties /app/
COPY start-masova.sh /app/

# Expose ports
EXPOSE 8080 8081 8082 8083 8084 8085 8086 8088 8089 8090 8092

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start services
CMD ["./start-masova.sh"]
EOF

    cd "$BUILD_DIR"

    # Build Docker image
    docker build -t $DOCKER_BACKEND_IMAGE:$VERSION . >> "$LOG_FILE" 2>&1
    docker tag $DOCKER_BACKEND_IMAGE:$VERSION $DOCKER_BACKEND_IMAGE:latest

    print_success "Docker image built: $DOCKER_BACKEND_IMAGE:$VERSION"

    # Push to registry if requested
    if [ "$PUSH_DOCKER" = true ]; then
        print_header "Pushing to Docker Registry"

        docker push $DOCKER_BACKEND_IMAGE:$VERSION >> "$LOG_FILE" 2>&1
        docker push $DOCKER_BACKEND_IMAGE:latest >> "$LOG_FILE" 2>&1

        print_success "Docker image pushed to registry"
    fi

    cd "$PROJECT_ROOT"
fi

# Final summary
print_header "Build Complete"

echo "📦 Build artifacts available in: $BUILD_DIR"
echo "📝 Build log: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  1. Test the build: cd $BUILD_DIR && ./start-masova.sh"
echo "  2. Create distribution package: tar -czf masova-$VERSION.tar.gz $BUILD_DIR"
echo ""
if [ "$BUILD_DOCKER" = true ]; then
    echo "Docker image: $DOCKER_BACKEND_IMAGE:$VERSION"
    echo "Run with: docker run -p 8080:8080 $DOCKER_BACKEND_IMAGE:$VERSION"
    echo ""
fi

echo "Build completed at: $(date)"
print_success "All done! 🚀"
