#!/bin/bash

################################################################################
# MaSoVa - Customer Update Script
#
# Purpose: Allows restaurant customers to easily update their MaSoVa
#          installation to the latest version
#
# Usage: ./update-masova.sh [OPTIONS]
#
# Options:
#   --force          Force update even if already on latest version
#   --version=X.Y.Z  Update to specific version
#   --skip-backup    Skip database backup (not recommended)
#   --auto           Auto-accept prompts (for automated updates)
#
# Example:
#   ./update-masova.sh --version=1.0.2
#
################################################################################

set -e  # Exit on error (but we'll handle errors manually for rollback)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/MaSoVa"
BACKUP_DIR="$INSTALL_DIR/backups"
UPDATE_CHECK_URL="https://raw.githubusercontent.com/yourusername/masova/main/version.properties"
DOCKER_IMAGE="masova/backend"
AUTO_MODE=false
FORCE_UPDATE=false
SKIP_BACKUP=false
TARGET_VERSION=""

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --force)
            FORCE_UPDATE=true
            shift
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --version=*)
            TARGET_VERSION="${arg#*=}"
            shift
            ;;
        --help)
            grep "^#" "$0" | grep -v "#!/bin/bash" | sed 's/^# //g' | sed 's/^#//g'
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Use --help for usage information"
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

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to ask for confirmation
confirm() {
    if [ "$AUTO_MODE" = true ]; then
        return 0
    fi

    read -p "$1 (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Start update process
print_header "MaSoVa Update Utility"
echo "Update started at: $(date)"
echo ""

# Check if MaSoVa is installed
if [ ! -d "$INSTALL_DIR" ]; then
    print_error "MaSoVa not found at $INSTALL_DIR"
    echo "Please install MaSoVa first using install-masova.sh"
    exit 1
fi

cd "$INSTALL_DIR"

# Check if running in Docker or standalone
USING_DOCKER=false
if [ -f "docker-compose.yml" ]; then
    USING_DOCKER=true
    print_success "Detected Docker installation"
else
    print_success "Detected standalone installation"
fi

# Get current version
print_header "Checking Current Version"

if [ "$USING_DOCKER" = true ]; then
    CURRENT_VERSION=$(docker exec masova-backend cat /app/version.properties 2>/dev/null | grep "version=" | cut -d'=' -f2 || echo "unknown")
else
    CURRENT_VERSION=$(grep "version=" version.properties 2>/dev/null | cut -d'=' -f2 || echo "unknown")
fi

echo "Current version: $CURRENT_VERSION"

# Check for latest version
print_header "Checking for Updates"

if [ -z "$TARGET_VERSION" ]; then
    # Check online for latest version
    if command -v curl &> /dev/null; then
        LATEST_VERSION=$(curl -s "$UPDATE_CHECK_URL" | grep "version=" | cut -d'=' -f2 || echo "")
    else
        print_warning "curl not found, cannot check for updates online"
        read -p "Enter version to update to: " TARGET_VERSION
        LATEST_VERSION=$TARGET_VERSION
    fi

    if [ -z "$LATEST_VERSION" ]; then
        print_error "Could not determine latest version"
        exit 1
    fi
else
    LATEST_VERSION=$TARGET_VERSION
fi

echo "Latest version: $LATEST_VERSION"

# Check if update is needed
if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ] && [ "$FORCE_UPDATE" = false ]; then
    print_success "You are already on the latest version!"
    exit 0
fi

# Show changelog
echo ""
echo "What's new in version $LATEST_VERSION:"
echo "─────────────────────────────────────────────────────────────"
if command -v curl &> /dev/null; then
    curl -s "https://raw.githubusercontent.com/yourusername/masova/main/CHANGELOG.md" | \
        sed -n "/## $LATEST_VERSION/,/## /p" | head -n -1 || \
        echo "  - Bug fixes and improvements"
else
    echo "  - Bug fixes and improvements"
fi
echo "─────────────────────────────────────────────────────────────"
echo ""

# Confirm update
if ! confirm "Do you want to update from $CURRENT_VERSION to $LATEST_VERSION?"; then
    echo "Update cancelled"
    exit 0
fi

# Create backup
if [ "$SKIP_BACKUP" = false ]; then
    print_header "Creating Backup"

    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_TIMESTAMP"
    mkdir -p "$BACKUP_PATH"

    # Backup .env file
    if [ -f ".env" ]; then
        cp .env "$BACKUP_PATH/.env.backup"
        print_success ".env file backed up"
    fi

    # Backup database (if using Docker)
    if [ "$USING_DOCKER" = true ]; then
        echo "Backing up database..."
        docker-compose exec -T mongodb mongodump --out /data/backup/$BACKUP_TIMESTAMP --quiet || true
        print_success "Database backed up to /data/backup/$BACKUP_TIMESTAMP"
    fi

    # Save current version info
    echo "version=$CURRENT_VERSION" > "$BACKUP_PATH/version.txt"
    echo "backupDate=$(date)" >> "$BACKUP_PATH/version.txt"

    print_success "Backup completed: $BACKUP_PATH"
else
    print_warning "Skipping backup (not recommended)"
fi

# Perform update
print_header "Performing Update"

UPDATE_SUCCESS=false

if [ "$USING_DOCKER" = true ]; then
    # Docker update process
    echo "Pulling new Docker images..."

    # Update docker-compose.yml with specific version
    if [ -f "docker-compose.yml" ]; then
        sed -i.bak "s|image: masova/backend:.*|image: masova/backend:$LATEST_VERSION|g" docker-compose.yml
        sed -i.bak "s|image: masova/frontend:.*|image: masova/frontend:$LATEST_VERSION|g" docker-compose.yml
    fi

    # Pull new images
    if docker-compose pull backend frontend; then
        print_success "New images downloaded"

        # Stop services
        echo "Stopping services..."
        docker-compose down

        # Start with new version
        echo "Starting updated services..."
        docker-compose up -d

        # Wait for services to be healthy
        echo "Waiting for services to start..."
        sleep 15

        UPDATE_SUCCESS=true
    else
        print_error "Failed to pull Docker images"
        UPDATE_SUCCESS=false
    fi

else
    # Standalone JAR update process
    echo "Downloading new version..."

    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"

    # Download new JARs
    if curl -L -o masova-$LATEST_VERSION.tar.gz "https://releases.masova.com/v$LATEST_VERSION/masova-$LATEST_VERSION.tar.gz"; then
        print_success "Downloaded new version"

        # Extract
        tar -xzf masova-$LATEST_VERSION.tar.gz

        # Stop current services
        echo "Stopping services..."
        cd "$INSTALL_DIR"
        ./stop-masova.sh 2>/dev/null || true

        # Backup current JARs
        mkdir -p "$BACKUP_PATH/jars"
        cp *.jar "$BACKUP_PATH/jars/" 2>/dev/null || true

        # Replace with new JARs
        cp "$TEMP_DIR"/*.jar "$INSTALL_DIR/"
        cp "$TEMP_DIR"/start-masova.sh "$INSTALL_DIR/"
        chmod +x "$INSTALL_DIR"/start-masova.sh

        # Start services
        echo "Starting updated services..."
        ./start-masova.sh

        UPDATE_SUCCESS=true
    else
        print_error "Failed to download new version"
        UPDATE_SUCCESS=false
    fi

    # Cleanup
    rm -rf "$TEMP_DIR"
fi

# Verify update
print_header "Verifying Update"

sleep 10  # Give services time to start

# Health check
HEALTH_CHECK_URL="http://localhost:8080/actuator/health"
MAX_RETRIES=12
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "$HEALTH_CHECK_URL" | grep -q "UP"; then
        print_success "Health check passed"
        UPDATE_SUCCESS=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting for services to be healthy... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Services failed to start properly"
    UPDATE_SUCCESS=false
fi

# Verify version
if [ "$USING_DOCKER" = true ]; then
    NEW_VERSION=$(docker exec masova-backend cat /app/version.properties 2>/dev/null | grep "version=" | cut -d'=' -f2 || echo "unknown")
else
    NEW_VERSION=$(grep "version=" version.properties 2>/dev/null | cut -d'=' -f2 || echo "unknown")
fi

if [ "$NEW_VERSION" = "$LATEST_VERSION" ]; then
    print_success "Version verified: $NEW_VERSION"
else
    print_warning "Version mismatch: expected $LATEST_VERSION, got $NEW_VERSION"
fi

# Final result
print_header "Update Summary"

if [ "$UPDATE_SUCCESS" = true ]; then
    print_success "Update completed successfully!"
    echo ""
    echo "Updated from: $CURRENT_VERSION → $LATEST_VERSION"
    echo "Update time: $(date)"
    echo ""
    echo "Access MaSoVa at:"
    echo "  🌐 http://localhost:3000"
    echo "  📊 Health: http://localhost:8080/actuator/health"
    echo ""
    echo "Backup location: $BACKUP_PATH"
    echo ""
    print_success "MaSoVa is ready to use! 🚀"
else
    print_error "Update failed!"
    echo ""
    echo "The system may be in an inconsistent state."
    echo ""
    echo "Options:"
    echo "  1. Check logs: docker-compose logs -f (if using Docker)"
    echo "  2. Rollback to previous version: ./rollback-masova.sh $CURRENT_VERSION"
    echo "  3. Restore from backup: $BACKUP_PATH"
    echo ""
    echo "Need help? Contact support@masova.com"

    if confirm "Do you want to rollback now?"; then
        if [ -f "./rollback-masova.sh" ]; then
            ./rollback-masova.sh "$CURRENT_VERSION"
        else
            print_error "Rollback script not found"
            echo "Manual rollback required:"
            if [ "$USING_DOCKER" = true ]; then
                echo "  docker-compose down"
                echo "  # Edit docker-compose.yml to use version $CURRENT_VERSION"
                echo "  docker-compose up -d"
            fi
        fi
    fi

    exit 1
fi

# Cleanup old backups (keep last 10)
echo ""
echo "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +11 | xargs rm -rf 2>/dev/null || true
print_success "Old backups cleaned up"

echo ""
echo "Update log saved to: $INSTALL_DIR/update-$BACKUP_TIMESTAMP.log"
echo ""
print_success "All done! Enjoy the new features! 🎉"
